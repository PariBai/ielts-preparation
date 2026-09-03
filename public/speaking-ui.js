/* Renders the Speaking practice-prompt tab. Depends on speaking.js for the bank
   and on app.js for the shared DOM helpers. */

async function copyText(btn, text, okLabel) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (_) {
    /* Older browsers, or a context without clipboard permission. */
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* nothing else to try */ }
    ta.remove();
  }
  const was = btn.textContent;
  btn.textContent = okLabel || '✓ Copied';
  btn.classList.add('copied');
  setTimeout(() => { btn.textContent = was; btn.classList.remove('copied'); }, 1800);
}

function promptCard(title, subtitle, detail, buildPrompt) {
  const c = el('div', 'card sp-card');
  const head = el('div', 'sp-head');
  const t = el('div');
  const h = el('h3', null, title);
  h.style.margin = '0';
  t.appendChild(h);
  if (subtitle) t.appendChild(el('div', 'sp-sub', subtitle));
  head.appendChild(t);

  const copy = el('button', 'btn', '📋 Copy prompt');
  copy.addEventListener('click', () => copyText(copy, buildPrompt()));
  head.appendChild(copy);
  c.appendChild(head);

  if (detail) c.appendChild(detail);

  const toggle = el('button', 'btn ghost sp-peek', 'Show the prompt');
  const pre = el('pre', 'sp-prompt');
  pre.style.display = 'none';
  toggle.addEventListener('click', () => {
    const open = pre.style.display !== 'none';
    pre.style.display = open ? 'none' : 'block';
    toggle.textContent = open ? 'Show the prompt' : 'Hide the prompt';
    if (!open && !pre.textContent) pre.textContent = buildPrompt();
  });
  c.appendChild(toggle);
  c.appendChild(pre);
  return c;
}

function renderSpeakingPrompts(mod) {
  const frag = document.createDocumentFragment();

  const intro = el('div', 'card');
  const h = el('h2', null, '🎤 Practice prompts for voice chat');
  h.style.marginTop = '0';
  intro.appendChild(h);
  intro.appendChild(el('p', 'lede',
    'Copy a prompt, paste it into ChatGPT voice mode, and speak your answers out loud. Each one turns it into an examiner that runs the part properly, stays silent while you speak, and scores you only at the end.'));

  const warn = el('div', 'sp-warn');
  warn.appendChild(el('b', null, 'Speak it, do not type it.'));
  warn.appendChild(el('span', null,
    'Fluency and Pronunciation are half your Speaking marks and neither survives being typed. Use voice mode, and answer without writing anything down first.'));
  intro.appendChild(warn);
  frag.appendChild(intro);

  frag.appendChild(el('h2', null, 'Full mock test'));
  const mockNote = el('p', 'muted');
  mockNote.style.margin = '0 0 12px';
  mockNote.textContent = 'All three parts back to back with random topics — this is Day 10 of the sprint. Quiet room, no stopping between parts.';
  frag.appendChild(promptCard(
    'Complete 11–14 minute test',
    'Feedback only after all three parts',
    mockNote,
    speakPromptFull));

  const builders = [
    ['part1', speakPromptPart1],
    ['part2', speakPromptPart2],
    ['part3', speakPromptPart3],
  ];

  for (const [partKey, builder] of builders) {
    const part = SPEAKING_BANK[partKey];
    const head = el('div', 'sp-parthead');
    head.appendChild(el('h2', null, part.label));
    head.appendChild(el('p', 'lede', part.blurb));
    frag.appendChild(head);

    part.topics.forEach((topic) => {
      let detail = null;
      if (topic.questions) {
        detail = el('ul', 'itemlist sp-qs');
        topic.questions.slice(0, 3).forEach((q) => detail.appendChild(el('li', null, q)));
        if (topic.questions.length > 3) {
          detail.appendChild(el('li', 'muted', '+ ' + (topic.questions.length - 3) + ' more in the prompt'));
        }
      } else if (topic.card) {
        detail = el('div', 'sp-cue');
        detail.appendChild(el('b', null, topic.card));
        const ul = el('ul', 'itemlist');
        topic.bullets.forEach((b) => ul.appendChild(el('li', null, b)));
        detail.appendChild(ul);
      }
      frag.appendChild(promptCard(
        topic.title,
        partKey === 'part2' ? 'Cue card · 1 min prep, then 1–2 min alone' : null,
        detail,
        () => builder(topic)));
    });
  }

  frag.appendChild(el('h2', null, 'Log what you scored'));
  frag.appendChild(speakingLog(mod));
  return frag;
}

