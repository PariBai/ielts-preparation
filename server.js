'use strict';

const express = require('express');
const fsp = require('fs/promises');
const path = require('path');
const auth = require('./auth');

const PORT = Number(process.env.PORT || 3000);
const TUTOR_URL = (process.env.TUTOR_URL || 'http://tutor:8000').replace(/\/$/, '');
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'state.json');
const LESSONS_FILE = path.join(DATA_DIR, 'lessons.json');

const EMPTY_STATE = {
  version: 1,
  settings: { startDate: null, examDate: null },
  tasks: {},    // "w1" -> { done: true, completedAt: ISO }
  notes: {},    // "w1" | "writing:syllabus" -> { text, updatedAt }
  sessions: {}, // "listening" -> [ { id, date, part, correct, max, minutes, notes } ]
  tutor: {},    // "w5" -> [ { kind, band, ... } ] saved lessons, quizzes, marked essays
};

let lessons = {};
let lessonQueue = Promise.resolve();

/* One state file per user, so accounts never see each other's progress.
   Lessons stay shared: they are generic teaching material, and sharing them
   means a topic is only ever paid for once. */
const stores = new Map();   // user -> { state, queue }
const USERS_DIR = path.join(DATA_DIR, 'users');

function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

function userFile(user) {
  return path.join(USERS_DIR, `${user}.json`);
}

async function loadUser(user) {
  if (stores.has(user)) return stores.get(user);
  let st;
  try {
    const parsed = JSON.parse(await fsp.readFile(userFile(user), 'utf8'));
    st = Object.assign(clone(EMPTY_STATE), parsed);
    for (const key of ['settings', 'tasks', 'notes', 'sessions', 'tutor']) {
      if (!st[key] || typeof st[key] !== 'object') st[key] = clone(EMPTY_STATE[key]);
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      const backup = `${userFile(user)}.corrupt-${Date.now()}`;
      try {
        await fsp.copyFile(userFile(user), backup);
        console.error(`[data] unreadable state for ${user}, backed up to ${backup}`);
      } catch (_) {
        console.error(`[data] unreadable state for ${user}:`, err.message);
      }
    }
    st = clone(EMPTY_STATE);
  }
  const entry = { state: st, queue: Promise.resolve() };
  stores.set(user, entry);
  return entry;
}

/* Serialised atomic writes: temp file + rename, so a crash mid-write can never
   leave a half-written file. */
function persist(user) {
  const entry = stores.get(user);
  if (!entry) return Promise.resolve();
  entry.queue = entry.queue.then(async () => {
    await fsp.mkdir(USERS_DIR, { recursive: true });
    const tmp = `${userFile(user)}.tmp`;
    await fsp.writeFile(tmp, JSON.stringify(entry.state, null, 2), 'utf8');
    await fsp.rename(tmp, userFile(user));
  }).catch((err) => console.error(`[data] write failed for ${user}:`, err.message));
  return entry.queue;
}

async function load() {
  await fsp.mkdir(USERS_DIR, { recursive: true });

  /* Migrate the old single-user file to whoever the first configured account is. */
  try {
    await fsp.access(DATA_FILE);
    const owner = (auth.listUsers()[0] || 'default').toLowerCase();
    const target = userFile(owner);
    try {
      await fsp.access(target);
      console.log('[data] legacy state.json present but user file already exists — left alone');
    } catch (_) {
      await fsp.copyFile(DATA_FILE, target);
      await fsp.rename(DATA_FILE, `${DATA_FILE}.migrated`);
      console.log(`[data] migrated legacy state.json -> users/${owner}.json`);
    }
  } catch (_) {
    /* No legacy file; nothing to migrate. */
  }

  try {
    lessons = JSON.parse(await fsp.readFile(LESSONS_FILE, 'utf8'));
    console.log(`[data] ${Object.keys(lessons).length} cached lessons (shared)`);
  } catch (_) {
    lessons = {};
  }
}

function persistLessons() {
  lessonQueue = lessonQueue.then(async () => {
    const tmp = `${LESSONS_FILE}.tmp`;
    await fsp.writeFile(tmp, JSON.stringify(lessons, null, 2), 'utf8');
    await fsp.rename(tmp, LESSONS_FILE);
  }).catch((err) => console.error('[data] lesson write failed:', err.message));
  return lessonQueue;
}

