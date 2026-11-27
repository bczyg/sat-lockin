/* ============================================================
   SAT PrepMe, strategy and trap taxonomy

   Two catalogs plus one annotation map:

   STRATS the move a question is testing whether you make
   TRAPS the trick each wrong answer was built from
   TAGS qid -> { strat, traps: {choiceIndex: trapId} }

   The point of the taxonomy is diagnosis. Skill accuracy tells you
   *what topic* is weak; strategy and trap data tell you *what she is
   doing wrong*, which is the thing you can actually coach.
   ============================================================ */

/* ---------------- strategy families ---------------- */
window.STRATS = {
  /* Reading and Writing */
  'predict-first': { section:'rw', name:'Predict, then match',
    cues:[
      "The question asks what the whole text is mainly saying: \"Which choice best states the main idea of the text?\"",
      "Every choice is a one-sentence summary, and they all sound reasonable."],
    move:'Say the answer in your own words before you read a single choice, then look for the choice closest to what you said.',
    why:'Once you read four polished choices, all four start to sound reasonable. Your own prediction gives you something to measure them against.',
    drill:'Cover the choices with your hand. Write your prediction in five words. Then uncover.',
    gen: {
      shape: "A 60 to 110 word text making one clear point, with a concession or a complication so the main idea is not just the first sentence.",
      key: "The correct choice must paraphrase the whole text including its final turn, in different words from the text.",
      traps: ["too-narrow", "extreme", "not-in-text", "contradicts"],
      avoid: "Do not let the correct choice reuse distinctive wording from the text, because then it can be found by word-matching instead of by understanding. At least one distractor must be a true detail from the text."
    } },
  'claim-fit': { section:'rw', name:'Make the evidence fit the exact claim',
    cues:[
      "The question says \"most directly support\" or \"most directly weaken\" a claim, hypothesis, or conclusion.",
      "Or it asks which quotation \"most effectively illustrates\" a claim about a poem, novel, or speech.",
      "The choices are findings or quotations, not summaries."],
    move:'Put the claim in your own words, list what it needs to be true, then ask whether the choice actually props that up or knocks it down.',
    why:'You win these by being precise about the claim, not by picking whichever option sounds the most scientific.',
    drill:'Before you look at choices, write the claim down and underline the task word: support, or weaken.',
    gen: {
      shape: "A researcher states a hypothesis, and two plausible causes are tangled together. The question asks which finding would most directly support or weaken it.",
      key: "The correct finding must separate the two causes: vary one while holding the other fixed.",
      traps: ["opposite-task", "true-but-irrelevant", "half-right"],
      avoid: "Exactly one distractor must support when the task is to weaken, or vice versa. Do not make the correct finding simply restate the hypothesis."
    } },
  'data-discipline': { section:'rw', name:'Read the units, then do the math',
    cues:[
      "There is a table or graph next to the text.",
      "The question says \"uses data from the table (or graph) to complete the example\" or to support a claim.",
      "The choices quote specific numbers or name specific groups."],
    move:'Read the axis labels first. A relationship needs two data points. A "most" or "steepest" needs you to actually compute every group.',
    why:'These look like reading questions but they are arithmetic. Eyeballing the chart is exactly how they catch you.',
    drill:'Jot the numbers you need in the margin before you read any choice.',
    gen: {
      shape: "A short setup plus a table or simple bar chart as HTML, then a claim to support with data. Use 3 or 4 rows and label units explicitly.",
      key: "The correct choice must cite both variables for enough groups to establish the claimed relationship, usually two contrasting rows.",
      traps: ["one-sided", "misread-data", "true-but-irrelevant"],
      avoid: "Include one distractor that is a correct reading of a single cell but establishes no relationship, and one that reverses a more/less comparison. Every number in every choice must match the table exactly."
    } },
  'smallest-step': { section:'rw', name:'Take the smallest step you can prove',
    cues:[
      "The text ends in a blank after a phrase like \"This suggests that\" or \"it can most reasonably be concluded that\".",
      "The question says \"Which choice most logically completes the text?\" and there is no table."],
    move:'Pick the most modest thing the text fully supports. No outside knowledge, even if you know it is true.',
    why:'An inference is one small step past the text. The dramatic conclusion is nearly always the wrong one.',
    drill:'For each choice ask: which words in the text prove this? If you cannot point at them, cross it off.',
    gen: {
      shape: "A text presenting evidence that points to one modest conclusion, ending with a blank introduced by a phrase like 'This suggests that' or 'It can therefore be inferred that'.",
      key: "The correct choice is the smallest claim the text fully supports.",
      traps: ["extreme", "not-in-text", "reversed", "unstated-cause"],
      avoid: "One distractor must be the same idea overstated with an absolute word. Never make the correct answer require outside knowledge."
    } },
  'context-word': { section:'rw', name:'Let the sentence pick the word',
    cues:[
      "The question says \"most logical and precise word or phrase\", with a blank inside a sentence.",
      "Or it asks what a word \"most nearly means\" as used in the text.",
      "All four choices are single words or short phrases of the same type."],
    move:'Put your own word in the blank first. Use the colon, the dash, or the contrast that the sentence hands you.',
    why:'The most common meaning of the word is sitting right there in the choices on purpose. The sentence decides, not the dictionary.',
    drill:'Slot your choice back in and read the whole sentence out loud.',
    gen: {
      shape: "A 40 to 80 word text where one word is used in a sense that is not its most common one, with a colon, dash or contrast in the sentence that pins the meaning.",
      key: "The correct choice is a plain synonym for the intended sense.",
      traps: ["dictionary-default", "close-but-off", "reversed"],
      avoid: "One distractor must be the everyday meaning of the word. Keep all four choices the same part of speech and similar length."
    } },
  'author-move': { section:'rw', name:'Name what the author is doing',
    cues:[
      "The question asks for the \"function\" of an underlined sentence, the \"overall structure\" of the text, or its \"main purpose\".",
      "The choices start with verbs: \"To describe...\", \"To challenge...\", \"It introduces...\"."],
    move:'Answer with a verb: describing, correcting, conceding, redirecting. For an underlined sentence, read the sentence before and after it.',
    why:'These ask about how the text is built, not what it says. A choice can be true about the content and still name the wrong move.',
    drill:'Sum up each sentence in three words, then count the moves you get.',
    gen: {
      shape: "Either a text with one sentence in <u> tags and a question about its function, or a text with a clear sequence of moves and a question about overall structure.",
      key: "The correct choice names what the author is doing, as a verb, and matches the number of moves in the text.",
      traps: ["wrong-actor", "too-narrow", "wrong-order", "reversed"],
      avoid: "One distractor should describe a different sentence than the underlined one. If the text has three moves, no distractor should describe only two and still be correct."
    } },
  'concession-map': { section:'rw', name:'State each claim, then name the relationship',
    cues:[
      "There are two short texts, labeled Text 1 and Text 2.",
      "The question asks how the author of Text 2 would most likely respond to Text 1."],
    move:'Put each author\'s point in one sentence, then name how they relate: agree, disagree, qualify, or answer different questions. If it is a disagreement, go on to split what the second author accepts from what they reject.',
    why:'Not every pair of texts argues. Going in hunting for an objection makes you invent one, and on an agreement pair that costs you the question.',
    drill:'Write both claims in one sentence each before reading any choice. Then pick the relationship word out loud.',
    gen: {
      shape: "Two short texts labeled Text 1 and Text 2. Text 2 explicitly concedes something to Text 1 and disputes something else. Ask how the second author would respond.",
      key: "The correct choice keeps the concession intact and disputes only what Text 2 actually disputes.",
      traps: ["extreme", "contradicts", "reversed"],
      avoid: "One distractor must overstate the disagreement into total rejection. Text 2 must contain an explicit concession, using a word like grants, accepts or does not dispute."
    } },
  'relationship-first': { section:'rw', name:'Name the relationship first',
    cues:[
      "The question says \"most logical transition\".",
      "The blank opens a sentence, and every choice is a linking word: However, Therefore, For example, Similarly."],
    move:'Name what is happening between the sentences before you look at the choices. There are six options, not four: same direction, opposite, cause, example, restatement, and sequence in time. Concession words such as granted and admittedly are a flavor of opposite.',
    why:'Transition words blur together when you shop through them. Name the logic first and the choice becomes obvious.',
    drill:'Cover the choices and say out loud what the second sentence does to the first: agrees, clashes, causes, illustrates, restates, or comes later.',
    gen: {
      shape: "Two sentences with a blank for the transition, where the logical relationship is unambiguous.",
      key: "The correct transition matches the relationship exactly, and only one choice does.",
      traps: ["wrong-relationship"],
      avoid: "All three distractors are transitions of the wrong logical type, and each trap explanation must name which type it wrongly signals. Never offer two transitions that both work."
    } },
  'goal-checklist': { section:'rw', name:'Treat the goal as a checklist',
    cues:[
      "The text is a bulleted list of notes a student has taken.",
      "The question says \"The student wants to...\" and asks which choice \"most effectively uses relevant information from the notes\"."],
    move:'Break the stated goal into parts and make the choice tick every one.',
    why:'All the notes are true, so being accurate cannot separate the choices. Only the goal can.',
    drill:'Underline the goal and number its parts before you read anything else.',
    gen: {
      shape: "A bulleted list of 4 to 6 research notes, then a stated goal for the student.",
      key: "The correct choice satisfies every part of the stated goal using only the notes.",
      traps: ["half-right", "restates", "true-but-irrelevant", "one-sided"],
      avoid: "Every choice must be factually consistent with the notes, so only the goal separates them. If the goal says 'explain why', one distractor must restate the effect without a cause."
    } },
  'boundary-test': { section:'rw', name:'Test each side for a full sentence',
    cues:[
      "The question says \"conforms to the conventions of Standard English\".",
      "The choices are the same words with different punctuation: comma, semicolon, colon, dash, period, or nothing."],
    move:'Decide what sits on each side: a full sentence, a fragment, a list, or an interrupter. Then pick the mark that relationship requires, and remember that no mark at all is one of the options.',
    why:'Punctuation is structural, not musical. Where you would pause while reading is not evidence.',
    drill:'Say "complete" or "incomplete" out loud for each side, then ask whether this relationship needs any mark at all. Students over-punctuate far more often than they under-punctuate.',
    gen: {
      shape: "One or two sentences with a blank where punctuation is needed. State clearly in your own head whether each side is an independent clause.",
      key: "Exactly one punctuation option is legal for that structure.",
      traps: ["comma-splice", "wrong-mark", "unpaired", "fragment", "split-subject-verb"],
      avoid: "Critically: check that no second option is also grammatically legal. A semicolon and a colon are often both acceptable between two independent clauses, so if the answer is a colon, the material after it must not be an independent clause."
    } },
  'choice-split': { section:'rw', meta:true, name:'Read the choices down the column',
    cues:[
      "Every question that says \"conforms to the conventions of Standard English\".",
      "The four choices look nearly identical, which tells you exactly one thing is being tested."],
    move:'Before you read the sentence again, read the four choices vertically and find the one thing they change. That names the rule on trial.',
    why:'Every Standard English question tests exactly one rule, and the choices tell you which one for free. Guessing the rule is the slow way.',
    drill:'Say the dimension out loud: "these differ in verb number," or "these differ in apostrophes." Then go back to the sentence.',
    gen: {
      shape: "One sentence with a blank. The four choices must vary along exactly one visible dimension, so that reading them down the column identifies the rule.",
      key: "The one option that satisfies the rule that dimension points to.",
      traps: ["agreement-by-ear", "sounds-right", "wrong-mark", "possessive-count"],
      avoid: "Never let two dimensions vary at once, because then reading the column no longer names one rule. Do not mix a punctuation change and a verb change in the same choice set."
    } },
  'subject-verb': { section:'rw', name:'Strip to the bare subject, then match',
    cues:[
      "The choices are one verb in singular and plural forms: is or are, has or have, was or were.",
      "A long phrase sits between the subject and the blank, so the nearest noun is a decoy."],
    move:'Cross out the prepositional phrases and anything between commas, find the one word that is really the subject, and match the verb to it.',
    why:'These questions bury the subject behind three or four nouns so that the nearest one is the tempting match. Stripping is what makes the real subject visible.',
    drill:'Cross out every "of" phrase, then point at the single word doing the verb and say singular or plural.',
    gen: {
      shape: "One sentence where the true subject is separated from its verb by at least one prepositional phrase or a comma-set clause, and the nearest noun disagrees in number with the subject.",
      key: "The verb form that agrees with the actual head noun of the subject.",
      traps: ["agreement-by-ear", "sounds-right", "wrong-tense"],
      avoid: "Only use this shape when number is the dimension the choices vary. Collective nouns like team and committee are singular in American usage, so do not build a question whose answer depends on the British reading. Inverted subjects (\"there are\", \"among the finds were\") are fair and good."
    } },
  'verb-time': { section:'rw', name:'Let the time markers pick the verb',
    cues:[
      "The choices are one verb in different tenses: studied, has studied, will study, studies.",
      "The sentence carries a time marker: a year, \"since\", \"by\", \"currently\", or another verb whose tense it should match."],
    move:'Find the words that fix the time (in 1953, since then, by next spring, currently) and choose the verb form that fits them. After recommend, require, insist, or demand, use the plain form.',
    why:'Tense questions are decided by evidence elsewhere in the sentence, not by what sounds smooth. Once you find the time marker there is only one answer.',
    drill:'Underline the date or time phrase first. If there is none, look at the tense of the other verb in the sentence.',
    gen: {
      shape: "One sentence with an unambiguous time marker (a year, \"since\", \"by the time\", \"currently\") and a blank for the verb. Or a sentence with recommend/require/insist/demand plus a that-clause, testing the subjunctive.",
      key: "The one verb form consistent with the time marker, or the plain form after a verb of demand.",
      traps: ["wrong-tense", "sounds-right", "agreement-by-ear"],
      avoid: "The time evidence must be in the sentence, otherwise more than one tense is defensible. Do not offer two forms that both fit the marker, and never make a future perfect the distractor unless the sentence really has a future reference point."
    } },
  'apostrophe-count': { section:'rw', name:'Count the owners, then place the apostrophe',
    cues:[
      "The choices differ only in where the apostrophe goes, or whether there is one: researchers, researcher's, researchers'.",
      "Or the choices are its, it's, their, they're, whose, or who's."],
    move:'Ask how many owners there are, then whether they own anything at all. One owner takes apostrophe-s, several owners take s-apostrophe, and a plain plural takes no apostrophe. For its, their, and whose, no apostrophe ever.',
    why:'Every one of these four choices sounds identical out loud, so your ear gives you nothing. Counting is the only method.',
    drill:'Turn the phrase around: "the notes of the three geologists" tells you there are three owners.',
    gen: {
      shape: "One sentence with a blank where the choices are the same noun in singular possessive, plural possessive, plain plural, and one more form. The sentence must state the number of owners somewhere (\"the three\", \"each\", \"both\").",
      key: "The form matching the owner count the sentence establishes.",
      traps: ["possessive-count", "sounds-right"],
      avoid: "The sentence must make the owner count unambiguous, or two forms become defensible. Avoid the double form geologists's, which nobody actually writes; a stronger fourth choice is the plain plural or an its/it's contrast."
    } },
  'modifier-attach': { section:'rw', name:'Name who is doing the opening phrase',
    cues:[
      "The sentence opens with a descriptive phrase and a comma, and the blank is what comes right after the comma.",
      "The choices say the same thing but start with different nouns."],
    move:'Read the opening phrase, then ask who or what is performing it. Whatever comes right after the comma has to be that thing.',
    why:'This is the one conventions question where you must not strip the modifier, because the modifier is the evidence. The error is a mismatch between two parts of the sentence, so you need both.',
    drill:'Point at the opening phrase and say "who did this?" Then point at the word after the comma and check it is the same.',
    gen: {
      shape: "A sentence opening with a participial or infinitive phrase, then a comma, then a blank or a subject. The phrase must name an action that only one candidate subject could perform.",
      key: "The version where the word right after the comma is the thing performing the opening phrase. A passive participle (\"Taken in 1937,\") is a legitimate key.",
      traps: ["dangling", "comma-splice", "sounds-right"],
      avoid: "Do not make all three distractors the same dangling participle, or the item collapses to two real choices. Vary them: one dangler, one complete sentence spliced on with a comma, one that changes the subject."
    } },
  'parallel-pairs': { section:'rw', name:'Make both halves the same shape',
    cues:[
      "The sentence has a list, a comparison, or a paired phrase: not only... but also, either... or, both... and.",
      "The choices give the same idea in different grammatical forms: to analyze, analyzing, analysis."],
    move:'Find the pair (not only with but also, either with or, a list, or a comparison) and make the second half the same grammatical shape as the first.',
    why:'Parallelism and illogical comparison are the same move. Both are decided by matching the form of one half against the other, not by meaning.',
    drill:'Read the first half and the second half back to back with nothing in between. If they do not sound like siblings, it is wrong.',
    gen: {
      shape: "A sentence with an explicit pair or comparison, where the first half is a fixed grammatical shape (noun phrase, gerund, clause) and the blank is the second half.",
      key: "The choice matching the first half's shape exactly. Check what the first half actually is before writing the key.",
      traps: ["unparallel", "illogical-comparison", "sounds-right"],
      avoid: "Decide what the first half is and write it down, because keying a noun clause against a noun-phrase first half is the standard way this question type gets written wrong. On comparisons, the two things compared must be the same kind of thing, so never compare summers with ledgers unless that is the error you are testing."
    } },
  'pronoun-check': { section:'rw', name:'Send every pronoun back to its noun',
    cues:[
      "The choices are pronouns: it, they, its, their, this, these, him, them.",
      "Or the choices differ in whether a pronoun or a specific noun fills the blank."],
    move:'For each pronoun, find the exact noun it replaces and check they match in number. If you cannot point at one specific noun, the pronoun is the problem.',
    why:'A pronoun with a plausible but absent antecedent reads perfectly smoothly, which is why this one slips past almost everybody.',
    drill:'Put your finger on the pronoun, then move it back to the noun. If your finger keeps moving, that is the answer.',
    gen: {
      shape: "A sentence or short pair of sentences containing a pronoun whose antecedent is either a mismatched number or genuinely absent. Keep the antecedent inside the sentence when number is the test.",
      key: "The version whose pronoun matches one specific noun in number, or that replaces the vague pronoun with the noun itself.",
      traps: ["pronoun-ref", "agreement-by-ear", "sounds-right"],
      avoid: "Do not put the antecedent so far away that a reader cannot find it at all. Every noun a student might pick as the antecedent must be visible in the text you give them."
    } },
  /* Math */
  'translate': { section:'math', name:'Turn the words into equations',
    cues:[
      "A word problem describes a situation and asks for the equation, expression, or inequality that models it.",
      "Words like each, per, total, more than, and at least are carrying the math."],
    move:'Write "let x = ..." every time, then build one equation per condition. Convert units before you substitute anything.',
    why:'Most word problems go wrong in the setup, not the algebra.',
    drill:'Label every number with its unit as you write it down.',
    gen: {
      shape: "A word problem with two or three conditions that turn into equations, or a real-world model to interpret.",
      key: "The correct choice reflects a correct setup.",
      traps: ["setup-error", "reversed", "unit-miss", "wrong-target"],
      avoid: "Make one distractor come from swapping the two quantities. If the model has units, one distractor should ignore a conversion. Numbers must come out clean. One distractor should drop the fixed amount (the flat fee or starting value) and keep only the per-unit part.",
      spr: true,
      grid: "Ask for one value the equations give, such as the number of tickets sold, so the answer is a whole number."
    } },
  'desmos-first': { section:'math', name:'Graph it before you solve it',
    cues:[
      "You are given an equation or a system and asked for a solution, an x-intercept, or where two things are equal.",
      "The algebra looks ugly (fractions, radicals, a quadratic) but the question only wants a number.",
      "A function is given and the question asks for its maximum, minimum, vertex, or intercepts."],
    move:'Every math question on the real test comes with a Desmos graphing calculator. Type each side of an equation as its own function and read the intersection. Enter a system and read the crossing point. Shade inequalities and click a candidate point.',
    why:'This is the single highest-leverage habit on the current test, and it sidesteps whole categories of error. A graph cannot produce an extraneous root, because a false solution simply is not an intersection.',
    drill:'On every equation, ask "could I just graph both sides?" before you start doing algebra by hand.',
    gen: {
      shape: "An equation, system, or inequality that is tedious by hand but immediate on a graph: a radical or rational equation, a system with ugly coefficients, or a quadratic whose vertex or zeros are wanted.",
      key: "The intersection, crossing point, vertex, or zero the graph shows.",
      traps: ["extraneous-root", "wrong-target", "arith-slip", "sign-slip"],
      avoid: "The question still has to ask for something specific, so make at least one distractor the other coordinate of the point. Graphing finds the point; reading the question tells you which half of it to report. Give the equations in forms that are awkward to solve by hand, such as a non-integer intersection, and make the strategy sentence say exactly what to type into Desmos.",
      spr: true,
      grid: "Ask for one coordinate of an intersection, or a zero, with an exact value that fits the grid, such as 7/2 or -1.5."
    } },
  'count-solutions': { section:'math', name:'Count the solutions by comparing sides',
    cues:[
      "The question asks \"how many solutions\", or says the equation or system has \"no solution\" or \"infinitely many solutions\".",
      "An unknown constant such as k or c appears, and you must find the value that makes that happen."],
    move:'To count solutions, compare the two sides rather than solving. For a linear equation, match coefficients: identical both sides means infinitely many, same slope with a different constant means none. For a system, compare the coefficient ratios. For a quadratic, use the discriminant.',
    why:'How many solutions is one idea, but it shows up in three disguises. Students who learn it three separate times never notice it is the same question.',
    drill:'When a question asks how many, stop yourself from solving. Line the two sides up and compare them term by term.',
    gen: {
      shape: "An equation or system containing an unknown constant, asking for the value that produces no solution or infinitely many, or a quadratic asking how many real solutions it has.",
      key: "The constant value making the two sides proportional (infinitely many), or proportional in the variables but not the constant (none), or the discriminant's sign.",
      traps: ["setup-error", "algebra-rule", "sign-slip", "wrong-target"],
      avoid: "Be explicit about which case you are asking for, since no solution and infinitely many differ only in the constant term and it is easy to key the wrong one. Verify by substituting your constant back and checking the count is what you claimed. For a hard version, use a system where the student must match the slopes first and then compare the constants; the trap is forgetting that the constants must differ for no solution.",
      spr: true,
      grid: "Ask for the value of the constant k that gives no solution, or infinitely many."
    } },
  'solve-check': { section:'math', name:'Solve it, then check it',
    cues:[
      "One equation in one variable, asking for the value of x.",
      "There is a radical or a variable in a denominator, where squaring or clearing fractions can create a fake solution."],
    move:'Undo the operations in reverse order, then put your answer back into the original equation.',
    why:'Checking takes ten seconds and catches sign errors, extraneous roots, and stopping one step early.',
    drill:'Never leave an equation without substituting your answer back in once.',
    gen: {
      shape: "An equation to solve. For a radical or rational equation, design it so squaring or clearing produces exactly one extraneous root.",
      key: "The value that satisfies the ORIGINAL equation.",
      traps: ["extraneous-root", "sign-slip", "one-step-short", "arith-slip"],
      avoid: "Verify both roots yourself before writing the choices. For a radical equation the extraneous root is the one making the other side negative. Never offer 'both roots' as the correct answer. Some questions should ask for an expression built from x, such as 3x + 2, and then x itself must be one of the wrong choices.",
      spr: true,
      grid: "Ask for x, or for an expression in x. The likely wrong answers include the extraneous root, and x itself when an expression was asked for."
    } },
  'systems-tactics': { section:'math', name:'Pick the cheaper way through a system',
    cues:[
      "Two equations, two variables.",
      "The question asks for x, for y, or for a combination such as x + y or 2x - y."],
    move:'Eliminate when a variable cancels for free. Substitute when a coefficient is already 1. Then re-read what was actually asked for.',
    why:'Systems questions love to ask for x + y, or for the variable you did not solve for first.',
    drill:'Circle the quantity you need before you start solving.',
    gen: {
      shape: "Two linear equations, or a word problem that becomes two. Ask for a combination like x + y, or for the variable a careless solver would not report.",
      key: "The quantity actually named in the question.",
      traps: ["wrong-target", "operation-swap", "one-step-short", "arith-slip"],
      avoid: "One distractor must be the other variable, and one the value one step before the end. Choose coefficients so the solution is an integer. Some questions should ask for x + y or x - y that falls straight out of adding or subtracting the two equations, without solving for each variable.",
      spr: true,
      grid: "Ask for the sum, the difference or the one variable named, as a clean integer."
    } },
  'expression-structure': { section:'math', name:'Look at the shape of the expression',
    cues:[
      "The question asks which expression \"is equivalent to\" the one given.",
      "You can see a pattern: a difference of squares, a perfect square, a common factor, or matching exponent bases."],
    move:'Spot the structure first: difference of squares, perfect square, common base. Then use the exponent or factoring rule that fits.',
    why:'These reward recognizing a shape more than grinding through steps.',
    drill:'Ask "what shape is this?" before you touch it, then test your result with x = 3.',
    gen: {
      shape: "An expression to simplify, factor, rewrite in vertex form, or match coefficients on. Recognising the shape should be faster than grinding.",
      key: "The equivalent expression.",
      traps: ["algebra-rule", "sign-slip", "arith-slip"],
      avoid: "Test every distractor at x = 2 and confirm none of them coincidentally equals the original there, otherwise plugging in a number cannot separate them. Build expressions that look hard but collapse with one pattern, never ones that need a long expansion. One distractor should be the expansion with a single sign error.",
      spr: true,
      grid: "Ask for one constant after rewriting, such as the value of a in an equivalent form."
    } },
  'function-notation': { section:'math', name:'Substitute in parentheses, inside out',
    cues:[
      "The question uses f(x) notation: f(3), f(x + 2), f(g(2)).",
      "A function is defined, and you are asked to evaluate it at a number or an expression."],
    move:'Put the input in parentheses. For a composition, work out the inner value and write it on its own line before you use it.',
    why:'Nearly every miss here is a sign error or a reversed order, and one extra line prevents both.',
    drill:'Write the middle value down. Do not do it in your head.',
    gen: {
      shape: "Evaluate a function at a value, or a composition of two functions.",
      key: "The correct value, worked inside out.",
      traps: ["wrong-order", "sign-slip", "one-step-short"],
      avoid: "One distractor must be the composition done in the reverse order, and you must verify that reversed value is actually different. Use a negative input if you want to test sign handling. Use negative inputs or inputs that are expressions, and include cases where dropping parentheses changes the answer: -3^2 is -9 but (-3)^2 is 9, and f(x + 1) is not f(x) + 1.",
      spr: true,
      grid: "Ask for a single value, such as f(g(-2))."
    } },
  'function-behavior': { section:'math', name:'Use how the function behaves',
    cues:[
      "The question asks about a quadratic's vertex, minimum, maximum, zeros, or the sum or product of its solutions.",
      "Or an exponential model like a(1.05)^t, asking about the growth rate, the starting value, or the doubling time."],
    move:'Vertex at x = -b/2a. Discriminant for how many solutions. Sum of roots is -b/a, product is c/a. For exponentials, read the growth factor and the doubling or halving time out of the exponent.',
    why:'These shortcuts answer the question without solving it, as long as you then report the thing that was asked for.',
    drill:'After you find the vertex x, stop and ask whether the question wants x or the value there.',
    gen: {
      shape: "A quadratic or exponential where the vertex, discriminant, root sum, growth factor or period answers the question without fully solving it.",
      key: "Exactly the quantity asked for, which is often the value at the vertex rather than the vertex x.",
      traps: ["wrong-target", "arith-slip", "setup-error", "unit-miss"],
      avoid: "If the question asks for a minimum or maximum VALUE, one distractor must be the x at which it occurs. For exponentials, define the time unit and make one distractor ignore the conversion. Give the function in factored or vertex form so the answer reads off the form, and ask something that is slower to answer by expanding. For exponentials, a base of 1.04 means 4% growth, not 104%, and one distractor should mix up the time unit (monthly versus yearly).",
      spr: true,
      grid: "Ask for a minimum or maximum value, a zero, or a growth rate as a number."
    } },
  'proportional-reasoning': { section:'math', name:'Think in rates, ratios, and percents',
    cues:[
      "The words percent, ratio, rate, or per, or a unit conversion (feet to inches, hours to minutes).",
      "Two percent changes in a row, or a percent of a percent."],
    move:'Percent change is change over the original. Two percent changes multiply, they never add. Convert every unit before you divide.',
    why:'The traps here are structural: wrong denominator, added percents, a missed conversion.',
    drill:'Write the units into the fraction and cancel them on the page.',
    gen: {
      shape: "Percent change, successive percent changes, a rate with a unit conversion, a scale, or a mixture.",
      key: "The correctly computed value.",
      traps: ["wrong-denominator", "operation-swap", "unit-miss", "one-step-short"],
      avoid: "For percent change, one distractor must divide by the final rather than the original. For successive percents, one must add the rates instead of compounding. Keep the numbers clean. Include conversions with squared or cubed units, where the conversion factor must be squared or cubed too, and state the conversion facts in the question.",
      spr: true,
      grid: "Ask for one number, such as a final price or a converted measure, that fits the grid."
    } },
  'data-inference': { section:'math', name:'Know what a statistic is allowed to say',
    cues:[
      "A survey, sample, or experiment is described, and the question asks which conclusion is supported.",
      "Mean, median, range, standard deviation, margin of error, or a two-way table."],
    move:'Find the condition, because it sets the denominator. Ask which measure an outlier moves. A margin of error gives a range, not a fact. You may generalize only to the population that was randomly sampled, and only a randomized experiment supports a causal claim.',
    why:'These test whether you can say what the number means, not whether you can compute it.',
    drill:'Say the statistic back as a full sentence, naming which group it describes and whether the study was an experiment or an observation.',
    gen: {
      shape: "A two-way table, a line of best fit to interpret, a comparison of mean and median, or a margin of error.",
      key: "The statement the statistic actually licenses.",
      traps: ["wrong-denominator", "extreme", "wrong-target", "misread-data"],
      avoid: "For conditional probability, one distractor must use the grand total as the denominator. For a margin of error, one must treat the estimate as exact. If an axis is in thousands, one distractor must ignore that. Include study-design questions: a random sample supports conclusions only about the group it was drawn from, and only random assignment supports cause. Wrong choices should overreach (cause from an observational study, or a claim about people outside the sample) and the correct choice should be modest. For center and spread, an extreme value moves the mean much more than the median.",
      spr: false
    } },
  'geometry-toolkit': { section:'math', name:'Find the radius, open the formula sheet',
    cues:[
      "A figure with triangles, circles, or parallel lines, or words like radius, arc, sine, cosine, or similar.",
      "Area or volume of a shape, or a scale factor between similar figures."],
    move:'Route circle problems through the radius. Take trig ratios relative to the angle named. Scale with symbols, not numbers. Use the angle relationship the figure gives you.',
    why:'The provided sheet covers areas, volumes, the Pythagorean theorem, and the special right triangles. It does not give you arc length, sector area, surface area, or the radian conversion, so those you carry in.',
    drill:'Label the figure with everything you know before you write an equation.',
    gen: {
      shape: "A circle, a right triangle, similar triangles, an angle relationship, a volume, or a scaling question. Include a simple figure only if it is genuinely needed.",
      key: "The correct measure.",
      traps: ["formula-mixup", "wrong-ratio", "flipped-ratio", "wrong-target", "setup-error"],
      avoid: "For a trig ratio, one distractor must be a different ratio of the same triangle and one the reciprocal. Check that sine and cosine values you offer never exceed 1. Prefer Pythagorean triples so the numbers stay clean. Write some questions that give an area or volume and ask for a length, and some scaling questions (if the radius doubles, the volume is multiplied by 8). Include a distractor that uses the diameter where the formula needs the radius. Describe every figure fully in words.",
      spr: true,
      grid: "Ask for a single length, area or angle measure in degrees."
    } },
  'coordinate-geometry': { section:'math', name:'Work in the coordinate plane',
    cues:[
      "Points given as coordinates, a slope, or lines described as parallel or perpendicular.",
      "An equation like (x - h)^2 + (y - k)^2 = r^2, or one you can complete the square to reach."],
    move:'Slope is rise over run with both points in the same order. Parallel lines have equal slopes; perpendicular lines have slopes that are negative reciprocals, so their product is -1. Complete the square to read a circle out of its equation.',
    why:'Parallel versus perpendicular, and rise versus run, are the two places this reliably slips.',
    drill:'Label your two points before you subtract, and sketch it when you can.',
    gen: {
      shape: "Slope from two points, a parallel or perpendicular line, a distance, a midpoint, or a circle equation to complete the square on.",
      key: "The correct line, value or radius.",
      traps: ["formula-mixup", "flipped-ratio", "sign-slip", "arith-slip"],
      avoid: "If the question is about parallel lines, one distractor must use the perpendicular slope. For slope, one must be run over rise. Choose points giving an integer or simple fractional slope. Include a circle equation that must be rewritten by completing the square before the center shows, with distractors that read the center as (-h, -k) with the wrong signs or take r squared as the radius. For perpendicular lines the slope is the negative reciprocal.",
      spr: true,
      grid: "Ask for a slope, a radius or one coordinate of the center."
    } },
  'choice-tactics': { section:'math', name:'Use the answer choices',
    cues:[
      "The choices are numbers you could plug straight back into the equation.",
      "The question asks which expression is equivalent and the choices are expressions in x, so a test number settles it."],
    move:'Back-solve by testing the choices, or plug in a number on "which expression is equivalent" questions. Use 3 or 5, never 0, 1, or 2, and if two choices survive, test a second number.',
    why:'On some questions, testing four choices is genuinely faster and safer than doing the algebra. The catch is the number you pick: at x = 2, x squared and 2x are both 4, so genuinely different expressions collide and a wrong choice can look right.',
    drill:'Before you solve, ask yourself whether you could just test the choices instead.',
    gen: {
      shape: "A question where testing the four choices is genuinely faster than solving: a system of inequalities to test points against, an equivalent expression to plug a number into, or a word problem to back-solve.",
      key: "The only choice that survives testing.",
      traps: ["half-right", "arith-slip", "wrong-target"],
      avoid: "Each distractor must fail a specific, checkable test, and the trap explanation must say which test it fails and with what numbers. For a system of inequalities, make each distractor satisfy exactly one of the two. When the choices are numbers, list them in increasing order so testing B or C first splits the field.",
      spr: false
    } }
};

