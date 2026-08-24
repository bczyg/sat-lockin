/* ============================================================
   Sending the sign-in code.

   Resend is used over raw SMTP because it is a single HTTPS call, which
   means no dependency and nothing to configure beyond one key.

   With no mail provider configured the server logs the code instead. That
   is fine for testing on your own machine, and refused in production
   unless you explicitly opt in, because a code you cannot deliver is not
   a login system.
   ============================================================ */
const RESEND_KEY = process.env.RESEND_API_KEY || '';
const FROM = process.env.MAIL_FROM || 'SAT LockIn <onboarding@resend.dev>';
const APP_NAME = process.env.APP_NAME || 'SAT LockIn';

export function configured() {
  return !!RESEND_KEY;
}

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

  if (!RESEND_KEY) {
    console.log(`[mail] no RESEND_API_KEY set. Code for ${email} is ${code}`);
    return { delivered: false, reason: 'no-provider' };
  }

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [email], subject, text, html })
  });
  if (!r.ok) {
    const detail = await r.text().catch(() => '');
    console.error('[mail] resend failed', r.status, detail.slice(0, 300));
    throw Object.assign(new Error('Could not send the email. Check the mail settings.'), { status: 502 });
  }
  return { delivered: true };
}
