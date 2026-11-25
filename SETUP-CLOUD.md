# SAT LockIn, putting it online

The app works with **zero setup**: open `index.html` and practice. Everything below is
optional and adds:

1. **Accounts**, so a student signs in with their email and their progress follows them across
   devices.
2. **A database**, one place for every student's practice data.
3. **Payments**, one $14.99 purchase that unlocks everything past Daily LockIn.
4. **The AI**: the coach that picks each student's questions, and "Missed one in Bluebook?".

Budget: a Render Pro workspace (needed for the AI's keyless sign-in), a small web service, and
a small Postgres database, plus Anthropic API usage once the AI is on. See *Costs* at the
bottom.

Two things I can't do for you: **create accounts** and **enter payment details**. Every step
below that needs either is marked 🔑 and is yours to do.

---

## Part 1: Put the app on the web

Render serves the app and the database from one Blueprint file, `render.yaml`.

### 1.1 What makes this deployable

| File | What it does |
|---|---|
| `server.js` | A Node server. Serves the app on `$PORT` and hosts the API. |
| `package.json` | Tells Render this is a Node project. |
| `render.yaml` | The Blueprint: one web service (`npm ci --omit=dev`, then `node server.js`, health check on `/healthz`) and one Postgres database, `sat-lockin-db`. |
| `.node-version` | Pins Node 22. |

`index.html` still opens by double-clicking. The server is only for hosting.

### 1.2 🔑 Register the domain

Any registrar. Cloudflare, Namecheap, and Porkbun are all around $10 to $15 a year.

### 1.3 Push the project to GitHub

Render deploys from a repo. From the project folder:

```bash
git init && git add -A && git commit -m "SAT LockIn"
```

Then create an empty repo on GitHub and follow its "push an existing repository" lines.
`.gitignore` already excludes `node_modules` and `.env`, so no keys get committed.

### 1.4 🔑 Deploy on Render

1. Sign in to render.com. The AI in Part 3 needs a **Pro workspace or higher**, so pick that
   plan if you want the AI.
2. Click **New > Blueprint** and pick the repo. Render reads `render.yaml`.
3. Render asks for the values marked `sync: false`. Leave any you are not ready for blank: the
   Anthropic ones come in Part 3, the Stripe ones in Part 4, `MAIL_FROM` in 2.3.
4. Render creates the database and the web service, wires `DATABASE_URL` between them, and
   deploys. Open the `onrender.com` address it gives you. The app should be there.

### 1.5 Point satlockin.com at it

1. In the web service, open **Settings > Custom Domains** and add `satlockin.com`.
2. Render shows the DNS records to add. Add exactly those at your registrar.
3. Wait for it to verify. HTTPS is issued automatically.

### 1.6 Alternative hosts

The folder is static, so Cloudflare Pages, Netlify, and GitHub Pages all work by dragging the
folder in. On those hosts you get offline practice only, because accounts, payments, and the AI
all need `server.js` running.

> **Before you point a real domain at it:** your students are mostly minors, and they sign in
> with an email address. The app keeps this small: it stores an email, a display name, and
> answer data, nothing else. A one page privacy notice at `satlockin.com/privacy` before you
> launch is worth the twenty minutes.

## Part 2: Accounts and the database

Everything runs on **Render Postgres**. No third party service.

### 2.1 The database

`render.yaml` already creates it: a Postgres database named `sat-lockin-db` on the
`basic-256mb` plan, with `DATABASE_URL` on the web service set to its **internal** connection
string. There is nothing to click.

- **No outside access.** The database's IP allow list is empty, so only services in your
  Render workspace can reach it, over Render's private network.
- **No migrations to run.** The server applies `db/schema.sql` on every boot. Every statement
  is `create table if not exists` or similar, so re-running it changes nothing. Check
  `/healthz` on your domain: it should report `"accounts": true`.

You do not need to touch `js/config.js`. The app asks the server what it supports when it
loads, so accounts appear on their own once the database is attached.

### 2.2 Running SQL by hand, and TLS

- **Running SQL by hand.** Use the database's page in the Render dashboard, or temporarily add
  your own IP to its allow list and remove it when you are done.
- **TLS.** The internal URL needs none. If you ever connect over TLS (an external URL, or
  `PGSSL=true`), the server verifies the database's certificate. `PGSSL_NO_VERIFY=true` turns
  that check off; avoid it.

### 2.3 Sending sign-in codes

Students sign in with a 6 digit code sent to their email. A code rather than a magic link,
deliberately, so it works from any URL.

**While testing you need no mail setup at all.** With no provider configured the server writes
each code to its own log. On Render that is the service's **Logs** tab, showing a line like
`[mail] no mail provider configured. Code for you@example.com is 483920`. Once payments are on
this stops (see Part 4), so set up mail before you sell.

Two providers are supported. Graph takes precedence if both are configured. `render.yaml` only
asks for `MAIL_FROM`; add the other variables yourself in the service's **Environment** tab,
then redeploy.

#### Option A: Microsoft Graph (Microsoft 365)

Sends as a mailbox in your own tenant using an Entra app registration, so mail comes from your
domain with your reputation and no third party involved.

**Variables**

| Variable | What it is |
|---|---|
| `GRAPH_TENANT_ID` | Directory (tenant) ID, a GUID. Entra portal, app registration Overview. |
| `GRAPH_CLIENT_ID` | Application (client) ID, a GUID. Same page. |
| `GRAPH_CLIENT_SECRET` | The secret **Value**, shown only once when you create it. The Secret ID is not the secret. |
| `GRAPH_SENDER` | The mailbox to send from, for example `login@satlockin.com`. Must be a real mailbox in the tenant. |
| `GRAPH_SAVE_TO_SENT` | Optional. `true` keeps a copy in the mailbox's Sent Items. Defaults to false. |

The first four are required. Set only three and the server falls back to logging, and
`/healthz` reports which one is missing.

**Setting up the app registration**

1. Entra admin center → **App registrations** → **New registration**. Name it anything, single
   tenant, no redirect URI needed. This is a daemon app, not a sign-in app.
2. **Certificates & secrets** → **New client secret**. Copy the **Value** immediately.
   Note the expiry date (see below).
3. **API permissions** → **Add a permission** → **Microsoft Graph** → **Application
   permissions** → `Mail.Send`. Not Delegated: there is no signed-in user here.
4. **Grant admin consent** on that same page. Adding the permission is not enough on its own,
   and forgetting this is the most common cause of a 403 later.
5. Make sure `GRAPH_SENDER` is a real mailbox. A **shared mailbox** is a good choice for a
   no-reply sender: it works with Graph and needs no license.

**Restrict which mailbox the app can send as**

`Mail.Send` as an application permission lets the app send as *any* mailbox in the tenant.
Scope it to the one sender:

```powershell
# Exchange Online PowerShell, once
New-ApplicationAccessPolicy -AppId <GRAPH_CLIENT_ID> `
  -PolicyScopeGroupId login@satlockin.com `
  -AccessRight RestrictAccess `
  -Description "SAT LockIn sign-in codes only"
```

**🔑 The client secret expires.** Microsoft caps how long a client secret can last, and the
day it lapses, sign-in emails stop. Put the expiry date in your calendar, create a new secret
before then, update `GRAPH_CLIENT_SECRET` on Render, and redeploy.

To make sure it never catches you out, also set `GRAPH_SECRET_EXPIRES` to the expiry date shown
next to the secret in the app registration, as `YYYY-MM-DD`. The server then:

- warns in the log at startup and once a day when the secret is 30 days or less from expiring,
  and every day after it has expired;
- warns if `GRAPH_SECRET_EXPIRES` is missing, since then nothing can warn you;
- reports the days left as `mailSecretExpiresInDays` on `/healthz`, which an uptime monitor can
  watch.

When you rotate: create the new secret first, update both `GRAPH_CLIENT_SECRET` and
`GRAPH_SECRET_EXPIRES`, redeploy, send yourself a code with `npm run mailtest` from the Render
Shell, and only then delete the old secret in the app registration.

**Testing it without going through the sign-in screen**

```bash
npm run mailtest you@yourdomain.com
```

It prints which provider is active, which variables are set, and either confirms delivery or
gives you the specific reason: a wrong or expired client secret, a missing tenant, a missing
`Mail.Send` consent, a sender mailbox that does not exist, or a Conditional Access policy
blocking the app. To test the deployed server, open the service's **Shell** tab on Render and
run `npm run mailtest you@yourdomain.com` there.

#### Option B: Resend

| Variable | What it is |
|---|---|
| `RESEND_API_KEY` | An API key from resend.com. |
| `MAIL_FROM` | Sender, for example `SAT LockIn <login@satlockin.com>`. |

A Resend key does not expire, but it is a stored secret: anyone who gets it can send mail as
you, so revoke it in Resend if it ever leaks.

The default sender, `onboarding@resend.dev`, is Resend's shared test address and only delivers
to the address that owns the Resend account. It works when you test on yourself and silently
fails to reach anyone else, so verify your domain in Resend before launch.

#### Both options

`APP_NAME` sets the name in the subject line and body. `CODES_PER_HOUR` caps how many codes
one address can request per hour, defaulting to 8.

`DATABASE_URL` is a prerequisite either way. Sign-in writes to the database, so with no
database the sign-in endpoints answer "Accounts are switched off on this server".

### Abuse and cost limits, already in place

`/api/auth/request` is public, because it has to be for anyone to sign up. Two limits stop it
becoming a way to spend your mail quota:

- One code per address per 45 seconds
- Eight codes per address per hour, tunable with `CODES_PER_HOUR`

Codes are stored only as hashes, expire after 20 minutes, are single use, and lock out after
6 wrong guesses.

### 2.4 What the database holds

| Table | Contents |
|---|---|
| `users` | email and display name |
| `sessions` | a hash of each sign-in token, never the token |
| `login_codes` | a hash of the current sign-in code, with an expiry |
| `events` | answer history: each pasted Bluebook miss, with its move and trap, plus answers from older versions of the app |
| `attempts` | practice-set results from older versions of the app |
| `naming_reps` | one row per "name the move" answer: which question, the move it wanted, the move named, and the Daily LockIn date if it was that day's question |
| `ai_usage` | a per-student daily counter, so nobody can run up the AI bill |
| `coach_plans` | each session the coach prepared: the day, the eight questions and their moves, the line, any pool questions it uses, and which model wrote it |
| `pool_questions` | questions the AI wrote and a separate AI pass checked, shared by every student: the move, the question, and the checker's verdict |
| `pool_usage` | a per-day count of questions the writer attempted, accepted, and rejected, server-wide |
| `purchases` | one row per payment: the provider's payment id, the email, the account if known, the amount, and a refund date |

The database also still has the `classes` and `generated_questions` tables and some class
columns on `users`, kept for old data. Nothing uses them.

Access is enforced by the server, and every query is scoped to the signed-in student. A student
can read and write only their own rows. There is no cross-student read.

To delete a student entirely, delete their row from `users`. Everything else cascades.

## Part 3: The AI (optional)

### Why this needs a server, and why there is no key

Calling Claude needs a credential, and anything in browser JavaScript is readable by anyone who
opens developer tools. So the server makes the calls, after checking the student is signed in,
has paid (once payments are on), and is under their daily cap.

The server does not hold an Anthropic API key either. It signs in with **workload identity
federation (OIDC)**: Render gives the service a short-lived signed token and rotates it, and the
server trades that for a short-lived Anthropic token. There is no long-lived secret to leak or
rotate. This needs the Anthropic SDK 1.13.0 or later, which `package.json` already asks for.

### 3.1 🔑 Turn on OIDC in Render

- Your Render workspace must be on **Pro or higher**, and only a workspace **admin** can do this
  setup.
- Find your **workspace ID** at the top of the workspace **Settings** page. It starts with
  `tea-`. Your issuer URL is `https://oidc.render.com/<workspace ID>`.
- Each token's subject (`sub`) is built from the workspace ID (`tea-...`), the environment ID
  (`evm-...`, or `default` if the service is not in an environment) and the service ID
  (`srv-...`). **Copy the exact subject format from Render's OIDC docs page**; you need it in
  3.2.

### 3.2 🔑 Set up Anthropic (Claude Console, Admin role)

The **Connect workload** wizard on the **Workload identity** page creates the issuer, the
service account and the rule in one flow. These are the same steps by hand:

1. **Settings > Service accounts:** create a service account with the **Developer** role, and
   add it to the workspace the app should use.
2. **Workload identity federation > Issuers:** add a **Custom OIDC** issuer.
   - Issuer URL: `https://oidc.render.com/<workspace ID>`
   - JWKS source: **OIDC Discovery**
3. **Rules:** create a rule.
   - Subject pattern: match this Render service. A prefix ending in `*` is allowed.
   - Expected audience: `api.anthropic.com`
   - Token lifetime: at least 30 minutes
   - Target: the service account from step 1
   - Scope: choose **`workspace:inference`**. It allows only Messages and Models, which is all
     this app uses. (The default, `workspace:developer`, allows more than it needs.)
4. Copy four IDs for the next step: the rule (`fdrl_...`), the organization (a UUID), the
   service account (`svac_...`) and the workspace (`wrkspc_...`).

### 3.3 🔑 Give the IDs to Render

1. In the web service, open **Environment** and set:

   | Variable | Value |
   |---|---|
   | `ANTHROPIC_FEDERATION_RULE_ID` | `fdrl_...` |
   | `ANTHROPIC_ORGANIZATION_ID` | the organization UUID |
   | `ANTHROPIC_SERVICE_ACCOUNT_ID` | `svac_...` |
   | `ANTHROPIC_WORKSPACE_ID` | `wrkspc_...` |

2. **Do not set `ANTHROPIC_IDENTITY_TOKEN_FILE`.** Render sets it itself and rotates the
   token.
3. If `ANTHROPIC_API_KEY` is on the service from an older setup, delete it. The server ignores
   it whenever federation is set up and logs a warning. Then revoke any old keys in the
   Console.
4. Redeploy.

### 3.4 Check it works

- The deploy log shows `ai check: ok (oidc)` at startup. `ai check: FAILED (oidc)` means the
  sign-in was refused (see *Troubleshooting*).
- `/healthz` reports `"aiAuth": "oidc"`, `"tutor": true`, and `"coach": true` when the
  database is attached too.
- To see the token itself, open the service's **Shell** tab and run
  `cat $ANTHROPIC_IDENTITY_TOKEN_FILE`. It should print a token.

Every federation failure shows only **"Authentication failed"**. The real reason is in the
Console's **authentication history**.

If federation is half set up, the AI stays **off**. It never falls back to an API key.

Render's OIDC is not available at build time for Docker-built services. That does not affect
this app: it is a native Node service and only uses the AI at runtime.

**Local development** is the one place `ANTHROPIC_API_KEY` is still used: put a key in your
own `.env` and leave the federation variables out. Never put a key on the Render service.

### 3.5 Optional settings

| Variable | Default | What it does |
|---|---|---|
| `AI_DAILY_LIMIT` | `40` | Per-student cap on AI requests per day, counted in Postgres. Each prepared coach session costs one. |
| `ALLOW_ANON_TUTOR` | off | Lets the pasted-question analysis run with no database. Local use only: on a public site this lets anyone who finds the URL spend your credit |
| `ANON_DAILY_BUDGET` | `60` | Total daily ceiling when running without accounts |
| `POOL_DAILY_LIMIT` | `30` | Questions the writer may attempt per day across the whole server (about ten batches of three). `0` turns writing off |
| `POOL_MAX_PER_MOVE` | `40` | Stop writing for a move once the pool holds this many |
| `WRITER_MODEL` | `claude-opus-5-5` | Writes new questions |
| `VERIFIER_MODEL` | `claude-sonnet-5-5` | Checks each new question blind |

Never set `NODE_ENV=test` in production: it turns on a test-only endpoint.

### What the AI does

| Feature | Where | Model |
|---|---|---|
| The coach: picks the moves for each session of eight questions | behind the scenes, when the student presses Start | `claude-sonnet-5-5` |
| Naming the move and the trap in a pasted question | **Missed one in Bluebook?** | `claude-sonnet-5-5` |
| Writing new questions for a move that is running low | behind the scenes, after a session is prepared | `claude-opus-5-5` |
| Checking each new question blind before anyone sees it | behind the scenes | `claude-sonnet-5-5` |

The pasted-question model is set in `js/config.js` under `aiModels.analyze`. The server accepts
only `claude-sonnet-5-5` or `claude-opus-5-5` there. The coach's model is fixed on the server.

**How the coach works.** It is a short tool loop in `lib/coach.js`. Claude gets the catalog in
a system prompt that is identical for every student (so it caches across all of them) and three
read-only tools over that one student's synced rows. It looks at what it needs, then calls
`prepare_session` with the moves for the eight questions. The server checks every move against
the catalog; a bad submission goes back to Claude as an error to fix. Then the server picks
questions the student has not seen for each move, from the fixed bank and the shared pool,
and saves the session in `coach_plans`.

Misses pasted from an official Bluebook practice test count most. They appear in the coach's
overview by move and by trap, and when the server fills out a session it reaches for moves
missed on Bluebook first.

**How new questions are written.** After a session is prepared, the server checks each of its
moves: if this student has fewer than two unseen questions left for one, it asks the writer
for three more, in the background, so the student never waits. Each question first passes a
structural check in code (four distinct choices, a trap named for every wrong answer, worked
steps, no figures). Then a separate model solves it blind, seeing only the passage, the
question, the choices, and four candidate moves. It passes only if the checker picks the keyed
answer and the intended move, with high confidence and no problems. Every text field is
sanitized to a handful of formatting tags before it is stored. Look for `[pool]` lines in the
logs: each accepted question and each rejection with its reason.

The student never sees any of this. The app fetches today's prepared session
(`/api/coach/today`) on the first visit of the day, preparing one if there is none yet. When a student
starts a session, the app asks for the next one in the background (`/api/coach/prepare`), so
"Practice more" is ready by the time they finish. At most three a day. If the coach is not
ready or not configured, the app builds the round itself from the student's record, so Start
never waits.

`/api/tutor` now does one thing, `analyze`, the pasted question. Anything else is refused.

Guardrails already in place:

- Once payments are on, the AI is for buyers only, enforced by the server (a 402 for anyone
  else, and the model is never called).
- Per-student daily cap, counted in the database. A coach session counts as one request, and
  there are at most three a day.
- A failed model call gives back what it claimed, so an outage never eats a student's allowance.
- Pasted text is passed as data, not as instructions, so "ignore your instructions" gets
  nowhere useful.

---

## Part 4: Taking payments (optional)

One payment of $14.99 unlocks everything. Card details never touch this server: Stripe takes
the money, then calls a webhook to tell the server who paid. That signed call is the only thing
that can mark an account as paid.

**How a student buys:** they tap Unlock, enter their email, and type the 6-digit code they get.
Then they are sent to your Stripe Payment Link, which carries their account id
(`client_reference_id`) and email (`prefilled_email`), so the payment lands on their account
even if they type a different email at checkout. After paying, Stripe sends them back to the
app, which confirms the purchase with the server and shows **You are all set**.

1. 🔑 In Stripe, create a **Payment Link** for one payment of $14.99.
2. 🔑 In that Payment Link's settings, under **After payment**, choose to redirect to your site
   and enter `https://<site>/?paid=1`, for example `https://satlockin.com/?paid=1`.
   **The `?paid=1` matters.** It is what tells the app to confirm the purchase and show "You
   are all set". Without it, the student lands on the home screen with no confirmation.
3. Put the link in `js/config.js` as `checkoutUrl`. Keep `price` matching what the link
   charges; it is display text only.
4. 🔑 In Stripe → Developers → Webhooks, add an endpoint at
   `https://<your-render-url-or-domain>/api/billing/webhook` (for example
   `https://satlockin.com/api/billing/webhook`) listening for
   `checkout.session.completed`, `checkout.session.async_payment_succeeded` and
   `charge.refunded`. Copy its **signing secret**.
5. Set `STRIPE_WEBHOOK_SECRET` to that secret in the Render service's **Environment** tab and redeploy. `/healthz`
   then reports `"payments": true`.
6. Optional: set `COMP_EMAILS` to addresses that get access without paying, such as your own.
   Comma separated.

A full refund ends access; a partial one keeps it. Someone who pays without being signed in is
matched by email when they sign in with the address on their receipt. On a new device,
**Already bought it? Sign in** on the home screen gets a buyer back in.

What changes once `STRIPE_WEBHOOK_SECRET` is set:

- **The lock switches on.** Daily LockIn stays free, with no account. Today's session,
  Practice more, practicing a move, and pasting a question need the purchase. Until then, and
  in a copy opened from disk, everything is open. The lock on rounds is in the browser, so it
  is honest rather than unbreakable; the AI is enforced by the server.
- **Sign-in codes must be emailed.** Writing them to the log is fine while you test alone, but
  a buyer who cannot get a code cannot reach what they paid for, so the server refuses instead.
  Set up mail (2.3) first. `LOG_SIGNIN_CODES=true` overrides this on a staging copy.

---

## Costs

| Item | Cost |
|---|---|
| Domain | ~$12/year 🔑 |
| Render workspace | **Pro or higher**, needed for the AI's OIDC sign-in. 🔑 |
| Render web service | The instance type you pick for `sat-lockin`. 🔑 |
| Render Postgres | The `basic-256mb` plan in `render.yaml`. Tiny for this data. 🔑 |
| Static hosting instead (Cloudflare Pages / Netlify / GitHub Pages) | Free |
| Resend for sign-in emails | Has a free tier |
| The AI | Anthropic API usage on Sonnet. A coach session is a few cents (three to five short calls, most of the prompt read from cache), at most three per student per day. A pasted question is one call. `AI_DAILY_LIMIT` caps each student's total. |
| Question writing | Shared across all students, not per student. Each batch is one Opus call writing three questions plus one Sonnet check per question; check the real cost per batch in the Anthropic console after launch. `POOL_DAILY_LIMIT` (30 questions a day by default) caps the whole server, and writing only happens when a move runs low, so it slows down as the pool fills. |

For current Render prices, see Render's pricing page. Set a monthly spend limit in the
Anthropic console if you want a hard ceiling.

---

## Turning things off

Each layer is independent, and removing one leaves the rest working.

- **AI only:** remove `ANTHROPIC_FEDERATION_RULE_ID` and `ANTHROPIC_ORGANIZATION_ID`, and
  redeploy. The coach stops, and the app builds every round
  itself. Pasting a question says the AI is not switched on.
- **Question writing only:** set `POOL_DAILY_LIMIT=0`. Questions already in the pool keep
  being served.
- **Payments only:** remove `STRIPE_WEBHOOK_SECRET`. Everything is open again.
- **Accounts and sync:** remove `DATABASE_URL` from the service. The app returns to
  single-device mode with no sign-in, and nothing is lost on the device, because local storage
  was always the source of truth.
- **Everything:** the folder still works by opening `index.html`. That is the app's normal
  offline mode, not a degraded one.
- **Deleting a student's data:** delete their row from `users` in Postgres (see 2.2 for
  running SQL by hand). Every related row goes with it by cascade.

