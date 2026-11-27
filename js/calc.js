/* ============================================================
   THE CALCULATOR PANEL

   Bluebook puts Desmos on every math question, so practice should too.
   The panel lives outside #shell: the app redraws the shell on every
   step, and a graph the student built must survive that.

   The script comes from /calculator.js, which the server sends on to
   Desmos with the site's key. No key, no network, or the app opened from
   disk: the panel says so and offers desmos.com in a new tab instead.

   Each question keeps its own graph for the length of a session, so
   going back to a question (or past a step) never wipes the work.
   ============================================================ */
(function (global) {
  'use strict';

  var CFG = global.CONFIG || {};
  var API = (CFG.apiUrl || '').replace(/\/+$/, '');
  var SRC = API + '/calculator.js';
  var DESMOS_URL = 'https://www.desmos.com/calculator';
  var LOAD_MS = 15000;
  var OPTIONS = {
    border: false,
    images: false,          // no uploads: nothing a student needs on the SAT
    folders: false,
    notes: false,
    links: false,
    pasteGraphLink: false
  };
  var LINK = '<p><a class="btn primary sm" href="' + DESMOS_URL + '" target="_blank" rel="noopener noreferrer">Open desmos.com in a new tab</a></p>';
  var CLOSE_SVG = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
    'stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  var root = null, host = null, note = null;
  var calc = null;        // the Desmos instance once loaded
  var loading = null;     // the script request while it is out
  var slow = null;        // timer for the "taking a while" note
  var open = false;
  var scope = null;       // the session the saved graphs belong to
  var cur = null;         // the question whose graph is on screen
  var saved = {};         // question id -> Desmos state, this session only

  function build() {
    if (root) return;
    root = document.createElement('aside');
    root.id = 'calc';
    root.className = 'calc';
    root.hidden = true;
    root.setAttribute('aria-label', 'Graphing calculator');
    root.tabIndex = -1;
    root.innerHTML =
      '<div class="calc-head"><h2>Calculator</h2>' +
        '<button type="button" class="link-btn quiet" data-act="tips">Tips</button>' +
        '<a class="link-btn quiet" href="' + DESMOS_URL + '" target="_blank" rel="noopener noreferrer">Open desmos.com</a>' +
        '<button type="button" class="icon-btn" data-act="close" aria-label="Close calculator">' + CLOSE_SVG + '</button>' +
      '</div>' +
      '<div class="calc-note" role="status"></div>' +
      '<div class="calc-host"></div>';
    host = root.querySelector('.calc-host');
    note = root.querySelector('.calc-note');
    root.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-act]') : null;
      if (!b) return;
      var act = b.getAttribute('data-act');
      if (act === 'close') close();
      else if (act === 'tips' && global.APP && global.APP.calcTips) global.APP.calcTips();
      else if (act === 'retry') start();
    });
    document.body.appendChild(root);
  }

  /* bare: only a message to show, so the sheet shrinks to fit it. */
  function say(html, bare) {
    note.innerHTML = html || '';
    note.hidden = !html;
    host.hidden = !!html && !calc;
    root.classList.toggle('calc-bare', !!bare);
    document.documentElement.classList.toggle('calc-bare', !!bare);
  }

  function load() {
    if (global.Desmos && global.Desmos.GraphingCalculator) return Promise.resolve();
    if (loading) return loading;
    /* Opened from disk with no server: there is no /calculator.js to ask. */
    if (global.location && global.location.protocol === 'file:' && !API) return Promise.reject(new Error('offline'));
    /* No timeout here: a slow script that arrives late still works, and a
       retry while it is out waits on it rather than adding a second copy. */
    loading = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.onload = function () {
        s.onload = s.onerror = null;
        if (global.Desmos && global.Desmos.GraphingCalculator) resolve(); else reject(new Error('no Desmos'));
      };
      s.onerror = function () { s.onload = s.onerror = null; reject(new Error('load failed')); };
      s.async = true;
      s.src = SRC;
      document.head.appendChild(s);
    });
    /* A failure is not final: the next open asks again. */
    loading.then(function () { loading = null; }, function () { loading = null; });
    return loading;
  }

  function start() {
    if (calc) { say(''); return; }
    say('<p class="muted">Loading the calculator…</p>');
    clearTimeout(slow);
    slow = setTimeout(function () {
      if (calc || !loading) return;
      say('<p>The calculator is taking a while. It will appear here when it arrives.</p>' + LINK, true);
    }, LOAD_MS);
    load().then(function () {
      clearTimeout(slow);
      if (!calc) {
        host.hidden = false;
        calc = global.Desmos.GraphingCalculator(host, OPTIONS);
        if (cur && saved[cur]) calc.setState(saved[cur]);
      }
      say('');
      if (open) calc.resize();
    }, function () {
      clearTimeout(slow);
      say('<p>The calculator would not load here.</p>' + LINK +
        '<p><button type="button" class="link-btn quiet" data-act="retry">Try again</button></p>', true);
    });
  }

  /* Remember the graph on screen, then show the one for `key`. */
  function swap(key) {
    if (key === cur) return;
    if (calc && cur) saved[cur] = calc.getState();
    cur = key;
    if (!calc) return;
    if (key && saved[key]) calc.setState(saved[key]);
    else calc.setBlank();
  }

  function mark() {
    document.documentElement.classList.toggle('calc-open', open);
    var btns = document.querySelectorAll('[data-calc-btn]');
    for (var i = 0; i < btns.length; i++) btns[i].setAttribute('aria-pressed', open ? 'true' : 'false');
  }

  function show() {
    build();
    open = true;
    root.hidden = false;
    mark();
    if (calc) { say(''); calc.resize(); }
    else if (!loading) start();
    try { root.focus({ preventScroll: true }); } catch (e) { root.focus(); }
  }

  function close() {
    if (!open) return;
    open = false;
    if (root) root.hidden = true;
    mark();
    var b = document.querySelector('[data-calc-btn]');
    if (b && root && root.contains(document.activeElement)) b.focus();
  }

  global.Calc = {
    /* Called after every render. session: the session's id; qid: the math
       question on screen, or null when there is none (the panel closes). */
    sync: function (session, qid) {
      if (!qid) {
        close();
        /* The session is over: its graphs go with it. */
        if (!session && scope !== null) { scope = null; saved = {}; cur = null; if (calc) calc.setBlank(); }
        mark();
        return;
      }
      if (session !== scope) { scope = session; saved = {}; cur = null; if (calc) calc.setBlank(); }
      swap(qid);
      mark();
    },
    toggle: function () { if (open) close(); else show(); },
    close: close,
    isOpen: function () { return open; },
    /* For a key handler: is this element part of the calculator? */
    owns: function (el) { return !!(root && el && root.contains(el)); }
  };
})(window);
