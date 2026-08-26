# SAT LockIn

**Knowing the material gets you about three quarters of the way. The last quarter is strategy.**

Content review is necessary and there is no shortcut past it. But past a point the questions
you keep missing are not the ones you lack the math for: they are the ones where you did the
work correctly and reported the wrong quantity, or picked the choice that was true but did not
answer the question. That last stretch is a limited set of moves and a limited set of traps,
they repeat on every test, and they are learnable.

So the app is two catalogs and a daily loop through them: **30 strategies** (the move each
question type wants) and **43 traps** (the way each wrong answer is built).

**Daily LockIn** serves one question a day, rotating through the moves in order, so one pass
covers every strategy exactly once and nothing gets skipped. `verify.js` enforces that.

Open **`index.html`**. No install, no build step, works offline.

---

## Where this fits

**This is not a replacement for Bluebook.** Take your full practice tests in College Board's
own app: that is the real software, the real retired questions, and the only scoring worth
trusting. A homemade imitation of a full test is strictly worse at the one job it would have,
so there is no full test here at all.

What Bluebook will not do is tell you *why* you missed what you missed. It gives you a score.
So when you miss one there, you paste the question in here and get the move it was testing and
the trap the wrong answer was built from, on the same two lists as everything else.

## What makes it different

Most prep apps tell you *what topic* you are weak at. That is not actionable, because "work on
Algebra" is not advice. SAT LockIn names the actual mistake:

> **What caught you: Answered a different quantity** · Half the job · 7 times so far
>
> **How to spot it:** Correct work, wrong thing reported: x instead of x + y, the vertex x
> instead of the minimum value, the rate instead of the time.
>
> **How to beat it:** Circle the requested quantity before solving and check your answer
> against that circle.
>
> [Practice against this trap]

Every wrong answer in the bank is classified against the trap catalog, and every question is
tagged with the strategy it tests. Those tags are the whole app: they build the daily pair,
the two lists, and the sets you drill.

---

## The screens

There are five, and four of them are the two catalogs.

| Screen | What it does |
|---|---|
| **Landing** | The three-quarters argument, a live question you can try, what you get, the price, and what this is not. A first-time visitor sees it before anything else. |
| **Today** | Daily LockIn: today's one question and which move it is drilling, your streak, a seven-day strip, and the two lists with their counts. Nothing else competes. |
| **Strategies** | All 30 moves, grouped by section, each with its state, a set to practice it, and the recipe used to generate more. Spaced recall on the moves lives here too. |
| **Traps** | All 43 traps in six families, each with how to spot it, how to beat it, and a set where it is waiting. |
| **Paste a question** | Paste a miss from Bluebook. You get the move it wanted, the trap behind the answer you picked, a walkthrough, and what each wrong choice was built from. It joins both lists. |
| **The built-in calculator** | 16 Desmos tricks, each as a keystroke and an outcome, with the bank questions where that trick is the fastest route. Reached from the graphing move on the Strategies list, since it is that move's deep content rather than a sixth screen. |

A practice set is untimed and always anchored to one move or one trap. Miss a question and you
get the hint, the strategy, the worked solution, and why every wrong answer was tempting.

Accounts and a class dashboard are still there for a teacher handing this to a group, reached
from the account chip rather than the practice surface.

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

## The built-in calculator

Bluebook puts a Desmos graphing calculator on every math question, in both modules, and most
students use it as a four-function calculator. That is the biggest unforced error on the math
section, so it gets its own page: 16 tricks, each written as *what you literally type* and
*what happens*, because "use the calculator" is not advice.

The content lives in `js/desmos.js` as data, not markup, so `verify.js` can check it. Each trick
names bank questions where the graph is the fastest route, and the page offers a set built from
exactly those 32 questions. The checks fail if a trick loses its keystrokes, cites a question
that no longer exists, or if that set comes back with anything the page never cited.

Two tricks carry a **Try it in Bluebook first** badge: regressions and the statistics functions.
Those are standard Desmos features and I have not personally confirmed them inside Bluebook's
embedded build. Saying so is better than being confidently wrong in a timed module, and the page
tells the student to spend thirty seconds checking rather than trusting it.