/* ---------------- moves by SAT domain ----------------
   The four domains of each section, in test order, as the College Board
   names them on score reports, so the moves list matches what a student
   sees there. A move goes where its questions come from. Moves used on
   any question of the section (graph it, check it, use the choices) get
   their own group, last. verify.js checks every move is in exactly one. */
window.MOVE_DOMAINS = {
  rw: [
    { name:'Craft and Structure', moves:['context-word', 'author-move', 'concession-map'] },
    { name:'Information and Ideas', moves:['predict-first', 'claim-fit', 'data-discipline', 'smallest-step'] },
    { name:'Standard English Conventions', moves:['boundary-test', 'subject-verb', 'verb-time', 'apostrophe-count', 'modifier-attach', 'parallel-pairs', 'pronoun-check'] },
    { name:'Expression of Ideas', moves:['relationship-first', 'goal-checklist'] },
    { name:'Every question', moves:['choice-split'] }
  ],
  math: [
    { name:'Algebra', moves:['translate', 'count-solutions', 'systems-tactics'] },
    { name:'Advanced Math', moves:['expression-structure', 'function-notation', 'function-behavior'] },
    { name:'Problem-Solving and Data Analysis', moves:['proportional-reasoning', 'data-inference'] },
    { name:'Geometry and Trigonometry', moves:['geometry-toolkit', 'coordinate-geometry'] },
    { name:'Any math question', moves:['desmos-first', 'solve-check', 'choice-tactics'] }
  ]
};
Object.keys(window.MOVE_DOMAINS).forEach(function (sec) {
  window.MOVE_DOMAINS[sec].forEach(function (d) {
    d.moves.forEach(function (id) { if (window.STRATS[id]) window.STRATS[id].domain = d.name; });
  });
});


