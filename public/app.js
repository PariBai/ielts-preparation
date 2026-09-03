/* IELTS Prep Tracker — router, rendering, and server sync. */

let STATE = { settings: {}, tasks: {}, notes: {}, sessions: {} };

const $ = (sel, root = document) => root.querySelector(sel);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ------------------------- server sync ------------------------- */

let pending = 0;
function setSync(kind) {
  const n = $('#sync');
  n.className = 'sync' + (kind === 'saved' ? '' : ' ' + kind);
  n.textContent = kind === 'saving' ? 'saving…' : kind === 'error' ? 'offline' : 'saved';
}

async function api(method, path, body) {
  pending++;
  setSync('saving');
  try {
    const res = await fetch('/api' + path, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (res.status === 401) {
      location.replace('/login.html');
      throw new Error('not authenticated');
    }
    if (!res.ok) throw new Error(await res.text());
    const out = res.status === 204 ? null : await res.json();
    if (--pending === 0) setSync('saved');
    return out;
  } catch (err) {
    pending--;
    setSync('error');
    console.error(method, path, err);
    throw err;
  }
}

/* ------------------------- helpers ------------------------- */

function allDays(mod) {
  if (!mod.plan) return [];
  return mod.plan.weeks.flatMap((w) => w.days);
}

function moduleProgress(mod) {
  const days = allDays(mod);
  if (!days.length) return null;
  const done = days.filter((d) => STATE.tasks[d.id] && STATE.tasks[d.id].done).length;
  return { done, total: days.length, pct: Math.round((done / days.length) * 100) };
}

function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function daysBetween(fromISO, toISO) {
  const a = new Date(fromISO + 'T00:00:00');
  const b = new Date(toISO + 'T00:00:00');
  return Math.round((b - a) / 86400000);
}

function fmtWhen(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) +
    ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function toast(msg) {
  const t = el('div', 'toast', msg);
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

/* ------------------------- notes widget -------------------------
   Notes are stored as plain text so every older note still reads correctly.
   Formatting is a small markdown subset the toolbar writes for you:
   **bold**, _italic_, and lines beginning "- " for bullets. */

const noteTimers = {};

const NOTE_MARKS = {
  bold: { mark: '**', hint: 'Bold (Ctrl+B)' },
  italic: { mark: '_', hint: 'Italic (Ctrl+I)' },
};

function noteText(key) {
  const n = STATE.notes[key];
  return n && n.text ? n.text : '';
}

/* Escape first, then apply the marks, so a note can never inject markup. */
function renderNoteHTML(text) {
  const inline = (s) => esc(s)
    .replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>')
    .replace(/(^|[\s(])_([^_\n]+)_(?=[\s).,;:!?]|$)/g, '$1<i>$2</i>');

  const out = [];
  let bullets = null;
  for (const raw of String(text).split('\n')) {
    const line = raw.trimEnd();
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      if (!bullets) bullets = [];
      bullets.push('<li>' + inline(bullet[1]) + '</li>');
      continue;
    }
    if (bullets) { out.push('<ul>' + bullets.join('') + '</ul>'); bullets = null; }
    if (line.trim() === '') continue;
    out.push('<p>' + inline(line) + '</p>');
  }
  if (bullets) out.push('<ul>' + bullets.join('') + '</ul>');
  return out.join('');
}

/* Wrap or unwrap the selection. Selecting nothing drops the marks in place and
   parks the caret between them, so B-then-type works the way it does anywhere. */
function toggleMark(ta, mark) {
  const a = ta.selectionStart;
  const b = ta.selectionEnd;
  const v = ta.value;
  const len = mark.length;
  const inside = v.slice(a, b);
  let start = a;
  let end = b;
  let next;

  if (inside.startsWith(mark) && inside.endsWith(mark) && inside.length >= len * 2) {
    next = v.slice(0, a) + inside.slice(len, -len) + v.slice(b);
    end = b - len * 2;
  } else if (v.slice(a - len, a) === mark && v.slice(b, b + len) === mark) {
    next = v.slice(0, a - len) + inside + v.slice(b + len);
    start = a - len;
    end = b - len;
  } else {
    next = v.slice(0, a) + mark + inside + mark + v.slice(b);
    start = a + len;
    end = b + len;
  }
  ta.value = next;
  ta.setSelectionRange(start, end);
  ta.focus();
  ta.dispatchEvent(new Event('input'));
}

function toggleBullets(ta) {
  const v = ta.value;
  const from = v.lastIndexOf('\n', ta.selectionStart - 1) + 1;
  let to = v.indexOf('\n', ta.selectionEnd);
  if (to === -1) to = v.length;
  const lines = v.slice(from, to).split('\n');
  const allBullets = lines.every((l) => /^\s*[-*]\s/.test(l) || l.trim() === '');
  const next = lines.map((l) => {
    if (l.trim() === '') return l;
    return allBullets ? l.replace(/^\s*[-*]\s+/, '') : '- ' + l.trim();
  }).join('\n');
  ta.value = v.slice(0, from) + next + v.slice(to);
  ta.setSelectionRange(from, from + next.length);
  ta.focus();
  ta.dispatchEvent(new Event('input'));
}

/* One shared saver, so whichever view is on screen shows the same stamp. */
function saveNote(key, text, onMeta) {
  clearTimeout(noteTimers[key]);
  noteTimers[key] = setTimeout(async () => {
    try {
      const r = await api('PUT', '/note/' + encodeURIComponent(key), { text });
      if (r.entry) STATE.notes[key] = r.entry;
      else delete STATE.notes[key];
      if (onMeta) onMeta(r.entry ? 'saved ' + fmtWhen(r.entry.updatedAt) : '');
      renderNav();
    } catch (_) {
      if (onMeta) onMeta('could not save');
    }
  }, 700);
}

/* The note opens in a box in front of the page. The card behind it only ever
   shows a few clamped lines, so a long note never buries the rest of the card. */
function openNoteModal(key, opts) {
  const o = opts || {};
  const back = el('div', 'modal-back');
  const box = el('div', 'modal note-modal');

  const head = el('div', 'modal-head');
  head.appendChild(el('div', 'modal-title', o.title || 'My notes'));
  const meta = el('span', 'notes-meta');
  const saved = STATE.notes[key];
  meta.textContent = saved && saved.updatedAt ? 'saved ' + fmtWhen(saved.updatedAt) : '';
  head.appendChild(meta);
  const x = el('button', 'modal-x', '✕');
  x.title = 'Close (Esc)';
  head.appendChild(x);
  box.appendChild(head);

  const bar = el('div', 'note-tools');
  const ta = el('textarea', 'note-editor');
  ta.placeholder = o.placeholder || 'What went well, what tripped you up, phrases to reuse…';
  ta.value = noteText(key);
  const preview = el('div', 'note-read');

  const tool = (label, cls, hint, fn) => {
    const b = el('button', 'note-tool' + (cls ? ' ' + cls : ''), label);
    b.type = 'button';
    b.title = hint;
    b.addEventListener('click', fn);
    bar.appendChild(b);
    return b;
  };
  tool('B', 'tb', NOTE_MARKS.bold.hint, () => toggleMark(ta, NOTE_MARKS.bold.mark));
  tool('I', 'ti', NOTE_MARKS.italic.hint, () => toggleMark(ta, NOTE_MARKS.italic.mark));
  tool('• List', '', 'Turn these lines into bullets', () => toggleBullets(ta));
  const seeBtn = tool('Preview', 'right', 'Show the note formatted', () => setMode(!reading));
  box.appendChild(bar);

  const scroll = el('div', 'modal-body');
  scroll.appendChild(ta);
  scroll.appendChild(preview);
  box.appendChild(scroll);

  let reading = false;
  function setMode(read) {
    reading = read;
    ta.style.display = read ? 'none' : '';
    preview.style.display = read ? '' : 'none';
    seeBtn.textContent = read ? 'Edit' : 'Preview';
    Array.from(bar.querySelectorAll('.note-tool')).forEach((b) => {
      if (b !== seeBtn) b.disabled = read;
    });
    if (read) {
      preview.innerHTML = ta.value.trim()
        ? renderNoteHTML(ta.value)
        : '<p class="muted">Nothing written yet.</p>';
    } else {
      ta.focus();
    }
  }
  setMode(false);

  const foot = el('div', 'modal-foot');
  const count = el('span', 'muted');
  foot.appendChild(count);
  const done = el('button', 'btn', 'Done');
  foot.appendChild(done);
  box.appendChild(foot);

  const setCount = () => {
    const n = (ta.value.trim().match(/\b[\w'-]+\b/g) || []).length;
    count.textContent = n + ' word' + (n === 1 ? '' : 's');
  };
  setCount();

  ta.addEventListener('input', () => {
    meta.textContent = 'unsaved…';
    setCount();
    saveNote(key, ta.value, (m) => { meta.textContent = m; });
  });

  ta.addEventListener('keydown', (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    const k = e.key.toLowerCase();
    if (k === 'b') { e.preventDefault(); toggleMark(ta, NOTE_MARKS.bold.mark); }
    if (k === 'i') { e.preventDefault(); toggleMark(ta, NOTE_MARKS.italic.mark); }
  });

  /* Flush the pending debounce rather than losing the last keystrokes. */
  async function close() {
    clearTimeout(noteTimers[key]);
    if (ta.value !== noteText(key)) {
      try {
        const r = await api('PUT', '/note/' + encodeURIComponent(key), { text: ta.value });
        if (r.entry) STATE.notes[key] = r.entry;
        else delete STATE.notes[key];
        renderNav();
      } catch (_) { /* the card behind keeps showing the last good copy */ }
    }
    document.removeEventListener('keydown', onKey);
    back.remove();
    document.body.classList.remove('modal-open');
    if (o.onClose) o.onClose();
  }
  function onKey(e) { if (e.key === 'Escape') close(); }

  x.addEventListener('click', close);
  done.addEventListener('click', close);
  back.addEventListener('click', (e) => { if (e.target === back) close(); });
  document.addEventListener('keydown', onKey);

  back.appendChild(box);
  document.body.appendChild(back);
  document.body.classList.add('modal-open');
  ta.focus();
}

function notesBlock(key, placeholder, title) {
  const wrap = el('div', 'notes');

  function paint() {
    wrap.innerHTML = '';
    const text = noteText(key);
    const saved = STATE.notes[key];

    const label = el('div', 'notes-label');
    label.appendChild(el('span', null, title || 'My notes'));
    const meta = el('span', 'notes-meta');
    meta.textContent = saved && saved.updatedAt ? 'saved ' + fmtWhen(saved.updatedAt) : '';
    label.appendChild(meta);
    wrap.appendChild(label);

    const open = () => openNoteModal(key, { placeholder, title, onClose: paint });

    if (text.trim()) {
      const card = el('div', 'note-card');
      const body = el('div', 'note-read clamp');
      body.innerHTML = renderNoteHTML(text);
      card.appendChild(body);
      const row = el('div', 'note-actions');
      const view = el('button', 'btn small', 'View / edit note');
      view.addEventListener('click', open);
      row.appendChild(view);
      card.appendChild(row);
      card.addEventListener('click', (e) => { if (e.target.tagName !== 'BUTTON') open(); });
      wrap.appendChild(card);
    } else {
      const add = el('button', 'note-empty', '✎  Write a note');
      add.title = placeholder || '';
      add.addEventListener('click', open);
      wrap.appendChild(add);
    }
  }

  paint();
  return wrap;
}

/* ------------------------- syllabus rendering ------------------------- */

function renderSyllabusSections(sections) {
  const frag = document.createDocumentFragment();
  for (const s of sections) {
    const card = el('div', 'card');
    card.appendChild(el('h2', null, s.heading)).style.marginTop = '0';
    if (s.body) card.appendChild(el('p', 'lede', s.body));
    if (s.diagram) card.appendChild(el('div', 'diagram', s.diagram));

    if (s.facts) {
      const dl = el('dl', 'facts');
      for (const [k, v] of s.facts) {
        const row = el('div', 'fact');
        row.appendChild(el('dt', null, k));
        row.appendChild(el('dd', null, v));
        dl.appendChild(row);
      }
      card.appendChild(dl);
    }

    if (s.list) {
      card.appendChild(el('h3', null, s.list.title)).style.marginTop = '16px';
      const ul = el('ul', 'itemlist');
      for (const [k, v] of s.list.items) {
        const li = el('li');
        li.innerHTML = '<b>' + esc(k) + '</b> — ' + esc(v);
        ul.appendChild(li);
      }
      card.appendChild(ul);
    }

    if (s.structure) {
      card.appendChild(el('h3', null, s.structure.title)).style.marginTop = '16px';
      const box = el('div', 'steps');
      for (const [k, v] of s.structure.steps) {
        const st = el('div', 'step');
        st.appendChild(el('b', null, k));
        st.appendChild(el('span', null, v));
        box.appendChild(st);
      }
      card.appendChild(box);
    }

    frag.appendChild(card);
  }
  return frag;
}

function renderResources(mod) {
  const card = el('div', 'card');
  const h = el('h2', null, '🎁 Free resources');
  h.style.marginTop = '0';
  card.appendChild(h);
  for (const r of mod.resources) {
    const row = el('div', 'res');
    row.appendChild(el('div', null, '↗'));
    const body = el('div', 'res-body');
    const a = el('a', null, r.name);
    a.href = r.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    body.appendChild(a);
    body.appendChild(el('p', null, r.note));
    row.appendChild(body);
    card.appendChild(row);
  }
  return card;
}

/* ------------------------- day plan rendering ------------------------- */

/* How today's topic earns or loses marks. Drives both the tag on the card and
   the way the examiner scores it. */
const FOCUS_TAG = {
  deploy:   { chip: '⚡ Use it to score',  title: 'Actively deploy this structure — it earns marks under Grammatical Range. The report checks whether you used it.' },
  accuracy: { chip: '🛡️ Get it right',    title: 'Using this earns nothing extra; getting it wrong costs marks. The report checks whether you made this mistake.' },
  both:     { chip: '🔁 Review day',      title: 'A review or full simulation covering everything, not one structure.' },
};

function dayCard(mod, day) {
  const done = !!(STATE.tasks[day.id] && STATE.tasks[day.id].done);
  const hasNote = !!(STATE.notes[day.id] && STATE.notes[day.id].text.trim());

  const card = el('div', 'day' + (done ? ' done' : ''));
  card.id = 'day-' + day.id;

  const head = el('div', 'day-head');

  const check = el('button', 'check' + (done ? ' on' : ''), '✓');
  check.title = done ? 'Mark as not done' : 'Mark complete';
  check.addEventListener('click', async (e) => {
    e.stopPropagation();
    const next = !(STATE.tasks[day.id] && STATE.tasks[day.id].done);
    check.classList.toggle('on', next);
    card.classList.toggle('done', next);
    try {
      const r = await api('PUT', '/task/' + encodeURIComponent(day.id), { done: next });
      if (r.entry) STATE.tasks[day.id] = r.entry;
      else delete STATE.tasks[day.id];
      renderNav();
      const meter = $('#planMeter');
      if (meter) updatePlanMeter(mod);
    } catch (_) {
      check.classList.toggle('on', !next);
      card.classList.toggle('done', !next);
    }
  });

  head.appendChild(check);
  head.appendChild(el('span', 'day-n', 'Day ' + day.n));
  head.appendChild(el('span', 'day-title', day.title));

  const flags = el('div', 'day-flags');
  const tag = FOCUS_TAG[day.focus];
  if (tag) {
    const chip = el('span', 'focus-chip focus-' + day.focus, tag.chip);
    chip.title = tag.title;
    flags.appendChild(chip);
  }
  if (hasNote) flags.appendChild(el('span', null, '📝'));
  head.appendChild(flags);
  head.appendChild(el('span', 'chev', '▶'));

  head.addEventListener('click', () => card.classList.toggle('open'));
  card.appendChild(head);

  const body = el('div', 'day-body');
  const dl = el('dl', 'facts');
  dl.style.marginTop = '12px';
  for (const [k, v] of day.rows) {
    const row = el('div', 'fact');
    row.appendChild(el('dt', null, k));
    row.appendChild(el('dd', null, v));
    dl.appendChild(row);
  }
  body.appendChild(dl);

  const drill = el('div', 'drill');
  drill.appendChild(el('b', null, 'Daily drill'));
  drill.appendChild(el('span', null, day.drill));
  body.appendChild(drill);

  /* Learn button — opens the AI tutor flow for this topic. */
  const learnRow = el('div', 'row');
  learnRow.style.marginTop = '14px';
  const openLearn = async (startAt) => {
    const st = await tutorStatus();
    if (!st.configured) {
      alert('The AI tutor is not configured yet. Add GEMINI_API_KEY or OPENAI_API_KEY to the .env file, then run: docker compose up -d');
      return;
    }
    openTutor(mod, day, startAt);
  };

  const learn = el('button', 'btn learn-btn', '🎓 Learn this with AI');
  learn.addEventListener('click', () => openLearn());
  learnRow.appendChild(learn);

  /* Straight into the archive of what you already wrote on this topic. */
  const past = (STATE.tutor && STATE.tutor[day.id]) || [];
  const essays = past.filter((x) => x.kind === 'essay');
  if (essays.length) {
    const hist = el('button', 'btn ghost', '📁 Past writing (' + essays.length + ')');
    hist.title = 'Everything you have written on this topic, with the corrections';
    hist.addEventListener('click', () => openLearn('history'));
    learnRow.appendChild(hist);
    learnRow.appendChild(el('span', 'muted', 'Best band so far: ' +
      Math.max(...essays.map((e) => Number(e.band) || 0))));
  }
  body.appendChild(learnRow);

  body.appendChild(notesBlock(day.id, 'Paste your draft, log your word count, note the mistakes you caught…'));
  card.appendChild(body);
  return card;
}

function updatePlanMeter(mod) {
  const p = moduleProgress(mod);
  if (!p) return;
  const meter = $('#planMeter');
  if (meter) meter.querySelector('i').style.width = p.pct + '%';
  const label = $('#planMeterLabel');
  if (label) label.textContent = `${p.done} of ${p.total} days complete · ${p.pct}%`;
}

function renderPlan(mod) {
  const frag = document.createDocumentFragment();
  const p = moduleProgress(mod);

  const head = el('div', 'card');
  const h = el('h2', null, mod.plan.title);
  h.style.marginTop = '0';
  head.appendChild(h);
  head.appendChild(el('p', 'lede', mod.plan.blurb));
  const meter = el('div', 'bar');
  meter.id = 'planMeter';
  meter.appendChild(el('i')).style.width = p.pct + '%';
  meter.style.marginTop = '14px';
  head.appendChild(meter);
  const lab = el('div', 'stat-sub', `${p.done} of ${p.total} days complete · ${p.pct}%`);
  lab.id = 'planMeterLabel';
  lab.style.marginTop = '6px';
  head.appendChild(lab);

  const actions = el('div', 'row');
  actions.style.marginTop = '12px';
  const expand = el('button', 'btn ghost', 'Expand all');
  expand.addEventListener('click', () => {
    const cards = document.querySelectorAll('.day');
    const anyClosed = [...cards].some((c) => !c.classList.contains('open'));
    cards.forEach((c) => c.classList.toggle('open', anyClosed));
    expand.textContent = anyClosed ? 'Collapse all' : 'Expand all';
  });
  actions.appendChild(expand);
  const jump = el('button', 'btn ghost', 'Jump to next unfinished');
  jump.addEventListener('click', () => {
    const next = allDays(mod).find((d) => !(STATE.tasks[d.id] && STATE.tasks[d.id].done));
    if (!next) return toast('Every day is ticked off 🎉');
    const node = document.getElementById('day-' + next.id);
    node.classList.add('open');
    node.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  actions.appendChild(jump);
  head.appendChild(actions);
  frag.appendChild(head);

  for (const week of mod.plan.weeks) {
    const sec = el('section', 'week');
    const wh = el('div', 'week-head');
    wh.appendChild(el('h2', null, week.title));
    if (week.blurb) wh.appendChild(el('p', null, week.blurb));
    sec.appendChild(wh);
    for (const day of week.days) sec.appendChild(dayCard(mod, day));
    frag.appendChild(sec);
  }
  return frag;
}

/* ------------------------- practice log ------------------------- */

function renderLog(mod) {
  const cfg = mod.log;
  const frag = document.createDocumentFragment();

  const head = el('div', 'card');
  const h = el('h2', null, cfg.title);
  h.style.marginTop = '0';
  head.appendChild(h);
  head.appendChild(el('p', 'lede', cfg.blurb));
  frag.appendChild(head);

  const form = el('form', 'card');
  const grid = el('div', 'log-form');
  grid.innerHTML = `
    <div class="field"><label>Date</label><input type="date" name="date" value="${todayISO()}"></div>
    <div class="field"><label>What you did</label><select name="part">${cfg.partOptions
      .map((o) => `<option>${esc(o)}</option>`)
      .join('')}</select></div>
    <div class="field"><label>Correct</label><input type="number" name="correct" min="0" max="40" placeholder="e.g. 31"></div>
    <div class="field"><label>Out of</label><input type="number" name="max" min="1" max="40" value="40"></div>
    <div class="field"><label>Minutes</label><input type="number" name="minutes" min="1" placeholder="e.g. 55"></div>
    <div class="field wide"><label>What cost you marks?</label><textarea name="notes" placeholder="e.g. True/False/Not Given — lost 4. Kept guessing NOT GIVEN when the text merely contradicted."></textarea></div>
  `;
  form.appendChild(grid);
  const submitRow = el('div', 'row');
  submitRow.style.marginTop = '12px';
  const submit = el('button', 'btn', 'Log session');
  submit.type = 'submit';
  submitRow.appendChild(submit);
  form.appendChild(submitRow);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    const entry = await api('POST', '/session/' + mod.id, payload);
    if (!Array.isArray(STATE.sessions[mod.id])) STATE.sessions[mod.id] = [];
    STATE.sessions[mod.id].unshift(entry);
    form.reset();
    form.querySelector('[name=date]').value = todayISO();
    form.querySelector('[name=max]').value = 40;
    route();
    toast('Session logged');
  });
  frag.appendChild(form);

  const list = STATE.sessions[mod.id] || [];
  if (list.length) {
    const scored = list.filter((s) => s.correct != null && s.max === 40);
    if (scored.length) {
      const best = Math.max(...scored.map((s) => s.correct));
      const last5 = scored.slice(0, 5);
      const avg = last5.reduce((a, s) => a + s.correct, 0) / last5.length;
      const stats = el('div', 'stat-grid');
      stats.appendChild(statCard('Sessions logged', list.length, ''));
      stats.appendChild(statCard('Best score', best + '/40', 'Band ~' + estimateBand(best, 40)));
      stats.appendChild(
        statCard('Recent average', avg.toFixed(1) + '/40', 'last ' + last5.length + ' full tests')
      );
      frag.appendChild(stats);
    }
  }

  const box = el('div', 'sessions');
  if (!list.length) {
    box.appendChild(el('div', 'empty', 'No sessions yet. Log your first mock test above.'));
  }
  for (const s of list) {
    const row = el('div', 'session');
    row.appendChild(el('span', 'd', s.date));
    row.appendChild(el('span', 'p', s.part || '—'));
    if (s.correct != null) {
      row.appendChild(el('span', 'sc', `${s.correct}/${s.max}`));
      const b = estimateBand(s.correct, s.max);
      if (b) row.appendChild(el('span', 'band', 'Band ~' + b.toFixed(1)));
    }
    if (s.minutes) row.appendChild(el('span', 'band', s.minutes + ' min'));
    const del = el('button', 'danger btn spacer', 'Delete');
    del.addEventListener('click', async () => {
      await api('DELETE', `/session/${mod.id}/${s.id}`);
      STATE.sessions[mod.id] = STATE.sessions[mod.id].filter((x) => x.id !== s.id);
      route();
    });
    row.appendChild(del);
    if (s.notes) row.appendChild(el('span', 'n', s.notes));
    box.appendChild(row);
  }
  frag.appendChild(box);

  const notesCard = el('div', 'card');
  const nh = el('h2', null, 'Strategy notes for ' + mod.name);
  nh.style.marginTop = '0';
  notesCard.appendChild(nh);
  notesCard.appendChild(
    notesBlock(mod.id + ':strategy', 'Techniques that work for you: skimming order, keyword underlining, how you handle NOT GIVEN…')
  );
  frag.appendChild(notesCard);

  return frag;
}

function statCard(k, v, sub) {
  const c = el('div', 'stat');
  c.appendChild(el('div', 'stat-k', k));
  c.appendChild(el('div', 'stat-v', String(v)));
  if (sub) c.appendChild(el('div', 'stat-sub', sub));
  return c;
}


/* ------------------------- band 9 vault ------------------------- */

function exemplarCard(ex, kind) {
  const card = el('section', 'ex');
  card.id = ex.id;

  const head = el('div', 'ex-head');
  head.appendChild(el('span', 'ex-n', (kind === 'task1' ? 'Task 1 · ' : 'Task 2 · ') + ex.n));
  head.appendChild(el('h3', 'ex-title', ex.title));
  head.appendChild(el('span', 'ex-tag', ex.tag));
  card.appendChild(head);

  const prompt = el('div', 'ex-prompt');
  prompt.appendChild(el('b', null, 'Prompt'));
  prompt.appendChild(el('span', null, ex.prompt));
  card.appendChild(prompt);

  /* Blueprint: the rule and the frame, before the worked example. */
  const bp = typeof BLUEPRINTS !== 'undefined' ? BLUEPRINTS[ex.id] : null;
  if (bp) {
    const box = el('div', 'ex-bp');
    box.appendChild(el('div', 'ex-bp-title', '📐 The blueprint'));
    box.appendChild(el('p', 'ex-bp-rule', bp.rule));

    if (bp.vocab) {
      box.appendChild(el('div', 'ex-answer-label', 'Specialised vocabulary'));
      const chips = el('div', 'vocab-chips');
      for (const w of bp.vocab) chips.appendChild(el('span', 'vocab-chip', w));
      box.appendChild(chips);
    }
    if (bp.frame) {
      const f = el('div', 'ex-frame');
      f.appendChild(el('b', null, 'Sentence frame'));
      f.appendChild(el('span', null, bp.frame));
      box.appendChild(f);
    }
    if (bp.thesis) {
      const f = el('div', 'ex-frame');
      f.appendChild(el('b', null, 'Thesis frame'));
      f.appendChild(el('span', null, bp.thesis));
      box.appendChild(f);
    }
    if (bp.plan) {
      box.appendChild(el('div', 'ex-answer-label', 'Body paragraph plan'));
      const ul = el('ul', 'itemlist');
      for (const step of bp.plan) ul.appendChild(el('li', null, step));
      box.appendChild(ul);
    }
    card.appendChild(box);
  }

  /* The chart is trusted markup we generate ourselves, never user input. */
  if (ex.chart) {
    const holder = el('div');
    holder.innerHTML = ex.chart();
    card.appendChild(holder);
  }

  const ans = el('div', 'ex-answer');
  ans.appendChild(el('div', 'ex-answer-label', 'Band 9 model answer'));
  ex.answer.forEach((para, i) => {
    const p = el('p', i === 1 ? 'is-overview' : null, para);
    ans.appendChild(p);
  });
  const wc = el('div', 'ex-words', ex.words + ' words');
  ans.appendChild(wc);
  card.appendChild(ans);

  const sec = el('div', 'ex-secret');
  sec.appendChild(el('b', null, '🔑 Why this scores'));
  sec.appendChild(el('span', null, ex.secret));
  card.appendChild(sec);

  const kw = el('div', 'ex-kw');
  kw.appendChild(el('div', 'ex-answer-label', 'Phrase bank — steal these'));
  const dl = el('dl', 'facts');
  for (const [k, v] of ex.keywords) {
    const row = el('div', 'fact');
    row.appendChild(el('dt', null, k));
    row.appendChild(el('dd', null, v));
    dl.appendChild(row);
  }
  kw.appendChild(dl);
  card.appendChild(kw);

  card.appendChild(notesBlock('vault:' + ex.id, 'Phrases from this model you want to reuse, or your own attempt at the same prompt…'));
  return card;
}

function renderVault(mod) {
  const frag = document.createDocumentFragment();

  const head = el('div', 'card');
  const h = el('h2', null, VAULT.title);
  h.style.marginTop = '0';
  head.appendChild(h);
  head.appendChild(el('p', 'lede', VAULT.blurb));
  frag.appendChild(head);

  /* Jump index — 11 exemplars is too many to scroll blindly. */
  const nav = el('div', 'card vault-index');
  for (const [label, list, kind] of [['Task 1 — chart reports', VAULT.task1, 'task1'], ['Task 2 — essays', VAULT.task2, 'task2']]) {
    nav.appendChild(el('div', 'ex-answer-label', label));
    const row = el('div', 'vault-chips');
    for (const ex of list) {
      const a = el('a', 'vault-chip', ex.title);
      a.href = '#/' + mod.id + '/vault';
      a.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById(ex.id).scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      row.appendChild(a);
    }
    nav.appendChild(row);
  }
  frag.appendChild(nav);

  frag.appendChild(el('h2', null, 'Section 1 — Task 1 reports, all six formats'));
  for (const ex of VAULT.task1) frag.appendChild(exemplarCard(ex, 'task1'));

  frag.appendChild(el('h2', null, 'Section 2 — Task 2 essays, all five types'));
  for (const ex of VAULT.task2) frag.appendChild(exemplarCard(ex, 'task2'));

  return frag;
}

/* ------------------------- pages ------------------------- */

function pageDashboard(main) {
  const wrap = el('div', 'wrap');
  const head = el('div', 'page-head');
  head.appendChild(el('div', 'eyebrow', 'Overview'));
  head.appendChild(el('h1', null, 'Your IELTS preparation'));
  head.appendChild(
    el('p', 'lede',
      'Pick a module from the menu. Each one has a Syllabus tab for the reference material, and a day plan or practice log where you tick off what you have done.')
  );
  wrap.appendChild(head);

  const planned = MODULE_ORDER.map((id) => MODULES[id]).filter((m) => m.plan);
  const totalDays = planned.reduce((a, m) => a + allDays(m).length, 0);
  const doneDays = planned.reduce(
    (a, m) => a + allDays(m).filter((d) => STATE.tasks[d.id] && STATE.tasks[d.id].done).length, 0);
  const sessionCount = ['listening', 'reading'].reduce(
    (a, id) => a + ((STATE.sessions[id] || []).length), 0);
  const noteTotal = Object.values(STATE.notes).filter((n) => n && n.text && n.text.trim()).length;

  const stats = el('div', 'stat-grid');
  stats.appendChild(
    statCard('Plan days done', `${doneDays}/${totalDays}`,
      totalDays ? Math.round((doneDays / totalDays) * 100) + '% of Writing + Speaking' : ''));
  stats.appendChild(statCard('Practice sessions', sessionCount, 'Listening + Reading logs'));
  stats.appendChild(statCard('Notes written', noteTotal, 'across all modules'));

  const exam = STATE.settings.examDate;
  if (exam) {
    const left = daysBetween(todayISO(), exam);
    stats.appendChild(
      statCard('Days to exam', left >= 0 ? left : 'passed',
        new Date(exam + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })));
  } else {
    const c = el('a', 'stat');
    c.href = '#/settings';
    c.style.textDecoration = 'none';
    c.style.color = 'inherit';
    c.appendChild(el('div', 'stat-k', 'Target date'));
    c.appendChild(el('div', 'stat-v', '—'));
    c.appendChild(el('div', 'stat-sub', 'Set one in Settings →'));
    stats.appendChild(c);
  }
  wrap.appendChild(stats);

  wrap.appendChild(el('h2', null, 'Modules'));
  const grid = el('div', 'mod-grid');
  for (const id of MODULE_ORDER) {
    const mod = MODULES[id];
    const card = el('a', 'mod-card');
    card.href = '#/' + id;
    card.style.setProperty('--mod-accent', mod.accent);
    const ch = el('div', 'mod-card-head');
    ch.appendChild(el('span', 'i', mod.icon));
    ch.appendChild(el('b', null, mod.name));
    ch.appendChild(el('span', 't', mod.time));
    card.appendChild(ch);
    card.appendChild(el('p', null, mod.blurb));

    const p = moduleProgress(mod);
    if (p) {
      const bar = el('div', 'bar');
      bar.appendChild(el('i')).style.width = p.pct + '%';
      card.appendChild(bar);
      const foot = el('div', 'foot');
      foot.appendChild(el('span', null, `${p.done}/${p.total} days`));
      foot.appendChild(el('span', null, p.pct + '%'));
      card.appendChild(foot);
    } else {
      const n = (STATE.sessions[id] || []).length;
      const foot = el('div', 'foot');
      foot.appendChild(el('span', null, n ? `${n} session${n === 1 ? '' : 's'} logged` : 'No sessions yet'));
      foot.appendChild(el('span', null, 'practice log'));
      card.appendChild(foot);
    }
    grid.appendChild(card);
  }
  wrap.appendChild(grid);

  const nextUp = [];
  for (const m of planned) {
    const d = allDays(m).find((x) => !(STATE.tasks[x.id] && STATE.tasks[x.id].done));
    if (d) nextUp.push({ mod: m, day: d });
  }
  if (nextUp.length) {
    wrap.appendChild(el('h2', null, 'Next up'));
    for (const { mod, day } of nextUp) {
      const card = el('a', 'card');
      card.href = `#/${mod.id}/plan`;
      card.style.display = 'block';
      card.style.textDecoration = 'none';
      card.style.color = 'inherit';
      card.style.setProperty('--mod-accent', mod.accent);
      const r = el('div', 'row');
      r.appendChild(el('span', 'day-n', mod.icon + ' Day ' + day.n));
      r.appendChild(el('b', null, day.title));
      card.appendChild(r);
      const p = el('p', 'muted', day.drill);
      p.style.margin = '8px 0 0';
      card.appendChild(p);
      wrap.appendChild(card);
    }
  }

  main.appendChild(wrap);
}

function pageModule(main, mod, tab) {
  const wrap = el('div', 'wrap');
  wrap.style.setProperty('--mod-accent', mod.accent);

  const head = el('div', 'page-head');
  head.appendChild(el('div', 'eyebrow', mod.icon + '  ' + mod.time));
  head.appendChild(el('h1', null, mod.name + ' Module'));
  head.appendChild(el('p', 'lede', mod.blurb));
  wrap.appendChild(head);

  /* Each tab carries a long and a short label; CSS picks one by width so the
     bar never wraps to two lines on a phone. */
  const planLong = (mod.plan ? '🗓️ ' : '📈 ') + (mod.plan ? mod.plan.title : mod.log.title);
  const planShort = mod.plan ? '🗓️ Day plan' : '📈 Log';
  const tabs = el('div', 'tabs');
  const tabDefs = [
    ['syllabus', '📋 Syllabus', '📋 Syllabus'],
    ['plan', planLong, planShort],
  ];
  if (mod.vault) tabDefs.push(['vault', '🏆 Band 9 Vault', '🏆 Vault']);
  if (mod.prompts) tabDefs.push(['prompts', '🎤 Practice Prompts', '🎤 Prompts']);
  tabDefs.push(['resources', '🎁 Resources', '🎁 Free stuff']);
  for (const [key, long, short] of tabDefs) {
    const a = el('a', 'tab' + (tab === key ? ' active' : ''));
    a.href = `#/${mod.id}/${key}`;
    a.appendChild(el('span', 'tab-long', long));
    a.appendChild(el('span', 'tab-short', short));
    tabs.appendChild(a);
  }
  wrap.appendChild(tabs);

  if (tab === 'syllabus') {
    wrap.appendChild(renderSyllabusSections(mod.syllabus));
    const nc = el('div', 'card');
    const h = el('h2', null, 'My notes on this syllabus');
    h.style.marginTop = '0';
    nc.appendChild(h);
    nc.appendChild(notesBlock(mod.id + ':syllabus', 'Rules you keep forgetting, templates you want to memorise…'));
    wrap.appendChild(nc);
  } else if (tab === 'vault') {
    wrap.appendChild(renderVault(mod));
  } else if (tab === 'prompts') {
    wrap.appendChild(renderSpeakingPrompts(mod));
  } else if (tab === 'resources') {
    wrap.appendChild(renderResources(mod));
  } else {
    wrap.appendChild(mod.plan ? renderPlan(mod) : renderLog(mod));
  }

  main.appendChild(wrap);
}

function pageSettings(main) {
  const wrap = el('div', 'wrap');
  const head = el('div', 'page-head');
  head.appendChild(el('div', 'eyebrow', 'Configuration'));
  head.appendChild(el('h1', null, 'Settings & backup'));
  head.appendChild(el('p', 'lede', 'Dates drive the countdown and the pace hint. Everything is stored server-side in data/state.json.'));
  wrap.appendChild(head);

  const card = el('div', 'card');
  card.appendChild(el('h3', null, 'Dates'));
  const grid = el('div', 'log-form');
  grid.innerHTML = `
    <div class="field"><label>Preparation start</label><input type="date" id="startDate" value="${STATE.settings.startDate || ''}"></div>
    <div class="field"><label>Target / exam date</label><input type="date" id="examDate" value="${STATE.settings.examDate || ''}"></div>
  `;
  card.appendChild(grid);
  const save = el('button', 'btn', 'Save dates');
  save.style.marginTop = '12px';
  save.addEventListener('click', async () => {
    STATE.settings = await api('PUT', '/settings', {
      startDate: $('#startDate').value || null,
      examDate: $('#examDate').value || null,
    });
    renderCountdown();
    toast('Dates saved');
  });
  card.appendChild(save);
  wrap.appendChild(card);

  const pace = el('div', 'card');
  pace.appendChild(el('h3', null, 'Pace'));
  const s = STATE.settings;
  if (s.startDate && s.examDate) {
    const total = daysBetween(s.startDate, s.examDate);
    const elapsed = daysBetween(s.startDate, todayISO());
    const planned = MODULE_ORDER.map((id) => MODULES[id]).filter((m) => m.plan);
    const totalDays = planned.reduce((a, m) => a + allDays(m).length, 0);
    const doneDays = planned.reduce(
      (a, m) => a + allDays(m).filter((d) => STATE.tasks[d.id] && STATE.tasks[d.id].done).length, 0);
    const remainingCal = Math.max(0, total - elapsed);
    const remainingWork = totalDays - doneDays;
    const perDay = remainingCal > 0 ? (remainingWork / remainingCal).toFixed(2) : '—';
    pace.appendChild(
      el('p', 'muted',
        `${elapsed} of ${total} calendar days elapsed. ${remainingWork} plan days left across ${remainingCal} remaining days — about ${perDay} plan days per day to finish on time.`)
    );
  } else {
    pace.appendChild(el('p', 'muted', 'Set both dates above to see your required pace.'));
  }
  wrap.appendChild(pace);

  const backup = el('div', 'card');
  backup.appendChild(el('h3', null, 'Backup'));
  backup.appendChild(el('p', 'muted', 'Download a JSON copy of every tick, note, and session before you redeploy the container, or restore one here.'));
  const row = el('div', 'row');
  row.style.marginTop = '10px';
  const dl = el('a', 'btn', 'Download backup');
  dl.href = '/api/export';
  dl.style.textDecoration = 'none';
  row.appendChild(dl);

  const imp = el('button', 'btn ghost', 'Restore from file');
  const file = el('input');
  file.type = 'file';
  file.accept = 'application/json';
  file.style.display = 'none';
  imp.addEventListener('click', () => file.click());
  file.addEventListener('change', async () => {
    const f = file.files[0];
    if (!f) return;
    if (!confirm('This replaces all current progress with the file contents. Continue?')) return;
    try {
      const parsed = JSON.parse(await f.text());
      await api('POST', '/import', parsed);
      await loadState();
      route();
      toast('Progress restored');
    } catch (err) {
      alert('Could not restore: ' + err.message);
    }
  });
  row.appendChild(imp);
  row.appendChild(file);
  backup.appendChild(row);
  wrap.appendChild(backup);

  const reset = el('div', 'card');
  reset.appendChild(el('h3', null, 'Reset progress'));
  reset.appendChild(el('p', 'muted', 'Unticks every day and deletes every note and session. There is no undo — download a backup first.'));
  const rb = el('button', 'btn ghost', 'Reset everything');
  rb.style.marginTop = '10px';
  rb.style.color = '#e06c75';
  rb.addEventListener('click', async () => {
    if (!confirm('Delete all ticks, notes, and sessions?')) return;
    if (!confirm('Really sure? This cannot be undone.')) return;
    await api('POST', '/import', { version: 1, settings: STATE.settings, tasks: {}, notes: {}, sessions: {} });
    await loadState();
    route();
    toast('Progress reset');
  });
  reset.appendChild(rb);
  wrap.appendChild(reset);

  main.appendChild(wrap);
}

/* ------------------------- nav + countdown ------------------------- */

function renderNav() {
  const nav = $('#moduleNav');
  const hash = location.hash.slice(1) || '/';
  nav.innerHTML = '';
  nav.appendChild(el('div', 'nav-label', 'Modules'));

  for (const id of MODULE_ORDER) {
    const mod = MODULES[id];
    const active = hash.startsWith('/' + id);
    const a = el('a', 'nav-item' + (active ? ' active' : ''));
    a.href = '#/' + id;
    a.appendChild(el('span', 'nav-icon', mod.icon));
    a.appendChild(el('span', null, mod.name));
    const p = moduleProgress(mod);
    if (p) a.appendChild(el('span', 'nav-pill', `${p.done}/${p.total}`));
    else {
      const n = (STATE.sessions[id] || []).length;
      if (n) a.appendChild(el('span', 'nav-pill', String(n)));
    }
    nav.appendChild(a);

    if (active) {
      const tab = hash.split('/')[2] || 'syllabus';
      const subs = [['syllabus', 'Syllabus'], ['plan', mod.plan ? 'Day plan' : 'Practice log']];
      if (mod.vault) subs.push(['vault', 'Band 9 Vault']);
      if (mod.prompts) subs.push(['prompts', 'Practice prompts']);
      subs.push(['resources', 'Resources']);
      for (const [key, label] of subs) {
        const sub = el('a', 'nav-sub' + (tab === key ? ' active' : ''), label);
        sub.href = `#/${id}/${key}`;
        nav.appendChild(sub);
      }
    }
  }

  for (const item of document.querySelectorAll('.nav-item[data-route]')) {
    item.classList.toggle('active', ('#' + item.dataset.route) === ('#' + hash));
  }
}

function renderCountdown() {
  const n = $('#countdown');
  const exam = STATE.settings.examDate;
  if (!exam) { n.innerHTML = ''; return; }
  const left = daysBetween(todayISO(), exam);
  n.innerHTML = left > 0
    ? `<strong>${left}</strong> day${left === 1 ? '' : 's'} to target`
    : left === 0 ? '<strong>Target day</strong>' : 'target date passed';
}

/* ------------------------- router ------------------------- */

function route() {
  const main = $('#main');
  main.innerHTML = '';
  const parts = (location.hash.slice(1) || '/').split('/').filter(Boolean);

  if (!parts.length) pageDashboard(main);
  else if (parts[0] === 'settings') pageSettings(main);
  else if (MODULES[parts[0]]) {
    const tab = ['syllabus', 'plan', 'vault', 'prompts', 'resources'].includes(parts[1]) ? parts[1] : 'syllabus';
    pageModule(main, MODULES[parts[0]], tab);
  } else pageDashboard(main);

  renderNav();
  document.body.classList.remove('nav-open');
  window.scrollTo(0, 0);
}

async function loadState() {
  const s = await api('GET', '/state');
  STATE = Object.assign({ settings: {}, tasks: {}, notes: {}, sessions: {}, tutor: {} }, s);
  for (const k of ['settings', 'tasks', 'notes', 'sessions', 'tutor']) {
    if (!STATE[k]) STATE[k] = {};
  }
}

window.addEventListener('hashchange', route);
$('#menuBtn').addEventListener('click', () => document.body.classList.toggle('nav-open'));
$('#scrim').addEventListener('click', () => document.body.classList.remove('nav-open'));

async function setupAuthUi() {
  try {
    const me = await api('GET', '/me');
    if (!me.authEnabled) return;
    if (me.user) {
      const who = el('span', 'whoami', me.user);
      who.title = 'Signed in as ' + me.user + ' — progress is private to this account';
      $('.topbar-right').appendChild(who);
    }
    const btn = el('button', 'signout', 'Sign out');
    btn.title = 'Sign out of this device';
    btn.addEventListener('click', async () => {
      await api('POST', '/logout');
      location.replace('/login.html');
    });
    $('.topbar-right').appendChild(btn);
  } catch (_) {
    /* /api/me never 401s; ignore anything else and leave the bar as it is. */
  }
}

(async function boot() {
  try {
    await loadState();
  } catch (_) {
    $('#main').innerHTML = '<div class="wrap"><div class="empty">Could not reach the server. Is the container running?</div></div>';
    return;
  }
  renderCountdown();
  route();
  setupAuthUi();
})();
