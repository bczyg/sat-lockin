/* ============================================================
   SAT LockIn: UI layer

   One idea runs the whole app: on test day nobody tells you which
   strategy a question wants, so you practice naming the move, then
   working it.

   The student sees very little machinery:
   - Home: one big Start button, a streak, and one progress bar.
   - Today's session: Daily LockIn plus eight questions the coach picked.
   - All 30 moves: the guide to each one.
   - Paste a Bluebook miss.
   The coach is an agent on the server. It reads the student's record and
   prepares the questions in the background; the student just presses
   Start.

   Access is one rule. Daily LockIn is free for everyone. Everything else
   comes with the one-time purchase, and only when the server takes
   payments: a copy opened from disk, or a server without checkout, stays
   fully open.
   ============================================================ */
(function () {
    'use strict';

    var shell = document.getElementById('shell');
    var view = 'home';       // landing | home | session | moves | paste | unlock
    var ALLQ = {};
    var LETTERS = ['A', 'B', 'C', 'D'];
    var TODAY_KEY = 'lockin.today.v1';
    var COACH_USED = 'lockin.coach.used.v1';
    var SEEN_LANDING = 'lockin.seenlanding';
    var POOL_KEY = 'lockin.pool.v1';

    /* Questions the coach's writer added to the shared pool arrive inside a
       session. They join the bank on this device, and are kept so a session
       still renders after a reload. The server checks and sanitizes them
       before they are ever served. */
    function installPool(list, keep) {
      if (!Array.isArray(list) || !list.length) return;
      var saved = keep ? (store(POOL_KEY) || []) : null;
      window.TAGS = window.TAGS || {};
      list.forEach(function (q) {
          if (!q || !q.id || !q.tags || !q.tags.strat || !Array.isArray(q.choices) || !Array.isArray(q.steps)) return;
          if (!ALLQ[q.id]) {
            (q.section === 'math' ? window.MATH_BANK : window.RW_BANK).push(q);
            ALLQ[q.id] = q;
          }
          window.TAGS[q.id] = { strat: q.tags.strat, traps: q.tags.traps || {} };
          if (saved && !saved.some(function (x) { return x.id === q.id; })) saved.push(q);
      });
      if (saved) store(POOL_KEY, saved.slice(-400));
    }

    function boot() {
      (window.RW_BANK || []).concat(window.MATH_BANK || []).forEach(function (q) { ALLQ[q.id] = q; });
      installPool(store(POOL_KEY) || [], false);

      /* Back from the checkout page. */
      var back = /[?&]paid=1/.test(location.search);
      if (back) {
        try { history.replaceState(null, '', location.pathname); } catch (e) {}
        view = 'unlock'; unlock.stage = 'confirming';
      } else {
        try {
          if (!localStorage.getItem(SEEN_LANDING) && !window.Spot.reps().length) view = 'landing';
          localStorage.setItem(SEEN_LANDING, '1');
        } catch (e) {}
      }

      if (window.Cloud) {
        window.Cloud.on(function () {
            if (view === 'unlock' && unlock.stage === 'confirming') confirmPurchase();
            ensureCoach();
            if (view !== 'session') render();
        });
      }
      document.addEventListener('keydown', onKey);
      document.getElementById('modal-root').addEventListener('click', function (e) {
          if (e.target.dataset && e.target.dataset.close) closeModal();
      });
      render();
    }

    /* ---------------- icons ---------------- */
    var ICONS = {
      target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.2"/>',
      scope:  '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.4-4.4"/>',
      close:  '<path d="M6 6l12 12M18 6L6 18"/>',
      flame:  '<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.4 2.4-5.3 3.6-8 .3 1.8 1.2 3 2.4 3.6C11.6 7 13 4.6 15.4 3c-.4 2.6.6 4.4 1.9 6.1 1 1.4 1.7 3 1.7 5.1 0 3.9-3 6.8-7 6.8z"/>',
      check:  '<path d="M5 13l4 4 10-10"/>',
      user:   '<circle cx="12" cy="8" r="3.5"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/>',
      book:   '<path d="M5 4h9a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h9"/>',
      lock:   '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
      arrow:  '<path d="M5 12h14M13 6l6 6-6 6"/>',
      back:   '<path d="M19 12H5M11 6l-6 6 6 6"/>',
      spark:  '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
      bulb:   '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>',
      star:   '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>'
    };
    function ic(name, cls) {
      return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (ICONS[name] || '') + '</svg>';
    }

    /* ---------------- small helpers ---------------- */
    function esc(s) {
      return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function toast(msg) {
      var t = document.createElement('div');
      t.className = 'toast'; t.textContent = msg;
      document.body.appendChild(t);
      setTimeout(function () { t.remove(); }, 2400);
    }
    function openModal(title, html) {
      document.getElementById('modal-title').textContent = title;
      document.getElementById('modal-body').innerHTML = html;
      document.getElementById('modal-root').classList.remove('hidden');
    }
    function closeModal() { document.getElementById('modal-root').classList.add('hidden'); }
    function stratName(id) { return window.STRATS[id] ? window.STRATS[id].name : id; }
    function wordmark() {
      var w = window.BRAND.wordmark || [window.BRAND.name, ''];
      return esc(w[0]) + (w[1] ? '<span>' + esc(w[1]) + '</span>' : '');
    }
    function store(key, val) {
      try {
        if (val === undefined) return JSON.parse(localStorage.getItem(key));
        localStorage.setItem(key, JSON.stringify(val));
      } catch (e) {}
      return null;
    }
    function price() { return (window.CONFIG || {}).price || '$14.99'; }

    /* ---------------- render dispatch ---------------- */
    /* A re-render of the same screen (the next step, the answer) keeps the
       student's place and skips the entrance animation; a new screen
       starts at the top, or at the verdict once a move is named. */
    var lastScreen = '';
    function render() {
      var key = view + (view === 'session' && sess ? ':' + sess.round.i + ':' + sess.phase : '');
      var same = key === lastScreen;
      lastScreen = key;
      var y = window.pageYOffset;
      shell.className = same ? 'static' : '';
      shell.innerHTML =
        view === 'landing' ? landingHTML() :
        view === 'session' ? sessionHTML() :
        view === 'moves' ? movesHTML() :
        view === 'paste' ? pasteHTML() :
        view === 'unlock' ? unlockHTML() :
        homeHTML();
      window.scrollTo(0, same ? y : 0);
      if (view === 'session' && sess) {
        if (!same && sess.phase === 'named') reveal('.verdict', 'start');
        else if (sess.phase === 'work') {
          if (!sess.answer) reveal('.page > .actions', 'end');
          else if (same) reveal('.q-card .choices, .q-card .spr', 'start');
        }
      }
      if (view === 'session' && sess && sess.phase === 'done' && sess.celebrate) {
        sess.celebrate = false;
        confetti();
      }
    }

    function reveal(sel, block) {
      var el = shell.querySelector(sel);
      if (!el || !el.scrollIntoView) return;
      var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ block: block, behavior: calm ? 'auto' : 'smooth' });
    }

    /* ============================================================
       ACCESS: one rule
       ============================================================ */
    function full() {
      var C = window.Cloud;
      return !(C && C.payments && !C.paid());
    }
    /* True when it may go ahead; otherwise opens the unlock screen. */
    function needFull() {
      if (full()) return true;
      APP.unlock();
      return false;
    }

    /* ============================================================
       PROGRESS
       A move is locked in when you name it right reliably: three or more
       tries, right at least four times in five. One number for the
       student to watch grow.
       ============================================================ */
    function moveIds() {
      return Object.keys(window.STRATS).filter(function (id) { return !window.STRATS[id].meta; });
    }
    function lockedSet() {
      var d = window.Spot.data().strats, out = {};
      moveIds().forEach(function (id) {
          var s = d[id];
          if (s && s.seen >= 3 && s.right / s.seen >= 0.8) out[id] = 1;
      });
      return out;
    }
    function moveState(id) {
      var s = window.Spot.data().strats[id];
      if (!s || !s.seen) return { key: 'new', label: 'New' };
      if (s.seen >= 3 && s.right / s.seen >= 0.8) return { key: 'locked', label: 'Locked in' };
      return { key: 'learning', label: s.right + ' of ' + s.seen + ' right' };
    }
    function progressHTML(compact) {
      var total = moveIds().length;
      var n = Object.keys(lockedSet()).length;
      var met = window.Spot.summary().seen;
      var h = '<div class="progress-card' + (compact ? ' compact' : '') + '">' +
        '<div class="pc-top"><div><div class="pc-num">' + n + '<span>/' + total + '</span></div>' +
        '<div class="pc-lbl">moves locked in</div></div>' +
        '<div class="pc-side">' + (n === total ? 'Every move. Go take a practice test.' :
          n ? (total - n) + ' to go' : met ? 'You have met ' + met + ' so far' : 'Your first session starts the count') + '</div></div>' +
        '<div class="bar"><div class="bar-fill" style="width:' + Math.round(100 * n / total) + '%"></div></div>';
      if (!compact) h += '<p class="pc-help">A move locks in once you name it right almost every time, at least three tries.</p>';
      return h + '</div>';
    }
    function weekHTML() {
      var h = '<div class="week">';
      var names = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
      window.Daily.recent(7).forEach(function (x) {
          var d = new Date(x.date + 'T12:00:00');
          var cls = x.answered ? 'on' : x.today ? 'today' : '';
          h += '<div class="wk ' + cls + '"><span class="wk-dot">' + (x.answered ? ic('check') : '') + '</span>' +
            '<span class="wk-d">' + names[d.getDay()] + '</span></div>';
      });
      return h + '</div>';
    }

    /* ============================================================
       THE COACH (behind the scenes)
       On the first visit of the day the server's coach reads this
       student's record and prepares a session of eight questions. The app
       uses it when the student presses Start and asks for the next one in
       the background. If it is not ready, or the server has no coach, the
       round is built here from the same record, so Start never waits.
       ============================================================ */
    var coach = { day: null, session: null, left: 0, busy: false };
    function coachOn() {
      var C = window.Cloud;
      return !!(C && C.coach && C.enabled && C.signedIn() && full());
    }
    function coachUsed() { return store(COACH_USED) || []; }
    function coachReady() {
      var s = coach.session;
      return s && s.qids && s.qids.length && coachUsed().indexOf(s.id) < 0 ? s : null;
    }
    function ensureCoach() {
      if (!coachOn()) return;
      var today = window.Daily.todayKey();
      if (coach.day === today) return;
      coach.day = today;
      window.Cloud.coachToday(today).then(function (d) {
          if (d.session) installPool(d.session.questions, true);
          coach.session = d.session; coach.left = d.left;
          if (!coachReady()) prepareNext();
          else if (view === 'home') render();
      }).catch(function () {});
    }
    function prepareNext() {
      if (!coachOn() || coach.busy || coach.left <= 0) return;
      coach.busy = true;
      window.Cloud.flushQueue().then(function () {
          return window.Cloud.coachPrepare(window.Daily.todayKey());
      }).then(function (d) {
          if (d.session) installPool(d.session.questions, true);
          coach.busy = false; coach.session = d.session; coach.left = d.left;
          if (view === 'home') render();
      }).catch(function () { coach.busy = false; });
    }
    /* Eight question ids for the next round: the coach's, or built here. */
    function nextRoundQids(exclude) {
      var s = coachReady();
      if (s) {
        var used = coachUsed(); used.push(s.id); store(COACH_USED, used.slice(-50));
        return { qids: s.qids.filter(function (id) { return id !== exclude; }), line: s.line, coach: true };
      }
      var r = window.Spot.build({});
      return { qids: r.items.map(function (x) { return x.qid; }).filter(function (id) { return id !== exclude; }), line: '', coach: false };
    }

    /* ============================================================
       HOME
       ============================================================ */
    function todayDone() {
      var t = store(TODAY_KEY);
      return !!(t && t.day === window.Daily.todayKey());
    }
    function greeting() {
      var h = new Date().getHours();
      return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    }
    function topbar() {
      var C = window.Cloud;
      var streak = window.Daily.streak();
      var h = '<header class="topbar"><button class="wordmark" onclick="APP.go(\'home\')">' + wordmark() + '</button><div class="tb-right">';
      h += '<span class="streak-chip' + (streak ? ' hot' : '') + '" title="Days in a row">' + ic('flame') + streak + '</span>';
      if (C && C.enabled) {
        h += '<button class="icon-btn round" aria-label="Account" onclick="APP.account()">' + ic('user') + '</button>';
      }
      return h + '</div></header>';
    }

    function homeHTML() {
      var D = window.Daily;
      var dailyDone = D.isDone();
      var paid = full();
      var C = window.Cloud;
      var name = C && C.profile && C.profile.display_name ? String(C.profile.display_name).split(' ')[0] : '';
      var streak = D.streak();

      var h = '<div class="page home">' + topbar();
      h += '<p class="hello">' + greeting() + (name ? ', ' + esc(name) : '') + '</p>';

      /* ---- the one big thing ---- */
      h += '<section class="hero-card">';
      if (paid && !todayDone()) {
        var s = coachReady();
        h += '<div class="hc-kicker">' + ic('target') + 'Today’s session</div>' +
          '<h1>' + (dailyDone ? 'Eight more, picked for you' : 'Ready to lock in?') + '</h1>' +
          '<p class="hc-sub">' + esc(s && s.line ? s.line :
            dailyDone ? 'Your daily question is done. Eight more questions, chosen from what you mix up.' :
            'Today’s question plus eight picked for you. Name the move, then work it.') + '</p>' +
          '<div class="hc-meta"><span>' + (dailyDone ? 8 : 9) + ' questions</span><span>About 10 minutes</span></div>' +
          '<button class="btn primary xl" onclick="APP.startToday()">Start ' + ic('arrow') + '</button>';
      } else if (!dailyDone) {
        h += '<div class="hc-kicker">' + ic('target') + 'Daily LockIn</div>' +
          '<h1>Can you spot the move?</h1>' +
          '<p class="hc-sub">One question. Name the strategy it wants, then work it. Two minutes.</p>' +
          '<button class="btn primary xl" onclick="APP.startToday()">Start today’s question ' + ic('arrow') + '</button>';
      } else {
        h += '<div class="hc-done">' + ic('check') + '</div>' +
          '<h1>Done for today</h1>' +
          '<p class="hc-sub">' + (streak > 1 ? 'That is ' + streak + ' days in a row. Come back tomorrow to make it ' + (streak + 1) + '.' :
            streak === 1 ? 'Day one is in the books. Come back tomorrow to make it two in a row.' :
            'Come back tomorrow and start a streak.') + '</p>' +
          (paid ? '<button class="btn soft" onclick="APP.practiceMore()">Practice more</button>' : '');
      }
      h += weekHTML();
      h += '</section>';

      /* ---- the upgrade, only for someone who has not bought it ---- */
      if (!paid) h += unlockCardHTML();

      h += progressHTML(true);

      h += '<div class="tiles">' +
        '<button class="tile" onclick="APP.go(\'moves\')"><span class="tile-ic">' + ic('book') + '</span>' +
        '<span class="tile-name">All ' + moveIds().length + ' moves</span><span class="tile-sub">How to spot each one</span></button>' +
        '<button class="tile" onclick="APP.openPaste()"><span class="tile-ic">' + ic(paid ? 'scope' : 'lock') + '</span>' +
        '<span class="tile-name">Missed one in Bluebook?</span><span class="tile-sub">Paste it, get the move and the trap</span></button>' +
        '</div>';

      h += '<footer class="foot"><button class="link-btn" onclick="APP.go(\'landing\')">How SAT LockIn works</button>';
      if (C && C.enabled && C.payments && !C.signedIn()) {
        h += ' <span>&middot;</span> <button class="link-btn" onclick="APP.signIn()">Already bought it? Sign in</button>';
      }
      h += '</footer></div>';
      return h;
    }

    function unlockCardHTML() {
      return '<section class="unlock-card"><div class="uc-tag">' + ic('star') + 'Full version</div>' +
        '<h2>Train every day, not just one question</h2>' +
        '<ul class="ticks">' +
        '<li>' + ic('check') + 'A 10-minute session every day, picked for you by your coach</li>' +
        '<li>' + ic('check') + 'Practice any of the ' + moveIds().length + ' moves whenever you want</li>' +
        '<li>' + ic('check') + 'Paste a Bluebook miss and see what tripped you</li></ul>' +
        '<button class="btn primary" onclick="APP.unlock()">Unlock for ' + esc(price()) + ', one time</button>' +
        '<p class="uc-note">No subscription. Daily LockIn stays free either way.</p></section>';
    }

    /* ============================================================
       SESSION: name the move, then work it
       One flow for everything: today's session, a single daily question,
       more practice, and a focused round on one move.
       ============================================================ */
    var sess = null; // { kind, round, phase, step, answer, dailyIdx, dailyDate, line, before, streak, best }

    function startRound(kind, qids, opts) {
      opts = opts || {};
      var round = opts.focus ? window.Spot.build({ focus: opts.focus }) : window.Spot.build({ qids: qids });
      if (!round.items.length) { toast('No questions available for that right now'); return; }
      sess = {
        kind: kind, round: round, phase: 'ask', step: 0, answer: false,
        dailyIdx: opts.dailyDate ? 0 : -1, dailyDate: opts.dailyDate || null,
        line: opts.line || '', focus: opts.focus || null,
        before: lockedSet(), run: 0, best: 0
      };
      closeModal();
      view = 'session'; render();
    }

    function progressDots() {
      var r = sess.round, h = '<div class="dots">';
      r.items.forEach(function (it, i) {
          var cls = i < r.i || (i === r.i && sess.phase !== 'ask') ? (it.right ? 'ok' : 'miss') : i === r.i ? 'now' : '';
          h += '<span class="dot ' + cls + '"></span>';
      });
      return h + '</div>';
    }

    function questionHTML(q, reveal) {
      var h = '<div class="q-card">';
      if (q.blurb || q.figure || q.passage) {
        h += '<div class="passage">';
        if (q.blurb) h += '<p class="blurb">' + q.blurb + '</p>';
        if (q.figure) h += '<div class="figure">' + q.figure + (q.figcap ? '<div class="cap">' + q.figcap + '</div>' : '') + '</div>';
        if (q.passage) h += q.passage;
        h += '</div>';
      }
      h += '<div class="stem">' + q.prompt + '</div>';
      if (q.type === 'spr') {
        h += reveal
          ? '<p class="spr">Answer: <strong>' + q.answers.map(esc).join('</strong> or <strong>') + '</strong></p>'
          : '<p class="spr">You type the answer in on this one.</p>';
      } else {
        h += '<ul class="choices">';
        q.choices.forEach(function (c, i) {
            var ok = reveal && i === q.answer;
            h += '<li class="choice' + (ok ? ' correct' : '') + '"><span class="ltr">' + LETTERS[i] + '</span><span class="txt">' + c + '</span>' +
              (ok ? '<span class="tag">' + ic('check') + 'Answer</span>' : '') + '</li>';
        });
        h += '</ul>';
      }
      return h + '</div>';
    }

    function cuesHTML(id) {
      var st = window.STRATS[id];
      if (!st || !st.cues) return '';
      return '<ul class="cues">' + st.cues.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ul>';
    }

    var PRAISE = ['Nice spot.', 'That is the move.', 'Locked on.', 'Exactly right.', 'Good eye.'];

    function sessionHTML() {
      if (!sess) { view = 'home'; return homeHTML(); }
      if (sess.phase === 'done') return sessionDoneHTML();

      var r = sess.round;
      var it = r.items[r.i];
      var q = ALLQ[it.qid];
      var st = window.STRATS[it.strat];
      var isDaily = r.i === sess.dailyIdx;

      var h = '<div class="page session">';
      h += '<header class="s-top"><button class="icon-btn" aria-label="Exit" onclick="APP.exitSession()">' + ic('close') + '</button>' +
        progressDots() +
        '<span class="s-count">' + (r.i + 1) + '/' + r.items.length + '</span></header>';
      h += '<div class="s-label">' + (isDaily ? '<span class="pill daily">' + ic('flame') + 'Daily LockIn</span>' : '') +
        '<span>' + esc(q.section === 'rw' ? 'Reading and Writing' : 'Math') + '</span>' +
        (sess.run >= 2 && sess.phase === 'ask' ? '<span class="pill run">' + ic('spark') + sess.run + ' in a row</span>' : '') + '</div>';

      h += questionHTML(q, sess.phase === 'work' && sess.answer);

      if (sess.phase === 'ask') {
        h += '<section class="ask"><h2>Which move does this question want?</h2>' +
          '<p class="ask-sub">Decide before you solve.</p><div class="opts">';
        it.options.forEach(function (id, i) {
            h += '<button class="opt" onclick="APP.pick(\'' + id + '\')"><span class="opt-k">' + (i + 1) + '</span>' +
              '<span class="opt-t">' + esc(stratName(id)) + '</span></button>';
        });
        h += '</div><button class="link-btn quiet" onclick="APP.pick(null)">Not sure yet? Show me</button></section>';
        return h + '</div>';
      }

      if (sess.phase === 'named') {
        var praise = PRAISE[(r.i + it.qid.length) % PRAISE.length];
        h += '<section class="verdict ' + (it.right ? 'ok' : 'no') + '">' +
          '<div class="v-ic">' + ic(it.right ? 'check' : 'bulb') + '</div><div>' +
          '<div class="v-title">' + (it.right ? praise : it.picked ? 'Not quite. Here is the move.' : 'Here is the move.') + '</div>' +
          '<div class="v-move">' + esc(st.name) + '</div></div></section>';
        h += '<div class="stack">';
        h += '<div class="panel"><h3>What gives it away</h3>' + cuesHTML(it.strat) + '</div>';
        if (it.picked && !it.right) {
          var vs = window.stratVs(it.strat, it.picked);
          var other = window.STRATS[it.picked];
          h += '<div class="panel warm"><h3>Why not ' + esc(other.name) + '?</h3>' +
            '<p>' + esc(vs || ('That move is for a different signal: ' + other.cues[0])) + '</p></div>';
        }
        h += '</div><div class="actions"><button class="btn primary xl" onclick="APP.work()">Work it with this move ' + ic('arrow') + '</button></div>';
        return h + '</div>';
      }

      /* work: the move, then one step at a time, then the answer */
      h += '<div class="stack"><div class="panel move"><h3>' + esc(st.name) + '</h3><p class="move-txt">' + esc(st.move) + '</p>' +
        (q.strategy ? '<p class="move-q">' + q.strategy + '</p>' : '') + '</div>';
      h += '<div class="panel"><h3>Step by step</h3>';
      if (sess.step === 0) h += '<p class="muted">Try the first step yourself, then check it.</p>';
      else {
        h += '<ol class="steps">';
        q.steps.slice(0, sess.step).forEach(function (s) { h += '<li>' + s + '</li>'; });
        h += '</ol>';
      }
      h += '</div>';

      if (sess.step < q.steps.length) {
        h += '</div><div class="actions"><button class="btn primary" onclick="APP.step()">' +
          (sess.step === 0 ? 'Show the first step' : 'Next step') + '</button>' +
          '<button class="btn soft" onclick="APP.step(true)">Show all</button></div>';
        return h + '</div>';
      }
      if (!sess.answer) {
        h += '</div><div class="actions"><button class="btn primary" onclick="APP.answer()">Show the answer</button></div>';
        return h + '</div>';
      }
      if (q.traps && Object.keys(q.traps).length) {
        var tg = window.tagsFor(q);
        h += '<div class="panel traps"><h3>Why the wrong answers look right</h3>';
        Object.keys(q.traps).forEach(function (k) {
            var t = tg.traps[k] ? window.TRAPS[tg.traps[k]] : null;
            h += '<div class="trap"><b>' + LETTERS[+k] + '</b><div>' +
              (t ? '<span class="trap-name">' + esc(t.name) + '</span>' : '') + q.traps[k] +
              (t ? '<span class="trap-fix"><b>Next time:</b> ' + esc(t.fix) + '</span>' : '') + '</div></div>';
        });
        h += '</div>';
      }
      var last = r.i === r.items.length - 1;
      h += '</div><div class="actions"><button class="btn primary xl" onclick="APP.next()">' +
        (last ? 'Finish ' : 'Next question ') + ic('arrow') + '</button></div>';
      return h + '</div>';
    }

    function sessionDoneHTML() {
      var r = sess.round;
      var n = r.items.length;
      var right = r.items.filter(function (x) { return x.right; }).length;
      var after = lockedSet();
      var fresh = Object.keys(after).filter(function (id) { return !sess.before[id]; });
      var streak = window.Daily.streak();
      var ratio = n ? right / n : 0;

      var head = n === 1 ? (right ? 'You spotted it.' : 'Now you know this one.') :
        right === n ? 'Perfect round.' : ratio >= 0.75 ? 'Strong session.' : ratio >= 0.5 ? 'Good work.' : 'Every miss here is a pair to learn.';
      var sub = n === 1
        ? (right ? 'Name it on sight and the question is half done.' : 'A miss you understand is worth more than a lucky guess.')
        : 'You named ' + right + ' of ' + n + ' before solving.';

      var h = '<div class="page session done">';
      h += '<section class="done-hero">' +
        '<div class="ring" style="--p:' + Math.round(100 * ratio) + '"><div class="ring-in"><b>' + right + '</b><span>of ' + n + '</span></div></div>' +
        '<h1>' + head + '</h1><p class="hc-sub">' + sub + '</p>';
      h += '<div class="done-stats">';
      if (sess.dailyIdx >= 0) {
        h += '<div class="ds"><span class="ds-ic hot">' + ic('flame') + '</span><b>' + streak + '</b><span>day' + (streak === 1 ? '' : 's') + ' in a row</span></div>';
      }
      if (sess.best >= 3) h += '<div class="ds"><span class="ds-ic">' + ic('spark') + '</span><b>' + sess.best + '</b><span>best run</span></div>';
      h += '<div class="ds"><span class="ds-ic">' + ic('star') + '</span><b>' + Object.keys(after).length + '</b><span>locked in</span></div>';
      h += '</div></section>';

      if (fresh.length) {
        h += '<section class="panel celebrate"><h3>' + ic('star') + 'Newly locked in</h3><ul class="chips">' +
          fresh.map(function (id) { return '<li>' + esc(stratName(id)) + '</li>'; }).join('') + '</ul></section>';
      }

      var misses = r.items.filter(function (x) { return !x.right; });
      if (misses.length && n > 1) {
        h += '<section class="panel"><h3>Worth another look</h3>';
        misses.forEach(function (it) {
            var vs = it.picked ? window.stratVs(it.strat, it.picked) : null;
            h += '<div class="miss"><div><b>' + esc(stratName(it.strat)) + '</b>' +
              (it.picked ? '<span class="miss-said">You picked ' + esc(stratName(it.picked)) + '</span>' : '') +
              (vs ? '<p>' + esc(vs) + '</p>' : '') + '</div>' +
              '<button class="btn soft sm" onclick="APP.focus(\'' + it.strat + '\')">Practice</button></div>';
        });
        h += '</section>';
      }

      h += '<div class="actions center">';
      if (!full()) {
        h += '</div>' + unlockCardHTML() + '<div class="actions center"><button class="btn soft" onclick="APP.go(\'home\')">Back home</button>';
      } else if (sess.kind === 'today') {
        h += '<button class="btn primary xl" onclick="APP.go(\'home\')">Done for today</button>' +
          '<button class="btn soft" onclick="APP.practiceMore()">Keep going</button>';
      } else {
        h += '<button class="btn primary xl" onclick="APP.practiceMore()">Another round</button>' +
          '<button class="btn soft" onclick="APP.go(\'home\')">Back home</button>';
      }
      h += '</div></div>';
      return h;
    }

    /* A few seconds of color for a good result. Decorative only. */
    function confetti() {
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      var box = document.createElement('div');
      box.className = 'confetti'; box.setAttribute('aria-hidden', 'true');
      var colors = ['var(--accent)', 'var(--brand)', 'var(--ok)', 'var(--gold)'];
      for (var i = 0; i < 70; i++) {
        var p = document.createElement('i');
        p.style.left = Math.random() * 100 + '%';
        p.style.background = colors[i % colors.length];
        p.style.animationDelay = (Math.random() * 0.6) + 's';
        p.style.animationDuration = (1.8 + Math.random() * 1.4) + 's';
        p.style.transform = 'rotate(' + Math.round(Math.random() * 360) + 'deg)';
        box.appendChild(p);
      }
      document.body.appendChild(box);
      setTimeout(function () { box.remove(); }, 3800);
    }

    /* ============================================================
       ALL THE MOVES
       ============================================================ */
    function pageHead(title, sub) {
      return '<header class="page-head"><button class="icon-btn" aria-label="Back" onclick="APP.go(\'home\')">' + ic('back') + '</button>' +
        '<div><h1>' + title + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div></header>';
    }

    function movesHTML() {
      var h = '<div class="page moves">' + pageHead('All ' + moveIds().length + ' moves',
        'Every SAT question wants one of these. Tap a move to see how to spot it.');
      h += progressHTML(false);
      [['rw', 'Reading and Writing'], ['math', 'Math']].forEach(function (sec) {
          h += '<h2 class="sec-title">' + sec[1] + '</h2><div class="move-list">';
          Object.keys(window.STRATS).forEach(function (id) {
              var st = window.STRATS[id];
              if (st.section !== sec[0]) return;
              var ms = st.meta ? { key: 'habit', label: 'Every question' } : moveState(id);
              h += '<button class="move-row" onclick="APP.guide(\'' + id + '\')">' +
                '<span class="mr-dot ' + ms.key + '">' + (ms.key === 'locked' ? ic('check') : '') + '</span>' +
                '<span class="mr-name">' + esc(st.name) + '</span>' +
                '<span class="mr-state ' + ms.key + '">' + esc(ms.label) + '</span></button>';
          });
          h += '</div>';
      });
      return h + '</div>';
    }

    function guideHTML(id) {
      var st = window.STRATS[id];
      var h = '<p class="g-move">' + esc(st.move) + '</p>';
      h += '<div class="panel"><h3>How you know it is this one</h3>' + cuesHTML(id) + '</div>';
      var pairs = Object.keys(window.STRAT_VS).filter(function (k) { return k.split('|').indexOf(id) >= 0; });
      if (pairs.length) {
        h += '<div class="panel warm"><h3>Easy to mix up with</h3>';
        pairs.forEach(function (k) {
            var p = k.split('|');
            var other = p[0] === id ? p[1] : p[0];
            h += '<p><b>' + esc(stratName(other)) + '.</b> ' + esc(window.STRAT_VS[k]) + '</p>';
        });
        h += '</div>';
      }
      if (st.why) h += '<div class="panel"><h3>Why it works</h3><p>' + esc(st.why) + '</p></div>';
      if (id === 'desmos-first' && window.DESMOS) h += desmosHTML();
      if (!st.meta) {
        h += '<div class="actions sheet-foot"><button class="btn primary" onclick="APP.focus(\'' + id + '\')">' +
          (full() ? '' : ic('lock')) + 'Practice spotting it</button></div>';
      }
      return h;
    }

    /* The calculator tips live inside the "graph it first" move. */
    function desmosHTML() {
      var h = '<div class="panel"><h3>What the built-in calculator can do</h3>' +
        '<p class="muted">Desmos is open on every math question in Bluebook. These are the tricks most students never find.</p>';
      window.DESMOS.groups.forEach(function (g) {
          g.tricks.forEach(function (t) {
              h += '<details class="trick"><summary>' + esc(t.name) + '</summary>' +
                '<div class="type"><span>Type</span><code>' + esc(t.type) + '</code></div>' +
                '<p>' + esc(t.then) + '</p>' + (t.edge ? '<p class="muted">Careful: ' + esc(t.edge) + '</p>' : '') +
                (t.confirm ? '<p class="muted">Try this one in Bluebook once before test day.</p>' : '') + '</details>';
          });
      });
      return h + '</div>';
    }

    /* ============================================================
       PASTE A BLUEBOOK MISS (full version, uses the AI)
       ============================================================ */
    var az = { text: '', picked: '', guess: '', busy: false, res: null, err: '' };

    function catalogContext() {
      var out = ['STRATEGY IDS. Choose exactly one.'];
      Object.keys(window.STRATS).forEach(function (id) {
          out.push('  ' + id + ' [' + window.STRATS[id].section + '] = ' + window.STRATS[id].name + '. ' + window.STRATS[id].move);
      });
      out.push('', 'TRAP IDS. Choose one per wrong choice.');
      Object.keys(window.TRAPS).forEach(function (id) {
          out.push('  ' + id + ' = ' + window.TRAPS[id].name + '. ' + window.TRAPS[id].tell);
      });
      return out.join('\n');
    }
    function azParse(text) {
      var t = String(text || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
      var a = t.indexOf('{'), b = t.lastIndexOf('}');
      if (a < 0 || b < a) return null;
      try { return JSON.parse(t.slice(a, b + 1)); } catch (e) { return null; }
    }
    /* Ids not in the catalog are dropped: a made-up label is worse than none. */
    function azClean(res) {
      var out = {
        section: res.section === 'math' ? 'math' : 'rw',
        skill: typeof res.skill === 'string' ? res.skill : null,
        strategy: window.STRATS[res.strategy] ? res.strategy : null,
        strategyWhy: typeof res.strategyWhy === 'string' ? res.strategyWhy : '',
        correct: res.correct == null ? '' : String(res.correct),
        walkthrough: Array.isArray(res.walkthrough) ? res.walkthrough.filter(function (x) { return typeof x === 'string' && x.trim(); }) : [],
        traps: [],
        picked: null,
        confidence: ['high', 'medium', 'low'].indexOf(res.confidence) >= 0 ? res.confidence : 'medium'
      };
      (Array.isArray(res.traps) ? res.traps : []).forEach(function (t) {
          if (t && window.TRAPS[t.trap]) out.traps.push({ choice: String(t.choice || '').slice(0, 3), trap: t.trap, why: typeof t.why === 'string' ? t.why : '' });
      });
      if (res.picked && window.TRAPS[res.picked.trap]) out.picked = { trap: res.picked.trap, why: typeof res.picked.why === 'string' ? res.picked.why : '' };
      return out;
    }
    /* A pasted miss joins the record the coach reads. */
    function recordPasted(res) {
      window.Store.logMisses({ id: String(Date.now()), label: 'Pasted from a practice test', section: res.section || null }, [{
        section: res.section || null, skill: res.skill || null, domain: null,
        strat: res.strategy || null, trap: res.picked ? res.picked.trap : null, cause: res.picked ? 'trap' : 'gap'
      }]);
    }

    function pasteHTML() {
      var ai = window.Cloud && window.Cloud.aiEnabled;
      var h = '<div class="page paste">' + pageHead('Missed one in Bluebook?',
        'Paste the question. You get the move it wanted and why the answer you picked looked right.');

      if (az.res) {
        var r = az.res;
        if (r.confidence === 'low') h += '<p class="note-warn">Part of the question may not have come through, so read this as a suggestion.</p>';
        if (r.strategy && az.guess) {
          var hit = az.guess === r.strategy;
          h += '<section class="verdict ' + (hit ? 'ok' : 'no') + '"><div class="v-ic">' + ic(hit ? 'check' : 'bulb') + '</div><div>' +
            '<div class="v-title">' + (hit ? 'You named it before looking.' : 'You guessed ' + esc(stratName(az.guess)) + '.') + '</div>' +
            (hit ? '' : '<div class="v-sub">' + esc(window.stratVs(r.strategy, az.guess) || '') + '</div>') + '</div></section>';
        }
        h += '<div class="stack">';
        if (r.strategy) {
          var st = window.STRATS[r.strategy];
          h += '<div class="panel move"><div class="eyebrow">The move it wanted</div><h3>' + esc(st.name) + '</h3>' +
            '<p class="move-txt">' + esc(st.move) + '</p>' + (r.strategyWhy ? '<p>' + esc(r.strategyWhy) + '</p>' : '') +
            '<div class="actions left"><button class="btn primary sm" onclick="APP.focus(\'' + r.strategy + '\')">Practice spotting it</button></div></div>';
        }
        if (r.picked) {
          var tp = window.TRAPS[r.picked.trap];
          h += '<div class="panel warm"><div class="eyebrow">What caught you</div><h3>' + esc(tp.name) + '</h3>' +
            (r.picked.why ? '<p>' + esc(r.picked.why) + '</p>' : '') +
            '<p><b>Spot it:</b> ' + esc(tp.tell) + '</p><p><b>Beat it:</b> ' + esc(tp.fix) + '</p></div>';
        }
        if (r.walkthrough.length) {
          h += '<div class="panel"><h3>How it works out' + (r.correct ? ', to ' + esc(r.correct) : '') + '</h3><ol class="steps">' +
            r.walkthrough.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol></div>';
        }
        if (r.traps.length) {
          h += '<div class="panel"><h3>Why the wrong answers look right</h3>';
          r.traps.forEach(function (t) {
              h += '<div class="trap"><b>' + esc(t.choice || '?') + '</b><div><span class="trap-name">' + esc(window.TRAPS[t.trap].name) + '</span>' + esc(t.why) + '</div></div>';
          });
          h += '</div>';
        }
        h += '</div>';
        if (coachOn()) {
          h += '<p class="muted small" style="text-align:center">' + ic('target') +
            ' Saved. Your coach will build your next sessions around this miss.</p>';
        }
        h += '<div class="actions"><button class="btn soft" onclick="APP.pasteReset()">Paste another</button></div></div>';
        return h;
      }

      h += '<section class="panel form">' +
        '<label class="fld"><span>The question</span><textarea id="az-text" rows="9" oninput="APP.azText(this.value)" ' +
        'placeholder="Copy the passage, the question, and all four choices from Bluebook.">' + esc(az.text) + '</textarea></label>' +
        '<div class="fld-row"><label class="fld"><span>Your answer (optional)</span><input id="az-picked" maxlength="20" placeholder="B" value="' + esc(az.picked) + '" oninput="APP.azPick(this.value)"></label>' +
        '<label class="fld"><span>Your guess at the move (optional)</span><select onchange="APP.azGuess(this.value)"><option value="">Skip</option>';
      moveIds().forEach(function (id) {
          h += '<option value="' + id + '"' + (az.guess === id ? ' selected' : '') + '>' + esc(stratName(id)) + '</option>';
      });
      h += '</select></label></div>';
      if (az.busy) h += '<p class="working"><span class="spinner"></span>Reading the question&hellip;</p>';
      else if (ai) h += '<button class="btn primary xl" onclick="APP.pasteRun()">Find the move and the trap</button>';
      else h += '<p class="note-warn">This needs the AI, which is not switched on for this server.</p>';
      if (az.err) h += '<p class="err">' + esc(az.err) + '</p>';
      return h + '</section></div>';
    }

    /* ============================================================
       UNLOCK: sign in, pay, done
       Sign-in comes first so the payment lands on this account even if
       a different email is typed at checkout.
       ============================================================ */
    var unlock = { stage: 'email', email: '', busy: false, err: '', msg: '', signinOnly: false, tries: 0 };

    function checkoutLink(url) {
      var C = window.Cloud, p = C && C.signedIn() ? C.profile : null;
      if (!p || !p.id) return url;
      return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'client_reference_id=' + encodeURIComponent(p.id) +
        (p.email ? '&prefilled_email=' + encodeURIComponent(p.email) : '');
    }

    function authFormHTML() {
      var h = '';
      if (unlock.stage === 'code') {
        h += '<p class="muted">We sent a 6-digit code to <b>' + esc(unlock.email) + '</b>.</p>' +
          '<label class="fld"><span>Code</span><input id="auth-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="123456" ' +
          'onkeydown="if(event.key===\'Enter\')APP.verifyCode()"></label>' +
          '<button class="btn primary xl" ' + (unlock.busy ? 'disabled' : '') + ' onclick="APP.verifyCode()">' + (unlock.busy ? 'Checking&hellip;' : 'Continue') + '</button>' +
          '<p class="small"><button class="link-btn" onclick="APP.authBack()">Use a different email</button> &middot; <button class="link-btn" onclick="APP.sendCode()">Send it again</button></p>';
      } else {
        h += '<label class="fld"><span>Your email</span><input id="auth-email" type="email" autocomplete="email" placeholder="you@email.com" value="' + esc(unlock.email) + '" ' +
          'onkeydown="if(event.key===\'Enter\')APP.sendCode()"></label>' +
          '<button class="btn primary xl" ' + (unlock.busy ? 'disabled' : '') + ' onclick="APP.sendCode()">' + (unlock.busy ? 'Sending&hellip;' : 'Email me a code') + '</button>' +
          '<p class="small muted">No password. We email you a code each time you sign in.</p>';
      }
      if (unlock.err) h += '<p class="err">' + esc(unlock.err) + '</p>';
      return h;
    }

    function unlockHTML() {
      var C = window.Cloud;
      var url = String((window.CONFIG || {}).checkoutUrl || '').trim();
      var h = '<div class="page unlock">' + pageHead(unlock.signinOnly ? 'Sign in' : 'Unlock SAT LockIn', '');
      h += '<section class="unlock-box">';

      if (unlock.stage === 'confirming') {
        h += '<div class="hc-done spin">' + ic('spark') + '</div><h2>Finishing up&hellip;</h2>' +
          '<p class="muted">Confirming your payment. This takes a few seconds.</p>' +
          (unlock.tries > 8 ? '<p class="small">Taking a while? <button class="link-btn" onclick="APP.recheck()">Check again</button>. ' +
            'If you are not signed in on this device, <button class="link-btn" onclick="APP.signIn()">sign in</button> with the email you paid with.</p>' : '');
        return h + '</section></div>';
      }
      if (unlock.stage === 'owned' || (C && C.signedIn() && C.paid())) {
        h += '<div class="hc-done">' + ic('check') + '</div><h2>You are all set</h2>' +
          '<p class="muted">Everything is unlocked. Your coach is preparing your first session.</p>' +
          '<button class="btn primary xl" onclick="APP.go(\'home\')">Let’s go ' + ic('arrow') + '</button>';
        return h + '</section></div>';
      }

      if (!unlock.signinOnly) {
        h += '<div class="price-tag"><b>' + esc(price()) + '</b><span>one time, no subscription</span></div>' +
          '<ul class="ticks">' +
          '<li>' + ic('check') + 'A 10-minute session every day, prepared by your coach</li>' +
          '<li>' + ic('check') + 'Practice any move, as much as you want</li>' +
          '<li>' + ic('check') + 'Paste your Bluebook misses</li>' +
          '<li>' + ic('check') + 'Progress on your phone and laptop</li></ul>';
      }

      if (!C || !C.enabled) {
        h += '<p class="note-warn">Accounts are not switched on for this copy, so there is nothing to unlock.</p>';
      } else if (!C.signedIn()) {
        h += '<div class="step-lbl">' + (unlock.signinOnly ? '' : 'Step 1 of 2: sign in') + '</div>' + authFormHTML();
      } else if (!unlock.signinOnly) {
        h += '<div class="step-lbl">Step 2 of 2: pay</div><p class="muted">Signed in as <b>' + esc(C.profile && C.profile.email) + '</b></p>';
        h += url
          ? '<a class="btn primary xl" href="' + esc(checkoutLink(url)) + '" rel="noopener">Pay ' + esc(price()) + ' ' + ic('arrow') + '</a>' +
            '<p class="small muted">Payment happens on a secure checkout page. This app never sees your card.</p>' +
            '<p class="small">Already paid? <button class="link-btn" onclick="APP.recheck()">Check again</button></p>'
          : '<button class="btn primary xl" disabled>Checkout is not connected yet</button>';
      }
      return h + '</section></div>';
    }

    function confirmPurchase() {
      var C = window.Cloud;
      if (!C || !C.enabled) return;
      if (!C.signedIn()) { unlock.tries = 99; render(); return; }
      if (C.paid()) { unlock.stage = 'owned'; coach.day = null; ensureCoach(); if (view === 'unlock') render(); return; }
      if (unlock.tries > 20) { render(); return; }
      unlock.tries++;
      setTimeout(function () {
          C.pullAll().then(function () { confirmPurchase(); });
      }, 2500);
      if (view === 'unlock') render();
    }

    /* ============================================================
       LANDING: what this is, in one screen and a demo
       ============================================================ */
    var demo = { picked: null, qid: 'm024' };

    function demoHTML() {
      var q = ALLQ[demo.qid];
      if (!q) return '';
      var tg = window.tagsFor(q);
      var h = '<div class="demo"><div class="eyebrow">Try one</div><div class="stem">' + q.prompt + '</div><div class="demo-choices">';
      q.choices.forEach(function (c, i) {
          var cls = 'demo-choice';
          if (demo.picked !== null) cls += i === q.answer ? ' right' : i === demo.picked ? ' wrong' : ' dim';
          h += '<button class="' + cls + '" onclick="APP.demoPick(' + i + ')"><span class="ltr">' + LETTERS[i] + '</span>' + c + '</button>';
      });
      h += '</div>';
      if (demo.picked === null) {
        h += '<p class="small muted">Pick one. Nothing is saved.</p>';
      } else {
        var k = demo.picked === q.answer
          ? (Object.keys(tg.traps).filter(function (x) { return tg.traps[x] === 'wrong-target'; })[0] || Object.keys(tg.traps)[0])
          : demo.picked;
        var tp = window.TRAPS[tg.traps[k]];
        var st = window.STRATS[tg.strat];
        var right = demo.picked === q.answer;
        /* A first-time visitor does not know our words yet, so the reveal
           teaches them: the trap (why a wrong answer looked right, and how to
           dodge it) and the move (the strategy the question tests), each in
           plain words about THIS question. */
        h += '<div class="demo-reveal">' +
          '<p class="demo-verdict"><b>' + (right ? 'Right, it is ' : 'Not quite. The answer is ') +
            LETTERS[q.answer] + ', ' + q.choices[q.answer] + '.</b></p>' +
          '<div class="demo-part"><div class="demo-label">The trap <span>a wrong answer built to look right</span></div>' +
            '<p><b>' + esc(tp.name) + '.</b> ' +
            (right ? 'Look at ' + LETTERS[k] + ', ' + q.choices[k] + '. ' : 'You picked ' + LETTERS[k] + ', ' + q.choices[k] + '. ') +
            (q.traps && q.traps[k] ? q.traps[k] + ' ' : '') + 'The SAT puts it there on purpose.</p>' +
            '<p class="demo-fix"><b>Next time:</b> ' + esc(tp.fix) + '</p></div>' +
          '<div class="demo-part"><div class="demo-label">The move <span>the strategy this question tests</span></div>' +
            '<p><b>' + esc(st.name) + '.</b> ' + (q.strategy || esc(st.move)) + '</p>' +
            '<ol class="demo-steps">' + q.steps.slice(0, 2).map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol></div>' +
          '<p class="demo-why">Every SAT question tests one move, and every wrong answer is a trap built from a common slip. SAT LockIn trains you to spot both, so the traps stop working on you.</p></div>';
      }
      return h + '</div>';
    }

    function landingHTML() {
      var started = window.Spot.reps().length > 0;
      var h = '<div class="page landing"><header class="topbar"><span class="wordmark">' + wordmark() + '</span></header>';
      h += '<section class="land-hero"><h1>Spot the move.<br><span>Then solve it.</span></h1>' +
        '<p class="lead">On the SAT nobody tells you which strategy a question wants. SAT LockIn trains exactly that: ' +
        'read the question, name the move, work it. Ten minutes a day.</p>' +
        '<div class="actions left"><button class="btn primary xl" onclick="APP.go(\'home\')">' + (started ? 'Back to practice' : 'Try today’s question free') + ' ' + ic('arrow') + '</button>' +
        (full() ? '' : '<button class="btn soft xl" onclick="APP.unlock()">Unlock everything, ' + esc(price()) + '</button>') + '</div></section>';

      h += demoHTML();

      h += '<section class="how"><h2>How it works</h2><ol class="how-list">' +
        '<li><b>Name the move.</b> Each question shows up with no label, like on test day. You pick the strategy it wants.</li>' +
        '<li><b>Work it.</b> Then you solve it with that move, one step at a time, and see why each wrong answer looks right.</li>' +
        '<li><b>Lock it in.</b> Your coach picks tomorrow’s questions from what you mixed up today, until all ' + moveIds().length + ' moves stick.</li></ol></section>';

      /* Launch: until Stripe is set up on the server, everything is free and
         the page says so instead of quoting a price nobody can pay. */
      if (!(window.Cloud && window.Cloud.payments)) {
        h += '<section class="unlock-card plain"><div class="uc-tag">' + ic('star') + 'Launch</div><h2>Free during launch</h2>' +
          '<ul class="ticks"><li>' + ic('check') + 'Daily LockIn is free, no account needed</li>' +
          '<li>' + ic('check') + 'Sign in with your email to get your coach and paste your Bluebook misses</li>' +
          '<li>' + ic('check') + 'Works on a phone or a laptop</li></ul></section>';
      } else
      h += '<section class="unlock-card plain"><div class="uc-tag">' + ic('star') + 'One price</div><h2>' + esc(price()) + ', once</h2>' +
        '<ul class="ticks"><li>' + ic('check') + 'Daily LockIn is free forever, no account needed</li>' +
        '<li>' + ic('check') + 'One payment unlocks everything else. No subscription, no ads.</li>' +
        '<li>' + ic('check') + 'Works on a phone or a laptop</li></ul>' +
        (full() ? '' : '<button class="btn primary" onclick="APP.unlock()">Unlock for ' + esc(price()) + '</button>') + '</section>';

      h += '<p class="fine">Not a replacement for Bluebook: take full practice tests there and bring your misses here. ' +
        'These questions are written to the SAT format, not taken from College Board, and the app never predicts a score.</p>';
      return h + '</div>';
    }

    /* ============================================================
       ACTIONS
       ============================================================ */
    var APP = {
      go: function (v) {
        closeModal();
        var c = document.querySelector('.confetti'); if (c) c.remove();
        if (v !== 'session') sess = null;
        view = v; render();
      },
      closeModal: closeModal,

      /* ---------- sessions ---------- */
      startToday: function () {
        var D = window.Daily;
        var pick = D.isDone() ? null : D.pick();
        if (pick) D.claim(pick);
        if (!full()) {
          if (!pick) { toast('Today’s question is done. See you tomorrow.'); return; }
          startRound('daily', [pick.qid], { dailyDate: pick.date });
          return;
        }
        var next = nextRoundQids(pick ? pick.qid : null);
        var qids = (pick ? [pick.qid] : []).concat(next.qids.slice(0, 8));
        startRound('today', qids, { dailyDate: pick ? pick.date : null, line: next.line });
        if (next.coach) prepareNext();
      },
      practiceMore: function () {
        if (!needFull()) return;
        var next = nextRoundQids(null);
        startRound('practice', next.qids.slice(0, 8), { line: next.line });
        if (next.coach) prepareNext();
      },
      focus: function (id) {
        if (!needFull()) return;
        startRound('focus', null, { focus: id });
      },
      pick: function (id) {
        if (!sess || sess.phase !== 'ask') return;
        var r = sess.round, it = r.items[r.i];
        var isDaily = r.i === sess.dailyIdx;
        window.Spot.record(it, id, isDaily ? sess.dailyDate : null);
        if (isDaily) window.Daily.record(sess.dailyDate, it.qid, it.strat, it.right === true);
        sess.run = it.right ? sess.run + 1 : 0;
        sess.best = Math.max(sess.best, sess.run);
        sess.phase = 'named'; render();
      },
      work: function () { if (sess) { sess.phase = 'work'; sess.step = 0; sess.answer = false; render(); } },
      step: function (all) {
        if (!sess) return;
        var q = ALLQ[sess.round.items[sess.round.i].qid];
        sess.step = all ? q.steps.length : Math.min(q.steps.length, sess.step + 1);
        render();
      },
      answer: function () { if (sess) { sess.answer = true; render(); } },
      next: function () {
        if (!sess) return;
        var r = sess.round;
        if (r.i < r.items.length - 1) {
          r.i++; sess.phase = 'ask'; sess.step = 0; sess.answer = false;
        } else {
          sess.phase = 'done';
          var right = r.items.filter(function (x) { return x.right; }).length;
          sess.celebrate = right / r.items.length >= 0.75 || Object.keys(lockedSet()).some(function (id) { return !sess.before[id]; });
          if (sess.kind === 'today') store(TODAY_KEY, { day: window.Daily.todayKey() });
          window.Cloud && window.Cloud.flushQueue && window.Cloud.flushQueue();
        }
        render();
      },
      exitSession: function () {
        var r = sess && sess.round;
        if (r && sess.phase !== 'done' && r.i > 0) {
          openModal('Stop here?', '<p>What you have answered so far is saved.</p><div class="actions">' +
            '<button class="btn primary" onclick="APP.closeModal()">Keep going</button>' +
            '<button class="btn soft" onclick="APP.go(\'home\')">Stop</button></div>');
          return;
        }
        APP.go('home');
      },
      guide: function (id) {
        if (!window.STRATS[id]) return;
        openModal(window.STRATS[id].name, guideHTML(id));
      },

      /* ---------- paste ---------- */
      openPaste: function () { if (!needFull()) return; view = 'paste'; render(); },
      azText: function (v) { az.text = v; },
      azPick: function (v) { az.picked = v; },
      azGuess: function (v) { az.guess = v; },
      pasteReset: function () { az = { text: '', picked: '', guess: '', busy: false, res: null, err: '' }; render(); },
      pasteRun: function () {
        if (!needFull()) return;
        var box = document.getElementById('az-text'); if (box) az.text = box.value;
        if (az.text.trim().length < 40) { toast('Paste the whole question, with the choices'); return; }
        az.busy = true; az.err = ''; az.res = null; render();
        var prompt = 'Question pasted by the student:\n\n' + az.text.trim() +
          (az.picked.trim() ? '\n\nThe student answered: ' + az.picked.trim() : '') +
          '\n\nClassify it against the catalog and return only the JSON object.';
        window.Cloud.ask('analyze', prompt, catalogContext()).then(function (r) {
            az.busy = false;
            var parsed = azParse(r.text);
            if (!parsed) az.err = 'That came back in a shape the app could not read. Try again.';
            else if (parsed.ok === false) az.err = parsed.reason || 'That does not look like a full SAT question.';
            else {
              az.res = azClean(parsed);
              recordPasted(az.res);
              /* A guess on a real miss is the best naming rep there is, so it
                 counts, but only when the classification is confident. */
              if (az.guess && az.res.strategy && az.res.confidence !== 'low') {
                window.Spot.record({ qid: 'pasted', strat: az.res.strategy }, az.guess);
              }
            }
            render();
        }).catch(function (e) {
            az.busy = false;
            if (e.purchase) { APP.unlock(); return; }
            az.err = e.message || 'Could not reach the AI. Try again in a moment.'; render();
        });
      },

      /* ---------- unlock and accounts ---------- */
      unlock: function () {
        closeModal();
        unlock.signinOnly = false; unlock.err = '';
        if (unlock.stage === 'owned' || unlock.stage === 'confirming') unlock.stage = 'email';
        view = 'unlock'; render();
      },
      signIn: function () {
        closeModal();
        unlock.signinOnly = true; unlock.err = ''; unlock.stage = 'email';
        view = 'unlock'; render();
      },
      sendCode: function () {
        var input = document.getElementById('auth-email');
        if (input) unlock.email = input.value.trim();
        if (!/.+@.+\..+/.test(unlock.email)) { unlock.err = 'That email does not look right.'; render(); return; }
        unlock.busy = true; unlock.err = ''; render();
        window.Cloud.sendCode(unlock.email).then(function () {
            unlock.busy = false; unlock.stage = 'code'; render();
            var c = document.getElementById('auth-code'); if (c) c.focus();
        }).catch(function (e) { unlock.busy = false; unlock.err = e.message || 'Could not send the code.'; render(); });
      },
      verifyCode: function () {
        var input = document.getElementById('auth-code');
        var code = input ? input.value.trim() : '';
        if (code.length < 6) { unlock.err = 'Enter all six digits.'; render(); return; }
        unlock.busy = true; unlock.err = ''; render();
        window.Cloud.verifyCode(unlock.email, code).then(function () {
            unlock.busy = false; unlock.stage = 'email';
            coach.day = null; ensureCoach();
            if (window.Cloud.paid() || unlock.signinOnly || !window.Cloud.payments) {
              view = 'home'; render();
              toast(window.Cloud.paid() ? 'Welcome back. Everything is unlocked.' : 'Signed in');
            } else render();
        }).catch(function (e) { unlock.busy = false; unlock.err = e.message || 'That code did not work.'; render(); });
      },
      authBack: function () { unlock.stage = 'email'; unlock.err = ''; render(); },
      recheck: function () {
        unlock.stage = 'confirming'; unlock.tries = 0; render();
        window.Cloud.pullAll().then(confirmPurchase);
      },
      account: function () {
        var C = window.Cloud, p = C && C.profile;
        var h = '';
        if (C && C.signedIn()) {
          h += '<p class="acct-email">' + ic('user') + '<b>' + esc((p && p.email) || '') + '</b></p>';
          if (C.payments) {
            h += C.paid() ? '<p class="owned">' + ic('check') + 'Full version unlocked</p>'
              : '<div class="actions left"><button class="btn primary" onclick="APP.unlock()">Unlock for ' + esc(price()) + '</button></div>';
          }
          h += '<p class="muted small">Your progress is saved to your account, so it follows you to any device you sign in on.</p>' +
            '<div class="actions left"><button class="btn soft sm" onclick="APP.signOut()">Sign out</button></div>';
        } else if (C && C.enabled) {
          h += '<p>Sign in to keep your progress on every device' + (C.payments ? ' and to unlock the full version' : '') + '.</p>' +
            '<div class="actions left"><button class="btn primary" onclick="APP.signIn()">Sign in</button></div>';
        }
        h += '<hr><p class="muted small">Start over: clears your progress and streak on this device.</p>' +
          '<div class="actions left"><button class="btn soft sm" onclick="APP.resetData()">Clear my progress</button></div>';
        openModal('Account', h);
      },
      signOut: function () {
        window.Cloud.signOut().then(function () { closeModal(); coach = { day: null, session: null, left: 0, busy: false }; view = 'home'; render(); toast('Signed out'); });
      },
      resetData: function () {
        openModal('Clear your progress?', '<p>This deletes your naming record, your streak, and your daily history in this browser. It cannot be undone.</p>' +
          '<div class="actions"><button class="btn soft" onclick="APP.closeModal()">Cancel</button>' +
          '<button class="btn danger" onclick="APP.confirmReset()">Clear everything</button></div>');
      },
      confirmReset: function () {
        window.Store.reset(); window.Spot.reset();
        try { localStorage.removeItem(TODAY_KEY); localStorage.removeItem(COACH_USED); } catch (e) {}
        closeModal(); view = 'home'; render(); toast('Progress cleared');
      },

      demoPick: function (i) { demo.picked = i; render(); }
    };
    window.APP = APP;

    /* ---------------- keyboard: 1 to 4 to name the move ---------------- */
    function onKey(e) {
      if (view !== 'session' || !sess || sess.phase !== 'ask') return;
      var tg = (e.target.tagName || '').toLowerCase();
      if (tg === 'input' || tg === 'textarea') return;
      if (!document.getElementById('modal-root').classList.contains('hidden')) return;
      var it = sess.round.items[sess.round.i];
      var k = ['1', '2', '3', '4'].indexOf(e.key);
      if (k >= 0 && k < it.options.length) { e.preventDefault(); APP.pick(it.options[k]); }
    }

    boot();
})();
