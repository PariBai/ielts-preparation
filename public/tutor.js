/* The Learn flow: lesson → quiz → timed writing → examiner report.
   Opens as a full-screen overlay over whatever page you were on. */

let TUTOR_STATUS = null;

async function tutorStatus() {
  if (TUTOR_STATUS) return TUTOR_STATUS;
  try {
    TUTOR_STATUS = await api('GET', '/tutor/status');
  } catch (_) {
    TUTOR_STATUS = { ok: false, configured: false };
  }
  return TUTOR_STATUS;
}

/* Build the context every prompt receives. The model should never guess. */
function tutorContext(mod, day) {
  const rows = day.rows || [];
  const find = (needle) => {
    const hit = rows.find(([k]) => k.toLowerCase().includes(needle));
    return hit ? hit[1] : '';
  };
  return {
    topic: day.title,
    day_number: day.n,
    module: mod.name,
    concept: find('concept') || find('syllabus') || find('goal'),
    task_type: find('task') || find('type') || find('structure') || find('exam') || find('practice'),
    drill: day.drill || '',
    topic_focus: day.focus || 'both',
    exam_date: STATE.settings.examDate || null,
  };
}

/* ------------------------- overlay shell ------------------------- */

function openTutor(mod, day, startAt) {
  const ctx = tutorContext(mod, day);
  const key = day.id;

  const overlay = el('div', 'tut');
  overlay.style.setProperty('--mod-accent', mod.accent);

  const bar = el('div', 'tut-bar');
  const back = el('button', 'tut-close', '✕');
  back.title = 'Close';
  bar.appendChild(back);
  const titles = el('div', 'tut-titles');
  titles.appendChild(el('div', 'tut-eyebrow', mod.icon + '  Day ' + day.n + ' · ' + mod.name));
  titles.appendChild(el('div', 'tut-title', day.title));
  bar.appendChild(titles);
  const steps = el('div', 'tut-steps');
  bar.appendChild(steps);
  overlay.appendChild(bar);

  const body = el('div', 'tut-body');
  overlay.appendChild(body);

  document.body.appendChild(overlay);
  document.body.classList.add('tut-open');

  const state = { stage: 0, lesson: null, lessonCachedAt: null, quiz: null, answers: {}, chat: [], task: null, essay: '', started: null, report: null, timeLeft: null, running: false };

  function closeTutor() {
    if (state.stage === 2 && state.essay.trim() && !state.report) {
      if (!confirm('You have unsaved writing. Close anyway?')) return;
    }
    overlay.remove();
    document.body.classList.remove('tut-open');
    if (tickInterval) clearInterval(tickInterval);
  }
  back.addEventListener('click', closeTutor);

  let tickInterval = null;

  const STAGES = ['Lesson', 'Quiz', 'Write', 'Report', 'Past work'];

  /* Any stage you have already reached stays reachable — you can go back to the
     lesson mid-essay without losing the essay or stopping the clock. */
  function canEnter(i) {
    if (i === 3) return !!state.report;
    return true;
  }

  function goStage(i) {
    if (!canEnter(i)) return;
    if (i === 0) return stageLesson();
    if (i === 1) return stageQuiz();
    if (i === 2) return stageWrite();
    if (i === 3 && state.report) {
      state.stage = 3;
      renderSteps();
      return paintReport();
    }
    if (i === 4) return stageHistory();
  }

  function renderSteps() {
    steps.innerHTML = '';
    STAGES.forEach((s, i) => {
      const usable = canEnter(i);
      const n = el('button', 'tut-step' + (i === state.stage ? ' on' : '') + (i < state.stage ? ' done' : '') + (usable ? ' go' : ''), s);
      n.disabled = !usable;
      n.title = usable ? 'Go to ' + s : s + ' is not available yet';
      if (usable) n.addEventListener('click', () => goStage(i));
      steps.appendChild(n);
    });
  }

  function busy(msg) {
    body.innerHTML = '';
    const b = el('div', 'tut-busy');
    b.appendChild(el('div', 'spinner'));
    b.appendChild(el('p', null, msg));
    b.appendChild(el('p', 'muted', 'This can take up to a minute.'));
    body.appendChild(b);
  }

  function fail(err, retry) {
    body.innerHTML = '';
    const box = el('div', 'tut-fail');
    box.appendChild(el('h3', null, 'That did not work'));
    box.appendChild(el('p', 'muted', String(err && err.message ? err.message : err)));
    const again = el('button', 'btn', 'Try again');
    again.addEventListener('click', retry);
    box.appendChild(again);
    body.appendChild(box);
  }

  /* ------------------------- stage 1: lesson ------------------------- */

  async function stageLesson(force) {
    state.stage = 0;
    renderSteps();
    if (state.lesson && !force) return paintLesson();

    /* Served from the cache when we have one — a lesson does not change between
       readings, so there is no reason to pay for it twice. */
    if (!force) {
      busy('Loading your lesson on ' + day.title + '…');
      try {
        const cached = await api('GET', '/lessons/' + encodeURIComponent(key));
        if (cached && cached.lesson) {
          state.lesson = cached.lesson;
          state.lessonCachedAt = cached.generatedAt;
          return paintLesson();
        }
      } catch (_) {
        /* 404 simply means nothing cached yet. */
      }
    }

    busy((force ? 'Rewriting' : 'Preparing') + ' your lesson on ' + day.title + '…');
    try {
      state.lesson = await api('POST', '/tutor/teach', ctx);
      state.lessonCachedAt = new Date().toISOString();
      state.chat = [];
      api('PUT', '/lessons/' + encodeURIComponent(key), {
        lesson: state.lesson,
        topic: day.title,
        model: (TUTOR_STATUS && TUTOR_STATUS.model) || '',
      }).catch(() => {});
      paintLesson();
    } catch (err) {
      fail(err, () => stageLesson(force));
    }
  }

  function paintLesson() {
    const L = state.lesson;
    body.innerHTML = '';
    const w = el('div', 'tut-wrap');

    w.appendChild(el('h1', null, L.title || day.title));
    if (L.summary) w.appendChild(el('p', 'lede', L.summary));

    (L.sections || []).forEach((sec) => {
      const c = el('div', 'card');
      const h = el('h3', null, sec.heading);
      h.style.marginTop = '0';
      c.appendChild(h);
      String(sec.body || '').split(/\n{2,}/).forEach((para) => {
        c.appendChild(el('p', 'tut-p', para));
      });
      w.appendChild(c);
    });

    (L.tables || []).forEach((t) => {
      const c = el('div', 'card');
      const h = el('h3', null, t.caption);
      h.style.marginTop = '0';
      c.appendChild(h);
      const scroll = el('div', 'chart-scroll');
      const tbl = el('table', 'cv-table');
      const thead = el('thead');
      const hr = el('tr');
      (t.headers || []).forEach((x) => hr.appendChild(el('th', null, x)));
      thead.appendChild(hr);
      tbl.appendChild(thead);
      const tb = el('tbody');
      (t.rows || []).forEach((row) => {
        const tr = el('tr');
        row.forEach((cell, i) => tr.appendChild(el(i === 0 ? 'th' : 'td', null, cell)));
        tb.appendChild(tr);
      });
      tbl.appendChild(tb);
      scroll.appendChild(tbl);
      c.appendChild(scroll);
      w.appendChild(c);
    });

    if ((L.examples || []).length) {
      const c = el('div', 'card');
      const h = el('h3', null, 'Examples');
      h.style.marginTop = '0';
      c.appendChild(h);
      L.examples.forEach((ex) => {
        const row = el('div', 'tut-ex');
        if (ex.wrong) {
          const bad = el('div', 'tut-bad');
          bad.appendChild(el('span', 'tut-mark', '✗'));
          bad.appendChild(el('span', null, ex.wrong));
          row.appendChild(bad);
        }
        const good = el('div', 'tut-good');
        good.appendChild(el('span', 'tut-mark', '✓'));
        good.appendChild(el('span', null, ex.right));
        row.appendChild(good);
        if (ex.note) row.appendChild(el('div', 'tut-note', ex.note));
        c.appendChild(row);
      });
      w.appendChild(c);
    }

    if (L.ielts_use) {
      const c = el('div', 'card tut-hl');
      const h = el('h3', null, '🎯 How this is used in the exam');
      h.style.marginTop = '0';
      c.appendChild(h);
      c.appendChild(el('p', 'tut-p', L.ielts_use));
      w.appendChild(c);
    }

    if ((L.common_mistakes || []).length) {
      const c = el('div', 'card');
      const h = el('h3', null, '⚠️ The three mistakes to avoid');
      h.style.marginTop = '0';
      c.appendChild(h);
      const ul = el('ul', 'itemlist');
      L.common_mistakes.forEach((m) => ul.appendChild(el('li', null, m)));
      c.appendChild(ul);
      w.appendChild(c);
    }

    w.appendChild(askPanel());

    const nav = el('div', 'tut-nav');
    const go = el('button', 'btn', 'I have read this → Quiz me');
    go.addEventListener('click', stageQuiz);
    nav.appendChild(go);

    /* The quiz is practice, not a gate — some days you only want to write. */
    const straight = el('button', 'btn ghost', 'Skip the quiz → Write now');
    straight.title = 'Go straight to the timed writing task';
    straight.addEventListener('click', stageWrite);
    nav.appendChild(straight);

    const regen = el('button', 'btn ghost', 'Rewrite this lesson');
    regen.title = 'Generate a fresh lesson (costs tokens)';
    regen.addEventListener('click', () => {
      if (confirm('Generate a brand new lesson? This replaces the saved one and uses your API quota.')) {
        stageLesson(true);
      }
    });
    nav.appendChild(regen);

    if (state.lessonCachedAt) {
      nav.appendChild(el('span', 'muted', 'Saved lesson from ' + fmtWhen(state.lessonCachedAt) + ' — free to reopen'));
    }
    w.appendChild(nav);

    body.appendChild(w);
    body.scrollTop = 0;
  }

  /* Compact digest of the lesson, sent with every follow-up so the tutor knows
     exactly what it already taught without replaying the whole JSON. */
  function lessonDigest() {
    const L = state.lesson || {};
    const bits = [L.title || day.title, L.summary || ''];
    (L.sections || []).forEach((s) => bits.push(s.heading + ': ' + String(s.body || '').slice(0, 700)));
    (L.examples || []).slice(0, 6).forEach((e) => bits.push('Example: ' + e.right));
    if (L.ielts_use) bits.push('IELTS use: ' + L.ielts_use);
    return bits.filter(Boolean).join('\n\n');
  }

  function askPanel() {
    const c = el('div', 'card tut-ask');
    const h = el('h3', null, '💬 Ask about this lesson');
    h.style.marginTop = '0';
    c.appendChild(h);
    c.appendChild(el('p', 'muted', 'Anything unclear? The tutor remembers the lesson above and everything you ask here.'));

    const thread = el('div', 'tut-thread');
    c.appendChild(thread);

    /* Replay any earlier exchanges if they come back to this stage. */
    state.chat.forEach((t) => thread.appendChild(bubble(t.role, t.text)));

    const form = el('form', 'tut-askform');
    const input = el('textarea', 'tut-askinput');
    input.placeholder = 'e.g. Why can I not make "He died" passive?';
    input.rows = 2;
    const send = el('button', 'btn');
    send.type = 'submit';
    send.textContent = 'Ask';

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const q = input.value.trim();
      if (!q) return;
      input.value = '';
      thread.appendChild(bubble('user', q));
      const pending = bubble('tutor', 'Thinking…');
      pending.classList.add('pending');
      thread.appendChild(pending);
      thread.scrollTop = thread.scrollHeight;
      send.disabled = true;

      try {
        const res = await api('POST', '/tutor/ask', Object.assign({}, ctx, {
          lesson_digest: lessonDigest(),
          history: state.chat.slice(-12),
          question: q,
        }));
        pending.remove();
        const answer = res.answer || '(no answer)';
        thread.appendChild(bubble('tutor', answer));
        state.chat.push({ role: 'user', text: q });
        state.chat.push({ role: 'tutor', text: answer });
      } catch (err) {
        pending.remove();
        const b = bubble('tutor', 'That failed: ' + (err.message || err));
        b.classList.add('err');
        thread.appendChild(b);
      }
      send.disabled = false;
      thread.scrollTop = thread.scrollHeight;
      input.focus();
    });

    /* Enter sends, Shift+Enter makes a new line. */
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        form.requestSubmit();
      }
    });

    form.appendChild(input);
    form.appendChild(send);
    c.appendChild(form);
    return c;
  }

  function bubble(role, text) {
    const b = el('div', 'tut-bubble ' + (role === 'user' ? 'me' : 'them'));
    String(text).split(/\n{2,}/).forEach((para) => b.appendChild(el('p', null, para)));
    return b;
  }

  /* ------------------------- stage 2: quiz ------------------------- */

  async function stageQuiz() {
    state.stage = 1;
    renderSteps();
    if (state.quiz) return paintQuiz();
    busy('Writing a quiz on ' + day.title + '…');
    try {
      state.quiz = await api('POST', '/tutor/quiz', ctx);
      paintQuiz();
    } catch (err) {
      fail(err, stageQuiz);
    }
  }

  const QTYPE_LABEL = {
    mcq: 'Multiple choice',
    fill: 'Fill the gap',
    transform: 'Rewrite',
    correct: 'Find and fix the error',
  };

  /* Gap fills and MCQs can be judged here; rewrites and corrections have too
     much legitimate variation, so those go back to the model. */
  const norm = (s) => String(s || '').toLowerCase().replace(/[.,;:!?"']/g, '').replace(/\s+/g, ' ').trim();

  function paintQuiz() {
    const qs = state.quiz.questions || [];
    body.innerHTML = '';
    const w = el('div', 'tut-wrap');
    w.appendChild(el('h1', null, 'Quick check'));
    w.appendChild(el('p', 'lede', 'Answer all ' + qs.length + '. Mixed formats — some are multiple choice, some you type yourself.'));

    qs.forEach((q, qi) => {
      const type = q.type || (q.options && q.options.length ? 'mcq' : 'transform');
      q.type = type;

      const c = el('div', 'card');
      c.appendChild(el('span', 'tut-cat', QTYPE_LABEL[type] || type));
      const h = el('h3', null, qi + 1 + '. ' + q.q);
      h.style.marginTop = '0';
      c.appendChild(h);

      if (type === 'mcq') {
        const opts = el('div', 'tut-opts');
        (q.options || []).forEach((opt, oi) => {
          const lab = el('label', 'tut-opt');
          const radio = el('input');
          radio.type = 'radio';
          radio.name = 'q' + qi;
          radio.addEventListener('change', () => {
            state.answers[qi] = oi;
            refreshSubmit();
          });
          lab.appendChild(radio);
          lab.appendChild(el('span', null, opt));
          opts.appendChild(lab);
        });
        c.appendChild(opts);
      } else {
        const input = el(type === 'fill' ? 'input' : 'textarea', 'tut-answer');
        input.placeholder = type === 'fill' ? 'The missing word or phrase only' : 'Write your full sentence here';
        if (type !== 'fill') input.rows = 2;
        input.addEventListener('input', () => {
          state.answers[qi] = input.value;
          refreshSubmit();
        });
        c.appendChild(input);
      }

      const fb = el('div', 'tut-fb');
      fb.id = 'fb' + qi;
      c.appendChild(fb);
      w.appendChild(c);
    });

    const nav = el('div', 'tut-nav');
    const submit = el('button', 'btn', 'Submit answers');
    submit.disabled = true;
    const skip = el('button', 'btn ghost', 'Skip to writing');
    skip.addEventListener('click', stageWrite);

    function refreshSubmit() {
      const done = qs.filter((q, qi) => {
        const a = state.answers[qi];
        return q.type === 'mcq' ? a != null : String(a || '').trim().length > 0;
      }).length;
      submit.disabled = done < qs.length;
      submit.textContent = done < qs.length ? `Submit answers (${done}/${qs.length})` : 'Submit answers';
    }

    function showResult(qi, ok, correctText, note) {
      const fb = document.getElementById('fb' + qi);
      fb.className = 'tut-fb on ' + (ok ? 'ok' : 'no');
      fb.innerHTML = '';
      fb.appendChild(el('b', null, ok ? '✓ Correct' : '✗ Not quite' + (correctText ? ' — expected: ' + correctText : '')));
      if (note) fb.appendChild(el('span', null, note));
    }

    submit.addEventListener('click', async () => {
      submit.disabled = true;
      submit.textContent = 'Marking…';

      let right = 0;
      const needModel = [];

      qs.forEach((q, qi) => {
        const a = state.answers[qi];
        if (q.type === 'mcq') {
          const ok = a === q.answer_index;
          if (ok) right++;
          showResult(qi, ok, ok ? '' : (q.options || [])[q.answer_index] || '', q.why);
        } else if (q.type === 'fill') {
          const accepted = [q.answer_text].concat(q.accept || []).filter(Boolean).map(norm);
          const ok = accepted.includes(norm(a));
          if (ok) right++;
          showResult(qi, ok, ok ? '' : q.answer_text || '', q.why);
        } else {
          needModel.push({ qi, q: q.q, reference: q.answer_text || '', student: String(a || '') });
        }
      });

      if (needModel.length) {
        try {
          const res = await api('POST', '/tutor/quiz/mark', Object.assign({}, ctx, {
            items: needModel.map((m) => ({ q: m.q, reference: m.reference, student: m.student })),
          }));
          (res.results || []).forEach((r, i) => {
            const m = needModel[i];
            if (!m) return;
            if (r.correct) right++;
            showResult(m.qi, !!r.correct, r.correct ? '' : m.reference, r.feedback || qs[m.qi].why);
          });
        } catch (err) {
          needModel.forEach((m) => showResult(m.qi, false, m.reference, 'Could not be marked automatically — compare yours with the model answer.'));
        }
      }

      const score = el('div', 'tut-score', right + ' / ' + qs.length + ' correct');
      nav.insertBefore(score, submit);
      submit.remove();
      api('POST', '/tutor/save/' + key, { kind: 'quiz', topic: day.title, score: right, total: qs.length }).catch(() => {});
      const next = el('button', 'btn', 'Now write →');
      next.addEventListener('click', stageWrite);
      nav.appendChild(next);
      skip.remove();
    });

    nav.appendChild(submit);
    nav.appendChild(skip);
    w.appendChild(nav);
    body.appendChild(w);
    body.scrollTop = 0;
    refreshSubmit();
  }

  /* ------------------------- stage 3: timed writing ------------------------- */

  async function stageWrite() {
    state.stage = 2;
    renderSteps();
    if (state.task) return paintWrite();
    busy('Setting your writing task…');
    try {
      state.task = await api('POST', '/tutor/task', ctx);
      paintWrite();
    } catch (err) {
      fail(err, stageWrite);
    }
  }

  function paintWrite() {
    const T = state.task;
    body.innerHTML = '';
    const w = el('div', 'tut-wrap');

    w.appendChild(el('h1', null, T.task_type || 'Your writing task'));

    const pc = el('div', 'card');
    pc.appendChild(el('p', 'tut-prompt', T.prompt));
    if (T.data) {
      const pre = el('pre', 'tut-data');
      pre.textContent = T.data;
      pc.appendChild(pre);
    }
    w.appendChild(pc);

    if ((T.checklist || []).length) {
      const c = el('div', 'card tut-hl');
      const h = el('h3', null, 'Before you submit, make sure you have:');
      h.style.marginTop = '0';
      c.appendChild(h);
      const ul = el('ul', 'itemlist');
      T.checklist.forEach((x) => ul.appendChild(el('li', null, x)));
      c.appendChild(ul);
      w.appendChild(c);
    }

    const minutes = Number(T.minutes) || 20;
    const minWords = Number(T.min_words) || 150;

    const timerBar = el('div', 'tut-timer');
    const clock = el('div', 'tut-clock', String(minutes).padStart(2, '0') + ':00');
    const wc = el('div', 'tut-wc', '0 / ' + (Number(T.min_words) || 150) + ' words');
    const startBtn = el('button', 'btn', 'Start the clock');
    timerBar.appendChild(clock);
    timerBar.appendChild(wc);
    timerBar.appendChild(startBtn);
    w.appendChild(timerBar);

    const ta = el('textarea', 'tut-essay');
    ta.placeholder = 'Write here. The clock is advisory — submit whenever you are ready, early or late.';
    ta.value = state.essay;
    ta.disabled = true;
    w.appendChild(ta);

    const countWords = (s) => (s.trim().match(/\b[\w'-]+\b/g) || []).length;

    ta.addEventListener('input', () => {
      state.essay = ta.value;
      const n = countWords(ta.value);
      wc.textContent = n + ' / ' + minWords + ' words';
      wc.className = 'tut-wc' + (n >= minWords ? ' ok' : '');
      mark.disabled = n < 20;
    });

    if (state.timeLeft == null) state.timeLeft = minutes * 60;

    /* The tick writes to whatever clock is currently on screen, so navigating to
       the lesson and back neither stops nor resets it. */
    function paintClock() {
      const c = document.querySelector('.tut-clock');
      if (!c) return;
      const left = state.timeLeft;
      const m = Math.floor(Math.abs(left) / 60);
      const s = Math.abs(left) % 60;
      c.textContent = (left < 0 ? '+' : '') + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
      c.className = 'tut-clock' + (left <= 60 && left > 0 ? ' warn' : '') + (left <= 0 ? ' over' : '');
    }
    paintClock();

    function startTimer() {
      if (tickInterval) return;
      state.running = true;
      if (!state.started) state.started = Date.now();
      tickInterval = setInterval(() => {
        state.timeLeft--;
        paintClock();
      }, 1000);
    }

    if (state.running) {
      /* Already running from an earlier visit to this stage. */
      ta.disabled = false;
      startBtn.remove();
      startTimer();
    }

    startBtn.addEventListener('click', () => {
      ta.disabled = false;
      ta.focus();
      startBtn.remove();
      startTimer();
    });

    const nav = el('div', 'tut-nav');
    const mark = el('button', 'btn', 'Submit for marking');
    mark.disabled = true;
    mark.addEventListener('click', () => {
      if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }
      const taken = state.started ? Math.round((Date.now() - state.started) / 60000) : null;
      stageReport(taken, minWords);
    });
    nav.appendChild(mark);

    const past = savedAttempts();
    if (past.length) {
      const hist = el('button', 'btn ghost', '📁 My past attempts (' + past.length + ')');
      hist.title = 'Reread what you wrote before, with the corrections';
      hist.addEventListener('click', stageHistory);
      nav.appendChild(hist);
    }
    w.appendChild(nav);

    body.appendChild(w);
    body.scrollTop = 0;
    /* Restore the running count if they came back to this stage. */
    ta.dispatchEvent(new Event('input'));
  }

  /* ------------------------- stage 4: examiner report ------------------------- */

  async function stageReport(minutesTaken, minWords) {
    state.stage = 3;
    renderSteps();
    busy('Marking your writing against the four band criteria…');
    try {
      state.report = await api('POST', '/tutor/evaluate', Object.assign({}, ctx, {
        task_prompt: state.task.prompt + (state.task.data ? '\n\n' + state.task.data : ''),
        essay: state.essay,
        minutes_taken: minutesTaken,
        min_words: minWords,
      }));
      paintReport();
      /* The full marking is kept, not only the number: the task you were set,
         every mistake found, and the corrected version of your own text. Months
         later the Past work tab can show you the whole thing again. */
      const R = state.report;
      api('POST', '/tutor/save/' + key, {
        kind: 'essay',
        topic: day.title,
        band: R.overall,
        bandWithoutTopic: R.band_without_topic,
        focus: day.focus || 'both',
        words: R.word_count,
        minutes: minutesTaken,
        task: state.task.task_type,
        taskPrompt: state.task.prompt || '',
        taskData: state.task.data || '',
        essay: state.essay,
        improved: R.improved_essay || '',
        improvedNotes: R.improved_essay_notes || [],
        mistakes: R.mistakes || [],
        criteria: R.criteria || [],
        strengths: R.strengths || [],
        nextStep: R.next_step || '',
        topicVerdict: R.topic_verdict || '',
        topicImpact: R.topic_impact || '',
        topicUsed: !!R.topic_used,
        topicCount: R.topic_count == null ? null : R.topic_count,
      }).then((entry) => {
        /* Fold it into the local copy so Past work is current without a reload. */
        if (!STATE.tutor) STATE.tutor = {};
        if (!Array.isArray(STATE.tutor[key])) STATE.tutor[key] = [];
        STATE.tutor[key].unshift(entry);
        renderSteps();
      }).catch(() => {});
    } catch (err) {
      fail(err, () => stageReport(minutesTaken, minWords));
    }
  }

  function paintReport() {
    const R = state.report;
    body.innerHTML = '';
    const w = el('div', 'tut-wrap');

    const hero = el('div', 'tut-band');
    hero.appendChild(el('div', 'tut-band-n', String(R.overall)));
    const meta = el('div');
    meta.appendChild(el('div', 'tut-band-label', 'Estimated overall band'));
    meta.appendChild(el('div', 'stat-sub', R.word_count + ' words'));
    hero.appendChild(meta);
    w.appendChild(hero);

    (R.criteria || []).forEach((c) => {
      const card = el('div', 'card');
      const row = el('div', 'tut-crit');
      row.appendChild(el('b', null, c.name));
      row.appendChild(el('span', 'tut-crit-band', String(c.band)));
      card.appendChild(row);
      const bar = el('div', 'bar');
      bar.appendChild(el('i')).style.width = Math.min(100, (Number(c.band) / 9) * 100) + '%';
      card.appendChild(bar);
      card.appendChild(el('p', 'tut-p', c.comment));
      w.appendChild(card);
    });

    /* Two bands: the real one, and the one with today's topic factored out.
       Which direction the gap points depends on the kind of topic. */
    const focus = day.focus || 'both';
    const real = Number(R.overall);
    const without = R.band_without_topic == null ? real : Number(R.band_without_topic);
    const gap = Math.round((real - without) * 10) / 10;

    if (!Number.isNaN(without)) {
      const cmp = el('div', 'card tut-compare');
      const h = el('h3', null,
        focus === 'deploy' ? 'What using ' + day.title + ' earned you'
          : focus === 'accuracy' ? 'What your ' + day.title + ' errors are costing you'
          : 'What clean grammar would be worth');
      h.style.marginTop = '0';
      cmp.appendChild(h);

      const pair = el('div', 'tut-pair');

      const a = el('div', 'tut-pair-box');
      a.appendChild(el('div', 'tut-pair-label', 'Your actual band'));
      a.appendChild(el('div', 'tut-pair-n', String(real)));
      pair.appendChild(a);

      const arrow = el('div', 'tut-pair-gap');
      if (gap > 0) arrow.textContent = '+' + gap;
      else if (gap < 0) arrow.textContent = String(gap);
      else arrow.textContent = 'no change';
      arrow.classList.add(gap > 0 ? 'up' : gap < 0 ? 'down' : 'flat');
      pair.appendChild(arrow);

      const b = el('div', 'tut-pair-box muted-box');
      b.appendChild(el('div', 'tut-pair-label',
        focus === 'deploy' ? 'Without this structure'
          : focus === 'accuracy' ? 'If those errors were fixed'
          : 'With all grammar corrected'));
      b.appendChild(el('div', 'tut-pair-n', String(without)));
      pair.appendChild(b);

      cmp.appendChild(pair);
      if (R.topic_impact) cmp.appendChild(el('p', 'tut-p', R.topic_impact));
      w.appendChild(cmp);
    }

    if (R.topic_verdict) {
      const c = el('div', 'card tut-hl');
      const h = el('h3', null,
        focus === 'deploy' ? 'Did you use ' + day.title + '?'
          : focus === 'accuracy' ? 'Did you get ' + day.title + ' wrong?'
          : 'Overall control');
      h.style.marginTop = '0';
      c.appendChild(h);

      if (R.topic_count != null) {
        const badge = el('div', 'tut-topic-badge' + (
          focus === 'accuracy'
            ? (Number(R.topic_count) === 0 ? ' good' : ' bad')
            : (R.topic_used ? ' good' : ' bad')));
        badge.textContent = focus === 'accuracy'
          ? (Number(R.topic_count) === 0 ? '✓ No errors of this type' : '✗ ' + R.topic_count + ' error' + (Number(R.topic_count) === 1 ? '' : 's') + ' of this type')
          : focus === 'deploy'
            ? (R.topic_used ? '✓ Used it ' + R.topic_count + '×' : '✗ Did not use it')
            : (R.topic_count + ' grammatical error' + (Number(R.topic_count) === 1 ? '' : 's') + ' in total');
        c.appendChild(badge);
      }

      c.appendChild(el('p', 'tut-p', R.topic_verdict));
      w.appendChild(c);
    }

    w.appendChild(mistakesSection(R.mistakes));

    if (R.improved_essay) {
      w.appendChild(versionsSection(state.essay, R.improved_essay, R.improved_essay_notes));
    }

    if ((R.strengths || []).length) {
      const c = el('div', 'card');
      const h = el('h3', null, '✅ What you did well');
      h.style.marginTop = '0';
      c.appendChild(h);
      const ul = el('ul', 'itemlist');
      R.strengths.forEach((x) => ul.appendChild(el('li', null, x)));
      c.appendChild(ul);
      w.appendChild(c);
    }

    if (R.next_step) {
      const c = el('div', 'card tut-hl');
      const h = el('h3', null, '➡️ Do this next');
      h.style.marginTop = '0';
      c.appendChild(h);
      c.appendChild(el('p', 'tut-p', R.next_step));
      w.appendChild(c);
    }

    const nav = el('div', 'tut-nav');
    const again = el('button', 'btn ghost', 'Rewrite this task');
    again.addEventListener('click', () => {
      state.essay = '';
      state.report = null;
      stageWrite();
    });
    const hist = el('button', 'btn ghost', '📁 My past attempts');
    hist.addEventListener('click', stageHistory);
    const done = el('button', 'btn', 'Save & close');
    done.addEventListener('click', () => {
      overlay.remove();
      document.body.classList.remove('tut-open');
      route();
    });
    nav.appendChild(done);
    nav.appendChild(again);
    nav.appendChild(hist);
    nav.appendChild(el('span', 'muted', 'Kept in Past work: your writing, every mistake, and the corrected version.'));
    w.appendChild(nav);

    const disclaimer = el('p', 'muted');
    disclaimer.style.marginTop = '18px';
    disclaimer.style.fontSize = '12.5px';
    disclaimer.textContent =
      'This band estimate comes from a language model, not a certified examiner. Treat it as a training signal and watch the trend, not any single number.';
    w.appendChild(disclaimer);

    body.appendChild(w);
    body.scrollTop = 0;
  }

  /* ------------------------- shared report pieces -------------------------
     The live report and a saved attempt render through the same functions, so
     what you see months later is exactly what you saw on the day. */

  const CAT_ORDER = ['task', 'coherence', 'cohesion', 'vocabulary', 'spelling', 'register', 'grammar', 'punctuation'];
  const CRIT_ORDER = ['task', 'cohesion', 'vocabulary', 'grammar'];

  const rankIn = (list, v) => {
    const i = list.indexOf(String(v || '').toLowerCase());
    return i === -1 ? list.length : i;
  };
  const catRank = (c) => rankIn(CAT_ORDER, c);
  /* Entries saved before criteria were tracked fall back to their category. */
  const critRank = (m) => rankIn(CRIT_ORDER, m.criterion || m.category);

  function countWordsIn(s) {
    return (String(s || '').trim().match(/\b[\w'-]+\b/g) || []).length;
  }

  function mistakeCard(m) {
    const c = el('div', 'card tut-mistake');
    const top = el('div');
    top.appendChild(el('span', 'tut-cat', m.category || 'note'));
    const sev = String(m.severity || '').toLowerCase();
    if (sev === 'major' || sev === 'minor') {
      top.appendChild(el('span', 'tut-sev ' + sev, sev));
    }
    c.appendChild(top);
    const bad = el('div', 'tut-bad');
    bad.appendChild(el('span', 'tut-mark', '✗'));
    bad.appendChild(el('span', null, m.quote));
    c.appendChild(bad);
    const good = el('div', 'tut-good');
    good.appendChild(el('span', 'tut-mark', '✓'));
    good.appendChild(el('span', null, m.correction));
    c.appendChild(good);
    if (m.why) c.appendChild(el('div', 'tut-note', m.why));
    return c;
  }

  /* Every mistake the examiner found, grouped so you can pull out one weakness
     at a time — the cohesion errors are the ones worth reading twice. */
  function mistakesSection(mistakes, heading) {
    const list = (mistakes || []).slice()
      .sort((a, b) => (critRank(a) - critRank(b)) || (catRank(a.category) - catRank(b.category)));
    const wrap = el('div');
    if (!list.length) {
      const c = el('div', 'card');
      c.appendChild(el('p', 'tut-p', 'The examiner found nothing worth correcting in this piece.'));
      wrap.appendChild(c);
      return wrap;
    }

    const major = list.filter((m) => String(m.severity || '').toLowerCase() === 'major').length;
    const h = el('h2', null, heading || 'Every mistake, one by one');
    h.style.marginBottom = '2px';
    wrap.appendChild(h);
    wrap.appendChild(el('p', 'muted', list.length + ' found across every criterion' +
      (major ? ' · ' + major + ' would cost you a band' : '')));

    const counts = new Map();
    list.forEach((m) => {
      const k = String(m.category || 'other').toLowerCase();
      counts.set(k, (counts.get(k) || 0) + 1);
    });

    const bar = el('div', 'tut-catbar');
    const holder = el('div');
    let active = 'all';

    function paint() {
      holder.innerHTML = '';
      list
        .filter((m) => active === 'all' || String(m.category || 'other').toLowerCase() === active)
        .forEach((m) => holder.appendChild(mistakeCard(m)));
      Array.from(bar.children).forEach((b) => b.classList.toggle('on', b.dataset.cat === active));
    }

    const chip = (cat, label) => {
      const b = el('button', 'tut-catchip' + (cat === 'all' ? ' on' : ''), label);
      b.type = 'button';
      b.dataset.cat = cat;
      b.addEventListener('click', () => { active = cat; paint(); });
      bar.appendChild(b);
    };
    chip('all', 'All ' + list.length);
    Array.from(counts.keys())
      .sort((a, b) => catRank(a) - catRank(b))
      .forEach((k) => chip(k, k + ' ' + counts.get(k)));

    wrap.appendChild(bar);
    wrap.appendChild(holder);
    paint();
    return wrap;
  }

  /* Your paragraphs and the band-8 version of the same paragraphs, side by side.
     Same content, same argument — only the English changes. */
  function versionsSection(theirs, improved, notes) {
    const wrap = el('div');
    if (!improved) return wrap;

    const h = el('h2', null, 'Your writing, rewritten to Band 8');
    h.style.marginBottom = '2px';
    wrap.appendChild(h);
    wrap.appendChild(el('p', 'muted', 'Your ideas and your structure, with the English fixed. Read them side by side.'));

    const grid = el('div', 'tut-versions');

    const left = el('div', 'card tut-version');
    left.appendChild(el('h4', null, 'What you wrote · ' + countWordsIn(theirs) + ' words'));
    left.appendChild(el('div', 'tut-prose theirs', String(theirs || '')));
    grid.appendChild(left);

    const right = el('div', 'card tut-version better');
    right.appendChild(el('h4', null, 'The corrected version · ' + countWordsIn(improved) + ' words'));
    right.appendChild(el('div', 'tut-prose mine', String(improved)));
    grid.appendChild(right);

    wrap.appendChild(grid);

    const nav = el('div', 'tut-nav');
    const copy = el('button', 'btn ghost small', 'Copy the corrected version');
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(String(improved));
        copy.textContent = 'Copied';
        copy.classList.add('copied');
        setTimeout(() => { copy.textContent = 'Copy the corrected version'; copy.classList.remove('copied'); }, 1600);
      } catch (_) {
        copy.textContent = 'Could not copy';
      }
    });
    nav.appendChild(copy);
    wrap.appendChild(nav);

    if ((notes || []).length) {
      const c = el('div', 'card tut-hl');
      const nh = el('h3', null, '🔧 What was changed, and why');
      nh.style.marginTop = '0';
      c.appendChild(nh);
      const ul = el('ul', 'itemlist');
      notes.forEach((n) => ul.appendChild(el('li', null, n)));
      c.appendChild(ul);
      wrap.appendChild(c);
    }
    return wrap;
  }

  /* ------------------------- stage 5: past attempts ------------------------- */

  function savedAttempts() {
    const all = (STATE.tutor && STATE.tutor[key]) || [];
    return all.filter((x) => x.kind === 'essay');
  }

  function attemptCard(a, index, total) {
    const card = el('div', 'card tut-attempt');

    const head = el('div', 'tut-attempt-head');
    head.appendChild(el('span', 'chev', '▶'));
    head.appendChild(el('div', 'tut-attempt-band', a.band == null ? '–' : String(a.band)));
    const who = el('div');
    who.appendChild(el('div', null, 'Attempt ' + (total - index) + (index === 0 ? ' · most recent' : '')));
    who.appendChild(el('div', 'tut-attempt-when', fmtWhen(a.savedAt) +
      (a.words ? ' · ' + a.words + ' words' : '') +
      (a.minutes ? ' · ' + a.minutes + ' min' : '')));
    head.appendChild(who);

    const n = (a.mistakes || []).length;
    head.appendChild(el('div', 'tut-attempt-sum', n
      ? n + ' mistake' + (n === 1 ? '' : 's') + ' logged'
      : 'saved before mistakes were kept'));
    card.appendChild(head);

    const body = el('div', 'tut-attempt-body');
    head.addEventListener('click', () => {
      card.classList.toggle('open');
      if (card.classList.contains('open') && !body.dataset.built) {
        body.dataset.built = '1';
        buildAttemptBody(body, a);
      }
    });
    card.appendChild(body);
    return card;
  }

  function buildAttemptBody(body, a) {
    if (a.taskPrompt) {
      const pc = el('div', 'card');
      const h = el('h3', null, a.task || 'The task you were set');
      h.style.marginTop = '0';
      pc.appendChild(h);
      pc.appendChild(el('p', 'tut-prompt', a.taskPrompt));
      if (a.taskData) {
        const pre = el('pre', 'tut-data');
        pre.textContent = a.taskData;
        pc.appendChild(pre);
      }
      body.appendChild(pc);
    }

    if (a.improved) {
      body.appendChild(versionsSection(a.essay, a.improved, a.improvedNotes));
    } else {
      const c = el('div', 'card');
      const h = el('h3', null, 'What you wrote · ' + countWordsIn(a.essay) + ' words');
      h.style.marginTop = '0';
      c.appendChild(h);
      c.appendChild(el('div', 'tut-prose theirs', String(a.essay || '')));
      body.appendChild(c);
    }

    if ((a.criteria || []).length) {
      body.appendChild(el('h2', null, 'How it was scored'));
      a.criteria.forEach((c) => {
        const card = el('div', 'card');
        const row = el('div', 'tut-crit');
        row.appendChild(el('b', null, c.name));
        row.appendChild(el('span', 'tut-crit-band', String(c.band)));
        card.appendChild(row);
        const bar = el('div', 'bar');
        bar.appendChild(el('i')).style.width = Math.min(100, (Number(c.band) / 9) * 100) + '%';
        card.appendChild(bar);
        card.appendChild(el('p', 'tut-p', c.comment));
        body.appendChild(card);
      });
    }

    if ((a.mistakes || []).length) body.appendChild(mistakesSection(a.mistakes, 'What the examiner marked'));

    if (a.nextStep) {
      const c = el('div', 'card tut-hl');
      const h = el('h3', null, '➡️ What you were told to do next');
      h.style.marginTop = '0';
      c.appendChild(h);
      c.appendChild(el('p', 'tut-p', a.nextStep));
      body.appendChild(c);
    }

    const del = el('button', 'btn danger', 'Delete this attempt');
    del.addEventListener('click', async () => {
      if (!confirm('Delete this attempt and its marking? There is no undo.')) return;
      try {
        await api('DELETE', '/tutor/save/' + encodeURIComponent(key) + '/' + encodeURIComponent(a.id));
        STATE.tutor[key] = (STATE.tutor[key] || []).filter((x) => x.id !== a.id);
        stageHistory();
      } catch (_) {
        alert('Could not delete that attempt.');
      }
    });
    const nav = el('div', 'tut-nav');
    nav.appendChild(del);
    body.appendChild(nav);
  }

  function stageHistory() {
    state.stage = 4;
    renderSteps();
    const list = savedAttempts();
    body.innerHTML = '';
    const w = el('div', 'tut-wrap');

    w.appendChild(el('h1', null, 'Everything you have written on this topic'));

    if (!list.length) {
      const e = el('div', 'tut-empty');
      e.appendChild(el('h3', null, 'Nothing here yet'));
      e.appendChild(el('p', null, 'Once you submit a piece of writing for marking, it is kept here with every mistake the examiner found and the corrected version of your own text.'));
      const go = el('button', 'btn', 'Write something now');
      go.addEventListener('click', stageWrite);
      e.appendChild(go);
      w.appendChild(e);
      body.appendChild(w);
      body.scrollTop = 0;
      return;
    }

    const bands = list.map((a) => Number(a.band)).filter((n) => !Number.isNaN(n));
    const best = bands.length ? Math.max.apply(null, bands) : null;
    const latest = bands.length ? bands[0] : null;
    w.appendChild(el('p', 'lede', list.length + ' attempt' + (list.length === 1 ? '' : 's') +
      (best != null ? ' · best band ' + best : '') +
      (latest != null && bands.length > 1 ? ' · latest ' + latest : '') +
      ' · click any one to reopen it in full.'));

    list.forEach((a, i) => w.appendChild(attemptCard(a, i, list.length)));

    const nav = el('div', 'tut-nav');
    const again = el('button', 'btn', 'Write a new attempt');
    again.addEventListener('click', () => {
      /* A fresh attempt means a fresh task, so warn before discarding a draft. */
      const warn = state.essay.trim() && !state.report
        ? 'You have writing in progress that has not been marked. Start a new attempt anyway?'
        : state.report
          ? 'Start a fresh attempt on a new task? Your marked report stays saved here.'
          : null;
      if (warn && !confirm(warn)) return;
      state.essay = '';
      state.report = null;
      state.task = null;
      state.started = null;
      state.timeLeft = null;
      state.running = false;
      if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }
      stageWrite();
    });
    nav.appendChild(again);
    w.appendChild(nav);

    body.appendChild(w);
    body.scrollTop = 0;
  }

  if (startAt === 'history') stageHistory();
  else stageLesson();
}
