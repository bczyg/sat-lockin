/* ============================================================
   SAT LockIn: UI layer
   ============================================================ */
(function () {
    'use strict';

    var shell = document.getElementById('shell');
    var S = null;            // active Session
    var view = 'home';       // landing | home | strategies | traps | analyze | cards | auth | class | exam | review
    var reviewData = null;   // attempt being reviewed
    var dailyPending = null; // set while today's Daily LockIn question is open
    var reviewFilter = 'all';
    var ALLQ = {};
    var scrollMemo = null;
    var LETTERS = ['A', 'B', 'C', 'D'];

    var PALETTES = [
      { id:'focus',  name:'Focus',  sw:['#0e7490','#ff7a5c','#e0f4fa'], ds:'Calm aqua with a warm accent. The default.' },
      { id:'arcade', name:'Arcade', sw:['#2563eb','#a3e635','#e6edfe'], ds:'Electric blue and lime. Most energy.' },
      { id:'sunset', name:'Sunset', sw:['#be185d','#fbbf24','#fce7f0'], ds:'Magenta and amber. Warmest.' },
      { id:'grove',  name:'Grove',  sw:['#047857','#fdba74','#e0f5ee'], ds:'Forest green and peach. Quietest.' },
      { id:'violet', name:'Violet', sw:['#4f46e5','#ffd166','#eef0fe'], ds:'Indigo and sunshine.' }
    ];
    function currentPalette() {
      try { return localStorage.getItem('decoy.palette') || 'focus'; } catch (e) { return 'focus'; }
    }
    function applyPalette(id) {
      /* data-palette, not data-theme: the artifact host stamps data-theme on
         the root element for light and dark, and would collide with it. */
      document.documentElement.setAttribute('data-palette', id);
      try { localStorage.setItem('decoy.palette', id); } catch (e) {}
    }

    var authState = { email: '', stage: 'email', busy: false, msg: '', err: '' };
    var classState = { roster: null, traps: null, loading: false };

    /* State for a question pasted in from a real practice test. */
    var az = {
      text: '',
      picked: '',
      busy: false,
      res: null,
      err: '',
      saved: false,
      mStrat: '',
      mTrap: ''
    };

    /* Which traps actually occur on questions of a given skill, most common
       first. The picker is built from the bank rather than a fixed list, so the
       options a student sees are always the ones that skill can produce. */
    function boot() {
      applyPalette(currentPalette());
      /* Someone who has never answered a question here has no reason yet to
         care about either list, so they get the argument first. */
      try {
        if (!localStorage.getItem('lockin.seenlanding') && !window.Store.agg().total.seen) {
          view = 'landing';
          localStorage.setItem('lockin.seenlanding', '1');
        }
      } catch (e) {}
      (window.RW_BANK || []).concat(window.MATH_BANK || []).forEach(function (q) { ALLQ[q.id] = q; });
      if (window.Cloud) {
        /* The server is asked what it supports after the first paint, so this
           fires a moment later. Practice is available either way; the sign-in
           screen only appears once we know accounts actually work. */
        window.Cloud.on(function () {
          var C = window.Cloud;
          var skipped = false;
          try { skipped = !!localStorage.getItem('decoy.skipauth'); } catch (e) {}
          if (C.enabled && !C.signedIn() && !skipped && view === 'home') {
            view = 'auth';
          }
          if (view === 'auth' || view === 'home' || view === 'class' || view === 'strategies' || view === 'traps' || view === 'analyze') render();
        });
      }
      document.addEventListener('keydown', onKey);
      document.getElementById('modal-root').addEventListener('click', function (e) {
          if (e.target.dataset && e.target.dataset.close) closeModal();
      });
      render();
    }


    /* ---------------- icons ----------------
       Inline stroke icons instead of emoji: they inherit color, stay crisp,
       and do not render differently on every operating system. */
    var ICONS = {
      clock:  '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
      layers: '<path d="M4 8h7M4 12h7M4 16h7"/><rect x="14" y="6" width="6" height="12" rx="1.5"/>',
      target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.2"/>',
      scope:  '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.4-4.4"/>',
      flag:   '<path d="M6 20V5h9l-1.5 3.5L15 12H6"/>',
      pen:    '<path d="M4 20l4-1 9-9-3-3-9 9z"/><path d="M14 7l3 3"/>',
      calc:   '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h2m3 0h3M8 16h2m3 0h3"/>',
      sheet:  '<path d="M6 3h9l3 3v15H6z"/><path d="M9 9h6M9 13h6M9 17h3"/>',
      close:  '<path d="M6 6l12 12M18 6L6 18"/>',
      bolt:   '<path d="M13 3L5 14h5l-1 7 8-11h-5z"/>',
      check:  '<path d="M5 13l4 4 10-10"/>',
      cloud:  '<path d="M7 18h9a3.5 3.5 0 0 0 .3-7A5 5 0 0 0 7 12a3 3 0 0 0 0 6z"/>',
      user:   '<circle cx="12" cy="8" r="3.5"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/>',
      people: '<circle cx="9" cy="8" r="3"/><path d="M3 19a6 6 0 0 1 12 0"/><path d="M16 6.5a3 3 0 0 1 0 5.8M17 19a5.6 5.6 0 0 0-1.6-3.9"/>'
    };
    function ic(name, cls) {
      return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (ICONS[name] || '') + '</svg>';
    }

    /* ---------------- small helpers ---------------- */
    function esc(s) {
      return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    function fmt(s) { return window.SATP.fmtTime(s); }
    function pct(a, b) { return b ? Math.round(100 * a / b) : 0; }
    function dfLabel(d) { return d === 'E' ? 'Easier' : d === 'M' ? 'Medium' : 'Harder'; }
    function toast(msg) {
      var t = document.createElement('div');
      t.className = 'toast'; t.textContent = msg;
      document.body.appendChild(t);
      setTimeout(function () { t.remove(); }, 2200);
    }
    function openModal(title, html) {
      document.getElementById('modal-title').textContent = title;
      document.getElementById('modal-body').innerHTML = html;
      document.getElementById('modal-root').classList.remove('hidden');
    }
    function closeModal() { document.getElementById('modal-root').classList.add('hidden'); }
    function stripTags(s) { return String(s).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(); }
    function snippet(q, n) {
      var t = stripTags(q.prompt || '');
      if (t.length > n) t = t.slice(0, n - 1) + '…';
      return t;
    }
    function dateLabel(iso) {
      var d = new Date(iso);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    }

    /* ---------------- render dispatch ---------------- */
    function render() {
      if (view === 'exam') rememberScroll();
      var html =
      view === 'home' ? homeHTML() :
      view === 'landing' ? landingHTML() :
      view === 'strategies' ? strategiesHTML() :
      view === 'traps' ? trapsHTML() :
      view === 'analyze' ? analyzeHTML() :
      view === 'cards' ? cardsHTML() :
      view === 'auth' ? authHTML() :
      view === 'class' ? classHTML() :
      view === 'exam' ? examHTML() :
      view === 'review' ? reviewHTML() : '';
      shell.innerHTML = html;
      if (view === 'exam') { restoreScroll(); focusSpr(); }
      window.scrollTo(0, 0);
    }
    function rememberScroll() {
      var l = shell.querySelector('.pane-left'), r = shell.querySelector('.pane-right');
      if (!S || (!l && !r)) return;
      scrollMemo = { mi: S.mi, qi: S.qi, l: l ? l.scrollTop : 0, r: r ? r.scrollTop : 0 };
    }
    function restoreScroll() {
      if (!scrollMemo || !S || scrollMemo.mi !== S.mi || scrollMemo.qi !== S.qi) return;
      var l = shell.querySelector('.pane-left'), r = shell.querySelector('.pane-right');
      if (l) l.scrollTop = scrollMemo.l;
      if (r) r.scrollTop = scrollMemo.r;
    }
    function focusSpr() {
      var i = shell.querySelector('#spr-input');
      if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
    }

    /* ============================================================
       HOME
       ============================================================ */
    function wordmark() {
      var w = window.BRAND.wordmark || [window.BRAND.name, ''];
      return esc(w[0]) + (w[1] ? ' <span>' + esc(w[1]) + '</span>' : '');
    }

    /* what to do next, chosen from her own data */
    /* The whole app is two catalogs and a daily loop through them, so home
       is: how you are doing, one move to work, one trap to work, the two
       lists, and the way back in from a real practice test. Nothing else. */
    /* The app is two catalogs and a daily loop through them, so home is:
       today's one question, the two lists, and the way back in from a real
       practice test. Nothing else gets to compete. */
    function homeHTML() {
      var d = window.Store.data();
      var sum = window.Store.coverageSummary();
      var C = window.Cloud;
      var firstName = String(d.name || '').split(' ')[0];
      var streak = window.Daily.streak();

      var h = '<div class="home">';

      h += '<div class="greet"><div>' +
      '<div class="hi">' + (firstName ? 'Hi ' + esc(firstName) : wordmark()) + '</div>' +
      '<div class="tagline">' + esc(window.BRAND.tagline) + '</div>' +
      '</div><div class="chips">';
      if (streak > 0) h += '<span class="chip streak">' + ic('bolt') + streak + '-day streak</span>';
      if (C && C.enabled) {
        h += '<button class="chip acct" onclick="APP.account()">' + ic('user') +
        esc(C.signedIn() && C.profile ? (C.profile.display_name || 'Account') : 'Sign in') + '</button>';
      } else {
        h += '<button class="chip acct" onclick="APP.rename()">' + ic('user') + esc(d.name || 'You') + '</button>';
      }
      if (C && C.signedIn() && C.profile && C.profile.role === 'teacher') {
        h += '<button class="chip acct" onclick="APP.openClass()">' + ic('people') + 'Class</button>';
      }
      h += '</div></div>';

      h += dailyHTML();

      h += '<div class="two-up">';
      h += '<button class="big-entry" onclick="APP.go(\'strategies\')">' +
      '<div class="be-num">' + sum.strats.mastered + '<span>/' + sum.strats.total + '</span></div>' +
      '<div class="be-name">Strategies</div>' +
      '<div class="be-sub">The moves that get you to the answer. ' + sum.strats.learning + ' in progress.</div></button>';
      h += '<button class="big-entry spot" onclick="APP.go(\'traps\')">' +
      '<div class="be-num">' + sum.traps.mastered + '<span>/' + sum.traps.total + '</span></div>' +
      '<div class="be-name">Traps</div>' +
      '<div class="be-sub">The ways a wrong answer is built. ' + sum.traps.learning + ' in progress.</div></button>';
      h += '</div>';

      h += '<button class="paste-entry" onclick="APP.go(\'analyze\')">' +
      '<div class="pe-icon">' + ic('scope') + '</div><div>' +
      '<div class="pe-name">Missed one in Bluebook? Paste it here.</div>' +
      '<div class="pe-sub">You get the move it was testing and the trap the wrong answer was built from, ' +
      'and it joins your two lists.</div></div></button>';

      h += '<div class="home-foot">' +
      '<button class="link-btn" onclick="APP.go(\'landing\')">Why strategies decide the score</button>' +
      '</div>';
      h += '</div>';
      return h;
    }

    /* One question a day, rotating through the moves in order. The point is
       the habit, so a finished day says so plainly and does not immediately
       push another set. */
    function dailyHTML() {
      var D = window.Daily;
      var pick = D.pick();
      if (!pick) return '';
      var strat = window.STRATS[pick.strat];
      var day = D.dayIndex();
      var cycle = D.cycleLength();
      var done = D.isDone();
      var res = D.resultFor();

      var h = '<div class="daily' + (done ? ' done' : '') + '">';
      h += '<div class="d-top"><div class="d-kicker">' + ic('bolt') + 'Daily LockIn</div>' +
      '<div class="d-day">Move ' + day + ' of ' + cycle + '</div></div>';

      if (!done) {
        h += '<h2>Today\'s move: ' + esc(strat.name) + '</h2>';
        h += '<p class="d-move">' + esc(strat.move) + '</p>';
        h += '<button class="btn big d-go" onclick="APP.startDaily()">Start today\'s question</button>';
        h += '<p class="d-note">One question. Two minutes. The rotation covers all ' + cycle +
        ' moves, so nothing gets skipped.</p>';
      } else {
        h += '<h2>' + (res && res.correct ? 'Got it.' : 'Logged it.') + ' ' + esc(strat.name) + '</h2>';
        h += '<p class="d-move">' +
        (res && res.correct
          ? 'That move is working. Tomorrow rotates to the next one.'
          : 'That is the useful kind of miss, because now you know which move to drill.') + '</p>';
        h += '<div class="card-actions">' +
        '<button class="btn" onclick="APP.drillStrat(\'' + pick.strat + '\')">Practice this move properly</button>' +
        '<button class="btn ghost" onclick="APP.reviewDaily()">See the explanation again</button></div>';
      }

      h += '<div class="d-strip">';
      D.recent(7).forEach(function (x) {
          var cls = x.answered ? (x.correct ? 'ok' : 'miss') : (x.today ? 'now' : 'skip');
          h += '<span class="d-dot ' + cls + '" title="' + x.date + '"></span>';
      });
      h += '<span class="d-strip-lbl">last 7 days</span></div>';

      h += '</div>';
      return h;
    }
    function firstUnmet(kind) {
      var cov = window.Store.coverage();
      var book = kind === 'strat' ? window.STRATS : window.TRAPS;
      var seen = kind === 'strat' ? cov.strats : cov.traps;
      var ids = Object.keys(book).filter(function (id) { return !book[id].meta; });
      var fresh = ids.filter(function (id) { return !seen[id] || !seen[id].n; });
      return (fresh.length ? fresh : ids)[0] || null;
    }

    function aiPanelHTML() {
      if (!window.Cloud || !window.Cloud.aiEnabled) return '';
      if (!window.Cloud.signedIn()) return '';
      return '<div class="help-card ai"><h4>Want it explained another way?</h4>' +
      '<div id="ai-thread" class="ai-thread"></div>' +
      '<div class="ai-controls">' +
      '<input id="ai-input" placeholder="Ask about this question\u2026" ' +
      'onkeydown="if(event.key===\'Enter\'){event.preventDefault();APP.aiAsk();}">' +
      '<button class="btn sm" onclick="APP.aiAsk()">Ask</button>' +
      '</div>' +
      '<div class="card-actions" style="margin-top:8px">' +
      '<button class="btn subtle sm" onclick="APP.aiExplain()">Explain it a different way</button></div></div>';
    }

    /* ---------------- AI tutor plumbing ---------------- */
    function questionContext(q, st) {
      if (!q) return '';
      var lines = [];
      lines.push('Section: ' + (q.section === 'rw' ? 'Reading and Writing' : 'Math') + ' / ' + q.domain + ' / ' + q.skill);
      if (q.blurb) lines.push('Note: ' + stripTags(q.blurb));
      if (q.passage) lines.push('Passage: ' + stripTags(q.passage));
      if (q.figure) lines.push('Figure data: ' + stripTags(q.figure));
      lines.push('Question: ' + stripTags(q.prompt));
      if (q.type === 'spr') {
        lines.push('This is a fill-in question. Accepted answers: ' + (q.answers || []).join(' or '));
        if (st && st.text) lines.push('The student entered: ' + st.text);
      } else {
        (q.choices || []).forEach(function (c, i) { lines.push(LETTERS[i] + ') ' + stripTags(c)); });
        lines.push('Correct answer: ' + LETTERS[q.answer]);
        if (st && st.choice !== null && st.choice !== undefined) lines.push('The student chose: ' + LETTERS[st.choice]);
        var tg = window.tagsFor(q);
        if (st && st.choice !== null && tg.traps[st.choice] && window.TRAPS[tg.traps[st.choice]]) {
          lines.push('That wrong answer is an example of this trap type: ' + window.TRAPS[tg.traps[st.choice]].name +
            ' -- ' + window.TRAPS[tg.traps[st.choice]].tell);
        }
      }
      lines.push('The explanation the student already read: ' + q.steps.map(stripTags).join(' '));
      return lines.join('\n');
    }

    function mdLite(t) {
      return esc(t)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .split(/\n\n+/).map(function (p) { return '<p>' + p.replace(/\n/g, '<br>') + '</p>'; }).join('');
    }

    function askTutor(task, prompt, context) {
      var box = document.getElementById('ai-thread');
      if (box) {
        box.innerHTML += '<div class="ai-you">' + esc(prompt) + '</div>' +
        '<div class="ai-wait" id="ai-wait">Thinking\u2026</div>';
        box.scrollTop = box.scrollHeight;
      }
      window.Cloud.ask(task, prompt, context).then(function (r) {
          var w = document.getElementById('ai-wait');
          if (w) {
            w.outerHTML = '<div class="ai-answer">' + mdLite(r.text) +
            '<div class="ai-meta">' + esc(r.model) +
            (r.remaining !== undefined ? ' \u00b7 ' + r.remaining + ' left today' : '') + '</div></div>';
          }
          var b2 = document.getElementById('ai-thread'); if (b2) b2.scrollTop = b2.scrollHeight;
      }).catch(function (e) {
          var w = document.getElementById('ai-wait');
          if (w) w.outerHTML = '<div class="ai-err">' + esc(e.message || 'The tutor could not answer.') + '</div>';
      });
    }



    /* ============================================================
       STRATEGY CARDS
       The moves have to be available under time pressure, which means
       recall practice, not rereading. Spaced repetition on a Leitner
       schedule: get one right and it comes back later, miss it and it
       comes back soon.

       The tone here is deliberately warm. Missing a card is the normal
       case and the point of the exercise, so nothing scolds.
       ============================================================ */
    var CKEY = 'decoy.cards.v1';
    var BOX_DAYS = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 21 };
    var cards = { current: null, revealed: false, done: 0, streak: 0, justAdvanced: null };

    function cardState() {
      try { return JSON.parse(localStorage.getItem(CKEY)) || {}; } catch (e) { return {}; }
    }
    function saveCardState(d) {
      try { localStorage.setItem(CKEY, JSON.stringify(d)); } catch (e) {}
    }

    /* Which skills actually use this move, so the prompt is a real situation
       rather than an abstract definition. */
    function skillsForStrat(id) {
      var out = [];
      window.RW_BANK.concat(window.MATH_BANK).forEach(function (q) {
        if (window.tagsFor(q).strat !== id && !(window.SKILL_STRAT[q.skill] === id)) return;
        if (window.tagsFor(q).strat !== id) return;
        if (out.indexOf(q.skill) < 0) out.push(q.skill);
      });
      return out;
    }

    function cardDeck() {
      var st = cardState();
      var now = Date.now();
      return Object.keys(window.STRATS).map(function (id) {
        var c = st[id] || { box: 1, due: 0, seen: 0, right: 0 };
        return {
          id: id, box: c.box, due: c.due, seen: c.seen, right: c.right,
          isDue: !c.due || c.due <= now,
          locked: c.box >= 4
        };
      });
    }

    function dueCards() {
      return cardDeck().filter(function (c) { return c.isDue; })
        .sort(function (a, b) { return a.box - b.box; });
    }

    function lockedCount() {
      return cardDeck().filter(function (c) { return c.locked; }).length;
    }

    function cardsHTML() {
      var deck = cardDeck();
      var due = dueCards();
      var locked = lockedCount();
      var total = deck.length;
      var pct = Math.round(100 * locked / total);

      var h = '<div class="home"><div class="home-head"><div><div class="brand">Strategy cards</div>' +
        '<div class="tagline">Quick recall, so the moves are there when the clock is running. ' +
        'A few minutes beats an hour of rereading.</div></div>' +
        '<button class="btn subtle sm" onclick="APP.go(\'home\')">Back</button></div><div class="home-hr"></div>';

      /* progress, framed as how far along rather than how far short */
      h += '<div class="prog-wrap"><div class="ring" style="--pct:' + pct + '">' +
        '<div class="ring-in"><div class="ring-n">' + locked + '</div>' +
        '<div class="ring-of">of ' + total + '</div></div></div>' +
        '<div class="prog-text"><h3>' + progressLine(locked, total) + '</h3>' +
        '<p>A move counts as locked in once you have recalled it correctly a few times, spread out over days. ' +
        'That spacing is what makes it stick.</p>';
      if (cards.done) h += '<p class="prog-run">' + cards.done + ' reviewed just now' +
        (cards.streak > 1 ? ', ' + cards.streak + ' in a row' : '') + '.</p>';
      h += '</div></div>';

      if (!cards.current) {
        if (!due.length) {
          h += '<div class="card cheer"><h3>Nothing due right now</h3>' +
            '<p>Everything you have reviewed is still holding. Come back tomorrow and the ones that are ' +
            'starting to fade will be waiting. In the meantime, the useful thing is questions.</p>' +
            '<div class="card-actions"><button class="btn" onclick="APP.go(\'strategies\')">Back to the moves</button>' +
            '<button class="btn ghost" onclick="APP.cardsCram()">Review anyway</button></div></div>';
        } else {
          h += '<div class="card cheer"><h3>' + due.length + ' card' + (due.length === 1 ? '' : 's') + ' ready</h3>' +
            '<p>' + (locked === 0
              ? 'First time through. You are not expected to know these yet, so guess freely and let the app sort out what needs repeating.'
              : 'Some of these you will get instantly. Those are the ones that are working.') + '</p>' +
            '<div class="card-actions"><button class="btn" onclick="APP.cardsStart()">Start</button></div></div>';
        }
      } else {
        var meta = window.STRATS[cards.current.id];
        var sk = skillsForStrat(cards.current.id);
        var where = sk.length ? sk.slice(0, 2).join(' or ') : (meta.section === 'rw' ? 'Reading and Writing' : 'Math');
        h += '<div class="flash">';
        h += '<div class="flash-cue">You are on a <strong>' + esc(where) + '</strong> question.</div>';
        h += '<div class="flash-ask">What is the move?</div>';
        if (!cards.revealed) {
          h += '<div class="card-actions" style="justify-content:center;margin-top:26px">' +
            '<button class="btn big" style="max-width:280px" onclick="APP.cardsReveal()">Show me</button></div>' +
            '<p class="flash-hint">Say it out loud first, even roughly. Trying to retrieve it is what builds the habit; ' +
            'reading it again does not.</p>';
        } else {
          h += '<div class="flash-answer"><div class="fa-name">' + meta.name + '</div>' +
            '<p class="fa-move">' + meta.move + '</p>' +
            '<p class="fa-why">' + meta.why + '</p></div>';
          h += '<div class="flash-rate"><div class="fr-q">How did that go?</div>' +
            '<button class="fr-btn good" onclick="APP.cardsRate(\'good\')">I had it</button>' +
            '<button class="fr-btn mid" onclick="APP.cardsRate(\'mid\')">Nearly</button>' +
            '<button class="fr-btn no" onclick="APP.cardsRate(\'no\')">Not yet</button></div>';
          h += '<p class="flash-hint">Answer honestly. Marking something you half-knew as \u201chad it\u201d just means ' +
            'it comes back too late to help.</p>';
        }
        h += '</div>';
        if (cards.justAdvanced) {
          h += '<div class="cheer-toast">' + cards.justAdvanced + '</div>';
        }
      }

      /* the whole deck, so progress is visible rather than hidden in a counter */
      h += '<div class="section-title">Your deck</div><div class="card">';
      ['rw', 'math'].forEach(function (sec) {
        h += '<div class="deck-sec">' + (sec === 'rw' ? 'Reading and Writing' : 'Math') + '</div>';
        deck.filter(function (c) { return window.STRATS[c.id].section === sec; }).forEach(function (c) {
          var meta = window.STRATS[c.id];
          h += '<div class="deck-row"><div>' + meta.name + '</div>' +
            '<div class="boxes">' + [1, 2, 3, 4, 5].map(function (b) {
              return '<span class="bx' + (c.box >= b ? ' on' : '') + (c.locked && b <= c.box ? ' lock' : '') + '"></span>';
            }).join('') + '</div>' +
            '<div class="n">' + (c.locked ? 'locked in' : c.seen ? 'learning' : 'new') + '</div></div>';
        });
      });
      h += '</div></div>';
      return h;
    }

    function progressLine(locked, total) {
      if (locked === 0) return 'Let us find out what you already know';
      if (locked === total) return 'All ' + total + ' moves locked in';
      if (locked < 5) return locked + ' moves locked in, and that is a start';
      if (locked < total / 2) return locked + ' locked in, keep going';
      if (locked < total - 3) return 'Over halfway: ' + locked + ' of ' + total;
      return 'Nearly there, ' + (total - locked) + ' to go';
    }

    /* ============================================================
       LANDING PAGE
       The argument for why strategies matter, made with a real question
       rather than a claim. No score-gain statistics: I have no way to
       measure those honestly, and the mechanism is persuasive on its own.
       ============================================================ */
    var demo = { picked: null, qid: 'm024' };

    function demoQuestion() {
      return window.MATH_BANK.concat(window.RW_BANK).filter(function (q) { return q.id === demo.qid; })[0];
    }

    function landingDemoHTML() {
      var q = demoQuestion();
      if (!q) return '';
      var tg = window.tagsFor(q);
      var h = '<div class="demo"><div class="demo-tag">Try one</div>' +
        '<div class="demo-q">' + q.prompt + '</div><div class="demo-choices">';
      q.choices.forEach(function (c, i) {
        var cls = 'demo-choice';
        if (demo.picked !== null) {
          if (i === q.answer) cls += ' right';
          else if (i === demo.picked) cls += ' wrong';
          else cls += ' dim';
        }
        h += '<button class="' + cls + '" onclick="APP.demoPick(' + i + ')">' +
          '<span class="ltr">' + LETTERS[i] + '</span>' + c + '</button>';
      });
      h += '</div>';

      if (demo.picked === null) {
        h += '<p class="demo-note">Pick one. Nothing is recorded, and there is a point coming.</p>';
      } else if (demo.picked === q.answer) {
        var trapId = tg.traps[Object.keys(tg.traps)[0]];
        var wrongIdx = Object.keys(tg.traps).filter(function (k) {
          return tg.traps[k] === 'wrong-target';
        })[0] || Object.keys(tg.traps)[0];
        var tp = window.TRAPS[tg.traps[wrongIdx]];
        h += '<div class="demo-reveal"><p><strong>Right.</strong> Now look at ' + LETTERS[wrongIdx] +
          ', which is <strong>' + q.choices[wrongIdx] + '</strong>.</p>' +
          '<p>That is not a random number. It is the x-value where the minimum happens, so anyone who did the ' +
          'algebra correctly and then stopped a line too early lands exactly there. It was put in the list for ' +
          'them. The catalog calls it <strong>' + tp.name + '</strong>.</p>' +
          '<p>' + tp.fix + '</p></div>';
      } else {
        var tp2 = window.TRAPS[tg.traps[demo.picked]];
        h += '<div class="demo-reveal"><p><strong>That is the one most people pick.</strong> ' +
          'The answer was ' + LETTERS[q.answer] + '.</p>' +
          '<p>Your choice was not a random wrong number. It is <strong>' + tp2.name + '</strong>: ' +
          tp2.tell + ' Someone wrote it specifically for the person who does the work correctly and then ' +
          'reports the wrong part of it.</p>' +
          '<p><strong>The fix:</strong> ' + tp2.fix + '</p></div>';
      }
      h += '<div class="demo-actions"><button class="btn sm" onclick="APP.demoReset()">Reset</button></div></div>';
      return h;
    }

    function argumentHTML(withLead) {
      var h = '';
      if (withLead) {
        h += '<div class="lead">' +
        '<h1>Every wrong answer on the SAT was<br><span>built to be picked.</span></h1>' +
        '<p class="lead-sub">Nobody writes a wrong answer nobody would choose. Each one encodes a specific, ' +
        'predictable mistake, aimed at a student who almost had it. There are a limited number of those ' +
        'mistakes, they repeat on every test, and they can be learned.</p>' +
        '</div>';
      } else {
        /* The hero above has already made the case, so this leads with the
           evidence instead of a second headline. */
        h += '<div class="section-title">See it on one question</div>' +
        '<p class="lead-sub" style="margin-bottom:18px">Nobody writes a wrong answer nobody would ' +
        'choose. Each one encodes a specific, predictable mistake, aimed at a student who almost had ' +
        'it. Try this one and see which choice tempts you.</p>';
      }

      h += landingDemoHTML();

      h += '<div class="section-title">Why this is worth your time</div><div class="card-grid">';
      h += '<div class="card"><h3>The wrong answers are engineered</h3>' +
        '<p>Test writers build distractors from the errors students actually make: the sign that gets dropped, ' +
        'the quantity that gets reported instead of the one asked for, the word read in its everyday sense. ' +
        'That is why a wrong answer so often feels reasonable. It was designed to.</p></div>';
      h += '<div class="card"><h3>Some lost points are not knowledge gaps</h3>' +
        '<p>There is a real difference between not knowing how to find a vertex and knowing perfectly well ' +
        'and then reporting the x-value. The first needs teaching. The second needs one habit. This app keeps ' +
        'them apart and shows you your own split, rather than telling you a number we cannot measure.</p></div>';
      h += '<div class="card"><h3>The format multiplies early mistakes</h3>' +
        '<p>The digital SAT is adaptive in two stages. How you do on the first module decides whether you get ' +
        'the harder or the easier second module, and that decision caps your section score. Points lost early ' +
        'to a trap cost more than the same points lost late.</p></div>';
      h += '<div class="card"><h3>There is no penalty for guessing</h3>' +
        '<p>A blank and a wrong answer score the same, so a blank is strictly worse than a guess. Knowing that, ' +
        'plus knowing which choice a trap is hiding in, turns a question you cannot finish into one you can ' +
        'still often get.</p></div>';
      h += '</div>';

      h += '<div class="section-title">The two things you learn</div>';
      h += '<div class="card"><div class="two-col">' +
        '<div><h3>' + Object.keys(window.STRATS).length + ' strategies</h3><p>One named move per question type. Predict before you read the choices. ' +
        'Circle the quantity before you solve. Name the relationship before you pick the transition. Each one is ' +
        'a habit, not a fact.</p></div>' +
        '<div><h3>' + Object.keys(window.TRAPS).length + ' traps</h3><p>Every way a wrong answer is built, in six families: it says more than the text ' +
        'allows, it does half the job, it points the right idea the wrong way, it describes the wrong thing, it ' +
        'breaks a grammar rule, or it slips a step.</p></div>' +
        '</div><p class="note" style="margin-top:16px">Those two lists are the whole app. Every day you work one ' +
        'move and one trap, and you watch both lists empty out.</p></div>';

      return h;
    }

    function authHTML() {
      var C = window.Cloud, cfg = window.CONFIG || {};
      var h = '<div class="home landing"><div class="lead-mark">' + wordmark() + '</div>';
      h += argumentHTML(true);
      h += '<div class="section-title">Get started</div>';
      h += '<div class="auth-inline"><div class="auth-card">';
      h += '<div class="auth-mark">' + ic('target') + '</div>';
      h += '<h1>' + esc(window.BRAND.name) + '</h1>';
      h += '<p class="auth-sub">' + esc(window.BRAND.tagline) + '</p>';
      if (cfg.className) h += '<p class="auth-class">' + esc(cfg.className) + '</p>';

      var mailOff = C && C.enabled && C.ready && !C.mail;
      if (mailOff) {
        h += '<p class="auth-warn">Sign-in codes are not being emailed yet, so signing in will not work on this ' +
        'device. Use <strong>Skip for now</strong> below and everything still works, saved in this browser.</p>';
      }

      if (authState.stage === 'email') {
        h += '<label class="fld"><span>Your email</span>' +
        '<input id="auth-email" type="email" autocomplete="email" placeholder="you@school.edu" value="' + esc(authState.email) + '" ' +
        'onkeydown="if(event.key===\'Enter\')APP.sendCode()"></label>';
        h += '<button class="btn big" ' + (authState.busy || mailOff ? 'disabled' : '') + ' onclick="APP.sendCode()">' +
        (authState.busy ? 'Sending&hellip;' : 'Email me a sign-in code') + '</button>';
        h += '<p class="auth-note">We send a 6-digit code. No password to remember, and nothing to install.</p>';
      } else {
        h += '<p class="auth-sent">Code sent to <strong>' + esc(authState.email) + '</strong></p>';
        h += '<label class="fld"><span>6-digit code</span>' +
        '<input id="auth-code" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="123456" ' +
        'onkeydown="if(event.key===\'Enter\')APP.verifyCode()"></label>';
        h += '<button class="btn big" ' + (authState.busy ? 'disabled' : '') + ' onclick="APP.verifyCode()">' +
        (authState.busy ? 'Checking&hellip;' : 'Sign in') + '</button>';
        h += '<p class="auth-note"><button class="link-btn" onclick="APP.authBack()">Use a different email</button> &middot; ' +
        '<button class="link-btn" onclick="APP.sendCode()">Resend the code</button></p>';
      }

      if (authState.err) h += '<p class="auth-err">' + esc(authState.err) + '</p>';
      if (authState.msg) h += '<p class="auth-msg">' + esc(authState.msg) + '</p>';

      h += '<div class="auth-alt"><button class="link-btn" onclick="APP.skipAuth()">Skip for now and practice on this device</button>' +
      '<p class="auth-note">Your work stays in this browser and is not shared with your teacher.</p></div>';
      h += '</div></div>';
      return h;
    }

    /* ============================================================
       CLASS DASHBOARD (teachers)
       ============================================================ */
    function classHTML() {
      var C = window.Cloud;
      var prof = C && C.profile;
      var h = '<div class="home"><div class="home-head"><div><div class="brand">Class</div>' +
      '<div class="tagline">Everyone in ' + esc((prof && prof.class_code) || 'your class') + '. You only see practice data, nothing else.</div></div>' +
      '<button class="btn subtle sm" onclick="APP.go(\'home\')">&larr; Home</button></div><div class="home-hr"></div>';

      if (!prof || !prof.class_code) {
        h += '<div class="card"><h3>Set up a class</h3>' +
        '<p>Create a class, then give students the code. When they enter it, their practice data appears here.</p>' +
        '<label class="fld"><span>Class name</span><input id="cls-name" placeholder="Ms. Alvarez, 11th grade"></label>' +
        '<label class="fld"><span>Class code students will type</span><input id="cls-code" placeholder="ALVAREZ26"></label>' +
        '<div class="card-actions"><button class="btn" onclick="APP.createClass()">Create class</button></div></div>';
        h += '<div class="card" style="margin-top:14px"><h3>Or join a class</h3>' +
        '<p>If someone gave you a code, enter it to share your practice data with them.</p>' +
        '<label class="fld"><span>Class code</span><input id="join-code" placeholder="ALVAREZ26"></label>' +
        '<div class="card-actions"><button class="btn ghost" onclick="APP.joinClass()">Join</button></div></div></div>';
        return h;
      }

      if (classState.loading) { h += '<div class="card"><p>Loading the roster&hellip;</p></div></div>'; return h; }
      var roster = classState.roster || [];

      h += '<div class="card"><h3>Class code</h3><p class="code-pill">' + esc(prof.class_code) + '</p>' +
      '<p class="note">Students enter this on their Account screen to join.</p></div>';

      if (!roster.length) {
        h += '<div class="card" style="margin-top:14px"><p>No students have joined yet. Share the code above.</p></div></div>';
        return h;
      }

      var totalAnswered = 0, totalRight = 0;
      roster.forEach(function (r) { totalAnswered += (r.answered || 0); totalRight += (r.correct || 0); });

      h += '<div class="score-hero" style="margin-top:16px">' +
      '<div class="score-box"><div class="lbl">Students</div><div class="big">' + roster.length + '</div></div>' +
      '<div class="score-box"><div class="lbl">Questions answered</div><div class="big">' + totalAnswered + '</div></div>' +
      '<div class="score-box"><div class="lbl">Class accuracy</div><div class="big">' + pct(totalRight, totalAnswered) + '%</div></div>' +
      '</div>';

      if (classState.traps && classState.traps.length) {
        h += '<div class="section-title">Traps catching the whole class</div><div class="card">' +
        '<p class="note" style="margin-bottom:14px">Worth a lesson: these are the tricks the most students are falling for.</p>';
        classState.traps.slice(0, 6).forEach(function (t) {
            var tp = window.TRAPS[t.id]; if (!tp) return;
            var top = classState.traps[0].n || 1;
            h += '<div class="skill-row" style="grid-template-columns:200px 1fr 60px">' +
            '<div><strong>' + tp.name + '</strong><div class="n" style="text-align:left">' + tp.fix + '</div></div>' +
            '<div class="bar bad"><i style="width:' + Math.round(100 * t.n / top) + '%"></i></div>' +
            '<div class="n">' + t.n + '</div></div>';
        });
        h += '</div>';
      }

      h += '<div class="section-title">Roster</div><div class="card"><table class="plain">' +
      '<tr><th>Student</th><th>Answered</th><th>Accuracy</th><th>Latest total</th><th>Most common trap</th><th>Last active</th></tr>';
      roster.forEach(function (r) {
          var tp = r.top_trap && window.TRAPS[r.top_trap];
          h += '<tr><td><strong>' + esc(r.display_name || r.email || 'Student') + '</strong></td>' +
          '<td>' + (r.answered || 0) + '</td>' +
          '<td>' + (r.answered ? pct(r.correct, r.answered) + '%' : '-') + '</td>' +
          '<td>' + (r.latest_total || '-') + '</td>' +
          '<td>' + (tp ? esc(tp.name) : '-') + '</td>' +
          '<td>' + (r.last_active ? dateLabel(r.last_active) : 'never') + '</td></tr>';
      });
      h += '</table></div>';
      h += '<p class="note" style="margin-top:14px">Students can leave a class at any time from their Account screen, which stops sharing immediately.</p>';
      h += '</div>';
      return h;
    }

    /* ============================================================
       COVERAGE BOARD
       The goal is not a score, it is having met every strategy and every
       trap the SAT uses and being able to beat each one. This screen is
       that checklist, and it is what the question writer works from.
       ============================================================ */
    function stateChip(c) {
      if (!c) return '<span class="cv new">not met yet</span>';
      if (c.state === 'mastered') return '<span class="cv done">locked in</span>';
      return '<span class="cv learn">' + c.right + '/' + c.seen + '</span>';
    }

    function cvRow(id, name, blurb, c, kind) {
      var act = kind === 'trap' ? 'APP.drillTrap' : 'APP.drillStrat';
      var st = kind === 'strat' ? window.STRATS[id] : null;
      var recipe = (st && st.gen)
        ? ' <button class="link-btn tiny" onclick="APP.showRecipe(\'' + id + '\')">recipe</button>' : '';
      if (st && st.meta) {
        return '<div class="cv-row"><div><strong>' + name + '</strong>' + recipe +
        '<div class="n" style="text-align:left">' + blurb + '</div></div>' +
        '<div><span class="pill soft">every question</span></div>' +
        '<div style="text-align:right"><span class="n">habit, not a topic</span></div></div>';
      }
      return '<div class="cv-row"><div><strong>' + name + '</strong>' + recipe +
      '<div class="n" style="text-align:left">' + blurb + '</div></div>' +
      '<div>' + stateChip(c) + '</div>' +
      '<div style="text-align:right"><button class="btn ghost sm" onclick="' + act + '(\'' + id + '\')">' +
      (c ? 'Practice' : 'Start') + '</button></div></div>';
    }

    function catalogHead(title, sub) {
      return '<div class="home"><div class="home-head"><div><div class="brand">' + title + '</div>' +
      '<div class="tagline">' + sub + '</div></div>' +
      '<button class="btn subtle sm" onclick="APP.go(\'home\')">Back</button></div><div class="home-hr"></div>';
    }

    function genOfferHTML() {
      if (!(window.Cloud && window.Cloud.aiEnabled && window.Cloud.signedIn())) return '';
      return '<div class="mission" style="margin-bottom:16px"><div class="m-body">' +
      '<div class="m-kicker">Never run out</div><h2>Write me questions for what is left</h2>' +
      '<p>Claude writes new questions aimed at whatever is still unlearned, in SAT format and scope, ' +
      'and every one is checked before it reaches you.</p>' +
      '<div class="m-actions"><button class="btn" onclick="APP.fillGaps()">Write 3 for my biggest gap</button>' +
      '<button class="btn ghost" onclick="APP.genPicker()">Choose what to write</button></div></div></div>';
    }

    function strategiesHTML() {
      var cov = window.Store.coverage();
      var sum = window.Store.coverageSummary();
      var h = catalogHead('Strategies', 'One named move per question type. ' + sum.strats.mastered +
        ' of ' + sum.strats.total + ' locked in, which means met three times with the last three right.');
      h += genOfferHTML();
      var due = dueCards().length;
      h += '<button class="paste-entry" style="margin-bottom:16px" onclick="APP.go(\'cards\')">' +
      '<div class="pe-icon">' + ic('bolt') + '</div><div>' +
      '<div class="pe-name">Quick recall on the moves' + (due ? ', ' + due + ' due' : '') + '</div>' +
      '<div class="pe-sub">Two minutes. The moves have to be there under time pressure, which means ' +
      'recalling them, not rereading them.</div></div></button>';
      ['rw', 'math'].forEach(function (sec) {
          h += '<div class="card" style="margin-bottom:12px"><h3>' +
          (sec === 'rw' ? 'Reading and Writing' : 'Math') + '</h3>';
          Object.keys(window.STRATS).forEach(function (id) {
              if (window.STRATS[id].section !== sec) return;
              h += cvRow(id, window.STRATS[id].name, window.STRATS[id].move, cov.strats[id], 'strat');
          });
          if (sec === 'math') {
            h += '<div class="cv-note"><button class="link-btn" onclick="APP.reference()">' +
            'Which formulas the test gives you, and the twelve it does not</button></div>';
          }
          h += '</div>';
      });
      h += '<div class="cv-note" style="text-align:center"><button class="link-btn" onclick="APP.strategies()">' +
      'Read the full guide to these moves</button></div></div>';
      return h;
    }

    function trapsHTML() {
      var cov = window.Store.coverage();
      var sum = window.Store.coverageSummary();
      var h = catalogHead('Traps', 'Every way a wrong answer gets built, in six families. ' +
        sum.traps.mastered + ' of ' + sum.traps.total + ' you can now spot.');
      h += genOfferHTML();
      Object.keys(window.TRAP_FAMILIES).forEach(function (fam) {
          h += '<div class="card" style="margin-bottom:12px"><h3>' + window.TRAP_FAMILIES[fam].name + '</h3>' +
          '<p style="margin-bottom:8px">' + window.TRAP_FAMILIES[fam].blurb + '</p>';
          Object.keys(window.TRAPS).forEach(function (id) {
              if (window.TRAPS[id].fam !== fam) return;
              h += cvRow(id, window.TRAPS[id].name, window.TRAPS[id].fix, cov.traps[id], 'trap');
          });
          h += '</div>';
      });
      h += '</div>';
      return h;
    }

    /* The page someone lands on before they have any reason to trust this.
       It has one job: make the case that the last stretch of the score is
       strategy, not more content review. Everything else follows from that. */
    function landingHTML() {
      var cfg = window.CONFIG || {};
      var started = window.Store.agg().total.seen > 0;
      var nStrat = Object.keys(window.STRATS).length;
      var nTrap = Object.keys(window.TRAPS).length;
      var nQ = window.RW_BANK.length + window.MATH_BANK.length;
      var cycle = window.Daily.cycleLength();

      var h = '<div class="home landing"><div class="lead-mark">' + wordmark() + '</div>';

      /* ---- the thesis ---- */
      h += '<div class="lead">' +
      '<h1>Knowing the material gets you<br><span>about three quarters of the way.</span></h1>' +
      '<p class="lead-sub">The last quarter is not more content review. It is knowing how the ' +
      'questions are built, what each one is really asking, and how every wrong answer was ' +
      'designed to catch you. That part is learnable, and almost nobody teaches it directly.</p>' +
      '</div>';

      /* ---- the 75/25 split, spelled out ---- */
      h += '<div class="split">' +
      '<div class="split-bar"><div class="sb-a"><span>75%</span><small>Content</small></div>' +
      '<div class="sb-b"><span>25%</span><small>Strategy</small></div></div>' +
      '<div class="split-copy">' +
      '<p><strong>Master the concepts and you get most of the way there.</strong> Algebra, ' +
      'grammar, reading closely: that work is necessary and there is no shortcut past it.</p>' +
      '<p><strong>Then the curve flattens.</strong> The questions you keep missing are not the ' +
      'ones you lack the math for. They are the ones where you did the work correctly and ' +
      'reported the wrong quantity, or picked the choice that was true but did not answer the ' +
      'question, or trusted where you would pause when the rule was about clause structure.</p>' +
      '<p><strong>That last stretch is strategy, and it is the cheapest part of the score to ' +
      'buy back.</strong> There are a limited number of moves and a limited number of traps. ' +
      'They repeat on every test. This app is only about those.</p>' +
      '<p class="note">The three-quarters figure is a way of describing where the returns ' +
      'change, not a measured statistic. Your own split depends on where you are starting.</p>' +
      '</div></div>';

      h += argumentHTML();

      /* ---- what you actually get ---- */
      h += '<div class="section-title">What you get</div><div class="card-grid">';
      h += '<div class="card"><h3>Daily LockIn</h3>' +
      '<p>One question a day, rotating through all ' + cycle + ' moves in order, so across ' +
      cycle + ' days every strategy comes up exactly once and nothing gets skipped. Two minutes. ' +
      'The streak is the point.</p></div>';
      h += '<div class="card"><h3>' + nStrat + ' strategies, drillable one at a time</h3>' +
      '<p>Pick a move and every question in the set rewards that same move, so the habit forms ' +
      'instead of blurring into general practice.</p></div>';
      h += '<div class="card"><h3>' + nTrap + ' traps, each with its own set</h3>' +
      '<p>Every wrong answer in the bank is labeled with the mistake it was built from. Miss one ' +
      'and you get the trap\'s name, how to spot it, and a set where it is waiting for you.</p></div>';
      h += '<div class="card"><h3>Paste your Bluebook misses</h3>' +
      '<p>Bluebook gives you a score, not a reason. Paste a question you got wrong and you get the ' +
      'move it wanted and the trap behind the answer you picked.</p></div>';
      h += '<div class="card"><h3>Two lists you watch empty</h3>' +
      '<p>Every move and every trap is not met, in progress, or locked in. That is the whole ' +
      'progress model, and it is something the app can honestly measure.</p></div>';
      h += '<div class="card"><h3>' + nQ + ' questions, written to format</h3>' +
      '<p>Real SAT stems, real domain mix, worked solutions, and an explanation of why each wrong ' +
      'answer is tempting. Every strategy and trap has questions behind it.</p></div>';
      h += '</div>';

      /* ---- price ---- */
      h += priceHTML();

      /* ---- honest limits, before they pay rather than after ---- */
      h += '<div class="section-title">What this is not</div>';
      h += '<div class="card"><ul class="plain">' +
      '<li><strong>Not a replacement for Bluebook.</strong> Take your full practice tests in ' +
      'College Board\'s own app. That is the real software and the only scoring worth trusting. ' +
      'This is what you do with the misses.</li>' +
      '<li><strong>No score prediction.</strong> Real scoring is item-response-theory based and ' +
      'form specific, so any number here would be invented. There is no score anywhere in the app.</li>' +
      '<li><strong>Not a content course.</strong> It will not teach you to factor. It assumes you ' +
      'are doing that work elsewhere and handles the part that comes after.</li>' +
      '<li><strong>These are not College Board\'s questions.</strong> They are written to match ' +
      'the format, difficulty range, and domain mix.</li>' +
      '</ul></div>';

      h += '<div class="card-actions" style="margin-top:26px;justify-content:center">' +
      '<button class="btn big" style="max-width:340px" onclick="APP.go(\'home\')">' +
      (started ? 'Back to practice' : 'Try it first, no account needed') + '</button></div>';
      h += '<p class="note" style="text-align:center;margin-top:10px">' +
      'Every question in the bank works before you pay anything.</p>';
      h += '</div>';
      return h;
    }

    /* One payment. The button only claims to take money when a real checkout
       is actually configured, because a buy button that goes nowhere is worse
       than an honest one that says so. */
    function priceHTML() {
      var cfg = window.CONFIG || {};
      var price = cfg.price || '$14.99';
      var url = String(cfg.checkoutUrl || '').trim();

      var h = '<div class="price"><div class="p-head">' +
      '<div class="p-tag">One time</div>' +
      '<div class="p-amt">' + esc(price) + '</div>' +
      '<div class="p-sub">Pay once. That is the whole price.</div></div>';

      h += '<ul class="p-list">' +
      '<li>' + ic('check') + 'No subscription and no renewal date</li>' +
      '<li>' + ic('check') + 'No upsell, no premium tier, no ads</li>' +
      '<li>' + ic('check') + 'Every strategy, every trap, and the whole question bank</li>' +
      '<li>' + ic('check') + 'Works on a phone, a laptop, or offline with no install</li>' +
      '<li>' + ic('check') + 'Your practice stays in your browser unless you sign in to sync it</li>' +
      '</ul>';

      if (url) {
        h += '<a class="btn big p-buy" href="' + esc(url) + '" rel="noopener">Get it for ' + esc(price) + '</a>';
        h += '<p class="p-note">Payment is handled by the checkout page, which means this app never ' +
        'sees your card details.</p>';
      } else {
        h += '<button class="btn big p-buy" disabled>Checkout is not connected yet</button>';
        h += '<p class="p-note">No payment can be taken right now. Set <code>checkoutUrl</code> in ' +
        '<code>js/config.js</code> to a payment link to switch this on.</p>';
      }
      h += '</div>';
      return h;
    }
    function catalogContext() {
      var out = ['STRATEGY IDS. Choose exactly one.'];
      Object.keys(window.STRATS).forEach(function (id) {
          out.push('  ' + id + ' [' + window.STRATS[id].section + '] = ' +
          window.STRATS[id].name + '. ' + window.STRATS[id].move);
      });
      out.push('', 'TRAP IDS. Choose one per wrong choice.');
      Object.keys(window.TRAPS).forEach(function (id) {
          out.push('  ' + id + ' = ' + window.TRAPS[id].name + '. ' + window.TRAPS[id].tell);
      });
      return out.join('\n');
    }

    /* Models wrap JSON in prose often enough that this has to be tolerant,
       and anything it hands back still gets id-checked below. */
    function azParse(text) {
      var t = String(text || '').trim();
      t = t.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
      var a = t.indexOf('{'), b = t.lastIndexOf('}');
      if (a < 0 || b < a) return null;
      try { return JSON.parse(t.slice(a, b + 1)); } catch (e) { return null; }
    }

    /* Ids that are not in our catalogs are dropped rather than displayed,
       because a made-up label is worse than no label. */
    function azClean(res) {
      var out = {
        section: res.section === 'math' ? 'math' : 'rw',
        skill: typeof res.skill === 'string' ? res.skill : null,
        strategy: window.STRATS[res.strategy] ? res.strategy : null,
        strategyWhy: typeof res.strategyWhy === 'string' ? res.strategyWhy : '',
        correct: res.correct === undefined || res.correct === null ? '' : String(res.correct),
        walkthrough: Array.isArray(res.walkthrough) ? res.walkthrough.filter(function (x) {
            return typeof x === 'string' && x.trim();
        }) : [],
        traps: [],
        picked: null,
        confidence: ['high', 'medium', 'low'].indexOf(res.confidence) >= 0 ? res.confidence : 'medium'
      };
      if (Array.isArray(res.traps)) {
        res.traps.forEach(function (t) {
            if (!t || !window.TRAPS[t.trap]) return;
            out.traps.push({ choice: String(t.choice || '').slice(0, 3), trap: t.trap,
                             why: typeof t.why === 'string' ? t.why : '' });
        });
      }
      if (res.picked && window.TRAPS[res.picked.trap]) {
        out.picked = { trap: res.picked.trap,
                       why: typeof res.picked.why === 'string' ? res.picked.why : '' };
      }
      return out;
    }

    /* A pasted question becomes the same kind of record as everything else,
       so it moves the same two lists. */
    function recordPasted(res) {
      var row = {
        section: res.section || null,
        skill: res.skill || null,
        domain: null,
        strat: res.strategy || null,
        trap: res.picked ? res.picked.trap : null,
        cause: res.picked ? 'trap' : 'gap'
      };
      window.Store.logMisses({
          id: String(new Date().getTime()),
          label: 'Pasted from a practice test',
          section: row.section
      }, [row]);
    }

    function azSelect(kind) {
      var book = kind === 'strat' ? window.STRATS : window.TRAPS;
      var cur = kind === 'strat' ? az.mStrat : az.mTrap;
      var h = '<select class="az-select" onchange="APP.azManual(\'' + kind + '\', this.value)">' +
      '<option value="">' + (kind === 'strat' ? 'Which move did it want?' : 'Which trap caught you?') + '</option>';
      Object.keys(book).forEach(function (id) {
          h += '<option value="' + id + '"' + (cur === id ? ' selected' : '') + '>' +
          esc(book[id].name) + '</option>';
      });
      return h + '</select>';
    }

    function analyzeHTML() {
      var ai = window.Cloud && window.Cloud.aiEnabled;
      var h = catalogHead('Paste a question',
        'From Bluebook or any official practice test. You get the move it was testing and the trap ' +
        'behind the answer you picked, and it joins your two lists.');

      if (az.res) {
        var r = az.res;
        if (r.confidence === 'low') {
          h += '<p class="az-warn">Low confidence on this one, usually because part of the question ' +
          'did not come through. Read it as a suggestion rather than a verdict.</p>';
        }

        if (r.strategy) {
          var st = window.STRATS[r.strategy];
          h += '<div class="az-card strat"><div class="az-lbl">The move it wanted</div>' +
          '<h3>' + esc(st.name) + '</h3><p class="az-move">' + esc(st.move) + '</p>' +
          (r.strategyWhy ? '<p>' + esc(r.strategyWhy) + '</p>' : '') +
          '<button class="btn sm" onclick="APP.drillStrat(\'' + r.strategy + '\')">Practice this move</button></div>';
        }

        if (r.picked) {
          var tp = window.TRAPS[r.picked.trap];
          h += '<div class="az-card trap"><div class="az-lbl">What caught you</div>' +
          '<h3>' + esc(tp.name) + '</h3>' +
          (r.picked.why ? '<p>' + esc(r.picked.why) + '</p>' : '') +
          '<p><strong>How to spot it:</strong> ' + esc(tp.tell) + '</p>' +
          '<p><strong>How to beat it:</strong> ' + esc(tp.fix) + '</p>' +
          '<button class="btn sm" onclick="APP.drillTrap(\'' + r.picked.trap + '\')">Practice spotting it</button></div>';
        }

        if (r.walkthrough.length) {
          h += '<div class="card"><h3>How it works out' +
          (r.correct ? ', to ' + esc(r.correct) : '') + '</h3><ol class="az-steps">';
          r.walkthrough.forEach(function (x) { h += '<li>' + esc(x) + '</li>'; });
          h += '</ol></div>';
        }

        if (r.traps.length) {
          h += '<div class="card"><h3>What each wrong answer was built from</h3>';
          r.traps.forEach(function (t) {
              h += '<div class="az-row"><div class="az-ch">' + esc(t.choice || '?') + '</div><div>' +
              '<strong>' + esc(window.TRAPS[t.trap].name) + '</strong>' +
              (t.why ? '<div class="n" style="text-align:left">' + esc(t.why) + '</div>' : '') +
              '</div><div style="text-align:right"><button class="btn ghost sm" ' +
              'onclick="APP.drillTrap(\'' + t.trap + '\')">Practice</button></div></div>';
          });
          h += '</div>';
        }

        h += '<div class="card-actions" style="margin-top:16px">';
        h += az.saved
        ? '<span class="pill green">Added to your lists</span>'
        : '<button class="btn" onclick="APP.azSave()">Add this to my lists</button>';
        h += '<button class="btn ghost" onclick="APP.azReset()">Paste another</button></div>';
        h += '</div>';
        return h;
      }

      h += '<div class="card"><h3>How to do this</h3>' +
      '<p>Copy the whole question out of Bluebook: the passage if there is one, the question itself, and ' +
      'all four choices. Then say which one you picked. The more you paste, the better the answer.</p>' +
      '<label class="fld"><span>The question</span>' +
      '<textarea id="az-text" class="az-text" rows="10" oninput="APP.azText(this.value)" placeholder="Paste the passage, the question, and all four choices here.">' +
      esc(az.text) + '</textarea></label>' +
      '<label class="fld"><span>Which one did you pick? Optional</span>' +
      '<input id="az-picked" type="text" maxlength="60" oninput="APP.azPick(this.value)" placeholder="B" value="' + esc(az.picked) + '"></label>';

      if (az.busy) {
        h += '<p class="az-wait">Working through it' + '\u2026' + '</p>';
      } else if (ai) {
        h += '<button class="btn big" onclick="APP.azRun()">Name the strategy and the trap</button>';
      } else {
        h += '<p class="az-warn">Automatic classification needs the AI turned on for this server. ' +
        'You can still record the miss yourself, which counts exactly the same on your lists.</p>';
      }
      if (az.err) h += '<p class="auth-err">' + esc(az.err) + '</p>';
      h += '</div>';

      h += '<div class="card"><h3>' + (ai ? 'Or label it yourself' : 'Label it yourself') + '</h3>' +
      '<p>If you already know what happened, pick it here and it goes straight onto your lists.</p>' +
      '<div class="az-manual">' + azSelect('strat') + azSelect('trap') + '</div>' +
      (az.saved
        ? '<span class="pill green">Added to your lists</span>'
        : '<button class="btn subtle" onclick="APP.azSaveManual()">Add to my lists</button>') +
      '</div>';

      h += '</div>';
      return h;
    }

    function stemHTML(q) {
      var h = '';
      if (q.blurb) h += '<p class="blurb">' + q.blurb + '</p>';
      if (q.figure) h += '<div class="figure">' + q.figure + (q.figcap ? '<div class="cap">' + q.figcap + '</div>' : '') + '</div>';
      if (q.passage) h += q.passage;
      return h;
    }
    function choicesHTML(q, st, opts) {
      opts = opts || {};
      if (q.type === 'spr') {
        var v = st ? (st.text || '') : (opts.given || '');
        if (opts.reveal) {
          return '<div class="spr"><div style="font-size:16px">Your answer: <strong>' +
          (v ? esc(v) : '<em>left blank</em>') + '</strong></div>' +
          '<div style="font-size:16px;margin-top:6px">Accepted: <strong>' + q.answers.map(esc).join('</strong> or <strong>') + '</strong></div></div>';
        }
        return '<div class="spr"><input id="spr-input" type="text" inputmode="text" autocomplete="off" ' +
        'value="' + esc(v) + '" placeholder="Enter answer" oninput="APP.spr(this.value)">' +
        '<div class="preview" id="spr-preview">' + (v ? 'You entered: ' + esc(v) : '') + '</div>' +
        '<div class="rules">Integers, decimals, and fractions are accepted. No mixed numbers, commas, or symbols. If the answer will not fit, enter at least three digits, rounded or truncated.</div></div>';
      }
      var out = '<ul class="choices">';
      q.choices.forEach(function (c, i) {
          var cls = 'choice';
          if (st && st.choice === i) cls += ' sel';
          if (st && st.struck.indexOf(i) >= 0) cls += ' struck';
          var tag = '';
          if (opts.reveal) {
            if (i === q.answer) { cls += ' correct'; tag = '<span class="tag">Correct</span>'; }
            else if (opts.given === i) { cls += ' wrong'; tag = '<span class="tag">Your answer</span>'; }
          }
          out += '<li><button class="' + cls + '" ' + (opts.reveal ? '' : 'onclick="APP.pick(' + i + ')"') + '>' +
          '<span class="ltr">' + LETTERS[i] + '</span><span class="txt">' + c + '</span>' + tag +
          (opts.reveal ? '' : '<span class="strike-btn" onclick="APP.strike(event,' + i + ')">' + LETTERS[i] + '</span>') +
          '</button></li>';
      });
      out += '</ul>';
      return out;
    }

    function examHTML() {
      var m = S.mod(), q = S.q(), st = S.st(), isRW = S.paneSection() === 'rw';
      if (!q) return '<div class="exam"><div class="centered"><div class="box"><h2>Nothing to show</h2>' +
      '<p>This practice set came back empty.</p><div class="card-actions" style="justify-content:center;margin-top:18px">' +
      '<button class="btn" onclick="APP.confirmQuit()">Back to home</button></div></div></div></div>';
      var drill = S.isDrill();
      var total = m.questions.length;
      var h = '<div class="exam' + (S.abcOn ? ' abc-on' : '') + '">';

      /* top bar */
      h += '<div class="exam-top"><div><div class="sec-name">' + esc(m.label) + '</div>' +
      '<div class="sec-sub">Question ' + (S.qi + 1) + ' of ' + total +
      ' · ' + esc(q.domain) + '</div></div>';
      h += '<div class="timer-wrap">';
      if (m.remaining === null) {
        h += '<div class="timer-hidden">Untimed practice</div>';
      } else if (S.timerHidden) {
        h += '<div class="timer-hidden" id="timer">Clock hidden</div>' +
        '<div class="timer-actions"><button onclick="APP.toggleTimer()">Show</button>' +
        '<button onclick="APP.pause()">' + (S.paused ? 'Resume' : 'Pause') + '</button></div>';
      } else {
        h += '<div class="timer' + (m.remaining <= 300 ? ' warn' : '') + '" id="timer">' + fmt(m.remaining) + '</div>' +
        '<div class="timer-actions"><button onclick="APP.toggleTimer()">Hide</button>' +
        '<button onclick="APP.pause()">' + (S.paused ? 'Resume' : 'Pause') + '</button></div>';
      }
      h += '</div>';
      h += '<div class="tools">';
      if (isRW) h += '<button class="tool" onclick="APP.highlight()">' + ic('pen') + 'Highlight</button>';
      else h += '<button class="tool" onclick="APP.calculator()">' + ic('calc') + 'Calculator</button>' +
      '<button class="tool" onclick="APP.reference()">' + ic('sheet') + 'Formulas</button>';
      h += '<button class="tool' + (S.abcOn ? ' on' : '') + '" onclick="APP.abc()">ABC</button>';
      h += '<button class="tool" onclick="APP.quit()">' + ic('close') + 'Exit</button>';
      h += '</div></div>';

      /* body */
      h += '<div class="exam-body' + (isRW ? '' : ' single') + '">';
      if (isRW) h += '<div class="pane pane-left"><div class="passage">' + stemHTML(q) + '</div></div>';
      h += '<div class="pane pane-right">';
      h += '<div class="qhead"><span class="qnum">' + (S.qi + 1) + '</span>' +
      '<span class="abc">' + esc(q.skill) + '</span>' +
      '<button class="mark icon-btn' + (st.marked ? ' on' : '') + '" onclick="APP.mark()">' +
      ic('flag') + (st.marked ? 'Marked' : 'Mark for review') + '</button></div>';
      if (!isRW) h += '<div class="passage" style="font-family:var(--sans)">' + stemHTML(q) + '</div>';
      h += '<div class="stem">' + q.prompt + '</div>';
      h += choicesHTML(q, st, { reveal: drill && st.checked, given: st.choice });

      /* teaching layer, drill only */
      if (drill) {
        h += '<div class="help-stack">';
        if (st.checked) {
          var ok = S.gradeQuestion(m, S.qi);
          h += '<div class="verdict ' + (ok ? 'ok' : 'no') + '">' + (ok ? 'Nice, that is right' : 'Not quite') + '</div>';
          h += helpCardsHTML(q, st.choice, true);
          h += aiPanelHTML();
          h += '<div class="card-actions"><button class="btn" onclick="APP.next()">' +
          (S.qi === total - 1 ? 'Finish set' : 'Next question') + '</button></div>';
        } else {
          h += '<div class="help-btns">' +
          '<button class="btn subtle sm" onclick="APP.hint()">Give me a nudge</button>' +
          '<button class="btn subtle sm" onclick="APP.showStrategy()">Show me the strategy</button>' +
          '<button class="btn" onclick="APP.check()">Check it</button></div>' +
          '<div id="help-live"></div>';
        }
        h += '</div>';
      }
      h += '</div></div>';

      /* bottom bar */
      var d = window.Store.data();
      h += '<div class="exam-bottom"><div class="who">' + esc(d.name) + '</div>' +
      '<div><button class="navigator-toggle" onclick="APP.navigator()">Question ' + (S.qi + 1) + ' of ' + total + ' ▲</button></div>' +
      '<div class="bottom-right">';
      if (S.qi > 0) h += '<button class="nav-btn gray" onclick="APP.prev()">Back</button>';
      if (!drill) h += '<button class="nav-btn" onclick="APP.next()">' + (S.qi === total - 1 ? 'Finish module' : 'Next') + '</button>';
      h += '</div></div>';

      h += '</div>';
      return h;
    }

    function helpCardsHTML(q, given, includeTraps) {
      var tg = window.tagsFor(q);
      var strat = tg.strat ? window.STRATS[tg.strat] : null;
      var h = '';

      /* the trick that actually caught her, named and generalized */
      var caught = (given !== null && given !== undefined && given !== q.answer) ? tg.traps[given] : null;
      if (includeTraps && caught && window.TRAPS[caught]) {
        var tp = window.TRAPS[caught];
        var count = (window.Store.agg().traps[caught] || {}).n || 0;
        h += '<div class="help-card caught"><h4>What caught you</h4>' +
        '<p><span class="trap-name">' + tp.name + '</span> ' +
        '<span class="trap-fam">' + window.TRAP_FAMILIES[tp.fam].name + '</span>' +
        (count > 1 ? '<span class="trap-count">' + count + ' times so far</span>' : '') + '</p>' +
        '<p><strong>How to spot it:</strong> ' + tp.tell + '</p>' +
        '<p><strong>How to beat it:</strong> ' + tp.fix + '</p>' +
        '<div class="card-actions" style="margin-top:12px">' +
        '<button class="btn subtle sm" onclick="APP.drillTrap(\'' + caught + '\')">Practice spotting it</button></div>' +
        '</div>';
      }

      h += '<div class="help-card strategy"><h4>The strategy' + (strat ? ': ' + strat.name : '') + '</h4>';
      if (strat) h += '<p class="strat-move">' + strat.move + '</p>';
      h += '<p>' + q.strategy + '</p></div>';

      h += '<div class="help-card steps"><h4>Working it through</h4><ol>' +
      q.steps.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol></div>';

      if (includeTraps && q.traps && Object.keys(q.traps).length) {
        h += '<div class="help-card traps"><h4>Why each wrong answer is tempting</h4>';
        Object.keys(q.traps).forEach(function (k) {
            var tid = tg.traps[k], t = tid ? window.TRAPS[tid] : null;
            h += '<div class="trap-row"><b>' + LETTERS[+k] + '</b><div>' +
            (t ? '<span class="trap-chip">' + t.name + '</span> ' : '') + q.traps[k] +
            (given === +k ? ' <strong>(you picked this one)</strong>' : '') + '</div></div>';
        });
        h += '</div>';
      }
      return h;
    }

    /* ============================================================
       REVIEW
       ============================================================ */
    function reviewHTML() {
      var a = reviewData;
      var backTo = /^Trap:/.test(String(a.label || '')) ? 'traps' : 'strategies';
      var h = '<div class="review-wrap"><div class="home-head"><div><div class="brand">' +
      esc(a.label || 'Practice set') + '</div>' +
      '<div class="tagline">' + dateLabel(a.finishedAt) + '</div></div>' +
      '<div class="card-actions"><button class="btn subtle sm" onclick="APP.go(\'' + backTo + '\')">' +
      (backTo === 'traps' ? 'All traps' : 'All moves') + '</button>' +
      '<button class="btn ghost sm" onclick="APP.go(\'home\')">Home</button></div></div>';

      var right = a.items.filter(function (i) { return i.correct === true; }).length;
      h += '<div class="score-hero"><div class="score-box"><div class="lbl">Correct</div><div class="big">' +
      right + '/' + a.items.length + '</div><div class="sub">' + esc(a.label || 'practice set') + '</div></div></div>';

      var counts = {
        all: a.items.length,
        wrong: a.items.filter(function (i) { return i.correct === false || i.correct === null; }).length,
        marked: a.items.filter(function (i) { return i.marked; }).length
      };
      h += '<div class="filters">' +
      fbtn('all', 'All ' + counts.all) + fbtn('wrong', 'Missed and skipped ' + counts.wrong) +
      fbtn('marked', 'Marked ' + counts.marked) +
      (a.sections && a.sections.rw && a.sections.math ? fbtn('rw', 'Reading and Writing') + fbtn('math', 'Math') : '') +
      '</div>';

      var items = a.items.filter(function (i) {
          if (reviewFilter === 'wrong') return i.correct === false || i.correct === null;
          if (reviewFilter === 'marked') return i.marked;
          if (reviewFilter === 'rw' || reviewFilter === 'math') return i.section === reviewFilter;
          return true;
      });
      h += '<div class="qlist">';
      if (!items.length) h += '<div class="card"><p>Nothing in this filter.</p></div>';
      items.forEach(function (it, n) {
          var q = ALLQ[it.qid]; if (!q) return;
          var badge = it.correct === true ? '<span class="badge ok">✓</span>' :
          it.correct === false ? '<span class="badge no">✗</span>' : '<span class="badge skip">–</span>';
          h += '<button class="qrow" onclick="APP.detail(\'' + it.qid + '\')">' + badge +
          '<div><div>' + esc(snippet(q, 96)) + '</div>' +
          '<div class="skill">' + esc(q.skill) + ' · ' + dfLabel(q.difficulty) +
          (it.marked ? ' · marked' : '') + '</div></div>' +
          '<div class="skill">' + (q.type === 'spr' ? 'Fill-in' : (it.choice === null ? '-' : LETTERS[it.choice])) + '</div>' +
          '<div class="skill">' + (it.seconds ? it.seconds + 's' : '') + '</div></button>';
      });
      h += '</div>';

      var byDomain = {};
      a.items.forEach(function (i) {
          var k = i.domain;
          byDomain[k] = byDomain[k] || { n: 0, r: 0, section: i.section };
          if (i.correct !== null) { byDomain[k].n++; if (i.correct) byDomain[k].r++; }
      });
      var attTraps = {};
      a.items.forEach(function (i) { if (i.trap) attTraps[i.trap] = (attTraps[i.trap] || 0) + 1; });
      var tkeys = Object.keys(attTraps).sort(function (x, y) { return attTraps[y] - attTraps[x]; });
      if (tkeys.length) {
        h += '<div class="section-title">Tricks that caught her in this sitting</div><div class="card">';
        tkeys.forEach(function (k) {
            var tp = window.TRAPS[k]; if (!tp) return;
            h += '<div class="skill-row" style="grid-template-columns:1fr 60px 110px">' +
            '<div><strong>' + tp.name + '</strong><div class="n" style="text-align:left">' + tp.fix + '</div></div>' +
            '<div class="n">' + attTraps[k] + '&times;</div>' +
            '<div style="text-align:right"><button class="btn ghost sm" onclick="APP.drillTrap(\'' + k + '\')">Practice</button></div></div>';
        });
        h += '</div>';
      }

      h += '<div class="section-title">By domain</div><div class="card">';
      Object.keys(byDomain).forEach(function (k) {
          var v = byDomain[k], p = pct(v.r, v.n);
          h += '<div class="skill-row"><div>' + esc(k) + '</div>' +
          '<div class="bar ' + (p >= 70 ? 'good' : p >= 50 ? 'mid' : 'bad') + '"><i style="width:' + p + '%"></i></div>' +
          '<div class="n">' + v.r + '/' + v.n + '</div></div>';
      });
      h += '</div></div>';
      return h;
    }
    function fbtn(k, label) {
      return '<button class="btn ' + (reviewFilter === k ? '' : 'subtle') + ' sm" onclick="APP.filter(\'' + k + '\')">' + label + '</button>';
    }

    function detailHTML(qid, given) {
      var q = ALLQ[qid];
      if (!q) return '<p>That question is no longer in the bank.</p>';
      var it = given || (reviewData
        ? reviewData.items.filter(function (i) { return i.qid === qid; })[0]
        : null) || {};
      var h = '';
      var ok = it.correct;
      h += '<div class="verdict ' + (ok ? 'ok' : 'no') + '">' +
      (ok === true ? '✓ You got this one right' : ok === false ? '✗ Missed' : '– Left blank') +
      '</div>';
      h += '<p class="note">' + esc(q.domain) + ' · ' + esc(q.skill) + ' · ' + dfLabel(q.difficulty) +
      (it.seconds ? ' · ' + it.seconds + ' seconds spent' : '') + '</p>';
      if (q.blurb || q.figure || q.passage) h += '<div class="passage" style="font-size:16px;margin:14px 0">' + stemHTML(q) + '</div>';
      h += '<div class="stem" style="font-weight:600">' + q.prompt + '</div>';
      h += choicesHTML(q, null, { reveal: true, given: q.type === 'spr' ? it.text : it.choice });
      h += '<div class="help-stack">' + helpCardsHTML(q, it.choice, true) + '</div>';
      if (window.Cloud && window.Cloud.aiEnabled && window.Cloud.signedIn()) {
        h += '<div class="help-card ai"><h4>Want it explained another way?</h4>' +
        '<div id="ai-thread" class="ai-thread"></div>' +
        '<div class="ai-controls">' +
        '<input id="ai-input" placeholder="Ask about this question\u2026" ' +
        'onkeydown="if(event.key===\'Enter\'){event.preventDefault();APP.aiAskQid(\'' + qid + '\');}">' +
        '<button class="btn sm" onclick="APP.aiAskQid(\'' + qid + '\')">Ask</button></div>' +
        '<div class="card-actions" style="margin-top:8px">' +
        '<button class="btn subtle sm" onclick="APP.aiExplainQid(\'' + qid + '\')">Explain it a different way</button></div></div>';
      }
      return h;
    }

    /* ============================================================
       TIMER TICK (targeted DOM update, no full re-render)
       ============================================================ */
    function wire(sess) {
      sess.on('change', render);
      sess.on('tick', function (r) {
          var t = document.getElementById('timer');
          if (!t) return;
          if (S.timerHidden && view === 'exam') return;
          t.textContent = fmt(r);
          if (r <= 300 && view === 'exam') t.classList.add('warn');
          if (r === 300 && view === 'exam') toast('5 minutes remaining in this module');
      });
      sess.on('module-end', function () {
          var m = S.mod();
          var unanswered = m.state.filter(function (s, i) { return S.gradeQuestion(m, i) === null; }).length;
          var marked = m.state.filter(function (s) { return s.marked; }).length;
          var msg = '<p>You have reached the end of <strong>' + esc(m.label) + '</strong>.</p>';
          if (unanswered) msg += '<p><strong>' + unanswered + ' question' + (unanswered > 1 ? 's are' : ' is') +
          ' unanswered.</strong> There is no penalty for guessing on the SAT, so it is always worth entering something.</p>';
          if (marked) msg += '<p>' + marked + ' question' + (marked > 1 ? 's are' : ' is') + ' marked for review.</p>';
          msg += '<p>Once you move on you cannot come back to this module, same as the real test.</p>' +
          '<div class="card-actions" style="margin-top:16px">' +
          '<button class="btn subtle" onclick="APP.closeModal()">Keep working</button>' +
          '<button class="btn" onclick="APP.advance()">Continue</button></div>';
          openModal('End of module', msg);
      });
      sess.on('expired', function () { toast('Time is up on that module'); });
      sess.on('finished', function (res) {
          closeModal();
          if (dailyPending) {
            var it = res.items[0] || {};
            window.Daily.record(dailyPending.date, dailyPending.qid, dailyPending.strat, it.correct === true);
            dailyPending = null;
            reviewData = res;
            view = 'home';
            render();
            return;
          }
          reviewData = res; reviewFilter = res.kind === 'drill' ? 'all' : 'wrong';
          view = 'review';
          render();
      });
    }

    /* ============================================================
       ACTIONS
       ============================================================ */
    var APP = {
      go: function (v) {
        if (S && !S.finished && view === 'exam') return;
        view = v; render();
      },
      closeModal: closeModal,

      aiExplainQid: function (qid) {
        var q = ALLQ[qid];
        var it = (reviewData && reviewData.items.filter(function (i) { return i.qid === qid; })[0]) || {};
        askTutor('explain', 'Explain this question a different way. The standard explanation did not click.',
          questionContext(q, { choice: it.choice, text: it.text }));
      },
      aiAskQid: function (qid) {
        var box = document.getElementById('ai-input');
        var text = box ? box.value.trim() : '';
        if (!text) { toast('Type your question first'); return; }
        box.value = '';
        var q = ALLQ[qid];
        var it = (reviewData && reviewData.items.filter(function (i) { return i.qid === qid; })[0]) || {};
        askTutor('chat', text, questionContext(q, { choice: it.choice, text: it.text }));
      },

      cardsStart: function () {
        var due = dueCards();
        if (!due.length) return;
        cards.current = due[0];
        cards.revealed = false;
        cards.justAdvanced = null;
        render();
      },
      cardsCram: function () {
        var deck = cardDeck().sort(function (a, b) { return a.box - b.box; });
        cards.current = deck[0];
        cards.revealed = false;
        render();
      },
      cardsReveal: function () { cards.revealed = true; render(); },
      cardsRate: function (how) {
        var st = cardState();
        var id = cards.current.id;
        var c = st[id] || { box: 1, due: 0, seen: 0, right: 0 };
        var before = c.box;
        c.seen++;
        if (how === 'good') { c.box = Math.min(5, c.box + 1); c.right++; cards.streak++; }
        else if (how === 'mid') { cards.streak = 0; }
        else { c.box = 1; cards.streak = 0; }
        c.due = Date.now() + BOX_DAYS[c.box] * 86400000;
        st[id] = c;
        saveCardState(st);
        cards.done++;

        cards.justAdvanced = null;
        if (how === 'good' && c.box >= 4 && before < 4) {
          cards.justAdvanced = 'That one is locked in. ' + lockedCount() + ' of ' +
            Object.keys(window.STRATS).length + ' now.';
        } else if (how === 'good' && cards.streak >= 3) {
          cards.justAdvanced = cards.streak + ' in a row. It is sticking.';
        } else if (how === 'no') {
          cards.justAdvanced = 'Fine, that is what these are for. It will come back shortly.';
        }

        var due = dueCards().filter(function (d) { return d.id !== id || c.box === 1; });
        cards.current = due.length ? due[0] : null;
        cards.revealed = false;
        if (!cards.current) cards.justAdvanced = null;
        render();
      },

      demoPick: function (i) { demo.picked = i; render(); },
      demoReset: function () { demo.picked = null; render(); },

      /* ---------- a question pasted in from a real practice test ---------- */
      azText: function (v) { az.text = v; },
      azPick: function (v) { az.picked = v; },
      azReset: function () {
        az.text = ''; az.picked = ''; az.res = null; az.err = ''; az.saved = false;
        az.mStrat = ''; az.mTrap = ''; render();
      },
      azManual: function (which, v) {
        if (which === 'strat') az.mStrat = v; else az.mTrap = v;
      },
      azSaveManual: function () {
        if (!az.mStrat && !az.mTrap) { toast('Pick a move or a trap first'); return; }
        recordPasted({ strategy: az.mStrat, section: null, skill: null,
                       picked: az.mTrap ? { trap: az.mTrap } : null });
        az.saved = true; render();
        toast('Added to your lists');
      },
      azRun: function () {
        var box = document.getElementById('az-text');
        if (box) az.text = box.value;
        var pk = document.getElementById('az-picked');
        if (pk) az.picked = pk.value;
        if (az.text.trim().length < 40) { toast('Paste the whole question, including the choices'); return; }
        az.busy = true; az.err = ''; az.res = null; az.saved = false; render();

        var prompt = 'Question pasted by the student:\n\n' + az.text.trim() +
        (az.picked.trim() ? '\n\nThe student answered: ' + az.picked.trim() : '') +
        '\n\nClassify it against the catalog and return only the JSON object.';

        window.Cloud.ask('analyze', prompt, catalogContext()).then(function (r) {
            az.busy = false;
            var parsed = azParse(r.text);
            if (!parsed) { az.err = 'That came back in a shape the app could not read. Try again.'; }
            else if (parsed.ok === false) { az.err = parsed.reason || 'That does not look like a full SAT question.'; }
            else { az.res = azClean(parsed); }
            render();
        }).catch(function (e) {
            az.busy = false;
            az.err = e.message || 'Could not reach the tutor.';
            render();
        });
      },
      azSave: function () {
        if (!az.res) return;
        recordPasted(az.res);
        az.saved = true; render();
        toast('Added to your lists');
      },
      fillGaps: function () {
        var plan = window.Generate.gapPlan();
        if (!plan.length) {
          openModal('Nothing left', '<p>You have met and beaten every strategy and every trap in the catalog. ' +
            'That is the whole checklist done. Now go and prove it on a real practice test in Bluebook.</p>' +
          '<div class="card-actions"><button class="btn" onclick="APP.closeModal();APP.go(\'home\')">Back to today</button></div>');
          return;
        }
        var target = plan[0];
        var skill = window.Generate.skillFor(target.kind, target.id);
        if (!skill) { toast('No matching skill for that gap'); return; }
        var opts = {
          skill: skill, difficulty: 'M', type: 'mc', count: 3,
          strat: target.kind === 'strat' ? target.id : window.Generate.skillFor('strat', target.id) || 'predict-first',
          traps: target.kind === 'trap' ? [target.id] : []
        };
        if (target.kind === 'trap') {
          opts.mustInclude = target.id;
          var q0 = window.RW_BANK.concat(window.MATH_BANK).filter(function (q) {
              var t = window.tagsFor(q);
              return Object.keys(t.traps).some(function (k) { return t.traps[k] === target.id; });
          })[0];
          if (q0) { opts.strat = window.tagsFor(q0).strat; opts.skill = q0.skill; }
          var others = Object.keys(window.TRAPS).filter(function (t) {
              return window.TRAPS[t].fam === window.TRAPS[target.id].fam && t !== target.id;
          }).slice(0, 2);
          opts.traps = [target.id].concat(others);
        } else {
          opts.traps = window.Generate.trapsForStrat(target.id).slice(0, 5);
        }
        APP.runGenerate(opts, target);
      },

      genPicker: function () {
        var plan = window.Generate.gapPlan().slice(0, 14);
        var h = '<p class="note">Pick what to write questions for. Anything not yet learned is listed first.</p><div class="pal-grid">';
        plan.forEach(function (p) {
            var meta = p.kind === 'strat' ? window.STRATS[p.id] : window.TRAPS[p.id];
            if (!meta) return;
            h += '<button class="pal" onclick="APP.genFor(\'' + p.kind + '\',\'' + p.id + '\')">' +
            '<div class="nm">' + meta.name + '</div>' +
            '<div class="ds">' + (p.kind === 'strat' ? 'strategy' : 'trap') + ' &middot; ' + p.state + '</div></button>';
        });
        h += '</div>';
        openModal('What should I write?', h);
      },
      genFor: function (kind, id) {
        closeModal();
        var plan = window.Generate.gapPlan().filter(function (p) { return p.kind === kind && p.id === id; });
        var target = plan[0] || { kind: kind, id: id, state: 'learning' };
        var saved = window.Generate.gapPlan;
        window.Generate.gapPlan = function () { return [target]; };
        APP.fillGaps();
        window.Generate.gapPlan = saved;
      },
      runGenerate: function (opts, target) {
        var meta = target.kind === 'strat' ? window.STRATS[target.id] : window.TRAPS[target.id];
        openModal('Writing questions',
          '<p>Asking Claude for ' + opts.count + ' questions aimed at <strong>' + (meta ? meta.name : target.id) +
          '</strong>, in the ' + esc(opts.skill) + ' slot.</p>' +
          '<p class="note">This takes a few seconds. Every question is checked before it reaches you: ' +
        'four choices, one defensible answer, a real trap behind each wrong choice.</p>');
        window.Generate.run(opts).then(function (rep) {
            var h = '<p><strong>' + rep.added + ' new question' + (rep.added === 1 ? '' : 's') +
            '</strong> added to your bank, written by ' + esc(rep.model) + '.</p>';
            if (rep.rejected.length) {
              h += '<p class="note">' + rep.rejected.length + ' did not pass the checks and were thrown away:</p><ul class="note">';
              rep.rejected.slice(0, 4).forEach(function (r) { h += '<li>' + esc(r.errs.slice(0, 2).join('; ')) + '</li>'; });
              h += '</ul>';
            }
            h += '<div class="card-actions" style="margin-top:14px">';
            if (rep.added) {
              h += '<button class="btn" onclick="APP.closeModal();' +
              (target.kind === 'trap' ? 'APP.drillTrap(\'' + target.id + '\')' : 'APP.drillStrat(\'' + target.id + '\')') +
              '">Try them now</button>';
            }
            h += '<button class="btn subtle" onclick="APP.closeModal();APP.go(\'' + (target.kind === 'trap' ? 'traps' : 'strategies') + '\')">Back to the list</button></div>';
            openModal(rep.added ? 'Questions ready' : 'Nothing usable came back', h);
            render();
        }).catch(function (e) {
            openModal('Could not write questions', '<p>' + esc(e.message || 'Something went wrong.') + '</p>');
        });
      },

      /* ---------- accounts ---------- */
      sendCode: function () {
        var input = document.getElementById('auth-email');
        if (input) authState.email = input.value.trim();
        if (!/.+@.+\..+/.test(authState.email)) { authState.err = 'That email does not look right.'; render(); return; }
        authState.busy = true; authState.err = ''; authState.msg = ''; render();
        window.Cloud.sendCode(authState.email).then(function () {
            authState.busy = false; authState.stage = 'code';
            authState.msg = 'Check your inbox. The code expires in an hour.';
            render();
            var c = document.getElementById('auth-code'); if (c) c.focus();
        }).catch(function (e) {
            authState.busy = false; authState.err = e.message || 'Could not send the code.'; render();
        });
      },
      verifyCode: function () {
        var input = document.getElementById('auth-code');
        var code = input ? input.value.trim() : '';
        if (code.length < 6) { authState.err = 'Enter all six digits.'; render(); return; }
        authState.busy = true; authState.err = ''; render();
        window.Cloud.verifyCode(authState.email, code).then(function () {
            authState.busy = false; authState.stage = 'email'; authState.msg = '';
            try { localStorage.removeItem('decoy.skipauth'); } catch (e) {}
            view = 'home'; render();
            toast('Signed in as ' + authState.email);
        }).catch(function (e) {
            authState.busy = false; authState.err = e.message || 'That code did not work.'; render();
        });
      },
      authBack: function () { authState.stage = 'email'; authState.err = ''; authState.msg = ''; render(); },
      skipAuth: function () {
        try { localStorage.setItem('decoy.skipauth', '1'); } catch (e) {}
        view = 'home'; render();
      },
      signIn: function () { view = 'auth'; authState.stage = 'email'; render(); },
      signOut: function () {
        openModal('Sign out?', '<p>Your practice data stays saved in your account. Anything you do after signing out is stored only on this device.</p>' +
          '<div class="card-actions"><button class="btn subtle" onclick="APP.closeModal()">Stay signed in</button>' +
        '<button class="btn" onclick="APP.confirmSignOut()">Sign out</button></div>');
      },
      confirmSignOut: function () {
        window.Cloud.signOut(); closeModal();
        try { localStorage.setItem('decoy.skipauth', '1'); } catch (e) {}
        view = 'home'; render(); toast('Signed out');
      },
      account: function () {
        var C = window.Cloud, p = C && C.profile;
        var h = '';
        if (!C || !C.enabled) {
          h += '<p>This copy is running in single-device mode. Practice data is saved in this browser only.</p>' +
          '<p class="note">To add accounts so a whole class can use it, follow SETUP-CLOUD.md.</p>';
        } else if (!C.signedIn()) {
          h += '<p>You are not signed in, so work is saved on this device only.</p>' +
          '<div class="card-actions"><button class="btn" onclick="APP.closeModal();APP.signIn()">Sign in</button></div>';
        } else {
          h += '<p><strong>' + esc((p && p.email) || C.session.user.email) + '</strong></p>';
          h += '<label class="fld"><span>Display name</span><input id="acct-name" value="' + esc((p && p.display_name) || '') + '"></label>';
          h += '<div class="card-actions"><button class="btn sm" onclick="APP.saveName()">Save name</button></div>';
          h += '<h3>Class</h3>';
          if (p && p.class_code) {
            h += '<p>You are sharing practice data with class <strong>' + esc(p.class_code) + '</strong>.</p>' +
            '<div class="card-actions"><button class="btn subtle sm" onclick="APP.leaveClass()">Leave the class</button>' +
            (p.role === 'teacher' ? '<button class="btn ghost sm" onclick="APP.closeModal();APP.openClass()">Open class dashboard</button>' : '') +
            '</div>';
          } else {
            h += '<label class="fld"><span>Class code from your teacher</span><input id="acct-class" placeholder="ALVAREZ26"></label>' +
            '<div class="card-actions"><button class="btn sm" onclick="APP.joinClassFromAccount()">Join class</button>' +
            '<button class="btn ghost sm" onclick="APP.closeModal();APP.openClass()">I am the teacher</button></div>';
          }
          h += '<h3>Sync</h3><p class="note">' +
          (C.lastError ? 'Last sync problem: ' + esc(C.lastError) : 'Everything is synced.') + '</p>';
          h += '<div class="card-actions"><button class="btn subtle sm" onclick="APP.syncNow()">Sync now</button>' +
          '<button class="btn subtle sm" onclick="APP.signOut()">Sign out</button></div>';
        }
        h += '<h3>Look</h3><p class="note">Five palettes. Pick the one you like opening.</p>' +
        '<div class="card-actions"><button class="btn subtle sm" onclick="APP.colors()">Change colors</button></div>';
        h += '<h3>Start over</h3><p class="note">Clears every answer, both lists, and your streak on this device. ' +
        'There is no undo.</p><div class="card-actions">' +
        '<button class="btn subtle sm" onclick="APP.resetData()">Clear my progress</button></div>';
        openModal('Account', h);
      },
      saveName: function () {
        var v = document.getElementById('acct-name').value.trim();
        if (!v) return;
        window.Store.setName(v);
        window.Cloud.updateProfile({ display_name: v }).then(function () { toast('Name updated'); closeModal(); render(); })
        .catch(function (e) { toast(e.message || 'Could not save'); });
      },
      joinClassFromAccount: function () {
        var v = document.getElementById('acct-class').value.trim().toUpperCase();
        if (!v) return;
        window.Cloud.joinClass(v).then(function () { toast('Joined ' + v); closeModal(); render(); })
        .catch(function (e) { toast(e.message || 'Could not join that class'); });
      },
      leaveClass: function () {
        window.Cloud.updateProfile({ class_code: null }).then(function () { toast('You left the class'); closeModal(); render(); });
      },
      openClass: function () {
        view = 'class'; classState.loading = true; render();
        Promise.all([window.Cloud.classRoster(), window.Cloud.classTraps()]).then(function (r) {
            classState.roster = r[0]; classState.traps = r[1]; classState.loading = false; render();
        }).catch(function (e) { classState.loading = false; toast(e.message || 'Could not load the class'); render(); });
      },
      createClass: function () {
        var name = document.getElementById('cls-name').value.trim();
        var code = document.getElementById('cls-code').value.trim().toUpperCase();
        if (!name || !code) { toast('Enter a name and a code'); return; }
        window.Cloud.createClass(name, code).then(function () { toast('Class created'); APP.openClass(); })
        .catch(function (e) { toast(e.message || 'Could not create the class'); });
      },
      joinClass: function () {
        var code = document.getElementById('join-code').value.trim().toUpperCase();
        if (!code) return;
        window.Cloud.joinClass(code).then(function () { toast('Joined ' + code); render(); })
        .catch(function (e) { toast(e.message || 'Could not join'); });
      },
      syncNow: function () {
        toast('Syncing\u2026');
        window.Cloud.flushQueue().then(function () { return window.Cloud.pullAll(); })
        .then(function () { toast('Synced'); closeModal(); render(); });
      },

      /* ---------- AI tutor ---------- */
      aiExplain: function () {
        var q = S ? S.q() : null;
        if (!q) return;
        askTutor('explain', 'Explain this question a different way. I read the standard explanation and it did not click.', questionContext(q, S.st()));
      },
      aiAsk: function () {
        var box = document.getElementById('ai-input');
        var text = box ? box.value.trim() : '';
        if (!text) { toast('Type your question first'); return; }
        var q = S ? S.q() : null;
        box.value = '';
        askTutor('chat', text, questionContext(q, S.st()));
      },
      rename: function () {
        var n = prompt('Name to show during the test:', window.Store.data().name);
        if (n && n.trim()) { window.Store.setName(n.trim()); render(); }
      },

      drillTrap: function (trapId) {
        var pool = window.RW_BANK.concat(window.MATH_BANK).filter(function (q) {
            var t = window.tagsFor(q).traps;
            return Object.keys(t).some(function (k) { return t[k] === trapId; });
        });
        if (!pool.length) { toast('No questions carry that trap'); return; }
        var name = window.TRAPS[trapId] ? window.TRAPS[trapId].name : trapId;
        closeModal();
        S = new window.SATP.Session({
            kind: 'drill', section: 'both', count: Math.min(pool.length, 10),
            label: 'Trap: ' + name,
            filter: function (q) {
              var t = window.tagsFor(q).traps;
              return Object.keys(t).some(function (k) { return t[k] === trapId; });
            }
        });
        wire(S); view = 'exam'; render();
        toast('Every question here has a "' + name + '" answer among the choices');
      },
      startDaily: function () {
        var pick = window.Daily.pick();
        if (!pick) { toast('No question available for today'); return; }
        window.Daily.claim(pick);
        var q = window.Daily.question(pick.qid);
        if (!q) { toast('That question is no longer in the bank'); return; }
        dailyPending = { date: pick.date, qid: pick.qid, strat: pick.strat };
        var name = window.STRATS[pick.strat] ? window.STRATS[pick.strat].name : pick.strat;
        S = new window.SATP.Session({
            kind: 'drill', section: 'both', count: 1,
            label: 'Daily LockIn: ' + name,
            filter: function (x) { return x.id === pick.qid; }
        });
        wire(S); view = 'exam'; render();
      },
      reviewDaily: function () {
        var res = window.Daily.resultFor();
        if (!res || !res.qid) { toast('Nothing recorded for today yet'); return; }
        /* Reopened days later there is no attempt in memory, so the record
           itself supplies the verdict. */
        var it = (reviewData && reviewData.items.filter(function (i) { return i.qid === res.qid; })[0]) ||
                 { correct: res.correct, choice: undefined };
        openModal('Daily LockIn', detailHTML(res.qid, it));
      },
      drillStrat: function (stratId) {
        var pool = window.RW_BANK.concat(window.MATH_BANK).filter(function (q) { return window.tagsFor(q).strat === stratId; });
        if (!pool.length) { toast('No questions for that strategy'); return; }
        closeModal();
        S = new window.SATP.Session({
            kind: 'drill', section: 'both', count: Math.min(pool.length, 10),
            label: 'Strategy: ' + (window.STRATS[stratId] ? window.STRATS[stratId].name : stratId),
            filter: function (q) { return window.tagsFor(q).strat === stratId; }
        });
        wire(S); view = 'exam'; render();
      },
      advance: function () { closeModal(); S.advanceModule(); },

      pick: function (i) { S.select(i); },
      strike: function (e, i) { e.stopPropagation(); S.toggleStrike(i); },
      spr: function (v) {
        S.setText(v);
        var p = document.getElementById('spr-preview');
        if (p) p.textContent = v ? 'You entered: ' + v : '';
      },
      mark: function () { S.toggleMark(); },
      abc: function () { S.toggleAbc(); },
      toggleTimer: function () { S.toggleTimer(); },
      pause: function () {
        S.togglePause();
        if (S.paused) openModal('Paused', '<p>Clock stopped. There is no pause button on the real test, so save this for actual interruptions.</p>' +
        '<div class="card-actions"><button class="btn" onclick="APP.pause();APP.closeModal()">Resume</button></div>');
        else closeModal();
      },
      next: function () {
        if (S.isDrill() && S.qi === S.mod().questions.length - 1) { S.finish(); return; }
        S.next();
      },
      prev: function () { S.prev(); },
      goto: function (i) { closeModal(); S.goto(i); },

      navigator: function () {
        var m = S.mod();
        var h = '<div class="legend"><i class="lg-un">Not answered</i><i class="lg-an">Answered</i>' +
        '<i class="lg-mk">Marked</i></div><div class="qgrid">';
        m.questions.forEach(function (q, i) {
            var st = m.state[i];
            var cls = 'qcell';
            if (S.gradeQuestion(m, i) !== null) cls += ' answered';
            if (i === S.qi) cls += ' cur';
            if (st.marked) cls += ' marked';
            h += '<button class="' + cls + '" onclick="APP.goto(' + i + ')">' + (i + 1) + '</button>';
        });
        h += '</div>';
        openModal('Jump to a question: ' + m.label, h);
      },

      quit: function () {
        openModal('Leave this test?', '<p>Your progress on this attempt will not be saved.</p>' +
          '<div class="card-actions"><button class="btn subtle" onclick="APP.closeModal()">Keep testing</button>' +
        '<button class="btn" onclick="APP.confirmQuit()">Leave</button></div>');
      },
      confirmQuit: function () {
        if (S) { S.stopTimer(); S.finished = true; }
        S = null; closeModal(); view = 'home'; render();
      },

      /* teaching-layer actions (drill mode) */
      hint: function () {
        var q = S.q();
        document.getElementById('help-live').innerHTML =
        '<div class="help-card"><h4>Hint</h4><p>' + q.hint + '</p></div>';
      },
      showStrategy: function () {
        var q = S.q();
        document.getElementById('help-live').innerHTML =
        '<div class="help-card strategy"><h4>The strategy</h4><p>' + q.strategy + '</p></div>';
      },
      check: function () {
        var st = S.st();
        if (st.choice === null && !(st.text || '').trim()) { toast('Choose or enter an answer first'); return; }
        st.checked = true;
        window.Store.recordEvents([S.eventFor(S.mod(), S.qi)]);
        render();
      },

      /* tools */
      calculator: function () {
        openModal('Calculator', '<div class="calc"><div class="screen" id="calc-screen">0</div><div class="keys">' +
          ['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '(', '+'].map(function (k) {
              return '<button class="' + ('/*-+()'.indexOf(k) >= 0 ? 'op' : '') + '" onclick="APP.calcKey(\'' + k + '\')">' + k + '</button>';
          }).join('') +
          '<button class="op" onclick="APP.calcKey(\')\')">)</button>' +
          '<button class="op" onclick="APP.calcKey(\'sqrt(\')">√</button>' +
          '<button class="op" onclick="APP.calcKey(\'C\')">C</button>' +
          '<button class="eq" onclick="APP.calcKey(\'=\')">=</button>' +
        '</div><p class="note" style="margin-top:12px">The real test provides a built-in Desmos graphing calculator. This one covers arithmetic; bring your own graphing calculator habits to Bluebook practice.</p></div>');
      },
      calcKey: function (k) {
        var s = document.getElementById('calc-screen');
        var cur = s.textContent === '0' ? '' : s.textContent;
        if (k === 'C') { s.textContent = '0'; return; }
        if (k === '=') {
          var expr = cur.replace(/sqrt\(/g, 'Math.sqrt(');
          if (!/^[0-9+\-*/(). Mathsqrt]*$/.test(expr)) { s.textContent = 'Error'; return; }
          try {
            var v = Function('"use strict";return (' + expr + ')')();
            s.textContent = (v === undefined || v === null || isNaN(v)) ? 'Error' : String(Math.round(v * 1e10) / 1e10);
          } catch (e) { s.textContent = 'Error'; }
          return;
        }
        s.textContent = cur + k;
      },
      reference: function () {
        function grid(rows) {
          var h = '<div class="refsheet">';
          rows.forEach(function (r) {
            h += '<div class="item"><b>' + r.label + '</b><div class="f">' + r.formula + '</div></div>';
          });
          return h + '</div>';
        }
        var h = '<p class="note" style="margin:0 0 12px">Bluebook shows you this with every math module, so you do not need to memorize it. Knowing when to open it is the skill.</p>';
        h += grid(window.STRATEGIES.reference);
        h += '<h4 style="margin:22px 0 6px">Not on the sheet</h4>';
        h += '<p class="note" style="margin:0 0 12px">These are not provided. If you need one of them mid-question and do not have it, you lose the question, so these are the ones to actually know.</p>';
        h += grid(window.STRATEGIES.memorize);
        openModal('Math formulas', h);
      },
      highlight: function () {
        var sel = window.getSelection();
        if (!sel || sel.isCollapsed) { toast('Select some text in the passage first'); return; }
        var range = sel.getRangeAt(0);
        var host = shell.querySelector('.pane-left');
        if (host && !host.contains(range.commonAncestorContainer)) { toast('Highlighting works inside the passage'); return; }
        try {
          var span = document.createElement('span');
          span.className = 'hl';
          span.appendChild(range.extractContents());
          range.insertNode(span);
          sel.removeAllRanges();
        } catch (e) { toast('Try selecting within a single paragraph'); }
      },
      colors: function () {
        var cur = currentPalette();
        var h = '<p class="note">Pick whatever you actually like opening. The question itself always looks the ' +
        'same as it does on the real test, on purpose.</p><div class="pal-grid">';
        PALETTES.forEach(function (pl) {
            h += '<button class="pal' + (pl.id === cur ? ' on' : '') + '" onclick="APP.setPalette(\'' + pl.id + '\')">' +
            '<div class="swatches">' + pl.sw.map(function (c) {
                return '<span class="sw" style="background:' + c + '"></span>';
            }).join('') + '</div>' +
            '<div class="nm">' + pl.name + '</div><div class="ds">' + pl.ds + '</div>' +
            (pl.id === cur ? '<div class="on-tag">Using this</div>' : '') + '</button>';
        });
        h += '</div>';
        openModal('Colors', h);
      },
      setPalette: function (id) {
        applyPalette(id);
        APP.colors();
        render();
      },
      showRecipe: function (id) {
        var st = window.STRATS[id];
        if (!st || !st.gen) return;
        var h = '<p class="note">This is the specification the app follows when it writes a new question for ' +
          'this move. It is here so you can see what is being asked for, and change it if you disagree. ' +
          'The recipes live in js/tags.js.</p>';
        h += '<div class="help-card strategy"><h4>The move</h4><p>' + st.move + '</p>' +
          '<p class="note">' + st.why + '</p></div>';
        h += '<div class="help-card steps"><h4>Shape of the question</h4><p>' + st.gen.shape + '</p></div>';
        h += '<div class="help-card"><h4>What the correct answer must do</h4><p>' + st.gen.key + '</p></div>';
        h += '<div class="help-card traps"><h4>Traps the wrong answers use</h4>';
        st.gen.traps.forEach(function (t) {
          if (!window.TRAPS[t]) return;
          h += '<div class="trap-row"><b></b><div><span class="trap-chip">' + window.TRAPS[t].name +
            '</span> ' + window.TRAPS[t].tell + '</div></div>';
        });
        h += '</div>';
        h += '<div class="help-card caught"><h4>How this question type goes wrong</h4><p>' + st.gen.avoid + '</p></div>';
        openModal(st.name, h);
      },
      strategies: function () {
        var h = '<div class="strat-list">';
        h += '<h3>Pacing</h3>';
        window.STRATEGIES.pacing.forEach(function (p) {
            h += '<details><summary>' + p.label + '</summary><div class="inner">' + p.detail + '</div></details>';
        });
        window.STRATEGIES.groups.forEach(function (g) {
            h += '<h3>' + g.title + '</h3>';
            g.items.forEach(function (it) {
                h += '<details><summary>' + it.name + '</summary><div class="inner">' + it.body + '</div></details>';
            });
        });
        h += '</div>';
        openModal('Strategy library', h);
      },

      /* review */
      filter: function (k) { reviewFilter = k; render(); },
      detail: function (qid) { openModal('Question review', detailHTML(qid)); },

      resetData: function () {
        openModal('Clear all saved progress?', '<p>This deletes every stored attempt and all skill statistics in this browser. It cannot be undone.</p>' +
          '<div class="card-actions"><button class="btn subtle" onclick="APP.closeModal()">Cancel</button>' +
        '<button class="btn" onclick="APP.confirmReset()">Clear everything</button></div>');
      },
      confirmReset: function () { window.Store.reset(); closeModal(); view = 'home'; render(); toast('Progress cleared'); }
    };
    window.APP = APP;

    /* ---------------- keyboard ---------------- */
    function onKey(e) {
      if (view !== 'exam' || !S) return;
      var tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') {
        if (e.key === 'Enter') { e.preventDefault(); APP.next(); }
        return;
      }
      if (!document.getElementById('modal-root').classList.contains('hidden')) return;
      var q = S.q();
      if (q.type !== 'spr') {
        var i = 'abcd'.indexOf(e.key.toLowerCase());
        if (i < 0) i = ['1', '2', '3', '4'].indexOf(e.key);
        if (i >= 0 && i < q.choices.length) { e.preventDefault(); S.select(i); return; }
      }
      if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); APP.next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); APP.prev(); }
      else if (e.key.toLowerCase() === 'm') { e.preventDefault(); S.toggleMark(); }
    }

    boot();
})();
