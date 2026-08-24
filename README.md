# SAT LockIn

**Every wrong answer on the SAT is a trap. Learn to spot them.**

Full-length adaptive practice in the real digital SAT format, plus the thing no other prep
app does: it names the *trick* behind every wrong answer, and keeps a running record of
which tricks keep working on you.

Open **`index.html`**. No install, no build step, works offline.

---

## What makes it different

Most prep apps tell you *what topic* you're weak at. That's not actionable, "work on
Algebra" isn't advice. SAT LockIn classifies the actual mistake:

> **The trick that caught you: Answered a different quantity** · Partial credit · 7 times so far
>
> **How to spot it:** Correct work, wrong thing reported: x instead of x + y, the vertex x
> instead of the minimum value, the rate instead of the time.
>
> **How to beat it:** Circle the requested quantity before solving and check your answer
> against that circle.
>
> [Practice against this trap]

Every one of the **384 wrong answers** in the question bank is classified against a catalog
of **42 trap types** in 6 families, and every question is tagged with the **strategy** it
tests. That's what the Diagnosis screen is built from.

---

## The five screens

| Screen | What it does |
|---|---|
| **Home** | A mission picked from your own data, retry your misses, or attack your number one trap, or sit a full test if nothing is flagged. Streak, accuracy, and "traps dodged" tiles. |
| **Full-length test** | 98 questions, 2 hr 14 min, two-stage adaptive, real Bluebook-style interface and tools. |
| **Untimed practice** | One skill, one strategy, or one trap type at a time. Hint → strategy → worked solution → why every wrong answer is tempting. |
| **Diagnosis** | Your biggest leaks, where wrong answers come from by family, every strategy ranked worst-first with an improving/slipping trend, and the retry queue. |
| **Class** | For teachers: roster, accuracy, latest scores, and the traps catching the most students. |

---

## Format fidelity

```
Reading and Writing, Module 1    27 questions    32 min
Reading and Writing, Module 2    27 questions    32 min   (adaptive)
Break                                            10 min
Math, Module 1                   22 questions    35 min
Math, Module 2                   22 questions    35 min   (adaptive)
```

- **Domain weighting** follows College Board's published blueprint.
- **One short passage per RW question**, as the digital test does.
- **Math is 75% multiple choice / 25% student-produced response**, fill-ins last in each
 module, with the SAT's fill-in rules enforced (`.666` and `.667` both count for 2/3;
 `0.67` correctly does not).
- **Adaptive routing and scoring are difficulty-weighted**, not a raw count, clearing the
 hard items routes you up even a question or two short, which is the part of the real
 scoring model that actually matters to a student.
- **Unseen questions come first**, so a second sitting draws fresh material until the bank
 is genuinely exhausted.
- **Test-day tools**: Mark for Review, ABC answer eliminator, passage highlighting, question
 navigator, hideable countdown, math reference sheet, calculator.
- Two deliberate departures, both labeled in the app: the clock can be paused, and the app
 tells you which difficulty Module 2 was built at.

Scores are **estimates** on the 200–800 per-section scale, mapped through published
practice-test curves. The app always says so.

---

## Optional: accounts, a class, and an AI tutor

Untouched. The app is single-device and offline. Fill in `js/config.js` to add:

