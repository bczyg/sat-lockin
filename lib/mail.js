/* ============================================================
   Sending the sign-in code.

   Three providers, chosen automatically by which variables are set:

     1. Microsoft Graph, when GRAPH_* are set. Sends as a mailbox in your
        Microsoft 365 tenant using an Entra app registration.
     2. Resend, when RESEND_API_KEY is set.
     3. Neither, in which case the code is written to the server log. That
        is genuinely useful for testing, and useless in production.

   No SDK for either provider. Graph is a token call plus a sendMail call,
   and the Azure identity libraries pull in a large dependency tree to save
   about twenty lines.
   ============================================================ */

const APP_NAME = process.env.APP_NAME || 'SAT LockIn';

/* ---------------- Microsoft Graph ---------------- */
const GRAPH = {
  tenant: process.env.GRAPH_TENANT_ID || '',
  clientId: process.env.GRAPH_CLIENT_ID || '',
  secret: process.env.GRAPH_CLIENT_SECRET || '',
  sender: process.env.GRAPH_SENDER || '',
  saveToSent: process.env.GRAPH_SAVE_TO_SENT === 'true',
  /* The client secret's expiry date, as YYYY-MM-DD, copied from the app
     registration when the secret is created. Microsoft makes every client
     secret expire; this is how the server warns before it does. */
  secretExpires: process.env.GRAPH_SECRET_EXPIRES || ''
};

/* Days until the Graph secret expires, or null when no date is recorded. */
export function secretDaysLeft(now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(GRAPH.secretExpires)) return null;
  const end = new Date(GRAPH.secretExpires + 'T00:00:00Z');
  if (Number.isNaN(end.getTime())) return null;
  return Math.floor((end - now) / 86400000);
}
export const SECRET_WARN_DAYS = 30;

function graphConfigured() {
  return !!(GRAPH.tenant && GRAPH.clientId && GRAPH.secret && GRAPH.sender);
}

/* Tokens last about an hour. Cache one and renew a minute before it lapses,
   rather than paying for a token call on every sign-in. */
let cachedToken = null;

async function graphToken() {
  if (cachedToken && cachedToken.expiresAt - Date.now() > 60000) return cachedToken.value;

  const body = new URLSearchParams({
    client_id: GRAPH.clientId,
    client_secret: GRAPH.secret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials'
  });

  let r, d;
  try {
    r = await fetch(
      `https://login.microsoftonline.com/${encodeURIComponent(GRAPH.tenant)}/oauth2/v2.0/token`,
      { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body }
    );
    d = await r.json().catch(() => ({}));
  } catch (e) {
    throw Object.assign(new Error('Could not reach Microsoft to get a token.'), { status: 502 });
  }

  if (!r.ok || !d.access_token) {
    const desc = String(d.error_description || d.error || '').slice(0, 400);
    /* The AADSTS codes are the useful part, so surface them rather than a
       generic failure. These are the three that account for most of them. */
    let hint = '';
    if (desc.includes('AADSTS7000215')) {
      hint = 'The client secret is wrong. Check GRAPH_CLIENT_SECRET, and note the portal shows the secret VALUE only once, at creation. The Secret ID is not the secret.';
    } else if (desc.includes('AADSTS7000222') || desc.includes('AADSTS7000112')) {
      hint = 'The client secret has expired. Create a new one in the app registration and update GRAPH_CLIENT_SECRET.';
    } else if (desc.includes('AADSTS700016') || d.error === 'unauthorized_client') {
      hint = 'That app registration was not found in that tenant. Check GRAPH_CLIENT_ID and GRAPH_TENANT_ID.';
    } else if (desc.includes('AADSTS90002') || desc.includes('AADSTS900023')) {
      hint = 'That tenant does not exist. Check GRAPH_TENANT_ID, which should be the Directory (tenant) ID GUID.';
    } else if (desc.includes('AADSTS53003')) {
      hint = 'A Conditional Access policy is blocking this app. An admin needs to exclude this service principal from the policy, since client credentials cannot satisfy an MFA or device requirement.';
    } else if (desc.includes('AADSTS501051') || desc.includes('AADSTS650057')) {
      hint = 'The app is not authorised for the Microsoft Graph resource. Check the API permissions on the app registration.';
    } else if (desc.includes('expired')) {
      hint = 'The client secret has expired. Create a new one in the portal.';
    }
    console.error('[mail] graph token failed:', desc);
    throw Object.assign(
      new Error(`Microsoft rejected the app credentials.${hint ? ' ' + hint : ''}`),
      { status: 502 }
    );
  }

  cachedToken = { value: d.access_token, expiresAt: Date.now() + (Number(d.expires_in) || 3600) * 1000 };
  return cachedToken.value;
}

