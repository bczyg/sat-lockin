# SAT LockIn

**Knowing the material gets you about three quarters of the way. The last quarter is strategy.**

Past a point, the questions you keep missing are not the ones you lack the math for. They are
the ones where you did the work correctly and reported the wrong quantity, or picked the choice
that was true but did not answer the question. That last stretch is a limited set of moves and
a limited set of traps. They repeat on every test, and they are learnable.

On test day nothing is labeled, so knowing a move is only half the job. The other half is
**recognizing which move a question wants**. SAT LockIn trains exactly that: each question
arrives with no label, you **name the move**, then you **work it** one step at a time, and only
then see the answer and why each wrong answer looks right.

Open **`index.html`**. No install, no build step, works offline.

---

## Where this fits

**This is not a replacement for Bluebook.** Take your full practice tests in College Board's
own app: that is the real software, the real retired questions, and the only scoring worth
trusting. There is no full test and no score here.

What Bluebook will not do is tell you *why* you missed what you missed. So when you miss one
there, paste it in here and get the move it was testing and the trap the wrong answer was built
from.

## The screens

| Screen | What it does |
|---|---|
| **Home** | One big **Start** button, your streak, a seven-day strip, and one progress number: **moves locked in**, out of the 29 moves a question can test. A move locks in once you name it right at least four times in five, over three or more tries. |
| **Today's session** | Daily LockIn plus eight questions the coach picked. For each one you name the move, then work it step by step. Miss the name and you see what gives the move away and how to tell it from the one you picked. |
| **Practice more** | Another eight, once today's session is done. |
| **All moves** | The guide to all 30 moves: how you know it is this one, what it is easy to mix up with, why it works, and a round of practice spotting it. The built-in calculator tips live inside the "graph it first" move. |
| **Missed one in Bluebook?** | Paste a question, and optionally guess the move first. The AI names the move it wanted and the trap behind the answer you picked. |

A short "How SAT LockIn works" page with one demo question is linked from the home screen and
shown once to a first-time visitor.