/* ---------------- telling look-alike strategies apart ----------------
   The pairs students actually confuse, and the one question that separates
   them. Keyed "a|b" in alphabetical order; use window.stratVs(a, b). */
window.STRAT_VS = {
  "author-move|predict-first":
    "Main idea asks what the text says. Main purpose or function asks what the author is doing, and the choices start with verbs.",
  "predict-first|smallest-step":
    "A blank at the end after \"this suggests\" wants one small step past the text. A main-idea question wants a summary of what is already there.",
  "claim-fit|data-discipline":
    "If there is a table or graph, compute from it before judging the claim. If there is no data, it is about the exact wording of the claim.",
  "claim-fit|smallest-step":
    "Support or weaken means the choices are new findings to test against a claim. A blank at the end means you are writing the conclusion yourself.",
  "data-discipline|smallest-step":
    "Both can end in a blank. If a table or graph is attached, read the numbers first; it is a data question.",
  "boundary-test|relationship-first":
    "If the choices are different words (However, Therefore), name the relationship. If they are the same words with different punctuation, test each side for a full sentence.",
  "subject-verb|verb-time":
    "Choices that differ in number (is, are) mean find the subject. Choices that differ in time (was, has been, will be) mean find the time marker.",
  "parallel-pairs|verb-time":
    "If there is a list or a pair in the sentence, match the shape of the other half first. Only reach for tense when there is no list.",
  "apostrophe-count|pronoun-check":
    "Its, it's, their, they're are an apostrophe question. It, they, this, these are a pronoun question: find the noun it points back to.",
  "boundary-test|modifier-attach":
    "If the choices move the punctuation, it is a boundary. If the choices reorder the clause so a different noun comes first, it is a modifier.",
  "count-solutions|solve-check":
    "\"How many solutions\" or a constant that makes \"no solution\" means compare the sides. Do not solve.",
  "count-solutions|systems-tactics":
    "A system that asks for x or y means solve it. A system that asks when it has no solution, or infinitely many, means compare the coefficients.",
  "desmos-first|systems-tactics":
    "Both work on a system. If the numbers are clean and one variable cancels, eliminate by hand. If not, graph both and read the crossing.",
  "function-behavior|function-notation":
    "f(3) or f(g(2)) means substitute. Vertex, zeros, or a growth rate means read it off the form of the function.",
  "proportional-reasoning|translate":
    "If the story is about percents, ratios, or unit conversions, think in rates. If it asks you to build the equation, translate word by word.",
  "coordinate-geometry|geometry-toolkit":
    "Coordinates, slopes, or an equation of a circle mean the coordinate plane. A drawn figure with angles and lengths means the geometry toolkit.",
  "choice-tactics|expression-structure":
    "Both handle \"which expression is equivalent\". Spot the structure if you can see it in five seconds. If not, plug in 3 and test the choices."
};
window.stratVs = function (a, b) {
  return window.STRAT_VS[a < b ? a + '|' + b : b + '|' + a] || null;
};

