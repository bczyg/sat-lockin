/* ============================================================
   The admin page (admin.html): student feedback and the question
   writer's numbers. Uses the sign-in the app already saved in this
   browser; the server checks ADMIN_EMAILS and refuses everyone else.
   Totals only: the server never sends who voted.
   ============================================================ */
(function () {
  'use strict';

  var SKEY = 'decoy.session.v2';
  var API = ((window.CONFIG || {}).apiUrl || '').replace(/\/+$/, '');
  var out = document.getElementById('out');
  var WHY = { wrong: 'Answer looks wrong', confusing: 'Confusing', easy: 'Too easy', hard: 'Too hard' };

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function token() {
    try { var s = JSON.parse(localStorage.getItem(SKEY)); return s && s.token ? s.token : null; } catch (e) { return null; }
  }
  function post(path, body) {
    var t = token();
    return fetch(API + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t },
      body: JSON.stringify(body || {})
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok || d.error) { var e = new Error(d.error || 'That did not work.'); e.status = r.status; throw e; }
        return d;
      });
    });
  }
  function msg(text) { out.innerHTML = '<p class="msg">' + text + '</p>'; }
  function table(head, rows, empty) {
    if (!rows.length) return '<div class="tbl"><p class="empty">' + esc(empty) + '</p></div>';
    return '<div class="tbl"><table><thead><tr>' + head.map(function (h) {
      return '<th' + (h[1] ? ' style="text-align:right"' : '') + '>' + esc(h[0]) + '</th>';
    }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>';
  }
  var n = function (v) { return '<td class="n">' + (v || 0) + '</td>'; };
  function day(v) { return String(v || '').slice(0, 10); }

  function draw(d) {
    var h = '';
    h += '<h2>Questions students rated</h2><p class="sub">Most thumbs down first. A pool question (written by the AI) is retired automatically when ' +
      d.rules.retireWrong + ' students say the answer looks wrong, or when at least ' + d.rules.retireMinRatings + ' ratings net ' + d.rules.retireNet +
      ' or worse (a thumbs up counts +1, a thumbs down -1). Only students the question was served to, who answered it and have answered ' + d.rules.voterMinAnswers +
      ' different questions, count, and "Too easy" or "Too hard" never count toward retiring. Hand-written bank questions are never retired automatically.</p>';
    h += table([['Question'], ['Move'], ['Up', 1], ['Down', 1], [WHY.wrong, 1], [WHY.confusing, 1], [WHY.easy, 1], [WHY.hard, 1]],
      d.questions.map(function (q) {
        return '<tr><td class="q"><span class="tag ' + (q.source === 'pool' ? 'pool' : '') + '">' + (q.source === 'pool' ? 'AI pool' : 'Bank') + '</span> ' +
          (q.type === 'spr' ? '<span class="tag">Grid-in</span> ' : '') + (q.retired ? '<span class="tag off">Retired</span> ' : '') +
          '<code>' + esc(q.qid) + '</code><br>' + esc(q.text) + '</td><td>' + esc(q.move_name || q.move || '') + '</td>' +
          n(q.up) + n(q.down) + n(q.wrong) + n(q.confusing) + n(q.easy) + n(q.hard) + '</tr>';
      }), 'No ratings yet.');

    h += '<h2>Retired pool questions</h2><p class="sub">Restore one you have checked and want to keep. Votes from before a restore stop counting.</p>';
    h += table([['Question'], ['Move'], ['Retired'], ['']],
      d.retired.map(function (q) {
        return '<tr><td class="q"><code>' + esc(q.qid) + '</code> ' + (q.type === 'spr' ? '<span class="tag">Grid-in</span>' : '') + '<br>' + esc(q.text) +
          '</td><td>' + esc(q.move_name || q.move) + '</td><td>' + esc(day(q.retired_at)) + '</td>' +
          '<td><button type="button" class="btn soft sm" data-restore="' + esc(q.qid) + '">Restore</button></td></tr>';
      }), 'Nothing retired.');

    h += '<h2>Moves that helped most</h2><p class="sub">From "Which move helped most today?" at the end of a session.</p>';
    h += table([['Move'], ['Votes', 1]], d.moves.map(function (m) { return '<tr><td>' + esc(m.name) + '</td>' + n(m.helped) + '</tr>'; }), 'No votes yet.');

    h += '<h2>Question writer, last 14 days</h2><p class="sub">Asked: questions requested from the writer. Kept: passed every check and joined the pool.</p>';
    h += table([['Day'], ['Asked', 1], ['Kept', 1], ['Rejected', 1], ['Grid-ins asked', 1], ['Grid-ins kept', 1]],
      d.writer.map(function (w) {
        return '<tr><td>' + esc(day(w.day)) + '</td>' + n(w.attempts) + n(w.accepted) + n(w.rejected) + n(w.grid_asked) + n(w.grid_kept) + '</tr>';
      }), 'Nothing written yet.');

    h += '<h2>Why questions were rejected, last 30 days</h2>';
    h += table([['Move'], ['Kind'], ['First reason'], ['Times', 1]],
      d.rejects.map(function (r) {
        return '<tr><td>' + esc(r.move_name || r.strat) + '</td><td>' + esc(r.kind === 'spr' ? 'grid-in' : r.kind === 'mc' ? 'multiple choice' : 'whole batch') + '</td><td>' + esc(r.reason) + '</td>' + n(r.n) + '</tr>';
      }), 'No rejections.');

    h += '<h2>Pool by move</h2>';
    h += table([['Move'], ['Live', 1], ['Grid-ins', 1], ['Retired', 1]],
      d.pool.map(function (p) { return '<tr><td>' + esc(p.move_name || p.strat) + '</td>' + n(p.live) + n(p.grid) + n(p.retired) + '</tr>'; }), 'The pool is empty.');
    out.innerHTML = h;
  }

  function load() {
    if (!token()) { msg('Sign in on <a href="./">the app</a> first, in this browser, then come back.'); return; }
    post('/api/admin/feedback').then(draw).catch(function (e) {
      if (e.status === 401) msg('Your sign-in has expired. Sign in on <a href="./">the app</a> again, then come back.');
      else if (e.status === 403) msg('This page is only for the site’s admins.');
      else msg(esc(e.message));
    });
  }

  out.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-restore]') : null;
    if (!b) return;
    b.disabled = true;
    post('/api/admin/restore', { qid: b.getAttribute('data-restore') }).then(load).catch(function (err) {
      b.disabled = false;
      alert(err.message);
    });
  });
  load();
})();