**Daily LockIn** serves one unlabeled question a day, the same one all day, rotating through the
moves in order, so one pass covers every nameable move. There are 30 moves: 16 Reading and
Writing and 13 math moves that a question can test, plus one habit ("Read the choices down the
column") used on every conventions question rather than being a question type of its own.

### How the naming stays fair

In Reading and Writing the question type is pinned down by its wording, so the wrong options
are other moves from that section: look-alikes and same-domain neighbors first, since telling
those apart is the skill.

Math is different. A radical equation can be graphed, solved by hand, or back-solved from the
choices, and naming any of those is not wrong. So in math the wrong options never include a
move that works on nearly anything (graphing, using the choices), never a known look-alike, and
never a move from the question's own family (algebra, data, geometry). That makes math naming
coarser than reading. It is the honest version. `verify.js` checks every question in the bank
against these rules.

## The built-in calculator

Bluebook puts a Desmos graphing calculator on every math question, and most students use it as
a four-function calculator. The "graph it first" move guide carries 16 tricks, each written as
*what you literally type* and *what happens*, because "use the calculator" is not advice. The
content lives in `js/desmos.js` as data, and `verify.js` fails if a trick loses its keystrokes
or cites a question that no longer exists.

Some tricks say **Try this one in Bluebook once before test day**. Those are standard Desmos
features not personally confirmed inside Bluebook's embedded build, and saying so is better
than being confidently wrong in a timed module.

---

## Price and what is free

One payment of **$14.99** unlocks everything. No subscription, no tiers, no ads.

- **Daily LockIn is free forever**, with no account.
- **Everything else needs the purchase**: today's session, Practice more, practicing a move from
  its guide, and pasting a Bluebook question.
- **But only when the server takes payments**, meaning `STRIPE_WEBHOOK_SECRET` is set. A copy
  opened from disk, or a server without payments, is fully open.

The question bank ships inside the page, so the lock on rounds is in the browser. It is honest
rather than unbreakable. The AI, which is what costs money, is enforced by the server: an
account that has not paid gets a 402 and the model is never called.

**Buying:** the student enters their email, gets a 6-digit code, and is then sent to the Stripe
Payment Link. The link carries their account id (`client_reference_id`) and email
(`prefilled_email`), so the payment lands on the right account. After paying, Stripe sends them
back to `/?paid=1`; the app polls the server until the purchase shows up, then says **You are
all set**. On a new device, **Already bought it? Sign in** on the home screen gets them back in.
`COMP_EMAILS` gives listed addresses access without paying.

The price and link live in `js/config.js`:

```js
price: '$14.99',      // display text only, must match what the link charges
checkoutUrl: ''       // the Stripe Payment Link
```

With `checkoutUrl` empty the pay button says checkout is not connected, rather than pretending
to take a payment. **The app never sees card details.** Setup is Part 4 of
[SETUP-CLOUD.md](SETUP-CLOUD.md).

**The AI costs you money per use.** The coach and the pasted-question analysis call the
Anthropic API on your account. Only buyers reach them, and the server caps each student per day
(`AI_DAILY_LIMIT`, 40 by default). Each prepared coach session costs one unit, at most three
sessions a day. A one-time price against a recurring cost is still worth watching in the
Anthropic console.

---

## The coach

The coach is an agent that works behind the scenes. The student never sees a plan; they press
Start and get the questions.

- Claude Sonnet 5.5 runs a short tool loop over the student's synced record, using three
  read-only tools (an overview, one move in depth, one trap in depth). Then it calls
  `prepare_session` with the moves for the eight questions and one short line to the student.
- The server checks every move against the catalog. A bad submission goes back to Claude to
  fix rather than reaching the student. The server then picks unseen questions for each move.
- Misses pasted from an official Bluebook practice test are the strongest signal it has. A move
  missed on Bluebook usually shows up in the next sessions, so practice here follows the
  student's real test results.
- The app fetches today's prepared session on the first visit of the day. When a session
  starts, it asks for the next one in the background, at most three a day.
- **Fresh questions.** When a student is running out of unseen questions for a move, the server
  asks Claude Opus 5.5 to write new ones for that move, in the background. A separate Claude
  Sonnet 5.5 pass then solves each one blind (no answer key, no label) and must land on the same
  answer and the same move with high confidence and no problems, or the question is thrown
  away. Questions that pass are sanitized and join a pool shared by every student, so each one
  is paid for once and the supply keeps growing. Pool questions travel to the app inside the
  session. Writing never touches a student's AI allowance; `POOL_DAILY_LIMIT` caps it for the
  whole server. The code is in `lib/writer.js`.
- If the coach is not ready, or not configured, the app builds the round itself from the
  student's record, so Start never waits.

Endpoints: `POST /api/coach/today` (today's latest session, no model call) and
`POST /api/coach/prepare` (run the agent and save a new session). The code is in
`lib/coach.js`.

The only task left on `POST /api/tutor` is `analyze`, the pasted Bluebook question. Any other
task is refused.

## Accounts and the server (optional)

The app runs on one device with nothing set up. The server adds:

- **Email sign-in** with a 6-digit code, no passwords
- **A Postgres database** so progress follows a student across devices: the naming record, the
  Daily LockIn streak, and answer history
- **Payments** through a Stripe Payment Link and a signed webhook that records who paid
- **The AI**: the coach and pasted-question analysis, signed in to Anthropic from the server
  by workload identity federation (OIDC), so no API key is stored anywhere

Step by step, including deploying to **Render** and pointing **satlockin.com** at it:
**[SETUP-CLOUD.md](SETUP-CLOUD.md)**

## Deploying

The app is static, so it hosts anywhere. On Render (or any Node host), `server.js` serves it
on `$PORT` and hosts the API.

```bash
npm start          # serve the app, http://localhost:8080
npm run verify     # question bank integrity and house style checks
TEST_DATABASE_URL=postgresql://... npm run itest   # API against a scratch Postgres (never production: it empties the question pool)
npm run bundle     # rebuild the single-file version in dist/
npm run schema     # apply db/schema.sql to $DATABASE_URL by hand
npm run mailtest you@example.com   # send one test email and explain any failure
npm run oidctest   # check the server signs in to Anthropic by OIDC, never a stored key
```

On Render, **New > Blueprint** reads `render.yaml`: one Node web service and one Postgres
database with no outside access. Node 22 is pinned in `.node-version`. The schema is applied on
every boot. In production the AI signs in by workload identity federation, which needs a
Render Pro workspace; `ANTHROPIC_API_KEY` is for local development only. `/healthz` reports
what is switched on, including `"aiAuth"`. None of this affects opening `index.html` directly.
Full steps: [SETUP-CLOUD.md](SETUP-CLOUD.md).

## Keyboard

During a session, `1` to `4` picks a move.

---

## Files

```
index.html              the app, open this
assets/styles.css       all styling
js/brand.js             name and tagline, change these to rename the app
js/config.js            price, checkout link, and rare hosting settings
js/data-rw.js           100 Reading and Writing questions, fully explained
js/data-math.js         79 Math questions, fully explained
js/tags.js              43 traps, 30 moves, and the tags for every question
js/desmos.js            the calculator tricks, as data
js/engine.js            the answer log and local storage
js/daily.js             Daily LockIn: the date-driven rotation, the streak, the history
js/spot.js              naming: round building, fair wrong options, the naming record
js/cloud.js             accounts and offline-first sync (no dependencies)
js/app.js               all screens
db/schema.sql           Postgres tables, applied automatically on boot
lib/db.js               database pool
lib/auth.js             sign in with an emailed one-time code
lib/mail.js             sending that code, via Microsoft Graph or Resend
lib/routes.js           the JSON API: sign-in, profile, sync
lib/billing.js          the signed Stripe webhook and who has paid
lib/coach.js            the coach agent: its tools, the move check, picking questions
lib/writer.js           writing new questions and checking them blind
scripts/oidc-test.mjs   checks the OIDC sign-in to Anthropic against a fake API
render.yaml             the Render Blueprint: web service and Postgres
.node-version           pins Node 22
build-single-file.py    bundles everything into dist/sat-lockin.html
```

Progress lives in the browser's local storage unless you sign in. "Clear my progress" in the
account panel wipes it.

---

## Adding your own questions

Append to `js/data-rw.js` or `js/data-math.js` following the existing shape, then add a line
to `window.TAGS` in `js/tags.js` classifying each wrong answer. The app picks new questions up
automatically.

A multiple-choice item needs `domain`, `skill`, `difficulty` (`E`/`M`/`H`), `prompt`,
`choices`, `answer` (0-based), `strategy`, `hint`, `steps`, `traps`. A fill-in uses
`type:'spr'` with an `answers` array instead of `choices`/`answer`.

---

## Honest limitations

- **The fixed bank is 179 questions.** On its own, a student doing a session every day would
  start seeing repeats after a few weeks. With the AI on, the coach's writer tops up any move
  that runs low, but those questions are only as good as the blind check that passed them.
  Watch the accept rate (`pool_usage`) and read a sample of `pool_questions` after launch.
- **Math naming is coarser than reading naming.** Several moves often work on one math
  question, so the wrong options come from other families of problem. It trains "is this an
  algebra, data, or geometry move" well, and the finer choice between solving by hand and
  graphing, not at all. That finer choice is taught in the calculator tips instead.
- **Offline means one device.** Without signing in, the naming record and the streak live in
  that browser. Signing in carries them across devices, and the first sign-in on a device
  uploads what it already has.
- **These are my questions, not College Board's.** Written to match the format, difficulty
  range, and domain mix. Take your real practice tests in **Bluebook** and bring the misses here.
- **There is no score anywhere in the app.** Scoring is item-response-theory based and
  form-specific, so any number this app produced would be invented. "Moves locked in" is what
  it can honestly measure.
- **A pasted question is classified by a model, not by a person.** It is checked against the
  real catalogs, so it cannot invent a move or trap that does not exist, and it reports low
  confidence when the question came through incomplete. It can still be wrong.

## A note on the writing

The app's own voice uses no em dashes and US spelling throughout. Em dashes survive in exactly
one place: inside reading passages and answer choices, where they are authentic SAT prose, and
where one question tests paired-dash punctuation directly.

## Continuous integration

`.github/workflows/checks.yml` runs on every push and pull request:

- every script parses
- all 179 questions are structurally sound: four choices, one answer in range, a real strategy
  tag, a real trap behind every wrong choice, fill-in answers that parse as numbers
- every figure and passage has well-formed tags (curly quotes inside a tag once left four charts
  blank)
- every move has recognition cues, every look-alike pair names real moves, and every question
  gets at least two fair wrong options when naming its move
- house style holds: no em dashes in the app's own voice, US spelling, no emoji as icons
- the server boots, answers `/healthz`, and does not serve `server.js`, `.env`, `lib/`, or
  `db/` over HTTP, including through a `/js/../` traversal
- against a throwaway Postgres: sign-in codes cap at six guesses and sign in once under a race,
  no account can overwrite another's rows, the naming record syncs without duplicates, only a
  correctly signed and recent payment webhook marks an account paid (and a full refund unmarks
  it), `COMP_EMAILS` grants access, CORS answers only listed origins, an unpaid account gets a
  402 from the coach and the tutor, retired tutor tasks are refused, and the coach agent runs
  its full tool loop against a scripted stand-in for the Anthropic API: the right model, a bad
  submission bounced back and fixed, eight questions the student has not seen, one unit of the
  daily allowance per session, and nothing charged when a call fails
- Anthropic sign-in by OIDC (`npm run oidctest`, against a fake API): the token file is
  exchanged for a short-lived token, a rotated token is picked up without a restart, a
  leftover `ANTHROPIC_API_KEY` is ignored and never sent, incomplete federation turns the AI
  off instead of falling back to a key, and a refused token shows up at startup

Run the same checks locally with `npm run verify`, `npm run oidctest` and, given a scratch
database, `npm run itest`.

There is no schema workflow and no database secret in GitHub. The server applies the schema on
every boot.

## Question quality, measured

The bank is audited rather than asserted. The first four rows are enforced by
`npm run verify` on every push; the last two are measured, not enforced.

| Property | Where it stands |
|---|---|
| Answer key spread | A 43, B 42, C 42, D 37 across 164 multiple-choice items |
| Correct answer is the longest choice | 34% (chance is 25%, and the check fails above 40%) |
| Trap coverage | all 43 trap types have at least 4 questions |
| Strategy coverage | every strategy has at least 4 questions |
| Reading passage length | 13 to 108 words, mean 49 |
| Math fill-in share | 19% (15 of 79), against about 25% on the real test |

Two of those came out of a real audit failure worth recording. An earlier version keyed **55%
of questions to B and never once to D**, which a student could have exploited without learning
anything. And three newly written math questions shipped with errors that a symbolic check
caught: one had a key that was not a solution to its own equation, and one had two valid
answers. Both classes of bug are now checked automatically.