/* ---------------- trap catalog ---------------- */
window.TRAP_FAMILIES = {
  scope:     { name:'Scope', blurb:'The choice says more, or less, than the text lets you say.' },
  partial:   { name:'Half the job', blurb:'The choice does part of what you were asked and stops.' },
  direction: { name:'Backwards', blurb:'The right idea, pointed the wrong way round.' },
  referent:  { name:'Wrong thing', blurb:'A fine statement about something other than what you were asked.' },
  mechanics: { name:'Grammar rule', blurb:'A punctuation or grammar rule that did not get applied.' },
  procedure: { name:'Slipped step', blurb:'A calculation, a formula, or a setup that went wrong.' }
};

window.TRAPS = {
  /* --- scope --- */
  'extreme':        { fam:'scope', name:'Too strong',
    tell:'Watch for only, never, all, none, entirely, proves, at all, in every respect.',
    fix:'SAT texts hedge. When you see an absolute word, go back and check whether the text really goes that far.',
    felt:'The choice I picked said something absolute, like only, never or all' },
  'too-narrow':     { fam:'scope', name:'A detail pretending to be the point',
    tell:'A true, specific detail offered to you as the main idea.',
    fix:'Ask whether the choice covers the whole text, especially the last sentence.',
    felt:'I picked a true detail from the text instead of the overall point' },
  'not-in-text':    { fam:'scope', name:'Made up',
    tell:'It sounds like something the passage would say, but no sentence actually says it.',
    fix:'Point at the line. If your finger has nowhere to go, cross it off.',
    felt:'It sounded like something the passage would say, but I cannot find where it says it' },
  'unstated-cause': { fam:'scope', name:'An invented reason',
    tell:'It slides from a fact to a motive, a need, or an intention the text never gives you.',
    fix:'Keep what happened separate from why. The text has to hand you the why.',
    felt:'I picked a reason or motive the text never actually gave' },
  'contradicts':    { fam:'scope', name:'The text says the opposite',
    tell:'It often reuses the passage words while flipping what they meant.',
    fix:'Familiar wording is not evidence. Check the claim against the sentence it came from.',
    felt:'It used words from the passage, so I trusted it without checking' },

  /* --- partial --- */
  'half-right':     { fam:'partial', name:'Half right',
    tell:'It nails one thing the question asked for and quietly misses another.',
    fix:'Split the task into parts and tick off every part before you commit.',
    felt:'The first half of my choice was right and I stopped reading there' },
  'one-sided':      { fam:'partial', name:'Only one side',
    tell:'One group, one year, or one species when the claim needs two.',
    fix:'If the claim compares two things, your answer needs both of them in it.',
    felt:'My choice only covered one side of a comparison' },
  'restates':       { fam:'partial', name:'Repeats instead of explains',
    tell:'It tells you the result again when the question asked why it happened.',
    fix:'"Explain why" needs a mechanism. Saying the effect twice is not a cause.',
    felt:'I picked something that repeated the result instead of explaining why' },
  'one-step-short': { fam:'partial', name:'One step short',
    tell:'A real number from the correct work, just not the final one.',
    fix:'Ask "am I done?" and re-read the last line of the question before you commit.',
    felt:'I did the work right but stopped one step early' },
  'wrong-target':   { fam:'partial', name:'Solved for the wrong thing',
    tell:'Perfect work, wrong thing reported. x instead of x + y. The vertex x instead of the minimum value. The rate instead of the time.',
    fix:'Circle what is being asked for before you solve, then check your answer against that circle.',
    felt:'My math was right but I answered for the wrong quantity' },

  /* --- direction --- */
  'reversed':       { fam:'direction', name:'Backwards',
    tell:'Right relationship, wrong way round. Cause and effect swapped, or a rise read as a fall.',
    fix:'Say it as an arrow, A causes B, then check which way the text points it.',
    felt:'I had the right idea but backwards' },
  'opposite-task':  { fam:'direction', name:'Does the opposite job',
    tell:'It supports when you were asked to weaken, or gives the rival theory prediction.',
    fix:'Underline the task word. On a weaken question, expect a strengthener sitting in the choices.',
    felt:'I supported the claim when the question asked me to weaken it, or the reverse' },
  'wrong-relationship': { fam:'direction', name:'Wrong kind of link',
    tell:'A transition of the wrong type. Contrast where the logic is causal, example where it is opposition.',
    fix:'Name the relationship in plain words before you read the four transition words.',
    felt:'I picked the wrong kind of transition, like contrast where it was cause' },
  'wrong-order':    { fam:'direction', name:'Right pieces, wrong order',
    tell:'The moves of the text, or the steps of a composition, in the wrong sequence.',
    fix:'Structure questions are about order. Compose from the inside out, and map the text in order.',
    felt:'I did the steps in the wrong order' },
  'flipped-ratio':  { fam:'direction', name:'Upside-down fraction',
    tell:'Run over rise. 15/12 instead of 12/15. The reciprocal of the ratio you want.',
    fix:'Say the numerator and denominator out loud. Sine and cosine can never be bigger than 1.',
    felt:'I flipped the fraction, or used the reciprocal' },
  'sign-slip':      { fam:'direction', name:'Sign error',
    tell:'The right size number with the wrong sign, or a negative dropped while distributing.',
    fix:'Substitute in parentheses, and check one value back in the original equation.',
    felt:'I lost a negative sign somewhere' },

  /* --- referent --- */
  'true-but-irrelevant': { fam:'referent', name:'True but beside the point',
    tell:'A correct statement that does not do the job you were asked to do.',
    fix:'Ask "does this accomplish the task?" rather than "is this true?"',
    felt:'My choice was true but it did not do what the question asked' },
  'wrong-actor':    { fam:'referent', name:'Wrong person or wrong sentence',
    tell:'The right action done by the wrong thing, or a description of a different part of the text.',
    fix:'Check the subject of the choice against the subject in the text.',
    felt:'It described the right thing happening to the wrong person or sentence' },
  'dictionary-default': { fam:'referent', name:'The everyday meaning',
    tell:'Money for "economy". Material for "plastic". The first meaning that comes to mind.',
    fix:'Your own word from the sentence beats the dictionary every time.',
    felt:'I went with the everyday meaning of the word' },
  'close-but-off':  { fam:'referent', name:'Nearly right',
    tell:'The right neighborhood of meaning with the wrong emphasis. Practicality for spareness, provisional for malleable.',
    fix:'Put your two finalists next to the text, word by word, rather than next to each other.',
    felt:'I was down to two and picked the one that was nearly right' },
  'misread-data':   { fam:'referent', name:'Misread the chart',
    tell:'Wrong row, wrong group, "more" and "less" flipped, or a difference that turns out to be a tie.',
    fix:'Recompute the comparison from the numbers. Never accept a ranking you did not check.',
    felt:'I read the wrong row, column or group on the graph or table' },
  'wrong-denominator': { fam:'referent', name:'Wrong denominator',
    tell:'It uses the whole table when the question narrowed you to one column, or the sale price instead of the original.',
    fix:'Whatever follows "if" sets the denominator, and percent change divides by the original.',
    felt:'I divided by the wrong total' },

  /* --- mechanics --- */
  'comma-splice':   { fam:'mechanics', name:'Comma splice',
    tell:'Two complete sentences held together by nothing but a comma.',
    fix:'Complete plus complete needs a period, a semicolon, or a comma plus and, but, or, so.',
    felt:'I joined two full sentences with just a comma' },
  'wrong-mark':     { fam:'mechanics', name:'Wrong mark for the job',
    tell:'A real punctuation mark used where the structure needs a different one. A comma before a list, a semicolon before a fragment.',
    fix:'Work out what is on each side first: sentence, list, or fragment. That tells you the mark.',
    felt:'I picked the wrong punctuation mark for the job' },
  'unpaired':       { fam:'mechanics', name:'Unpaired punctuation',
    tell:'A dash closed off with a comma, or an interrupter that opens and never closes.',
    fix:'Punctuation comes in pairs. Find the opening mark before you pick the closing one.',
    felt:'I mismatched the punctuation pair, like closing a dash with a comma' },
  'split-subject-verb': { fam:'mechanics', name:'Subject cut off from its verb',
    tell:'A lone comma or dash sitting between a long subject and its verb.',
    fix:'Strip the modifiers and put the subject next to its verb. Nothing goes between them.',
    felt:'I put a comma between the subject and its verb' },
  'agreement-by-ear': { fam:'mechanics', name:'Agreement by ear',
    tell:'The verb matches the nearest noun, or the head count of a collective noun, instead of the real subject.',
    fix:'Cross out every "of" phrase, then match the verb to whatever is left.',
    felt:'I matched the verb to the nearest noun instead of the real subject' },
  'pronoun-ref': { fam:'mechanics',
    name:'Pronoun with no owner',
    tell:'A pronoun that does not match its noun in number, or one you cannot trace back to any single noun at all.',
    fix:'Put your finger on the pronoun and move it back to the exact noun it replaces. If your finger keeps moving, the pronoun is the error.',
    felt:'The sentence read fine, so I never checked what the pronoun pointed at' },
  'wrong-tense':    { fam:'mechanics', name:'Tense or mood mismatch',
    tell:'A verb form fighting the time markers in the sentence, or an ordinary verb where the subjunctive belongs.',
    fix:'Let the time markers decide. After recommend, require, or insist that, use the base form.',
    felt:'I picked the wrong verb tense or form' },
  'possessive-count': { fam:'mechanics', name:'Apostrophe in the wrong place',
    tell:'A singular possessive when there are two owners, or a plural with no possessive at all.',
    fix:'Ask how many owners, then whether they own something. Two owners means apostrophe after the s.',
    felt:'I put the apostrophe in the wrong place for the number of owners' },
  'dangling':       { fam:'mechanics', name:'Dangling modifier',
    tell:'An opening phrase describing an action the following subject could not possibly do.',
    fix:'Name the subject right after the comma and check that it can actually do what the phrase describes.',
    felt:'The opening phrase did not match the subject that followed it' },
  'unparallel':     { fam:'mechanics', name:'Mismatched pair',
    tell:'The second half of "not only ... but also," or one item in a list, in a different grammatical form.',
    fix:'Write the two halves next to each other and match their shapes.',
    felt:'The two halves of the sentence did not match in form' },
  'illogical-comparison': { fam:'mechanics', name:'Comparing unlike things',
    tell:'It compares winters with records, or a thing with a date.',
    fix:'Both sides of "than" have to be the same kind of thing. "Those" usually supplies the missing noun.',
    felt:'I compared two things that were not the same kind of thing' },
  'fragment':       { fam:'mechanics', name:'Fragment or run-on',
    tell:'A clause with no real verb, or two clauses jammed together with no mark at all.',
    fix:'Every sentence needs a subject and a verb, and clauses need a legal join.',
    felt:'I picked something that left a fragment or a run-on' },
  'sounds-right':   { fam:'mechanics', name:'Sounds fine, breaks the rule',
    tell:'A comma where you would pause. A past tense after a past tense verb. A stray comma after "and".',
    fix:'Trust the structure over your ear, and read the choices character by character.',
    felt:'It sounded right when I read it in my head' },

  /* --- procedure --- */
  'unit-miss':      { fam:'procedure', name:'Units ignored',
    tell:'Thousands read as ones. Months used where the model wants years. Degrees treated as a length.',
    fix:'Read the axis labels and the variable definitions before you substitute, and convert first.',
    felt:'I missed the units, like thousands, or months versus years' },
  'operation-swap': { fam:'procedure', name:'Wrong operation',
    tell:'Divided where you should multiply. Added percents that needed to compound. Subtracted where the model adds.',
    fix:'Predict whether your answer should come out bigger or smaller, then check your operation against that.',
    felt:'I multiplied when I should have divided, or the other way round' },
  'formula-mixup':  { fam:'procedure', name:'Wrong formula',
    tell:'Circumference for area. Lateral surface for volume. Perpendicular slope for parallel. 45-45-90 for 30-60-90.',
    fix:'Open the formula sheet, and name the condition the figure is actually giving you.',
    felt:'I used the wrong formula' },
  'wrong-ratio':    { fam:'procedure', name:'Wrong trig ratio',
    tell:'Cosine reported for sine, or a ratio built from the two legs instead of a leg and the hypotenuse.',
    fix:'Label opposite, adjacent, and hypotenuse for the angle named, then write the ratio.',
    felt:'I used the wrong trig ratio' },
  'extraneous-root':{ fam:'procedure', name:'A root that does not work',
    tell:'A solution of the squared equation that fails in the original, usually by making a square root negative.',
    fix:'Every radical or rational equation gets both candidates checked in the original.',
    felt:'I did not check my answer back in the original equation' },
  'algebra-rule':   { fam:'procedure', name:'Algebra rule misapplied',
    tell:'Terms canceled instead of factors. Exponents multiplied instead of added. A 2 that never got distributed.',
    fix:'Only whole factors cancel. Test your simplified version against the original with x = 2.',
    felt:'I canceled or combined something I was not allowed to' },
  'setup-error':    { fam:'procedure', name:'Set up wrong',
    tell:'Quantities swapped. Growth factor and period reversed. The scale factor applied to the wrong side.',
    fix:'Try your model on one easy input before you trust it.',
    felt:'I set the problem up wrong before I started solving' },
  'arith-slip':     { fam:'procedure', name:'Arithmetic slip',
    tell:'A clean method with one bad number. 180 minus 101. A decimal in the wrong place.',
    fix:'Redo that one calculation, then test the answer back in the question.',
    felt:'The method was right and I made an arithmetic mistake' }
};

