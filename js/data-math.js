/* ============================================================
   MATH question bank

   Four domains, multiple-choice and student-produced response (SPR)
   items in roughly the SAT's 3:1 ratio.

   type:'spr' items carry `answers`, an array of accepted forms.
   Every item carries strategy / hint / steps / traps.

   The answer key is balanced across A, B, C and D; verify.js checks it.
   ============================================================ */
window.MATH_BANK = [];
window.MATH_BANK.push(
{
  id: "m001",
  domain: "Algebra",
  skill: "Linear equations in one variable",
  difficulty: "E",
  type: "mc",
  prompt: "If 5(x − 3) = 40, what is the value of x?",
  choices: [
    "5",
    "11",
    "8",
    "43"
  ],
  answer: 1,
  strategy: "Undo the operations in reverse order. Whatever is done last to the variable is what you undo first.",
  hint: "Divide both sides by 5 before you touch the parentheses.",
  steps: [
    "Divide both sides by 5: <div class=“mathwork”>5(x − 3) = 40\nx − 3 = 8</div>",
    "Add 3 to both sides: <div class=“mathwork”>x = 11</div>",
    "Check by substituting: 5(11 − 3) = 5(8) = 40. ✓"
  ],
  traps: {
    0: "This is 40 ÷ 8, or the answer to a different equation. Substitute it back: 5(5 − 3) = 10, not 40.",
    2: "You stopped one step early, 8 is the value of x − 3, not of x.",
    3: "This adds 3 to 40 instead of dividing first: distributing gives 5x − 15 = 40, so 5x = 55, not x = 43."
  }
},

{
  id: "m002",
  domain: "Algebra",
  skill: "Linear functions",
  difficulty: "E",
  type: "mc",
  prompt: "A phone plan charges a fixed monthly fee plus $0.04 for each minute of international calling. The total monthly cost C, in dollars, for m minutes of international calling is given by C = 0.04m + 12. What does the 12 represent?",
  choices: [
    "The monthly cost, in dollars, when no international minutes are used",
    "The cost, in dollars, of each minute of international calling",
    "The number of international minutes included in the plan",
    "The total cost, in dollars, of 12 international minutes"
  ],
  answer: 0,
  strategy: "In y = mx + b, the slope is the per-unit rate and the intercept is the starting value. To interpret b, set the input to zero.",
  hint: "Let m = 0 and see what the equation says the cost is.",
  steps: [
    "Substitute m = 0: <div class=“mathwork”>C = 0.04(0) + 12 = 12</div>",
    "So $12 is the cost when zero international minutes are used, the fixed fee.",
    "The 0.04 is the per-minute rate, since it is multiplied by m.",
    "Choice A describes the value at zero minutes."
  ],
  traps: {
    1: "That is 0.04, the coefficient of m. Rate and starting value are the two things this question type asks you to keep straight.",
    2: "12 has units of dollars, not minutes. Always check units when interpreting a constant.",
    3: "12 minutes would cost 0.04(12) + 12 = $12.48. The 12 in the equation is a fee, not a quantity of minutes."
  }
},

{
  id: "m003",
  domain: "Algebra",
  skill: "Linear equations in one variable",
  difficulty: "E",
  type: "spr",
  prompt: "If 3x + 7 = 2x + 19, what is the value of x?",
  answers: ["12"],
  strategy: "Get every variable term on one side and every constant on the other, then divide.",
  hint: "Subtract 2x from both sides first.",
  steps: [
    "Subtract 2x from both sides: <div class=“mathwork”>3x + 7 = 2x + 19\nx + 7 = 19</div>",
    "Subtract 7 from both sides: <div class=“mathwork”>x = 12</div>",
    "Check: 3(12) + 7 = 43 and 2(12) + 19 = 43. ✓"
  ],
  traps: {}
},

{
  id: "m004",
  domain: "Algebra",
  skill: "Linear equations in two variables",
  difficulty: "E",
  type: "mc",
  prompt: "Line ℓ passes through the points (2, 5) and (6, 17) in the xy-plane. What is the slope of line ℓ?",
  choices: [
    "3",
    "1/3",
    "4",
    "11/4"
  ],
  answer: 0,
  strategy: "Slope is rise over run: (y₂ − y₁)/(x₂ − x₁). Keep the order of the points the same in the numerator and denominator.",
  hint: "The y-values change by how much? The x-values?",
  steps: [
    "Compute the change in y: 17 − 5 = 12.",
    "Compute the change in x: 6 − 2 = 4.",
    "Divide: <div class=“mathwork”>slope = 12 / 4 = 3</div>"
  ],
  traps: {
    1: "This is run over rise, 4/12. The most common slope error is flipping the fraction.",
    2: "This is the change in x alone.",
    3: "This is (17 − 6)/(5 − 2), the coordinates got mixed between the two points. Label your points before subtracting."
  }
},

{
  id: "m005",
  domain: "Algebra",
  skill: "Systems of two linear equations",
  difficulty: "M",
  type: "mc",
  prompt: "<div class=“mathwork”>2x + 3y = 19\nx − y = 2</div>If (x, y) is the solution to the system of equations above, what is the value of x + y?",
  choices: [
    "6",
    "7",
    "11",
    "8"
  ],
  answer: 3,
  strategy: "Substitution is fastest when one equation already has a coefficient of 1. Solve that one for a variable and substitute.",
  hint: "The second equation gives x = y + 2.",
  steps: [
    "From x − y = 2, solve for x: <div class=“mathwork”>x = y + 2</div>",
    "Substitute into the first equation: <div class=“mathwork”>2(y + 2) + 3y = 19\n2y + 4 + 3y = 19\n5y = 15\ny = 3</div>",
    "Back-substitute: x = 3 + 2 = 5.",
    "The question asks for x + y: <div class=“mathwork”>5 + 3 = 8</div>"
  ],
  traps: {
    0: "This is 2y, or x + 1. Re-read what the question asks for, systems questions often ask for a combination, not for x alone.",
    1: "This is x + 2 or y + 4; check both values in both equations.",
    2: "This is x + 2y. Write down x = 5 and y = 3 separately before combining them."
  }
},

{
  id: "m006",
  domain: "Algebra",
  skill: "Linear inequalities",
  difficulty: "M",
  type: "mc",
  prompt: "A delivery van can carry a maximum load of 1,800 pounds. The van is loaded with 12 crates that weigh 85 pounds each and b boxes that weigh 40 pounds each. Which inequality represents this situation?",
  choices: [
    "40b + 1,020 ≤ 1,800",
    "40b + 1,020 ≥ 1,800",
    "85b + 480 ≤ 1,800",
    "40b − 1,020 ≤ 1,800"
  ],
  answer: 0,
  strategy: "Translate one phrase at a time, then let “at most” become ≤ and “at least” become ≥. Compute any number you can before comparing choices.",
  hint: "First find the total weight of the 12 crates.",
  steps: [
    "Weight of the crates: <div class=“mathwork”>12 × 85 = 1,020 pounds</div>",
    "Weight of the boxes: 40 pounds each, b boxes, so 40b.",
    "Total load: 40b + 1,020.",
    "“A maximum load of 1,800” means the total cannot exceed 1,800: <div class=“mathwork”>40b + 1,020 ≤ 1,800</div>"
  ],
  traps: {
    1: "Reverses the inequality. “Maximum” caps the total from above, so the symbol must be ≤.",
    2: "Swaps the two weights: it multiplies b by 85 and uses 12 × 40 = 480 for the crates.",
    3: "Subtracts the crate weight instead of adding it. The crates are part of the load, not a discount on it."
  }
},

{
  id: "m007",
  domain: "Algebra",
  skill: "Systems of two linear equations",
  difficulty: "M",
  type: "mc",
  prompt: "<div class=“mathwork”>3x + 2y = 26\n3x − 2y = 4</div>What is the value of x in the solution to the system of equations above?",
  choices: [
    "2",
    "5",
    "5.5",
    "15"
  ],
  answer: 1,
  strategy: "When the same coefficient appears with opposite signs, add the equations. Elimination beats substitution whenever a variable cancels for free.",
  hint: "What happens to the y terms if you add the two equations?",
  steps: [
    "Add the equations; +2y and −2y cancel: <div class=“mathwork”>(3x + 3x) + (2y − 2y) = 26 + 4\n6x = 30</div>",
    "Divide by 6: <div class=“mathwork”>x = 5</div>",
    "Check by finding y: 3(5) + 2y = 26 → 2y = 11 → y = 5.5, and 15 − 11 = 4. ✓"
  ],
  traps: {
    0: "Comes from subtracting the equations instead of adding, which eliminates x rather than y and leaves 4y = 22.",
    2: "This is y, not x. The question names the variable it wants, circle it.",
    3: "This is 3x, one step short of the answer."
  }
},

{
  id: "m008",
  domain: "Algebra",
  skill: "Linear functions",
  difficulty: "E",
  type: "mc",
  figure: "<table class=“data”><tr><th>x</th><th>1</th><th>2</th><th>3</th><th>4</th></tr><tr><th>f(x)</th><td>7</td><td>11</td><td>15</td><td>19</td></tr></table>",
  prompt: "The table above gives values of the linear function f. Which equation defines f?",
  choices: [
    "f(x) = 4x + 3",
    "f(x) = 3x + 4",
    "f(x) = 4x − 3",
    "f(x) = x + 6"
  ],
  answer: 0,
  strategy: "From a table, find the constant difference (that is the slope), then work backward one step to x = 0 for the intercept.",
  hint: "f(x) goes up by the same amount each time x goes up by 1. And what would f(0) be?",
  steps: [
    "Differences in f(x): 11 − 7 = 4, 15 − 11 = 4, 19 − 15 = 4. The slope is 4.",
    "Step back from x = 1 to x = 0: 7 − 4 = 3, so f(0) = 3 and the intercept is 3.",
    "So f(x) = 4x + 3.",
    "Verify with a row you did not use: f(4) = 4(4) + 3 = 19. ✓"
  ],
  traps: {
    1: "Swaps slope and intercept. Test it: 3(1) + 4 = 7 works, but 3(2) + 4 = 10, not 11. Always check a second row.",
    2: "Right slope, wrong sign on the intercept: 4(1) − 3 = 1, not 7.",
    3: "Slope of 1. This fits x = 1 only by accident."
  }
},

{
  id: "m009",
  domain: "Algebra",
  skill: "Linear equations in two variables",
  difficulty: "M",
  type: "mc",
  prompt: "Line ℓ is defined by 3x + 4y = 12. Line k is parallel to line ℓ and passes through the point (0, −5). Which equation defines line k?",
  choices: [
    "4x + 3y = −15",
    "4x − 3y = 15",
    "3x + 4y = 20",
    "3x + 4y = −20"
  ],
  answer: 3,
  strategy: "Parallel lines share a slope. In standard form Ax + By = C, two lines are parallel exactly when A and B match (up to a common factor) and only C differs.",
  hint: "Keep 3x + 4y and just find the new constant by plugging in the point.",
  steps: [
    "Parallel means the same slope, so line k has the form 3x + 4y = C.",
    "Substitute the point (0, −5): <div class=“mathwork”>3(0) + 4(−5) = C\n−20 = C</div>",
    "So line k is 3x + 4y = −20.",
    "Sanity check the slope: 4y = −3x + 12 gives slope −3/4 for ℓ, and the same for k. ✓"
  ],
  traps: {
    0: "Swaps the coefficients of x and y, which changes the slope to −4/3.",
    1: "Uses the negative reciprocal slope, 4/3. That is the condition for <em>perpendicular</em> lines, not parallel ones.",
    2: "Right form but the sign of the constant is wrong: 4(−5) = −20, not +20."
  }
},

{
  id: "m010",
  domain: "Algebra",
  skill: "Systems of two linear equations",
  difficulty: "M",
  type: "mc",
  prompt: "At a bake sale, muffins cost $2 each and scones cost $3 each. A customer buys a total of 14 items and pays $34. How many scones does the customer buy?",
  choices: [
    "6",
    "4",
    "8",
    "10"
  ],
  answer: 0,
  strategy: "Two unknowns need two equations: one counting items, one counting money. Define your variables in writing before you set anything up.",
  hint: "Let m be muffins and s be scones. Write the count equation and the cost equation.",
  steps: [
    "Let m = muffins and s = scones. Count: <div class=“mathwork”>m + s = 14</div>",
    "Cost: <div class=“mathwork”>2m + 3s = 34</div>",
    "Substitute m = 14 − s: <div class=“mathwork”>2(14 − s) + 3s = 34\n28 − 2s + 3s = 34\ns = 6</div>",
    "Check: 8 muffins ($16) + 6 scones ($18) = $34, and 8 + 6 = 14 items. ✓"
  ],
  traps: {
    1: "Try it: 10 muffins and 4 scones cost 20 + 12 = $32, not $34.",
    2: "This is the number of muffins. The question asks for scones, a substitution you completed but did not finish reading.",
    3: "10 scones and 4 muffins cost 30 + 8 = $38."
  }
},

{
  id: "m011",
  domain: "Algebra",
  skill: "Linear equations in one variable",
  difficulty: "H",
  type: "spr",
  prompt: "4(3x − 5) = ax + b<br><br>In the equation above, a and b are constants. If the equation has infinitely many solutions, what is the value of a + b?",
  answers: ["-8"],
  strategy: "Infinitely many solutions means the two sides are the <em>same</em> expression. Expand and match coefficients term by term.",
  hint: "Distribute the left side, then compare the x terms with the x terms and the constants with the constants.",
  steps: [
    "Expand the left side: <div class=“mathwork”>4(3x − 5) = 12x − 20</div>",
    "For the equation 12x − 20 = ax + b to hold for every x, the two sides must be identical.",
    "Match coefficients of x: a = 12. Match constants: b = −20.",
    "Add: <div class=“mathwork”>a + b = 12 + (−20) = −8</div>"
  ],
  traps: {}
},

{
  id: "m012",
  domain: "Algebra",
  skill: "Linear inequalities",
  difficulty: "H",
  type: "mc",
  prompt: "<div class=“mathwork”>y > 2x − 1\ny ≤ −x + 5</div>Which of the following ordered pairs (x, y) is a solution to the system of inequalities above?",
  choices: [
    "(0, −2)",
    "(4, 2)",
    "(2, 4)",
    "(1, 3)"
  ],
  answer: 3,
  strategy: "Do not graph. Test each point in both inequalities and stop as soon as one fails. That is far faster than sketching two regions.",
  hint: "A solution has to satisfy both inequalities, not just one.",
  steps: [
    "Test (0, −2): is −2 > 2(0) − 1 = −1? No. Eliminated.",
    "Test (1, 3): is 3 > 2(1) − 1 = 1? Yes. Is 3 ≤ −1 + 5 = 4? Yes. Both hold.",
    "Test (2, 4): is 4 > 3? Yes. Is 4 ≤ −2 + 5 = 3? No. Eliminated.",
    "Test (4, 2): is 2 > 2(4) − 1 = 7? No. Eliminated. Only (1, 3) works."
  ],
  traps: {
    0: "Satisfies the second inequality but not the first.",
    1: "Satisfies the second inequality only.",
    2: "Satisfies the first but misses the second by 1. Points that pass one test and fail the other are the whole point of this question type."
  }
},

{
  id: "m013",
  domain: "Algebra",
  skill: "Linear functions",
  difficulty: "H",
  type: "spr",
  prompt: "A hot-air balloon descends at a constant rate. Its altitude was 2,400 feet 3 minutes after the descent began and 1,500 feet 9 minutes after the descent began. At this rate, how many minutes after the descent began will the balloon reach an altitude of 300 feet?",
  answers: ["17"],
  strategy: "Constant rate means a linear model. Find the rate from the two given points, write the equation, then solve for the input you want.",
  hint: "How many feet does the balloon drop per minute?",
  steps: [
    "Rate of change: <div class=“mathwork”>(1,500 − 2,400) / (9 − 3) = −900 / 6 = −150 ft per minute</div>",
    "Write the model using the point (3, 2400): <div class=“mathwork”>A = 2,400 − 150(t − 3)\nA = 2,850 − 150t</div>",
    "Set A = 300 and solve: <div class=“mathwork”>300 = 2,850 − 150t\n150t = 2,550\nt = 17</div>",
    "Check: at t = 17, A = 2,850 − 2,550 = 300. ✓ (Note the question asks for time since the descent <em>began</em>, not since t = 3.)"
  ],
  traps: {}
},

{
  id: "m014",
  domain: "Algebra",
  skill: "Linear equations in two variables",
  difficulty: "M",
  type: "mc",
  prompt: "The formula P = 2(l + w) gives the perimeter P of a rectangle with length l and width w. Which equation correctly expresses w in terms of P and l?",
  choices: [
    "w = (P − l)/2",
    "w = P/2 − 2l",
    "w = (P − 2l)/2",
    "w = 2P − l"
  ],
  answer: 2,
  strategy: "Rearranging a formula uses the same moves as solving an equation, treat every letter except your target as a number.",
  hint: "Divide by 2 first, then subtract l.",
  steps: [
    "Divide both sides by 2: <div class=“mathwork”>P / 2 = l + w</div>",
    "Subtract l: <div class=“mathwork”>w = P/2 − l</div>",
    "Write with a common denominator: <div class=“mathwork”>w = (P − 2l) / 2</div>",
    "Test with numbers: l = 3, w = 4 gives P = 14, and (14 − 6)/2 = 4. ✓"
  ],
  traps: {
    0: "Forgot to distribute the 2 across both l and w: (14 − 3)/2 = 5.5, not 4.",
    1: "Divided only the P by 2 and left l doubled. Test it: (14/2) − 2(3) = 1, not 4.",
    3: "Multiplied by 2 instead of dividing."
  }
},

{
  id: "m015",
  domain: "Algebra",
  skill: "Linear functions",
  difficulty: "E",
  type: "mc",
  prompt: "The function f is defined by f(x) = 3x − 8. If f(c) = 19, what is the value of c?",
  choices: [
    "3.67",
    "27",
    "11",
    "9"
  ],
  answer: 3,
  strategy: "f(c) = 19 just means “substitute c and set the result equal to 19.” Function notation is instruction, not difficulty.",
  hint: "Write 3c − 8 = 19.",
  steps: [
    "Substitute: <div class=“mathwork”>3c − 8 = 19</div>",
    "Add 8: <div class=“mathwork”>3c = 27</div>",
    "Divide by 3: <div class=“mathwork”>c = 9</div>",
    "Check: 3(9) − 8 = 19. ✓"
  ],
  traps: {
    0: "This is (19 − 8)/3, subtracting 8 instead of adding it back.",
    1: "This is 3c, not c.",
    2: "This is 19 − 8, skipping the division by 3."
  }
},

{
  id: "m016",
  domain: "Algebra",
  skill: "Systems of two linear equations",
  difficulty: "H",
  type: "spr",
  prompt: "<div class=“mathwork”>kx + 6y = 12\n4x + 3y = 9</div>In the system above, k is a constant. If the system has no solution, what is the value of k?",
  answers: ["8"],
  strategy: "No solution means parallel lines: the coefficients are proportional but the constants are not. Set up the coefficient ratio and solve.",
  hint: "Compare the y-coefficients first: 6 and 3. What factor takes one equation's coefficients to the other's?",
  steps: [
    "For no solution, the x and y coefficients must be proportional: <div class=“mathwork”>k / 4 = 6 / 3 = 2</div>",
    "So k = 8.",
    "Confirm the lines are parallel and not identical: with k = 8 the first equation is 8x + 6y = 12, which is 2(4x + 3y) = 12, i.e. 4x + 3y = 6.",
    "The second equation says 4x + 3y = 9. Since 6 ≠ 9, the lines never meet, no solution. ✓"
  ],
  traps: {}
},

{
  id: "m017",
  domain: "Algebra",
  skill: "Linear functions",
  difficulty: "E",
  type: "mc",
  prompt: "A tank drains according to the equation V = 480 − 24t, where V is the volume of water remaining, in gallons, t minutes after draining begins. How many minutes does it take for the tank to drain completely?",
  choices: [
    "12",
    "24",
    "20",
    "456"
  ],
  answer: 2,
  strategy: "“Drains completely” translates to V = 0. Turn the words into an equation about the variable before computing.",
  hint: "Set V equal to 0.",
  steps: [
    "Set V = 0: <div class=“mathwork”>0 = 480 − 24t</div>",
    "Solve: <div class=“mathwork”>24t = 480\nt = 20</div>",
    "Interpret: after 20 minutes no water remains. ✓"
  ],
  traps: {
    0: "This is 480/40 or a miscalculation of 480/24. Do the division carefully: 24 × 20 = 480.",
    1: "This is the drain rate, 24 gallons per minute, not a time.",
    3: "This is V after 1 minute (480 − 24), not the time to empty."
  }
},

{
  id: "m018",
  domain: "Algebra",
  skill: "Systems of two linear equations",
  difficulty: "M",
  type: "mc",
  prompt: "A total of 240 tickets were sold for a concert. Adult tickets cost $18 each and student tickets cost $11 each, and total ticket receipts were $3,340. How many adult tickets were sold?",
  choices: [
    "80",
    "120",
    "100",
    "140"
  ],
  answer: 2,
  strategy: "On a two-equation word problem with answer choices, back-solving is often faster: test a choice in the money equation and let the count equation give you the other quantity.",
  hint: "If 100 adult tickets were sold, how many student tickets, and what is the total revenue?",
  steps: [
    "Set up: a + s = 240 and 18a + 11s = 3,340.",
    "Substitute s = 240 − a: <div class=“mathwork”>18a + 11(240 − a) = 3,340\n18a + 2,640 − 11a = 3,340\n7a = 700\na = 100</div>",
    "So 100 adult and 140 student tickets.",
    "Check: 100(18) + 140(11) = 1,800 + 1,540 = 3,340. ✓"
  ],
  traps: {
    0: "80 adult and 160 student tickets give 1,440 + 1,760 = $3,200.",
    1: "120 and 120 give 2,160 + 1,320 = $3,480.",
    3: "This is the number of student tickets."
  }
},

{
  id: "m019",
  domain: "Algebra",
  skill: "Linear inequalities",
  difficulty: "M",
  type: "spr",
  prompt: "A student's grade is the average (arithmetic mean) of five test scores. The student's first four scores are 88, 92, 85, and 94. What is the minimum score the student must earn on the fifth test in order to have an average of at least 90?",
  answers: ["91"],
  strategy: "Convert an average condition into a total: an average of at least 90 across 5 tests means a sum of at least 450. Averages are easier to handle as sums.",
  hint: "What must the five scores add up to?",
  steps: [
    "Required total: <div class=“mathwork”>90 × 5 = 450</div>",
    "Current total: <div class=“mathwork”>88 + 92 + 85 + 94 = 359</div>",
    "Needed on the fifth test: <div class=“mathwork”>450 − 359 = 91</div>",
    "Check: (359 + 91)/5 = 450/5 = 90. ✓ Since the requirement is “at least,” 91 is the minimum."
  ],
  traps: {}
},

{
  id: "m020",
  domain: "Advanced Math",
  skill: "Nonlinear equations in one variable",
  difficulty: "E",
  type: "mc",
  prompt: "What are the solutions to the equation x<sup>2</sup> − 7x + 12 = 0?",
  choices: [
    "x = −4 and x = −3",
    "x = 3 and x = 4",
    "x = 2 and x = 6",
    "x = 1 and x = 12"
  ],
  answer: 1,
  strategy: "To factor x² + bx + c, find two numbers that multiply to c and add to b. Signs: if c is positive and b is negative, both numbers are negative.",
  hint: "Which two numbers multiply to 12 and add to 7?",
  steps: [
    "Look for two numbers with product 12 and sum 7: 3 and 4.",
    "Since the middle term is −7x, both factors are negative: <div class=“mathwork”>x² − 7x + 12 = (x − 3)(x − 4) = 0</div>",
    "Set each factor to zero: x = 3 or x = 4.",
    "Check: 9 − 21 + 12 = 0 ✓ and 16 − 28 + 12 = 0 ✓"
  ],
  traps: {
    0: "Sign error: these are the solutions of x² + 7x + 12 = 0. The roots have the opposite sign of the numbers in the factors.",
    2: "2 and 6 multiply to 12 but add to 8, not 7.",
    3: "1 and 12 multiply to 12 but add to 13."
  }
},

{
  id: "m021",
  domain: "Advanced Math",
  skill: "Nonlinear functions",
  difficulty: "E",
  type: "mc",
  prompt: "The function f is defined by f(x) = 2x<sup>2</sup> − 5x + 1. What is the value of f(−2)?",
  choices: [
    "−1",
    "3",
    "19",
    "27"
  ],
  answer: 2,
  strategy: "Substitute in parentheses. Writing 2(−2)² instead of 2·−2² is what prevents almost every sign error on this question type.",
  hint: "Square before you multiply, and remember −5 times −2 is positive.",
  steps: [
    "Substitute with parentheses: <div class=“mathwork”>f(−2) = 2(−2)² − 5(−2) + 1</div>",
    "Square first: (−2)² = 4, so the first term is 2(4) = 8.",
    "Second term: −5(−2) = +10.",
    "Add: <div class=“mathwork”>8 + 10 + 1 = 19</div>"
  ],
  traps: {
    0: "Comes from making the middle term −10: 8 − 10 + 1 = −1. A negative times a negative is positive.",
    1: "Comes from squaring wrong: treating (−2)² as −4 gives −8 + 10 + 1 = 3.",
    3: "Comes from squaring the coefficient too: (2 × −2)² = 16, then 16 + 10 + 1 = 27. Only the x is squared."
  }
},

{
  id: "m022",
  domain: "Advanced Math",
  skill: "Nonlinear functions",
  difficulty: "E",
  type: "mc",
  prompt: "A colony of bacteria doubles in number every 6 hours. If the colony starts with 500 bacteria, which function gives the number of bacteria, P, after t hours?",
  choices: [
    "P(t) = 500 · 2<sup>6t</sup>",
    "P(t) = 500 · 2<sup>t/6</sup>",
    "P(t) = 500 · 6<sup>2t</sup>",
    "P(t) = 500 + 2<sup>t/6</sup>"
  ],
  answer: 1,
  strategy: "Exponential models look like (initial amount) · (growth factor)^(time ÷ period). The doubling period goes in the denominator of the exponent.",
  hint: "After 6 hours the population should be exactly 1,000. Test each choice at t = 6.",
  steps: [
    "The growth factor is 2 because the colony doubles.",
    "One doubling happens per 6 hours, so the number of doublings after t hours is t/6.",
    "So P(t) = 500 · 2^(t/6).",
    "Test it: at t = 6, P = 500 · 2¹ = 1,000 ✓, and at t = 12, P = 500 · 2² = 2,000 ✓"
  ],
  traps: {
    0: "At t = 6 this gives 500 · 2³⁶, astronomically wrong. Multiplying by the period instead of dividing is the classic error.",
    2: "Uses 6 as the growth factor and 2 as the rate, exactly reversed.",
    3: "Adds instead of multiplies, which makes the growth linear-ish rather than exponential: at t = 6 it gives 502."
  }
},

{
  id: "m023",
  domain: "Advanced Math",
  skill: "Equivalent expressions",
  difficulty: "M",
  type: "mc",
  prompt: "Which expression is equivalent to (3x<sup>2</sup>y<sup>3</sup>)<sup>3</sup> / (9x<sup>3</sup>y<sup>2</sup>), where x and y are positive?",
  choices: [
    "3x<sup>3</sup>y<sup>5</sup>",
    "3x<sup>9</sup>y<sup>7</sup>",
    "9x<sup>3</sup>y<sup>7</sup>",
    "3x<sup>3</sup>y<sup>7</sup>"
  ],
  answer: 3,
  strategy: "Handle the outer power first: raise every factor inside to that power. Then divide by subtracting exponents.",
  hint: "(3x²y³)³ means 3³ · x⁶ · y⁹.",
  steps: [
    "Expand the numerator, applying the exponent 3 to each factor: <div class=“mathwork”>(3x²y³)³ = 3³ · x⁶ · y⁹ = 27x⁶y⁹</div>",
    "Divide the coefficients: 27 / 9 = 3.",
    "Subtract exponents for like bases: <div class=“mathwork”>x⁶ ÷ x³ = x³\ny⁹ ÷ y² = y⁷</div>",
    "Result: 3x³y⁷"
  ],
  traps: {
    0: "Subtracted the y exponents as 9 − 4 instead of 9 − 2.",
    1: "Multiplied the x exponents when dividing instead of subtracting, or applied the outer 3 twice.",
    2: "Divided 27 by 9 incorrectly, or forgot to cube the 3 and left the 9 in the numerator."
  }
},

{
  id: "m024",
  domain: "Advanced Math",
  skill: "Nonlinear functions",
  difficulty: "M",
  type: "mc",
  prompt: "What is the minimum value of the function f(x) = x<sup>2</sup> − 8x + 11?",
  choices: [
    "4",
    "−5",
    "11",
    "−21"
  ],
  answer: 1,
  strategy: "A parabola's minimum occurs at x = −b/(2a). Find that x, then substitute back. The question usually wants the y-value, not the x-value.",
  hint: "First find where the minimum occurs, then find what the minimum <em>is</em>.",
  steps: [
    "Find the axis of symmetry: <div class=“mathwork”>x = −b/(2a) = 8/2 = 4</div>",
    "Substitute x = 4 to get the minimum value: <div class=“mathwork”>f(4) = 16 − 32 + 11 = −5</div>",
    "Confirm with completing the square: <div class=“mathwork”>x² − 8x + 11 = (x − 4)² − 5</div>",
    "Since (x − 4)² is never negative, the smallest value of f is −5. ✓"
  ],
  traps: {
    0: "This is the x-value where the minimum occurs, not the minimum value. The single most common error on vertex questions.",
    2: "This is f(0), the y-intercept.",
    3: "Comes from computing 16 − 32 − 5 or a similar arithmetic slip. Recompute f(4) carefully."
  }
},

{
  id: "m025",
  domain: "Advanced Math",
  skill: "Nonlinear equations in one variable",
  difficulty: "H",
  type: "mc",
  prompt: "What is the solution to the equation √(2x + 5) = x − 5?",
  choices: [
    "x = 2",
    "x = 10",
    "x = 5",
    "x = 12"
  ],
  answer: 1,
  strategy: "Squaring both sides of a radical equation can create extraneous roots. You must substitute every candidate back into the <em>original</em> equation.",
  hint: "Squaring gives a quadratic with two roots, but only one of them can actually be a solution. Why?",
  steps: [
    "Square both sides: <div class=“mathwork”>2x + 5 = (x − 5)²\n2x + 5 = x² − 10x + 25</div>",
    "Collect terms: <div class=“mathwork”>x² − 12x + 20 = 0\n(x − 10)(x − 2) = 0</div>",
    "Candidates: x = 10 and x = 2.",
    "Check both in the original: x = 10 gives √25 = 5 and 10 − 5 = 5 ✓. x = 2 gives √9 = 3 but 2 − 5 = −3 ✗, a square root cannot be negative, so x = 2 is extraneous."
  ],
  traps: {
    0: "The extraneous root. It solves the squared equation but not the original, because it makes the right side negative. This is exactly what the question is testing.",
    2: "Makes the right side 0 but the left side √15.",
    3: "Gives √29 ≈ 5.39 on the left and 7 on the right."
  }
},

{
  id: "m026",
  domain: "Advanced Math",
  skill: "Nonlinear equations in one variable",
  difficulty: "M",
  type: "spr",
  prompt: "In the equation x<sup>2</sup> + 6x + c = 0, c is a constant. If the equation has exactly one real solution, what is the value of c?",
  answers: ["9"],
  strategy: "The number of real solutions is controlled by the discriminant b² − 4ac: positive gives two, zero gives exactly one, negative gives none.",
  hint: "Set the discriminant equal to zero.",
  steps: [
    "Here a = 1, b = 6, and the constant is c.",
    "Exactly one real solution means the discriminant is zero: <div class=“mathwork”>b² − 4ac = 0\n36 − 4c = 0</div>",
    "Solve: <div class=“mathwork”>4c = 36\nc = 9</div>",
    "Check: x² + 6x + 9 = (x + 3)², whose only solution is x = −3. ✓"
  ],
  traps: {}
},

{
  id: "m027",
  domain: "Advanced Math",
  skill: "Nonlinear functions",
  difficulty: "E",
  type: "mc",
  prompt: "If f(x) = x + 3 and g(x) = x<sup>2</sup> − 1, what is the value of g(f(2))?",
  choices: [
    "6",
    "8",
    "26",
    "24"
  ],
  answer: 3,
  strategy: "Work composed functions from the inside out. Compute the inner value first and write it down before applying the outer function.",
  hint: "Find f(2) first, then put that number into g.",
  steps: [
    "Inner function: <div class=“mathwork”>f(2) = 2 + 3 = 5</div>",
    "Now apply g to that result: <div class=“mathwork”>g(5) = 5² − 1 = 25 − 1 = 24</div>"
  ],
  traps: {
    0: "This is f(g(2)), the composition performed in the wrong order: g(2) = 3, then f(3) = 6. Order matters.",
    1: "This is g(3) = 8, using x = 3 from the “+3” instead of f(2) = 5.",
    2: "This is 5² + 1. The function subtracts 1."
  }
},

{
  id: "m028",
  domain: "Advanced Math",
  skill: "Equivalent expressions",
  difficulty: "M",
  type: "mc",
  prompt: "Which expression is equivalent to (x<sup>2</sup> − 9) / (x<sup>2</sup> + 5x + 6), where x ≠ −2 and x ≠ −3?",
  choices: [
    "(x − 9)/(x + 6)",
    "(x + 3)/(x + 2)",
    "(x − 3)/(x − 2)",
    "(x − 3)/(x + 2)"
  ],
  answer: 3,
  strategy: "Factor the numerator and denominator completely, then cancel common factors. Never cancel individual terms, only whole factors.",
  hint: "x² − 9 is a difference of squares.",
  steps: [
    "Factor the numerator as a difference of squares: <div class=“mathwork”>x² − 9 = (x − 3)(x + 3)</div>",
    "Factor the denominator: two numbers multiplying to 6 and adding to 5 are 2 and 3: <div class=“mathwork”>x² + 5x + 6 = (x + 2)(x + 3)</div>",
    "Cancel the shared factor (x + 3): <div class=“mathwork”>(x − 3)(x + 3) / [(x + 2)(x + 3)] = (x − 3)/(x + 2)</div>",
    "Test with x = 1: original = (1 − 9)/(1 + 5 + 6) = −8/12 = −2/3; answer = (1 − 3)/(1 + 2) = −2/3. ✓"
  ],
  traps: {
    0: "Canceled the x² terms directly. Terms cannot be canceled, only factors. This is the error the question is built to catch.",
    1: "Canceled the wrong factor, (x − 3) instead of (x + 3).",
    2: "Sign error in factoring the denominator: x² + 5x + 6 factors with positive numbers, not negative ones."
  }
},

{
  id: "m029",
  domain: "Advanced Math",
  skill: "Nonlinear functions",
  difficulty: "M",
  type: "mc",
  prompt: "In the xy-plane, the graph of the function f(x) = a(x − 2)<sup>2</sup> + k has its vertex at (2, −1) and passes through the point (0, 7). What is the value of a?",
  choices: [
    "1/2",
    "4",
    "2",
    "8"
  ],
  answer: 2,
  strategy: "Vertex form hands you the vertex directly: f(x) = a(x − h)² + k has vertex (h, k). Read off h and k, then use the extra point to find a.",
  hint: "The vertex tells you k. Then substitute the point (0, 7).",
  steps: [
    "The vertex is (2, −1), so k = −1 and f(x) = a(x − 2)² − 1.",
    "Substitute the point (0, 7): <div class=“mathwork”>7 = a(0 − 2)² − 1\n7 = 4a − 1</div>",
    "Solve: <div class=“mathwork”>4a = 8\na = 2</div>",
    "Check: f(0) = 2(4) − 1 = 7 ✓"
  ],
  traps: {
    0: "Comes from 4a = 2 or from inverting the final division.",
    1: "Comes from forgetting to subtract 1: 7 = 4a would give a = 1.75, but using 8/2 gives 4. Track the constant.",
    3: "This is 4a, not a."
  }
},

{
  id: "m030",
  domain: "Advanced Math",
  skill: "Systems with one nonlinear equation",
  difficulty: "H",
  type: "spr",
  prompt: "<div class=“mathwork”>y = x² − 4x + 7\ny = 2x + 2</div>The system above has two solutions. What is the sum of the x-coordinates of those solutions?",
  answers: ["6"],
  strategy: "Set the two expressions for y equal, collect into a quadratic, and remember that the sum of the roots equals −b/a. You often do not need the roots themselves.",
  hint: "You can answer this without ever finding the individual solutions.",
  steps: [
    "Set the expressions equal: <div class=“mathwork”>x² − 4x + 7 = 2x + 2</div>",
    "Collect on one side: <div class=“mathwork”>x² − 6x + 5 = 0</div>",
    "The sum of the roots of ax² + bx + c = 0 is −b/a: <div class=“mathwork”>−(−6)/1 = 6</div>",
    "Confirm by factoring: (x − 1)(x − 5) = 0 gives x = 1 and x = 5, and 1 + 5 = 6. ✓"
  ],
  traps: {}
},

{
  id: "m031",
  domain: "Advanced Math",
  skill: "Nonlinear functions",
  difficulty: "M",
  type: "mc",
  prompt: "The value of a machine depreciates so that its value V, in dollars, after t years is given by V = 40,000(0.85)<sup>t</sup>. Which expression gives the machine's value after 18 months?",
  choices: [
    "40,000(0.85)<sup>3/2</sup>",
    "40,000(0.85)<sup>18</sup>",
    "40,000(0.15)<sup>3/2</sup>",
    "40,000(1.15)<sup>3/2</sup>"
  ],
  answer: 0,
  strategy: "Check the units of the exponent's variable before substituting. If t is in years and the question gives months, convert first.",
  hint: "t is measured in years. How many years is 18 months?",
  steps: [
    "The model defines t in years, so convert: <div class=“mathwork”>18 months = 18/12 = 1.5 years = 3/2 years</div>",
    "Substitute t = 3/2: <div class=“mathwork”>V = 40,000(0.85)^(3/2)</div>",
    "The base stays 0.85 because that is the fraction of value retained each year."
  ],
  traps: {
    1: "Substitutes 18 without converting months to years. This would model 18 years of depreciation.",
    2: "0.15 is the fraction <em>lost</em> each year. The base of the exponential is the fraction retained: 1 − 0.15 = 0.85.",
    3: "1.15 would mean the machine gains 15% each year. Depreciation requires a base less than 1."
  }
},

{
  id: "m032",
  domain: "Advanced Math",
  skill: "Equivalent expressions",
  difficulty: "H",
  type: "spr",
  prompt: "The expression x<sup>2</sup> + 10x + 18 can be written in the form (x + a)<sup>2</sup> + b, where a and b are constants. What is the value of a + b?",
  answers: ["-2"],
  strategy: "Completing the square: a is half the coefficient of x, and b adjusts for what the square adds. Halve, square, subtract.",
  hint: "Half of 10 is 5, and (x + 5)² = x² + 10x + 25.",
  steps: [
    "Take half the x-coefficient: 10/2 = 5, so a = 5.",
    "Expand to see what that square produces: <div class=“mathwork”>(x + 5)² = x² + 10x + 25</div>",
    "The original has 18 where the square has 25, so subtract 7: <div class=“mathwork”>x² + 10x + 18 = (x + 5)² − 7</div>",
    "So a = 5, b = −7, and <div class=“mathwork”>a + b = 5 + (−7) = −2</div>"
  ],
  traps: {}
},

{
  id: "m033",
  domain: "Advanced Math",
  skill: "Nonlinear equations in one variable",
  difficulty: "M",
  type: "mc",
  prompt: "The polynomial p is defined by p(x) = (x − 4)(x<sup>2</sup> − 9). What are all the zeros of p?",
  choices: [
    "4 and 9",
    "−3, 3, and 4",
    "−4, −3, and 3",
    "4, −9, and 9"
  ],
  answer: 1,
  strategy: "Zeros come from setting each factor to zero. Factor anything that can still be factored before you start listing.",
  hint: "x² − 9 is not yet fully factored.",
  steps: [
    "Factor completely: <div class=“mathwork”>p(x) = (x − 4)(x − 3)(x + 3)</div>",
    "Set each factor equal to zero: x − 4 = 0, x − 3 = 0, x + 3 = 0.",
    "Zeros: x = 4, x = 3, x = −3.",
    "Check one: p(−3) = (−7)(9 − 9) = 0. ✓"
  ],
  traps: {
    0: "Read 9 straight out of x² − 9 without solving. x² = 9 gives x = ±3, not 9.",
    2: "Sign errors on every factor: (x − 4) gives +4, not −4.",
    3: "Squared instead of taking a square root."
  }
},

{
  id: "m034",
  domain: "Advanced Math",
  skill: "Nonlinear functions",
  difficulty: "M",
  type: "mc",
  prompt: "A ball is thrown upward from a rooftop. Its height above the ground, in feet, t seconds after it is thrown is given by h(t) = −16t<sup>2</sup> + 64t + 80. How many seconds after it is thrown does the ball hit the ground?",
  choices: [
    "5",
    "4",
    "2",
    "8"
  ],
  answer: 0,
  strategy: "“Hits the ground” means height = 0. Divide out the common factor before factoring, the arithmetic gets much easier.",
  hint: "Set h(t) = 0, then divide the whole equation by −16.",
  steps: [
    "Set the height to zero: <div class=“mathwork”>−16t² + 64t + 80 = 0</div>",
    "Divide every term by −16: <div class=“mathwork”>t² − 4t − 5 = 0</div>",
    "Factor: <div class=“mathwork”>(t − 5)(t + 1) = 0</div>",
    "So t = 5 or t = −1. Time cannot be negative, so the ball lands at t = 5 seconds. ✓"
  ],
  traps: {
    1: "h(4) = −256 + 256 + 80 = 80 feet, so the ball is back at rooftop height, not on the ground.",
    2: "t = 2 is when the ball reaches its highest point (−b/2a = 64/32 = 2), not when it lands.",
    3: "h(8) = −1,024 + 512 + 80, a negative height, meaning the ball landed earlier."
  }
},

{
  id: "m035",
  domain: "Advanced Math",
  skill: "Equivalent expressions",
  difficulty: "H",
  type: "spr",
  prompt: "If 2<sup>3x</sup> = 32<sup>x − 1</sup>, what is the value of x?",
  answers: ["2.5", "5/2"],
  strategy: "Rewrite both sides with the same base. Once the bases match, the exponents must be equal.",
  hint: "32 is a power of 2.",
  steps: [
    "Write 32 as a power of 2: <div class=“mathwork”>32 = 2⁵</div>",
    "Rewrite the right side, multiplying exponents: <div class=“mathwork”>32^(x−1) = (2⁵)^(x−1) = 2^(5x−5)</div>",
    "With equal bases, set the exponents equal: <div class=“mathwork”>3x = 5x − 5</div>",
    "Solve: <div class=“mathwork”>2x = 5\nx = 5/2 = 2.5</div>"
  ],
  traps: {}
},

{
  id: "m036",
  domain: "Advanced Math",
  skill: "Nonlinear functions",
  difficulty: "M",
  type: "mc",
  prompt: "A theater's revenue R, in dollars, from selling tickets at a price of p dollars each is modeled by R = −20p<sup>2</sup> + 800p. What ticket price produces the maximum revenue?",
  choices: [
    "$20",
    "$10",
    "$40",
    "$400"
  ],
  answer: 0,
  strategy: "For a downward parabola, the maximum is at the vertex, x = −b/(2a). Here the question asks for the input (the price), so stop at the vertex's x-value.",
  hint: "Identify a = −20 and b = 800, then compute −b/(2a).",
  steps: [
    "Identify the coefficients: a = −20, b = 800.",
    "Vertex: <div class=“mathwork”>p = −b/(2a) = −800 / (2 × −20) = −800 / −40 = 20</div>",
    "So a price of $20 maximizes revenue.",
    "Check the value: R(20) = −20(400) + 16,000 = $8,000, and R(19) = $7,980 and R(21) = $7,980, both lower. ✓"
  ],
  traps: {
    1: "Used −b/a ÷ 4 or a similar slip. Recompute: 2a = −40.",
    2: "This is the p-intercept where revenue returns to zero (R = 0 at p = 0 and p = 40). The maximum lies halfway between them, at 20.",
    3: "This is 800/2, ignoring the coefficient a."
  }
},

{
  id: "m037",
  domain: "Advanced Math",
  skill: "Nonlinear equations in one variable",
  difficulty: "M",
  type: "mc",
  prompt: "What value of x satisfies the equation 3/(x − 2) = 12/(x + 4)?",
  choices: [
    "4",
    "0",
    "8",
    "12"
  ],
  answer: 0,
  strategy: "Cross-multiply proportions, then solve the resulting linear equation. Check that your answer does not make a denominator zero.",
  hint: "Cross-multiply to get 3(x + 4) = 12(x − 2).",
  steps: [
    "Cross-multiply: <div class=“mathwork”>3(x + 4) = 12(x − 2)</div>",
    "Distribute: <div class=“mathwork”>3x + 12 = 12x − 24</div>",
    "Collect: <div class=“mathwork”>36 = 9x\nx = 4</div>",
    "Check: 3/(4 − 2) = 1.5 and 12/(4 + 4) = 1.5 ✓, and no denominator is zero."
  ],
  traps: {
    1: "Gives 3/(−2) = −1.5 and 12/4 = 3. Not equal.",
    2: "Gives 3/6 = 0.5 and 12/12 = 1. Not equal.",
    3: "Comes from a sign error when distributing 12(x − 2)."
  }
},

{
  id: "m038",
  domain: "Advanced Math",
  skill: "Equivalent expressions",
  difficulty: "H",
  type: "mc",
  prompt: "Which expression is equivalent to <sup>4</sup>√(x<sup>3</sup>) · √x, where x > 0?",
  choices: [
    "<sup>4</sup>√(x<sup>5</sup>)",
    "<sup>8</sup>√(x<sup>5</sup>)",
    "x<sup>3/8</sup>",
    "√(x<sup>3</sup>)"
  ],
  answer: 0,
  strategy: "Convert every radical to a fractional exponent, add exponents when multiplying, then convert back if the choices are in radical form.",
  hint: "⁴√(x³) is x^(3/4) and √x is x^(1/2).",
  steps: [
    "Rewrite both factors with fractional exponents: <div class=“mathwork”>⁴√(x³) = x^(3/4)\n√x = x^(1/2)</div>",
    "Multiplying powers of the same base means adding exponents: <div class=“mathwork”>3/4 + 1/2 = 3/4 + 2/4 = 5/4</div>",
    "So the product is x^(5/4).",
    "Convert back to a radical: the denominator is the index and the numerator is the power: <div class=“mathwork”>x^(5/4) = ⁴√(x⁵)</div>"
  ],
  traps: {
    1: "Multiplied the denominators of the exponents (4 × 2 = 8) instead of finding a common denominator and adding.",
    2: "Multiplied the exponents, 3/4 × 1/2 = 3/8. Exponents multiply for a power of a power, not for a product.",
    3: "This is x^(3/2), which comes from adding the numerators and ignoring the denominators."
  }
},

{
  id: "m039",
  domain: "Problem-Solving and Data Analysis",
  skill: "Percentages",
  difficulty: "E",
  type: "mc",
  prompt: "A jacket regularly priced at $80 is on sale for $68. What is the percent discount?",
  choices: [
    "12%",
    "17.6%",
    "15%",
    "85%"
  ],
  answer: 2,
  strategy: "Percent change = (change ÷ original) × 100. The original amount always goes in the denominator.",
  hint: "The discount is $12. Twelve is what percent of eighty?",
  steps: [
    "Find the change: <div class=“mathwork”>80 − 68 = 12</div>",
    "Divide by the original price: <div class=“mathwork”>12 / 80 = 0.15</div>",
    "Convert to a percent: 15%.",
    "Check: 15% of 80 is 12, and 80 − 12 = 68. ✓"
  ],
  traps: {
    0: "That is the dollar discount, not the percent.",
    1: "Divided by the sale price (12/68) instead of the original. The “original” is always the before value.",
    3: "That is the percent of the original price the customer still pays, not the discount."
  }
},

{
  id: "m040",
  domain: "Problem-Solving and Data Analysis",
  skill: "Rates",
  difficulty: "E",
  type: "spr",
  prompt: "A printer produces pages at a constant rate of 18 pages per minute. How many minutes will it take the printer to produce 621 pages?",
  answers: ["34.5", "69/2"],
  strategy: "Set up the rate as a fraction with the units you want on top, so the units cancel to leave the answer's unit.",
  hint: "Divide the total pages by the pages per minute.",
  steps: [
    "Rate: 18 pages per 1 minute.",
    "Divide the total by the rate: <div class=“mathwork”>621 ÷ 18 = 34.5</div>",
    "Check the units: pages ÷ (pages/minute) = minutes. ✓",
    "Verify: 18 × 34.5 = 621. ✓ (You may enter 34.5 or 69/2.)"
  ],
  traps: {}
},

{
  id: "m041",
  domain: "Problem-Solving and Data Analysis",
  skill: "One-variable data",
  difficulty: "M",
  type: "mc",
  prompt: "A data set of 20 home sale prices has a mean of $410,000 and a median of $310,000. The single most expensive home, which sold for $3.2 million, is then removed from the data set. Which statement about the remaining 19 prices must be true?",
  choices: [
    "The mean decreases by more than the median does.",
    "The median decreases by more than the mean does.",
    "Neither the mean nor the median changes.",
    "The mean increases."
  ],
  answer: 0,
  strategy: "The mean responds to the size of every value; the median responds only to position. Outliers move the mean and barely touch the median.",
  hint: "Which measure actually uses the number 3,200,000 in its computation?",
  steps: [
    "The mean is computed from the total of all values, so removing a $3.2 million value removes a large chunk of that total.",
    "Notice the mean ($410,000) sits well above the median ($310,000), which is the signature of a high outlier.",
    "The median only depends on which value sits in the middle position; dropping the largest value shifts that position by half a slot, changing the median slightly at most.",
    "So the mean falls substantially while the median barely moves. Choice A."
  ],
  traps: {
    1: "Reverses the sensitivity. The median is the resistant measure. That is why it is reported for home prices.",
    2: "The mean is certain to change, since the sum of the values changes.",
    3: "Removing an above-average value must pull the mean down, not up."
  }
},

{
  id: "m042",
  domain: "Problem-Solving and Data Analysis",
  skill: "Probability",
  difficulty: "M",
  type: "mc",
  figure: "<table class=“data”><tr><th></th><th>Print</th><th>Digital</th><th>Total</th></tr><tr><th>Grade 9</th><td>40</td><td>60</td><td>100</td></tr><tr><th>Grade 10</th><td>55</td><td>45</td><td>100</td></tr><tr><th>Total</th><td>95</td><td>105</td><td>200</td></tr></table>",
  figcap: "Preferred reading format of 200 students",
  prompt: "The table above shows the preferred reading format of 200 students. If a student who prefers print is selected at random, what is the probability that the student is in Grade 10?",
  choices: [
    "55/200",
    "95/200",
    "55/95",
    "45/105"
  ],
  answer: 2,
  strategy: "In a conditional probability, the phrase after “if” sets the denominator. Find that group's total first, then count the successes inside it.",
  hint: "You are only choosing among students who prefer print. How many students is that?",
  steps: [
    "The condition is “a student who prefers print,” so the sample space is the Print column: 95 students.",
    "Among those 95, the Grade 10 students number 55.",
    "So the probability is <div class=“mathwork”>55 / 95</div>",
    "(That reduces to 11/19 ≈ 0.579, but 55/95 is the form given.)"
  ],
  traps: {
    0: "Uses all 200 students as the denominator, ignoring the condition. This is the single most common two-way-table error.",
    1: "That is the probability a randomly chosen student prefers print, a different question.",
    3: "Uses the Digital column and the Grade 10 digital count."
  }
},

{
  id: "m043",
  domain: "Problem-Solving and Data Analysis",
  skill: "Percentages",
  difficulty: "M",
  type: "mc",
  prompt: "The population of a town increased by 20% from 2010 to 2015 and then decreased by 10% from 2015 to 2020. If the population in 2010 was 25,000, what was the population in 2020?",
  choices: [
    "25,000",
    "30,000",
    "27,500",
    "27,000"
  ],
  answer: 3,
  strategy: "Apply percent changes one at a time, multiplying by (1 + rate). Percent changes never simply add, because the second change acts on the new amount.",
  hint: "Find the 2015 population before you take 10% off.",
  steps: [
    "2015 population: <div class=“mathwork”>25,000 × 1.20 = 30,000</div>",
    "2020 population, after a 10% decrease: <div class=“mathwork”>30,000 × 0.90 = 27,000</div>",
    "Note the net effect: 1.20 × 0.90 = 1.08, an 8% increase overall, not 10%."
  ],
  traps: {
    0: "Assumes +20% and −10% cancel out. They do not, because the 10% is taken from the larger 2015 figure.",
    1: "This is the 2015 population, you stopped one step early.",
    2: "Comes from combining the rates as +10% of the original (25,000 × 1.10). Percent changes compound, not add."
  }
},

{
  id: "m044",
  domain: "Problem-Solving and Data Analysis",
  skill: "Ratios and proportions",
  difficulty: "E",
  type: "mc",
  prompt: "On a map, 1 inch represents 24 miles. Two cities are 3.75 inches apart on the map. What is the actual distance between the cities?",
  choices: [
    "6.4 miles",
    "24 miles",
    "900 miles",
    "90 miles"
  ],
  answer: 3,
  strategy: "Write the scale as a fraction with units, then multiply so the unwanted unit cancels.",
  hint: "3.75 inches × 24 miles per inch.",
  steps: [
    "Set up the conversion: <div class=“mathwork”>3.75 in × (24 mi / 1 in)</div>",
    "The inches cancel, leaving miles: <div class=“mathwork”>3.75 × 24 = 90</div>",
    "So the cities are 90 miles apart. Sanity check: 4 inches would be 96 miles, so 90 is reasonable. ✓"
  ],
  traps: {
    0: "Divided instead of multiplied (24 ÷ 3.75). Check whether the answer should be larger or smaller than the scale factor.",
    1: "That is the scale itself, the distance for 1 inch.",
    2: "Multiplied by 240 instead of 24, a decimal place slipped."
  }
},

{
  id: "m045",
  domain: "Problem-Solving and Data Analysis",
  skill: "Inference from sample statistics",
  difficulty: "H",
  type: "mc",
  prompt: "In a random sample of 400 residents of a city, 62% said they support a proposed measure. The margin of error for this estimate is 4 percentage points at a 95% confidence level. Which conclusion is most appropriate?",
  choices: [
    "Exactly 62% of all residents of the city support the measure.",
    "It is plausible that between 58% and 66% of all residents of the city support the measure.",
    "At least 66% of all residents of the city support the measure.",
    "A different random sample of 400 residents would produce the same 62% result."
  ],
  answer: 1,
  strategy: "A margin of error creates an interval around the sample statistic: estimate ± margin. The interval describes the plausible values for the whole population, not a guarantee.",
  hint: "Build the interval: 62% minus 4 points, and 62% plus 4 points.",
  steps: [
    "The sample estimate is 62% and the margin of error is 4 percentage points.",
    "Form the interval: <div class=“mathwork”>62 − 4 = 58\n62 + 4 = 66</div>",
    "So plausible values for the population percentage run from 58% to 66%.",
    "Choice B states exactly that, with the appropriate hedge (“it is plausible”)."
  ],
  traps: {
    0: "Treats the sample statistic as the exact population value. The whole point of a margin of error is that the sample is an estimate.",
    2: "Uses only the top of the interval and turns it into a floor. 66% is the highest plausible value, not the lowest.",
    3: "Samples vary, and that variability is precisely what the margin of error quantifies."
  }
},

{
  id: "m046",
  domain: "Problem-Solving and Data Analysis",
  skill: "Two-variable data and models",
  difficulty: "H",
  type: "mc",
  figure: "<svg viewBox=“0 0 460 230” role=“img” aria-label='Scatterplot of subscribers versus years since 2000 with a line of best fit'><g font-family=“sans-serif” font-size=“10”><line x1=“60” y1=“200” x2=“430” y2=“200” stroke=“#333”/><line x1=“60” y1=“200” x2=“60” y2=“20” stroke=“#333”/><text x=“36” y=“204”>0</text><text x=“30” y=“164”>10</text><text x=“30” y=“128”>20</text><text x=“30” y=“92”>30</text><text x=“30” y=“56”>40</text><text x=“30” y=“24”>50</text><text x=“150” y=“222”>Years since 2000</text><text x=“4” y=“14”>Subscribers (thousands)</text><line x1=“60” y1=“157” x2=“420” y2=“34” stroke=“#1a4f8b” stroke-width=“2”/><circle cx=“96” cy=“142” r=“3.5” fill=“#1e1e1e”/><circle cx=“132” cy=“135” r=“3.5” fill=“#1e1e1e”/><circle cx=“168” cy=“121” r=“3.5” fill=“#1e1e1e”/><circle cx=“204” cy=“106” r=“3.5” fill=“#1e1e1e”/><circle cx=“240” cy=“99” r=“3.5” fill=“#1e1e1e”/><circle cx=“276” cy=“81” r=“3.5” fill=“#1e1e1e”/><circle cx=“312” cy=“74” r=“3.5” fill=“#1e1e1e”/><circle cx=“348” cy=“56” r=“3.5” fill=“#1e1e1e”/><circle cx=“384” cy=“49” r=“3.5” fill=“#1e1e1e”/></g></svg>",
  figcap: "Subscribers, in thousands, versus years since 2000, with the line of best fit y = 3.4x + 12",
  prompt: "The scatterplot shows the number of subscribers to a service, in thousands, x years after 2000. The line of best fit is y = 3.4x + 12. Which is the best interpretation of the slope of this line?",
  choices: [
    "There were about 3,400 subscribers in the year 2000.",
    "The number of subscribers increased by about 3,400 per year.",
    "The number of subscribers increased by about 3.4 per year.",
    "The number of subscribers increased by about 3.4% per year."
  ],
  answer: 1,
  strategy: "Read the axis labels before interpreting any slope. The slope carries the y-unit per x-unit, and “thousands” on an axis changes the answer.",
  hint: "y is measured in thousands of subscribers, so 3.4 units of y is how many subscribers?",
  steps: [
    "The slope 3.4 means y increases by 3.4 for each increase of 1 in x.",
    "Check the units: x is years after 2000, and y is subscribers <em>in thousands</em>.",
    "So each year adds 3.4 thousand = 3,400 subscribers.",
    "Choice B states the rate with the units converted correctly."
  ],
  traps: {
    0: "Interprets the slope as a starting value. That role belongs to the intercept, 12, about 12,000 subscribers in 2000.",
    2: "Ignores the “thousands” on the y-axis. This is the trap the question is built around.",
    3: "A linear model gives a constant change per year, not a constant percent change. Percent growth would require an exponential model."
  }
},

{
  id: "m047",
  domain: "Problem-Solving and Data Analysis",
  skill: "Rates",
  difficulty: "H",
  type: "spr",
  prompt: "A pump moves 4 gallons of water every 15 seconds. At this rate, how many gallons of water does the pump move in 1 hour and 20 minutes?",
  answers: ["1280"],
  strategy: "Convert everything to one unit of time first. Multi-step rate problems go wrong at the conversion, not at the arithmetic.",
  hint: "How many seconds are in 1 hour and 20 minutes?",
  steps: [
    "Convert the time: <div class=“mathwork”>1 hr 20 min = 80 min = 80 × 60 = 4,800 seconds</div>",
    "Find how many 15-second intervals that is: <div class=“mathwork”>4,800 ÷ 15 = 320</div>",
    "Each interval moves 4 gallons: <div class=“mathwork”>320 × 4 = 1,280 gallons</div>",
    "Cross-check with a unit rate: 4/15 gal per second × 4,800 s = 1,280. ✓"
  ],
  traps: {}
},

{
  id: "m048",
  domain: "Problem-Solving and Data Analysis",
  skill: "Percentages",
  difficulty: "H",
  type: "spr",
  prompt: "A 500-milliliter solution is 8% salt by volume. How many milliliters of pure water must be added so that the resulting solution is 5% salt by volume?",
  answers: ["300"],
  strategy: "In a dilution, the amount of solute never changes, only the total volume does. Track the unchanging quantity and set up one equation.",
  hint: "How many milliliters of salt are in the solution? That number stays the same.",
  steps: [
    "Find the salt: <div class=“mathwork”>8% of 500 = 0.08 × 500 = 40 mL</div>",
    "Adding water does not change the salt, so the final solution still has 40 mL of salt, and that must be 5% of the new total V: <div class=“mathwork”>40 = 0.05V</div>",
    "Solve for the new total: <div class=“mathwork”>V = 40 / 0.05 = 800 mL</div>",
    "The water added is the change in total volume: <div class=“mathwork”>800 − 500 = 300 mL</div>"
  ],
  traps: {}
},

{
  id: "m049",
  domain: "Geometry and Trigonometry",
  skill: "Lines, angles, and triangles",
  difficulty: "E",
  type: "mc",
  prompt: "In a triangle, two of the interior angles measure 43° and 68°. What is the measure of the third interior angle?",
  choices: [
    "79°",
    "69°",
    "111°",
    "180°"
  ],
  answer: 1,
  strategy: "The interior angles of any triangle sum to 180°. Subtract the known angles from 180.",
  hint: "Add the two known angles first.",
  steps: [
    "Add the known angles: <div class=“mathwork”>43 + 68 = 111</div>",
    "Subtract from 180: <div class=“mathwork”>180 − 111 = 69</div>",
    "Check: 43 + 68 + 69 = 180. ✓"
  ],
  traps: {
    0: "An arithmetic slip: 180 − 101 rather than 180 − 111.",
    2: "That is the sum of the two given angles, not the remaining angle. It is also the exterior angle at the third vertex.",
    3: "That is the total of all three angles."
  }
},

{
  id: "m050",
  domain: "Geometry and Trigonometry",
  skill: "Circles",
  difficulty: "E",
  type: "mc",
  prompt: "A circle has a circumference of 18π. What is the area of the circle?",
  choices: [
    "9π",
    "81π",
    "18π",
    "324π"
  ],
  answer: 1,
  strategy: "Circle problems almost always route through the radius. Whatever you are given, find r first.",
  hint: "C = 2πr. What is r?",
  steps: [
    "Use the circumference formula: <div class=“mathwork”>2πr = 18π\nr = 9</div>",
    "Apply the area formula: <div class=“mathwork”>A = πr² = π(9)² = 81π</div>"
  ],
  traps: {
    0: "That is the radius times π, or the area of a circle with radius 3.",
    2: "That repeats the circumference. Area and circumference have different units and different formulas.",
    3: "Squared the diameter (18² = 324) instead of the radius."
  }
},

{
  id: "m051",
  domain: "Geometry and Trigonometry",
  skill: "Right triangles and trigonometry",
  difficulty: "M",
  type: "mc",
  prompt: "In right triangle ABC, angle C is a right angle, AC = 9, and BC = 12. What is the value of sin A?",
  choices: [
    "0.6",
    "0.8",
    "0.75",
    "1.25"
  ],
  answer: 1,
  strategy: "SOH-CAH-TOA, but identify the angle first. “Opposite” and “adjacent” are relative to the angle named in the question.",
  hint: "Find the hypotenuse with the Pythagorean theorem, then ask which side is opposite angle A.",
  steps: [
    "Find the hypotenuse AB: <div class=“mathwork”>9² + 12² = 81 + 144 = 225\nAB = 15</div>",
    "The side opposite angle A is BC = 12 (angle A and side BC are at opposite corners).",
    "The hypotenuse is AB = 15, since it is across from the right angle at C.",
    "sin A = opposite / hypotenuse = <div class=“mathwork”>12 / 15 = 0.8</div>"
  ],
  traps: {
    0: "That is cos A (9/15), the adjacent side over the hypotenuse. Mixing up opposite and adjacent is the error this question targets.",
    2: "That is tan A (12/9 is 1.33; 9/12 = 0.75), using the two legs rather than a leg and the hypotenuse.",
    3: "That is 15/12, the reciprocal of the right ratio. A sine can never exceed 1, use that as a check."
  }
},

{
  id: "m052",
  domain: "Geometry and Trigonometry",
  skill: "Area and volume",
  difficulty: "E",
  type: "mc",
  prompt: "What is the volume of a right circular cylinder with a radius of 3 and a height of 10?",
  choices: [
    "30π",
    "60π",
    "90π",
    "900π"
  ],
  answer: 2,
  strategy: "Volume of a cylinder is V = πr²h. It is on the reference sheet, open the sheet rather than guessing which quantity gets squared.",
  hint: "Square the radius, not the height.",
  steps: [
    "Write the formula: <div class=“mathwork”>V = πr²h</div>",
    "Substitute: <div class=“mathwork”>V = π(3)²(10) = π(9)(10)</div>",
    "So V = 90π."
  ],
  traps: {
    0: "That is πrh: the radius was not squared.",
    1: "That is the lateral surface area, 2πrh.",
    3: "Squared the height instead of the radius: π(3)(100)."
  }
},

{
  id: "m053",
  domain: "Geometry and Trigonometry",
  skill: "Lines, angles, and triangles",
  difficulty: "M",
  type: "mc",
  prompt: "Triangle ABC is similar to triangle DEF, where A corresponds to D, B to E, and C to F. If AB = 6, BC = 8, and DE = 9, what is the length of EF?",
  choices: [
    "6",
    "10.7",
    "12",
    "13.5"
  ],
  answer: 2,
  strategy: "Similar triangles have proportional corresponding sides. Write the proportion with matching letters in matching positions before you compute.",
  hint: "AB corresponds to DE, and BC corresponds to EF. The scale factor is 9/6.",
  steps: [
    "Find the scale factor from the corresponding pair you know: <div class=“mathwork”>DE / AB = 9 / 6 = 1.5</div>",
    "Corresponding sides all use that same factor: <div class=“mathwork”>EF = BC × 1.5 = 8 × 1.5</div>",
    "So EF = 12.",
    "Check with a proportion: 6/8 = 9/12, and cross-multiplying gives 72 = 72. ✓"
  ],
  traps: {
    0: "Copied AB instead of scaling BC.",
    1: "Comes from the proportion 6/9 = 8/EF solved incorrectly, or from 8 × (8/6).",
    3: "Applied the scale factor to the wrong side (9 × 1.5), which scales DE a second time."
  }
},

{
  id: "m054",
  domain: "Geometry and Trigonometry",
  skill: "Circles",
  difficulty: "H",
  type: "spr",
  prompt: "The graph of x<sup>2</sup> + y<sup>2</sup> − 6x + 8y = 0 in the xy-plane is a circle. What is the radius of the circle?",
  answers: ["5"],
  strategy: "Convert to standard form (x − h)² + (y − k)² = r² by completing the square in x and in y separately.",
  hint: "Half of −6 is −3, and half of 8 is 4. Add the squares of both to each side.",
  steps: [
    "Group the variables: <div class=“mathwork”>(x² − 6x) + (y² + 8y) = 0</div>",
    "Complete the square in x by adding 9, and in y by adding 16, to both sides: <div class=“mathwork”>(x² − 6x + 9) + (y² + 8y + 16) = 0 + 9 + 16</div>",
    "Write as squares: <div class=“mathwork”>(x − 3)² + (y + 4)² = 25</div>",
    "Since r² = 25, the radius is 5. (The center is (3, −4).)"
  ],
  traps: {}
},

{
  id: "m055",
  domain: "Geometry and Trigonometry",
  skill: "Circles",
  difficulty: "M",
  type: "mc",
  prompt: "In a circle with radius 10, a central angle measuring 54° intercepts an arc. What is the length of that arc?",
  choices: [
    "5.4π",
    "6π",
    "1.5π",
    "3π"
  ],
  answer: 3,
  strategy: "An arc is a fraction of the full circumference, and that fraction is (central angle)/360.",
  hint: "The circumference is 20π. What fraction of the circle is 54°?",
  steps: [
    "Full circumference: <div class=“mathwork”>C = 2π(10) = 20π</div>",
    "Fraction of the circle: <div class=“mathwork”>54 / 360 = 0.15</div>",
    "Multiply: <div class=“mathwork”>0.15 × 20π = 3π</div>"
  ],
  traps: {
    0: "Multiplied 54 by 0.1, treating degrees as though they were a length.",
    1: "Used a diameter of 20 as the radius, doubling the answer.",
    2: "Used the radius instead of the circumference (0.15 × 10π)."
  }
},

{
  id: "m056",
  domain: "Geometry and Trigonometry",
  skill: "Right triangles and trigonometry",
  difficulty: "M",
  type: "mc",
  prompt: "In a right triangle, angle A is acute and tan A = 3/4. What is the value of sin A?",
  choices: [
    "0.8",
    "0.75",
    "0.6",
    "1.25"
  ],
  answer: 2,
  strategy: "Turn a given ratio into an actual triangle: tan A = opposite/adjacent means you can label the two legs 3 and 4, then find the hypotenuse.",
  hint: "Sketch a right triangle with legs 3 and 4. What is the hypotenuse?",
  steps: [
    "tan A = opposite/adjacent = 3/4, so label the opposite leg 3 and the adjacent leg 4.",
    "Find the hypotenuse: <div class=“mathwork”>3² + 4² = 9 + 16 = 25\nhypotenuse = 5</div>",
    "sin A = opposite/hypotenuse = <div class=“mathwork”>3 / 5 = 0.6</div>"
  ],
  traps: {
    0: "That is cos A (4/5), adjacent over hypotenuse.",
    1: "That is tan A itself, 3/4 = 0.75. The question asks for a different ratio.",
    3: "That is 5/4, the reciprocal of cos A. Sine and cosine are always at most 1."
  }
},

{
  id: "m057",
  domain: "Geometry and Trigonometry",
  skill: "Circles",
  difficulty: "H",
  type: "spr",
  prompt: "In the xy-plane, the endpoints of a diameter of a circle are (−2, 3) and (6, 9). What is the radius of the circle?",
  answers: ["5"],
  strategy: "Either find the diameter's length and halve it, or find the center with the midpoint formula and measure to one endpoint. Both work, pick one and stay with it.",
  hint: "Use the distance formula on the two endpoints, then remember what a diameter is.",
  steps: [
    "Find the length of the diameter: <div class=“mathwork”>d = √[(6 − (−2))² + (9 − 3)²]\n= √[8² + 6²] = √100 = 10</div>",
    "The radius is half the diameter: <div class=“mathwork”>10 / 2 = 5</div>",
    "Cross-check with the midpoint: center = ((−2 + 6)/2, (3 + 9)/2) = (2, 6).",
    "Distance from (2, 6) to (6, 9): √(4² + 3²) = √25 = 5. ✓"
  ],
  traps: {}
},

{
  id: "m058",
  domain: "Geometry and Trigonometry",
  skill: "Area and volume",
  difficulty: "H",
  type: "spr",
  prompt: "The radius of a right circular cone is doubled and its height is cut in half. The volume of the new cone is how many times the volume of the original cone?",
  answers: ["2"],
  strategy: "Substitute the changes into the formula symbolically. Scaling questions are about which dimension is squared, so never plug in numbers before you see the structure.",
  hint: "In V = (1/3)πr²h, what happens to r² when r doubles?",
  steps: [
    "Original volume: <div class=“mathwork”>V = (1/3)πr²h</div>",
    "New dimensions: radius 2r, height h/2. Substitute: <div class=“mathwork”>V' = (1/3)π(2r)²(h/2)</div>",
    "Simplify (2r)² = 4r²: <div class=“mathwork”>V' = (1/3)π · 4r² · h/2 = 2 · (1/3)πr²h</div>",
    "So V' = 2V, the new cone has twice the volume. Doubling the radius multiplies volume by 4, and halving the height divides by 2. ✓"
  ],
  traps: {}
},

{
  id: "m059",
  domain: "Geometry and Trigonometry",
  skill: "Lines, angles, and triangles",
  difficulty: "M",
  type: "mc",
  figure: "<svg viewBox=“0 0 400 200” role=“img” aria-label='Two parallel lines cut by a transversal, with two corresponding angles labeled'><g font-family=“sans-serif” font-size=“13”><line x1=“30” y1=“60” x2=“370” y2=“60” stroke=“#1e1e1e” stroke-width=“2”/><line x1=“30” y1=“140” x2=“370” y2=“140” stroke=“#1e1e1e” stroke-width=“2”/><line x1=“110” y1=“185” x2=“290” y2=“15” stroke=“#1a4f8b” stroke-width=“2”/><text x=“340” y=“54”>ℓ</text><text x=“340” y=“134”>m</text><text x=“288” y=“30” fill=“#1a4f8b”>t</text><text x=“232” y=“52”>(2x + 30)°</text><text x=“150” y=“132”>(5x − 15)°</text></g></svg>",
  figcap: "Lines ℓ and m are parallel and are cut by transversal t (figure not drawn to scale)",
  prompt: "In the figure, lines ℓ and m are parallel and are cut by transversal t. What is the value of x?",
  choices: [
    "5",
    "45",
    "25",
    "15"
  ],
  answer: 3,
  strategy: "When parallel lines are cut by a transversal, corresponding angles are equal and co-interior angles sum to 180°. Decide which relationship the figure shows before writing an equation.",
  hint: "Both labeled angles sit on the same side of the transversal, in matching positions at each parallel line, so they are corresponding angles.",
  steps: [
    "The two labeled angles are in matching positions at the two parallel lines, so they are corresponding angles and therefore equal.",
    "Set them equal: <div class=“mathwork”>2x + 30 = 5x − 15</div>",
    "Solve: <div class=“mathwork”>45 = 3x\nx = 15</div>",
    "Check: 2(15) + 30 = 60 and 5(15) − 15 = 60. Equal. ✓"
  ],
  traps: {
    0: "Comes from a sign error such as 2x + 30 = 5x + 15.",
    1: "This is the angle measure divided by something, or 3x. The question asks for x, not for the angle, 60° is the angle.",
    2: "Comes from setting the angles' sum to 180: 7x + 15 = 180 gives x ≈ 23.6, and rounding lands near 25. That relationship applies to co-interior angles, not corresponding ones."
  }
},

{
  id: "m060",
  domain: "Geometry and Trigonometry",
  skill: "Right triangles and trigonometry",
  difficulty: "H",
  type: "mc",
  prompt: "In right triangle ABC, angle B is a right angle, AB = 5, and the measure of angle A is 60°. What is the length of BC?",
  choices: [
    "5√2",
    "(10√3)/3",
    "10",
    "5√3"
  ],
  answer: 3,
  strategy: "With a 30-60-90 triangle, use the side ratio 1 : √3 : 2 (short leg : long leg : hypotenuse) from the reference sheet. The short leg is opposite the 30° angle.",
  hint: "Angle A is 60°, so angle C is 30°. Which side is opposite the 30° angle?",
  steps: [
    "Angles are 90° at B, 60° at A, so angle C = 30°.",
    "AB is opposite angle C (30°), so AB = 5 is the short leg.",
    "In a 30-60-90 triangle the long leg is √3 times the short leg, and BC is opposite the 60° angle: <div class=“mathwork”>BC = 5√3</div>",
    "Check with trigonometry: tan A = BC/AB, so BC = 5 · tan 60° = 5√3 ≈ 8.66. ✓"
  ],
  traps: {
    0: "That is the 45-45-90 ratio. Check the angles before choosing a ratio.",
    1: "That is 5 ÷ tan 60°, which divides where it should multiply. BC is opposite the larger angle, so it must be longer than 5.",
    2: "That is the hypotenuse AC = 2 × 5 = 10, not the leg BC."
  }
}
);