async function sendViaGraph(to, subject, text, html) {
  const token = await graphToken();
  const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(GRAPH.sender)}/sendMail`;

  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        subject,
        body: { contentType: 'HTML', content: html },
        toRecipients: [{ emailAddress: { address: to } }]
      },
      saveToSentItems: GRAPH.saveToSent
    })
  });

  if (r.status === 202) return { delivered: true, via: 'graph' };

  const detail = await r.text().catch(() => '');
  let code = '';
  try { code = JSON.parse(detail)?.error?.code || ''; } catch { /* not JSON */ }
  console.error('[mail] graph sendMail failed', r.status, code, detail.slice(0, 300));

  let hint = '';
  if (r.status === 403 || code === 'ErrorAccessDenied') {
    hint = 'The app is missing the Mail.Send application permission, or nobody has granted admin consent for it. Both are needed.';
  } else if (r.status === 404 || code === 'ResourceNotFound') {
    hint = `No mailbox found for GRAPH_SENDER (${GRAPH.sender}). It must be a real, licensed mailbox in the tenant.`;
  } else if (code === 'MailboxNotEnabledForRESTAPI') {
    hint = 'That mailbox is not available to the Graph API. It is usually an unlicensed account or an on-premises mailbox.';
  } else if (r.status === 401) {
    cachedToken = null;
    hint = 'The token was rejected. It has been cleared, so the next attempt will fetch a fresh one.';
  } else if (r.status === 429) {
    hint = 'Microsoft is throttling the sender. Wait and try again.';
  }

  throw Object.assign(
    new Error(`Microsoft would not send the email.${hint ? ' ' + hint : ''}`),
    { status: 502 }
  );
}

/* ---------------- Resend ---------------- */
const RESEND_KEY = process.env.RESEND_API_KEY || '';
const RESEND_FROM = process.env.MAIL_FROM || `${APP_NAME} <onboarding@resend.dev>`;

async function sendViaResend(to, subject, text, html) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: RESEND_FROM, to: [to], subject, text, html })
  });
  if (!r.ok) {
    const detail = await r.text().catch(() => '');
    console.error('[mail] resend failed', r.status, detail.slice(0, 300));
    throw Object.assign(new Error('Could not send the email. Check the mail settings.'), { status: 502 });
  }
  return { delivered: true, via: 'resend' };
}

/* ---------------- what is configured ---------------- */
export function provider() {
  if (graphConfigured()) return 'graph';
  if (RESEND_KEY) return 'resend';
  return 'log';
}

export function configured() {
  return provider() !== 'log';
}

/* Reported by /healthz so a misconfiguration is visible without signing in. */
export function status() {
  const p = provider();
  const out = { provider: p, configured: p !== 'log' };
  if (p === 'graph') {
    out.sender = GRAPH.sender;
    out.tenantSet = !!GRAPH.tenant;
    out.clientSet = !!GRAPH.clientId;
    out.secretSet = !!GRAPH.secret;
    const left = secretDaysLeft();
    out.secretExpiresInDays = left;
    if (left === null) {
      out.warning = 'GRAPH_SECRET_EXPIRES is not set, so nothing will warn before the client secret ' +
        'expires and sign-in emails stop. Set it to the expiry date shown in the app registration (YYYY-MM-DD).';
    } else if (left < 0) {
      out.warning = `The Graph client secret expired ${-left} day(s) ago. Sign-in emails are failing. ` +
        'Create a new secret, update GRAPH_CLIENT_SECRET and GRAPH_SECRET_EXPIRES, and redeploy.';
    } else if (left <= SECRET_WARN_DAYS) {
      out.warning = `The Graph client secret expires in ${left} day(s). Create a new one now, update ` +
        'GRAPH_CLIENT_SECRET and GRAPH_SECRET_EXPIRES, and redeploy.';
    }
  } else if (p === 'graph-partial') {
    out.note = 'some GRAPH_ variables are set but not all four';
  }
  /* Flag a half-finished Graph setup, which otherwise silently falls back. */
  const anyGraph = GRAPH.tenant || GRAPH.clientId || GRAPH.secret || GRAPH.sender;
  if (anyGraph && !graphConfigured()) {
    out.warning = 'GRAPH_ variables are partly set. All four of GRAPH_TENANT_ID, ' +
      'GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET and GRAPH_SENDER are required, so Graph is not being used.';
    out.missing = [
      !GRAPH.tenant && 'GRAPH_TENANT_ID',
      !GRAPH.clientId && 'GRAPH_CLIENT_ID',
      !GRAPH.secret && 'GRAPH_CLIENT_SECRET',
      !GRAPH.sender && 'GRAPH_SENDER'
    ].filter(Boolean);
  }
  return out;
}

/* ---------------- the message ----------------
   Branded to match the app: the logo mark and the two-tone wordmark, the
   brand purple, and the warm page color. Email clients ignore stylesheets
   and webfonts, so it is a table layout with inline styles and system
   fonts. The logo is the hosted home screen icon (Gmail and Outlook drop
   SVG); if images are blocked, the text wordmark still carries the brand. */
const SITE = (process.env.APP_URL || 'https://satlockin.com').replace(/\/+$/, '');
const C = { bg: '#f7f4ee', card: '#ffffff', ink: '#17152b', ink2: '#47445d', ink3: '#625f78',
  line: '#e6e0d5', brand: '#4b3bdb', soft: '#ecebff', softLine: '#cdc8ff' };
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const WORDMARK = (() => {
  const [a, b] = APP_NAME.split(/ (.+)/);
  return b ? `${a} <span style="color:${C.brand}">${b}</span>` : APP_NAME;
})();

export function codeEmail(code) {
  const host = SITE.replace(/^https?:\/\//, '');
  const subject = `${code} is your ${APP_NAME} sign-in code`;
  const text =
    `${APP_NAME}\n\n` +
    `Your sign-in code is ${code}\n\n` +
    `Type it into the app to sign in. It expires in 20 minutes.\n\n` +
    `If you did not ask for this, you can ignore this email.\n\n` +
    `${SITE}\n`;
  const html =
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<meta name="color-scheme" content="light"><title>${subject}</title></head>` +
    `<body style="margin:0;padding:0;background:${C.bg}">` +
    /* the preview line inbox lists show next to the subject */
    `<div style="display:none;max-height:0;overflow:hidden;opacity:0">Your code expires in 20 minutes.</div>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.bg}" style="background:${C.bg}">` +
    `<tr><td align="center" style="padding:32px 16px">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:460px;font-family:${FONT}">` +

    /* header: logo and wordmark */
    `<tr><td style="padding:0 4px 18px"><a href="${SITE}" style="text-decoration:none;color:${C.ink}">` +
    `<img src="${SITE}/assets/apple-touch-icon.png" width="36" height="36" alt="" ` +
    `style="display:inline-block;vertical-align:middle;border:0;border-radius:10px">` +
    `<span style="display:inline-block;vertical-align:middle;margin-left:10px;font-size:22px;font-weight:800;letter-spacing:-.02em;color:${C.ink}">${WORDMARK}</span>` +
    `</a></td></tr>` +

    /* card */
    `<tr><td bgcolor="${C.card}" style="background:${C.card};border:1px solid ${C.line};border-radius:16px;padding:28px 26px">` +
    `<h1 style="margin:0 0 8px;font-size:22px;line-height:1.25;font-weight:800;color:${C.ink}">Your sign-in code</h1>` +
    `<p style="margin:0 0 22px;font-size:15px;line-height:1.5;color:${C.ink2}">Type this code into ${APP_NAME} to sign in.</p>` +
    `<div style="background:${C.soft};border:1px solid ${C.softLine};border-radius:12px;padding:18px 8px;text-align:center;` +
    `font-size:36px;font-weight:800;letter-spacing:.3em;color:${C.brand};font-family:${FONT}">${code}</div>` +
    `<p style="margin:22px 0 24px;font-size:14px;line-height:1.5;color:${C.ink3}">It expires in 20 minutes. If you did not ask for this, you can ignore this email.</p>` +
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>` +
    `<td bgcolor="${C.brand}" style="background:${C.brand};border-radius:12px">` +
    `<a href="${SITE}" style="display:inline-block;padding:13px 22px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none">Open ${APP_NAME}</a>` +
    `</td></tr></table>` +
    `</td></tr>` +

    /* footer */
    `<tr><td style="padding:18px 4px 0;font-size:12px;line-height:1.6;color:${C.ink3}">` +
    `<b style="color:${C.ink2}">Spot the move. Then solve it.</b><br>` +
    `You got this email because someone entered this address to sign in at ` +
    `<a href="${SITE}" style="color:${C.brand};text-decoration:none">${host}</a>.` +
    `</td></tr>` +

    `</table></td></tr></table></body></html>`;
  return { subject, text, html };
}

export async function sendCode(email, code) {
  const { subject, text, html } = codeEmail(code);

  const p = provider();
  if (p === 'graph') return sendViaGraph(email, subject, text, html);
  if (p === 'resend') return sendViaResend(email, subject, text, html);

  console.log(`[mail] no mail provider configured. Code for ${email} is ${code}`);
  return { delivered: false, reason: 'no-provider' };
}
