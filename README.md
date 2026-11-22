# SAT LockIn

**Knowing the material gets you about three quarters of the way. The last quarter is strategy.**

Content review is necessary and there is no shortcut past it. But past a point the questions
you keep missing are not the ones you lack the math for: they are the ones where you did the
work correctly and reported the wrong quantity, or picked the choice that was true but did not
answer the question. That last stretch is a limited set of moves and a limited set of traps,
they repeat on every test, and they are learnable.

So the app is two catalogs and the habit that uses them: **30 strategies** (the move each
question type wants) and **43 traps** (the way each wrong answer is built).

Knowing a move is half the job. The other half is **recognizing which move a question wants**,
because on test day nothing is labeled. So questions here arrive the way they do in Bluebook,
with no label: you name the move first, then work it with that move one step at a time, and
only then see the answer and the traps.

**Daily LockIn** serves one unlabeled question a day, rotating through the moves in order, so
one pass covers every drillable strategy (29 of the 30: "read the choices down the column" is a
habit used on every conventions question, not a question type of its own) and nothing gets
skipped. `verify.js` enforces that.

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
tagged with the strategy it tests. Every strategy also carries its **recognition cues** (what in
the question gives it away), and the pairs students actually confuse carry a one-line
**tell-apart**:

> **You picked: Let the time markers pick the verb**
>
> Choices that differ in number (is, are) mean find the subject. Choices that differ in time
> (was, has been, will be) mean find the time marker.

Those tags are the whole app: they build the daily question, the naming rounds, the two lists,
and the sets you drill.

---

## The screens

| Screen | What it does |
|---|---|
| **Landing** | The three-quarters argument, a live question you can try, what you get, the price, and what this is not. A first-time visitor sees it before anything else. |
| **Today** | Daily LockIn: today's one unlabeled question, your streak, a seven-day strip, your coach's plan for the day (when the AI is on), the way into Name the move, and the two lists with their counts. |
| **Name the move** | Eight unlabeled questions. Name the move each one wants before solving, then work it step by step. Unseen and least reliable moves come first. Ends with what you named, what you mixed up, and how to tell each pair apart. A focused round drills one move against its look-alikes. |
| **Strategies** | All 30 moves, grouped by section. Each has **how to spot it** (cues, look-alikes, the move, a drill), your naming record, a set to practice the move itself, and the recipe used to generate more. Spaced recall on the moves lives here too. |
| **Traps** | All 43 traps in six families, each with how to spot it, how to beat it, and a set where it is waiting. |
| **Paste a question** | Paste a miss from Bluebook and, if you like, guess the move before looking. You get the move it wanted (with the tell-apart if your guess was off), the trap behind the answer you picked, a walkthrough, and what each wrong choice was built from. It joins both lists, and a confident classification of your guess counts toward your naming record. |
| **The built-in calculator** | 16 Desmos tricks, each as a keystroke and an outcome, with the bank questions where that trick is the fastest route. Reached from the graphing move on the Strategies list, since it is that move's deep content rather than a sixth screen. |

A practice set is untimed and always anchored to one move or one trap, so it trains the move
rather than the recognition; Name the move is where recognition gets trained. Miss a question in
a set and you get the hint, the strategy, the worked solution, and why every wrong answer was
tempting.

### How the naming rounds stay fair

In Reading and Writing the question type is pinned down by its wording, so the wrong options
are other strategies from that section: look-alikes and same-domain neighbors first, since
telling those apart is the skill.

Math is different. A radical equation can be graphed, solved by hand, or back-solved from the
choices, and naming any of those is not wrong. So in math the wrong options never include a
move that works on nearly anything (graphing, using the choices), never a known look-alike, and
never a move from the question's own family (algebra, data, geometry). That makes math naming
coarser than reading. It is the honest version, and when the calculator would also get there
the screen says so. `verify.js` checks every question in the bank against these rules.

Accounts and a class dashboard are still there for a teacher handing this to a group, reached
from the account chip rather than the practice surface.

---

## What the question screen keeps from the real test

There is no full test here (see above), but a practice set looks and behaves like Bluebook so
nothing is unfamiliar on test day:

- **One short passage per Reading and Writing question**, as the digital test does.
- **Fill-in rules enforced**: `.666` and `.667` both count for 2/3; `0.67` correctly does not.
- **Test-day tools**: Mark for Review, the ABC answer eliminator, passage highlighting, the
 math reference sheet, and a calculator.
- **Unseen questions come first**, so a second set draws fresh material until the bank is
 genuinely exhausted.

What it does not keep is the clock or a score. A ten-question set anchored to one move says
nothing honest about a score, and the adaptive routing and score curves went with the full test.

---

## Optional: accounts, a class, and an AI tutor

Untouched. The app is single-device and offline. Fill in `js/config.js` to add:

- **Email sign-in** (6-digit code, no passwords, works from any URL)
- **A Postgres database** (Railway's one-click plugin) so progress follows a student across
 devices: practice history, the naming record, and the Daily LockIn streak
- **A class dashboard** for a teacher, who approves each student who joins. It shows the traps
 catching the class and the moves the class mixes up, each with its tell-apart
- **Payments** through a hosted Stripe checkout, with a signed webhook recording who paid
- **A coach** that plans each student's day. It is an agent, not a chat: Claude reads the
 student's synced record through three read-only tools (an overview, one move in depth, one
 trap in depth), then submits two to four steps the app runs directly, such as a focused naming
 round on the pair they keep mixing up, a practice set on the trap that keeps catching them,
 and Daily LockIn. Every id in a plan is checked against the catalog, and a bad plan goes back
 to Claude to fix rather than reaching the student. Sonnet 5.5, one plan costs one unit of the
 daily AI allowance, at most three plans a day.
