#!/usr/bin/env node
/* ============================================================
   Send one test email, and say clearly what happened.

   Diagnosing mail through the sign-in screen is slow, because a failure
   there could be the database, the rate limit, or the mail provider. This
   exercises only the mail path.

     node scripts/mailtest.js you@example.com

   Reads the same variables the server does, so run it with the same
   environment. On Railway: railway run node scripts/mailtest.js you@work.com
   ============================================================ */
import * as mail from '../lib/mail.js';

const to = process.argv[2];
if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to)) {
  console.error('\nUsage: node scripts/mailtest.js you@example.com\n');
  process.exit(1);
}

const st = mail.status();
console.log('\nMail configuration');
console.log(`  provider:   ${st.provider}`);
if (st.provider === 'graph') {
  console.log(`  sending as: ${st.sender}`);
  console.log(`  tenant id:  ${st.tenantSet ? 'set' : 'MISSING'}`);
  console.log(`  client id:  ${st.clientSet ? 'set' : 'MISSING'}`);
  console.log(`  secret:     ${st.secretSet ? 'set' : 'MISSING'}`);
}
if (st.warning) {
  console.log(`\n  WARNING: ${st.warning}`);
  console.log(`  missing: ${(st.missing || []).join(', ')}`);
}
if (st.provider === 'log') {
  console.log('\nNo provider is configured, so nothing will be sent. Set the GRAPH_ variables');
  console.log('(or RESEND_API_KEY) and run this again.\n');
  process.exit(1);
}

const code = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
console.log(`\nSending a test code (${code}) to ${to}`);

try {
  const r = await mail.sendCode(to, code);
  if (r.delivered) {
    console.log(`\nSent via ${r.via}. Check that inbox, and the junk folder.\n`);
  } else {
    console.log('\nNot sent: no provider was configured.\n');
    process.exit(1);
  }
} catch (e) {
  console.error(`\nFailed: ${e.message}\n`);
  process.exit(1);
}
