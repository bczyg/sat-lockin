/* ============================================================
   SAT PrepMe, test engine
   Digital SAT (Bluebook) structure, as administered 2024-2026:

   Reading and Writing Module 1 27 questions 32 min
   Reading and Writing Module 2 27 questions 32 min <- adaptive
   Break 10 min
   Math Module 1 22 questions 35 min
   Math Module 2 22 questions 35 min <- adaptive

   98 questions total, 2 h 14 min of testing time. Module 2 difficulty is
   chosen from Module 1 performance; the routing decides the score ceiling.
   ============================================================ */
(function (global) {
    'use strict';

    /* ---------------- deterministic RNG (so an attempt can be replayed) ---- */
    function mulberry32(a) {
      return function () {
        a |= 0; a = a + 0x6D2B79F5 | 0;
        var t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };
    }
    function shuffle(arr, rnd) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(rnd() * (i + 1));
        var t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }

    /* ---------------- test blueprint -------------------------------------- */
    var BLUEPRINT = {
      rw: {
        label: 'Reading and Writing',
        count: 27,
        seconds: 32 * 60,
        // College Board domain weighting for each RW module
        domains: {
          'Information and Ideas': 7,
          'Craft and Structure': 8,
          'Expression of Ideas': 5,
          'Standard English Conventions': 7
        }
      },
      math: {
        label: 'Math',
        count: 22,
        seconds: 35 * 60,
        domains: {
          'Algebra': 8,
          'Advanced Math': 8,
          'Problem-Solving and Data Analysis': 3,
          'Geometry and Trigonometry': 3
        }
      }
    };

    // difficulty mixes: [easy, medium, hard] proportions
    var MIX = {
      module1: { E: 0.35, M: 0.40, H: 0.25 },
      hard: { E: 0.10, M: 0.35, H: 0.55 },
      easy: { E: 0.55, M: 0.35, H: 0.10 }
    };

    /* ---------------- scaled-score estimation -----------------------------
       Anchor points interpolated linearly. These approximate published
       practice-test curves; the app always labels the result an estimate. */
    var CURVES = {
      rw: {
        hard: [[0, 400], [7, 450], [14, 520], [21, 580], [28, 640], [35, 690], [42, 740], [48, 775], [54, 800]],
        easy: [[0, 200], [7, 260], [14, 330], [21, 390], [28, 450], [35, 500], [42, 545], [48, 575], [54, 600]]
      },
      math: {
        hard: [[0, 420], [5, 470], [10, 530], [15, 590], [20, 640], [26, 700], [32, 750], [38, 780], [44, 800]],
        easy: [[0, 200], [5, 250], [10, 310], [15, 370], [20, 425], [26, 480], [32, 530], [38, 565], [44, 590]]
      }
    };
    function interp(anchors, x) {
      if (x <= anchors[0][0]) return anchors[0][1];
      for (var i = 1; i < anchors.length; i++) {
        if (x <= anchors[i][0]) {
          var a = anchors[i - 1], b = anchors[i];
          var t = (x - a[0]) / (b[0] - a[0]);
          return a[1] + t * (b[1] - a[1]);
        }
      }
      return anchors[anchors.length - 1][1];
    }
    function midCurve(sec, raw) {
      return (interp(CURVES[sec].hard, raw) + interp(CURVES[sec].easy, raw)) / 2;
    }
    function scaleScore(sec, raw, path) {
      var v = path === 'hard' ? interp(CURVES[sec].hard, raw)
      : path === 'easy' ? interp(CURVES[sec].easy, raw)
      : midCurve(sec, raw);
      return Math.round(v / 10) * 10;
    }

    /* ---------------- question selection ---------------------------------- */
    function bankFor(sec) {
      if (sec === 'both') return (global.RW_BANK || []).concat(global.MATH_BANK || []);
      return sec === 'rw' ? global.RW_BANK : global.MATH_BANK;
    }

    function pickByDifficulty(pool, want, used, rnd, seen) {
      // want = {E:n, M:n, H:n}; falls back across difficulties when a level is thin.
      // Within a difficulty, questions she has seen fewest times come first, so
      // repeat sittings draw fresh material until the bank is genuinely exhausted.
      var out = [];
      var order = { E: ['E', 'M', 'H'], M: ['M', 'E', 'H'], H: ['H', 'M', 'E'] };
      seen = seen || {};
      ['H', 'M', 'E'].forEach(function (lvl) {
          var need = want[lvl] || 0;
          for (var k = 0; k < order[lvl].length && need > 0; k++) {
            var d = order[lvl][k];
            var avail = shuffle(pool.filter(function (q) {
                  return q.difficulty === d && !used[q.id];
              }), rnd).sort(function (a, b) { return (seen[a.id] || 0) - (seen[b.id] || 0); });
            while (need > 0 && avail.length) {
              var q = avail.shift();
              used[q.id] = true; out.push(q); need--;
            }
          }
      });
      return out;
    }

    function splitMix(n, mix) {
      var e = Math.round(n * mix.E), h = Math.round(n * mix.H);
      var m = n - e - h;
      if (m < 0) { m = 0; e = n - h; }
      return { E: e, M: m, H: h };
    }

    function buildModule(sec, kind, used, rnd) {
      var bp = BLUEPRINT[sec], bank = bankFor(sec), mix = MIX[kind];
      var seen = (global.Store && global.Store.seenCount) ? global.Store.seenCount() : {};
      var qs = [];
      Object.keys(bp.domains).forEach(function (dom) {
          var n = bp.domains[dom];
          var pool = bank.filter(function (q) { return q.domain === dom; });
          qs = qs.concat(pickByDifficulty(pool, splitMix(n, mix), used, rnd, seen));
      });
      // top up if a domain ran thin, then trim if rounding overshot
      var guard = 0;
      while (qs.length < bp.count && guard++ < 500) {
        var left = shuffle(bank.filter(function (q) { return !used[q.id]; }), rnd)
        .sort(function (a, b) { return (seen[a.id] || 0) - (seen[b.id] || 0); });
        if (!left.length) break;
        used[left[0].id] = true; qs.push(left[0]);
      }
      qs = qs.slice(0, bp.count);
      // interleave domains a little so it doesn't feel blocked by topic
      qs = shuffle(qs, rnd);
      if (sec === 'rw') {
        // real RW modules group by question type: II/C&S first, then EoI, then SEC
        var rank = {
          'Information and Ideas': 0, 'Craft and Structure': 0,
          'Expression of Ideas': 1, 'Standard English Conventions': 2
        };
        qs.sort(function (a, b) { return rank[a.domain] - rank[b.domain]; });
      } else {
        // real math modules put multiple-choice first, then student-response
        qs.sort(function (a, b) { return (a.type === 'spr' ? 1 : 0) - (b.type === 'spr' ? 1 : 0); });
      }
      return qs;
    }

    /* ---------------- session --------------------------------------------- */
    function Session(config) {
      this.cfg = config; // {kind, sections:[], seed, name}
      this.seed = config.seed || (Date.now() % 2147483647);
      this.rnd = mulberry32(this.seed);
      this.used = {};
      this.name = config.name || 'Student';
      this.modules = [];
      this.mi = 0; // module index
      this.qi = 0; // question index inside module
      this.startedAt = new Date().toISOString();
      this.id = 'a' + Date.now() + '-' + Math.floor(this.seed % 9973);
      this.finished = false;
      this.paused = false;
      this.timerHidden = false;
      this.abcOn = false;
      this.listeners = {};
      this._buildInitial();
      this._enterModule(0);
    }

    Session.prototype.on = function (evt, fn) {
      (this.listeners[evt] = this.listeners[evt] || []).push(fn); return this;
    };
    Session.prototype.emit = function (evt, data) {
      (this.listeners[evt] || []).forEach(function (f) { f(data); });
    };

    Session.prototype._mkModule = function (sec, kind, num, label) {
      var qs = buildModule(sec, kind, this.used, this.rnd);
      return {
        section: sec, kind: kind, num: num,
        label: label || (BLUEPRINT[sec].label + ', Module ' + num),
        seconds: BLUEPRINT[sec].seconds,
        remaining: BLUEPRINT[sec].seconds,
        questions: qs,
        state: qs.map(function () {
            return { choice: null, text: '', marked: false, struck: [], seconds: 0, visited: false };
        }),
        done: false
      };
    };

    Session.prototype._buildInitial = function () {
      var k = this.cfg.kind;
      if (k === 'full') {
        this.modules = [this._mkModule('rw', 'module1', 1)];
        this.plan = ['rw1', 'rw2', 'break', 'math1', 'math2'];
      } else if (k === 'rw' || k === 'math') {
        this.modules = [this._mkModule(k, 'module1', 1)];
        this.plan = [k + '1', k + '2'];
      } else if (k === 'drill') {
        var bank = bankFor(this.cfg.section);
        var pool = bank.filter(this.cfg.filter || function () { return true; });
        var self = this;
        pool = shuffle(pool, this.rnd).slice(0, this.cfg.count || 10);
        pool.forEach(function (q) { self.used[q.id] = true; });
        this.modules = [{
            section: this.cfg.section === 'both' ? 'mixed' : this.cfg.section, kind: 'drill', num: 1,
            label: this.cfg.label || 'Practice set',
            seconds: null, remaining: null, questions: pool,
            state: pool.map(function () {
                return { choice: null, text: '', marked: false, struck: [], seconds: 0, visited: false, checked: false };
            }),
            done: false
        }];
        this.plan = ['drill'];
      }
    };

    Session.prototype.mod = function () { return this.modules[this.mi]; };
    Session.prototype.q = function () { return this.mod().questions[this.qi]; };
    Session.prototype.st = function () { return this.mod().state[this.qi]; };
    Session.prototype.isDrill = function () { return this.cfg.kind === 'drill'; };
    Session.prototype.isBreak = function () { return this.mod().kind === 'break'; };
    Session.prototype.paneSection = function () {
      var m = this.mod();
      return m.section === 'mixed' ? (this.q() ? this.q().section : 'math') : m.section;
    };

    Session.prototype._enterModule = function (i) {
      this.mi = i; this.qi = 0;
      var m = this.mod();
      if (m.state && m.state[0]) m.state[0].visited = true;
      this._qClock = Date.now();
      this.startTimer();
    };

    /* ---- timing ---- */
    Session.prototype.startTimer = function () {
      var self = this;
      this.stopTimer();
      if (this.mod().remaining === null) return; // untimed drill
      this._iv = setInterval(function () {
          if (self.paused || self.finished) return;
          var m = self.mod();
          m.remaining -= 1;
          self.emit('tick', m.remaining);
          if (m.remaining <= 0) { m.remaining = 0; self.stopTimer(); self.timeExpired(); }
        }, 1000);
    };
    Session.prototype.stopTimer = function () { if (this._iv) clearInterval(this._iv); this._iv = null; };
    Session.prototype.togglePause = function () {
      this.paused = !this.paused; this.emit('change');
    };
    Session.prototype.timeExpired = function () {
      this.emit('expired');
      this.advanceModule();
    };
    Session.prototype._chargeTime = function () {
      var now = Date.now();
      var st = this.mod().state[this.qi];
      if (st && this._qClock) st.seconds += Math.round((now - this._qClock) / 1000);
      this._qClock = now;
    };

    /* ---- answering ---- */
    Session.prototype.select = function (i) {
      var st = this.st(); if (!st) return;
      if (this.isDrill() && st.checked) return;
      st.choice = (st.choice === i) ? null : i;
      if (st.choice !== null && st.struck.indexOf(i) >= 0) {
        st.struck = st.struck.filter(function (x) { return x !== i; });
      }
      this.emit('change');
    };
    Session.prototype.setText = function (v) {
      var st = this.st(); if (!st) return;
      if (this.isDrill() && st.checked) return;
      st.text = v;
    };
    Session.prototype.toggleStrike = function (i) {
      var st = this.st(); var k = st.struck.indexOf(i);
      if (k >= 0) st.struck.splice(k, 1);
      else { st.struck.push(i); if (st.choice === i) st.choice = null; }
      this.emit('change');
    };
    Session.prototype.toggleMark = function () { this.st().marked = !this.st().marked; this.emit('change'); };
    Session.prototype.toggleAbc = function () { this.abcOn = !this.abcOn; this.emit('change'); };
    Session.prototype.toggleTimer = function () { this.timerHidden = !this.timerHidden; this.emit('change'); };

    /* ---- navigation ---- */
    Session.prototype.goto = function (i) {
      var m = this.mod();
      if (i < 0 || i >= m.questions.length) return;
      this._chargeTime();
      this.qi = i; m.state[i].visited = true;
      this.emit('change');
    };
    Session.prototype.next = function () {
      if (this.qi < this.mod().questions.length - 1) this.goto(this.qi + 1);
      else this.emit('module-end');
    };
    Session.prototype.prev = function () { this.goto(this.qi - 1); };

    /* ---- module scoring / routing ---- */
    Session.prototype.gradeQuestion = function (mod, i) {
      var q = mod.questions[i], st = mod.state[i];
      if (q.type === 'spr') {
        if (!st.text || !st.text.trim()) return null;
        return Session.checkSPR(st.text, q.answers || [q.answer]) ? true : false;
      }
      if (st.choice === null || st.choice === undefined) return null;
      return st.choice === q.answer;
    };
    Session.prototype.moduleRaw = function (mod) {
      var self = this, right = 0;
      mod.questions.forEach(function (q, i) { if (self.gradeQuestion(mod, i) === true) right++; });
      return right;
    };

    /* A crude ability estimate: harder items count for more, easier for less.
       The real test uses item response theory; this captures the part that
       matters to a student -- getting the hard ones right is worth more than
       getting the same number of easy ones right. */
    var WEIGHT = { E: 0.72, M: 1.0, H: 1.32 };
    Session.prototype.moduleAbility = function (mod) {
      var self = this, got = 0, max = 0;
      mod.questions.forEach(function (q, i) {
          var w = WEIGHT[q.difficulty] || 1;
          max += w;
          if (self.gradeQuestion(mod, i) === true) got += w;
      });
      return max ? got / max : 0;
    };

    Session.prototype.advanceModule = function () {
      this._chargeTime();
      this.stopTimer();
      var m = this.mod(); m.done = true;

      var planPos = this.modules.length; // how many modules exist so far
      var kindNow = m.kind, sec = m.section;

      if (this.isDrill()) { return this.finish(); }

      // decide what comes next based on the plan
      if (this.cfg.kind === 'full') {
        if (sec === 'rw' && m.num === 1) {
          this.modules.push(this._mkModule('rw', this._route(m), 2));
          this._enterModule(this.modules.length - 1);
        } else if (sec === 'rw' && m.num === 2) {
          this.modules.push({
              section: 'break', kind: 'break', num: 0, label: 'Break',
              seconds: 10 * 60, remaining: 10 * 60, questions: [], state: [], done: false
          });
          this._enterModule(this.modules.length - 1);
        } else if (sec === 'break') {
          this.modules.push(this._mkModule('math', 'module1', 1));
          this._enterModule(this.modules.length - 1);
        } else if (sec === 'math' && m.num === 1) {
          this.modules.push(this._mkModule('math', this._route(m), 2));
          this._enterModule(this.modules.length - 1);
        } else {
          return this.finish();
        }
      } else {
        if (m.num === 1) {
          this.modules.push(this._mkModule(sec, this._route(m), 2));
          this._enterModule(this.modules.length - 1);
        } else {
          return this.finish();
        }
      }
      this.emit('module-change');
      this.emit('change');
    };

    // Routing uses the difficulty-weighted estimate, not the raw count, so a
    // student who cleared the hard items routes up even a question or two short.
    Session.prototype._route = function (mod) {
      return this.moduleAbility(mod) >= 0.6 ? 'hard' : 'easy';
    };

    Session.prototype.skipBreak = function () { this.advanceModule(); };

    /* ---- results ---- */
    Session.prototype.finish = function () {
      this._chargeTime();
      this.stopTimer();
      this.finished = true;
      this.result = this.buildResult();
      var self = this, evs = [];
      this.modules.forEach(function (m) {
          if (m.kind === 'break') return;
          m.questions.forEach(function (q, i) { evs.push(self.eventFor(m, i)); });
      });
      global.Store.recordEvents(evs);
      global.Store.saveAttempt(this.result);
      this.emit('finished', this.result);
      this.emit('change');
      return this.result;
    };

    Session.prototype.buildResult = function () {
      var self = this;
      var out = {
        id: this.id, kind: this.cfg.kind, seed: this.seed,
        startedAt: this.startedAt, finishedAt: new Date().toISOString(),
        label: this.cfg.label || null,
        sections: {}, items: [], path: {}
      };
      ['rw', 'math'].forEach(function (sec) {
          var mods = self.modules.filter(function (m) { return m.section === sec; });
          if (!mods.length) return;
          var raw = 0, total = 0;
          mods.forEach(function (m) { raw += self.moduleRaw(m); total += m.questions.length; });
          var m2 = mods[1];
          var path = m2 ? (m2.kind === 'hard' ? 'hard' : 'easy') : null;
          out.path[sec] = path;
          var full = BLUEPRINT[sec].count * 2;
          var ability = 0, wsum = 0;
          mods.forEach(function (m) {
              var w = m.questions.length;
              ability += self.moduleAbility(m) * w; wsum += w;
          });
          ability = wsum ? ability / wsum : 0;
          // half the estimate from the raw count, half from the difficulty-weighted
          // performance, then pro-rated to a full section's worth of questions
          var rawShare = total ? raw / total : 0;
          var scaledRaw = full * (0.5 * rawShare + 0.5 * ability);
          out.sections[sec] = {
            raw: raw, total: total, answered: 0, ability: Math.round(ability * 100),
            scaled: scaleScore(sec, scaledRaw, path),
            path: path, prorated: total < full
          };
      });
      if (out.sections.rw && out.sections.math) {
        out.total = out.sections.rw.scaled + out.sections.math.scaled;
      }
      this.modules.forEach(function (m, mIdx) {
          if (m.kind === 'break') return;
          m.questions.forEach(function (q, i) {
              var st = m.state[i], g = self.gradeQuestion(m, i);
              if (g !== null && out.sections[m.section]) out.sections[m.section].answered++;
              var tg = global.tagsFor ? global.tagsFor(q) : { strat: null, traps: {} };
              out.items.push({
                  qid: q.id, section: m.section, module: m.num, moduleKind: m.kind,
                  domain: q.domain, skill: q.skill, difficulty: q.difficulty,
                  choice: st.choice, text: st.text, marked: st.marked,
                  correct: g, seconds: st.seconds,
                  strat: tg.strat,
                  trap: (g === false && st.choice !== null && st.choice !== undefined) ? (tg.traps[st.choice] || null) : null
              });
          });
      });
      return out;
    };

    Session.prototype.eventFor = function (mod, i) {
      var q = mod.questions[i], st = mod.state[i], g = this.gradeQuestion(mod, i);
      var tg = global.tagsFor ? global.tagsFor(q) : { strat: null, traps: {} };
      return {
        key: this.id + '|' + q.id,
        attempt: this.id, kind: this.cfg.kind, t: new Date().toISOString(),
        qid: q.id, section: q.section, domain: q.domain, skill: q.skill,
        difficulty: q.difficulty, strat: tg.strat,
        trap: (g === false && st.choice !== null && st.choice !== undefined) ? (tg.traps[st.choice] || null) : null,
        correct: g, seconds: st.seconds, marked: !!st.marked
      };
    };

    /* ---- student-produced response checking (SAT rules) ---- */
    Session.checkSPR = function (raw, accepted) {
      function norm(s) {
        return String(s).trim().replace(/[,$\s]/g, '').replace(/^\+/, '');
      }
      function toNum(s) {
        if (!s) return null;
        if (/^-?\d*\.?\d+\/-?\d*\.?\d+$/.test(s)) {
          var p = s.split('/'); var d = parseFloat(p[1]);
          if (!d) return null;
          return parseFloat(p[0]) / d;
        }
        if (/^-?(\d+\.?\d*|\.\d+)%?$/.test(s)) return parseFloat(s);
        return null;
      }
      var s = norm(raw);
      if (!s) return false;
      var list = [].concat(accepted);
      for (var i = 0; i < list.length; i++) if (s === norm(list[i])) return true;
      var v = toNum(s);
      if (v === null) return false;
      var decimals = (s.split('.')[1] || '').length;
      for (var j = 0; j < list.length; j++) {
        var av = toNum(norm(list[j]));
        if (av === null) continue;
        if (Math.abs(v - av) < 1e-9) return true;
        if (decimals >= 3) { // SAT: 3+ digits, truncated or rounded
          var f = Math.pow(10, decimals);
          if (Math.abs(Math.trunc(av * f) / f - v) < 1e-9) return true;
          if (Math.abs(Math.round(av * f) / f - v) < 1e-9) return true;
        }
      }
      return false;
    };

    /* ---------------- persistence -----------------------------------------
       One event per answered question is the unit of record. Skill, strategy,
       and trap statistics are all derived from that log, which means there is
       only ever one thing to keep correct -- and it maps directly onto a row
       in the cloud database when the app is signed in. */
    var KEY = 'satprepme.v2';
    var MAX_EVENTS = 6000;

    var Store = {
      _read: function () {
        try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
        catch (e) { return {}; }
      },
      _write: function (d) {
        try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {}
        if (global.Cloud && global.Cloud.onLocalWrite) global.Cloud.onLocalWrite(d);
      },
      data: function () {
        var d = this._read();
        d.name = d.name || 'Student';
        d.attempts = d.attempts || [];
        d.events = d.events || [];
        if (d.skills && !d._migrated) { d._migrated = true; }
        return d;
      },
      setName: function (n) { var d = this.data(); d.name = n; this._write(d); },

      /* upsert by key so re-recording the same question is idempotent */
      recordEvents: function (list) {
        if (!list || !list.length) return;
        var d = this.data();
        var idx = {};
        d.events.forEach(function (e, i) { idx[e.key] = i; });
        list.forEach(function (e) {
            if (e.correct === null || e.correct === undefined) return; // unanswered
            if (idx[e.key] !== undefined) d.events[idx[e.key]] = e;
            else { idx[e.key] = d.events.length; d.events.push(e); }
        });
        if (d.events.length > MAX_EVENTS) d.events = d.events.slice(-MAX_EVENTS);
        this._write(d);
        if (global.Cloud && global.Cloud.pushEvents) global.Cloud.pushEvents(list);
      },

      saveAttempt: function (res) {
        var d = this.data();
        d.attempts = d.attempts.filter(function (a) { return a.id !== res.id; });
        d.attempts.unshift(res);
        d.attempts = d.attempts.slice(0, 60);
        this._write(d);
        if (global.Cloud && global.Cloud.pushAttempt) global.Cloud.pushAttempt(res);
      },
      attempt: function (id) {
        return this.data().attempts.filter(function (a) { return a.id === id; })[0];
      },
      reset: function () { this._write({}); },

      /* ---------- aggregates, all derived from the event log ---------- */
      agg: function (events) {
        var evs = events || this.data().events;
        var out = { skills: {}, strats: {}, traps: {}, fams: {}, sections: {}, total: { seen: 0, right: 0 } };
        evs.forEach(function (e) {
            if (e.correct === null || e.correct === undefined) return;
            out.total.seen++; if (e.correct) out.total.right++;

            var sk = e.section + '|' + e.domain + '|' + e.skill;
            var s = out.skills[sk] || (out.skills[sk] = { key: sk, section: e.section, domain: e.domain, skill: e.skill, seen: 0, right: 0 });
            s.seen++; if (e.correct) s.right++;

            var sec = out.sections[e.section] || (out.sections[e.section] = { seen: 0, right: 0 });
            sec.seen++; if (e.correct) sec.right++;

            if (e.strat) {
              var st = out.strats[e.strat] || (out.strats[e.strat] = { id: e.strat, seen: 0, right: 0, recent: [] });
              st.seen++; if (e.correct) st.right++;
              st.recent.push(e.correct ? 1 : 0);
            }
            if (e.trap) {
              var tr = out.traps[e.trap] || (out.traps[e.trap] = { id: e.trap, n: 0, last: null, qids: [] });
              tr.n++; tr.last = e.t; if (tr.qids.indexOf(e.qid) < 0) tr.qids.push(e.qid);
              var fam = (global.TRAPS && global.TRAPS[e.trap]) ? global.TRAPS[e.trap].fam : 'other';
              out.fams[fam] = (out.fams[fam] || 0) + 1;
            }
        });
        return out;
      },

      /* accuracy on the most recent n attempts of a strategy vs the n before */
      trend: function (stratId, n) {
        n = n || 8;
        var evs = this.data().events.filter(function (e) { return e.strat === stratId && e.correct !== null; });
        if (evs.length < n + 3) return null;
        var recent = evs.slice(-n), prior = evs.slice(-2 * n, -n);
        if (!prior.length) return null;
        var pctOf = function (a) { return a.filter(function (e) { return e.correct; }).length / a.length; };
        return Math.round(100 * (pctOf(recent) - pctOf(prior)));
      },

      weakestStrats: function (n, minSeen) {
        var a = this.agg().strats, out = [];
        Object.keys(a).forEach(function (k) { if (a[k].seen >= (minSeen || 3)) out.push(a[k]); });
        out.sort(function (x, y) { return (x.right / x.seen) - (y.right / y.seen); });
        return out.slice(0, n || 5);
      },
      topTraps: function (n) {
        var a = this.agg().traps, out = [];
        Object.keys(a).forEach(function (k) { out.push(a[k]); });
        out.sort(function (x, y) { return y.n - x.n; });
        return out.slice(0, n || 6);
      },
      weakest: function (n) { // by skill, kept for the older screens
        var a = this.agg().skills, out = [];
        Object.keys(a).forEach(function (k) { if (a[k].seen >= 3) out.push(a[k]); });
        out.sort(function (x, y) { return (x.right / x.seen) - (y.right / y.seen); });
        return out.slice(0, n || 5);
      },

      /* questions she has missed and has not since got right -- the retry queue */
      missedQueue: function (n) {
        /* Only questions from this app can be retried. A miss logged from an
           official practice test has no question here to come back to. */
        var evs = this.data().events.filter(function (e) { return e.correct !== null && e.qid; });
        var last = {};
        evs.forEach(function (e) { last[e.qid] = e; });
        var out = [];
        Object.keys(last).forEach(function (q) { if (last[q].correct === false) out.push(last[q]); });
        out.sort(function (a, b) { return (a.t < b.t) ? 1 : -1; });
        return out.slice(0, n || 20);
      },

      /* Coverage answers the real question: has she met all of this, and can she
       now beat it? A strategy or a trap counts as mastered once she has met it
       at least 3 times and got the most recent 3 right. "Meeting" a trap means
       answering a question that had that trap sitting among its choices, which
       is why this walks the bank rather than only the recorded misses. */
    coverage: function () {
      var bank = {};
      (global.RW_BANK || []).concat(global.MATH_BANK || []).forEach(function (q) { bank[q.id] = q; });
      var out = { strats: {}, traps: {} };

      function note(group, id, correct) {
        var c = out[group][id] || (out[group][id] = { id: id, seen: 0, right: 0, recent: [] });
        c.seen++;
        if (correct) c.right++;
        c.recent.push(correct ? 1 : 0);
        if (c.recent.length > 6) c.recent.shift();
      }

      this.data().events.forEach(function (e) {
        if (e.correct === null || e.correct === undefined) return;
        var q = bank[e.qid];
        var tg = (q && global.tagsFor) ? global.tagsFor(q) : null;
        var strat = e.strat || (tg && tg.strat);
        if (strat) note('strats', strat, e.correct);
        if (tg) {
          var ids = {};
          Object.keys(tg.traps).forEach(function (k) { ids[tg.traps[k]] = 1; });
          Object.keys(ids).forEach(function (t) { note('traps', t, e.correct); });
        } else if (e.trap) {
          note('traps', e.trap, false);
        }
      });

      ['strats', 'traps'].forEach(function (g) {
        Object.keys(out[g]).forEach(function (id) {
          var c = out[g][id];
          var last3 = c.recent.slice(-3);
          var clean = last3.length === 3 && last3.every(function (x) { return x === 1; });
          c.state = (c.seen >= 3 && clean) ? 'mastered' : 'learning';
        });
      });
      return out;
    },

    coverageSummary: function () {
      var cov = this.coverage();
      function count(group, all) {
        var m = 0, l = 0;
        Object.keys(all).forEach(function (id) {
          var c = cov[group][id];
          if (!c) return;
          if (c.state === 'mastered') m++;
          else l++;
        });
        return { mastered: m, learning: l, total: Object.keys(all).length };
      }
      return {
        strats: count('strats', global.STRATS || {}),
        traps: count('traps', global.TRAPS || {})
      };
    },

    streak: function () {
        var days = {};
        this.data().events.forEach(function (e) { if (e.t) days[String(e.t).slice(0, 10)] = true; });
        var n = 0, d = new Date();
        var key = function (dt) { return dt.toISOString().slice(0, 10); };
        if (!days[key(d)]) { // today not done yet: start from yesterday
          d.setDate(d.getDate() - 1);
          if (!days[key(d)]) return 0;
        }
        while (days[key(d)]) { n++; d.setDate(d.getDate() - 1); }
        return n;
      },

      answeredToday: function () {
        var today = new Date().toISOString().slice(0, 10), n = 0;
        this.data().events.forEach(function (e) { if (e.t && String(e.t).slice(0, 10) === today) n++; });
        return n;
      },

      /* Misses logged from an official practice test. Same event shape as
       everything else, so the diagnosis screens pick them up for free. */
    logMisses: function (session, rows) {
      var evs = rows.map(function (r, i) {
        return {
          key: 'log-' + session.id + '-' + i,
          attempt: 'log-' + session.id,
          kind: 'logged',
          source: session.label,
          t: new Date().toISOString(),
          qid: null,
          section: session.section,
          domain: r.domain || null,
          skill: r.skill || null,
          difficulty: null,
          strat: r.strat || null,
          trap: r.trap || null,
          cause: r.cause,
          correct: false,
          seconds: 0
        };
      });
      this.recordEvents(evs);
      return evs.length;
    },

    /* How the logged misses break down: trapped, rushed, or a content gap.
       Keeping those apart is the point, because they call for different work. */
    logSummary: function () {
      var out = { total: 0, trap: 0, rushed: 0, gap: 0, sessions: {} };
      this.data().events.forEach(function (e) {
        if (e.kind !== 'logged') return;
        out.total++;
        if (e.cause === 'rushed') out.rushed++;
        else if (e.cause === 'gap') out.gap++;
        else out.trap++;
        if (e.source) out.sessions[e.source] = (out.sessions[e.source] || 0) + 1;
      });
      return out;
    },

    seenCount: function () {
        var c = {};
        this.data().events.forEach(function (e) { c[e.qid] = (c[e.qid] || 0) + 1; });
        return c;
      }
    };


    global.SATP = {
      BLUEPRINT: BLUEPRINT, CURVES: CURVES, Session: Session, Store: Store,
      scaleScore: scaleScore, shuffle: shuffle, mulberry32: mulberry32,
      bankFor: bankFor,
      fmtTime: function (s) {
        if (s === null || s === undefined) return '--:--';
        s = Math.max(0, Math.round(s));
        var m = Math.floor(s / 60), r = s % 60;
        return m + ':' + (r < 10 ? '0' : '') + r;
      }
    };
    global.Store = Store;
})(window);
