# SAT LockIn, setting it up for a class

The app works with **zero setup**: open `index.html` and practice. Everything below is
optional and adds three things:

1. **Accounts**, students sign in with their email, so progress follows them across devices.
2. **A shared database**, one place for everyone's practice data.
3. **A class dashboard**, you see which traps are catching the whole class.
4. **An AI tutor**, "explain this a different way", follow-up questions, and coaching notes.

Budget: a few dollars a month for a class of 30. That is Railway hosting and Postgres, plus
Anthropic API usage if you switch the tutor on. See *Costs* at the bottom.

Two things I can't do for you: **create accounts** and **enter payment details**. Every step
below that needs either is marked 🔑 and is yours to do.

---

## Part 1: Put the app on the web

You said **satlockin.com** is available, and you want to deploy on **Railway**. Railway is a
good fit here: it can serve the app and host the AI tutor in the same service, which means
the app, the database, and the AI tutor all live in one place, with nothing else to sign up for.

### 1.1 What makes this deployable

Three files were added for Railway, and none of them change how the app runs locally:

| File | What it does |
|---|---|
| `server.js` | A Node server with no dependencies of its own. Serves the app on `$PORT`, and optionally hosts the tutor at `POST /api/tutor`. |
| `package.json` | Tells Railway this is a Node project and to run `node server.js`. |
| `railway.json` | Start command, plus a health check on `/healthz` so Railway knows when a deploy is actually up. |

`index.html` still opens by double-clicking. The server is only for hosting.

### 1.2 🔑 Register the domain

Any registrar. Cloudflare, Namecheap, and Porkbun are all around $10 to $15 a year.

### 1.3 Push the project to GitHub

Railway deploys from a repo. From the project folder:

```bash
git init && git add -A && git commit -m "SAT LockIn"
```

Then create an empty repo on GitHub and follow its "push an existing repository" lines.

`.gitignore` already excludes `node_modules` and `.env`, so no keys get committed.

### 1.4 🔑 Deploy on Railway

1. Go to railway.app and sign in with GitHub.
2. **New Project → Deploy from GitHub repo** and pick the repo.
3. Railway detects Node from `package.json`, runs `npm install`, and starts `node server.js`.
4. Under **Settings → Networking**, click **Generate Domain**. You get something like
   `sat-lockin-production.up.railway.app`. Open it. The app should be there.

There is nothing to configure for the static app to work. It runs with no variables set.

### 1.5 Point satlockin.com at it

1. Railway → **Settings → Networking → Custom Domain** → enter `satlockin.com`.
2. Railway shows a CNAME target. Add that record at your registrar.
3. Wait for it to verify. HTTPS is issued automatically.

Use `www.satlockin.com` as the custom domain if your registrar will not CNAME the root domain,
and add a redirect from the root.

### 1.6 Alternative hosts

If you would rather not use Railway, the folder is static, so Cloudflare Pages, Netlify, and
GitHub Pages all work by dragging the folder in. On those hosts you get offline practice only,
because accounts and the tutor both need `server.js` running. Keep Railway, or any Node host,
if you want those.

> **Before you point a real domain at it:** if students sign in with school email addresses,
> you are collecting personal data about minors. Check the school's policy first, since in the
> US this is FERPA and COPPA territory. The app is built to keep this small. It stores an
> email, a display name, and answer data, nothing else, and a student can leave a class from
> their Account screen at any time. A one page privacy notice at `satlockin.com/privacy` before
> you invite a class is worth the twenty minutes.

## Part 2: Accounts and the database

Everything runs on **Railway Postgres**. No third party service.

### 2.1 Add the database

1. In your Railway project, click **New → Database → Add PostgreSQL**.
2. Open your app service → **Variables → New Variable → Add Reference** and pick
   `Postgres.DATABASE_URL`. Railway fills in the connection string for you.
3. Redeploy.

That is the whole database setup. The server applies `db/schema.sql` on boot, so there is no
migration to run and nothing to paste into a SQL editor. Check `/healthz` on your domain: it
should report `"accounts": true`.

You do not need to touch `js/config.js`. The app asks the server what it supports when it
loads, so accounts appear on their own once the database is attached.

### 2.2 Sending sign-in codes

Students sign in with a 6 digit code sent to their email. A code rather than a magic link,
deliberately, so it works from any URL including a file opened off a USB stick.

1. 🔑 Sign up at resend.com. The free tier covers a class comfortably.
2. Create an API key.
3. Add to Railway Variables:

   | Variable | Value |
   |---|---|
   | `RESEND_API_KEY` | your Resend key |
   | `MAIL_FROM` | `SAT LockIn <login@satlockin.com>` once you have verified the domain in Resend, or `onboarding@resend.dev` to start |

Until you set this up, the server writes each code to its deploy log instead of emailing it,
which is fine while you are testing on your own.

### 2.3 Make yourself the teacher

1. Sign in with your own email.
2. Home screen → your name → **Account → I am the teacher**.
3. Enter a class name and a class code, for example `ALVAREZ26`.
4. Give students the code. They enter it under **Account → Join class**.

Your **Class** chip then shows each student's questions answered, accuracy, latest total
score, most common trap, and last activity, plus the traps catching the most students
across the class, which is the useful thing for planning a lesson.

### 2.4 What the database holds, and who can read what

