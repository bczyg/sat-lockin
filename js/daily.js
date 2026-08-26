/* ============================================================
   DAILY LOCKIN
   One question a day, rotating through the strategies in order.

   Two properties matter more than cleverness here:

   1. It is the same question all day. Refreshing does not reroll it,
      because a daily that changes when you look away is not a daily.
   2. The rotation is a plain cycle over the moves, so over one pass
      every strategy comes up exactly once and a student can see that
      the app is working through the whole list rather than guessing.

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

  var ORDER = null;
  function order() {
    if (!ORDER) {
      /* Habit strategies apply to every question rather than owning a set,
         so there is nothing to serve as a daily question for them. */
      ORDER = Object.keys(global.STRATS || {}).filter(function (id) {
          return !global.STRATS[id].meta;
      });
    }
    return ORDER;
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
    dayIndex: function (key) {
      return (dayNumber(key || this.todayKey()) % order().length + order().length) % order().length + 1;
    },

    cycleLength: function () { return order().length; },

    stratFor: function (key) {
      var list = order();
      if (!list.length) return null;
      var n = dayNumber(key || this.todayKey());
      return list[((n % list.length) + list.length) % list.length];
    },

    /* Today's question. Stable for the whole day: once a question has been
       chosen for a date it is remembered, so a bank change mid-day cannot
       swap the question out from under a half-finished attempt. */
    pick: function (key) {
      key = key || this.todayKey();
      var rec = this.all()[key];
      var strat = this.stratFor(key);
      if (!strat) return null;

      if (rec && rec.qid && byId(rec.qid)) {
        return { date: key, strat: rec.strat || strat, qid: rec.qid, done: !!rec.answered };
      }

      var pool = bank().filter(function (q) {
          return global.tagsFor(q).strat === strat;
      });
      if (!pool.length) return null;

      /* Prefer something she has never answered, then something no previous
         daily has used, then anything rather than nothing. */
      var seen = global.Store.seenCount();
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