/* ---------- ADDED: coverage for thin trap types ---------- */
window.MATH_BANK.push(


{
  id: "m062",
  domain: "Advanced Math",
  skill: "Nonlinear equations in one variable",
  difficulty: "H",
  type: "mc",
  prompt: "What is the solution to the equation \u221a(2x + 11) = x + 4?",
  choices: [
    "x = -5",
    "x = -1",
    "x = -1 and x = -5",
    "x = 5"
  ],
  answer: 1,
  strategy: "Square, solve, then substitute every candidate back into the original equation. Radical equations routinely produce a root that does not survive the check.",
  hint: "One of the two roots makes the right-hand side negative. A square root never is.",
  steps: [
    "Square both sides: <div class=\'mathwork\'>2x + 11 = x\u00b2 + 8x + 16</div>",
    "Collect: <div class=\'mathwork\'>x\u00b2 + 6x + 5 = 0\n(x + 1)(x + 5) = 0</div>",
    "Candidates are x = -1 and x = -5.",
    "Check: x = -1 gives \u221a9 = 3 and -1 + 4 = 3, so it works. x = -5 gives \u221a1 = 1 but -5 + 4 = -1, so it fails. The solution is x = -1."
  ],
  traps: {
    0: "The extraneous root, which makes the right side -1 while a square root is always non-negative.",
    2: "Both roots of the squared equation, reported without checking either one.",
    3: "Comes from a sign error while expanding (x + 4)\u00b2."
  }
},


{
  id: "m064",
  domain: "Problem-Solving and Data Analysis",
  skill: "Probability",
  difficulty: "M",
  type: "mc",
  figure: "<table class=\'data\'><tr><th></th><th>Cycled</th><th>Did not cycle</th><th>Total</th></tr><tr><th>Under 30</th><td>84</td><td>66</td><td>150</td></tr><tr><th>30 or over</th><td>39</td><td>111</td><td>150</td></tr><tr><th>Total</th><td>123</td><td>177</td><td>300</td></tr></table>",
  figcap: "Whether 300 survey respondents cycled to work last week, by age group",
  prompt: "The table shows survey results for 300 respondents. If one of the respondents who cycled is selected at random, what is the probability that the respondent is under 30?",
  choices: [
    "84/300",
    "150/300",
    "84/123",
    "84/150"
  ],
  answer: 2,
  strategy: "In a conditional probability the phrase after \u201cif\u201d sets the denominator. Find that group's total first, then count the successes inside it.",
  hint: "You are choosing only among people who cycled. How many of those are there?",
  steps: [
    "The condition is \u201ca respondent who cycled,\u201d so the pool is the Cycled column: 123 people.",
    "Among those 123, the number under 30 is 84.",
    "So the probability is <div class=\'mathwork\'>84 / 123</div>",
    "It reduces to 28/41, about 0.68, but 84/123 is the form given."
  ],
  traps: {
    0: "Uses all 300 respondents as the denominator, which ignores the condition entirely. This is the most common two-way-table error there is.",
    1: "The probability that a randomly chosen respondent is under 30, a different question.",
    3: "Uses the under-30 row total as the denominator. That answers \u201cgiven the respondent is under 30, did they cycle?\u201d, which reverses the condition."
  }
},

{
  id: "m065",
  domain: "Problem-Solving and Data Analysis",
  skill: "Percentages",
  difficulty: "M",
  type: "mc",
  prompt: "A bicycle originally priced at $260 is on sale for $208. What is the percent discount?",
  choices: [
    "25%",
    "20%",
    "52%",
    "80%"
  ],
  answer: 1,
  strategy: "Percent change is the change divided by the original amount. The before value always goes in the denominator.",
  hint: "The discount is $52. Fifty-two is what percent of two hundred sixty?",
  steps: [
    "Find the change: <div class=\'mathwork\'>260 - 208 = 52</div>",
    "Divide by the original price: <div class=\'mathwork\'>52 / 260 = 0.20</div>",
    "So the discount is 20%.",
    "Check: 20% of 260 is 52, and 260 - 52 = 208. \u2713"
  ],
  traps: {
    0: "Divides by the sale price instead of the original: 52/208 = 25%. The original is always the before value.",
    2: "The dollar discount read as a percentage.",
    3: "The share of the original price the buyer still pays, not the discount."
  }
},

{
  id: "m066",
  domain: "Problem-Solving and Data Analysis",
  skill: "Rates",
  difficulty: "M",
  type: "mc",
  prompt: "A machine fills 45 bottles every 90 seconds. Working at this rate, how many bottles does it fill in 1 hour and 15 minutes?",
  choices: [
    "2,250",
    "3,375",
    "56",
    "4,500"
  ],
  answer: 0,
  strategy: "Convert every quantity to one unit of time before dividing. Multi-step rate problems fail at the conversion far more often than at the arithmetic.",
  hint: "How many seconds are in 1 hour and 15 minutes? And how many 90-second intervals is that?",
  steps: [
    "Convert the time: <div class=\'mathwork\'>1 hr 15 min = 75 min = 75 \u00d7 60 = 4,500 seconds</div>",
    "Count the intervals: <div class=\'mathwork\'>4,500 \u00f7 90 = 50</div>",
    "Each interval fills 45 bottles: <div class=\'mathwork\'>50 \u00d7 45 = 2,250</div>",
    "Cross-check with a unit rate: 0.5 bottles per second \u00d7 4,500 s = 2,250. \u2713"
  ],
  traps: {
    1: "Treats the time as 75 intervals rather than converting to seconds first: 75 \u00d7 45. The units were never reconciled.",
    2: "Divides where it should multiply, giving intervals rather than bottles.",
    3: "The number of seconds in the period, reported as bottles."
  }
},

{
  id: "m061",
  domain: "Advanced Math",
  skill: "Nonlinear equations in one variable",
  difficulty: "H",
  type: "mc",
  prompt: "What is the solution to the equation \u221a(3x + 4) = x \u2212 2?",
  choices: [
    "x = 0",
    "x = 3",
    "x = 0 and x = 7",
    "x = 7"
  ],
  answer: 3,
  strategy: "Squaring both sides can create solutions that fail in the original equation. Every candidate has to be substituted back before you pick.",
  hint: "Squaring gives a quadratic with two roots. Look at the right-hand side to see which one cannot work.",
  steps: [
    "Square both sides: <div class=\'mathwork\'>3x + 4 = (x \u2212 2)\u00b2\n3x + 4 = x\u00b2 \u2212 4x + 4</div>",
    "Collect on one side: <div class=\'mathwork\'>x\u00b2 \u2212 7x = 0\nx(x \u2212 7) = 0</div>",
    "So the candidates are x = 0 and x = 7.",
    "Check both in the original. x = 7 gives \u221a25 = 5 and 7 \u2212 2 = 5, so it works. x = 0 gives \u221a4 = 2 but 0 \u2212 2 = \u22122, and a square root is never negative, so x = 0 is extraneous."
  ],
  traps: {
    0: "The extraneous root. It solves the squared equation but makes the right side negative, which a square root can never equal. This is exactly what the question is testing.",
    1: "Gives \u221a13 on the left and 1 on the right.",
    2: "Reports both roots of the squared equation without checking either one, which is the habit that produces the extraneous root in the first place."
  }
},

{
  id: "m063",
  domain: "Advanced Math",
  skill: "Nonlinear equations in one variable",
  difficulty: "M",
  type: "mc",
  prompt: "What is the solution to the equation \u221a(x + 7) = x \u2212 5?",
  choices: [
    "x = 2 and x = 9",
    "x = 9",
    "x = 2",
    "x = 11"
  ],
  answer: 1,
  strategy: "Square, solve, then substitute every candidate into the equation you started with. Radical equations routinely hand you a root that does not survive that check.",
  hint: "One candidate makes the right-hand side negative, and the left-hand side is a square root.",
  steps: [
    "Square both sides: <div class=\'mathwork\'>x + 7 = (x \u2212 5)\u00b2\nx + 7 = x\u00b2 \u2212 10x + 25</div>",
    "Collect: <div class=\'mathwork\'>x\u00b2 \u2212 11x + 18 = 0\n(x \u2212 2)(x \u2212 9) = 0</div>",
    "Candidates: x = 2 and x = 9.",
    "Check: x = 9 gives \u221a16 = 4 and 9 \u2212 5 = 4, so it works. x = 2 gives \u221a9 = 3 but 2 \u2212 5 = \u22123, so it is extraneous. The solution is x = 9."
  ],
  traps: {
    0: "Both roots of the squared equation, reported without testing either against the original.",
    2: "The extraneous root, which makes the right side \u22123 while the left side is a positive square root.",
    3: "Comes from a sign slip while expanding (x \u2212 5)\u00b2."
  }
},

{
  id: "m067",
  domain: "Advanced Math",
  skill: "Nonlinear functions",
  difficulty: "M",
  type: "mc",
  prompt: "If f(x) = 2x \u2212 1 and g(x) = x\u00b2 + 3, what is the value of f(g(2))?",
  choices: [
    "12",
    "14",
    "13",
    "49"
  ],
  answer: 2,
  strategy: "Work a composition from the inside out, and write the inner value on its own line before you use it.",
  hint: "Find g(2) first, then put that number into f.",
  steps: [
    "Inner function first: <div class=\'mathwork\'>g(2) = 2\u00b2 + 3 = 7</div>",
    "Now apply f to that result: <div class=\'mathwork\'>f(7) = 2(7) \u2212 1 = 13</div>"
  ],
  traps: {
    0: "This is g(f(2)), the composition performed in the wrong order: f(2) = 3, then g(3) = 12. Order matters, and reversing it is the error this question targets.",
    1: "This is 2 \u00d7 g(2), with the \u2212 1 forgotten. One step short of the answer.",
    3: "Squares g(2) instead of substituting it into f."
  }
}

);
window.MATH_BANK.push(

{
  id: "m068",
  domain: "Advanced Math",
  skill: "Equivalent expressions",
  difficulty: "M",
  type: "mc",
  prompt: "Which expression is equivalent to (x<sup>2</sup> \u2212 4)/(x<sup>2</sup> \u2212 x \u2212 6), where x \u2260 3 and x \u2260 \u22122?",
  choices: [
    "(x + 2)/(x \u2212 3)",
    "(x \u2212 2)/(x + 3)",
    "(x \u2212 2)/(x + 2)",
    "(x \u2212 2)/(x \u2212 3)"
  ],
  answer: 3,
  strategy: "On an \u201cequivalent expression\u201d question you can skip the algebra: pick an easy number, evaluate the original, then evaluate the choices and keep the one that matches.",
  hint: "Try x = 0 in the original expression, then try it in each choice.",
  steps: [
    "Test with x = 0. The original gives <div class=\'mathwork\'>(0 \u2212 4)/(0 \u2212 0 \u2212 6) = \u22124/\u22126 = 2/3</div>",
    "Evaluate each choice at x = 0: the first gives \u22122/3, the second \u22122/3, the third \u22121, and the fourth 2/3.",
    "Only the fourth matches, so choice D is the answer.",
    "The algebra confirms it: <div class=\'mathwork\'>(x \u2212 2)(x + 2) / [(x \u2212 3)(x + 2)] = (x \u2212 2)/(x \u2212 3)</div>"
  ],
  traps: {
    0: "Cancels the wrong factor, keeping (x + 2) instead of (x \u2212 2). Testing x = 0 rules it out in seconds.",
    1: "Sign error factoring the denominator. x\u00b2 \u2212 x \u2212 6 factors as (x \u2212 3)(x + 2), not (x + 3)(x \u2212 2).",
    2: "Cancels the (x \u2212 3) rather than the shared (x + 2)."
  }
},

{
  id: "m069",
  domain: "Algebra",
  skill: "Linear inequalities",
  difficulty: "M",
  type: "mc",
  prompt: "<div class=\'mathwork\'>y \u2265 2x \u2212 3\ny < \u2212x + 6</div>Which ordered pair (x, y) is a solution to the system of inequalities above?",
  choices: [
    "(0, 0)",
    "(4, 4)",
    "(1, 5)",
    "(5, 0)"
  ],
  answer: 0,
  strategy: "Do not graph. Test each pair in both inequalities and stop the moment one fails. Testing four points is far quicker than sketching two regions.",
  hint: "A solution has to satisfy both lines, not just one.",
  steps: [
    "Test (0, 0): is 0 \u2265 2(0) \u2212 3 = \u22123? Yes. Is 0 < \u22120 + 6 = 6? Yes. Both hold, so this is the solution.",
    "Test (4, 4): is 4 \u2265 2(4) \u2212 3 = 5? No. Eliminated.",
    "Test (1, 5): is 5 \u2265 \u22121? Yes. Is 5 < \u22121 + 6 = 5? No, 5 is not less than 5. Eliminated.",
    "Test (5, 0): is 0 \u2265 2(5) \u2212 3 = 7? No. Eliminated."
  ],
  traps: {
    1: "Fails both inequalities, but it sits close enough to the boundary lines to look plausible on a rough sketch.",
    2: "Satisfies the first inequality and misses the second by exactly nothing: y must be strictly less than 5. Watch whether the sign is < or \u2264.",
    3: "Satisfies the second inequality only."
  }
},

{
  id: "m070",
  domain: "Algebra",
  skill: "Systems of two linear equations",
  difficulty: "M",
  type: "mc",
  prompt: "A theater sold 340 tickets in total. Adult tickets cost $14 each and child tickets cost $8 each, and the total receipts were $3,800. How many child tickets were sold?",
  choices: [
    "140",
    "180",
    "200",
    "160"
  ],
  answer: 3,
  strategy: "With numbers in the choices you can test them instead of solving. Pick a choice, get the other quantity from the total, and check the money.",
  hint: "If 160 child tickets were sold, how many adult tickets is that, and what would the receipts come to?",
  steps: [
    "Test choice D, 160 child tickets. Then adult tickets are <div class=\'mathwork\'>340 \u2212 160 = 180</div>",
    "Check the money: <div class=\'mathwork\'>180 \u00d7 14 = 2,520\n160 \u00d7 8 = 1,280\n2,520 + 1,280 = 3,800</div>",
    "That matches the receipts exactly, so 160 is the answer.",
    "The algebra agrees: with a + c = 340 and 14a + 8c = 3,800, substituting gives 4,760 \u2212 6c = 3,800, so c = 160."
  ],
  traps: {
    0: "140 child tickets and 200 adult would bring in $3,920, which is $120 too much.",
    1: "This is the number of adult tickets. The work is right and the wrong quantity gets reported, which is the most common way to lose this question.",
    2: "200 child and 140 adult would bring in $3,560."
  }
},

{
  id: "m071",
  domain: "Advanced Math",
  skill: "Nonlinear functions",
  difficulty: "M",
  type: "mc",
  prompt: "If h(x) = 3x + 2 and k(x) = x<sup>2</sup> \u2212 1, what is the value of k(h(1))?",
  choices: [
    "2",
    "25",
    "24",
    "0"
  ],
  answer: 2,
  strategy: "Work from the inside out and write the inner value on its own line. The outer function is applied to that number, not to the original input.",
  hint: "Find h(1) first, then put that result into k.",
  steps: [
    "Inner function: <div class=\'mathwork\'>h(1) = 3(1) + 2 = 5</div>",
    "Now apply k to that: <div class=\'mathwork\'>k(5) = 5\u00b2 \u2212 1 = 24</div>"
  ],
  traps: {
    0: "This is h(k(1)), the composition in the wrong order: k(1) = 0, then h(0) = 2.",
    1: "This is 5\u00b2 with the \u2212 1 forgotten. One step short.",
    3: "This is k(1), which applies the outer function to the original input instead of to h(1)."
  }
}

);

/* stamp the section onto every item */
window.MATH_BANK.forEach(function (q) { q.section = 'math'; if (!q.type) q.type = 'mc'; });
