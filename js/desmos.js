/* ============================================================
   THE BUILT-IN GRAPHING CALCULATOR

   Every math question on the digital SAT comes with Desmos already
   open in Bluebook. Most students use it as a four-function
   calculator, which throws away almost all of it.

   Each entry below is a keystroke and an outcome, because "use the
   calculator" is not advice. `qids` point at questions in this bank
   where the trick is the fastest route, and verify.js checks that
   every one of those ids still exists.

   `confirm: true` marks a feature I would not swear is enabled in
   Bluebook's embedded build. Those are worth trying once in Bluebook
   before test day rather than discovering it in a timed module.
   ============================================================ */
(function (global) {
  'use strict';

  global.DESMOS = {
    intro: [
      'Desmos is on every math question, both modules, and it is the same calculator on both. ' +
      'You do not have to bring anything or turn anything on.',
      'The tricks below are ordered by how much time they save. The first three are worth more ' +
      'than the rest put together.'
    ],

    groups: [
      {
        name: 'Solve it without doing the algebra',
        blurb: 'The graph does not care whether you know the method. If the answer is a number, ' +
               'the graph can find it.',
        tricks: [
          {
            name: 'Graph both sides and click where they cross',
            type: 'y = sqrt(2x + 11)\ny = x + 4',
            then: 'Two curves appear. Click the point where they meet and Desmos prints the exact ' +
                  'coordinates. The x-value is your answer.',
            why: 'This is the single most valuable habit on the math section. It works on radical ' +
                 'equations, rational equations, absolute value equations, and anything else where ' +
                 'you would normally do several lines of algebra.',
            edge: 'It also makes extraneous roots impossible. Squaring both sides invents solutions ' +
                  'that fail in the original, but a false solution is simply not a crossing point, ' +
                  'so it never appears on the screen at all.',
            qids: ['m072', 'm025', 'm061', 'm062']
          },
          {
            name: 'Type the equation on one line to count the solutions',
            type: 'sqrt(2x + 11) = x + 4',
            then: 'Desmos draws a vertical line at every value of x that satisfies it. Two lines ' +
                  'means two solutions, one means one, none means no solution.',
            why: 'Faster than the two-line version when the question asks how many solutions there ' +
                 'are rather than what they are.',
            edge: 'Read the values off the two-line version instead. A vertical line tells you a ' +
                  'solution exists there but is harder to read a precise number from.',
            qids: ['m062', 'm063']
          },
          {
            name: 'Systems: paste both equations exactly as printed',
            type: '3x + 7y = 27\n5x - 2y = 4',
            then: 'Desmos graphs standard form directly, so there is no need to solve for y first. ' +
                  'Click the intersection for the exact point.',
            why: 'No elimination, no substitution, no arithmetic to slip on.',
            edge: 'The graph hands you a point, and the question often wants something else: x on ' +
                  'its own, or x + y, or 2y. Getting the point is the easy half.',
            qids: ['m073', 'm005', 'm007']
          },
          {
            name: 'Find where a quantity reaches a specific value',
            type: 'y = 500 * 2^(x/6)\ny = 8000',
            then: 'Add the target as its own horizontal line and click the intersection.',
            why: 'Turns "after how many hours does the colony reach 8,000" into one click, with no ' +
                 'logarithms.',
            qids: ['m022', 'm031']
          }
        ]
      },

      {
        name: 'Read the answer straight off the curve',
        blurb: 'Desmos marks the interesting points on every graph. They are clickable, and they ' +
               'give exact values, not estimates off the gridlines.',
        tricks: [
          {
            name: 'Click the grey dots for zeros, vertex, and intercepts',
            type: 'y = 2x^2 - 12x + 7',
            then: 'Grey dots appear at the x-intercepts, the y-intercept, and the vertex. Click ' +
                  'the lowest point and Desmos prints (3, -11).',
            why: 'Minimum value, maximum value, zeros, and intercepts with no formula. You never ' +
                 'need to compute -b/2a again.',
            edge: 'The vertex has two coordinates and the question wants exactly one of them. ' +
                  '"What is the minimum value" wants the y. "Where does the minimum occur" wants ' +
                  'the x. This is the most common way a correct graph turns into a wrong answer.',
            qids: ['m074', 'm024', 'm029', 'm033']
          },
          {
            name: 'Drop a vertical line to evaluate a function',
            type: 'y = x^2 - 1\nx = 3',
            then: 'Click where the vertical line meets the curve to read the value there.',
            why: 'Function notation questions, and each step of a composition like g(f(2)), without ' +
                 'substituting by hand.',
            qids: ['m027', 'm067', 'm021']
          },
          {
            name: 'Test "which expression is equivalent" by overlaying',
            type: 'y = (2x^2 + 5x - 3)/(x + 3)\ny = 2x - 1',
            then: 'If the second graph lies exactly on top of the first, they are equivalent. Toggle ' +
                  'one off and on to be sure you are looking at two curves and not one.',
            why: 'Beats factoring, and beats plugging in a number, because it tests every x at once ' +
                 'instead of one.',
            edge: 'A hole is invisible at normal zoom. Two expressions can look identical and differ ' +
                  'at exactly one excluded value, which is why these questions say x cannot equal ' +
                  'something. The graph will not show you that, so read the restriction.',
            qids: ['m075', 'm068', 'm028', 'm079']
          },
          {
            name: 'Circles graph from their equation as printed',
            type: '(x - 3)^2 + (y + 2)^2 = 25',
            then: 'The circle appears. You can see the center and count the radius off the axes.',
            why: 'Center and radius without completing the square. Also a fast check that your ' +
                 'completed square was right.',
            qids: ['m054', 'm057']
          }
        ]
      },

      {
        name: 'Questions with a letter in them',
        blurb: 'When a question says "k is a constant", Desmos will hand you a slider for it.',
        tricks: [
          {
            name: 'Let Desmos make the slider',
            type: '2x + 3y = 8\n6x + ky = 5',
            then: 'Desmos notices k is undefined and offers "add slider". Add it, then drag k and ' +
                  'watch the second line rotate.',
            why: 'For "no solution", drag until the lines are parallel and never meet. For ' +
                 '"infinitely many solutions", drag until the two lines sit on top of each other. ' +
                 'You can see which case you are in rather than remembering which is which.',
            edge: 'A slider gets you close, not exact. Once you can see roughly where it happens, ' +
                  'confirm it by matching coefficients, because the answer is often a fraction the ' +
                  'slider will not land on exactly.',
            qids: ['m077', 'm016', 'm076']
          }
        ]
      },

      {
        name: 'Inequalities shade themselves',
        blurb: 'Type an inequality instead of an equation and Desmos fills in the region.',
        tricks: [
          {
            name: 'Enter the system, then plot the candidate points',
            type: 'y >= 2x - 3\ny < -x + 6\n(0, 0)',
            then: 'The overlap of the two shaded regions is the solution set. Type each answer ' +
                  'choice as a point and see which one lands inside the overlap.',
            why: 'Turns "which ordered pair is a solution to the system" into looking at a picture.',
            edge: 'Watch the boundary. Desmos draws a dashed line for a strict inequality and a ' +
                  'solid line for one that allows equality. A point sitting on a dashed line is ' +
                  'outside the region, and that is exactly what these questions are built to catch.',
            qids: ['m012', 'm069', 'm006']
          }
        ]
      },

      {
        name: 'Data questions',
        blurb: 'Desmos will do the statistics, not just the picture. These two are worth trying in ' +
               'Bluebook once so you know they are there.',
        tricks: [
          {
            name: 'Line of best fit, computed for you',
            type: 'A table with x_1 and y_1 columns, then:\ny_1 ~ m*x_1 + b',
            then: 'Desmos fits the line and reports m and b underneath, with the residuals.',
            why: 'Line of best fit questions usually ask you to interpret the slope or predict a ' +
                 'value. Having the real numbers beats reading them off a printed scatterplot.',
            confirm: true,
            qids: ['m046']
          },
          {
            name: 'Mean, median, and spread from a list',
            type: 'mean([250, 280, 310, 340, 2820])\nmedian([250, 280, 310, 340, 2820])\nstdev([...])',
            then: 'Each one prints its value immediately.',
            why: 'Outlier questions ask you to compare the mean and the median before and after a ' +
                 'value is removed. Computing both twice by hand is where the arithmetic slips.',
            confirm: true,
            qids: ['m041', 'm019']
          }
        ]
      },

      {
        name: 'Typing it quickly',
        blurb: 'Fumbling the input is what makes people give up on the calculator. These are the ' +
               'keystrokes worth knowing before test day.',
        tricks: [
          {
            name: 'The keys that are not obvious',
            type: '^        exponent, then right arrow to get back out\n' +
                  '/        fraction, then right arrow to leave the denominator\n' +
                  'sqrt     radical\n' +
                  'abs(x)   absolute value\n' +
                  'pi       becomes the symbol\n' +
                  'x_1      underscore makes a subscript',
            then: 'The right arrow is the important one. It steps out of an exponent or a ' +
                  'denominator, and not knowing it is why expressions come out wrong.',
            why: 'Every trick above depends on typing the expression correctly on the first try.'
          },
          {
            name: 'Restrict a domain with braces',
            type: 'y = x^2 {x > 0}',
            then: 'Only the part of the graph you asked for is drawn.',
            why: 'Useful when a model only makes sense for positive time, or when two curves ' +
                 'overlap and you want to isolate one piece.'
          }
        ]
      },

      {
        name: 'When not to reach for it',
        blurb: 'The calculator costs time to type into. Sometimes that is the wrong trade.',
        tricks: [
          {
            name: 'Four cases where paper wins',
            type: 'One line of arithmetic\nA question with no numbers in it\nGeometry with no coordinates\nAnything you can already see',
            then: 'Typing takes longer than doing it. Reach for Desmos when the alternative is ' +
                  'several steps, not one.',
            why: 'Pace matters more than method. Roughly 95 seconds a question in Math, and a ' +
                 'calculator you fight with eats that.'
          },
          {
            name: 'Housekeeping that costs people points',
            type: 'Clear old lines between questions\nCheck the question again before you pick\nThe reference sheet is a separate button',
            then: 'Leftover expressions from the previous question make the new graph unreadable, ' +
                  'and it is easy to click the wrong intersection.',
            why: 'The graph answers the question you typed, not the question on the screen. Reading ' +
                 'the prompt one more time after you have the point is where the points are.'
          }
        ]
      }
    ]
  };
})(window);
