/* ============================================================
   SAT LockIn configuration

   You can leave this file completely alone.

   The app asks the server what it supports when it starts, so accounts and
   the AI switch themselves on when the server has a database and an
   API key. Open index.html straight from disk and there is no server, so it
   runs as offline single-student practice.

   Everything below is for unusual setups.
   ============================================================ */
window.CONFIG = {

  /* Where the API lives. Empty means "same place the page came from", which
     is what you want when server.js serves the app. Set a full origin only
     if you host the app somewhere else, for example a static host in front
     of a Render API:
       apiUrl: 'https://sat-lockin.onrender.com'
     and then list the static host on the server, or the browser will block
     the calls: ALLOWED_ORIGINS=https://satlockin.com  */
  apiUrl: '',

  /* Path to the tutor endpoint. Only change this if you moved it. */
  tutorUrl: '/api/tutor',

  /* Which model reads a pasted Bluebook question. The coach runs on the
     server and picks its own model. */
  aiModels: {
    analyze: 'claude-sonnet-5-5'
  },

  /* Only for running the tutor on your own machine with no database, which
     needs ALLOW_ANON_TUTOR=true on the server as well. Never on a public site. */
  allowAnonTutor: false,

  /* ---------- what it costs ----------
     One payment, no subscription. `price` is display text only, so it has to
     match whatever the payment link actually charges.

     `checkoutUrl` is where the buy button goes: a Stripe Payment Link, a Gumroad
     or Lemon Squeezy URL, anything that takes the money and emails a receipt.
     Leave it empty and the button says checkout is not connected yet rather
     than pretending to take a payment. This app never touches card details,
     which is the whole reason for handing off to a hosted checkout. */
  price: '$9.99',
  checkoutUrl: '',

  /* The last free day of the launch, as 'YYYY-MM-DD'. While payments are off
     and this date is still ahead, the landing page shows the price struck
     through: "$9.99 Free, free until <date>". Leave it empty and the page
     says "Free during launch, then $9.99" with no strikethrough.

     Keep it honest: a struck-through price says "this is what it costs", so
     only set a date you will actually start charging on, and switch payments
     on (STRIPE_WEBHOOK_SECRET plus checkoutUrl) by then. Once the date has
     passed the strikethrough disappears on its own. */
  launchFreeUntil: ''
};
