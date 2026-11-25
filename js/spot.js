/* ============================================================
   NAME THE MOVE

   On test day nobody tells you which strategy a question wants. Every
   other surface in the app names the move first and then hands over a
   question, which trains the move but never the recognition. This is the
   recognition half: read the question, name the move, then work it.

   The hard part is fairness. Reading and Writing question types are
   pinned down by their wording, so any other strategy from that section
   makes an honest wrong option. Math is not like that: a radical
   equation can be graphed, solved by hand, or back-solved from the
   choices, and a student who names any of those is not wrong. So in math
   the wrong options always come from a different family of problems
   (algebra, data, geometry), never from the question's own family, never
   a universal tool, and never a known look-alike. That makes math
   recognition coarser than reading, and it is the honest version.

   Pure logic and storage, no DOM, so scripts/verify.js can exercise it.
   ============================================================ */
(function (global) {
  'use strict';

  var KEY = 'lockin.spot.v1';
  var RECENT_MAX = 60;
  var REPS_MAX = 5000;
  var MEMO = null;   // { raw, out }: data() for the stored log as it last was

  /* Moves that apply to nearly every math question. Never offered as a
     wrong option, because they are never really wrong. */
  var UNIVERSAL = { 'desmos-first': 1, 'choice-tactics': 1 };

  function mathFamily(domain) {
    var d = String(domain || '').toLowerCase();
    if (d.indexOf('geometry') >= 0) return 'geometry';
    if (d.indexOf('data') >= 0) return 'data';
    return 'algebra';
  }

  function bank() {
    return (global.RW_BANK || []).concat(global.MATH_BANK || []);
  }

  function stratOf(q) { return global.tagsFor(q).strat; }

  function usable(q) {
    var s = stratOf(q);
    return !!(s && global.STRATS[s] && !global.STRATS[s].meta && q.steps && q.steps.length);
  }

  /* Where each strategy lives: the domain most of its questions sit in, and
     for math the family that domain belongs to. */
  var HOME = null;
  function homes() {
    if (!HOME) {
      var tally = {};
      bank().forEach(function (q) {
          var s = stratOf(q);
          if (!s) return;
          tally[s] = tally[s] || {};
          tally[s][q.domain] = (tally[s][q.domain] || 0) + 1;
      });
      HOME = {};
      Object.keys(tally).forEach(function (s) {
          HOME[s] = Object.keys(tally[s]).sort(function (a, b) { return tally[s][b] - tally[s][a]; })[0];
      });
    }
    return HOME;
  }
  function homeDomain(stratId) { return homes()[stratId] || null; }
  function homeFamily(stratId) {
    var d = homeDomain(stratId);
    return d ? mathFamily(d) : null;
  }

  function shuffle(arr, rnd) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function lookAlikes(id) {
    var out = [];
    Object.keys(global.STRAT_VS || {}).forEach(function (k) {
        var p = k.split('|');
        if (p[0] === id) out.push(p[1]);
        else if (p[1] === id) out.push(p[0]);
    });
    return out;
  }

  /* The ids that may be offered as wrong options for this question. */
  function distractorPool(q) {
    var right = stratOf(q);
    var ids = Object.keys(global.STRATS).filter(function (id) {
        var s = global.STRATS[id];
        return id !== right && !s.meta && s.section === q.section;
    });
    if (q.section !== 'math') return ids;
    var fam = mathFamily(q.domain);
    var near = lookAlikes(right);
    return ids.filter(function (id) {
        return !UNIVERSAL[id] && near.indexOf(id) < 0 && homeFamily(id) !== fam;
    });
  }

  var Spot = {
    UNIVERSAL: UNIVERSAL,
    mathFamily: mathFamily,
    distractorPool: distractorPool,

    /* ---------- storage ----------
       The unit of record is one rep: one question, the move it wanted, the
       move the student named. Each rep has its own key, so two devices can
       merge their logs without double counting, and the per-move totals and
       the confusion pairs are always derived from the log, never stored. */
    _raw: function () {
      try { return global.localStorage.getItem(KEY) || ''; } catch (e) { return ''; }
    },
    _read: function () {
      var d = null;
      try { d = JSON.parse(this._raw()); } catch (e) {}
      d = d || {};
      d.reps = Array.isArray(d.reps) ? d.reps : [];
      return d;
    },
    _write: function (d) {
      MEMO = null;
      try { global.localStorage.setItem(KEY, JSON.stringify({ reps: d.reps })); } catch (e) {}
    },
    reset: function () { this._write({ reps: [] }); },

    reps: function () { return this._read().reps; },

    /* Totals per move, confusion pairs, and recently seen questions.
       The Strategies list asks once per row, so the result is kept until
       the stored log changes (here, or in another tab). */
    data: function () {
      var raw = this._raw();
      if (MEMO && MEMO.raw === raw) return MEMO.out;
      var out = this._derive();
      MEMO = { raw: raw, out: out };
      return out;
    },
    _derive: function () {
      var out = { strats: {}, confusions: {}, recent: [] };
      this._read().reps.forEach(function (r) {
          var s = out.strats[r.strat] || (out.strats[r.strat] = { seen: 0, right: 0 });
          s.seen++;
          if (r.right) s.right++;
          if (!s.last || r.t > s.last) s.last = r.t;
          if (r.picked && !r.right) {
            var k = r.strat + '>' + r.picked;
            out.confusions[k] = (out.confusions[k] || 0) + 1;
          }
          if (r.qid && r.qid !== 'pasted') {
            out.recent = out.recent.filter(function (id) { return id !== r.qid; });
            out.recent.push(r.qid);
          }
      });
      out.recent = out.recent.slice(-RECENT_MAX);
      return out;
    },

    /* Adds reps from another device. Returns how many were new. */
    merge: function (incoming) {
      var d = this._read();
      var have = {};
      d.reps.forEach(function (r) { have[r.k] = 1; });
      var added = 0;
      (incoming || []).forEach(function (r) {
          if (!r || !r.k || have[r.k] || !r.strat) return;
          have[r.k] = 1;
          d.reps.push({ k: r.k, t: r.t, qid: r.qid || null, strat: r.strat,
            picked: r.picked || null, right: !!r.right, daily: r.daily || null });
          added++;
      });
      if (added) {
        d.reps.sort(function (a, b) { return a.t < b.t ? -1 : a.t > b.t ? 1 : 0; });
        d.reps = d.reps.slice(-REPS_MAX);
        this._write(d);
      }
      return added;
    },

    /* ---------- the four options for one question ---------- */
    options: function (q, rnd) {
      rnd = rnd || Math.random;
      var right = stratOf(q);
      var pool = distractorPool(q);
      /* In reading, a look-alike is the most useful wrong option, because
         telling the pair apart is exactly the skill. */
      var picks = [];
      var add = function (id) { if (picks.length < 3 && picks.indexOf(id) < 0) picks.push(id); };
      if (q.section !== 'math') {
        shuffle(lookAlikes(right).filter(function (id) { return pool.indexOf(id) >= 0; }), rnd)
          .slice(0, 2).forEach(add);
        /* Then neighbors from the same domain: telling apart two conventions
           rules is the skill, ruling out a data move on a comma question is not. */
        shuffle(pool.filter(function (id) { return homeDomain(id) === q.domain; }), rnd).forEach(add);
      }
      shuffle(pool, rnd).forEach(add);
      return shuffle([right].concat(picks), rnd);
    },

    /* ---------- building a round ----------
       opts.section: 'rw' | 'math' | undefined for mixed
       opts.focus:   a strategy id, to drill one move against its look-alikes
       opts.qids:    exact question ids, in order (Daily LockIn uses one)
       opts.count:   default 8 */
    build: function (opts, rnd) {
      opts = opts || {};
      rnd = rnd || Math.random;
      var self = this;
      var count = opts.count || 8;
      var all = bank().filter(usable);
      var chosen = [];

      if (opts.qids) {
        opts.qids.forEach(function (id) {
            var q = all.filter(function (x) { return x.id === id; })[0];
            if (q) chosen.push(q);
        });
      } else {
        var d = this.data();
        var recent = {};
        d.recent.forEach(function (id) { recent[id] = 1; });
        var pool = all.filter(function (q) { return !opts.section || q.section === opts.section; });

        var strats;
        if (opts.focus) {
          var near = lookAlikes(opts.focus).filter(function (id) { return !global.STRATS[id].meta; });
          var mates = Object.keys(global.STRATS).filter(function (id) {
              return id !== opts.focus && !global.STRATS[id].meta &&
                global.STRATS[id].section === global.STRATS[opts.focus].section && near.indexOf(id) < 0;
          });
          var half = Math.ceil(count / 2);
          strats = [];
          for (var i = 0; i < half; i++) strats.push(opts.focus);
          strats = strats.concat(shuffle(near, rnd), shuffle(mates, rnd)).slice(0, count);
        } else {
          /* Unseen moves first, then the ones named least reliably, with a
             little noise so two rounds in a row are not identical. */
          var have = {};
          pool.forEach(function (q) { have[stratOf(q)] = 1; });
          strats = Object.keys(have).map(function (id) {
              var s = d.strats[id] || { seen: 0, right: 0 };
              var acc = (s.right + 1) / (s.seen + 2);
              return { id: id, key: (s.seen ? 1 : 0) + acc + rnd() * 0.25 };
          }).sort(function (a, b) { return a.key - b.key; })
            .slice(0, count).map(function (x) { return x.id; });
        }

        var used = {};
        strats.forEach(function (sid) {
            var cands = pool.filter(function (q) { return stratOf(q) === sid && !used[q.id]; });
            var fresh = cands.filter(function (q) { return !recent[q.id]; });
            var list = shuffle(fresh.length ? fresh : cands, rnd);
            if (list.length) { used[list[0].id] = 1; chosen.push(list[0]); }
        });
        chosen = shuffle(chosen, rnd);
      }

      return {
        items: chosen.map(function (q) {
            return { qid: q.id, strat: stratOf(q), options: self.options(q, rnd), picked: null, right: null };
        }),
        i: 0,
        opts: opts
      };
    },

    /* ---------- recording an answer ----------
       picked is a strategy id, or null for "I do not know". daily is the
       Daily LockIn date when this rep was the day's question, so the streak
       can follow a signed-in student to another device. */
    record: function (item, picked, daily) {
      item.picked = picked;
      item.right = picked === item.strat;
      var t = new Date().toISOString();
      var rep = {
        k: 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        t: t, qid: item.qid || null, strat: item.strat,
        picked: picked || null, right: item.right, daily: daily || null
      };
      var d = this._read();
      d.reps.push(rep);
      d.reps = d.reps.slice(-REPS_MAX);
      this._write(d);
      if (global.Cloud && global.Cloud.pushNaming) global.Cloud.pushNaming([rep]);
      return item.right;
    },

    /* ---------- reading the record back ---------- */
    statFor: function (id) {
      return this.data().strats[id] || null;
    },

    /* Moves named reliably: seen at least three times, and the last
       pattern holds at 80 percent or better. */
    summary: function () {
      var d = this.data();
      var ids = Object.keys(global.STRATS).filter(function (id) { return !global.STRATS[id].meta; });
      var seen = 0, solid = 0;
      ids.forEach(function (id) {
          var s = d.strats[id];
          if (!s || !s.seen) return;
          seen++;
          if (s.seen >= 3 && s.right / s.seen >= 0.8) solid++;
      });
      return { total: ids.length, seen: seen, solid: solid };
    },

    /* "You read X as Y" pairs, most frequent first, with the tell-apart. */
    confusions: function (n) {
      var d = this.data();
      return Object.keys(d.confusions).map(function (k) {
          var p = k.split('>');
          return { strat: p[0], as: p[1], n: d.confusions[k], vs: global.stratVs ? global.stratVs(p[0], p[1]) : null };
      }).filter(function (c) { return global.STRATS[c.strat] && global.STRATS[c.as]; })
        .sort(function (a, b) { return b.n - a.n; })
        .slice(0, n || 5);
    }
  };

  global.Spot = Spot;
})(window);