/* ---------------- strategy by RW skill (deterministic) ---------------- */
window.SKILL_STRAT = {
  'Central Ideas and Details':'predict-first',
  'Command of Evidence (Textual)':'claim-fit',
  'Command of Evidence (Quantitative)':'data-discipline',
  'Inferences':'smallest-step',
  'Words in Context':'context-word',
  'Text Structure and Purpose':'author-move',
  'Cross-Text Connections':'concession-map',
  'Transitions':'relationship-first',
  'Rhetorical Synthesis':'goal-checklist',
  'Boundaries':'boundary-test',
  'Form, Structure, and Sense':'choice-split'
};

/* ---------------- per-question annotations ----------------
   Each wrong choice is classified by the trick it was built from. */
window.TAGS = {
  /* ---- Reading and Writing ---- */
  rw001:{traps:{1:'extreme',2:'extreme',3:'not-in-text'}},
  rw002:{traps:{0:'half-right',2:'contradicts',3:'true-but-irrelevant'}},
  rw003:{traps:{1:'reversed',2:'contradicts',3:'not-in-text'}},
  rw004:{traps:{0:'not-in-text',2:'not-in-text',3:'contradicts'}},
  rw005:{traps:{0:'extreme',2:'too-narrow',3:'not-in-text'}},
  rw006:{traps:{0:'true-but-irrelevant',1:'true-but-irrelevant',3:'opposite-task'}},
  rw007:{traps:{1:'opposite-task',2:'true-but-irrelevant',3:'opposite-task'}},
  rw008:{traps:{0:'true-but-irrelevant',1:'close-but-off',2:'half-right'}},
  rw009:{traps:{0:'true-but-irrelevant',1:'opposite-task',3:'true-but-irrelevant'}},
  rw010:{traps:{1:'one-sided',2:'one-sided',3:'misread-data'}},
  rw011:{traps:{0:'one-sided',1:'true-but-irrelevant',3:'true-but-irrelevant'}},
  rw012:{traps:{0:'true-but-irrelevant',1:'true-but-irrelevant',2:'one-sided'}},
  rw013:{traps:{0:'one-sided',1:'one-sided',3:'misread-data'}},
  rw014:{traps:{1:'extreme',2:'not-in-text',3:'not-in-text'}},
  rw015:{traps:{0:'contradicts',1:'close-but-off',3:'not-in-text'}},
  rw016:{traps:{0:'extreme',1:'reversed',2:'not-in-text'}},
  rw017:{traps:{1:'extreme',2:'contradicts',3:'reversed'}},
  rw018:{traps:{0:'contradicts',2:'extreme',3:'not-in-text'}},
  rw019:{traps:{0:'reversed',1:'not-in-text',3:'not-in-text'}},
  rw020:{traps:{1:'close-but-off',2:'dictionary-default',3:'close-but-off'}},
  rw021:{traps:{1:'close-but-off',2:'reversed',3:'close-but-off'}},
  rw022:{traps:{0:'reversed',1:'dictionary-default',3:'close-but-off'}},
  rw023:{traps:{0:'contradicts',2:'reversed',3:'not-in-text'}},
  rw024:{traps:{0:'reversed',1:'dictionary-default',2:'extreme'}},
  rw025:{traps:{0:'close-but-off',1:'close-but-off',2:'reversed'}},
  rw026:{traps:{0:'dictionary-default',1:'close-but-off',3:'reversed'}},
  rw027:{traps:{0:'reversed',1:'not-in-text',2:'wrong-actor'}},
  rw028:{traps:{1:'close-but-off',2:'too-narrow',3:'not-in-text'}},
  rw029:{traps:{0:'not-in-text',2:'close-but-off',3:'reversed'}},
  rw030:{traps:{0:'wrong-order',1:'not-in-text',3:'not-in-text'}},
  rw031:{traps:{0:'reversed',1:'reversed',2:'close-but-off'}},
  rw032:{traps:{1:'close-but-off',2:'wrong-actor',3:'not-in-text'}},
  rw033:{traps:{1:'not-in-text',2:'wrong-order',3:'reversed'}},
  rw034:{traps:{0:'extreme',2:'opposite-task',3:'reversed'}},
  rw035:{traps:{0:'reversed',1:'extreme',2:'not-in-text'}},
  rw036:{traps:{1:'contradicts',2:'contradicts',3:'reversed'}},
  rw037:{traps:{0:'contradicts',1:'not-in-text',3:'reversed'}},
  rw038:{traps:{1:'wrong-relationship',2:'wrong-relationship',3:'wrong-relationship'}},
  rw039:{traps:{0:'wrong-relationship',1:'wrong-relationship',2:'wrong-relationship'}},
  rw040:{traps:{0:'wrong-relationship',2:'wrong-relationship',3:'wrong-relationship'}},
  rw041:{traps:{0:'wrong-relationship',1:'wrong-relationship',3:'wrong-relationship'}},
  rw042:{traps:{1:'wrong-relationship',2:'wrong-relationship',3:'wrong-relationship'}},
  rw043:{traps:{0:'wrong-relationship',2:'wrong-relationship',3:'wrong-relationship'}},
  rw044:{traps:{0:'wrong-relationship',2:'wrong-relationship',3:'wrong-relationship'}},
  rw045:{traps:{1:'true-but-irrelevant',2:'true-but-irrelevant',3:'half-right'}},
  rw046:{traps:{0:'half-right',1:'opposite-task',3:'one-sided'}},
  rw047:{traps:{0:'true-but-irrelevant',1:'half-right',2:'half-right'}},
  rw048:{traps:{0:'one-sided',1:'true-but-irrelevant',3:'one-sided'}},
  rw049:{traps:{0:'half-right',1:'restates',2:'close-but-off'}},
  rw050:{traps:{0:'one-sided',1:'extreme',2:'unstated-cause'}},
  rw051:{traps:{0:'true-but-irrelevant',2:'half-right',3:'half-right'}},
  rw052:{traps:{1:'comma-splice',2:'fragment',3:'sounds-right'}},
  rw053:{traps:{0:'wrong-mark',2:'wrong-mark',3:'wrong-mark'}},
  rw054:{traps:{0:'unpaired',2:'wrong-mark',3:'wrong-mark'}},
  rw055:{traps:{0:'wrong-mark',1:'unpaired',3:'unpaired'}},
  rw056:{traps:{0:'split-subject-verb',1:'wrong-mark',3:'split-subject-verb'}},
  rw057:{traps:{0:'wrong-mark',1:'wrong-mark',2:'wrong-mark'}},
  rw058:{traps:{1:'split-subject-verb',2:'split-subject-verb',3:'wrong-mark'}},
  rw059:{traps:{0:'sounds-right',1:'sounds-right',2:'wrong-mark'}},
  rw060:{strat:'subject-verb', traps:{0:'agreement-by-ear',2:'agreement-by-ear',3:'wrong-tense'}},
  rw061:{strat:'pronoun-check', traps:{0:'pronoun-ref',2:'close-but-off',3:'fragment'}},
  rw062:{strat:'verb-time', traps:{1:'wrong-tense',2:'wrong-tense',3:'wrong-tense'}},
  rw063:{strat:'apostrophe-count', traps:{0:'possessive-count',1:'possessive-count',2:'possessive-count'}},
  rw064:{strat:'modifier-attach', traps:{0:'dangling',1:'dangling',2:'comma-splice'}},
  rw065:{strat:'parallel-pairs', traps:{0:'unparallel',2:'unparallel',3:'unparallel'}},
  rw066:{strat:'subject-verb', traps:{0:'agreement-by-ear',1:'wrong-tense',3:'wrong-tense'}},
  rw067:{strat:'parallel-pairs', traps:{0:'illogical-comparison',1:'illogical-comparison',3:'illogical-comparison'}},
  rw068:{strat:'verb-time', traps:{0:'wrong-tense',1:'sounds-right',3:'fragment'}},

  /* ---- added for trap coverage ---- */
  rw069:{traps:{0:'comma-splice',1:'fragment',2:'sounds-right'}},
  rw070:{traps:{0:'unpaired',2:'wrong-mark',3:'unpaired'}},
  rw071:{traps:{1:'wrong-mark',2:'wrong-mark',3:'wrong-mark'}},
  rw072:{traps:{0:'comma-splice',1:'fragment',3:'wrong-mark'}},
  rw073:{strat:'subject-verb', traps:{0:'agreement-by-ear',1:'split-subject-verb',3:'wrong-mark'}},
  rw074:{strat:'apostrophe-count', traps:{0:'possessive-count',2:'possessive-count',3:'possessive-count'}},
  rw075:{strat:'modifier-attach', traps:{1:'dangling',2:'dangling',3:'dangling'}},
  rw076:{strat:'parallel-pairs', traps:{0:'unparallel',1:'unparallel',2:'unparallel'}},
  rw077:{strat:'parallel-pairs', traps:{0:'illogical-comparison',2:'illogical-comparison',3:'illogical-comparison'}},
  rw078:{traps:{0:'true-but-irrelevant',1:'too-narrow',3:'extreme'}},
  rw079:{traps:{0:'not-in-text',1:'reversed',3:'wrong-order'}},
  rw080:{traps:{1:'wrong-actor',2:'close-but-off',3:'reversed'}},
  rw081:{traps:{0:'contradicts',1:'unstated-cause',3:'reversed'}},
  rw082:{traps:{0:'restates',2:'restates',3:'true-but-irrelevant'}},
  rw083:{traps:{0:'restates',1:'true-but-irrelevant',2:'half-right'}},
  rw084:{traps:{0:'one-sided',1:'opposite-task',3:'one-sided'}},

  rw085:{traps:{1:'comma-splice',2:'fragment',3:'sounds-right'}},
  rw086:{traps:{0:'wrong-actor',2:'wrong-actor',3:'unstated-cause'}},
  rw087:{traps:{0:'contradicts',1:'extreme',2:'unstated-cause'}},

  /* ---- Math ---- */
  m001:{strat:'solve-check', traps:{0:'arith-slip',2:'one-step-short',3:'operation-swap'}},
  m002:{strat:'translate', traps:{1:'wrong-target',2:'unit-miss',3:'close-but-off'}},
  m003:{strat:'solve-check'},
  m004:{strat:'coordinate-geometry', traps:{1:'flipped-ratio',2:'wrong-target',3:'arith-slip'}},
  m005:{strat:'systems-tactics', traps:{0:'wrong-target',1:'wrong-target',2:'wrong-target'}},
  m006:{strat:'translate', traps:{1:'reversed',2:'setup-error',3:'setup-error'}},
  m007:{strat:'systems-tactics', traps:{0:'operation-swap',2:'wrong-target',3:'one-step-short'}},
  m008:{strat:'translate', traps:{1:'setup-error',2:'sign-slip',3:'setup-error'}},
  m009:{strat:'coordinate-geometry', traps:{0:'setup-error',1:'formula-mixup',2:'sign-slip'}},
  m010:{strat:'systems-tactics', traps:{1:'arith-slip',2:'wrong-target',3:'arith-slip'}},
  m011:{strat:'count-solutions'},
  m012:{strat:'choice-tactics', traps:{0:'half-right',1:'setup-error',2:'half-right'}},
  m013:{strat:'translate'},
  m014:{strat:'solve-check', traps:{0:'algebra-rule',1:'algebra-rule',3:'operation-swap'}},
  m015:{strat:'solve-check', traps:{0:'sign-slip',1:'wrong-target',2:'one-step-short'}},
  m016:{strat:'count-solutions'},
  m017:{strat:'translate', traps:{0:'arith-slip',1:'wrong-target',3:'wrong-target'}},
  m018:{strat:'systems-tactics', traps:{0:'arith-slip',1:'arith-slip',3:'wrong-target'}},
  m019:{strat:'translate'},
  m020:{strat:'solve-check', traps:{0:'sign-slip',2:'arith-slip',3:'arith-slip'}},
  m021:{strat:'function-notation', traps:{0:'sign-slip',1:'sign-slip',3:'algebra-rule'}},
  m022:{strat:'function-behavior', traps:{0:'setup-error',2:'setup-error',3:'setup-error'}},
  m023:{strat:'expression-structure', traps:{0:'algebra-rule',1:'algebra-rule',2:'arith-slip'}},
  m024:{strat:'function-behavior', traps:{0:'wrong-target',2:'wrong-target',3:'arith-slip'}},
  m025:{strat:'solve-check', traps:{0:'extraneous-root',2:'arith-slip',3:'arith-slip'}},
  m026:{strat:'count-solutions'},
  m027:{strat:'function-notation', traps:{0:'wrong-order',1:'setup-error',2:'sign-slip'}},
  m028:{strat:'expression-structure', traps:{0:'algebra-rule',1:'algebra-rule',2:'sign-slip'}},
  m029:{strat:'function-behavior', traps:{0:'arith-slip',1:'arith-slip',3:'wrong-target'}},
  m030:{strat:'function-behavior'},
  m031:{strat:'function-behavior', traps:{1:'unit-miss',2:'setup-error',3:'setup-error'}},
  m032:{strat:'expression-structure'},
  m033:{strat:'solve-check', traps:{0:'algebra-rule',2:'sign-slip',3:'algebra-rule'}},
  m034:{strat:'translate', traps:{1:'arith-slip',2:'wrong-target',3:'arith-slip'}},
  m035:{strat:'expression-structure'},
  m036:{strat:'function-behavior', traps:{1:'arith-slip',2:'wrong-target',3:'arith-slip'}},
  m037:{strat:'solve-check', traps:{1:'arith-slip',2:'arith-slip',3:'sign-slip'}},
  m038:{strat:'expression-structure', traps:{1:'algebra-rule',2:'algebra-rule',3:'algebra-rule'}},
  m039:{strat:'proportional-reasoning', traps:{0:'wrong-target',1:'wrong-denominator',3:'wrong-target'}},
  m040:{strat:'proportional-reasoning'},
  m041:{strat:'data-inference', traps:{1:'reversed',2:'close-but-off',3:'half-right'}},
  m042:{strat:'data-inference', traps:{0:'wrong-denominator',1:'wrong-target',3:'misread-data'}},
  m043:{strat:'proportional-reasoning', traps:{0:'setup-error',1:'one-step-short',2:'setup-error'}},
  m044:{strat:'proportional-reasoning', traps:{0:'operation-swap',1:'wrong-target',2:'arith-slip'}},
  m045:{strat:'data-inference', traps:{0:'extreme',2:'half-right',3:'extreme'}},
  m046:{strat:'data-inference', traps:{0:'wrong-target',2:'unit-miss',3:'close-but-off'}},
  m047:{strat:'proportional-reasoning'},
  m048:{strat:'proportional-reasoning'},
  m049:{strat:'geometry-toolkit', traps:{0:'arith-slip',2:'wrong-target',3:'wrong-target'}},
  m050:{strat:'geometry-toolkit', traps:{0:'formula-mixup',2:'formula-mixup',3:'formula-mixup'}},
  m051:{strat:'geometry-toolkit', traps:{0:'wrong-ratio',2:'wrong-ratio',3:'flipped-ratio'}},
  m052:{strat:'geometry-toolkit', traps:{0:'formula-mixup',1:'formula-mixup',3:'formula-mixup'}},
  m053:{strat:'geometry-toolkit', traps:{0:'setup-error',1:'setup-error',3:'setup-error'}},
  m054:{strat:'coordinate-geometry'},
  m055:{strat:'geometry-toolkit', traps:{0:'setup-error',1:'setup-error',2:'formula-mixup'}},
  m056:{strat:'geometry-toolkit', traps:{0:'wrong-ratio',1:'wrong-ratio',3:'flipped-ratio'}},
  m057:{strat:'coordinate-geometry'},
  m058:{strat:'geometry-toolkit'},
  m059:{strat:'geometry-toolkit', traps:{0:'sign-slip',1:'one-step-short',2:'formula-mixup'}},
  m060:{strat:'geometry-toolkit', traps:{0:'formula-mixup',1:'flipped-ratio',2:'wrong-target'}},
  /* ---- added for trap coverage ---- */
  m061:{strat:'solve-check', traps:{0:'extraneous-root',1:'arith-slip',2:'extraneous-root'}},
  m062:{strat:'solve-check', traps:{1:'extraneous-root',2:'algebra-rule',3:'setup-error'}},
  m063:{strat:'solve-check', traps:{0:'half-right',1:'half-right',3:'extraneous-root'}},
  m064:{strat:'data-inference', traps:{0:'wrong-denominator',1:'wrong-target',3:'wrong-denominator'}},
  m065:{strat:'proportional-reasoning', traps:{0:'wrong-denominator',2:'wrong-target',3:'wrong-target'}},
  m066:{strat:'proportional-reasoning', traps:{1:'unit-miss',2:'operation-swap',3:'unit-miss'}},
  m067:{strat:'function-notation', traps:{0:'misread-data',1:'one-step-short',2:'wrong-target'}},
  m068:{strat:'expression-structure', traps:{0:'algebra-rule',1:'sign-slip',2:'algebra-rule'}},
  m069:{strat:'choice-tactics', traps:{1:'half-right',2:'half-right',3:'half-right'}},
  m070:{strat:'systems-tactics', traps:{0:'arith-slip',1:'wrong-target',2:'arith-slip'}},
  m071:{strat:'function-notation', traps:{1:'reversed',2:'close-but-off',3:'setup-error'}},

  /* --- added after the strategy review: Desmos, solution counting,
         pronouns, verb time, apostrophes, modifiers --- */
  m072:{strat:'desmos-first', traps:{0:'extraneous-root',2:'extraneous-root',3:'sign-slip'}},
  m073:{strat:'desmos-first', traps:{0:'wrong-target',1:'wrong-target',3:'operation-swap'}},
  m074:{strat:'desmos-first', traps:{1:'wrong-target',2:'wrong-target',3:'arith-slip'}},
  m075:{strat:'desmos-first', traps:{0:'sign-slip',1:'algebra-rule',3:'algebra-rule'}},
  m076:{strat:'count-solutions', traps:{1:'wrong-target',2:'wrong-target',3:'sign-slip'}},
  m077:{strat:'count-solutions', traps:{0:'one-step-short',2:'wrong-target',3:'sign-slip'}},
  m078:{strat:'choice-tactics', traps:{0:'algebra-rule',2:'setup-error',3:'arith-slip'}},
  m079:{strat:'choice-tactics', traps:{0:'arith-slip',2:'algebra-rule',3:'algebra-rule'}},
  rw088:{strat:'pronoun-check', traps:{1:'possessive-count',2:'pronoun-ref',3:'sounds-right'}},
  rw089:{strat:'pronoun-check', traps:{0:'pronoun-ref',1:'pronoun-ref',3:'fragment'}},
  rw090:{strat:'pronoun-check', traps:{0:'pronoun-ref',2:'possessive-count',3:'sounds-right'}},
  rw091:{strat:'pronoun-check', traps:{0:'pronoun-ref',2:'possessive-count',3:'sounds-right'}},
  rw092:{strat:'verb-time', traps:{0:'wrong-tense',1:'sounds-right',3:'wrong-tense'}},
  rw093:{strat:'verb-time', traps:{0:'sounds-right',2:'wrong-tense',3:'wrong-tense'}},
  rw094:{strat:'apostrophe-count', traps:{0:'possessive-count',1:'possessive-count',3:'possessive-count'}},
  rw095:{strat:'apostrophe-count', traps:{1:'possessive-count',2:'possessive-count',3:'pronoun-ref'}},
  rw096:{strat:'modifier-attach', traps:{1:'dangling',2:'comma-splice',3:'dangling'}},
  rw097:{strat:'modifier-attach', traps:{1:'dangling',2:'dangling',3:'comma-splice'}},
  rw098:{traps:{0:'one-sided',1:'misread-data',3:'misread-data'}},
  rw099:{strat:'subject-verb', traps:{0:'agreement-by-ear',2:'agreement-by-ear',3:'wrong-tense'}},
  rw100:{traps:{0:'too-narrow',1:'extreme',2:'contradicts'}}
};

/* resolve the tags for a question */
window.tagsFor = function (q) {
  var t = window.TAGS[q.id] || {};
  return {
    strat: t.strat || window.SKILL_STRAT[q.skill] || null,
    traps: t.traps || {}
  };
};
