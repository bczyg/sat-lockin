/* ============================================================
   Strategy library, math reference sheet, and pacing guidance.
   These are the general moves; each question also carries its own
   strategy note in the question bank.
   ============================================================ */
window.STRATEGIES = {

  pacing: [
    { label:'Reading and Writing module', detail:'27 questions in 32 minutes, about 71 seconds each. Conventions questions should take 30-40 seconds, which buys time for the longer Information and Ideas questions.' },
    { label:'Math module', detail:'22 questions in 35 minutes, about 95 seconds each. The first questions in a module are the easiest; bank time there.' },
    { label:'The two-pass rule', detail:'Never spend more than 2 minutes on one question. Mark it for review, answer everything you can, then come back. There is no penalty for a wrong answer, so no box is ever left empty.' },
    { label:'Adaptive routing', detail:'Module 2 gets harder or easier based on Module 1. Module 1 therefore has outsized influence, treat it as the most important 32 (or 35) minutes of the test.' }
  ],

  groups: [
    {
      title:'Reading and Writing: Information and Ideas',
      items:[
        { name:'Main idea: predict before you look',
          body:'<p>Read the passage, then say the point in your own words <em>before</em> reading any choice. Then find the choice closest to your sentence.</p><ol><li>Wrong answers on main-idea questions are usually true, just too narrow, too broad, or about a detail.</li><li>Distrust any choice with <strong>only, never, all, first, proves</strong>. SAT passages hedge; extreme choices almost never match.</li><li>If two choices look right, one of them covers only half the passage. Pick the one that accounts for the last sentence.</li></ol>' },
        { name:'Command of Evidence: match the exact claim',
          body:'<p>Copy the claim into your head in its own words first. Then require the choice to support <em>that</em> claim.</p><ol><li>Underline the task word: <strong>support</strong> or <strong>weaken</strong>. At least one choice always does the opposite.</li><li>List the assumptions the claim needs. Support props one up; weakening knocks one out.</li><li>When two causes are tangled together, the right evidence separates them by varying one and holding the other fixed.</li></ol>' },
        { name:'Quantitative evidence: compute, do not eyeball',
          body:'<ol><li>Read the axis labels and units first, "in thousands" and "percent of" change everything.</li><li>Claims about a <em>relationship</em> need two data points, and you have to check they move the way the claim says. A relationship can be positive or negative; a single number can never establish either.</li><li>Claims with <strong>most, largest, steepest</strong> require arithmetic on every group before you can choose. Ties are a common trap.</li><li>Check that the choice states data <em>and</em> connects it to the claim. Accurate but irrelevant is the most common wrong answer.</li></ol>' },
        { name:'Inference: one small step, never a leap',
          body:'<ol><li>The answer must follow from the text alone, no outside knowledge, however true.</li><li>Prefer the modest claim. "Suggests X plays a role" beats "proves X is the only cause."</li><li>Ask what each sentence is doing there. In these texts, almost every detail exists to rule out one of the choices.</li><li>Blanks preceded by "therefore" or "suggests that" want the conclusion, not a restatement.</li></ol>' }
      ]
    },
    {
      title:'Reading and Writing: Craft and Structure',
      items:[
        { name:'Words in context: write your own word first',
          body:'<p>Cover the choices. Put your own plain word in the blank or over the underlined word, then match.</p><ol><li>The everyday meaning of a familiar word is usually the trap. The text decides the meaning, not the dictionary.</li><li>Look for a colon, a dash, or a "that is." The text often defines the word for you.</li><li>Use contrast clues: if the sentence says the old view was "fixed," the new one means the opposite of fixed.</li><li>Substitute your choice back into the sentence and read the whole thing. Wrong answers usually break the sentence in a way you can hear.</li></ol>' },
        { name:'Text structure and purpose: answer with a verb',
          body:'<ol><li>Purpose questions ask what the author is <em>doing</em>: describing, correcting, illustrating, conceding, redirecting.</li><li>For "function of the underlined sentence," read the sentence before and after. The function is the bridge between them.</li><li>The first word of the <em>next</em> sentence tells you a great deal. "Yet" or "But" means the underlined sentence was set up to be challenged, or reinterpreted.</li><li>For overall structure, map each sentence in three words, then count the moves. A choice with the wrong number of moves is wrong even if it sounds true.</li></ol>' },
        { name:'Cross-text connections: find the concession',
          body:'<ol><li>Before reading the choices, finish this sentence: "Author 2 thinks author 1 is wrong about ___."</li><li>Note what author 2 explicitly <em>accepts</em>. Any choice attacking that is out immediately.</li><li>Watch for choices that overstate the disagreement ("entirely imaginary," "never mattered"). Scholarly disagreement is usually narrow.</li><li>Hard versions require capturing two objections at once. A choice that captures only one is incomplete.</li></ol>' }
      ]
    },
    {
      title:'Reading and Writing: Expression of Ideas',
      items:[
        { name:'Transitions: name the relationship before you read the choices',
          body:'<p>Cover the choices and decide which of six relationships holds.</p><ol><li><strong>Same direction:</strong> also, moreover, indeed, in addition, similarly.</li><li><strong>Opposite:</strong> however, nevertheless, still, on the other hand, by contrast.</li><li><strong>Concession:</strong> granted, admittedly, to be sure, that said. You give ground, then push back.</li><li><strong>Cause or result:</strong> therefore, consequently, as a result, for this reason.</li><li><strong>Example:</strong> for instance, for example, in particular.</li><li><strong>Restatement:</strong> in other words, that is, put differently.</li></ol><p><strong>The hard distinction</strong> is example against restatement. An example is one case of the claim; a restatement is the same claim in new words. If the second sentence adds a limitation rather than repeating, you want a concession word instead.</p><p><strong>Sequence words</strong> (meanwhile, subsequently, previously, eventually) are a seventh case worth knowing, but check the logic first: a sequence word placed where the logic is a reversal is a standard trap.</p>' },
        { name:'Rhetorical synthesis: the goal is the whole question',
          body:'<p>All the notes are true, so accuracy cannot separate the choices. Only the stated goal can.</p><ol><li>Underline the goal and split it into requirements. "Emphasize a difference" needs both sides plus a contrast word. "Explain why" needs a cause, not a restatement.</li><li>Count the parts. If the goal has two parts joined by "and," a choice satisfying one is wrong.</li><li>"Generalize about all X" requires a claim true of <em>every</em> case. Missing evidence for one case is not evidence.</li><li>Suspect any choice that adds a motive, a cause, or a judgment the notes never state.</li></ol>' }
      ]
    },
    {
      title:'Reading and Writing: Standard English Conventions',
      items:[
        { name:'Boundaries: test each side for a complete sentence',
          body:'<p>Cover the blank and ask whether each side could stand alone.</p><ol><li>Complete + complete: period, semicolon, or comma + and/but/or/so/for/nor/yet. <em>A comma alone is a comma splice.</em></li><li>Complete + list or explanation: colon. Everything before the colon must be a full sentence.</li><li>Punctuation is paired: a dash has to be closed by a dash, and a comma by a comma. Never open with one and close with the other.</li><li>Never split a subject from its verb with a single comma, however long the subject is.</li><li>If list items already contain commas, separate the items with semicolons.</li></ol>' },
        { name:'Form, structure, and sense: the checklist',
          body:'<ol><li><strong>First move, always:</strong> read the four choices down the column and find the one thing they change. That names the rule being tested, so you never have to guess it.</li><li><strong>Agreement:</strong> cross out every "of" phrase and modifier, then match the verb to the bare subject. Collective nouns (colony, team, committee) are singular. Do not strip anything on a modifier question, though, because there the opening phrase is the evidence.</li><li><strong>Inverted sentences:</strong> when the sentence starts with a prepositional phrase, flip it around to find the real subject.</li><li><strong>Tense:</strong> let the time markers decide. The earlier of two past events takes "had" + participle.</li><li><strong>Apostrophes:</strong> ask how many owners, then whether they own anything. Plural owners take the apostrophe after the -s.</li><li><strong>Modifiers:</strong> an opening phrase describes the subject right after the comma. Name that subject and check that it can perform the action.</li><li><strong>Parallelism:</strong> "not only … but also," "either … or," and lists require matching grammatical forms.</li><li><strong>Comparisons:</strong> compare like with like, winters with winters, not winters with records.</li><li><strong>Pronouns:</strong> send every pronoun back to the one noun it replaces and check the number matches. If two nouns could be the antecedent, the pronoun is the error. Its, their, and whose never take an apostrophe.</li><li><strong>Subjunctive:</strong> recommend/require/insist/demand + that → use the base form ("that the bridge <em>be</em> closed").</li></ol>' }
      ]
    },
    {
      title:'Math: universal moves',
      items:[
        { name:'Before you compute',
          body:'<ol><li>Read the last line first. Many mistakes are correct algebra answering the wrong question, x when it asked for x + y.</li><li>Circle exactly what is asked and write the unit next to it.</li><li>Check whether the answer choices let you back-solve or plug in. Testing choices is a real method, not a shortcut.</li><li>On "which expression is equivalent," pick a number like x = 2, evaluate the original and each choice, and keep whichever matches.</li></ol>' },
        { name:'Words into equations',
          body:'<ol><li>Define your variables in writing before setting anything up.</li><li>Two unknowns need two equations, usually one counting things and one counting money, weight, or time.</li><li>"At most" → ≤. "At least" → ≥. "No more than" → ≤.</li><li>Convert units before substituting into a model. If t is in years and the question says 18 months, use 1.5.</li></ol>' },
        { name:'Quadratics and functions',
          body:'<ol><li>Vertex is at x = −b/(2a); substitute back if the question wants the maximum or minimum <em>value</em>.</li><li>Discriminant b² − 4ac: positive → two real solutions, zero → exactly one, negative → none.</li><li>Sum of roots = −b/a, product = c/a. Often you never need the roots themselves.</li><li>Always check radical and rational equations in the original, squaring creates extraneous roots.</li><li>Factor out common coefficients (like −16 in projectile problems) before factoring.</li></ol>' },
        { name:'Data, rates, and percentages',
          body:'<ol><li>Percent change = change ÷ <em>original</em>. Successive percent changes multiply: +20% then −10% is ×1.20×0.90 = ×1.08.</li><li>In a conditional probability, the phrase after "if" sets the denominator.</li><li>Mean uses every value and moves with outliers; median only cares about position.</li><li>Margin of error makes an interval: estimate ± margin. It never makes a value exact.</li><li>In dilutions and mixtures, the amount of solute stays constant while the total volume changes.</li></ol>' },
        { name:'Graph it before you solve it',
          body:'<p>Every math question on the real test has a Desmos graphing calculator built in. This is the highest-leverage habit on the current exam.</p><ol><li><strong>Equations:</strong> enter the left side and the right side as two functions and read the intersection. A radical or rational equation cannot hand you an extraneous root this way, because a false solution is simply not a crossing point.</li><li><strong>Systems:</strong> enter both equations and read the crossing point.</li><li><strong>Inequalities:</strong> type them with the inequality signs and the region shades itself. Then click each candidate point.</li><li><strong>Quadratics:</strong> read the vertex, the zeros, and the minimum straight off the curve instead of computing −b/(2a).</li><li><strong>Equivalence:</strong> graph the original expression and a candidate on top of each other. If they overlap everywhere, they match.</li></ol><p><strong>When not to graph:</strong> if a question is one line of arithmetic, typing it in is slower. And the graph gives you a point, not an answer, so read the question again before you pick: it may want x, or y, or x + y.</p>' },
        { name:'How many solutions',
          body:'<p>Counting solutions is one idea in three disguises. In all three you compare the two sides instead of solving.</p><ol><li><strong>Linear:</strong> expand both sides. Identical means infinitely many solutions. Same variable terms with a different constant means none.</li><li><strong>Systems:</strong> compare the coefficient ratios. Proportional throughout means the same line and infinitely many; proportional in the variables but not the constants means parallel and none.</li><li><strong>Quadratic:</strong> the discriminant b² − 4ac. Positive gives two, zero gives one, negative gives none.</li></ol><p>The two cases differ only in the constant term, so once you find your value, substitute it back and confirm the count is the one you were asked for.</p>' },
        { name:'Geometry and trigonometry',
          body:'<ol><li>Find the radius first, nearly every circle question routes through it.</li><li>Open the reference sheet for areas, volumes, the Pythagorean theorem, and the special right triangles. It does not give you arc length, sector area, surface area, or the radian conversion, so carry those in yourself.</li><li>SOH-CAH-TOA is relative to the named angle. Sine and cosine are never greater than 1, use that to check.</li><li>Turn a given ratio into a labeled triangle, then use the Pythagorean theorem.</li><li>Scaling: doubling a length multiplies area by 4 and volume by 8. Substitute symbolically instead of guessing.</li><li>"Figure not drawn to scale" means do not trust the picture; trust the given measurements.</li></ol>' },
        { name:'Student-produced response (fill-in) rules',
          body:'<ol><li>Answers may be positive or negative, integers, decimals, or fractions. Mixed numbers are not allowed, enter 5/2, not 2 1/2.</li><li>The box holds 5 characters (6 if the answer is negative). If a decimal does not fit, fill the whole box, truncating or rounding at the last digit that fits. For 2/3 you may enter 2/3, .6666, or .6667; two digits such as .66 is scored wrong. When a fraction fits, entering the fraction is the safest option.</li><li>Do not enter symbols: no percent signs, no dollar signs, no commas in large numbers.</li><li>If a question has more than one correct answer, enter only one.</li></ol>' }
      ]
    }
  ],

  reference: [
    { label:'Circle', formula:'A = πr²<br>C = 2πr' },
    { label:'Rectangle', formula:'A = ℓw' },
    { label:'Triangle', formula:'A = ½bh' },
    { label:'Pythagorean theorem', formula:'c² = a² + b²' },
    { label:'Special right triangle', formula:'30°-60°-90°<br>x, x√3, 2x' },
    { label:'Special right triangle', formula:'45°-45°-90°<br>s, s, s√2' },
    { label:'Rectangular solid', formula:'V = ℓwh' },
    { label:'Cylinder', formula:'V = πr²h' },
    { label:'Sphere', formula:'V = (4/3)πr³' },
    { label:'Cone', formula:'V = (1/3)πr²h' },
    { label:'Pyramid', formula:'V = (1/3)ℓwh' },
    { label:'Arc / degrees', formula:'360° in a circle<br>2π radians in a circle' },
    { label:'Triangle angles', formula:'Interior angles sum to 180°' }
  ],
  /* NOT on the provided sheet. These you carry in yourself. */
  memorize: [
    { label:'Slope', formula:'m = (y₂ − y₁)/(x₂ − x₁)' },
    { label:'Quadratic formula', formula:'x = [−b ± √(b² − 4ac)] / 2a' },
    { label:'Discriminant', formula:'b² − 4ac<br>+ two roots, 0 one, − none' },
    { label:'Vertex', formula:'x = −b/(2a)' },
    { label:'Distance', formula:'d = √[(x₂−x₁)² + (y₂−y₁)²]' },
    { label:'Midpoint', formula:'((x₁+x₂)/2, (y₁+y₂)/2)' },
    { label:'Arc length', formula:'(θ/360) × 2πr' },
    { label:'Sector area', formula:'(θ/360) × πr²' },
    { label:'Radians', formula:'degrees × π/180' },
    { label:'Perpendicular slopes', formula:'m₁ × m₂ = −1' },
    { label:'Percent change', formula:'change ÷ original' },
    { label:'Exponential growth', formula:'y = a(1 + r)^t' }
  ]
};