- **An AI tutor** for "explain this a different way," follow-up questions on a problem, and a
 coaching note written from the student's own trap data. Haiku 5.5 handles conversation;
 Sonnet 5.5 handles the reasoning-heavy tasks. The API key lives in a server-side function,
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

With a database and `STRIPE_WEBHOOK_SECRET` set, the server also knows **who has paid**. Stripe
calls `/api/billing/webhook` after each payment and refund; the call is signature-checked, and it
is the only thing that can mark an account paid. A signed-in buyer's checkout link carries their
account id, so the payment lands on the right account even if they type another email at
checkout. Setup is Part 4 of [SETUP-CLOUD.md](SETUP-CLOUD.md).

Two things worth deciding before you sell widely:

- **What is free.** Once the server takes payments, Daily LockIn and one Name the move round a
 day are free, signed in or not. More rounds, practice sets, the coach, the tutor, and pasting a
 question need the purchase. The question bank ships inside the page, so the lock on rounds and
 practice sets is honest rather than unbreakable; the AI, which is what costs money, is enforced
 by the server. A copy opened from disk, or a server with no `STRIPE_WEBHOOK_SECRET`, stays
 fully open.
- **The AI features cost you money per use.** The coach, pasted-question classification and
 question generation call the Anthropic API on your key. With payments on, only buyers reach
 them, and the server caps each one per day (`AI_DAILY_LIMIT`, 40 by default; the coach at
 three plans), so the exposure per buyer is bounded. A one-time price against a recurring cost
 is still a margin question worth watching in the Anthropic console.

## Deploying

The app is static, so it hosts anywhere. For Railway (or any Node host) there is a
dependency-free `server.js` that serves it on `$PORT` and can also host the AI tutor at
`POST /api/tutor`, which keeps the Anthropic key in a Railway variable rather than in a
student's browser.

```bash
npm start          # serve the app, http://localhost:8080
npm run verify     # question bank integrity and house style checks
TEST_DATABASE_URL=postgresql://... npm run itest   # API against a scratch Postgres (never production)
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
js/spot.js Name the move: round building, fair wrong options, and the naming record
js/desmos.js the calculator tricks, as data, with the questions each one applies to
js/strategies.js strategy library and math reference sheet
js/engine.js set assembly, grading, the event log, and storage
js/cloud.js accounts and offline-first sync (no dependencies)
js/app.js all screens
db/schema.sql                 Postgres tables, applied automatically on boot
lib/db.js                     database pool
lib/auth.js                   sign in with an emailed one-time code
lib/mail.js                   sending that code, via Microsoft Graph or Resend
lib/routes.js                 the JSON API: sync, classes, roster, approvals
lib/billing.js                the signed Stripe webhook and who has paid
lib/coach.js                  the coach agent: its tools, the plan check, and the loop
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

- **Math naming is coarser than reading naming.** Several moves often work on one math
 question, so the wrong options come from other families of problem (see "How the naming
 rounds stay fair"). It trains "is this an algebra, data, or geometry move" well and the finer
 choice between, say, solving by hand and graphing, not at all. That finer choice is taught on
 the calculator page instead.
- **Offline means one device.** Without signing in, practice, the naming record, and the
 streak live in that browser. Signing in carries all three across devices, and the first
 sign-in on a device uploads what it already has.
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
- all 179 questions are structurally sound: four choices, one answer in range, a real strategy
  tag, a real trap behind every wrong choice, fill-in answers that parse as numbers
- every figure and passage has well-formed tags (curly quotes inside a tag once left four charts
  blank)
- every strategy has recognition cues, every look-alike pair names real strategies, and every
  question gets at least two fair wrong options when naming its move
- house style holds: no em dashes in the app's own voice, US spelling, no emoji as icons
- the server boots, answers `/healthz`, and does not serve `server.js`, `.env`, `lib/`, or
  `db/` over HTTP, including through a `/js/../` traversal
- against a throwaway Postgres: sign-in codes cap at six guesses and sign in once under a race,
  no account can overwrite another's rows, the naming record syncs without duplicates, only a
  correctly signed and recent payment webhook marks an account paid (and a full refund unmarks
  it), class joins wait for the teacher, CORS answers only listed origins, and the coach agent
  runs its full tool loop against a scripted stand-in for the Anthropic API: the right model and
  settings, the tools fed real student data, a bad plan bounced back and fixed, the purchase and
  daily limits held, and nothing charged when a call fails

Run the same checks locally with `npm run verify` and, given a scratch database,
`npm run itest`.

`.github/workflows/schema.yml` applies `db/schema.sql` to Railway Postgres, either when the
schema changes on `main` or on demand from the Actions tab. It needs a `DATABASE_PUBLIC_URL`
secret, because Railway's internal database host is not reachable from GitHub. This workflow
is optional: the server applies the schema on boot anyway.


## Question quality, measured

The bank is audited rather than asserted. The first four rows are enforced by
`npm run verify` on every push; the last two are measured, not enforced.

| Property | Where it stands |
|---|---|
| Answer key spread | A 43, B 42, C 42, D 37 across 164 multiple-choice items |
| Correct answer is the longest choice | 34% (chance is 25%, and the check fails above 40%) |
| Trap coverage | all 43 trap types have at least 4 questions |
| Strategy coverage | every strategy has at least 4 questions, every recipe is valid |
| Reading passage length | 13 to 108 words, mean 49 |
| Math fill-in share | 19% (15 of 79), against about 25% on the real test |

Two of those came out of a real audit failure worth recording. An earlier version keyed **55%
of questions to B and never once to D**, which a student could have exploited to raise their
score here without learning anything. And three newly written math questions shipped with
errors that a symbolic check caught: one had a key that was not a solution to its own
equation, and one had two valid answers. Both classes of bug are now checked automatically.
