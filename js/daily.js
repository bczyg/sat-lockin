/* ============================================================
   DAILY LOCKIN
   One question a day, rotating through the strategies in order.

   Two properties matter more than cleverness here:

   1. It is the same question all day. Refreshing does not reroll it,
      because a daily that changes when you look away is not a daily.
   2. The rotation is a plain cycle over the moves, so over one pass
      every strategy comes up exactly once and a student can see that
      the app is working through the whole list rather than guessing.
      A student who picked a section gets that section's own cycle; it is
      still one daily question a day, so the streak counts either section.

   Everything is derived from the date, so nothing has to be scheduled
   and it works with the tab closed for a week.
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------- dates, in the student's own timezone ---------- */

  function localKey(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1);
    var day = String(d.getDate());
    return y + '-' + (m.length < 2 ? '0' + m : m) + '-' + (day.length < 2 ? '0' + day : day);
  }

  /* Day count from a fixed local midnight. Built from the calendar date
     rather than from elapsed milliseconds so daylight saving cannot shift
     the rotation by a day. */
  function dayNumber(key) {
    var p = String(key).split('-');
    return Math.round(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000);
  }

  function shiftKey(key, days) {
    var p = String(key).split('-');
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    d.setDate(d.getDate() + days);
    return localKey(d);
  }

  /* A small deterministic hash, so the question chosen for a given day
     is the same on every device and every reload. */
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h >>> 0;
  }

  /* ---------- the rotation ---------- */

  /* section: 'rw' | 'math', or nothing for both. */
  function sectionOf(s) { return s === 'rw' || s === 'math' ? s : ''; }
  var ORDER = {};
  function order(section) {
    var sec = sectionOf(section);
    if (!ORDER[sec]) {
      /* Habit strategies apply to every question rather than owning a set,
         so there is nothing to serve as a daily question for them. */
      ORDER[sec] = Object.keys(global.STRATS || {}).filter(function (id) {
          return !global.STRATS[id].meta && (!sec || global.STRATS[id].section === sec);
      });
    }
    return ORDER[sec];
  }

  function bank() {
    return (global.RW_BANK || []).concat(global.MATH_BANK || []);
  }

  var Daily = {
    /* ---------- state, kept inside the normal Store blob ---------- */

    all: function () {
      var d = global.Store.data();
      return (d.daily && typeof d.daily === 'object') ? d.daily : {};
    },

    _put: function (key, rec) {
      var d = global.Store.data();
      d.daily = (d.daily && typeof d.daily === 'object') ? d.daily : {};
      d.daily[key] = rec;
      /* One year of history is plenty and keeps the blob small. */
      var keys = Object.keys(d.daily).sort();
      if (keys.length > 400) {
        keys.slice(0, keys.length - 400).forEach(function (k) { delete d.daily[k]; });
      }
      global.Store._write(d);
    },

    todayKey: function () { return localKey(new Date()); },

    /* Which day of the rotation this is, 1-based, for display. */
    dayIndex: function (key, section) {
      var n = order(section).length;
      return (dayNumber(key || this.todayKey()) % n + n) % n + 1;
    },

    cycleLength: function (section) { return order(section).length; },

    stratFor: function (key, section) {
      var list = order(section);
      if (!list.length) return null;
      var n = dayNumber(key || this.todayKey());
      return list[((n % list.length) + list.length) % list.length];
    },

    /* Today's question. Stable for the whole day: once a question has been
       chosen for a date it is remembered, so a bank change mid-day cannot
       swap the question out from under a half-finished attempt. The one
       exception: a question claimed but not answered yet gives way when the
       student switches section, so the daily always matches their pick. */
    pick: function (key, section) {
      key = key || this.todayKey();
      var sec = sectionOf(section);
      var rec = this.all()[key];
      var strat = this.stratFor(key, sec);
      if (!strat) return null;

      var had = rec && rec.qid ? byId(rec.qid) : null;
      if (had && (rec.answered || !sec || had.section === sec)) {
        return { date: key, strat: rec.strat || strat, qid: rec.qid, done: !!rec.answered };
      }

      var pool = bank().filter(function (q) {
          return global.tagsFor(q).strat === strat && (!sec || q.section === sec);
      });
      if (!pool.length) return null;

      /* Prefer something she has never answered, then something no previous
         daily has used, then anything rather than nothing. */
      var seen = global.Store.seenCount();
      /* Questions named in a session count as seen too. */
      if (global.Spot) global.Spot.reps().forEach(function (r) { if (r.qid) seen[r.qid] = (seen[r.qid] || 0) + 1; });
      var usedByDaily = {};
      var hist = this.all();
      Object.keys(hist).forEach(function (k) { if (hist[k].qid) usedByDaily[hist[k].qid] = 1; });

      var tiers = [
        pool.filter(function (q) { return !seen[q.id] && !usedByDaily[q.id]; }),
        pool.filter(function (q) { return !usedByDaily[q.id]; }),
        pool
      ];
      var tier = tiers.filter(function (t) { return t.length; })[0];
      var q = tier[hash(key + '|' + strat) % tier.length];
      return { date: key, strat: strat, qid: q.id, done: false };
    },

    isDone: function (key) {
      var rec = this.all()[key || this.todayKey()];
      return !!(rec && rec.answered);
    },

    resultFor: function (key) {
      return this.all()[key || this.todayKey()] || null;
    },

    /* Remember the question as soon as it is served, so a reload mid-attempt
       does not hand her a different one. */
    claim: function (pickd) {
      if (!pickd) return;
      var existing = this.all()[pickd.date];
      if (existing && existing.qid === pickd.qid) return;
      this._put(pickd.date, { qid: pickd.qid, strat: pickd.strat, answered: false, correct: null });
    },

    record: function (key, qid, strat, correct) {
      this._put(key || this.todayKey(), {
          qid: qid, strat: strat, answered: true, correct: !!correct,
          at: new Date().toISOString()
      });
    },

    /* A day answered on another device, carried by a synced naming rep.
       Never overwrites a day already answered here. */
    restore: function (rep) {
      if (!rep || !/^\d{4}-\d{2}-\d{2}$/.test(String(rep.daily || ''))) return;
      var have = this.all()[rep.daily];
      if (have && have.answered) return;
      this._put(rep.daily, {
          qid: rep.qid, strat: rep.strat, answered: true, correct: !!rep.right, at: rep.t
      });
    },

    /* Consecutive days answered, counting back from today. Yesterday still
       counts as an unbroken streak until today is over. */
    streak: function () {
      var hist = this.all();
      var k = this.todayKey();
      if (!(hist[k] && hist[k].answered)) k = shiftKey(k, -1);
      var n = 0;
      while (hist[k] && hist[k].answered) { n++; k = shiftKey(k, -1); }
      return n;
    },

    answeredCount: function () {
      var hist = this.all();
      return Object.keys(hist).filter(function (k) { return hist[k].answered; }).length;
    },

    /* The last n days, oldest first, for the little strip on the home screen. */
    recent: function (n) {
      var hist = this.all();
      var out = [];
      for (var i = n - 1; i >= 0; i--) {
        var k = shiftKey(this.todayKey(), -i);
        var rec = hist[k];
        out.push({
            date: k,
            today: i === 0,
            answered: !!(rec && rec.answered),
            correct: rec && rec.answered ? !!rec.correct : null
        });
      }
      return out;
    }
  };

  function byId(id) {
    var all = bank();
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
    return null;
  }

  Daily.question = byId;
  global.Daily = Daily;
})(window);