const app = express();
/* The tunnel terminates TLS, so trust its forwarded headers for req.ip / req.secure. */
app.set('trust proxy', true);
app.use(express.json({ limit: '1mb' }));

/* Unauthenticated so the container healthcheck keeps working. */
app.get('/healthz', (req, res) => res.json({ ok: true }));

app.post('/api/login', (req, res) => {
  const limit = auth.throttle(req);
  if (limit.blocked) {
    return res.status(429).json({ error: `Too many attempts. Try again in ${limit.retryIn}s.` });
  }
  const { username, password } = req.body || {};
  const who = auth.checkCredentials(username, password);
  if (!who) {
    auth.recordFailure(req);
    return res.status(401).json({ error: 'Wrong username or password.' });
  }
  auth.clearFailures(req);
  auth.setSession(req, res, who);
  res.json({ ok: true, user: who });
});

app.post('/api/logout', (req, res) => {
  auth.clearSession(req, res);
  res.json({ ok: true });
});

app.get('/api/me', (req, res) => {
  const user = auth.currentUser(req);
  res.json({
    authEnabled: auth.isEnabled(),
    loggedIn: user !== null,
    user: user ? auth.displayName(user) : null,
  });
});

/* Everything below this line requires a session. */
app.use(auth.gate);

app.get('/api/state', async (req, res) => {
  const { state } = await loadUser(req.user);
  res.json(state);
});

app.put('/api/task/:key', async (req, res) => {
  const { state } = await loadUser(req.user);
  const key = req.params.key;
  const done = req.body && req.body.done === true;
  if (done) {
    state.tasks[key] = { done: true, completedAt: new Date().toISOString() };
  } else {
    delete state.tasks[key];
  }
  await persist(req.user);
  res.json({ key, entry: state.tasks[key] || null });
});

app.put('/api/note/:key', async (req, res) => {
  const { state } = await loadUser(req.user);
  const key = req.params.key;
  const text = typeof (req.body && req.body.text) === 'string' ? req.body.text : '';
  if (text.trim() === '') {
    delete state.notes[key];
  } else {
    state.notes[key] = { text, updatedAt: new Date().toISOString() };
  }
  await persist(req.user);
  res.json({ key, entry: state.notes[key] || null });
});

app.put('/api/settings', async (req, res) => {
  const { state } = await loadUser(req.user);
  const body = req.body || {};
  for (const field of ['startDate', 'examDate']) {
    if (field in body) {
      const v = body[field];
      state.settings[field] = typeof v === 'string' && v ? v : null;
    }
  }
  await persist(req.user);
  res.json(state.settings);
});

app.post('/api/session/:module', async (req, res) => {
  const { state } = await loadUser(req.user);
  const mod = req.params.module;
  if (!['listening', 'reading', 'speaking'].includes(mod)) {
    return res.status(400).json({ error: 'unknown module' });
  }
  const b = req.body || {};
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: typeof b.date === 'string' && b.date ? b.date : new Date().toISOString().slice(0, 10),
    part: String(b.part || '').slice(0, 60),
    correct: b.correct === '' || b.correct == null ? null : Number(b.correct),
    max: b.max == null ? 40 : Number(b.max),
    minutes: b.minutes === '' || b.minutes == null ? null : Number(b.minutes),
    band: b.band === '' || b.band == null ? null : Number(b.band),
    topic: String(b.topic || '').slice(0, 200),
    notes: String(b.notes || '').slice(0, 5000),
  };
  if (!Array.isArray(state.sessions[mod])) state.sessions[mod] = [];
  state.sessions[mod].unshift(entry);
  await persist(req.user);
  res.json(entry);
});

app.delete('/api/session/:module/:id', async (req, res) => {
  const { state } = await loadUser(req.user);
  const mod = req.params.module;
  const list = state.sessions[mod];
  if (!Array.isArray(list)) return res.status(404).json({ error: 'no sessions' });
  const before = list.length;
  state.sessions[mod] = list.filter((s) => s.id !== req.params.id);
  if (state.sessions[mod].length === before) return res.status(404).json({ error: 'not found' });
  await persist(req.user);
  res.json({ ok: true });
});

