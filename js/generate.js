/* ============================================================
   SAT LockIn, question generation

   Goal: nobody runs out of practice, and every strategy and every trap
   type gets covered. When the student has worked through the built-in
   bank for some target, the app asks Claude for more of exactly that
   target, validates the result hard, and merges it into the bank.

   Nothing generated is trusted on arrival. A question only reaches the
   student if it passes every check in validate(): right shape, four
   choices, one answer in range, a real strategy id, one real trap id
   per wrong choice, sane lengths, and for fill-ins an answer that parses
   as a number. Anything that fails is dropped and reported.
   ============================================================ */
(function (global) {
    'use strict';

    var GKEY = 'decoy.generated.v1';
    var MAX_STORED = 400;

    /* the exact blueprint slots the SAT uses, so generated items stay in scope */
    var SKILL_DOMAIN = {};
    function indexSkills() {
      (global.RW_BANK || []).concat(global.MATH_BANK || []).forEach(function (q) {
          SKILL_DOMAIN[q.skill] = { domain: q.domain, section: q.section };
      });
    }

    var Generate = {
      busy: false,
      lastReport: null,

      stored: function () {
        try { return JSON.parse(localStorage.getItem(GKEY)) || []; }
        catch (e) { return []; }
      },
      save: function (list) {
        try { localStorage.setItem(GKEY, JSON.stringify(list.slice(-MAX_STORED))); } catch (e) {}
      },

      /* ---------- merge stored questions into the live bank ---------- */
      install: function () {
        indexSkills();
        var added = 0;
        this.stored().forEach(function (q) {
            if (!q || !q.id) return;
            var bank = q.section === 'rw' ? global.RW_BANK : global.MATH_BANK;
            if (bank.some(function (x) { return x.id === q.id; })) return;
            bank.push(q);
            global.TAGS[q.id] = { strat: q.strat, traps: q.trapTags || {} };
            added++;
        });
        return added;
      },

      /* ---------- prompt construction ---------- */
      exemplars: function (skill, n) {
        var pool = (global.RW_BANK || []).concat(global.MATH_BANK || [])
        .filter(function (q) { return q.skill === skill && !q.generated; });
        return pool.slice(0, n || 2).map(function (q) {
            return JSON.stringify({
                section: q.section, domain: q.domain, skill: q.skill, difficulty: q.difficulty,
                type: q.type, blurb: q.blurb || '', passage: q.passage || '', figure: q.figure || '',
                prompt: q.prompt, choices: q.choices || [], answer: q.answer == null ? -1 : q.answer,
                answers: q.answers || [], strat: global.tagsFor(q).strat,
                strategy: q.strategy, hint: q.hint, steps: q.steps,
                distractors: Object.keys(q.traps || {}).map(function (k) {
                    return { index: +k, trap: global.tagsFor(q).traps[k], why: q.traps[k] };
                })
              }, null, 1);
        }).join('\n\n');
      },

      buildPrompt: function (opts) {
        if (!Object.keys(SKILL_DOMAIN).length) indexSkills();
        var strat = global.STRATS[opts.strat];
        var traps = (opts.traps || []).filter(function (t) { return global.TRAPS[t]; });
        var skill = opts.skill;
        /* A habit strategy owns no questions, so there is no skill to look up.
           Fall back to any skill in the strategy's own section rather than
           sending "undefined" to the model. */
        if (!skill && strat) {
          var pool = Object.keys(SKILL_DOMAIN).filter(function (k) {
              return SKILL_DOMAIN[k].section === strat.section;
          });
          skill = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
        }
        var sd = SKILL_DOMAIN[skill] || {};
        var lines = [];
        lines.push('Write ' + (opts.count || 3) + ' new SAT questions to the specification below.');
        lines.push('');
        lines.push('section: ' + (sd.section || opts.section || (strat && strat.section)));
        lines.push('domain: ' + (sd.domain || opts.domain));
        lines.push('skill: ' + skill);
        lines.push('difficulty: ' + (opts.difficulty || 'M') + '  (E easier, M medium, H harder)');
        lines.push('type: ' + (opts.type || 'mc'));
        lines.push('');
        if (strat) {
          lines.push('THE MOVE BEING TESTED: "' + strat.name + '" (id: ' + opts.strat + ')');
          lines.push('What it means: ' + strat.move);
          lines.push('Use exactly this id in the strat field.');
          lines.push('');
          /* The per-strategy recipe. Generic instructions produce questions of
             the right shape that do not reliably test the intended move, so
             this says what the correct answer has to do and how this question
             type specifically goes wrong. */
          if (strat.gen) {
            lines.push('HOW A QUESTION FOR THIS MOVE MUST BE BUILT');
            lines.push('Shape: ' + strat.gen.shape);
            lines.push('The correct answer: ' + strat.gen.key);
            lines.push('Watch out: ' + strat.gen.avoid);
            lines.push('');
          }
        }
        if (traps.length) {
          lines.push('Build the wrong answers from these trap types. Use these exact ids in the');
          lines.push('trap field of each distractor, and make each distractor a real example of it:');
          traps.forEach(function (t) {
              lines.push('  ' + t + ' = ' + global.TRAPS[t].name + '. ' + global.TRAPS[t].tell);
          });
          lines.push('');
          if (opts.mustInclude) {
            lines.push('At least one distractor in EVERY question must use the trap "' +
              opts.mustInclude + '" (' + global.TRAPS[opts.mustInclude].name + '), because the');
            lines.push('student is practicing spotting that one specifically.');
            lines.push('');
          }
        }
        var ex = this.exemplars(opts.skill, 2);
        if (ex) {
          lines.push('Here are existing questions from this same skill. Match their format, their');
          lines.push('scope, and the level of detail in the explanation. Do not reuse their content,');
          lines.push('their topics, or their wording.');
          lines.push('');
          lines.push(ex);
        }
        return lines.join('\n');
      },

      /* ---------- validation ---------- */
      validate: function (q, opts) {
        var errs = [];
        var need = ['section', 'domain', 'skill', 'difficulty', 'type', 'prompt', 'strat', 'strategy', 'hint', 'steps'];
        need.forEach(function (k) { if (!q[k] && q[k] !== 0) errs.push('missing ' + k); });
        if (errs.length) return errs;

        if (q.section !== 'rw' && q.section !== 'math') errs.push('bad section');
        if (['E', 'M', 'H'].indexOf(q.difficulty) < 0) errs.push('bad difficulty');
        if (!global.STRATS[q.strat]) errs.push('unknown strategy id ' + q.strat);
        if (!Array.isArray(q.steps) || q.steps.length < 2) errs.push('needs at least 2 steps');
        if (String(q.prompt).length < 12) errs.push('prompt too short');
        if (q.section === 'rw' && q.type === 'mc') {
          var words = String(q.passage || '').replace(/<[^>]*>/g, ' ').trim().split(/\s+/).length;
          if (!q.passage) errs.push('reading question with no passage');
          else if (words < 25 || words > 190) errs.push('passage is ' + words + ' words, needs 25 to 190');
        }

        if (q.type === 'mc') {
          if (!Array.isArray(q.choices) || q.choices.length !== 4) errs.push('needs exactly 4 choices');
          if (typeof q.answer !== 'number' || q.answer < 0 || q.answer > 3) errs.push('answer must be 0 to 3');
          if (Array.isArray(q.choices)) {
            var seen = {};
            q.choices.forEach(function (c) {
                if (!String(c).trim()) errs.push('empty choice');
                if (seen[String(c).trim()]) errs.push('duplicate choice');
                seen[String(c).trim()] = 1;
            });
          }
          var ds = Array.isArray(q.distractors) ? q.distractors : [];
          if (ds.length !== 3) errs.push('needs exactly 3 distractor entries, got ' + ds.length);
          var covered = {};
          ds.forEach(function (d) {
              if (typeof d.index !== 'number' || d.index < 0 || d.index > 3) errs.push('distractor index out of range');
              if (d.index === q.answer) errs.push('a distractor points at the correct answer');
              if (!global.TRAPS[d.trap]) errs.push('unknown trap id ' + d.trap);
              if (!d.why || String(d.why).length < 15) errs.push('distractor explanation too short');
              covered[d.index] = 1;
          });
          [0, 1, 2, 3].forEach(function (i) {
              if (i !== q.answer && !covered[i]) errs.push('choice ' + i + ' has no trap assigned');
          });
          if (opts && opts.mustInclude && !ds.some(function (d) { return d.trap === opts.mustInclude; })) {
            errs.push('none of the distractors use the requested trap ' + opts.mustInclude);
          }
        } else if (q.type === 'spr') {
          if (!Array.isArray(q.answers) || !q.answers.length) errs.push('fill-in needs accepted answers');
          else if (!q.answers.every(function (a) { return /^-?[\d.\/]+$/.test(String(a).trim()); })) {
            errs.push('fill-in answers must be plain numbers or fractions');
          }
        } else {
          errs.push('type must be mc or spr');
        }
        return errs;
      },

      /* ---------- turn a validated item into a bank question ---------- */
      toQuestion: function (q, model) {
        var id = 'gen-' + q.section + '-' + Math.abs(hash(q.prompt + (q.choices || []).join('|'))).toString(36);
        var traps = {}, trapTags = {};
        (q.distractors || []).forEach(function (d) {
            traps[d.index] = d.why;
            trapTags[d.index] = d.trap;
        });
        return {
          id: id, section: q.section, domain: q.domain, skill: q.skill, difficulty: q.difficulty,
          type: q.type, blurb: q.blurb || '', figure: q.figure || '', figcap: q.figcap || '',
          passage: q.passage || '', prompt: q.prompt,
          choices: q.type === 'mc' ? q.choices : undefined,
          answer: q.type === 'mc' ? q.answer : undefined,
          answers: q.type === 'spr' ? q.answers : undefined,
          strategy: q.strategy, hint: q.hint, steps: q.steps, traps: traps,
          strat: q.strat, trapTags: trapTags,
          generated: true, model: model || null, createdAt: new Date().toISOString()
        };
      },

      /* ---------- the call ---------- */
      run: function (opts) {
        var self = this;
        if (!global.Cloud || !global.Cloud.aiEnabled) {
          return Promise.reject(new Error('Question writing needs the AI tutor switched on. See SETUP-CLOUD.md.'));
        }
        if (this.busy) return Promise.reject(new Error('Already writing questions.'));
        this.busy = true;
        indexSkills();

        var attempt = function (tries) {
          return global.Cloud.ask('generate', self.buildPrompt(opts), '', opts.model)
          .then(function (res) {
              var parsed = parseJSON(res.text);
              if (!parsed || !Array.isArray(parsed.questions)) throw new Error('The reply was not usable JSON.');
              var good = [], rejected = [];
              parsed.questions.forEach(function (raw) {
                  var errs = self.validate(raw, opts);
                  if (errs.length) rejected.push({ prompt: String(raw.prompt || '').slice(0, 60), errs: errs });
                  else good.push(self.toQuestion(raw, res.model));
              });
              if (!good.length && tries > 0) return attempt(tries - 1);
              var store = self.stored();
              var have = {};
              store.forEach(function (q) { have[q.id] = 1; });
              good = good.filter(function (q) { return !have[q.id]; });
              self.save(store.concat(good));
              self.install();
              self.lastReport = { added: good.length, rejected: rejected, model: res.model };
              if (global.Cloud.pushGenerated) global.Cloud.pushGenerated(good);
              return self.lastReport;
          });
        };

        return attempt(1).then(function (r) { self.busy = false; return r; },
          function (e) { self.busy = false; throw e; });
      },

      /* ---------- what still needs covering ---------- */
      /* The traps a strategy's recipe expects, so a strategy-targeted request
         asks for the distractor types that move actually produces. */
      trapsForStrat: function (stratId) {
        var st = global.STRATS[stratId];
        if (st && st.gen && st.gen.traps) {
          return st.gen.traps.filter(function (t) { return global.TRAPS[t]; });
        }
        var out = {};
        (global.RW_BANK || []).concat(global.MATH_BANK || []).forEach(function (q) {
          if (global.tagsFor(q).strat !== stratId) return;
          var t = global.tagsFor(q).traps;
          Object.keys(t).forEach(function (k) { out[t[k]] = 1; });
        });
        return Object.keys(out);
      },

      gapPlan: function () {
        var cov = global.Store.coverage();
        var plan = [];
        Object.keys(global.STRATS).forEach(function (id) {
            var c = cov.strats[id];
            if (!c || c.state !== 'mastered') plan.push({ kind: 'strat', id: id, state: c ? c.state : 'new' });
        });
        Object.keys(global.TRAPS).forEach(function (id) {
            var c = cov.traps[id];
            if (!c || c.state !== 'mastered') plan.push({ kind: 'trap', id: id, state: c ? c.state : 'new' });
        });
        return plan;
      },

      /* pick a skill that exercises a given strategy or trap */
      skillFor: function (kind, id) {
        var all = (global.RW_BANK || []).concat(global.MATH_BANK || []);
        var hits = all.filter(function (q) {
            var t = global.tagsFor(q);
            if (kind === 'strat') return t.strat === id;
            return Object.keys(t.traps).some(function (k) { return t.traps[k] === id; });
        });
        if (!hits.length) return null;
        return hits[Math.floor(Math.random() * hits.length)].skill;
      }
    };

    function hash(s) {
      var h = 5381;
      for (var i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
      return h | 0;
    }

    function parseJSON(text) {
      if (!text) return null;
      var t = String(text).trim();
      t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
      var a = t.indexOf('{'), b = t.lastIndexOf('}');
      if (a < 0 || b < a) return null;
      try { return JSON.parse(t.slice(a, b + 1)); } catch (e) { return null; }
    }

    global.Generate = Generate;
})(window);
