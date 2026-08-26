/* ============================================================
   SAT LockIn configuration

   You can leave this file completely alone.

   The app asks the server what it supports when it starts, so accounts and
   the AI tutor switch themselves on when the server has a database and an
   API key. Open index.html straight from disk and there is no server, so it
   runs as offline single-student practice.

   Everything below is for unusual setups.
   ============================================================ */
window.CONFIG = {

  /* Where the API lives. Empty means "same place the page came from", which
     is what you want when server.js serves the app. Set a full origin only
     if you host the app somewhere else, for example a static host in front
     of a Railway API:
       apiUrl: 'https://sat-lockin-production.up.railway.app'  */
  apiUrl: '',

  /* Path to the tutor endpoint. Only change this if you moved it. */
  tutorUrl: '/api/tutor',

  /* Shown on the sign-in screen so students know they are in the right place. */
  className: '',

  /* Which model handles which job. Haiku is fast and cheap for conversation;
     Sonnet does the work that needs real reasoning. Question writing always
     runs on Sonnet or better, whatever is set here, because a weak wrong
     answer makes a worthless question. */
  aiModels: {
    chat:     'claude-haiku-4-5',   // follow-up questions on a problem
    explain:  'claude-haiku-4-5',   // re-explain a step a different way
    coach:    'claude-sonnet-5',    // a coaching note from her own data
    generate: 'claude-sonnet-5',    // writing brand new practice questions
    analyze:  'claude-sonnet-5'     // naming the strategy and trap in a pasted question
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
  price: '$14.99',
  checkoutUrl: ''
};