---

## Troubleshooting

**"Could not send the code."** The mail provider is missing or misconfigured. Run
`npm run mailtest` and check `/healthz`. Without payments on, the code is written to the
service's log on Render instead, which is enough for testing on your own.

**Sign-in works but nothing syncs.** Check `/healthz` reports `"accounts": true` and
`"database": "connected"`. If not, check `DATABASE_URL` on the service (2.1) and the deploy log.

**Pasting a question says the AI is not switched on.** Federation is not set up, or is only
half set up. Check the deploy log and do Part 3.

**The log says federation is incomplete and `ANTHROPIC_IDENTITY_TOKEN_FILE` is missing.**
Render has not given the service a token. Either the workspace is not on Pro or higher, or the
service was not redeployed after the variables were added. Fix that and redeploy.

**`ai check: FAILED (oidc)` in the deploy log.** Anthropic refused the token. Check the rule's
subject pattern matches this service and its audience is `api.anthropic.com`, make sure
`ANTHROPIC_WORKSPACE_ID` is set, and read the reason in the Console's authentication history.

**A student's data is missing.** They probably practiced without signing in. Their work is in
that browser's local storage; signing in on the same browser uploads it on the next sync.

**Someone paid but the app says not purchased.** Check the webhook's recent deliveries in
Stripe. A 400 means `STRIPE_WEBHOOK_SECRET` does not match that endpoint's signing secret; a
404 means it is not set on the server. If they paid with a different email and were not signed
in, ask them to sign in with the email on their receipt.

**After paying, the student landed on the home screen with no "You are all set".** The Payment
Link's *After payment* redirect is missing `?paid=1` (Part 4, step 2). Their purchase still
counts once the webhook arrives.

**The app is on another host and every call fails with a CORS error.** Set
`ALLOWED_ORIGINS` on the server to that host, for example `https://satlockin.com`.