function speakingLog() {
  const wrap = el('div');
  const form = el('form', 'card');
  const grid = el('div', 'log-form');

  const mkField = (label, node, wide) => {
    const f = el('div', 'field' + (wide ? ' wide' : ''));
    f.appendChild(el('label', null, label));
    f.appendChild(node);
    return f;
  };

  const date = el('input');
  date.type = 'date';
  date.name = 'date';
  date.value = todayISO();

  const part = el('select');
  part.name = 'part';
  ['Full test', 'Part 1', 'Part 2', 'Part 3'].forEach((o) => {
    const opt = el('option', null, o);
    part.appendChild(opt);
  });

  const band = el('input');
  band.type = 'number';
  band.name = 'band';
  band.step = '0.5';
  band.min = '0';
  band.max = '9';
  band.placeholder = 'e.g. 6.5';

  const topic = el('input');
  topic.type = 'text';
  topic.name = 'topic';
  topic.placeholder = 'e.g. A piece of technology';

  const notes = el('textarea');
  notes.name = 'notes';
  notes.placeholder = 'e.g. Long pauses in Part 2. Ran dry at 1:20. Said "basically" six times.';

  grid.appendChild(mkField('Date', date));
  grid.appendChild(mkField('Which part', part));
  grid.appendChild(mkField('Band it gave you', band));
  grid.appendChild(mkField('Topic', topic));
  grid.appendChild(mkField('What cost you marks?', notes, true));
  form.appendChild(grid);

  const row = el('div', 'row');
  row.style.marginTop = '12px';
  const submit = el('button', 'btn', 'Log session');
  submit.type = 'submit';
  row.appendChild(submit);
  form.appendChild(row);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());
    const entry = await api('POST', '/session/speaking', payload);
    if (!Array.isArray(STATE.sessions.speaking)) STATE.sessions.speaking = [];
    STATE.sessions.speaking.unshift(entry);
    route();
    toast('Session logged');
  });
  wrap.appendChild(form);

  const list = STATE.sessions.speaking || [];
  const scored = list.filter((s) => s.band != null && s.band !== '');
  if (scored.length) {
    const best = Math.max(...scored.map((s) => Number(s.band)));
    const recent = scored.slice(0, 5);
    const avg = recent.reduce((a, s) => a + Number(s.band), 0) / recent.length;
    const stats = el('div', 'stat-grid');
    stats.appendChild(statCard('Sessions', list.length, ''));
    stats.appendChild(statCard('Best band', best, ''));
    stats.appendChild(statCard('Recent average', avg.toFixed(1), 'last ' + recent.length));
    wrap.appendChild(stats);
  }

  const box = el('div', 'sessions');
  if (!list.length) {
    box.appendChild(el('div', 'empty', 'No speaking sessions logged yet.'));
  }
  list.forEach((s) => {
    const row2 = el('div', 'session');
    row2.appendChild(el('span', 'd', s.date));
    row2.appendChild(el('span', 'p', s.part || '—'));
    if (s.topic) row2.appendChild(el('span', 'band', s.topic));
    if (s.band != null && s.band !== '') row2.appendChild(el('span', 'sc', 'Band ' + s.band));
    const del = el('button', 'danger btn spacer', 'Delete');
    del.addEventListener('click', async () => {
      await api('DELETE', '/session/speaking/' + s.id);
      STATE.sessions.speaking = STATE.sessions.speaking.filter((x) => x.id !== s.id);
      route();
    });
    row2.appendChild(del);
    if (s.notes) row2.appendChild(el('span', 'n', s.notes));
    box.appendChild(row2);
  });
  wrap.appendChild(box);
  return wrap;
}
