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
  saveToSent: process.env.GRAPH_SAVE_TO_SENT === 'true'
};

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

/* ---------------- the message ---------------- */
export async function sendCode(email, code) {
  const subject = `${code} is your ${APP_NAME} sign-in code`;
  const text =
    `Your ${APP_NAME} sign-in code is ${code}\n\n` +
    `Type it into the app to sign in. It expires in 20 minutes.\n\n` +
    `If you did not ask for this, you can ignore this email.\n`;
  const html =
    `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:420px">` +
    `<h2 style="margin:0 0 6px">${APP_NAME}</h2>` +
    `<p style="color:#555;margin:0 0 22px">Here is your sign-in code.</p>` +
    `<div style="font-size:34px;font-weight:700;letter-spacing:.28em;` +
    `background:#f4f8fa;border-radius:12px;padding:18px;text-align:center">${code}</div>` +
    `<p style="color:#555;margin:22px 0 0">It expires in 20 minutes. ` +
    `If you did not ask for this, ignore this email.</p></div>`;

  const p = provider();
  if (p === 'graph') return sendViaGraph(email, subject, text, html);
  if (p === 'resend') return sendViaResend(email, subject, text, html);

  console.log(`[mail] no mail provider configured. Code for ${email} is ${code}`);
  return { delivered: false, reason: 'no-provider' };
}
