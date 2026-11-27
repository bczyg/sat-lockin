/* ============================================================
   SAT LockIn, practice engine

   One untimed practice set at a time, always anchored to a move or a
   trap, plus the event log every list in the app is derived from.

   There is no full test. The adaptive module routing and score curves
   that used to live here went with it: Bluebook is the real test and the
   only score worth trusting.
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

    /* ---------------- question selection ---------------------------------- */
    function bankFor(sec) {
      if (sec === 'both') return (global.RW_BANK || []).concat(global.MATH_BANK || []);
      return sec === 'rw' ? global.RW_BANK : global.MATH_BANK;
    }

    /* ---------------- practice set ----------------------------------------
       config: {section: 'rw'|'math'|'both', filter, count, label, seed} */
    function Session(config) {
      this.cfg = config;
      this.cfg.kind = 'drill';
      this.seed = config.seed || (Date.now() % 2147483647);
      this.rnd = mulberry32(this.seed);
      this.mi = 0; // kept so the question screen can address mod()
      this.qi = 0; // question index
      this.startedAt = new Date().toISOString();
      this.id = 'a' + Date.now() + '-' + Math.floor(this.seed % 9973);
      this.finished = false;
      this.abcOn = false;
      this.listeners = {};

      var pool = bankFor(config.section || 'both').filter(config.filter || function () { return true; });
      pool = shuffle(pool, this.rnd).slice(0, config.count || 10);
      this.modules = [{
          section: config.section === 'both' || !config.section ? 'mixed' : config.section,
          kind: 'drill', num: 1,
          label: config.label || 'Practice set',
          questions: pool,
          state: pool.map(function () {
              return { choice: null, text: '', marked: false, struck: [], seconds: 0, visited: false, checked: false };
          }),
          done: false
      }];
      if (pool.length) this.modules[0].state[0].visited = true;
      this._qClock = Date.now();
    }

    Session.prototype.on = function (evt, fn) {
      (this.listeners[evt] = this.listeners[evt] || []).push(fn); return this;
    };
    Session.prototype.emit = function (evt, data) {
      (this.listeners[evt] || []).forEach(function (f) { f(data); });
    };

    Session.prototype.mod = function () { return this.modules[this.mi]; };
    Session.prototype.q = function () { return this.mod().questions[this.qi]; };
    Session.prototype.st = function () { return this.mod().state[this.qi]; };
    Session.prototype.isDrill = function () { return true; };
    Session.prototype.paneSection = function () {
      var m = this.mod();
      return m.section === 'mixed' ? (this.q() ? this.q().section : 'math') : m.section;
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
      else this.finish();
    };
    Session.prototype.prev = function () { this.goto(this.qi - 1); };

    /* ---- grading ---- */
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

    /* ---- results ---- */
    Session.prototype.finish = function () {
      if (this.finished) return this.result;
      this._chargeTime();
      this.finished = true;
      this.result = this.buildResult();
      var self = this, evs = [];
      this.modules.forEach(function (m) {
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
        sections: {}, items: []
      };
      /* Right and total per section, for the review filters. No score: a
         ten-question set says nothing honest about one. */
      this.modules.forEach(function (m) {
          m.questions.forEach(function (q, i) {
              var sec = out.sections[q.section] || (out.sections[q.section] = { raw: 0, total: 0, answered: 0 });
              sec.total++;
              var g = self.gradeQuestion(m, i);
              if (g === true) sec.raw++;
              if (g !== null) sec.answered++;
          });
      });
      this.modules.forEach(function (m) {
          m.questions.forEach(function (q, i) {
              var st = m.state[i], g = self.gradeQuestion(m, i);
              var tg = global.tagsFor ? global.tagsFor(q) : { strat: null, traps: {} };
              out.items.push({
                  qid: q.id, section: q.section,
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
    /* Spaces and $ are ignored, as is a leading +. A comma only counts as
       a thousands separator (1,000 or 12,500.5); anything else, like a
       decimal comma in 1,5, is left in and does not read as a number. */
    function sprNorm(s) {
      return String(s).replace(/[\u2212\u2013]/g, '-').replace(/[$\s]/g, '').replace(/(\d),(?=\d{3}(?!\d))/g, '$1').replace(/^\+/, '');
    }
    function sprToNum(s) {
      if (!s) return null;
      if (/^-?\d*\.?\d+\/-?\d*\.?\d+$/.test(s)) {
        var p = s.split('/'); var d = parseFloat(p[1]);
        if (!d) return null;
        return parseFloat(p[0]) / d;
      }
      if (/^-?(\d+\.?\d*|\.\d+)%?$/.test(s)) return parseFloat(s);
      return null;
    }
    /* True when a typed grid-in answer reads as a number at all. */
    Session.sprReadable = function (raw) {
      /* "1 1/2" would read as 11/2; ask for 3/2 or 1.5 instead of grading it. */
      if (/\d\s+\d/.test(String(raw))) return false;
      return sprToNum(sprNorm(raw)) !== null;
    };
    Session.checkSPR = function (raw, accepted) {
      var norm = sprNorm, toNum = sprToNum;
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
        /* Questions made for this student live in TAGS, not the banks. */
        var q = bank[e.qid] || (e.qid && global.TAGS && global.TAGS[e.qid] ? { id: e.qid, skill: e.skill } : null);
        var tg = (q && global.tagsFor) ? global.tagsFor(q) : null;
        var strat = e.strat || (tg && tg.strat);
        if (strat) note('strats', strat, e.correct);
        if (tg && String(e.attempt).indexOf('lockin-') === 0) {
          /* A practice answer is one pick: a right one dodged every trap, a
             wrong one fell for at most the trap it picked. A right answer
             after steps were shown, "stuck", or seeing every step first
             says nothing about the traps: the steps may have ruled them out. */
          if (e.correct && !e.hints) {
            var dodged = {};
            Object.keys(tg.traps).forEach(function (k) { dodged[tg.traps[k]] = 1; });
            Object.keys(dodged).forEach(function (t) { note('traps', t, true); });
          }
          else if (e.trap) note('traps', e.trap, false);
        } else if (tg) {
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

    /* Days are the student's local calendar days, the same as Daily LockIn,
       so evening practice in the US is not filed under tomorrow. */
    streak: function () {
        var key = function (dt) {
          return dt.getFullYear() + '-' + ('0' + (dt.getMonth() + 1)).slice(-2) + '-' + ('0' + dt.getDate()).slice(-2);
        };
        var days = {};
        this.data().events.forEach(function (e) { if (e.t) days[key(new Date(e.t))] = true; });
        var n = 0, d = new Date();
        if (!days[key(d)]) { // today not done yet: start from yesterday
          d.setDate(d.getDate() - 1);
          if (!days[key(d)]) return 0;
        }
        while (days[key(d)]) { n++; d.setDate(d.getDate() - 1); }
        return n;
      },

      answeredToday: function () {
        var t = new Date(), n = 0;
        this.data().events.forEach(function (e) {
            if (!e.t) return;
            var d = new Date(e.t);
            if (d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()) n++;
        });
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
      Session: Session, Store: Store, shuffle: shuffle, mulberry32: mulberry32,
      bankFor: bankFor
    };
    global.Store = Store;
})(window);