- **Email sign-in** (6-digit code, no passwords, works from any URL)
- **A Postgres database** (Railway's one-click plugin) so progress follows a student across devices
- **A class dashboard** for a teacher
- **An AI tutor** for "explain this a different way," follow-up questions on a problem, and a
 coaching note written from the student's own trap data. Haiku 4.5 handles conversation;
 Sonnet 5 handles the reasoning-heavy tasks. The API key lives in a server-side function,
 never in a student's browser.

Step-by-step, including deploying to **Railway** and pointing **satlockin.com** at it:
**[SETUP-CLOUD.md](SETUP-CLOUD.md)**

## Deploying

The app is static, so it hosts anywhere. For Railway (or any Node host) there is a
dependency-free `server.js` that serves it on `$PORT` and can also host the AI tutor at
`POST /api/tutor`, which keeps the Anthropic key in a Railway variable rather than in a
student's browser.

```bash
npm start          # serve the app, http://localhost:8080
npm run verify     # question bank integrity and house style checks
npm run bundle     # rebuild the single-file version in dist/
npm run schema     # apply db/schema.sql to $DATABASE_URL by hand
npm run mailtest you@example.com   # send one test email and explain any failure
```

Railway detects `package.json`, installs, and runs `node server.js`. `/healthz` reports
whether the tutor is configured. None of this affects opening `index.html` directly, which
still works with nothing installed.

---

## Keyboard shortcuts (during a test)

| Key | Action |
|---|---|
| `A` `B` `C` `D` or `1`–`4` | Select that answer choice |
| `→` / `Enter` | Next question |
| `←` | Previous question |
| `M` | Mark for review |

---

## Files

```
index.html the app, open this
assets/styles.css exam UI (Bluebook-accurate) + shell UI (deliberately friendlier)
js/brand.js name and tagline, change these to rename the app
js/config.js optional cloud + AI settings; empty = offline single-device
js/data-rw.js 68 Reading and Writing questions, fully explained
js/data-math.js 60 Math questions, fully explained
js/tags.js 42 trap types, 22 strategies, and the tag for every question
js/strategies.js strategy library and math reference sheet
js/engine.js test assembly, adaptive routing, scoring, event log, storage
js/cloud.js accounts and offline-first sync (no dependencies)
js/app.js all screens
db/schema.sql                 Postgres tables, applied automatically on boot
lib/db.js                     database pool
lib/auth.js                   sign in with an emailed one-time code
lib/mail.js                   sending that code, via Microsoft Graph or Resend
lib/routes.js                 the JSON API: sync, classes, roster
build-single-file.py bundles everything into dist/sat-lockin.html
```

Progress lives in the browser's local storage unless you sign in. "Clear all saved progress"
on the Progress screen wipes it.

---

## Adding your own questions

Append to `js/data-rw.js` or `js/data-math.js` following the existing shape, then add a line
to `window.TAGS` in `js/tags.js` classifying each wrong answer. The engine picks new
questions up automatically and keeps the blueprint proportions.

A multiple-choice item needs `domain`, `skill`, `difficulty` (`E`/`M`/`H`), `prompt`,
`choices`, `answer` (0-based), `strategy`, `hint`, `steps`, `traps`. A fill-in uses
`type:'spr'` with an `answers` array instead of `choices`/`answer`.

---

## Honest limitations

- **The bank is 128 questions.** A full test uses 98, so a second full test reuses a lot of
 material. It's sized for the diagnosis loop (drills, retries, targeted practice), not for
 six distinct mock tests. Growing it is the highest-value next step.
- **These are my questions, not College Board's.** Written to match the format, difficulty
 range, and domain mix. For score prediction, pair this with the official free **Bluebook**
 app and College Board's released practice tests, that's the real software and real items.
- **Scores are estimates.** Real scoring is item-response-theory based and form-specific.


## A note on the writing

The app's own voice uses no em dashes and US spelling throughout. Em dashes survive in
exactly one place: inside reading passages and answer choices, where they are authentic SAT
prose, and where one question tests paired-dash punctuation directly.

## Colors

Five palettes, picked from the home screen. The default pairs a calm aqua with a warm accent.
Red is never a palette color, only a momentary error state, because red exposure is the one
color effect with solid evidence of hurting performance on achievement tasks. All five pass
WCAG AA contrast. The palette only changes the app around the test: inside a timed module the
colors stay fixed, on purpose.


## Continuous integration

`.github/workflows/checks.yml` runs on every push and pull request:

- every script parses
- all 128 questions are structurally sound: four choices, one answer in range, a real strategy
  tag, a real trap behind every wrong choice, fill-in answers that parse as numbers
- the blueprint can still assemble a full adaptive test, 27/27 and 22/22
- house style holds: no em dashes in the app's own voice, US spelling, no emoji as icons
- the server boots, answers `/healthz`, and does not serve `server.js`, `.env`, `lib/`, or
  `db/` over HTTP, including through a `/js/../` traversal

Run the same checks locally with `npm run verify`.

`.github/workflows/schema.yml` applies `db/schema.sql` to Railway Postgres, either when the
schema changes on `main` or on demand from the Actions tab. It needs a `DATABASE_PUBLIC_URL`
secret, because Railway's internal database host is not reachable from GitHub. This workflow
is optional: the server applies the schema on boot anyway.


## Question quality, measured

The bank is audited rather than asserted. `npm run verify` enforces these on every push:

| Property | Where it stands |
|---|---|
| Answer key spread | A 35, B 36, C 37, D 35 across 143 multiple-choice items |
| Correct answer is the longest choice | 35% (chance is 25%, and the check fails above 40%) |
| Trap coverage | all 42 trap types have at least 4 questions |
| Strategy coverage | all 22 strategies have at least 4 questions |
| Stem wording | all 87 Reading and Writing stems match an official College Board phrasing |
| Reading passage length | 15 to 108 words, mean 52 |
| Math fill-in share | 22%, against about 25% on the real test |

Two of those came out of a real audit failure worth recording. An earlier version keyed **55%
of questions to B and never once to D**, which a student could have exploited to raise their
score here without learning anything. And three newly written math questions shipped with
errors that a symbolic check caught: one had a key that was not a solution to its own
equation, and one had two valid answers. Both classes of bug are now checked automatically.