The page hangs off the graphing move on the Strategies list rather than being another home
screen entry, because it is that one strategy's deep content.

## Price

One payment of **$14.99**. No subscription, no renewal, no premium tier, no ads.

Both halves live in `js/config.js`:

```js
price: '$14.99',      // display text only, must match what the link charges
checkoutUrl: ''       // a Stripe Payment Link, Gumroad, Lemon Squeezy, anything hosted
```

With `checkoutUrl` empty the buy button is disabled and says checkout is not connected, rather
than pretending to take a payment. Set it to a hosted checkout URL and the button becomes a
real link. **The app never sees card details**, which is the entire reason for handing off to a
hosted checkout instead of building a form.

Two things worth deciding before you switch it on:

- **There is no entitlement check.** Every question works before anyone pays. That is a
 deliberate default for a study tool you are handing to one class, but if you sell this widely
 you will want the checkout to issue a license the app verifies.
- **The AI features cost you money per use.** Pasted-question classification and question
 generation call the Anthropic API on your key. The server caps usage per student per day
 (`AI_DAILY_LIMIT`, 40 by default), so the exposure is bounded, but a one-time price against a
 recurring cost is a margin question, not a technical one.

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

## Keyboard shortcuts (during a practice set)

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
assets/styles.css question UI (Bluebook-accurate) + shell UI (deliberately friendlier)
js/brand.js name and tagline, change these to rename the app
js/config.js optional cloud + AI settings; empty = offline single-device
js/data-rw.js 100 Reading and Writing questions, fully explained
js/data-math.js 79 Math questions, fully explained
js/tags.js 43 trap types, 30 strategies, and the tag for every question
js/daily.js Daily LockIn: the date-driven rotation, the streak, and the history
js/desmos.js the calculator tricks, as data, with the questions each one applies to
js/strategies.js strategy library and math reference sheet
js/engine.js set assembly, grading, the event log, and storage
js/cloud.js accounts and offline-first sync (no dependencies)
js/app.js all screens
db/schema.sql                 Postgres tables, applied automatically on boot
lib/db.js                     database pool
lib/auth.js                   sign in with an emailed one-time code
lib/mail.js                   sending that code, via Microsoft Graph or Resend
lib/routes.js                 the JSON API: sync, classes, roster
build-single-file.py bundles everything into dist/sat-lockin.html
```

Progress lives in the browser's local storage unless you sign in. "Clear my progress" in the
account panel wipes it.

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

- **The bank is 179 questions.** Every one of the 72 catalog entries has at least four
 questions behind it, which `verify.js` enforces, but four is a floor and not a lot. With the
 AI turned on the app writes more against each strategy's own recipe; without it, the thinner
 entries repeat sooner.
- **These are my questions, not College Board's.** Written to match the format, difficulty
 range, and domain mix. Take your real practice tests in **Bluebook** and bring the misses here.
- **There is no score anywhere in the app.** Scoring is item-response-theory based and
 form-specific, so any number this app produced would be invented. The two lists are what it
 can honestly measure.
- **A pasted question is classified by a model, not by a person.** It is checked against the
 real catalogs, so it cannot invent a strategy or trap that does not exist, and it reports low
 confidence when the question came through incomplete. It can still be wrong, and you can
 always label a miss yourself instead.


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
| Strategy coverage | every strategy has at least 4 questions, every recipe is valid |
| Stem wording | all 87 Reading and Writing stems match an official College Board phrasing |
| Reading passage length | 15 to 108 words, mean 52 |
| Math fill-in share | 22%, against about 25% on the real test |

Two of those came out of a real audit failure worth recording. An earlier version keyed **55%
of questions to B and never once to D**, which a student could have exploited to raise their
score here without learning anything. And three newly written math questions shipped with
errors that a symbolic check caught: one had a key that was not a solution to its own
equation, and one had two valid answers. Both classes of bug are now checked automatically.
