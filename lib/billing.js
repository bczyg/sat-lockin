/* ============================================================
   Purchases.

   Checkout is a hosted Stripe Payment Link (CONFIG.checkoutUrl), so this
   server never sees a card. Stripe tells us a payment happened by calling
   POST /api/billing/webhook, signed with STRIPE_WEBHOOK_SECRET. That signed
   call is the only thing that can write a purchase.

   Matching a payment to a person: when a signed-in student clicks Buy, the
   app appends their user id as client_reference_id and their email as
   prefilled_email. The user id wins when present; otherwise the email
   Stripe collected is used, so someone can pay first and sign in later
   with the same address.

   No Stripe SDK: verifying the signature is one HMAC, and the SDK would be
   the largest dependency in the project.
   ============================================================ */
import crypto from 'node:crypto';
import { query } from './db.js';

const SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const TOLERANCE_SECONDS = 300;

/* Accounts that have access without paying: you, a teacher you are
   piloting with, a reviewer. Comma separated, case insensitive. */
const COMP = new Set(
  String(process.env.COMP_EMAILS || '')
    .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
);

export function configured() { return !!SECRET; }

export function comped(email) { return COMP.has(String(email || '').toLowerCase()); }

/* Stripe-Signature: t=1700000000,v1=hex,v1=hex. The signed string is
   "<t>.<raw body>". Any v1 may match (Stripe sends several while a secret
   is being rolled). */
export function verifySignature(raw, header, secret = SECRET, now = Date.now()) {
  if (!secret || !header) return false;
  let t = null;
  const sigs = [];
  String(header).split(',').forEach((part) => {
    const i = part.indexOf('=');
    if (i < 0) return;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k === 't') t = v;
    else if (k === 'v1') sigs.push(v);
  });
  if (!t || !/^\d+$/.test(t) || !sigs.length) return false;
  if (Math.abs(now / 1000 - Number(t)) > TOLERANCE_SECONDS) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${t}.${raw}`, 'utf8').digest();
  return sigs.some((s) => {
    if (!/^[0-9a-f]+$/i.test(s) || s.length !== expected.length * 2) return false;
    return crypto.timingSafeEqual(expected, Buffer.from(s, 'hex'));
  });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function recordCheckout(s) {
  /* 'paid' for a card, 'no_payment_required' for a 100% coupon. Anything
     else (a bank transfer still clearing) arrives later as
     checkout.session.async_payment_succeeded. */
  if (s.payment_status !== 'paid' && s.payment_status !== 'no_payment_required') return 'not paid yet';
  const ref = String(s.payment_intent || s.id || '').slice(0, 200);
  if (!ref) return 'no reference';
  const email = s.customer_details?.email || s.customer_email || null;

  let userId = null;
  if (s.client_reference_id && UUID.test(s.client_reference_id)) {
    const hit = await query('select id from users where id = $1', [s.client_reference_id]);
    if (hit.rowCount) userId = s.client_reference_id;
  }
  await query(
    `insert into purchases (ref, provider, email, user_id, amount, currency)
     values ($1, 'stripe', $2, $3, $4, $5)
     on conflict (ref) do nothing`,
    [ref, email ? String(email).toLowerCase().slice(0, 254) : null, userId,
      Number.isFinite(s.amount_total) ? s.amount_total : null, s.currency || null]
  );
  return 'recorded';
}

async function recordRefund(charge) {
  /* A partial refund keeps access; a full one ends it. */
  if (!charge.refunded || !charge.payment_intent) return 'partial refund, access kept';
  await query(
    'update purchases set revoked_at = now() where ref = $1 and revoked_at is null',
    [String(charge.payment_intent)]
  );
  return 'revoked';
}

/* Returns a short note for the log. Unknown event types are acknowledged
   and ignored, so adding an event in the Stripe dashboard never causes
   retries. */
export async function handleEvent(evt) {
  const obj = evt?.data?.object || {};
  switch (evt?.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
      return recordCheckout(obj);
    case 'charge.refunded':
      return recordRefund(obj);
    default:
      return 'ignored';
  }
}
