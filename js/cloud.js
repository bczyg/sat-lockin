/* ============================================================
   SAT LockIn: accounts, sync, and the AI tutor (browser side)

   Talks to this app's own API, served by server.js and backed by Postgres.
   No third party service and no SDK: plain fetch, so the app stays a folder
   of files you can double-click.

   Offline first by design. Local storage is the source of truth for the
   student in front of the screen and the server is a mirror. If the network
   is down, or there is no database, everything still works and nothing is
   lost. Unsynced rows queue up and go out later.

   Zero configuration: on boot the app asks the server what it supports. Open
   index.html from disk and there is no server, so it stays offline. Deploy it
   with a database attached and accounts appear on their own.
   ============================================================ */
(function (global) {
  'use strict';

  var CFG = global.CONFIG || {};
  var API = (CFG.apiUrl || '').replace(/\/+$/, '');
  var SKEY = 'decoy.session.v2';
  var QKEY = 'decoy.queue.v2';

  var Cloud = {
    enabled: false,      // set true once the server reports a working database
    aiEnabled: false,    // set true once the server reports a tutor key
    session: null,       // { token, user }
    profile: null,       // { id, email, display_name, role, class_code }
    lastError: null,
    ready: false,
    listeners: [],

    on: function (fn) { this.listeners.push(fn); },
    emit: function () {
      this.listeners.forEach(function (f) { try { f(); } catch (e) {} });
    },

    /* ---------------- plumbing ---------------- */
    url: function (p) { return API + p; },

    saveSession: function (s) {
      this.session = s;
      this.profile = s ? s.user : null;
      try {
        if (s) localStorage.setItem(SKEY, JSON.stringify(s));
        else localStorage.removeItem(SKEY);
      } catch (e) {}
    },

    loadSession: function () {
      try {
        var s = JSON.parse(localStorage.getItem(SKEY));
        if (s && s.token) { this.session = s; this.profile = s.user || null; }
      } catch (e) {}
    },

    signedIn: function () { return !!(this.session && this.session.token); },

    post: function (path, body, opts) {
      var self = this;
      var headers = { 'Content-Type': 'application/json' };
      if (this.signedIn()) headers.Authorization = 'Bearer ' + this.session.token;
      return fetch(this.url(path), {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body || {})
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (d) {
          if (r.status === 401 && self.signedIn() && !(opts && opts.noLogout)) {
            self.saveSession(null);
            self.emit();
          }
          if (!r.ok || d.error) throw new Error(d.error || 'That did not work.');
          return d;
        });
      });
    },

    /* ---------------- what does this server support? ---------------- */
    probe: function () {
      var self = this;
      return fetch(this.url('/healthz'), { method: 'GET' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          self.ready = true;
          if (!d) return false;
          self.enabled = !!d.accounts;
          self.aiEnabled = !!(d.tutor && d.accounts) || !!(d.tutor && CFG.allowAnonTutor);
          self.mail = !!d.mail;
          if (self.enabled && self.signedIn()) {
            return self.afterSignIn().then(function () { return true; });
          }
          self.emit();
          return true;
        })
        .catch(function () { self.ready = true; return false; });
    },

    /* ---------------- sign in ---------------- */
    sendCode: function (email) {
      return this.post('/api/auth/request', { email: email });
    },

    verifyCode: function (email, code) {
      var self = this;
      return this.post('/api/auth/verify', { email: email, code: code }, { noLogout: true })
        .then(function (d) {
          self.saveSession({ token: d.token, user: d.user });
          return self.afterSignIn();
        });
    },

    signOut: function () {
      var self = this;
      var p = this.signedIn() ? this.post('/api/auth/signout', {}).catch(function () {}) : Promise.resolve();
      return p.then(function () { self.saveSession(null); self.emit(); });
    },

    afterSignIn: function () {
      var self = this;
      return this.pullAll()
        .then(function () { return self.flushQueue(); })
        .then(function () { self.emit(); return true; });
    },

    /* ---------------- profile and class ---------------- */
    updateProfile: function (patch) {
      var self = this;
      return this.post('/api/me/update', patch).then(function (d) {
        self.profile = d.user;
        if (self.session) { self.session.user = d.user; self.saveSession(self.session); }
        self.emit();
        return d.user;
      });
    },

    joinClass: function (code) { return this.updateProfile({ class_code: code }); },

    createClass: function (name, code) {
      var self = this;
      return this.post('/api/class/create', { name: name, code: code }).then(function (d) {
        self.profile = d.user;
        if (self.session) { self.session.user = d.user; self.saveSession(self.session); }
        self.emit();
        return d;
      });
    },

    _classCache: null,
    _classFetch: function () {
      var self = this;
      if (this._classCache && Date.now() - this._classCache.at < 4000) {
        return Promise.resolve(this._classCache.data);
      }
      return this.post('/api/class/roster', {}).then(function (d) {
        self._classCache = { at: Date.now(), data: d };
        return d;
      });
    },
    classRoster: function () {
      return this._classFetch().then(function (d) { return d.roster || []; });
    },
    classTraps: function () {
      return this._classFetch().then(function (d) { return d.traps || []; });
    },

    /* ---------------- outbound sync ---------------- */
    queue: function (kind, rows) {
      try {
        var q = JSON.parse(localStorage.getItem(QKEY)) || { events: [], attempts: [], generated: [] };
        q[kind] = (q[kind] || []).concat(rows);
        if (q.events.length > 4000) q.events = q.events.slice(-4000);
        localStorage.setItem(QKEY, JSON.stringify(q));
      } catch (e) {}
    },
    readQueue: function () {
      try { return JSON.parse(localStorage.getItem(QKEY)) || { events: [], attempts: [], generated: [] }; }
      catch (e) { return { events: [], attempts: [], generated: [] }; }
    },
    clearQueue: function () { try { localStorage.removeItem(QKEY); } catch (e) {} },

    pushEvents: function (list) {
      var self = this;
      var real = (list || []).filter(function (e) {
        return e.correct !== null && e.correct !== undefined;
      });
      if (!real.length) return;
      if (!this.enabled || !this.signedIn()) return;
      this.post('/api/sync/events', { events: real }).catch(function (err) {
        self.lastError = String(err.message || err);
        self.queue('events', real);
      });
    },

    pushAttempt: function (a) {
      var self = this;
      if (!this.enabled || !this.signedIn()) return;
      this.post('/api/sync/attempt', { attempt: a }).catch(function (err) {
        self.lastError = String(err.message || err);
        self.queue('attempts', [a]);
      });
    },

    pushGenerated: function (list) {
      var self = this;
      if (!list || !list.length) return;
      if (!this.enabled || !this.signedIn()) return;
      this.post('/api/generated', { questions: list }).catch(function (err) {
        self.lastError = String(err.message || err);
        self.queue('generated', list);
      });
    },

    flushQueue: function () {
      var self = this;
      if (!this.enabled || !this.signedIn()) return Promise.resolve();
      var q = this.readQueue();
      if (!q.events.length && !q.attempts.length && !(q.generated || []).length) return Promise.resolve();
      var jobs = [];
      if (q.events.length) jobs.push(this.post('/api/sync/events', { events: q.events }));
      (q.attempts || []).forEach(function (a) {
        jobs.push(self.post('/api/sync/attempt', { attempt: a }));
      });
      if ((q.generated || []).length) jobs.push(this.post('/api/generated', { questions: q.generated }));
      return Promise.all(jobs).then(function () { self.clearQueue(); })
        .catch(function (err) { self.lastError = String(err.message || err); });
    },

    /* ---------------- inbound sync ---------------- */
    pullAll: function () {
      var self = this;
      if (!this.enabled || !this.signedIn()) return Promise.resolve();
      return this.post('/api/sync/pull', {}).then(function (d) {
        var store = global.Store.data();
        var have = {};
        store.events.forEach(function (e) { have[e.key] = true; });
        (d.events || []).forEach(function (row) {
          if (have[row.key]) return;
          store.events.push({
            key: row.key, attempt: row.attempt, t: row.t, qid: row.qid,
            section: row.section, domain: row.domain, skill: row.skill,
            difficulty: row.difficulty, strat: row.strat, trap: row.trap,
            correct: row.correct, seconds: row.seconds
          });
        });
        store.events.sort(function (a, b) { return (a.t < b.t) ? -1 : 1; });

        var seen = {};
        store.attempts.forEach(function (a) { seen[a.id] = true; });
        (d.attempts || []).forEach(function (a) { if (a && !seen[a.id]) store.attempts.push(a); });
        store.attempts.sort(function (a, b) { return (a.finishedAt < b.finishedAt) ? 1 : -1; });

        if (d.user && d.user.display_name) store.name = d.user.display_name;
        if (d.user) { self.profile = d.user; }
        global.Store._write(store);

        if ((d.generated || []).length && global.Generate) {
          var mine = {};
          global.Generate.stored().forEach(function (q) { mine[q.id] = 1; });
          var fresh = d.generated.filter(function (q) { return q && q.id && !mine[q.id]; });
          if (fresh.length) {
            global.Generate.save(global.Generate.stored().concat(fresh));
            global.Generate.install();
          }
        }
        return true;
      }).catch(function (err) { self.lastError = String(err.message || err); });
    },

    /* kept so callers written against the older shape still work */
    pullGenerated: function () { return Promise.resolve(0); },
    fetchProfile: function () { return Promise.resolve(this.profile); },

    /* ---------------- AI tutor ---------------- */
    ask: function (task, prompt, context, model) {
      if (!this.aiEnabled) return Promise.reject(new Error('The AI tutor is not switched on for this server.'));
      var chosen = model || (CFG.aiModels && CFG.aiModels[task]) || 'claude-haiku-4-5';
      return this.post(CFG.tutorUrl || '/api/tutor', {
        task: task, prompt: prompt, context: context, model: chosen
      });
    },

    onLocalWrite: function () { /* hook kept for future incremental sync */ }
  };

  Cloud.loadSession();
  global.Cloud = Cloud;

  /* Ask the server what it can do, then let the app re-render. */
  Cloud.probe();
})(window);
