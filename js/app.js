/* ============================================================
   SAT LockIn: UI layer
   ============================================================ */
(function () {
    'use strict';

    var shell = document.getElementById('shell');
    var S = null;            // active Session
    var view = 'home';       // home | skills | progress | directions | break | exam | review
    var reviewData = null;   // attempt being reviewed
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

    function boot() {
      applyPalette(currentPalette());
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
          if (view === 'auth' || view === 'home' || view === 'class' || view === 'coverage') render();
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
      if (view === 'exam' || view === 'break' || view === 'directions') rememberScroll();
      var html =
      view === 'home' ? homeHTML() :
      view === 'skills' ? skillsHTML() :
      view === 'progress' ? progressHTML() :
      view === 'diagnosis' ? diagnosisHTML() :
      view === 'auth' ? authHTML() :
      view === 'class' ? classHTML() :
      view === 'coverage' ? coverageHTML() :
      view === 'directions' ? directionsHTML() :
      view === 'break' ? breakHTML() :
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
    function mission() {
      var agg = window.Store.agg();
      var missed = window.Store.missedQueue(60);
      var trap = window.Store.topTraps(1)[0];
      var weak = window.Store.weakestStrats(1)[0];

      if (!agg.total.seen) {
        return { kicker: 'Start here', title: 'Warm up with ten questions',
          body: 'Answer ten questions and this screen turns into a map of exactly which tricks the SAT plays on you.',
          cta: 'Start a 10-question set', act: 'APP.quickMix()' };
      }
      if (missed.length >= 5) {
        return { kicker: 'Do this first', title: 'Fix the ' + Math.min(missed.length, 10) + ' you got wrong',
          body: 'You have ' + missed.length + ' questions waiting where your last answer was wrong. Coming back to those a few days later is honestly the most useful thing you can do with 15 minutes.',
          cta: 'Retry them', act: 'APP.drillMissed()', alt: 'See the full diagnosis', altAct: "APP.go('diagnosis')" };
      }
      if (trap && window.TRAPS[trap.id] && trap.n >= 2) {
        var tp = window.TRAPS[trap.id];
        return { kicker: 'The trap that keeps getting you', title: tp.name,
          body: 'This one has caught you ' + trap.n + ' times. ' + tp.fix + ' Here are ten questions with that exact trap sitting in the choices, so you can practice spotting it.',
          cta: 'Practice against it', act: "APP.drillTrap('" + trap.id + "')", alt: 'See the full diagnosis', altAct: "APP.go('diagnosis')" };
      }
      if (weak && window.STRATS[weak.id]) {
        var st = window.STRATS[weak.id];
        return { kicker: 'The move to practice', title: st.name,
          body: st.move + ' Right now you are getting ' + weak.right + ' of ' + weak.seen + ' when this move is what is being tested.',
          cta: 'Practice this move', act: "APP.drillStrat('" + weak.id + "')", alt: 'See the full diagnosis', altAct: "APP.go('diagnosis')" };
      }
      return { kicker: 'Nothing needs fixing', title: 'Time for a full test',
        body: 'Nothing is flagged for you right now, so the best use of a free couple of hours is a full test under real timing.',
        cta: 'Start full test', act: 'APP.startFull()' };
    }

    function homeHTML() {
      var d = window.Store.data();
      var agg = window.Store.agg();
      var last = d.attempts[0];
      var streak = window.Store.streak();
      var today = window.Store.answeredToday();
      var C = window.Cloud;
      var m = mission();
      var firstName = String(d.name || 'there').split(' ')[0];

      var h = '<div class="home">';

      /* ---- greeting row ---- */
      h += '<div class="greet"><div>' +
      '<div class="hi">' + (agg.total.seen ? 'Hi ' + esc(firstName) : wordmark()) + '</div>' +
      '<div class="tagline">' + (agg.total.seen ? window.BRAND.tagline : esc(window.BRAND.tagline)) + '</div>' +
      '</div><div class="chips">';
      if (streak > 0) h += '<span class="chip streak">' + ic('bolt') + streak + '-day streak</span>';
      if (today > 0) h += '<span class="chip up">' + today + ' today</span>';
      if (C && C.enabled) {
        h += C.signedIn()
        ? '<span class="chip live">' + ic('cloud') + 'Saved to your account</span>'
        : '<span class="chip">This device only</span>';
        h += '<button class="chip acct">' + ic('user') + '<span onclick="APP.account()">' +
        (C.signedIn() && C.profile ? esc(C.profile.display_name || 'Account') : 'Sign in') + '</span></button>';
      } else {
        h += '<button class="chip acct" onclick="APP.rename()">' + ic('user') + esc(d.name) + '</button>';
      }
      if (C && C.signedIn() && C.profile && C.profile.role === 'teacher') {
        h += '<button class="chip acct" onclick="APP.openClass()">' + ic('people') + 'Class</button>';
      }
      h += '</div></div>';

      /* ---- mission ---- */
      h += '<div class="mission"><div class="m-body">' +
      '<div class="m-kicker">' + m.kicker + '</div>' +
      '<h2>' + m.title + '</h2><p>' + m.body + '</p>' +
      '<div class="m-actions"><button class="btn" onclick="' + m.act + '">' + m.cta + '</button>' +
      (m.alt ? '<button class="btn ghost" onclick="' + m.altAct + '">' + m.alt + '</button>' : '') +
      '</div></div></div>';

      /* ---- stat tiles ---- */
      if (agg.total.seen) {
        var trapCount = 0;
        Object.keys(agg.traps).forEach(function (k) { trapCount += agg.traps[k].n; });
        h += '<div class="tiles">';
        h += '<div class="tile"><div class="t-lbl">Accuracy</div><div class="t-val">' + pct(agg.total.right, agg.total.seen) + '%</div>' +
        '<div class="t-sub">' + agg.total.right + ' right out of ' + agg.total.seen + '</div></div>';
        if (last && last.total) {
          h += '<div class="tile"><div class="t-lbl">Latest total</div><div class="t-val">' + last.total + '</div>' +
          '<div class="t-sub">estimate, out of 1600</div></div>';
        }
        h += '<div class="tile spot"><div class="t-lbl">Traps dodged</div><div class="t-val">' +
        (agg.total.seen - trapCount) + '</div><div class="t-sub">' + trapCount + ' slipped through</div></div>';
        h += '<div class="tile"><div class="t-lbl">Questions seen</div><div class="t-val">' +
        Object.keys(window.Store.seenCount()).length + '</div><div class="t-sub">of ' +
        (window.RW_BANK.length + window.MATH_BANK.length) + ' in the bank</div></div>';
        h += '</div>';
      }

      /* ---- practice modes ---- */
      h += '<div class="section-title">Practice</div><div class="card-grid">';

      h += '<div class="card mode-card full"><div class="icon">' + ic('clock') + '</div>' +
      '<h3>Full-length test</h3>' +
      '<p>The real thing. Two Reading and Writing modules, a 10 minute break, then two Math modules. Module 2 gets harder or easier depending on how Module 1 goes, exactly like the real test.</p>' +
      '<div class="spacer"></div><div class="meta">98 questions \u00b7 2 hr 14 min</div>' +
      '<div class="card-actions"><button class="btn" onclick="APP.startFull()">Start</button></div></div>';

      h += '<div class="card mode-card sec"><div class="icon">' + ic('layers') + '</div>' +
      '<h3>One section</h3>' +
      '<p>Both modules of one section, with the real clock running. Short enough for a school night.</p>' +
      '<div class="spacer"></div><div class="meta">54 q / 64 min \u00b7 44 q / 70 min</div>' +
      '<div class="card-actions"><button class="btn" onclick="APP.startSection(\'rw\')">Reading &amp; Writing</button>' +
      '<button class="btn ghost" onclick="APP.startSection(\'math\')">Math</button></div></div>';

      h += '<div class="card mode-card skill"><div class="icon">' + ic('target') + '</div>' +
      '<h3>Untimed practice</h3>' +
      '<p>One skill at a time, no clock. You get a hint, the strategy, a full worked solution, and the name of the trick behind every wrong answer.</p>' +
      '<div class="spacer"></div><div class="meta">' + (window.RW_BANK.length + window.MATH_BANK.length) +
      ' questions \u00b7 ' + skillList().length + ' skills</div>' +
      '<div class="card-actions"><button class="btn" onclick="APP.go(\'skills\')">Pick a skill</button>' +
      '<button class="btn ghost" onclick="APP.quickMix()">Quick 10</button></div></div>';

      h += '<div class="card mode-card diag"><div class="icon">' + ic('scope') + '</div>' +
      '<h3>Diagnosis</h3>' +
      '<p>See which traps keep working on you, which strategies are slipping, and everything you have missed and not yet fixed.</p>' +
      '<div class="spacer"></div><div class="meta">' +
      (agg.total.seen ? Object.keys(agg.traps).length + ' trap types recorded' : 'needs a few questions first') + '</div>' +
      '<div class="card-actions"><button class="btn" onclick="APP.go(\'diagnosis\')">Open diagnosis</button>' +
      (window.Cloud && window.Cloud.aiEnabled && window.Cloud.signedIn()
        ? '<button class="btn ghost" onclick="APP.aiCoach()">Coaching note</button>' : '') +
      '</div></div>';

      h += '</div>';

      /* ---- top trap + recent ---- */
      var topTrap = window.Store.topTraps(1)[0];
      if (topTrap && window.TRAPS[topTrap.id] || last) {
        h += '<div class="section-title">Where things stand</div><div class="card-grid">';
        if (topTrap && window.TRAPS[topTrap.id]) {
          var tp = window.TRAPS[topTrap.id];
          h += '<div class="card"><span class="pill">Most common trap</span><h3>' + tp.name + '</h3>' +
          '<p><strong>How to spot it:</strong> ' + tp.tell + '</p><p><strong>What to do:</strong> ' + tp.fix + '</p>' +
          '<div class="spacer"></div><div class="card-actions">' +
          '<button class="btn ghost sm" onclick="APP.drillTrap(\'' + topTrap.id + '\')">Practice against it</button></div></div>';
        }
        var wStrats = window.Store.weakestStrats(3);
        if (wStrats.length) {
          h += '<div class="card"><span class="pill">Strategies</span><h3>Moves to work on</h3>';
          wStrats.forEach(function (st) {
              var meta = window.STRATS[st.id]; if (!meta) return;
              var p = pct(st.right, st.seen);
              h += '<div class="skill-row"><div>' + esc(meta.name) + '</div>' +
              '<div class="bar ' + (p >= 70 ? 'good' : p >= 50 ? 'mid' : 'bad') + '"><i style="width:' + p + '%"></i></div>' +
              '<div class="n">' + p + '%</div></div>';
          });
          h += '<div class="spacer"></div><div class="card-actions"><button class="btn ghost sm" onclick="APP.go(\'diagnosis\')">Full diagnosis</button></div></div>';
        }
        if (last) {
          h += '<div class="card"><span class="pill">Last sitting</span><h3>' +
          (last.total ? last.total + ' / 1600' : (last.label ? esc(last.label) : 'Practice set')) + '</h3>' +
          '<p class="meta">' + dateLabel(last.finishedAt) + '</p><div class="spacer"></div>' +
          '<div class="card-actions"><button class="btn ghost sm" onclick="APP.review(\'' + last.id + '\')">Review it</button>' +
          '<button class="btn subtle sm" onclick="APP.go(\'progress\')">All attempts</button></div></div>';
        }
        h += '</div>';
      }

      /* ---- reference ---- */
      h += '<div class="section-title">Reference</div><div class="card-grid">' +
      '<div class="card"><h3>Strategy library</h3><p>Every move worth knowing, grouped by question type, plus pacing and the fill-in answer rules.</p>' +
      '<div class="spacer"></div><div class="card-actions"><button class="btn ghost sm" onclick="APP.strategies()">Open</button></div></div>' +
      '<div class="card"><h3>Trap catalog</h3><p>All ' + Object.keys(window.TRAPS).length +
      ' tricks the test uses to build wrong answers, with how to spot each one.</p>' +
      '<div class="spacer"></div><div class="card-actions"><button class="btn ghost sm" onclick="APP.trapBook()">Open</button></div></div>' +
      '<div class="card"><h3>Math reference sheet</h3><p>The formula sheet the real test gives you. Knowing when to open it is the skill.</p>' +
      '<div class="spacer"></div><div class="card-actions"><button class="btn ghost sm" onclick="APP.reference()">Open</button></div></div>' +
      '<div class="card"><h3>Everything to lock in</h3><p>The full checklist: 22 strategies and 42 traps, with everything you have already locked in ticked off.</p>' +
        '<div class="spacer"></div><div class="card-actions"><button class="btn ghost sm" onclick="APP.go(\'coverage\')">Open checklist</button></div></div>' +
        '<div class="card"><h3>Colors</h3><p>Five palettes. Pick the one you like opening.</p>' +
      '<div class="spacer"></div><div class="card-actions"><button class="btn ghost sm" onclick="APP.colors()">Change colors</button></div></div>' +
      '<div class="card"><h3>How the test is built</h3><p>Module structure, timing, domain weighting, and how the adaptive routing sets your score ceiling.</p>' +
      '<div class="spacer"></div><div class="card-actions"><button class="btn ghost sm" onclick="APP.testFormat()">Open</button></div></div>' +
      '</div>';

      h += '</div>';
      return h;
    }

    /* ============================================================
       PRACTICE BY SKILL
       ============================================================ */
    function skillList() {
      var out = {};
      window.RW_BANK.concat(window.MATH_BANK).forEach(function (q) {
          var k = q.section + '|' + q.domain + '|' + q.skill;
          out[k] = out[k] || { section: q.section, domain: q.domain, skill: q.skill, n: 0 };
          out[k].n++;
      });
      return Object.keys(out).map(function (k) { return out[k]; });
    }
    function skillsHTML() {
      var agg = window.Store.agg();
      var list = skillList();
      var h = '<div class="home"><div class="home-head"><div><div class="brand">Practice by skill</div>' +
      '<div class="tagline">Untimed. Every question comes with a hint, the strategy, the worked solution, and a look at each wrong answer.</div></div>' +
      '<button class="btn subtle sm" onclick="APP.go(\'home\')">← Home</button></div><div class="home-hr"></div>';

      ['rw', 'math'].forEach(function (sec) {
          var domains = {};
          list.filter(function (s) { return s.section === sec; }).forEach(function (s) {
              (domains[s.domain] = domains[s.domain] || []).push(s);
          });
          h += '<div class="section-title">' + (sec === 'rw' ? 'Reading and Writing' : 'Math') + '</div>';
          Object.keys(domains).forEach(function (dom) {
              h += '<div class="card" style="margin-bottom:12px"><h3>' + esc(dom) + '</h3>';
              domains[dom].forEach(function (s) {
                  var st = agg.skills[s.section + '|' + s.domain + '|' + s.skill];
                  var p = st && st.seen ? pct(st.right, st.seen) : null;
                  h += '<div class="skill-row" style="grid-template-columns:1fr 90px 70px 130px">' +
                  '<div>' + esc(s.skill) + ' <span class="n">(' + s.n + ' available)</span></div>' +
                  '<div class="bar ' + (p === null ? '' : p >= 70 ? 'good' : p >= 50 ? 'mid' : 'bad') + '"><i style="width:' + (p || 0) + '%"></i></div>' +
                  '<div class="n">' + (p === null ? '-' : p + '%') + '</div>' +
                  '<div style="text-align:right"><button class="btn ghost sm" onclick="APP.drillSkill(\'' + s.section + '\',\'' + esc(s.skill).replace(/'/g, "\\'") + '\')">Practice</button></div>' +
                  '</div>';
              });
              h += '</div>';
          });
      });
      h += '</div>';
      return h;
    }

    /* ============================================================
       PROGRESS
       ============================================================ */
    function progressHTML() {
      var d = window.Store.data();
      var h = '<div class="home"><div class="home-head"><div><div class="brand">Progress</div>' +
      '<div class="tagline">Every attempt is stored in this browser only.</div></div>' +
      '<button class="btn subtle sm" onclick="APP.go(\'home\')">← Home</button></div><div class="home-hr"></div>';

      if (!d.attempts.length) {
        h += '<div class="card"><p>No attempts yet. Take a full test or a section to start building a record.</p></div></div>';
        return h;
      }

      h += '<div class="section-title">Attempts</div><div class="card"><table class="plain">' +
      '<tr><th>When</th><th>What</th><th>RW</th><th>Math</th><th>Total</th><th></th></tr>';
      d.attempts.forEach(function (a) {
          var kind = a.kind === 'full' ? 'Full test' : a.kind === 'drill' ? (a.label || 'Practice set') :
          (a.kind === 'rw' ? 'RW section' : 'Math section');
          h += '<tr><td>' + dateLabel(a.finishedAt) + '</td><td>' + esc(kind) + '</td>' +
          '<td>' + (a.sections.rw ? a.sections.rw.scaled : '-') + '</td>' +
          '<td>' + (a.sections.math ? a.sections.math.scaled : '-') + '</td>' +
          '<td><strong>' + (a.total || '-') + '</strong></td>' +
          '<td style="text-align:right"><button class="btn ghost sm" onclick="APP.review(\'' + a.id + '\')">Review</button></td></tr>';
      });
      h += '</table></div>';

      var aggS = window.Store.agg().skills;
      var skills = Object.keys(aggS).map(function (k) { return aggS[k]; })
      .filter(function (s) { return s.seen > 0; })
      .sort(function (a, b) { return (a.right / a.seen) - (b.right / b.seen); });
      if (skills.length) {
        h += '<div class="section-title">Accuracy by skill</div><div class="card">';
        skills.forEach(function (s) {
            var p = pct(s.right, s.seen);
            h += '<div class="skill-row" style="grid-template-columns:1fr 110px 60px 110px">' +
            '<div>' + esc(s.skill) + ' <span class="n">· ' + (s.section === 'rw' ? 'RW' : 'Math') + '</span></div>' +
            '<div class="bar ' + (p >= 70 ? 'good' : p >= 50 ? 'mid' : 'bad') + '"><i style="width:' + p + '%"></i></div>' +
            '<div class="n">' + s.right + '/' + s.seen + '</div>' +
            '<div style="text-align:right"><button class="btn ghost sm" onclick="APP.drillSkill(\'' + s.section + '\',\'' + esc(s.skill).replace(/'/g, "\\'") + '\')">Practice</button></div></div>';
        });
        h += '</div>';
      }

      h += '<div class="section-title">Data</div><div class="card"><p class="note">Everything is stored locally in this browser. Clearing it cannot be undone.</p>' +
      '<div class="card-actions"><button class="btn subtle sm" onclick="APP.resetData()">Clear all saved progress</button></div></div>';
      h += '</div>';
      return h;
    }


    /* ============================================================
       DIAGNOSIS -- which strategies are failing, which tricks keep working
       ============================================================ */
    function trendChip(t) {
      if (t === null || t === undefined) return '<span class="chip flat">too early to tell</span>';
      if (t > 4) return '<span class="chip up">getting better +' + t + '</span>';
      if (t < -4) return '<span class="chip down">slipping ' + t + '</span>';
      return '<span class="chip flat">steady</span>';
    }

    function diagnosisHTML() {
      var agg = window.Store.agg();
      var traps = window.Store.topTraps(8);
      var strats = [];
      Object.keys(agg.strats).forEach(function (k) { strats.push(agg.strats[k]); });
      strats.sort(function (a, b) { return (a.right / a.seen) - (b.right / b.seen); });
      var missed = window.Store.missedQueue(60);

      var h = '<div class="home"><div class="home-head"><div><div class="brand">Diagnosis</div>' +
      '<div class="tagline">Here is what is actually tripping you up, and what to do about each one.</div></div>' +
      '<div class="card-actions">' +
      (missed.length ? '<button class="btn sm" onclick="APP.drillMissed()">Fix my last ' + Math.min(missed.length, 10) + '</button>' : '') +
      '<button class="btn subtle sm" onclick="APP.go(\'home\')">&larr; Home</button></div></div><div class="home-hr"></div>';

      if (!agg.total.seen) {
        h += '<div class="card"><p>Nothing to show yet. Once you have answered a few questions this fills in, because every wrong answer gets labeled with the trick behind it and every question is tagged with the move it tests.</p>' +
        '<div class="card-actions" style="margin-top:12px"><button class="btn" onclick="APP.quickMix()">Start a 10-question set</button></div></div></div>';
        return h;
      }

      /* ---- headline leaks ---- */
      h += '<div class="section-title">What keeps catching you</div>';
      if (!traps.length) {
        h += '<div class="card"><p>No wrong multiple choice answers yet. Keep going.</p></div>';
      } else {
        h += '<div class="leaks">';
        traps.slice(0, 3).forEach(function (t, i) {
            var tp = window.TRAPS[t.id];
            h += '<div class="leak"><div class="leak-rank">' + (i + 1) + '</div><div class="leak-body">' +
            '<h3>' + tp.name + ' <span class="leak-n">' + t.n + ' time' + (t.n > 1 ? 's' : '') + '</span></h3>' +
            '<p class="leak-fam">' + window.TRAP_FAMILIES[tp.fam].name + ' &middot; ' + window.TRAP_FAMILIES[tp.fam].blurb + '</p>' +
            '<p><strong>How to spot it:</strong> ' + tp.tell + '</p>' +
            '<p><strong>What to do:</strong> ' + tp.fix + '</p>' +
            '<div class="card-actions"><button class="btn ghost sm" onclick="APP.drillTrap(\'' + t.id + '\')">Practice spotting it</button></div>' +
            '</div></div>';
        });
        h += '</div>';
      }

      /* ---- all traps, by family ---- */
      var famTotal = 0;
      Object.keys(agg.fams).forEach(function (f) { famTotal += agg.fams[f]; });
      if (famTotal) {
        h += '<div class="section-title">Where your wrong answers come from</div><div class="card">';
        Object.keys(window.TRAP_FAMILIES).forEach(function (f) {
            var n = agg.fams[f] || 0;
            var p = famTotal ? Math.round(100 * n / famTotal) : 0;
            h += '<div class="skill-row" style="grid-template-columns:190px 1fr 70px">' +
            '<div><strong>' + window.TRAP_FAMILIES[f].name + '</strong><div class="n" style="text-align:left">' +
            window.TRAP_FAMILIES[f].blurb + '</div></div>' +
            '<div class="bar ' + (p >= 34 ? 'bad' : p >= 20 ? 'mid' : '') + '"><i style="width:' + p + '%"></i></div>' +
            '<div class="n">' + n + ' (' + p + '%)</div></div>';
        });
        h += '</div>';

        if (traps.length > 3) {
          h += '<div class="card" style="margin-top:12px"><h3>Every trick that has caught you</h3><table class="plain">' +
          '<tr><th>Trick</th><th>Family</th><th>Times</th><th></th></tr>';
          traps.forEach(function (t) {
              var tp = window.TRAPS[t.id];
              h += '<tr><td><strong>' + tp.name + '</strong><div class="n" style="text-align:left">' + tp.fix + '</div></td>' +
              '<td>' + window.TRAP_FAMILIES[tp.fam].name + '</td><td>' + t.n + '</td>' +
              '<td style="text-align:right"><button class="btn ghost sm" onclick="APP.drillTrap(\'' + t.id + '\')">Practice</button></td></tr>';
          });
          h += '</table></div>';
        }
      }

      /* ---- strategies ---- */
      h += '<div class="section-title">Your moves, weakest first</div><div class="card">';
      h += '<p class="note" style="margin-bottom:14px">Every question is really testing whether you make one particular move. This is how often you make it, across every topic where it shows up.</p>';
      strats.forEach(function (st) {
          var meta = window.STRATS[st.id]; if (!meta) return;
          var p = pct(st.right, st.seen);
          var tr = window.Store.trend(st.id, 8);
          h += '<div class="strat-row">' +
          '<div><strong>' + meta.name + '</strong> <span class="n">' + (meta.section === 'rw' ? 'Reading and Writing' : 'Math') + '</span>' +
          '<div class="strat-move-sm">' + meta.move + '</div></div>' +
          '<div class="bar ' + (p >= 70 ? 'good' : p >= 50 ? 'mid' : 'bad') + '"><i style="width:' + p + '%"></i></div>' +
          '<div class="n">' + st.right + '/' + st.seen + '</div>' +
          '<div>' + trendChip(tr) + '</div>' +
          '<div style="text-align:right"><button class="btn ghost sm" onclick="APP.drillStrat(\'' + st.id + '\')">Practice</button></div>' +
          '</div>';
      });
      h += '</div>';

      /* ---- retry queue ---- */
      if (missed.length) {
        h += '<div class="section-title">Still unfixed</div><div class="card">' +
        '<p class="note">' + missed.length + ' question' + (missed.length > 1 ? 's' : '') +
        ' where your most recent try was wrong. Coming back to these after a few days is the best practice there is.</p>' +
        '<div class="card-actions" style="margin-top:12px">' +
        '<button class="btn" onclick="APP.drillMissed()">Do ' + Math.min(missed.length, 10) + ' of them now</button></div></div>';
      }

      h += '</div>';
      return h;
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
       SIGN IN
       ============================================================ */
    function authHTML() {
      var C = window.Cloud, cfg = window.CONFIG || {};
      var h = '<div class="auth-wrap"><div class="auth-card">';
      h += '<div class="auth-mark">' + ic('target') + '</div>';
      h += '<h1>' + esc(window.BRAND.name) + '</h1>';
      h += '<p class="auth-sub">' + esc(window.BRAND.tagline) + '</p>';
      if (cfg.className) h += '<p class="auth-class">' + esc(cfg.className) + '</p>';

      if (authState.stage === 'email') {
        h += '<label class="fld"><span>Your email</span>' +
        '<input id="auth-email" type="email" autocomplete="email" placeholder="you@school.edu" value="' + esc(authState.email) + '" ' +
        'onkeydown="if(event.key===\'Enter\')APP.sendCode()"></label>';
        h += '<button class="btn big" ' + (authState.busy ? 'disabled' : '') + ' onclick="APP.sendCode()">' +
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
      return '<div class="cv-row"><div><strong>' + name + '</strong>' +
      '<div class="n" style="text-align:left">' + blurb + '</div></div>' +
      '<div>' + stateChip(c) + '</div>' +
      '<div style="text-align:right"><button class="btn ghost sm" onclick="' + act + '(\'' + id + '\')">' +
      (c ? 'Practice' : 'Start') + '</button></div></div>';
    }

    function coverageHTML() {
      var cov = window.Store.coverage();
      var sum = window.Store.coverageSummary();
      var canWrite = window.Cloud && window.Cloud.aiEnabled && window.Cloud.signedIn();
      var gen = window.RW_BANK.concat(window.MATH_BANK).filter(function (q) { return q.generated; }).length;

      var h = '<div class="home"><div class="home-head"><div><div class="brand">Everything to lock in</div>' +
      '<div class="tagline">Two checklists: the moves you need to make, and the traps you need to see coming. ' +
      'Something is locked in once you have met it three times and got the last three right.</div></div>' +
      '<button class="btn subtle sm" onclick="APP.go(\'home\')">Back</button></div><div class="home-hr"></div>';

      h += '<div class="tiles">' +
      '<div class="tile"><div class="t-lbl">Strategies locked in</div><div class="t-val">' + sum.strats.mastered +
      '<span style="font-size:17px;color:var(--shell-soft)">/' + sum.strats.total + '</span></div>' +
      '<div class="t-sub">' + sum.strats.learning + ' in progress</div></div>' +
      '<div class="tile spot"><div class="t-lbl">Traps you can spot</div><div class="t-val">' + sum.traps.mastered +
      '<span style="font-size:17px;color:var(--shell-soft)">/' + sum.traps.total + '</span></div>' +
      '<div class="t-sub">' + sum.traps.learning + ' in progress</div></div>' +
      '<div class="tile"><div class="t-lbl">Questions in your bank</div><div class="t-val">' +
      (window.RW_BANK.length + window.MATH_BANK.length) + '</div><div class="t-sub">' +
      (gen ? gen + ' written for you' : 'all built in') + '</div></div></div>';

      if (canWrite) {
        h += '<div class="mission" style="margin-top:20px"><div class="m-body">' +
        '<div class="m-kicker">Never run out</div><h2>Write me questions for what is left</h2>' +
        '<p>Claude writes new questions aimed at whatever is still unlearned, in SAT format and scope, ' +
        'and every one is checked before it reaches you. Sonnet does the writing, because inventing a ' +
        'genuinely tempting wrong answer is the hard part.</p>' +
        '<div class="m-actions"><button class="btn" onclick="APP.fillGaps()">Write 3 for my biggest gap</button>' +
        '<button class="btn ghost" onclick="APP.genPicker()">Choose what to write</button></div></div></div>';
      } else {
        h += '<div class="card" style="margin-top:20px"><h3>Want unlimited questions?</h3>' +
        '<p>With the AI tutor switched on, the app writes new questions aimed at whatever is still ' +
        'unlearned, so you never run out and every strategy gets covered. Setup is in SETUP-CLOUD.md.</p></div>';
      }

      h += '<div class="section-title">The 22 moves</div>';
      ['rw', 'math'].forEach(function (sec) {
          h += '<div class="card" style="margin-bottom:12px"><h3>' +
          (sec === 'rw' ? 'Reading and Writing' : 'Math') + '</h3>';
          Object.keys(window.STRATS).forEach(function (id) {
              if (window.STRATS[id].section !== sec) return;
              h += cvRow(id, window.STRATS[id].name, window.STRATS[id].move, cov.strats[id], 'strat');
          });
          h += '</div>';
      });

      h += '<div class="section-title">The 42 traps</div>';
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

    /* ============================================================
       DIRECTIONS / BREAK
       ============================================================ */
    function directionsHTML() {
      var m = S.mod();
      var isRW = m.section === 'rw';
      var h = '<div class="exam"><div class="exam-top"><div><div class="sec-name">' + esc(m.label) + '</div>' +
      '<div class="sec-sub">Directions</div></div><div class="timer-wrap"><div class="timer-hidden">Clock starts when you begin</div></div><div class="tools"></div></div>';
      h += '<div class="centered"><div class="box"><h2>' + esc(m.label) + '</h2>' +
      '<p>' + m.questions.length + ' questions · ' + Math.round(m.seconds / 60) + ' minutes</p>' +
      '<div class="dirs">';
      if (isRW) {
        h += '<strong>Directions</strong><ul>' +
        '<li>The questions in this section address a number of important reading and writing skills. Each question includes one or more passages, which you should read before answering.</li>' +
        '<li>All questions are multiple choice with four answer choices. Each question has a single best answer.</li>' +
        '<li>There is no penalty for guessing, so answer every question.</li></ul>';
      } else {
        h += '<strong>Directions</strong><ul>' +
        '<li>Most questions are multiple choice. On the rest you type your answer straight in. Those are the student-produced response questions.</li>' +
        '<li>A calculator and the reference sheet are available for every question in this section, from the tools in the upper right.</li>' +
        '<li>For fill-in answers: no mixed numbers (enter 5/2, not 2 1/2), no symbols, and if an answer will not fit, give at least three digits, rounded or truncated.</li>' +
        '<li>There is no penalty for guessing, so answer every question.</li></ul>';
      }
      h += '</div>';
      h += '<div class="dirs" style="background:var(--blue-soft);border-color:var(--blue)"><strong>Tools you can use, same as on test day</strong><ul>' +
      '<li><strong>Mark for Review</strong> flags a question so you can come back to it.</li>' +
      '<li><strong>ABC</strong> turns on the answer eliminator so you can cross out choices you have ruled out.</li>' +
      (isRW ? '<li><strong>Highlight</strong> marks up any text you have selected in the passage.</li>'
        : '<li><strong>Calculator</strong> and <strong>Reference</strong> are open as often as you like.</li>') +
      '<li>The <strong>question navigator</strong> at the bottom shows which questions are answered and which are flagged.</li></ul></div>';
      h += '<button class="btn" style="font-size:17px;padding:12px 34px" onclick="APP.beginModule()">Begin ' +
      (m.num === 2 ? 'Module 2' : 'this module') + '</button>';
      if (m.num === 2) {
        h += '<p class="note" style="margin-top:14px">Module 2 has been assembled at the <strong>' +
        (m.kind === 'hard' ? 'harder' : 'easier') + '</strong> difficulty, based on how Module 1 went. This is the adaptive step the real test takes.</p>';
      }
      h += '</div></div></div>';
      return h;
    }

    function breakHTML() {
      var m = S.mod();
      return '<div class="exam"><div class="exam-top"><div><div class="sec-name">Break</div>' +
      '<div class="sec-sub">Reading and Writing complete</div></div><div class="timer-wrap"></div><div class="tools"></div></div>' +
      '<div class="centered"><div class="box"><h2>Take a 10-minute break</h2>' +
      '<div class="bigtimer" id="timer">' + fmt(m.remaining) + '</div>' +
      '<p>Stand up, drink some water, and shake out your hands. On test day you may not use your phone, leave the room without permission, or discuss the test.</p>' +
      '<p class="note" style="margin-top:16px">Testing resumes automatically when the break ends.</p>' +
      '<div class="card-actions" style="justify-content:center;margin-top:22px">' +
      '<button class="btn" onclick="APP.skipBreak()">Resume testing now</button></div>' +
      '</div></div></div>';
    }

    /* ============================================================
       EXAM
       ============================================================ */
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
      var h = '<div class="review-wrap"><div class="home-head"><div><div class="brand">' +
      (a.kind === 'full' ? 'Full test results' : a.kind === 'drill' ? 'Practice set results' : 'Section results') + '</div>' +
      '<div class="tagline">' + dateLabel(a.finishedAt) + '</div></div>' +
      '<div class="card-actions"><button class="btn subtle sm" onclick="APP.go(\'progress\')">Progress</button>' +
      '<button class="btn ghost sm" onclick="APP.go(\'home\')">Home</button></div></div>';

      if (a.kind !== 'drill') {
        h += '<div class="score-hero">';
        if (a.total) h += '<div class="score-box"><div class="lbl">Total (estimated)</div><div class="big">' + a.total + '</div><div class="sub">out of 1600</div></div>';
        ['rw', 'math'].forEach(function (sec) {
            var s = a.sections[sec];
            if (!s) return;
            h += '<div class="score-box"><div class="lbl">' + (sec === 'rw' ? 'Reading and Writing' : 'Math') + '</div>' +
            '<div class="big">' + s.scaled + '</div><div class="sub">' + s.raw + ' of ' + s.total + ' correct' +
            (s.path ? ' · routed to the ' + (s.path === 'hard' ? 'harder' : 'easier') + ' module 2' : '') + '</div></div>';
        });
        h += '</div>';
        h += '<p class="note">Estimated from published practice-test curves. The module you were routed to caps the section score, which is why the routing is shown.</p>';
      } else {
        var right = a.items.filter(function (i) { return i.correct === true; }).length;
        h += '<div class="score-hero"><div class="score-box"><div class="lbl">Correct</div><div class="big">' +
        right + '/' + a.items.length + '</div><div class="sub">' + esc(a.label || 'practice set') + '</div></div></div>';
      }

      var counts = {
        all: a.items.length,
        wrong: a.items.filter(function (i) { return i.correct === false || i.correct === null; }).length,
        marked: a.items.filter(function (i) { return i.marked; }).length
      };
      h += '<div class="filters">' +
      fbtn('all', 'All ' + counts.all) + fbtn('wrong', 'Missed and skipped ' + counts.wrong) +
      fbtn('marked', 'Marked ' + counts.marked) +
      (a.sections.rw && a.sections.math ? fbtn('rw', 'Reading and Writing') + fbtn('math', 'Math') : '') +
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
          (it.module ? ' · Module ' + it.module : '') + (it.marked ? ' · marked' : '') + '</div></div>' +
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

    function detailHTML(qid) {
      var q = ALLQ[qid];
      var it = reviewData.items.filter(function (i) { return i.qid === qid; })[0] || {};
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
      sess.on('module-change', function () {
          closeModal();
          S.paused = true;
          view = S.isBreak() ? 'break' : 'directions';
          if (S.isBreak()) S.paused = false;
          render();
      });
      sess.on('expired', function () { toast('Time is up on that module'); });
      sess.on('finished', function (res) {
          closeModal();
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
        if (S && !S.finished && (view === 'exam' || view === 'break' || view === 'directions')) return;
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

      /* ---------- writing new questions ---------- */
      fillGaps: function () {
        var plan = window.Generate.gapPlan();
        if (!plan.length) {
          openModal('Nothing left', '<p>You have met and beaten every strategy and every trap in the catalog. ' +
            'That is the whole checklist done. Sit a full test to see it hold up under time pressure.</p>' +
          '<div class="card-actions"><button class="btn" onclick="APP.closeModal();APP.startFull()">Start a full test</button></div>');
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
          var qs = window.RW_BANK.concat(window.MATH_BANK).filter(function (q) { return window.tagsFor(q).strat === target.id; });
          var tset = {};
          qs.forEach(function (q) { var t = window.tagsFor(q); Object.keys(t.traps).forEach(function (k) { tset[t.traps[k]] = 1; }); });
          opts.traps = Object.keys(tset).slice(0, 4);
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
            h += '<button class="btn subtle" onclick="APP.closeModal();APP.go(\'coverage\')">Back to the checklist</button></div>';
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
      aiCoach: function () {
        var agg = window.Store.agg();
        var traps = window.Store.topTraps(5).map(function (t) {
            return (window.TRAPS[t.id] ? window.TRAPS[t.id].name : t.id) + ': ' + t.n + ' times';
        }).join('; ');
        var strats = window.Store.weakestStrats(5).map(function (st) {
            return (window.STRATS[st.id] ? window.STRATS[st.id].name : st.id) + ': ' + st.right + '/' + st.seen;
        }).join('; ');
        var best = [];
        Object.keys(agg.strats).forEach(function (k) { best.push(agg.strats[k]); });
        best.sort(function (a, b) { return (b.right / b.seen) - (a.right / a.seen); });
        var strongest = best.slice(0, 2).map(function (st) {
            return (window.STRATS[st.id] ? window.STRATS[st.id].name : st.id) + ': ' + st.right + '/' + st.seen;
        }).join('; ');
        var ctx = 'Questions answered: ' + agg.total.seen + ', correct: ' + agg.total.right + '.\n' +
        'Traps she falls for most: ' + (traps || 'none recorded') + '.\n' +
        'Weakest strategies (correct/attempted): ' + (strats || 'none recorded') + '.\n' +
        'Strongest strategies: ' + (strongest || 'none recorded') + '.';
        openModal('Coaching note', '<p class="note">Writing your note\u2026</p>');
        window.Cloud.ask('coach', 'Write me a short coaching note based on this practice data.', ctx)
        .then(function (r) {
            openModal('Coaching note', '<div class="ai-answer">' + mdLite(r.text) + '</div>' +
              '<p class="note" style="margin-top:14px">Written by ' + esc(r.model) + '. ' +
              (r.remaining !== undefined ? r.remaining + ' tutor requests left today.' : '') + '</p>');
        })
        .catch(function (e) { openModal('Coaching note', '<p>' + esc(e.message || 'Could not write the note.') + '</p>'); });
      },
      rename: function () {
        var n = prompt('Name to show during the test:', window.Store.data().name);
        if (n && n.trim()) { window.Store.setName(n.trim()); render(); }
      },

      startFull: function () {
        S = new window.SATP.Session({ kind: 'full', name: window.Store.data().name });
        wire(S); S.paused = true; view = 'directions'; render();
      },
      startSection: function (sec) {
        S = new window.SATP.Session({ kind: sec, name: window.Store.data().name });
        wire(S); S.paused = true; view = 'directions'; render();
      },
      drillSkill: function (sec, skill) {
        var pool = window.SATP.bankFor(sec).filter(function (q) { return q.skill === skill; });
        if (!pool.length) { toast('No questions available for that skill yet'); return; }
        S = new window.SATP.Session({
            kind: 'drill', section: sec, count: Math.min(pool.length, 10),
            label: skill, filter: function (q) { return q.skill === skill; }
        });
        wire(S); view = 'exam'; render();
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
      drillMissed: function () {
        var ids = window.Store.missedQueue(10).map(function (e) { return e.qid; });
        if (!ids.length) { toast('Nothing in the retry queue'); return; }
        closeModal();
        S = new window.SATP.Session({
            kind: 'drill', section: 'both', count: ids.length,
            label: 'Retry: questions previously missed',
            filter: function (q) { return ids.indexOf(q.id) >= 0; }
        });
        wire(S); view = 'exam'; render();
      },
      quickMix: function () {
        var sec = Math.random() < 0.5 ? 'rw' : 'math';
        S = new window.SATP.Session({ kind: 'drill', section: sec, count: 10, label: 'Mixed ' + (sec === 'rw' ? 'Reading and Writing' : 'Math') + ' set' });
        wire(S); view = 'exam'; render();
      },
      drillWeak: function () {
        var weak = window.Store.weakest(3);
        if (!weak.length) { toast('Not enough data yet. Try a section first.'); return; }
        var names = weak.map(function (w) { return w.skill; });
        var sec = weak[0].section;
        var pool = window.SATP.bankFor(sec).filter(function (q) { return names.indexOf(q.skill) >= 0; });
        if (!pool.length) { toast('Not enough data yet. Try a section first.'); return; }
        S = new window.SATP.Session({
            kind: 'drill', section: sec, count: 10, label: 'Weakest skills: ' + names.join(', '),
            filter: function (q) { return names.indexOf(q.skill) >= 0; }
        });
        wire(S); view = 'exam'; render();
      },

      beginModule: function () { S.paused = false; view = 'exam'; render(); },
      skipBreak: function () { S.skipBreak(); },
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
        var h = '<div class="refsheet">';
        window.STRATEGIES.reference.forEach(function (r) {
            h += '<div class="item"><b>' + r.label + '</b><div class="f">' + r.formula + '</div></div>';
        });
        h += '</div><p class="note" style="margin-top:14px">This is the reference sheet the real test gives you with every math module. You do not need to memorize it, but you do need to know when to open it.</p>';
        openModal('Math reference sheet', h);
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
        var h = '<p class="note">Pick whatever you actually like looking at. This only changes the app around the test. ' +
        'Inside a timed module the colors stay the same as the real thing, on purpose.</p><div class="pal-grid">';
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
      trapBook: function () {
        var agg = window.Store.agg();
        var h = '<p class="note">Every wrong answer on the SAT is built from one of these. The counts are how many times each one has caught you.</p>';
        Object.keys(window.TRAP_FAMILIES).forEach(function (f) {
            h += '<h3>' + window.TRAP_FAMILIES[f].name + '</h3><p class="note" style="margin-top:-6px">' +
            window.TRAP_FAMILIES[f].blurb + '</p>';
            Object.keys(window.TRAPS).forEach(function (k) {
                var t = window.TRAPS[k];
                if (t.fam !== f) return;
                var n = (agg.traps[k] || {}).n || 0;
                h += '<div class="help-card" style="margin-bottom:10px"><h4>' + t.name +
                (n ? ' <span class="trap-count">' + n + '\u00d7</span>' : '') + '</h4>' +
                '<p><strong>How to spot it:</strong> ' + t.tell + '</p>' +
                '<p><strong>What to do:</strong> ' + t.fix + '</p>' +
                '<div class="card-actions"><button class="btn subtle sm" onclick="APP.drillTrap(\'' + k + '\')">Practice</button></div></div>';
            });
        });
        openModal('Trap catalog', h);
      },
      testFormat: function () {
        openModal('How the real test is built',
          '<table class="plain"><tr><th>Part</th><th>Questions</th><th>Time</th><th>Notes</th></tr>' +
          '<tr><td>Reading and Writing, Module 1</td><td>27</td><td>32 min</td><td>Mixed difficulty; sets your routing</td></tr>' +
          '<tr><td>Reading and Writing, Module 2</td><td>27</td><td>32 min</td><td>Harder or easier, based on Module 1</td></tr>' +
          '<tr><td>Break</td><td>-</td><td>10 min</td><td>You cannot leave the room on test day</td></tr>' +
          '<tr><td>Math, Module 1</td><td>22</td><td>35 min</td><td>Calculator allowed throughout</td></tr>' +
          '<tr><td>Math, Module 2</td><td>22</td><td>35 min</td><td>Harder or easier, based on Module 1</td></tr></table>' +
          '<h3>Why Module 1 matters so much</h3>' +
          '<p>The module you get routed to sets the ceiling on your section score. Clear the hard questions in Module 1 and the harder Module 2 opens up the top of the scale; miss them and the easier Module 2 caps you lower however well you then do.</p>' +
          '<p>This app routes on a difficulty-weighted estimate rather than a raw count, so getting the hard ones right counts for more, which is the same principle the real test uses.</p>' +
          '<h3>How scores here are worked out</h3>' +
        '<p>Each section is estimated on the real 200&ndash;800 scale, blending your raw count with how hard the questions you got right actually were, then mapped through published practice-test curves. It is an estimate and the app always labels it as one.</p>');
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
      review: function (id) {
        var a = window.Store.attempt(id);
        if (!a) { toast('That attempt is no longer stored'); return; }
        reviewData = a; reviewFilter = 'all'; view = 'review'; render();
      },
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