| Table | Contents |
|---|---|
| `users` | email, display name, role, class code |
| `sessions` | a hash of each session token, never the token |
| `login_codes` | a hash of the current sign-in code, with an expiry |
| `events` | one row per answered question: which question, which strategy, which trap, right or wrong, seconds |
| `attempts` | one row per test or practice set, with the full result for the review screen |
| `generated_questions` | questions written by Claude, shared across the class |
| `ai_usage` | a per-student daily counter, so nobody can run up the AI bill |

Access is enforced by the server, and every query is scoped to the caller. A student can read
and write only their own rows. A teacher can additionally read students whose `class_code`
matches a class they own, and nothing else. Verified: a student calling the roster endpoint
gets an empty list, a student cannot promote themselves to teacher, and a student cannot take
over an existing class code.

To delete a student entirely, delete their row from `users`. Everything else cascades.

## Part 3: The AI tutor and question writer (optional)

### Why this needs a server

Calling Claude needs an API key, and a key in browser JavaScript is readable by every student
who opens developer tools, and spendable by all of them. So the key stays on the server. The
server checks the student is signed in and under their daily cap before it calls Claude.

### Setting it up

1. 🔑 Create an API key at console.anthropic.com and add a little credit.
2. In Railway → your service → **Variables**, add `ANTHROPIC_API_KEY`.
3. Redeploy.

That is all. The app notices the tutor is available and the AI features appear. Check
`/healthz`: it should report `"tutor": true`.

Optional variables:

| Variable | Default | What it does |
|---|---|---|
| `AI_DAILY_LIMIT` | `40` | Per-student cap on tutor requests per day, counted in Postgres |
| `ALLOW_ANON_TUTOR` | off | Lets the tutor run with no database. Local use only: on a public site this lets anyone who finds the URL spend your credit |
| `ANON_DAILY_BUDGET` | `60` | Total daily ceiling when running without accounts |

### What the AI does

| Feature | Where | Model |
|---|---|---|
| "Explain it a different way" | after checking an answer in untimed practice, and in test review | `claude-haiku-4-5` |
| Follow-up questions on a problem | same place | `claude-haiku-4-5` |
| A coaching note from her own trap data | Diagnosis screen | `claude-sonnet-5` |
| Writing new practice questions | Everything to learn screen | `claude-sonnet-5` |

Set these in `js/config.js` under `aiModels`. Question writing ignores a Haiku setting and
upgrades itself to Sonnet, because a weak distractor makes a worthless question. Use
`claude-opus-5` there if you want the best questions and do not mind the cost.

Generated questions land in `generated_questions`, which every signed-in student can read and
add to. That is deliberate, so a class of thirty grows one shared bank instead of each student
paying to regenerate the same material. It holds no personal data.

Guardrails already in place:

- Per-student daily cap, counted in the database.
- The tutor is prompted to stay on the current question and decline anything else.
- Student text is passed as data, not as instructions, so "ignore your instructions" gets
  nowhere useful.
- The tutor never tells a student their score is bad or compares them to classmates.
- Every generated question is validated before a student sees it: four choices, exactly one
  answer in range, a real strategy id, a real trap behind each wrong choice, passage length
  in band, numeric fill-in answers. Anything that fails is thrown away.

---

## Costs

| Item | Cost |
|---|---|
| Domain | ~$12/year 🔑 |
| Railway hosting | Free trial credit, then usage based. A small always-on service is a few dollars a month. 🔑 |
| Static hosting instead (Cloudflare Pages / Netlify / GitHub Pages) | Free |
| Railway Postgres | Included in your Railway usage. Tiny for this data. |
| Resend for sign-in emails | Free tier covers a class |
| AI tutor | Anthropic API usage. A tutor answer on Haiku is a fraction of a cent; a Sonnet coaching note is a few cents. At 30 students × 40 requests/day the cap puts the ceiling around $10–20/month, and real usage is far below the cap. |

Set a monthly spend limit in the Anthropic console if you want a hard ceiling.

---

## Turning things off

Each layer is independent, and removing one leaves the rest working.

- **AI only:** remove `ANTHROPIC_API_KEY` from Railway. The AI buttons disappear.
- **Accounts and sync:** remove the `DATABASE_URL` reference. The app returns to
  single-device mode with no sign-in screen, and nothing is lost, because local storage was
  always the source of truth.
- **Everything:** the folder still works by opening `index.html`. That is the app's normal
  offline mode, not a degraded one.
- **One student leaving a class:** Account → Leave the class. Sharing stops immediately.
- **Deleting a student's data:** delete their row from `users` in Postgres, using the query
  console under the Railway Postgres service. Every related row goes with it by cascade.

---

## Troubleshooting

**"Could not send the code."** `RESEND_API_KEY` is missing or wrong, so nothing was emailed.
Until you set it, the code is written to the Railway deploy log instead, which is enough for
testing on your own.

**Sign-in works but nothing syncs.** Check `/healthz` reports `"accounts": true`, then open
Account → *Sync now*, which reports the last error.

**The tutor says it is not configured**, the `ANTHROPIC_API_KEY` secret is missing or the
function was not deployed. Re-run 3.2.

**A student's data is missing**, they probably used *Skip, practice on this device only*.
Their work is in that browser's local storage; signing in on the same browser uploads it on
the next sync.

**Class dashboard is empty**, students have to enter the class code themselves under
Account. The code is case-insensitive on entry but stored uppercase.