/* ---- Lesson cache ---------------------------------------------------
   A lesson costs tokens to generate but does not change between readings, so
   it is stored and served back for free. Quizzes and writing tasks are NOT
   cached on purpose — repeating the same questions would defeat the practice. */

app.get('/api/lessons/:key', (req, res) => {
  const hit = lessons[req.params.key];
  if (!hit) return res.status(404).json({ error: 'not cached' });
  res.json(hit);
});

app.put('/api/lessons/:key', async (req, res) => {
  const body = req.body || {};
  if (!body.lesson) return res.status(400).json({ error: 'lesson missing' });
  lessons[req.params.key] = {
    lesson: body.lesson,
    topic: body.topic || '',
    model: body.model || '',
    generatedAt: new Date().toISOString(),
  };
  await persistLessons();
  res.json({ ok: true });
});

app.delete('/api/lessons/:key', async (req, res) => {
  delete lessons[req.params.key];
  await persistLessons();
  res.json({ ok: true });
});

/* ---- AI tutor proxy -------------------------------------------------
   Requests reach the Python service only through here, which means only a
   logged-in session can ever spend tokens. */

app.get('/api/tutor/status', async (req, res) => {
  try {
    const r = await fetch(TUTOR_URL + '/healthz', { signal: AbortSignal.timeout(5000) });
    return res.json(await r.json());
  } catch (err) {
    return res.json({ ok: false, configured: false, error: 'tutor service unreachable' });
  }
});

app.get('/api/tutor/models', async (req, res) => {
  try {
    const r = await fetch(TUTOR_URL + '/models', { signal: AbortSignal.timeout(30000) });
    res.status(r.status).type('application/json').send(await r.text());
  } catch (err) {
    res.status(504).json({ error: 'tutor service unreachable: ' + err.message });
  }
});

for (const route of ['teach', 'quiz', 'quiz/mark', 'ask', 'task', 'evaluate']) {
  app.post('/api/tutor/' + route, async (req, res) => {
    try {
      const r = await fetch(TUTOR_URL + '/' + route, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body || {}),
        signal: AbortSignal.timeout(180000),
      });
      const text = await r.text();
      res.status(r.status).type('application/json').send(text);
    } catch (err) {
      res.status(504).json({ error: 'The tutor service did not respond: ' + err.message });
    }
  });
}

/* Lesson results, quiz scores and marked essays, keyed by day id. */
app.post('/api/tutor/save/:key', async (req, res) => {
  const { state } = await loadUser(req.user);
  const key = req.params.key;
  if (!state.tutor) state.tutor = {};
  if (!Array.isArray(state.tutor[key])) state.tutor[key] = [];
  const entry = Object.assign({}, req.body || {}, {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    savedAt: new Date().toISOString(),
  });
  state.tutor[key].unshift(entry);
  await persist(req.user);
  res.json(entry);
});

app.delete('/api/tutor/save/:key/:id', async (req, res) => {
  const { state } = await loadUser(req.user);
  const list = state.tutor && state.tutor[req.params.key];
  if (!Array.isArray(list)) return res.status(404).json({ error: 'not found' });
  state.tutor[req.params.key] = list.filter((x) => x.id !== req.params.id);
  await persist(req.user);
  res.json({ ok: true });
});

/* Full export — handy for backing the tracker up before a redeploy. */
app.get('/api/export', async (req, res) => {
  const { state } = await loadUser(req.user);
  res.setHeader('Content-Disposition', `attachment; filename="ielts-progress-${req.user}.json"`);
  res.json(state);
});

app.post('/api/import', async (req, res) => {
  const b = req.body;
  if (!b || typeof b !== 'object' || !b.tasks || !b.notes) {
    return res.status(400).json({ error: 'not a valid export file' });
  }
  const entry = await loadUser(req.user);
  entry.state = Object.assign(clone(EMPTY_STATE), b);
  await persist(req.user);
  res.json({ ok: true });
});

app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'not found' });
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

fsp.mkdir(DATA_DIR, { recursive: true })
  .then(() => auth.init(DATA_DIR))
  .then(() => load())
  .then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`IELTS tracker listening on http://0.0.0.0:${PORT}`);
    console.log(`Data file: ${DATA_FILE}`);
  });
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, async () => {
    await Promise.all([...stores.values()].map((e) => e.queue));
    await lessonQueue;
    process.exit(0);
  });
}
