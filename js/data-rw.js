/* ============================================================
   READING AND WRITING question bank

   Format follows the digital SAT: one short passage (25-150 words)
   per question, four choices, four domains. Standard English
   Conventions items are deliberately shorter, often a single
   sentence, exactly as they are on the real test.

   Every item carries the teaching layer:
     strategy  the named move a strong test-taker makes here
     hint      a nudge that does not give the answer away
     steps     the actual walkthrough, in order
     traps     why each wrong choice was written to be tempting

   Em dashes appear only inside passages and answer choices, where
   they are authentic SAT prose and one question tests them directly.
   The app's own voice never uses them.

   The answer key is balanced across A, B, C and D. Do not add a run
   of questions that all key to the same letter: scripts/verify.js
   checks the distribution.
   ============================================================ */
window.RW_BANK = [];
window.RW_BANK.push(
{
  id: "rw001",
  domain: "Information and Ideas",
  skill: "Central Ideas and Details",
  difficulty: "E",
  type: "mc",
  passage: "<p>The axolotl, a salamander native to a few lakes near Mexico City, can regrow a lost limb—bone, muscle, nerve, and skin—in a matter of weeks. Most vertebrates cannot: a mouse that loses a leg forms a scar instead. Biologist Jessica Whited studies why. Her lab has found that within hours of an injury, axolotl cells near the wound switch on genes that are normally active only in embryos, effectively rewinding those cells to a more flexible state. Understanding that switch, Whited argues, is the first step toward asking whether mammalian cells could be coaxed to do something similar.</p>",
  prompt: "Which choice best states the main idea of the text?",
  choices: [
    "Whited's lab has identified how axolotl cells revert to an embryo-like state after injury, work she views as groundwork for regeneration in mammals.",
    "Axolotls are the only vertebrates capable of regrowing a lost limb.",
    "Whited has demonstrated that mammalian cells can be made to regrow limbs.",
    "Axolotls are threatened because they live in only a few lakes near Mexico City."
  ],
  answer: 0,
  strategy: "Predict, then match. Say the main idea in your own words before you look at the choices, then eliminate anything that is (a) true but too small, (b) bigger than the text, or (c) not in the text at all.",
  hint: "The passage spends most of its words on one lab's finding and on what that finding might lead to. Which choice covers both of those and nothing more?",
  steps: [
    "Find the topic: axolotl limb regeneration and why it happens.",
    "Find the point: Whited's lab found injured axolotl cells turn on embryo genes, and she frames this as step one toward mammals.",
    "Your prediction: 'A lab found the cellular switch behind axolotl regeneration, which may eventually matter for mammals.'",
    "Choice A is that prediction almost word for word. Confirm each half is in the text: the embryo-gene finding (sentence 4) and the mammal hope (sentence 5). Both check out."
  ],
  traps: {
    1: "“Only” is a word the text contradicts. It says <em>most</em> vertebrates cannot, not all. Watch absolute words in main-idea choices.",
    2: "Overstates the result. The text says Whited wants to <em>ask whether</em> mammalian cells could do this, not that she showed they can.",
    3: "A true-sounding detail the text never makes. The lakes are mentioned to locate the animal, not to raise conservation."
  }
},

{
  id: "rw002",
  domain: "Information and Ideas",
  skill: "Central Ideas and Details",
  difficulty: "E",
  type: "mc",
  passage: "<p>In 1892 the journalist Ida B. Wells began publishing detailed investigations of lynching in the United States. She traveled to the sites of killings, interviewed witnesses, and collected newspaper accounts and court records. Wells's method was deliberate: rather than argue from moral principle alone, she assembled statistics and case-by-case documentation so that her conclusions rested on evidence her opponents had themselves put into print.</p>",
  prompt: "According to the text, what was distinctive about Wells's approach?",
  choices: [
    "She relied on her own eyewitness testimony rather than on written sources.",
    "She grounded her arguments in documentary evidence, including material published by those she opposed.",
    "She avoided statistics because they drew attention away from individual cases.",
    "She published her findings only after courts had ruled on the cases she studied."
  ],
  answer: 1,
  strategy: "On a detail question, the answer is paraphrased somewhere in the text. Point to the line. If you cannot put your finger on it, it is not the answer.",
  hint: "The last sentence contrasts two ways of arguing. Which one does Wells use?",
  steps: [
    "The question asks what was <em>distinctive</em>, so look for a contrast. Sentence 3: “rather than argue from moral principle alone.”",
    "What she did instead: “assembled statistics and case-by-case documentation.”",
    "Whose documents? “evidence her opponents had themselves put into print.”",
    "Choice B paraphrases exactly that pair of ideas."
  ],
  traps: {
    0: "Half right, and that is what makes it dangerous. She did travel and interview, but the sentence about her method stresses documents, and “rather than written sources” reverses the text.",
    2: "Direct contradiction, she “assembled statistics.” Contradiction traps often reuse a word from the passage.",
    3: "Court records are mentioned as a source she gathered, not as a condition she waited for."
  }
},

{
  id: "rw003",
  domain: "Information and Ideas",
  skill: "Central Ideas and Details",
  difficulty: "M",
  type: "mc",
  passage: "<p>For decades ecologists assumed that a forest's largest trees mattered most to its carbon budget, and in sheer mass they do. But a survey of 48 temperate plots by Marta Ocampo complicates the picture. Ocampo's team measured not only how much carbon each tree held but how fast it was adding more. The oldest giants, they found, were nearly static—enormous but barely growing—while a cohort of mid-sized trees, individually unremarkable, accounted for most of the carbon newly captured each year.</p>",
  prompt: "Which choice best states the main idea of the text?",
  choices: [
    "Ocampo's team found that mid-sized trees, not the largest ones, account for most of a forest's yearly carbon gains.",
    "Ocampo's survey shows that a forest's largest trees hold less carbon than had been believed.",
    "Ecologists have long recognized that a tree's growth rate matters more than its total mass.",
    "The 48 plots Ocampo surveyed were unusual in containing very few old trees."
  ],
  answer: 0,
  strategy: "Watch for a stock-versus-flow distinction. Whenever a text separates <em>how much</em> something holds from <em>how fast</em> it accumulates, the answer almost always turns on that difference.",
  hint: "The text concedes one thing about big trees and then corrects a different thing. Which is which?",
  steps: [
    "Note the concession: “in sheer mass they do” matter most. So total carbon held by giants is not in dispute.",
    "Note the new measurement: how fast each tree was <em>adding</em> carbon.",
    "Note the result: giants were static; mid-sized trees captured most new carbon each year.",
    "The main idea is about yearly gains, which is choice A, which keeps the concession intact instead of contradicting it."
  ],
  traps: {
    1: "Flips stock for flow. The text never disputes how much carbon the giants hold, only how much they add.",
    2: "Contradicts “For decades ecologists assumed.” The whole point is that this reverses an assumption.",
    3: "Invents a fact about the sample. Nothing says the plots were unusual, and if they were, the finding would be worthless."
  }
},

{
  id: "rw004",
  domain: "Information and Ideas",
  skill: "Central Ideas and Details",
  difficulty: "M",
  type: "mc",
  blurb: "The following text is adapted from a short story.",
  passage: "<p>Every August, Nadia's grandmother repainted the shutters the same shade of green, mixing the color herself from two cans she kept in the cellar. Nadia had offered, more than once, to simply buy a matching gallon at the hardware store in town. Her grandmother would nod as though considering it, then set out the cans anyway. The mixing took an hour, the painting took a day, and by evening the house looked exactly as it had the summer before—which was, Nadia slowly came to understand, the entire point.</p>",
  prompt: "Which choice best states the main idea of the text?",
  choices: [
    "Nadia disapproves of her grandmother's refusal to accept help.",
    "Nadia comes to see that her grandmother's laborious ritual is valuable precisely because it changes nothing.",
    "Nadia's grandmother mixes her own paint because the hardware store cannot match the color.",
    "Nadia and her grandmother disagree about how the house ought to look."
  ],
  answer: 1,
  strategy: "In a literary passage, the last sentence usually carries the turn. Read it as the author's thesis about the scene and check it against the details.",
  hint: "“Which was, Nadia slowly came to understand, the entire point”, what is “which” pointing back to?",
  steps: [
    "Identify the ritual: same color, same cans, same result, every August.",
    "Identify the effort: an hour of mixing plus a day of painting for zero visible change.",
    "Read the final clause: “which” refers to the house looking exactly as it had before. Sameness is the point.",
    "Also note “slowly came to understand”, Nadia's shift from offering shortcuts to understanding is the arc. Choice B captures the ritual and the realization."
  ],
  traps: {
    0: "Assigns Nadia an attitude the text retires. She offered help, but the ending shows understanding, not disapproval.",
    2: "Invents a practical reason. The grandmother nods at the store idea and ignores it; no one says the color cannot be matched.",
    3: "There is no disagreement about appearance, they both want the same green. The tension was about method, and it resolves."
  }
},

{
  id: "rw005",
  domain: "Information and Ideas",
  skill: "Central Ideas and Details",
  difficulty: "H",
  type: "mc",
  passage: "<p>Historians of technology often describe the shipping container as an invention that lowered the cost of moving goods. Ana Kalinić resists that framing. The steel box itself, she notes, was neither novel nor expensive; boxes had been stacked on ships for a century. What changed, in her account, was institutional: ports rebuilt their cranes, railways redesigned their flatcars, unions renegotiated who could handle cargo, and insurers rewrote their terms. The container's cost savings, Kalinić argues, were less the cause of that reorganization than its product.</p>",
  prompt: "Which choice best states the main idea of the text?",
  choices: [
    "Kalinić claims that the shipping container did not in fact reduce the cost of shipping goods.",
    "Kalinić argues that the shipping container's cost savings resulted from a broad institutional reorganization rather than causing it.",
    "Kalinić shows that historians of technology have neglected the role of steel in modern shipping.",
    "Kalinić maintains that ports, railways, and unions initially resisted adopting the shipping container."
  ],
  answer: 1,
  strategy: "When a text ends with “less X than Y,” that clause <em>is</em> the main idea. Translate the comparison into plain cause-and-effect before reading the choices.",
  hint: "Translate the last sentence: which is the cause and which is the effect, in Kalinić's telling?",
  steps: [
    "Standard view: container → lower costs. Kalinić is arguing against this arrow.",
    "Her evidence: the box was old and cheap, so the box cannot be what changed.",
    "Her alternative: cranes, flatcars, labor rules, insurance, institutions reorganized.",
    "Final sentence: savings were “less the cause of that reorganization than its product,” i.e. reorganization → savings. Choice B states exactly that reversal."
  ],
  traps: {
    0: "She never denies the savings exist; she explains where they came from. Distinguish “X did not happen” from “X happened for a different reason.”",
    2: "Steel appears only to show the box was ordinary. A choice that promotes a passing detail to the thesis is a classic wrong answer.",
    3: "Nothing about resistance. The institutions in the text act, rebuilt, redesigned, renegotiated, rewrote."
  }
},

{
  id: "rw006",
  domain: "Information and Ideas",
  skill: "Command of Evidence (Textual)",
  difficulty: "M",
  type: "mc",
  passage: "<p>Certain desert plants open their stomata—the pores through which they take in carbon dioxide—only at night, storing the gas as an acid until daylight. Botanist Reuben Achebe hypothesizes that this schedule is driven primarily by water conservation rather than by temperature: the plants seal up during the day, he argues, chiefly to avoid losing moisture, not to avoid heat.</p>",
  prompt: "Which finding, if true, would most directly support Achebe's hypothesis?",
  choices: [
    "Plants that open their stomata at night grow more slowly than plants that open them during the day.",
    "Plants grown in hot, dry air kept their stomata closed throughout the day.",
    "Plants grown in cool but very dry air kept their stomata closed during the day, while plants grown in hot but humid air opened theirs.",
    "The acid these plants store overnight breaks down more quickly at high temperatures."
  ],
  answer: 2,
  strategy: "Two candidate causes are tangled together. The supporting evidence has to <em>pull them apart</em>: vary one while holding the other fixed.",
  hint: "Heat and dryness usually travel together in a desert. Which choice separates them?",
  steps: [
    "Name the competing explanations: dryness (Achebe) versus heat (the alternative).",
    "To support Achebe, you need a case where dryness and heat point in opposite directions.",
    "Choice C does exactly that: cool + dry → closed (tracks dryness), hot + humid → open (does not track heat).",
    "Since behavior follows moisture and ignores temperature, Achebe's explanation survives and the rival one does not."
  ],
  traps: {
    0: "Growth rate is a different question. Evidence must be about the hypothesis actually stated.",
    1: "Hot <em>and</em> dry leaves both causes in play, so the result supports either hypothesis equally. Consistent is not the same as supporting.",
    3: "This is about temperature affecting the stored acid, not about why the pores close, and if anything it points toward heat."
  }
},

{
  id: "rw007",
  domain: "Information and Ideas",
  skill: "Command of Evidence (Textual)",
  difficulty: "H",
  type: "mc",
  passage: "<p>In many songbird species, males sing more elaborate songs than females. The standard explanation is sexual selection: females prefer complexity, so complexity spreads. Ornithologist Dara Lin proposes an alternative—that elaborate song in these species is a byproduct of the broad vocal repertoire both sexes need in order to defend territory, and that female song has simply been underrecorded, because females sing less often near nests, where observers tend to listen.</p>",
  prompt: "Which finding, if true, would most directly weaken Lin's proposal?",
  choices: [
    "Recordings made continuously across entire territories found that females of these species sing rarely and simply, even where both sexes defend territory.",
    "In several songbird species, females sing frequently while foraging far from their nests.",
    "Males of these species sing most often at dawn, when few observers are in the field.",
    "Females of these species defend territory as aggressively as males do."
  ],
  answer: 0,
  strategy: "To weaken a claim, attack its load-bearing assumption. List the assumptions first, then find the choice that knocks one out.",
  hint: "Lin's proposal rests on two props: female song exists but is missed, and elaborate song comes from territory defense. What would remove both props at once?",
  steps: [
    "Assumption 1: females really do sing elaborately, observers just miss it because they listen near nests.",
    "Assumption 2: elaborate song is a byproduct of territory defense, which both sexes do.",
    "Choice A removes the observation gap (“continuously across entire territories”) and still finds female song rare and simple, so the underrecording explanation fails.",
    "Choice A breaks assumption 2 as well: it covers territories where both sexes defend, and female song is still rare and simple there, so territory defense cannot be what produces elaborate song."
  ],
  traps: {
    1: "This supports Lin by explaining how female song gets missed. On “weaken” questions, at least one choice always strengthens instead, underline the task word.",
    2: "About males, and about observer coverage of males. It does not touch either of Lin's claims.",
    3: "Supports Lin's byproduct story: shared territory defense is precisely her proposed source of the repertoire."
  }
},

{
  id: "rw008",
  domain: "Information and Ideas",
  skill: "Command of Evidence (Textual)",
  difficulty: "M",
  type: "mc",
  passage: "<p>A student writing about a short story makes the following claim: the narrator's attention to small mechanical details signals her wish to postpone the decision in front of her.</p>",
  prompt: "Which quotation from the story most effectively illustrates the student's claim?",
  choices: [
    "“The ferry was late again, and the gulls had taken up their usual places on the pilings.”",
    "“The engine's noise made conversation impossible, which I confess was a relief.”",
    "“My mother had asked me the same question in April, and I had not answered her then either.”",
    "“I counted the rivets along the gangway, then the bolts on the railing, then the rivets again, while the agent waited with my ticket in his hand.”"
  ],
  answer: 3,
  strategy: "Split the claim into its required parts, then demand that the quotation deliver every part. A quotation that hits one part and misses another is the trap, not the answer.",
  hint: "The claim needs two things at once: small mechanical details, and delay. Which quotation shows both in the same breath?",
  steps: [
    "Part 1 of the claim: “small mechanical details.” Part 2: “wish to postpone the decision.”",
    "Choice D, part 1: rivets, bolts, gangway, railing. Small mechanical details, itemized.",
    "Choice D, part 2: “then the rivets again, while the agent waited with my ticket”, she is stalling while someone waits on her choice.",
    "Only choice D satisfies both halves, so it is the strongest illustration."
  ],
  traps: {
    0: "Concrete detail, but the ferry and gulls are scenery, not mechanical minutiae, and nothing is being postponed.",
    1: "Mentions an engine and a relief at not talking, but she is not attending to details, and avoiding conversation is not deferring a decision.",
    2: "Nails the avoidance half and completely misses the mechanical-detail half. The most tempting wrong answers are always the half-fits."
  }
},

{
  id: "rw009",
  domain: "Information and Ideas",
  skill: "Command of Evidence (Textual)",
  difficulty: "H",
  type: "mc",
  passage: "<p>Sourdough starters—communities of yeast and bacteria kept alive by regular feeding—are often said to take on the character of the place where they are kept. To test this, food scientist Ilse Brandt collected starters from bakeries in fourteen cities and then maintained them side by side in a single laboratory, on identical flour and water, for six months. Brandt hypothesized that each starter's distinctive microbial makeup is largely inherited from its original community rather than continually reseeded by its surroundings.</p>",
  prompt: "Which result from Brandt's experiment, if true, would most directly support her hypothesis?",
  choices: [
    "Starters from cities with humid climates contained a greater number of bacterial species than starters from dry climates.",
    "After six months in the shared laboratory, the fourteen starters had converged on a similar microbial makeup.",
    "After six months in the shared laboratory, the fourteen starters' microbial communities remained clearly distinguishable from one another.",
    "Bakers in the fourteen cities had used noticeably different feeding schedules before the starters were collected."
  ],
  answer: 2,
  strategy: "Ask what the experiment was <em>designed</em> to hold constant. Support has to come from what varies once the shared condition is imposed.",
  hint: "Identical flour, identical water, identical room. If the environment were doing the work, what would the starters look like after six months?",
  steps: [
    "The design removes environmental differences: one lab, one flour, one water, six months.",
    "If surroundings continually reseed a starter, identical surroundings should make the starters converge.",
    "If makeup is inherited from the original community, differences should persist despite identical surroundings.",
    "Choice C reports persistent differences under shared conditions, exactly the inherited-makeup prediction."
  ],
  traps: {
    0: "A correlation with origin climate, but it says nothing about whether differences persist once the environment is equalized.",
    1: "This is the prediction of the rival hypothesis. Converging would mean the environment, not inheritance, is in charge.",
    3: "Explains why starters might have <em>started</em> different. Brandt's claim is about what keeps them different, which is the whole point of the six-month test."
  }
},

{
  id: "rw010",
  domain: "Information and Ideas",
  skill: "Command of Evidence (Quantitative)",
  difficulty: "E",
  type: "mc",
  figure: "<table class=\'data\'><tr><th>Neighborhood</th><th>Tree canopy cover (%)</th><th>Mean afternoon temperature (°F)</th></tr><tr><td>Elmwood</td><td>8</td><td>97</td></tr><tr><td>Riverside</td><td>15</td><td>94</td></tr><tr><td>Park Heights</td><td>27</td><td>91</td></tr><tr><td>Northgate</td><td>41</td><td>88</td></tr></table>",
  figcap: "Canopy cover and mean afternoon temperature in four neighborhoods of one city, July",
  passage: "<p>A researcher measured tree canopy cover and mean afternoon temperature in four neighborhoods of a single city during July. She concluded that greater canopy cover is associated with lower afternoon temperatures, noting that ______</p>",
  prompt: "Which choice most effectively uses data from the table to complete the statement?",
  choices: [
    "Northgate, with 41% canopy cover, had a mean afternoon temperature of 88°F, while Elmwood, with 8% cover, had a mean of 97°F.",
    "Park Heights had 27% canopy cover and a mean afternoon temperature of 91°F.",
    "Elmwood had the lowest canopy cover of the four neighborhoods.",
    "Riverside had a mean afternoon temperature of 94°F, higher than that of Park Heights, which had less canopy cover."
  ],
  answer: 0,
  strategy: "A claim about an association needs at least two data points that move in opposite directions. One number can never show a relationship.",
  hint: "The conclusion links two variables. How many neighborhoods do you need to cite to show a link?",
  steps: [
    "The claim has two variables: canopy cover and temperature, moving oppositely.",
    "So the completion must cite both variables for at least two neighborhoods.",
    "Choice A gives the extremes: 41% → 88°F versus 8% → 97°F. High cover pairs with low temperature.",
    "Check the table: both pairs are accurate. Choice A works."
  ],
  traps: {
    1: "Accurate but inert. A single neighborhood cannot demonstrate an association, because there is nothing to compare it with.",
    2: "Cites only canopy cover. Half the relationship is missing, so it cannot support the conclusion.",
    3: "Misreads the table. Park Heights has 27% cover, which is <em>more</em> than Riverside's 15%. Always re-check the direction words “more” and “less” against the numbers."
  }
},

{
  id: "rw011",
  domain: "Information and Ideas",
  skill: "Command of Evidence (Quantitative)",
  difficulty: "M",
  type: "mc",
  figure: "<svg viewBox=“0 0 460 250” role=“img” aria-label='Bar graph of weekly print newspaper readership by age group in 2005 and 2023'><g font-size=“11” font-family=“sans-serif”><line x1=“52” y1=“200” x2=“440” y2=“200” stroke=“#333”/><line x1=“52” y1=“20” x2=“52” y2=“200” stroke=“#333”/><text x=“10” y=“204”>0</text><text x=“10” y=“155”>20</text><text x=“10” y=“106”>40</text><text x=“10” y=“57”>60</text><text x=“4” y=“14” font-size=“10”>Percent</text><g><rect x=“72” y=“97” width=“26” height=“103” fill=“#1a4f8b”/><rect x=“100” y=“185” width=“26” height=“15” fill=“#9fb8d6”/><text x=“76” y=“216”>18-29</text><text x=“74” y=“92” font-size=“10”>42</text><text x=“106” y=“180” font-size=“10”>6</text></g><g><rect x=“162” y=“107” width=“26” height=“93” fill=“#1a4f8b”/><rect x=“190” y=“173” width=“26” height=“27” fill=“#9fb8d6”/><text x=“166” y=“216”>30-44</text><text x=“164” y=“102” font-size=“10”>38</text><text x=“194” y=“168” font-size=“10”>11</text></g><g><rect x=“252” y=“85” width=“26” height=“115” fill=“#1a4f8b”/><rect x=“280” y=“136” width=“26” height=“64” fill=“#9fb8d6”/><text x=“256” y=“216”>45-64</text><text x=“254” y=“80” font-size=“10”>47</text><text x=“283” y=“131” font-size=“10”>26</text></g><g><rect x=“342” y=“58” width=“26” height=“142” fill=“#1a4f8b”/><rect x=“370” y=“92” width=“26” height=“108” fill=“#9fb8d6”/><text x=“350” y=“216”>65+</text><text x=“344” y=“53” font-size=“10”>58</text><text x=“373” y=“87” font-size=“10”>44</text></g><rect x=“150” y=“232” width=“12” height=“10” fill=“#1a4f8b”/><text x=“167” y=“241”>2005</text><rect x=“230” y=“232” width=“12” height=“10” fill=“#9fb8d6”/><text x=“247” y=“241”>2023</text></g></svg>",
  figcap: "Respondents reporting they read a print newspaper at least weekly, by age group",
  passage: "<p>Surveys conducted in 2005 and 2023 asked adults whether they read a print newspaper at least once a week. A media analyst claims that the decline in print readership over this period was steepest among the youngest respondents.</p>",
  prompt: "Which choice best describes data from the graph that support the analyst's claim?",
  choices: [
    "Among respondents ages 45–64, weekly print readership fell from 47% to 26%.",
    "In 2023, respondents ages 65 and older reported the highest weekly print readership, at 44%.",
    "Among respondents ages 18–29, weekly print readership fell from 42% in 2005 to 6% in 2023, a larger drop than that of any older group.",
    "In 2005, respondents ages 18–29 reported lower weekly readership than respondents ages 45–64 did."
  ],
  answer: 2,
  strategy: "The claim word tells you the arithmetic. “Steepest decline” means you must compute changes and compare them, not read single bars.",
  hint: "Work out the 2005-minus-2023 drop for every age group before you pick.",
  steps: [
    "Compute the drops: 18–29: 42−6 = 36. 30–44: 38−11 = 27. 45–64: 47−26 = 21. 65+: 58−44 = 14.",
    "36 is the largest, so the youngest group did decline most steeply.",
    "The right answer must state the youngest group's change <em>and</em> compare it with the others.",
    "Choice C gives both numbers and the comparison. Correct."
  ],
  traps: {
    0: "True, and about a decline, but the wrong group and no comparison. It does not establish “steepest.”",
    1: "A true reading of one bar about the oldest group. It has nothing to do with the size of a decline.",
    3: "True (42 < 47) but about levels in a single year, not about change over time."
  }
},

{
  id: "rw012",
  domain: "Information and Ideas",
  skill: "Command of Evidence (Quantitative)",
  difficulty: "M",
  type: "mc",
  figure: "<table class=\'data\'><tr><th>Soil temperature</th><th>Alpine species: seeds germinating (%)</th><th>Lowland species: seeds germinating (%)</th></tr><tr><td>10°C</td><td>62</td><td>12</td></tr><tr><td>15°C</td><td>71</td><td>40</td></tr><tr><td>20°C</td><td>48</td><td>77</td></tr><tr><td>25°C</td><td>19</td><td>81</td></tr></table>",
  figcap: "Germination rates for two related plant species at four soil temperatures",
  passage: "<p>A team planted seeds of two related species at four soil temperatures. The researchers concluded that the alpine species is adapted to germinate in cool soils whereas the lowland species is not, pointing out that ______</p>",
  prompt: "Which choice most effectively uses data from the table to complete the statement?",
  choices: [
    "at 20°C, more lowland seeds germinated than alpine seeds.",
    "at 25°C, 81% of lowland seeds germinated, the highest rate recorded for either species.",
    "alpine seeds germinated at their highest rate, 71%, at 15°C.",
    "at 10°C, 62% of alpine seeds germinated, compared with only 12% of lowland seeds."
  ],
  answer: 3,
  strategy: "Match the evidence to the exact claim. Here the claim is a contrast between two species <em>in cool soil</em>, so the data must be cool-soil data for both species.",
  hint: "Which row of the table counts as “cool”? And how many columns does the claim require?",
  steps: [
    "The conclusion contrasts alpine (adapted to cool) with lowland (not adapted to cool).",
    "So you need the coolest row, 10°C, and both species' numbers from it.",
    "At 10°C: alpine 62%, lowland 12%. The alpine rate is high, the lowland rate is very low.",
    "Choice D reports precisely that contrast at the relevant temperature."
  ],
  traps: {
    0: "True but at 20°C, not cool soil, so it cannot support a claim about cool-soil adaptation.",
    1: "Warm-soil data. It shows the lowland species does well in heat, which is a different claim from failing in cold.",
    2: "One species only, so no contrast, and 15°C is not the coolest condition available."
  }
},

{
  id: "rw013",
  domain: "Information and Ideas",
  skill: "Command of Evidence (Quantitative)",
  difficulty: "H",
  type: "mc",
  figure: "<svg viewBox=“0 0 460 250” role=“img” aria-label='Bar graph of pollinator visits per hour to white, yellow, and purple flowers in full sun and shade'><g font-size=“11” font-family=“sans-serif”><line x1=“52” y1=“200” x2=“440” y2=“200” stroke=“#333”/><line x1=“52” y1=“20” x2=“52” y2=“200” stroke=“#333”/><text x=“24” y=“204”>0</text><text x=“24” y=“155”>6</text><text x=“20” y=“110”>12</text><text x=“20” y=“65”>18</text><text x=“20” y=“24”>24</text><text x=“0” y=“14” font-size=“9”>Visits/hr</text><g><rect x=“90” y=“110” width=“28” height=“90” fill=“#1a4f8b”/><rect x=“120” y=“58” width=“28” height=“142” fill=“#9fb8d6”/><text x=“100” y=“216”>White</text><text x=“96” y=“105” font-size=“10”>12</text><text x=“126” y=“53” font-size=“10”>19</text></g><g><rect x=“200” y=“35” width=“28” height=“165” fill=“#1a4f8b”/><rect x=“230” y=“95” width=“28” height=“105” fill=“#9fb8d6”/><text x=“206” y=“216”>Yellow</text><text x=“206” y=“30” font-size=“10”>22</text><text x=“236” y=“90” font-size=“10”>14</text></g><g><rect x=“310” y=“73” width=“28” height=“127” fill=“#1a4f8b”/><rect x=“340” y=“133” width=“28” height=“67” fill=“#9fb8d6”/><text x=“318” y=“216”>Purple</text><text x=“316” y=“68” font-size=“10”>17</text><text x=“348” y=“128” font-size=“10”>9</text></g><rect x=“150” y=“232” width=“12” height=“10” fill=“#1a4f8b”/><text x=“167” y=“241”>Full sun</text><rect x=“250” y=“232” width=“12” height=“10” fill=“#9fb8d6”/><text x=“267” y=“241”>Shade</text></g></svg>",
  figcap: "Mean pollinator visits per hour to flowers of three colors, in full sun and in shade",
  passage: "<p>Researchers recorded pollinator visits to flowers of three colors growing in full sun and in shade. They concluded that shade does not affect all flower colors in the same way: for some colors it increases visitation, while for others it reduces visitation.</p>",
  prompt: "Which choice best describes data from the graph that support the researchers' conclusion?",
  choices: [
    "In shade, white flowers received 19 visits per hour, more than yellow flowers (14) or purple flowers (9).",
    "Yellow flowers received the most visits per hour of any group, 22 per hour in full sun.",
    "White flowers received more visits per hour in shade (19) than in full sun (12), whereas yellow and purple flowers each received fewer visits in shade than in full sun.",
    "Purple flowers showed a larger difference between full sun and shade than flowers of either other color."
  ],
  answer: 2,
  strategy: "When a conclusion says “not all the same way,” the evidence must show <em>both directions</em>. A choice showing only one direction, however accurate, cannot support it.",
  hint: "The conclusion has two halves: shade helps some colors, hurts others. Both halves need numbers.",
  steps: [
    "Half one, shade increases visits: white goes 12 → 19, an increase.",
    "Half two, shade decreases visits: yellow 22 → 14 and purple 17 → 9, both decreases.",
    "Choice C reports the increase and the decreases together, so it covers the whole conclusion.",
    "Verify against the bars: 12, 19, 22, 14, 17, 9. All match."
  ],
  traps: {
    0: "Compares colors within shade only. Without the full-sun figures there is no change to speak of.",
    1: "A single maximum. It says nothing about how shade changes visitation.",
    3: "Check the arithmetic: purple 17−9 = 8 and yellow 22−14 = 8. They tie, so “larger than either other color” is false. Ranked comparisons on a graph must be computed, never eyeballed."
  }
},

{
  id: "rw014",
  domain: "Information and Ideas",
  skill: "Inferences",
  difficulty: "E",
  type: "mc",
  passage: "<p>Bees navigate partly by polarized light, which is invisible to humans but forms a predictable pattern across the sky. Under heavy cloud cover that pattern is disrupted. Researchers found that foraging bees released beneath heavy clouds took significantly longer to return to their hives than bees released under clear skies, even when the release distance was identical. This suggests that ______</p>",
  prompt: "Which choice most logically completes the text?",
  choices: [
    "bees use the sky's polarized-light pattern to orient themselves in flight.",
    "bees are unable to navigate at all without polarized light.",
    "cloud cover reduces the distance bees are willing to travel from the hive.",
    "bees prefer to forage on clear days rather than on overcast ones."
  ],
  answer: 0,
  strategy: "An inference is one small step past the evidence, never a leap. Prefer the modest, fully supported statement over the dramatic one.",
  hint: "Change one thing, get one result. What is the minimum conclusion that explains the result?",
  steps: [
    "Isolate the variable: only cloud cover differs; distance is held identical.",
    "Result: cloudy → slower return.",
    "Minimum explanation: the disrupted polarized pattern was being used for orientation, and losing it costs time.",
    "Choice A states just that, no further."
  ],
  traps: {
    1: "“At all” is too strong, the cloudy bees did get home, just slower. Extreme wording is the most common wrong-answer signature on inference questions.",
    2: "Distance was fixed by the researchers, so willingness to travel was never measured.",
    3: "Preference was not tested; the bees were released, not choosing when to fly."
  }
},

{
  id: "rw015",
  domain: "Information and Ideas",
  skill: "Inferences",
  difficulty: "M",
  type: "mc",
  passage: "<p>Excavations at a 9,000-year-old settlement have uncovered obsidian tools whose chemical signature matches a volcanic source 400 kilometers away; no obsidian occurs naturally within 200 kilometers of the site. The tools are shaped in the same style as tools found near that source, and occupation layers spanning several centuries all contain obsidian from it. Archaeologists have found no sign that the settlement's residents traveled long distances to obtain any other material. It can therefore be inferred that ______</p>",
  prompt: "Which choice most logically completes the text?",
  choices: [
    "the settlement's residents made repeated expeditions of 400 kilometers to quarry obsidian themselves.",
    "the settlement was founded by people who had migrated from the region of the volcanic source.",
    "the obsidian most likely reached the settlement through exchange with other groups rather than through direct acquisition.",
    "obsidian was the most valuable material used by the settlement's residents."
  ],
  answer: 2,
  strategy: "Let each clue eliminate an option. Ask what every sentence is doing there, SAT inference texts rarely include a detail that does not rule something out.",
  hint: "Two details do real work: the obsidian appears across several centuries, and the residents never traveled far for anything else.",
  steps: [
    "Clue 1, no local obsidian: it came from far away somehow.",
    "Clue 2, residents did not travel far for other materials: they were probably not making the 400 km trip themselves, which kills choice A.",
    "Clue 3, obsidian appears in layers across centuries: this was an ongoing supply, not stock carried in once by founders, which kills choice B.",
    "What remains is a continuing supply arriving without long trips by residents: exchange with other groups. Choice C."
  ],
  traps: {
    0: "Directly contradicted by the absence of long-distance travel for anything else.",
    1: "Tempting, because shared tool style does suggest a connection to the source region. But migration is a one-time arrival and cannot explain obsidian in every layer for centuries.",
    3: "Value is never discussed. The text tracks where the stone came from, not what it was worth."
  }
},

{
  id: "rw016",
  domain: "Information and Ideas",
  skill: "Inferences",
  difficulty: "M",
  type: "mc",
  passage: "<p>A city offered free transit passes to any resident who gave up a parking permit. Enrollment was high in neighborhoods where buses ran every ten minutes and negligible in neighborhoods where buses ran hourly, even though the passes were worth the same amount in both. Program designers had assumed that cost was the main barrier to transit use. The enrollment pattern instead suggests that, for many residents, ______</p>",
  prompt: "Which choice most logically completes the text?",
  choices: [
    "the price of transit passes had never been a barrier to riding transit.",
    "the program would have succeeded if the passes had been discounted rather than free.",
    "parking permits were more expensive than transit passes.",
    "service frequency mattered more than price in the decision to give up driving."
  ],
  answer: 3,
  strategy: "When a text says an assumption failed, the completion names the factor that actually explains the pattern. Find the variable that changed with the outcome.",
  hint: "Price was held constant across neighborhoods. Something else varied along with enrollment.",
  steps: [
    "The passes were equally valuable everywhere, so price cannot explain the difference in enrollment.",
    "What did vary: bus frequency, every ten minutes versus hourly.",
    "Enrollment tracked frequency, not price.",
    "Conclusion: frequency outweighed price for many residents. Choice D."
  ],
  traps: {
    0: "Overshoots. Price failing to explain the <em>difference between neighborhoods</em> does not prove price never mattered to anyone.",
    1: "Backwards, free is already the strongest possible discount, so making it cost more could not help.",
    2: "Might be true in the world, but the text gives no permit prices. Inferences must come from the text you were given."
  }
},

{
  id: "rw017",
  domain: "Information and Ideas",
  skill: "Inferences",
  difficulty: "H",
  type: "mc",
  passage: "<p>A thirty-year study of a fish species in an isolated lake recorded a steady decline in average adult body size. Warming water is known to reduce body size in many fish, and this lake did warm. But the decline began a full decade before the warming trend and coincided precisely with the opening of a gill-net fishery that removed the largest individuals. After the fishery closed, average body size began to recover even as the lake continued to warm. The evidence therefore indicates that ______</p>",
  prompt: "Which choice most logically completes the text?",
  choices: [
    "size-selective fishing, rather than warming, was the main driver of the decline in body size.",
    "warming water has no effect on the body size of fish in this lake.",
    "the decline in body size would have occurred even in the absence of the fishery.",
    "body size in this species recovers only when water temperatures fall."
  ],
  answer: 0,
  strategy: "Use timing to break a tie between two causes. A cause cannot precede its own effect, and a real cause should track the effect when it switches on and off.",
  hint: "Line up three dates: when the decline started, when warming started, and when size recovered.",
  steps: [
    "Decline started ten years <em>before</em> warming began, so warming cannot have started the decline.",
    "The decline started exactly when the fishery opened, onset matches.",
    "Size recovered when the fishery closed, while warming continued, removal of the suspected cause reverses the effect, and the rival cause is still present.",
    "Onset and reversal both point to fishing. Choice A, and note it says “main driver,” not “only factor.”"
  ],
  traps: {
    1: "Too absolute. The evidence shows warming was not the main driver here; it does not show warming has zero effect.",
    2: "Contradicted by the timing. Remove the fishery and the trend reverses.",
    3: "Reversed by the text: size recovered <em>while the lake kept warming</em>."
  }
},

{
  id: "rw018",
  domain: "Information and Ideas",
  skill: "Inferences",
  difficulty: "H",
  type: "mc",
  passage: "<p>Sign languages are not derived from the spoken languages around them; American Sign Language shares more grammatical structure with French Sign Language than with English. Linguists documenting a sign language that arose over three generations in a village with a high rate of inherited deafness found that its grammar grew steadily more regular with each generation of signers: the youngest cohort used consistent word order and grammatical markers that the first cohort had used only sporadically. This pattern most directly suggests that ______</p>",
  prompt: "Which choice most logically completes the text?",
  choices: [
    "sign languages come to resemble the spoken languages of their communities as they mature.",
    "grammatical regularity in a new language can emerge through transmission to new learners rather than through contact with an established language.",
    "the first generation of signers in the village communicated without any grammar.",
    "children acquire sign languages more quickly than adults do."
  ],
  answer: 1,
  strategy: "Set the opening sentence against the finding. When a text opens by ruling out one explanation, the answer is usually the mechanism that survives.",
  hint: "The village language got more regular. Where could that regularity have come from, if not from a language nearby?",
  steps: [
    "Sentence 1 rules out borrowing from surrounding spoken language.",
    "The finding: regularity increased generation by generation among signers.",
    "The only variable changing across generations is who is learning and passing the language on.",
    "So regularity was generated internally through transmission to new learners. Choice B."
  ],
  traps: {
    0: "Contradicts the first sentence, which is there precisely to rule this out.",
    2: "Too strong. The first cohort used markers “sporadically,” which is inconsistent grammar, not no grammar.",
    3: "Speed of acquisition was never measured, and the study compared generations of a language, not learners' rates."
  }
},

{
  id: "rw019",
  domain: "Craft and Structure",
  skill: "Words in Context",
  difficulty: "E",
  type: "mc",
  passage: "<p>Because the fossil record of early birds is so sparse, paleontologists usually have to work from a single specimen. A new find in Liaoning Province, China, is therefore ______: it preserves not one but eleven individuals of the same species, each at a different age.</p>",
  prompt: "Which choice completes the text with the most logical and precise word or phrase?",
  choices: [
    "unremarkable",
    "controversial",
    "valuable",
    "puzzling"
  ],
  answer: 2,
  strategy: "Cover the choices and write your own word in the blank first. Then pick the choice closest to your word, do not shop through the four options looking for one that could work.",
  hint: "“Therefore” means the blank follows from the first sentence. Specimens are usually scarce; this one has eleven.",
  steps: [
    "Read for the logical connector: “therefore” makes the blank a consequence of scarcity.",
    "Scarce material + an unusually rich find = your own word might be “important” or “a big deal.”",
    "Match: “valuable” is the choice closest to that prediction.",
    "Plug it back in and read the whole sentence to confirm it sounds like something a scientist would say."
  ],
  traps: {
    0: "Opposite of the logic. Eleven specimens where one is normal is the definition of remarkable.",
    1: "Nothing in the text signals disagreement. Do not import drama the passage never mentions.",
    3: "A rich find is not confusing. “Puzzling” would need some unexplained feature in the text."
  }
},

{
  id: "rw020",
  domain: "Craft and Structure",
  skill: "Words in Context",
  difficulty: "E",
  type: "mc",
  passage: "<p>Marine biologists once assumed the deep sea was nearly lifeless, a view that a century of sampling has since overturned. Even so, the <u>census</u> of deep-sea species remains far from complete: researchers trawling a single seamount in 2019 brought up dozens of animals matching nothing in any museum collection, and the pace of such discoveries shows no sign of slowing.</p>",
  prompt: "As used in the text, what does the word “census” most nearly mean?",
  choices: [
    "inventory",
    "prediction",
    "government count",
    "argument"
  ],
  answer: 0,
  strategy: "Words-in-context questions are not vocabulary questions. Replace the word with your own from context, then choose the match, the dictionary's most common meaning is usually a trap.",
  hint: "What is “far from complete” here? Something that could be finished if we found every species.",
  steps: [
    "Find what the sentence says about the word: the census “remains far from complete.”",
    "The rest of the sentence explains why: new species keep turning up.",
    "So the census is the running list of known species. Your word: “catalog” or “list.”",
    "“Inventory” is that word. Substitute it and reread: the inventory of deep-sea species is far from complete. Perfect fit."
  ],
  traps: {
    1: "A census records what exists now; a prediction is about the future.",
    2: "The everyday sense of “census”, a population count by a government, and therefore the tempting one. But no government appears, and species are counted by scientists.",
    3: "Nobody is arguing here; the sentence reports how much remains unknown."
  }
},

{
  id: "rw021",
  domain: "Craft and Structure",
  skill: "Words in Context",
  difficulty: "E",
  type: "mc",
  passage: "<p>Ravens are famous for solving puzzles, but their reputation rests on a small number of laboratory birds. Skeptics point out that these individuals were hand-raised and extensively trained, so their performance may not be ______ the species as a whole.</p>",
  prompt: "Which choice completes the text with the most logical and precise word or phrase?",
  choices: [
    "representative of",
    "comparable to",
    "dependent on",
    "superior to"
    ],
  answer: 0,
  strategy: "Watch the preposition. The choice has to fit both the meaning and the grammar of the sentence.",
  hint: "A handful of unusual birds may not stand in for all ravens.",
  steps: [
    "The skeptics' complaint: the tested birds are special, hand-raised, heavily trained.",
    "So the worry is that these birds do not stand for ordinary ravens.",
    "Predict: “typical of” or “a fair sample of.”",
    "“Representative of” matches, and the preposition “of” fits the sentence."
  ],
  traps: {
    1: "The right neighborhood and it fits the grammar, which is what makes it the best trap here. But comparable asks whether two things can be measured against each other, while the skeptics are asking whether these birds are typical. Typicality, not comparability.",
    2: "Sounds scientific but reverses the logic. The birds' performance depends on their training, not on the species.",
    3: "Superiority is not the issue. The question is whether these birds are typical, not whether they are better."
  }
},

{
  id: "rw022",
  domain: "Craft and Structure",
  skill: "Words in Context",
  difficulty: "M",
  type: "mc",
  passage: "<p>Reviewers of the choreographer's new work returned again and again to its <u>economy</u>: nothing in the forty-minute piece seemed added for effect, and a single lifted hand could carry an entire passage.</p>",
  prompt: "As used in the text, what does the word “economy” most nearly mean?",
  choices: [
    "abundance",
    "system of trade",
    "spareness",
    "practicality"
    ],
  answer: 2,
  strategy: "When the colon explains the word, read the explanation as the definition. The text is telling you the meaning; you only have to match it.",
  hint: "Everything after the colon describes doing a great deal with very little.",
  steps: [
    "Locate the definition clue: the colon introduces an explanation of “economy.”",
    "The explanation: nothing added for effect, one small gesture doing a lot of work.",
    "That describes using minimal means. Predict: “spareness” or “restraint.”",
    "Choice C is exactly that."
  ],
  traps: {
    0: "The opposite of what the colon goes on to explain. \u201cNothing added for effect\u201d describes restraint, not plenty. When a colon follows the word, the rest of the sentence is your definition.",
    1: "The most common meaning of “economy” in everyday reading, which is why it is offered here. It has no bearing on choreography.",
    3: "Close but wrong flavor: practicality is about usefulness, while the text praises how little the piece uses."
  }
},

{
  id: "rw023",
  domain: "Craft and Structure",
  skill: "Words in Context",
  difficulty: "M",
  type: "mc",
  passage: "<p>Historians of the period disagree about the treaty's importance but not about its ambiguity. Its central clause was drafted so that it could be read one way in London and another in Delhi, and both governments signed the document without ever ______ the difference.</p>",
  prompt: "Which choice completes the text with the most logical and precise word or phrase?",
  choices: [
    "noticing",
    "resolving",
    "exaggerating",
    "translating"
  ],
  answer: 1,
  strategy: "Use every clue about what the people involved knew. If a text says something was done on purpose, no one in it can be unaware of it.",
  hint: "The clause was drafted deliberately to be read two ways, so the negotiators clearly knew about the double meaning.",
  steps: [
    "Key phrase: “drafted so that it could be read one way in London and another in Delhi.” The ambiguity was intentional.",
    "Intentional means both sides knew. So the blank cannot be about failing to see it.",
    "What they never did was settle it: they signed while leaving the conflict in place.",
    "“Resolving” fits, and it explains why historians still discuss the ambiguity."
  ],
  traps: {
    0: "The trap that ignores “drafted so that.” You cannot deliberately build an ambiguity and then not notice it.",
    2: "Backwards: signing without comment plays the difference <em>down</em>, not up.",
    3: "There is no second language in the text, two capitals read the same English clause differently."
  }
},

{
  id: "rw024",
  domain: "Craft and Structure",
  skill: "Words in Context",
  difficulty: "M",
  type: "mc",
  passage: "<p>The economist's forecast was optimistic, but she was careful to <u>temper</u> it: growth of the kind she projected, she noted, depended on a harvest that two dry years had made unlikely.</p>",
  prompt: "As used in the text, what does the word “temper” most nearly mean?",
  choices: [
    "strengthen",
    "resent",
    "withdraw",
    "qualify"
  ],
  answer: 3,
  strategy: "Let the contrast word decide. “But” tells you the second half of the sentence pushes against the first, so the answer must run against “optimistic.”",
  hint: "She keeps the forecast but attaches a condition to it. Is that the same as taking it back?",
  steps: [
    "“Optimistic, <em>but</em>…” signals a pull in the opposite direction.",
    "What she actually does: names a condition, the harvest, that makes the growth doubtful.",
    "She neither boosts the forecast nor retracts it; she limits it.",
    "“Qualify” means exactly to add a limiting condition. Choice D."
  ],
  traps: {
    0: "Runs the wrong way against “but.” Direction errors are the most common mistake on this question type.",
    1: "“Temper” can suggest emotion, but nothing here says she dislikes her own forecast.",
    2: "Too far. The forecast still stands; only its conditions are spelled out."
  }
},

{
  id: "rw025",
  domain: "Craft and Structure",
  skill: "Words in Context",
  difficulty: "H",
  type: "mc",
  passage: "<p>Reviewers of Chiang's monograph have praised its archival range while noting that the book is largely ______: it assembles evidence that other historians had overlooked, but it stops short of proposing any interpretation of its own.</p>",
  prompt: "Which choice completes the text with the most logical and precise word or phrase?",
  choices: [
    "derivative",
    "polemical",
    "speculative",
    "descriptive"
  ],
  answer: 3,
  strategy: "On hard vocabulary blanks, define each choice in your own words before choosing, then test each definition against the clue after the colon.",
  hint: "The colon spells it out: plenty of new evidence, no interpretation offered.",
  steps: [
    "Clue: “assembles evidence … but stops short of proposing an interpretation.”",
    "Predict a word meaning “it reports but does not interpret.”",
    "Test the choices: derivative = copied from others; descriptive = reports without interpreting; speculative = guesses beyond evidence; polemical = argumentative.",
    "Only “descriptive” names a book that presents material without arguing a thesis."
  ],
  traps: {
    0: "Tempting because it sounds like a criticism of scholarship. But the evidence is new, “other historians had overlooked” it, so nothing is being copied.",
    1: "A polemic is all argument. This book makes no argument at all.",
    2: "The exact opposite. Speculating means going beyond the evidence, and this book refuses to go beyond it."
  }
},

{
  id: "rw026",
  domain: "Craft and Structure",
  skill: "Words in Context",
  difficulty: "H",
  type: "mc",
  passage: "<p>Nineteenth-century anatomists treated the adult brain as fixed—a set of structures whose functions were assigned at birth. Twentieth-century work replaced that picture with a more <u>plastic</u> one, in which regions deprived of their usual input can be recruited for entirely different tasks.</p>",
  prompt: "As used in the text, what does the word “plastic” most nearly mean?",
  choices: [
    "synthetic",
    "provisional",
    "malleable",
    "mechanical"
  ],
  answer: 2,
  strategy: "Find the word the text is contrasting with, and choose the opposite of it. Contrast structures hand you the meaning.",
  hint: "The old picture was “fixed.” The new picture is the opposite of fixed.",
  steps: [
    "Spot the contrast: nineteenth-century “fixed” versus twentieth-century “more ______.”",
    "The blank must mean roughly the opposite of fixed, capable of change.",
    "Confirm with the rest of the sentence: brain regions get “recruited for entirely different tasks.” That is change in function.",
    "“Malleable” means shapeable, the opposite of fixed. Choice C."
  ],
  traps: {
    0: "The everyday sense of plastic as a material. The SAT offers this precisely because it is the first meaning that comes to mind.",
    1: "Provisional means temporary. It describes how confident we are in the picture, not what the picture says about the brain.",
    3: "Mechanical suggests fixed parts working in fixed ways, closer to the old view being replaced."
  }
},

{
  id: "rw027",
  domain: "Craft and Structure",
  skill: "Words in Context",
  difficulty: "H",
  type: "mc",
  passage: "<p>The rover's instruments were built for a ninety-day mission, and its engineers expected Martian dust to ______ its solar panels within weeks. Fifteen years later the rover was still transmitting—in part because seasonal winds swept the panels clean.</p>",
  prompt: "Which choice completes the text with the most logical and precise word or phrase?",
  choices: [
    "fortify",
    "calibrate",
    "dislodge",
    "obscure"
  ],
  answer: 3,
  strategy: "When a later sentence describes the cure, the blank names the disease. Read the whole text before filling any blank.",
  hint: "Winds later swept the panels clean. What had the engineers expected dust to do that cleaning would undo?",
  steps: [
    "The blank is what dust was expected to do to solar panels, something bad enough to end a mission.",
    "The next sentence gives the antidote: wind “swept the panels clean,” which reverses covering.",
    "So the expected problem was dust covering the panels and blocking sunlight.",
    "“Obscure” means to cover or block from view or light. Choice D."
  ],
  traps: {
    0: "Reverses the logic, dust does not make panels work better.",
    1: "Calibration is deliberate adjustment by engineers; dust does not calibrate anything.",
    2: "“Dislodge” means to knock loose, which is close to what the <em>wind</em> did to the dust, not what dust did to panels. Watch for choices that describe the wrong actor."
  }
},

{
  id: "rw028",
  domain: "Craft and Structure",
  skill: "Text Structure and Purpose",
  difficulty: "E",
  type: "mc",
  passage: "<p>When the geologist Marie Tharp began mapping the floor of the Atlantic in 1948, she was not permitted aboard the research ships that collected the soundings. Working instead from columns of depth measurements mailed back to her office, she plotted them by hand into profile after profile of the ocean floor—and noticed a continuous valley running down the center of the mid-ocean ridge, a feature that helped establish that the seafloor is spreading apart.</p>",
  prompt: "What is the main purpose of the text?",
  choices: [
    "To describe how a scientist's unusual way of working led to a significant discovery",
    "To criticize the policies that kept Tharp from joining research voyages",
    "To explain how depth soundings of the ocean floor are collected",
    "To compare Tharp's maps with earlier maps of the Atlantic"
  ],
  answer: 0,
  strategy: "Purpose questions ask what the author is <em>doing</em>, not what the text is about. Start your own answer with a verb: describing, arguing, correcting, illustrating.",
  hint: "How much of the text is about how she worked, and where does the text end up?",
  steps: [
    "Track the sentences: (1) she was barred from the ships; (2) so she worked from mailed measurements and found the rift valley.",
    "The text ends on the discovery and its importance, so the discovery is the destination.",
    "Purpose in verb form: “to describe how her method of working produced a discovery.”",
    "Choice A matches both halves, the method and the result."
  ],
  traps: {
    1: "The exclusion is mentioned, not attacked. The author reports it in one clause and moves on; a critique would dwell there.",
    2: "The soundings are background. The text never explains how they are gathered, only that they arrived in the mail.",
    3: "No earlier maps appear anywhere in the text."
  }
},

{
  id: "rw029",
  domain: "Craft and Structure",
  skill: "Text Structure and Purpose",
  difficulty: "E",
  type: "mc",
  passage: "<p>Urban beekeeping has grown quickly in North American cities, and honeybee hives now sit on rooftops from Montreal to San Diego. <u>Honeybees, however, are a managed species, not a wild one.</u> Ecologists caution that adding hives does little for the hundreds of native bee species that actually pollinate local plants, and may even crowd them out at flowers.</p>",
  prompt: "Which choice best describes the function of the underlined portion in the text as a whole?",
  choices: [
    "It provides a statistic supporting the previous sentence.",
    "It introduces a distinction on which the rest of the text depends.",
    "It offers an explanation for the popularity of urban beekeeping.",
    "It concedes a weakness in the ecologists' argument."
  ],
  answer: 1,
  strategy: "For “function of the underlined sentence,” read the sentence before and the sentence after. The function is almost always the bridge between them.",
  hint: "What two categories does the underlined sentence separate, and which category does the last sentence talk about?",
  steps: [
    "Before: rooftop honeybee hives are booming.",
    "Underlined: honeybees are managed, not wild, it draws a line between managed and native bees.",
    "After: ecologists' concern is about <em>native</em> bee species, the other side of that line.",
    "So the sentence sets up the managed/native distinction the objection needs. Choice B."
  ],
  traps: {
    0: "There is no statistic in the underlined sentence, no number at all.",
    2: "It gives no reason for the trend. “However” signals a complication, not an explanation.",
    3: "It sets the ecologists' argument up rather than weakening it, and the author never concedes anything to beekeeping."
  }
},

{
  id: "rw030",
  domain: "Craft and Structure",
  skill: "Text Structure and Purpose",
  difficulty: "M",
  type: "mc",
  passage: "<p>Sea otters eat urchins; urchins eat kelp. Where otters were hunted out in the twentieth century, urchin populations exploded and kelp forests thinned to bare rock. Where otters have since returned, kelp has come back with them. Ecologists use the sequence to illustrate a trophic cascade: a change at the top of a food web that reshapes everything beneath it.</p>",
  prompt: "Which choice best describes the overall structure of the text?",
  choices: [
    "It defines a scientific term and then questions its usefulness.",
    "It describes a disagreement between two groups of ecologists and then sides with one.",
    "It lays out a chain of relationships, traces what happened when the chain was broken and later restored, and names the concept those events illustrate.",
    "It lists several causes of kelp forest decline in order of importance."
  ],
  answer: 2,
  strategy: "Map the text one sentence at a time in three or four words each, then find the choice whose sequence matches your map. Structure questions are about order, not content.",
  hint: "Sketch the text: sentence 1 does what? Sentence 2? Sentence 3? Sentence 4?",
  steps: [
    "Sentence 1: states who eats whom, a chain.",
    "Sentences 2 and 3: otters removed → kelp lost; otters back → kelp back. Break, then repair.",
    "Sentence 4: gives the name for this pattern, “trophic cascade.”",
    "Chain → break and repair → name. That is choice C, in the same order."
  ],
  traps: {
    0: "The definition comes last, not first, and no one questions it. Order matters in structure answers.",
    1: "No disagreement appears; the ecologists in the text all use the example the same way.",
    3: "Only one cause of decline is given, urchins, released by the loss of otters. There is no list and no ranking."
  }
},

{
  id: "rw031",
  domain: "Craft and Structure",
  skill: "Text Structure and Purpose",
  difficulty: "M",
  type: "mc",
  passage: "<p>The first commercially successful typewriters arranged the letters in the pattern we still use, an arrangement often blamed for slowing typists down. <u>The story that the layout was designed to prevent jams by separating frequently paired letters is repeated in nearly every history of the machine.</u> Yet the surviving patent record shows the arrangement changing repeatedly for reasons its inventors never explained, and no document from the period mentions jamming as a motive.</p>",
  prompt: "Which choice best describes the function of the underlined portion in the text as a whole?",
  choices: [
    "It summarizes the conclusion the text ultimately reaches.",
    "It provides evidence for the claim made in the preceding sentence.",
    "It introduces a technical problem that the inventors went on to solve.",
    "It states a widely repeated account that the text then calls into question."
  ],
  answer: 3,
  strategy: "Transition words at the start of the <em>next</em> sentence tell you what the underlined sentence was for. “Yet” after a claim means the claim was set up to be knocked down.",
  hint: "Look at the first word of the sentence after the underline.",
  steps: [
    "The underlined sentence reports a familiar story: the layout prevented jams.",
    "The next sentence begins with “Yet” and supplies contrary evidence, no period document mentions jamming.",
    "So the underlined sentence exists to be challenged.",
    "Choice D says exactly that: a widely repeated account the text questions."
  ],
  traps: {
    0: "The text's conclusion is skeptical of this story, so the sentence cannot be the summary of it.",
    1: "Backwards. The preceding sentence says the layout slows typists; the underlined sentence introduces a separate story, and the text disputes it.",
    2: "Jamming is offered as an alleged motive, not as a problem the text says was solved. In fact the text doubts jamming mattered."
  }
},

{
  id: "rw032",
  domain: "Craft and Structure",
  skill: "Text Structure and Purpose",
  difficulty: "H",
  type: "mc",
  passage: "<p>In her 1937 study of tenant farming, the sociologist described landowners' ledger books in exhaustive detail: the columns for seed advanced, the interest entered in a second hand, the annual balance that never quite reached zero. <u>Readers at the time complained that these pages were tedious.</u> But the tedium was the argument. A system that held families in place for generations did so not through dramatic acts but through the steady, unremarkable accumulation of small debts, and the study's form was built to make that visible.</p>",
  prompt: "Which choice best describes the function of the underlined portion in the text as a whole?",
  choices: [
    "It raises a criticism that the text goes on to recast as evidence of the study's design.",
    "It concedes a flaw in the study that the author is unable to explain.",
    "It supplies an example of the kind of ledger entry described earlier.",
    "It contrasts the responses of two different groups of readers."
  ],
  answer: 0,
  strategy: "When a sentence is followed by “But,” expect a reversal, and check whether the author is rejecting the sentence or reinterpreting it. Reinterpretation is the harder, more common move in a hard question.",
  hint: "The author does not deny that the pages are tedious. So what does the author do with the complaint instead?",
  steps: [
    "Underlined sentence: contemporary readers found the ledger pages boring.",
    "Next sentence: “But the tedium was the argument”, the author accepts the tedium and reassigns its meaning.",
    "Final sentence explains why: oppression worked through dull, small, repeated debts, so a dull form makes the mechanism visible.",
    "The complaint becomes proof that the form was deliberate. Choice A."
  ],
  traps: {
    1: "The author explains it thoroughly and never treats it as a flaw. This is the choice you pick if you stop reading at “But.”",
    2: "The example entries, seed, interest, balance, are in the <em>first</em> sentence. The underlined sentence is about readers.",
    3: "Only one group of readers appears. “Readers at the time” is a single group; today's readers are never mentioned."
  }
},

{
  id: "rw033",
  domain: "Craft and Structure",
  skill: "Text Structure and Purpose",
  difficulty: "H",
  type: "mc",
  passage: "<p>Standard accounts credit the printing press with spreading new ideas. Less often noticed is what it did to old ones. A manuscript copied by hand drifted: every scribe introduced errors, and a text a century old might exist in a hundred versions. Print froze a text in place, errors and all, and made the differences between versions suddenly visible. The scholars who began comparing printed editions and correcting them were doing something a manuscript culture could not easily have imagined.</p>",
  prompt: "Which choice best describes the overall structure of the text?",
  choices: [
    "It presents a familiar claim, redirects attention to an overlooked consequence, and then shows how that consequence made a new practice possible.",
    "It contrasts two competing theories about the printing press and endorses the older one.",
    "It traces the history of scribal error from antiquity through the age of print.",
    "It argues that the printing press mattered less than historians have claimed."
  ],
  answer: 0,
  strategy: "On hard structure questions, count the moves. If your map has three moves and a choice has two, the choice is wrong no matter how true it sounds.",
  hint: "Where does the text pivot, and what does it build after the pivot?",
  steps: [
    "Move 1: the familiar claim, print spread new ideas.",
    "Move 2: the pivot, “Less often noticed is what it did to old ones,” redirecting to an overlooked effect.",
    "Move 3: the mechanism, print fixed texts and exposed their differences.",
    "Move 4: the payoff, comparing and correcting editions became possible. Choice A names claim, redirection, and enabled practice, in that order."
  ],
  traps: {
    1: "There are not two theories, and nothing is endorsed as “older.” The text adds to the standard account rather than replacing it.",
    2: "Scribal drift appears as one step in the argument, not as a history being traced, and antiquity is never mentioned.",
    3: "The text makes print <em>more</em> consequential, not less, it credits print with an additional effect."
  }
},

{
  id: "rw034",
  domain: "Craft and Structure",
  skill: "Cross-Text Connections",
  difficulty: "M",
  type: "mc",
  passage: "<p><strong>Text 1</strong></p><p>Studies of “forest bathing” report that walks in wooded areas lower participants' blood pressure and self-reported stress more than walks in urban settings do. Researchers attribute the effect to properties of the forest environment itself—its light, its sound, and the volatile compounds released by trees.</p><p><strong>Text 2</strong></p><p>Nguyen notes that participants in most such studies know which environment is expected to help them, and that the urban walks used for comparison are typically routed along busy roads. In one trial where participants walked in a quiet city park instead, the difference from forest walking largely disappeared.</p>",
  prompt: "Based on the texts, how would Nguyen (Text 2) most likely respond to the attribution made by the researchers in Text 1?",
  choices: [
    "By arguing that the benefits reported in Text 1 are entirely imagined by participants",
    "By suggesting that the comparison conditions, rather than anything unique to forests, may account for the reported difference",
    "By agreeing that volatile compounds released by trees are what reduce stress",
    "By claiming that urban environments are more restorative than forests are"
  ],
  answer: 1,
  strategy: "Before reading the choices, write one sentence: “Author 2 thinks author 1 is wrong about ___.” Then choose the option matching that sentence, not the strongest-sounding objection.",
  hint: "Nguyen's park result is the key. What does it show about the <em>comparison</em> used in the original studies?",
  steps: [
    "Text 1's claim: the benefit comes from the forest itself.",
    "Nguyen's two objections: participants know what is expected, and the comparison walks are along busy roads.",
    "Her evidence: swap the busy road for a quiet park and the forest advantage nearly vanishes.",
    "So the difference may come from what forests were compared <em>against</em>. Choice B."
  ],
  traps: {
    0: "Too strong. “Largely disappeared” when the comparison improved is not the same as saying the benefit is imaginary. Expectation is one of her points, not her conclusion.",
    2: "She casts doubt on that explanation; she does not endorse it.",
    3: "She found the two settings roughly <em>equal</em>, not cities superior."
  }
},

{
  id: "rw035",
  domain: "Craft and Structure",
  skill: "Cross-Text Connections",
  difficulty: "M",
  type: "mc",
  passage: "<p><strong>Text 1</strong></p><p>Critics have generally read the novel's long descriptions of housework as social documentation: the author, they argue, wanted readers to see the labor that kept a comfortable household running.</p><p><strong>Text 2</strong></p><p>Okonjo grants that the descriptions are precise enough to serve as documentation, but she points out where they appear. Each one interrupts a conversation in which the narrator is about to say something she cannot afford to say. The scrubbing and mending, in Okonjo's reading, are an evasion the novel dramatizes rather than a record it preserves.</p>",
  prompt: "Based on the texts, how would Okonjo most likely characterize the reading described in Text 1?",
  choices: [
    "As failing to recognize that the novel is a work of fiction",
    "As correct in every respect though incomplete in its evidence",
    "As overstating how much housework the novel actually depicts",
    "As accurate about the descriptions' precision but mistaken about their purpose"
  ],
  answer: 3,
  strategy: "Look for the concession. When author 2 opens with “grants” or “admits,” the answer usually keeps that concession and disputes something else.",
  hint: "What exactly does Okonjo concede, and what exactly does she deny?",
  steps: [
    "The concession: the descriptions are “precise enough to serve as documentation.” She accepts the detail.",
    "The disagreement: their placement. They land wherever the narrator is avoiding speech.",
    "Her conclusion: the descriptions do the work of evasion, not documentation, so she disputes their function.",
    "Right on detail, wrong on purpose. Choice D."
  ],
  traps: {
    0: "She reads the book as fiction more insistently than the critics do. That is her whole point about what the novel “dramatizes.”",
    1: "“Correct in every respect” erases the disagreement. She rejects the critics' central claim about function.",
    2: "Quantity is never at issue; she agrees the descriptions are long and precise."
  }
},

{
  id: "rw036",
  domain: "Craft and Structure",
  skill: "Cross-Text Connections",
  difficulty: "H",
  type: "mc",
  passage: "<p><strong>Text 1</strong></p><p>Economists studying minimum-wage increases across a set of US counties found no measurable decline in total employment in the years following each increase. They concluded that modest increases in the minimum wage do not reduce the number of jobs.</p><p><strong>Text 2</strong></p><p>Amara does not dispute the employment totals but questions what they conceal. In the counties she examined, total employment held steady while scheduled hours per worker fell and turnover rose—changes that left many workers with lower monthly earnings despite a higher hourly rate.</p>",
  prompt: "Based on the texts, how would Amara most likely respond to the conclusion drawn in Text 1?",
  choices: [
    "By contending that steady employment totals can conceal reductions in hours and earnings that the conclusion ignores",
    "By arguing that the employment totals reported in Text 1 were calculated incorrectly",
    "By maintaining that minimum-wage increases do in fact reduce the number of available jobs",
    "By asserting that hourly wage rates matter more to workers than monthly earnings do"
  ],
  answer: 0,
  strategy: "Identify precisely what author 2 accepts. Explicit agreement on the data means the dispute is about interpretation, and every choice attacking the data is out.",
  hint: "“Does not dispute the employment totals” rules out two of these choices immediately.",
  steps: [
    "Amara accepts the totals, so any choice claiming the numbers are wrong is eliminated.",
    "Her point: the same total employment can hide fewer hours per worker and more turnover.",
    "Consequence: monthly earnings fell for many workers even though the hourly rate rose.",
    "So her objection is that the job-count measure is too coarse for the conclusion drawn. Choice A."
  ],
  traps: {
    1: "Directly contradicted, she “does not dispute the employment totals.” Underline concessions as you read the second text.",
    2: "She agrees the job count held steady. Claiming job losses would contradict her own evidence.",
    3: "Reverses her emphasis. She is worried precisely because monthly earnings fell while the hourly rate rose."
  }
},

{
  id: "rw037",
  domain: "Craft and Structure",
  skill: "Cross-Text Connections",
  difficulty: "H",
  type: "mc",
  passage: "<p><strong>Text 1</strong></p><p>The size of the largest dinosaurs is often explained by their food supply: the Mesozoic atmosphere held more carbon dioxide, plants grew faster, and the animals that ate those plants could therefore grow larger.</p><p><strong>Text 2</strong></p><p>Vasquez points out that the largest sauropods appear in the fossil record during intervals when carbon dioxide levels were comparatively low, and that the periods of highest carbon dioxide produced no size records at all. Whatever set the ceiling on sauropod size, she argues, must be sought in the animals' own biology—in the air-sac lungs and hollow bones that appear in the record just before body size begins to climb.</p>",
  prompt: "Based on the texts, Vasquez would most likely characterize the explanation given in Text 1 as",
  choices: [
    "plausible but impossible to test with the fossil evidence now available.",
    "correct for the largest sauropods but not for smaller dinosaur species.",
    "inconsistent with the timing of the fossil record and looking in the wrong place for a cause.",
    "an improvement on earlier explanations that had ignored plant growth."
  ],
  answer: 2,
  strategy: "Count author 2's objections. A hard cross-text answer often has to capture <em>two</em> of them at once, so a choice that captures only one is incomplete.",
  hint: "Vasquez makes two separate moves: one about when things happened, one about where to look for the cause.",
  steps: [
    "Objection 1, timing: record-size sauropods show up when CO₂ was low, and high-CO₂ intervals set no records. The correlation the explanation needs is absent.",
    "Objection 2, location of the cause: she relocates it to the animals' anatomy, lungs and bones.",
    "So she rejects Text 1 both on evidence and on approach.",
    "Choice C is the only option carrying both objections."
  ],
  traps: {
    0: "She does test it, using the fossil record, and finds it fails. “Untestable” is the opposite of her method.",
    1: "She offers no partial endorsement; the food-supply story fails at exactly the largest sizes it was meant to explain.",
    3: "She is rejecting the explanation, not ranking it above older ones."
  }
},

{
  id: "rw038",
  domain: "Expression of Ideas",
  skill: "Transitions",
  difficulty: "E",
  type: "mc",
  passage: "<p>The Hawaiian bobtail squid hunts at night in shallow water, where moonlight would ordinarily cast its silhouette onto the sand below. The squid, ______ houses colonies of luminous bacteria in a special organ and adjusts their glow to match the light coming from above, erasing its own shadow.</p>",
  prompt: "Which choice completes the text with the most logical transition?",
  choices: [
    "however,",
    "for example,",
    "therefore,",
    "in addition,"
  ],
  answer: 0,
  strategy: "Ignore the choices at first. Decide what the relationship is, same direction, opposite direction, cause, or example, then pick the word for that relationship.",
  hint: "“Would ordinarily” sets up an expectation. Does the squid meet that expectation or defeat it?",
  steps: [
    "Sentence 1: moonlight <em>would ordinarily</em> betray the squid with a shadow.",
    "Sentence 2: the squid glows to erase that shadow.",
    "The expectation is defeated, so the relationship is opposition.",
    "“However” is the contrast word. Read it in place to confirm it sounds right."
  ],
  traps: {
    1: "“For example” requires sentence 2 to be an instance of sentence 1. Erasing a shadow is not an example of casting one.",
    2: "“Therefore” would mean the moonlight <em>caused</em> the squid to glow. The squid's adaptation counteracts the moonlight rather than resulting from it in this sentence.",
    3: "“In addition” means one more of the same kind of thing. These two sentences point in opposite directions."
  }
},

{
  id: "rw039",
  domain: "Expression of Ideas",
  skill: "Transitions",
  difficulty: "E",
  type: "mc",
  passage: "<p>Aluminum is one of the most abundant metals in Earth's crust. ______ for most of the nineteenth century it was more valuable than gold, because no one had found an affordable way to free it from the ore in which it is locked.</p>",
  prompt: "Which choice completes the text with the most logical transition?",
  choices: [
    "Consequently,",
    "For instance,",
    "Similarly,",
    "Nevertheless,"
  ],
  answer: 3,
  strategy: "Test the transition by reading both sentences aloud with your choice inserted. A wrong transition makes the pair sound illogical even when each sentence is fine on its own.",
  hint: "Abundant things are usually cheap. Was this one?",
  steps: [
    "Sentence 1: aluminum is extremely common.",
    "Sentence 2: it used to be worth more than gold.",
    "Common things being precious is surprising, so the two sentences clash.",
    "“Nevertheless” marks that clash."
  ],
  traps: {
    0: "“Consequently” claims abundance <em>caused</em> the high price, which is backwards, abundance normally lowers price.",
    1: "“For instance” would make the price an example of abundance, which it is not.",
    2: "“Similarly” needs two like cases. There is only one substance here."
  }
},

{
  id: "rw040",
  domain: "Expression of Ideas",
  skill: "Transitions",
  difficulty: "M",
  type: "mc",
  passage: "<p>Sound travels roughly four times faster in water than in air, and low-frequency sound in particular carries for enormous distances through the ocean. Whales, ______ can communicate across stretches of water that would be impossible for land animals of comparable size.</p>",
  prompt: "Which choice completes the text with the most logical transition?",
  choices: [
    "in contrast,",
    "as a result,",
    "nonetheless,",
    "for example,"
  ],
  answer: 1,
  strategy: "Ask which sentence is the cause and which the effect. If sentence 1 explains why sentence 2 happens, you need a result transition.",
  hint: "Why can whales call across such distances? The previous sentence tells you.",
  steps: [
    "Sentence 1 states a physical fact: sound moves fast and far in water.",
    "Sentence 2 states what whales can do because of that fact.",
    "Fact → consequence, so the transition must show result.",
    "“As a result” fits. The land-animal comparison inside sentence 2 is a detail, not the relationship between the sentences."
  ],
  traps: {
    0: "“In contrast” is tempting because the sentence mentions land animals. But the contrast lives <em>inside</em> sentence 2; the link <em>between</em> the sentences is causal.",
    2: "“Nonetheless” would mean whales communicate far <em>despite</em> sound traveling well, which is the opposite of the logic.",
    3: "Whales are not an example of sound's speed; they are a consequence of it."
  }
},

{
  id: "rw041",
  domain: "Expression of Ideas",
  skill: "Transitions",
  difficulty: "M",
  type: "mc",
  passage: "<p>Most of a tree's mass comes from carbon it draws out of the air, not from the soil. Jan van Helmont demonstrated as much in the seventeenth century by growing a willow in a weighed pot of soil for five years: the tree gained 164 pounds while the soil lost only two ounces. ______ van Helmont drew the wrong conclusion from his own experiment, crediting the gain to water rather than to air.</p>",
  prompt: "Which choice completes the text with the most logical transition?",
  choices: [
    "Indeed,",
    "Therefore,",
    "Still,",
    "Likewise,"
  ],
  answer: 2,
  strategy: "When a text praises something and then reports a flaw in it, you need a concessive transition. Track the author's attitude sentence by sentence.",
  hint: "The experiment was right; the experimenter was wrong. Which transition can hold both?",
  steps: [
    "Sentences 1–2 are positive: the experiment established the modern view.",
    "Sentence 3 is negative: the experimenter himself misread it.",
    "Positive followed by negative about the same thing calls for concession or contrast.",
    "“Still” does that work, keeping the experiment's value while noting his error."
  ],
  traps: {
    0: "“Indeed” intensifies agreement. It would signal that his conclusion confirmed the point, but he got it wrong.",
    1: "“Therefore” claims his error followed from the data. The data pointed the other way.",
    3: "“Likewise” means “in the same way,” but this sentence reverses direction."
  }
},

{
  id: "rw042",
  domain: "Expression of Ideas",
  skill: "Transitions",
  difficulty: "M",
  type: "mc",
  passage: "<p>Excavators at the site recovered thousands of fish bones, many from deep-water species, but almost no hooks, nets, or weights of the kind used to catch fish. ______ they suspect the fish arrived through trade rather than being caught by the settlement's own residents.</p>",
  prompt: "Which choice completes the text with the most logical transition?",
  choices: [
    "For this reason,",
    "Nevertheless,",
    "In addition,",
    "Granted,"
  ],
  answer: 0,
  strategy: "Evidence first, inference second. When sentence 2 is what researchers conclude <em>from</em> sentence 1, use a cause or result transition.",
  hint: "Lots of fish, no fishing gear. Sentence 2 is what that combination implies.",
  steps: [
    "Sentence 1 is the evidence: fish bones present, fishing equipment absent.",
    "Sentence 2 is the inference: the fish came from elsewhere.",
    "Evidence → inference is a causal link.",
    "“For this reason” expresses it directly."
  ],
  traps: {
    1: "“Nevertheless” would mean they suspect trade <em>despite</em> the evidence, when the evidence is exactly why they suspect it.",
    2: "“In addition” would make the suspicion another piece of evidence rather than the conclusion drawn from it.",
    3: "“Granted” concedes a point to an opponent. There is no opposing view in this text."
  }
},

{
  id: "rw043",
  domain: "Expression of Ideas",
  skill: "Transitions",
  difficulty: "H",
  type: "mc",
  passage: "<p>Critics of the city's new bus lanes predicted that removing a lane of car traffic would worsen congestion, and travel times for cars along the corridor did rise slightly during the first month. ______ they had fallen below their original levels within a year, as riders shifted onto buses that were now faster than driving.</p>",
  prompt: "Which choice completes the text with the most logical transition?",
  choices: [
    "Accordingly,",
    "However,",
    "For instance,",
    "Moreover,"
    ],
  answer: 1,
  strategy: "Name the relationship in your own words before you look at the four words offered. Here the second sentence undercuts what the first one set you up to expect, so you need a reversal.",
  hint: "The critics predicted congestion would get worse. What does the second sentence do to that prediction?",
  steps: [
    "Sentence 1: car travel times rose in month one, the critics looked right.",
    "Sentence 2: within a year those same travel times dropped below the starting point.",
    "The early numbers backed the critics; the later numbers cut against them. The relationship is reversal.",
    "“However” is the reversal word, so choice B."
  ],
  traps: {
    0: "“Accordingly” means “as a result,” but times falling is not a consequence of times rising.",
    2: "Signals an example, and the second sentence is not an example of the first. It reports the opposite outcome, which is a reversal rather than an illustration.",
    3: "“Moreover” adds support in the same direction, and this sentence undercuts the critics rather than supporting them."
  }
},

{
  id: "rw044",
  domain: "Expression of Ideas",
  skill: "Transitions",
  difficulty: "H",
  type: "mc",
  passage: "<p>The standard treatment for the disease relieves symptoms in roughly seventy percent of patients, and most who respond report substantial improvement within weeks. ______ the drug does nothing to slow the underlying loss of nerve cells, which proceeds at the same rate whether or not a patient takes it.</p>",
  prompt: "Which choice completes the text with the most logical transition?",
  choices: [
    "In other words,",
    "That said,",
    "Consequently,",
    "Similarly,"
  ],
  answer: 1,
  strategy: "Decide whether sentence 2 <em>restates</em>, <em>results from</em>, or <em>limits</em> sentence 1. Restatement transitions are the favorite trap when two sentences share a topic.",
  hint: "Symptoms improve; the disease itself does not slow. Is the second sentence saying the first one again, or fencing it in?",
  steps: [
    "Sentence 1: the drug helps how patients feel.",
    "Sentence 2: the drug does not change the disease process itself.",
    "These are different things, symptoms versus underlying damage, so sentence 2 restricts the good news rather than repeating it.",
    "“That said” introduces exactly that kind of limitation."
  ],
  traps: {
    0: "“In other words” claims the two sentences say the same thing. Relieving symptoms and halting nerve loss are not the same claim. This is the trap for readers who see one topic and assume restatement.",
    2: "“Consequently” would make the lack of protection a result of symptom relief. No such causal chain is described.",
    3: "“Similarly” needs two parallel positives. The second sentence is a negative."
  }
},

{
  id: "rw045",
  domain: "Expression of Ideas",
  skill: "Rhetorical Synthesis",
  difficulty: "E",
  type: "mc",
  passage: "<p>While researching a topic, a student has taken the following notes:</p><ul><li>The Svalbard Global Seed Vault opened in 2008 on a Norwegian island.</li><li>It stores duplicate samples of seeds held in gene banks around the world.</li><li>It is built 120 meters inside a mountain, in permafrost.</li><li>The permafrost would keep the seeds frozen even if the cooling system failed.</li><li>In 2015 researchers withdrew seeds for the first time, to replace a collection damaged by war in Syria.</li></ul>",
  prompt: "The student wants to explain the purpose of the vault to an audience unfamiliar with it. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
  choices: [
    "The vault stores duplicate seed samples from gene banks worldwide so that a collection lost elsewhere can be restored, as a Syrian collection damaged by war was in 2015.",
    "The Svalbard Global Seed Vault, which opened in 2008, is built 120 meters inside a mountain on a Norwegian island.",
    "Because the vault sits in permafrost, its seeds would remain frozen even if the cooling system failed.",
    "In 2015, researchers withdrew seeds from the vault for the first time."
  ],
  answer: 0,
  strategy: "Underline the goal and treat it as a checklist. Every note is true, so accuracy cannot separate the choices, only relevance to the stated goal can.",
  hint: "Purpose answers the question “what is it for?” Which notes speak to that, and which describe where it is or how it is built?",
  steps: [
    "The goal is purpose: what the vault is <em>for</em>.",
    "Sort the notes: location and construction (where/how) versus duplicate storage and the Syrian withdrawal (what for).",
    "Choice A uses the purpose notes and adds the 2015 case as proof of that purpose in action.",
    "Confirm choice A invents nothing, every element appears in the notes."
  ],
  traps: {
    1: "All true, all irrelevant. Location and opening date describe the vault without saying what it does.",
    2: "Describes a safeguard, which answers “how is it protected,” not “what is it for.”",
    3: "Reports one event with no explanation of why it mattered. On synthesis questions, a bare fact almost never accomplishes a goal."
  }
},

{
  id: "rw046",
  domain: "Expression of Ideas",
  skill: "Rhetorical Synthesis",
  difficulty: "M",
  type: "mc",
  passage: "<p>While researching a topic, a student has taken the following notes:</p><ul><li>Two teams measured how quickly plastic bottles break down in seawater.</li><li>Team A submerged bottles at a depth of 20 meters in a warm coastal bay.</li><li>Team A's bottles lost 4 percent of their mass after one year.</li><li>Team B submerged identical bottles at 700 meters in the cold open ocean.</li><li>Team B's bottles showed no measurable loss of mass after one year.</li></ul>",
  prompt: "The student wants to emphasize a difference between the two teams' findings. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
  choices: [
    "Team A submerged bottles at 20 meters in a warm coastal bay, and Team B used bottles identical to Team A's.",
    "Both teams submerged plastic bottles in seawater and measured them again after one year.",
    "Team A's bottles, submerged in a warm coastal bay, lost 4 percent of their mass in a year, whereas Team B's, in the cold deep ocean, lost no measurable mass.",
    "Team B submerged its bottles at a depth of 700 meters, where the water is cold."
  ],
  answer: 2,
  strategy: "“Emphasize a difference” demands both sides and a contrast word. Any choice describing only one side is out before you even read it closely.",
  hint: "A difference in <em>findings</em>, specifically. Which choice reports what each team actually found?",
  steps: [
    "The goal names two requirements: both teams, and their findings.",
    "Eliminate the choices covering one team only (choices A and D) and the choices reporting method rather than findings (choices A and B).",
    "Choice C gives Team A's 4 percent and Team B's zero, joined by “whereas.”",
    "It also names the relevant conditions, warm and shallow versus cold and deep, which is what makes the difference meaningful."
  ],
  traps: {
    0: "Mentions both teams but no findings, and “identical bottles” is a similarity.",
    1: "Emphasizes what the teams had in common. This is the answer to the opposite goal, which is exactly why it is offered.",
    3: "One team, no comparison."
  }
},

{
  id: "rw047",
  domain: "Expression of Ideas",
  skill: "Rhetorical Synthesis",
  difficulty: "M",
  type: "mc",
  passage: "<p>While researching a topic, a student has taken the following notes:</p><ul><li>A city planted 12,000 street trees between 2012 and 2018.</li><li>A 2020 survey found that 31 percent of the planted trees had died.</li><li>Survival was highest on streets where residents had requested the planting.</li><li>On those streets, 84 percent of the trees survived.</li><li>Researchers suggest that residents watered trees they had asked for.</li></ul>",
  prompt: "The student wants to present the survival data and identify a factor associated with it. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
  choices: [
    "Between 2012 and 2018, a period of six years, a city planted 12,000 street trees.",
    "By 2020, 31 percent of the trees the city planted between 2012 and 2018 had died.",
    "Researchers suggest that residents watered the trees they had asked for.",
    "Although 31 percent of the city's 12,000 new street trees had died by 2020, survival reached 84 percent on streets where residents had requested the planting—trees those residents may have watered themselves."
  ],
  answer: 3,
  strategy: "When the goal has two parts joined by “and,” the answer must satisfy both. Count the parts before you compare choices.",
  hint: "Part one is the survival numbers. Part two is what those numbers vary with.",
  steps: [
    "Part 1 of the goal: present survival data → you need the percentages.",
    "Part 2: identify an associated factor → you need the resident-request variable.",
    "Choice D carries the overall 31 percent death rate, the 84 percent survival on requested streets, and the watering explanation.",
    "Everything in choice D traces to a note; nothing is invented."
  ],
  traps: {
    0: "Neither part, no survival data and no factor. “A period of six years” is padding the notes never needed.",
    1: "Satisfies part 1 alone. Half-goal answers are the most common trap on synthesis questions.",
    2: "Gives only the proposed mechanism, with no data at all."
  }
},

{
  id: "rw048",
  domain: "Expression of Ideas",
  skill: "Rhetorical Synthesis",
  difficulty: "M",
  type: "mc",
  passage: "<p>While researching a topic, a student has taken the following notes:</p><ul><li>Dendrochronology dates wood by matching patterns of annual growth rings.</li><li>It requires wood with many rings and a known reference sequence for the region.</li><li>A newer technique measures radiocarbon in individual rings.</li><li>Solar storms in 774 CE and 993 CE left a spike of radiocarbon in trees worldwide.</li><li>The spike fixes an exact calendar year in wood from any region, even with no reference sequence.</li></ul>",
  prompt: "The student wants to emphasize an advantage of the newer technique over dendrochronology. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
  choices: [
    "Dendrochronology dates wood by matching patterns of annual growth rings.",
    "Solar storms in 774 CE and 993 CE left a spike of radiocarbon in trees worldwide.",
    "Unlike dendrochronology, which needs a regional reference sequence, the newer technique uses the worldwide radiocarbon spike from a known solar storm to fix wood from any region to an exact year.",
    "The newer technique measures radiocarbon in the individual growth rings of a piece of wood."
  ],
  answer: 2,
  strategy: "“An advantage over X” means the answer must mention X, mention the new thing, and say what the new thing does better. Three requirements, check all three.",
  hint: "An advantage is a comparison. A choice describing only the new method cannot show one.",
  steps: [
    "Requirement 1: name the old method and its limit, needs a regional reference sequence.",
    "Requirement 2: name the new method and what it uses, the worldwide radiocarbon spike.",
    "Requirement 3: state the payoff, an exact year for wood from <em>any</em> region.",
    "Only choice C does all three, and “Unlike” makes the comparison explicit."
  ],
  traps: {
    0: "Defines the old method only. No comparison, no advantage.",
    1: "A true fact about solar storms with no mention of dating wood or of dendrochronology.",
    3: "Describes what the new technique measures but never says why that beats the old approach."
  }
},

{
  id: "rw049",
  domain: "Expression of Ideas",
  skill: "Rhetorical Synthesis",
  difficulty: "H",
  type: "mc",
  passage: "<p>While researching a topic, a student has taken the following notes:</p><ul><li>Researchers trained a computer model to identify bird species from audio recordings.</li><li>The model identified 91 percent of recordings correctly in the region where it was trained.</li><li>Its accuracy fell to 54 percent on recordings from a different continent.</li><li>Many bird species sing in distinct regional dialects.</li><li>The training set contained few recordings of juvenile birds, whose songs are less structured.</li></ul>",
  prompt: "The student wants to explain why the model's accuracy declined outside its training region. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
  choices: [
    "The model correctly identified 91 percent of the recordings collected in the region where it was trained.",
    "Researchers trained a model to identify bird species from audio recordings; it was 91 percent accurate in one region and 54 percent accurate on another continent.",
    "The model's training set contained few recordings of juvenile birds, whose songs are less structured than adults' songs.",
    "Because many bird species sing in distinct regional dialects, the model—trained on recordings from a single region—identified only 54 percent of recordings from another continent."
  ],
  answer: 3,
  strategy: "“Explain why” requires a cause, not a report. Look for the note that could serve as a mechanism, and make sure it matches the specific effect named in the goal.",
  hint: "Two notes could each hurt accuracy. Only one of them is about <em>place</em>.",
  steps: [
    "The effect to explain: accuracy dropped when the region changed.",
    "Candidate causes in the notes: regional dialects, and few juvenile recordings.",
    "Juveniles are an age gap, not a geographic one, so that note cannot explain a region-to-region drop.",
    "Dialects vary by region, so a model trained in one region mishears another. Choice D pairs that cause with the 54 percent effect."
  ],
  traps: {
    0: "Reports the good result only, with no decline and no cause.",
    1: "The strongest trap: perfectly accurate and it states the decline, yet it never says <em>why</em>. Restating the effect is not explaining it.",
    2: "A real limitation of the training set, and genuinely tempting, but it would lower accuracy everywhere, including at home. It does not explain a specifically geographic drop."
  }
},

{
  id: "rw050",
  domain: "Expression of Ideas",
  skill: "Rhetorical Synthesis",
  difficulty: "H",
  type: "mc",
  passage: "<p>While researching a topic, a student has taken the following notes:</p><ul><li>Three Bronze Age settlements were excavated in the same river valley.</li><li>At each site, the largest building stood on the highest ground.</li><li>At two of the sites, that building contained jars for storing grain.</li><li>At the third site, later farming had removed the building's floor.</li><li>None of the three sites showed any defensive walls.</li></ul>",
  prompt: "The student wants to make a generalization about the three settlements that the notes support. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
  choices: [
    "At the third settlement, later farming destroyed the largest building.",
    "Each of the three settlements used its largest building to store grain.",
    "None of the three settlements had any need to defend itself.",
    "At each of the three settlements, the largest building occupied the highest ground."
  ],
  answer: 3,
  strategy: "A supported generalization must hold for <em>every</em> case in the notes. Scan for the note that says “at each” or “all”, and be suspicious of one that says “at two.”",
  hint: "Which claim can you verify at all three sites, without assuming anything about the site whose floor is gone?",
  steps: [
    "Test choice D: note 2 says “at each site” the largest building stood highest. All three, stated directly. It holds.",
    "Test choice B: grain jars are confirmed at two sites only. The third site's floor was removed, so its contents are unknown, not absent.",
    "Test choice C: the notes report no walls found. Absence of walls is evidence about construction, not about need.",
    "Choice D is the only generalization the notes fully support."
  ],
  traps: {
    0: "Not a generalization at all: it describes one site. It also overstates the note, which says the floor was removed, not the whole building.",
    1: "Extends a two-site finding to three. Missing evidence at the third site is not the same as evidence.",
    2: "Slides from a physical fact (no walls) to a motive (no need). Watch for choices that add an explanation the notes never give."
  }
},

{
  id: "rw051",
  domain: "Expression of Ideas",
  skill: "Rhetorical Synthesis",
  difficulty: "H",
  type: "mc",
  passage: "<p>While researching a topic, a student has taken the following notes:</p><ul><li>Enzymes usually work best within a narrow range of temperatures.</li><li>An enzyme from a hot-spring microbe stays active from 45°C to 95°C.</li><li>Many industrial chemical processes run hot, destroying ordinary enzymes.</li><li>Chemists currently use metal catalysts for those hot processes.</li><li>Metal catalysts depend on rare elements and generate toxic waste.</li></ul>",
  prompt: "The student wants to explain why the hot-spring enzyme could matter to industrial chemistry. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
  choices: [
    "Enzymes generally work best within a narrow range of temperatures.",
    "Because it stays active up to 95°C, the hot-spring enzyme could replace the metal catalysts that hot industrial processes now require—catalysts that depend on rare elements and produce toxic waste.",
    "An enzyme from a hot-spring microbe remains active at temperatures from 45°C to 95°C.",
    "Industrial processes often run at temperatures that destroy ordinary enzymes, so chemists use metal catalysts instead."
  ],
  answer: 1,
  strategy: "“Why it could matter” means the answer has to reach the payoff. Follow the chain from the property to the problem it solves, and pick the choice that arrives at the end of that chain.",
  hint: "Build the chain: heat-stable enzyme → what it could replace → why replacing that is worth doing.",
  steps: [
    "Link 1: the enzyme survives to 95°C, the temperature range where ordinary enzymes fail.",
    "Link 2: those hot processes currently need metal catalysts.",
    "Link 3: metal catalysts have real costs, rare elements and toxic waste.",
    "Significance is the whole chain, and only choice B states all three links."
  ],
  traps: {
    0: "Background about enzymes in general. It sets up the problem but names no significance.",
    2: "The key property with no consequence attached. A property is not yet a reason to care.",
    3: "Describes the status quo accurately and stops there. The enzyme, the actual subject of the goal, never appears."
  }
},

{
  id: "rw052",
  domain: "Standard English Conventions",
  skill: "Boundaries",
  difficulty: "E",
  type: "mc",
  passage: "<p>The Great Basin bristlecone pine grows in thin soil at high altitude, where few other trees can survive. Its wood is unusually dense and ______ trunks can remain standing for a thousand years after the tree dies.</p>",
  prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
  choices: [
    "resinous; trunks",
    "resinous, trunks",
    "resinous trunks",
    "resinous, and, trunks"
  ],
  answer: 0,
  strategy: "Cover the blank and test each side: can it stand alone as a sentence? Two independent clauses need a period, a semicolon, or a comma plus a conjunction, never a comma by itself.",
  hint: "“Its wood is unusually dense and resinous” is a sentence. “Trunks can remain standing for a thousand years” is also a sentence.",
  steps: [
    "Left side: “Its wood is unusually dense and resinous.” Subject + verb, complete.",
    "Right side: “Trunks can remain standing for a thousand years after the tree dies.” Subject + verb, complete.",
    "Two complete sentences cannot be joined with only a comma. That is a comma splice.",
    "The semicolon is the only choice offered that legally joins two independent clauses."
  ],
  traps: {
    1: "Textbook comma splice. It is the most frequently tested error in this domain and it always sounds acceptable when you read it quickly.",
    2: "No punctuation at all creates a run-on, and it also tricks the eye into reading “resinous trunks” as a noun phrase.",
    3: "A comma after “and” is never correct here. “Resinous, and trunks…” would work; “and,” does not."
  }
},

{
  id: "rw053",
  domain: "Standard English Conventions",
  skill: "Boundaries",
  difficulty: "M",
  type: "mc",
  passage: "<p>The estate's inventory, drawn up in 1847, listed everything the family had left ______ a brass clock, two wool coats, and a bundle of unopened letters.</p>",
  prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
  choices: [
    "behind,",
    "behind:",
    "behind;",
    "behind"
  ],
  answer: 1,
  strategy: "A colon introduces a list or explanation, and it must follow a complete sentence. Check that everything before the colon could end with a period.",
  hint: "Count what would look like list items if you used a comma here.",
  steps: [
    "Check the left side: 'The estate's inventory, drawn up in 1847, listed everything the family had left behind.' Complete sentence.",
    "The right side is a list of three items, not a sentence.",
    "Complete sentence + list = colon.",
    "Confirm the colon is legal: it follows an independent clause. Correct."
  ],
  traps: {
    0: "A comma turns the sentence into a four-item list, so “everything the family had left behind” reads as one more object alongside the clock and the coats. The colon is what shows the list defines it.",
    2: "A semicolon needs a complete sentence on both sides. What follows is a list.",
    3: "No punctuation runs the list straight into the clause with nothing to introduce it."
  }
},

{
  id: "rw054",
  domain: "Standard English Conventions",
  skill: "Boundaries",
  difficulty: "E",
  type: "mc",
  passage: "<p>The paleontologist Mary Anning, whose discoveries reshaped the study of ancient marine ______ sold fossils from a shop in Lyme Regis to support her family.</p>",
  prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
  choices: [
    "reptiles",
    "reptiles,",
    "reptiles;",
    "reptiles:"
  ],
  answer: 1,
  strategy: "Punctuation comes in pairs. If extra information opens with a comma, it must close with one, find the opening mark before you choose.",
  hint: "Look back at “Anning,”. Something opened there and has not been closed.",
  steps: [
    "Identify the core sentence: “The paleontologist Mary Anning sold fossils from a shop in Lyme Regis.”",
    "“Whose discoveries reshaped the study of ancient marine reptiles” is extra information dropped into the middle.",
    "It opened with the comma after “Anning,” so it must close with a comma.",
    "Choice B supplies the closing comma."
  ],
  traps: {
    0: "Leaves the interrupter half-punctuated, open at one end, closed at neither. Unpaired punctuation is always wrong.",
    2: "A semicolon cannot close a nonessential element, and “sold fossils from a shop” is not an independent clause.",
    3: "A colon introduces; it cannot close an interrupting clause."
  }
},

{
  id: "rw055",
  domain: "Standard English Conventions",
  skill: "Boundaries",
  difficulty: "M",
  type: "mc",
  passage: "<p>The mesquite's roots—some of them reaching nine meters down into dry ______ allow the tree to survive years with almost no rain.</p>",
  prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
  choices: [
    "soil;",
    "soil,",
    "soil—",
    "soil"
  ],
  answer: 2,
  strategy: "Match the mark you were given. A dash opens the interruption, so a dash must close it, commas and dashes cannot be mixed as a pair.",
  hint: "What punctuation mark appears right after “roots”?",
  steps: [
    "The core sentence is 'The mesquite's roots allow the tree to survive years with almost no rain.'",
    "The interrupter is “some of them reaching nine meters down into dry soil.”",
    "It opens with a dash after “roots,” so the pair must be completed with a dash.",
    "Choice C closes it correctly."
  ],
  traps: {
    0: "A semicolon would need an independent clause after it; “allow the tree to survive” has no subject of its own.",
    1: "A comma cannot close what a dash opened. Mixed pairs are a favorite trap because the sentence still <em>sounds</em> fine.",
    3: "With no closing mark, the subject “roots” runs into the modifier and the sentence loses its structure."
  }
},

{
  id: "rw056",
  domain: "Standard English Conventions",
  skill: "Boundaries",
  difficulty: "H",
  type: "mc",
  passage: "<p>A survey of the shipwrecks scattered along the Outer Banks carried out over eleven summers by volunteer ______ has produced the most detailed map of the region's seafloor yet made.</p>",
  prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
  choices: [
    "divers,",
    "divers;",
    "divers",
    "divers—"
  ],
  answer: 2,
  strategy: "Never separate a subject from its verb with a single mark. When a subject is buried under long modifiers, strip them out and put subject and verb next to each other.",
  hint: "Strip the sentence to its bones. What is the subject, and what is its verb?",
  steps: [
    "Find the verb: “has produced.”",
    "Find its subject: “A survey”, everything from “of the shipwrecks” through “volunteer divers” modifies it.",
    "Subject and verb must not be split by punctuation, so the blank takes nothing.",
    "Read it stripped down: “A survey … has produced the most detailed map.” Correct."
  ],
  traps: {
    0: "The pause you hear after a long subject is real, but a single comma between subject and verb is still an error. Trust structure over sound.",
    1: "A semicolon demands a complete sentence on each side; “has produced the most detailed map” has no subject.",
    3: "A lone dash creates the same illegal split as the comma."
  }
},

{
  id: "rw057",
  domain: "Standard English Conventions",
  skill: "Boundaries",
  difficulty: "H",
  type: "mc",
  passage: "<p>The workshop drew textile conservators from three cities: Nairobi, ______ Recife, Brazil; and Chennai, India.</p>",
  prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
  choices: [
    "Kenya,",
    "Kenya:",
    "Kenya",
    "Kenya;"
  ],
  answer: 3,
  strategy: "When items in a list already contain commas, the items themselves are separated by semicolons. Look at how the other items in the series are punctuated.",
  hint: "How is “Recife, Brazil” separated from “and Chennai, India”? Match it.",
  steps: [
    "The list has three items, each a city-and-country pair: Nairobi, Kenya / Recife, Brazil / Chennai, India.",
    "Commas are already used <em>inside</em> each item.",
    "So the separators <em>between</em> items must be semicolons, and the text already shows one before “and Chennai.”",
    "Match the pattern: semicolon after “Kenya.”"
  ],
  traps: {
    0: "A comma makes six list items instead of three, and it is inconsistent with the semicolon already in the sentence.",
    1: "A colon has already introduced the list. A second colon inside it is never correct.",
    2: "No punctuation runs two items together."
  }
},

{
  id: "rw058",
  domain: "Standard English Conventions",
  skill: "Boundaries",
  difficulty: "M",
  type: "mc",
  passage: "<p>Economists have identified a small number of policies ______ reduce childhood poverty across national contexts that differ in almost every other respect.</p>",
  prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
  choices: [
    "that reliably",
    "that, reliably",
    "that reliably,",
    "that; reliably"
    ],
  answer: 0,
  strategy: "An essential clause beginning with “that” takes no comma, and never separate a relative pronoun from its verb.",
  hint: "Does “that reliably reduce childhood poverty” narrow down <em>which</em> policies, or just add color?",
  steps: [
    "“That reliably reduce childhood poverty…” tells you which policies are meant, so it is essential.",
    "Essential clauses are not set off by commas.",
    "Within the clause, “that” is the subject and “reduce” is the verb, no comma may come between them or between the adverb and the verb.",
    "Choice A leaves the clause unpunctuated, which is correct."
  ],
  traps: {
    1: "Splits the subject “that” from its verb.",
    2: "Splits the adverb from the verb it modifies and leaves an unpaired comma.",
    3: "A semicolon can only sit between two things that could each stand alone. “Economists have identified a small number of policies that” is not a sentence, so nothing here earns a semicolon."
  }
},

{
  id: "rw059",
  domain: "Standard English Conventions",
  skill: "Boundaries",
  difficulty: "E",
  type: "mc",
  passage: "<p>The museum acquired the painting in 1954 ______ it did not go on public display for another thirty years.</p>",
  prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
  choices: [
    ", but,",
    "but",
    "; but,",
    ", but"
  ],
  answer: 3,
  strategy: "Two independent clauses joined by and, but, or, so, for, nor, or yet take a comma <em>before</em> the conjunction and nothing after it.",
  hint: "Both halves are complete sentences, and the second reverses the first.",
  steps: [
    "Left clause: “The museum acquired the painting in 1954.” Complete.",
    "Right clause: “It did not go on public display for another thirty years.” Complete.",
    "Joining two complete clauses with “but” requires a comma before “but.”",
    "Nothing follows the conjunction, so choice D is correct."
  ],
  traps: {
    0: "The comma before “but” is right; the one after it is not. Read the choices character by character on this question type.",
    1: "The conjunction is there, so nothing is fused. But two independent clauses joined by “but” still need a comma in front of it. This one reads fine out loud, which is exactly why it gets picked.",
    2: "A semicolon already joins the clauses, so “but” is redundant, and the comma after it is wrong."
  }
},

{
  id: "rw060",
  domain: "Standard English Conventions",
  skill: "Form, Structure, and Sense",
  difficulty: "E",
  type: "mc",
  passage: "<p>The collection of letters, diaries, and shipping receipts donated to the archive last spring ______ the daily workings of a nineteenth-century port.</p>",
  prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
  choices: [
    "reveal",
    "reveals",
    "are revealing",
    "have revealed"
  ],
  answer: 1,
  strategy: "Cross out every prepositional phrase, then match the verb to what is left. Nouns inside “of” phrases are never the subject.",
  hint: "Strike out “of letters, diaries, and shipping receipts” and “donated to the archive last spring.” What word is left in front of the blank?",
  steps: [
    "Remove the modifiers: 'The collection … ______ the daily workings of a nineteenth-century port.'",
    "The subject is “collection”, singular, even though it contains many things.",
    "A singular subject takes a singular verb: “reveals.”",
    "Check the other options: “reveal,” “are,” and “have” are all plural forms, so only choice B can be right."
  ],
  traps: {
    0: "Agrees with “receipts,” the nearest noun, instead of the actual subject. This is the single most common agreement error the SAT tests.",
    2: "Plural “are,” and the progressive tense adds nothing the sentence needs.",
    3: "Plural “have.” Also shifts the sentence into the past when the archive's holdings still reveal this."
  }
},

{
  id: "rw061",
  domain: "Standard English Conventions",
  skill: "Form, Structure, and Sense",
  difficulty: "E",
  type: "mc",
  passage: "<p>When a honeybee colony outgrows its hive, ______ splits: roughly half the workers leave with the old queen to found a new nest, while the rest stay behind to raise a replacement.</p>",
  prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
  choices: [
    "they",
    "it",
    "one",
    "which"
  ],
  answer: 1,
  strategy: "Find the antecedent and match number exactly. Collective nouns, colony, team, committee, species, are singular in American usage.",
  hint: "What noun does the pronoun stand for? Look at “its hive” earlier in the sentence.",
  steps: [
    "The pronoun stands for “a honeybee colony.”",
    "“Colony” is singular, the sentence already treats it that way with “its hive” and “outgrows.”",
    "So the pronoun must be singular: “it.”",
    "Read it back: “When a honeybee colony outgrows its hive, it splits.” Consistent throughout."
  ],
  traps: {
    0: "Tempting because a colony contains thousands of bees, but grammatical number follows the noun, not the head count. Notice the sentence already used “its.”",
    2: "“One” is indefinite. It would mean some unnamed single thing splits, not this colony.",
    3: "“Which” cannot serve as the subject of a new independent clause here; it would create a fragment."
  }
},

{
  id: "rw062",
  domain: "Standard English Conventions",
  skill: "Form, Structure, and Sense",
  difficulty: "M",
  type: "mc",
  passage: "<p>By the time the survey team reached the summit in 1953, local guides ______ the route for decades.</p>",
  prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
  choices: [
    "had known",
    "knew",
    "know",
    "will have known"
  ],
  answer: 0,
  strategy: "Two past events in one sentence: the earlier one takes the past perfect (“had” + participle). Let the time markers set the tense.",
  hint: "“By the time” plus a date in the past tells you one thing happened before another past event.",
  steps: [
    "Event 1: the team reached the summit in 1953, simple past, and it is the later event.",
    "Event 2: the guides' knowledge, which already stretched back “for decades” before 1953, so it is earlier.",
    "The earlier of two past events takes the past perfect: “had known.”",
    "Read it back: by 1953, guides had known the route for decades. The sequence is clear."
  ],
  traps: {
    1: "Simple past flattens the sequence. It suggests the guides learned the route at the same moment the team arrived.",
    2: "Present tense contradicts 1953.",
    3: "Future perfect points forward in time, which cannot describe 1953."
  }
},

{
  id: "rw063",
  domain: "Standard English Conventions",
  skill: "Form, Structure, and Sense",
  difficulty: "M",
  type: "mc",
  passage: "<p>The two ______ conclusions differed sharply, even though both researchers had analyzed the same set of core samples.</p>",
  prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
  choices: [
    "geologist's",
    "geologists's",
    "geologists",
    "geologists'"
  ],
  answer: 3,
  strategy: "Ask two questions in order: how many owners, and do they own something? Plural owners take the apostrophe after the -s.",
  hint: "“The two…” tells you the number, and “conclusions” belongs to them.",
  steps: [
    "How many geologists? Two, “both researchers” confirms it. So the noun is plural: geologists.",
    "Do they possess the conclusions? Yes, the conclusions are theirs.",
    "Plural possessive puts the apostrophe after the -s: geologists'.",
    "Choice D."
  ],
  traps: {
    0: "Singular possessive, one geologist, which contradicts “The two.”",
    1: "'-s's' is never used for a regular plural. Reserve “s” for singular nouns.",
    2: "Plural but not possessive, so the conclusions belong to no one."
  }
},

{
  id: "rw064",
  domain: "Standard English Conventions",
  skill: "Form, Structure, and Sense",
  difficulty: "M",
  type: "mc",
  passage: "<p>______ the expedition's photographs of the ice cave have become an important record of a landscape that no longer exists.</p>",
  prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
  choices: [
    "After taking them in 1937,",
    "Taking them in 1937,",
    "They were taken in 1937,",
    "Taken in 1937,"
    ],
  answer: 3,
  strategy: "An opening modifier attaches to the subject that follows it. Name that subject before you choose, then ask whether it can perform the action in the modifier.",
  hint: "The subject after the blank is 'the expedition's photographs.' Can photographs take photographs?",
  steps: [
    "Identify the subject of the main clause: 'the expedition's photographs.'",
    "The modifier must describe the photographs.",
    "“Taken in 1937” is passive, the photographs <em>were taken</em>. That fits.",
    "The active options would mean the photographs did the taking, which is impossible. Choice D."
  ],
  traps: {
    0: "Same error again, and “them” has no antecedent yet when the reader meets it.",
    1: "Dangling modifier: it makes the photographs the ones doing the photographing.",
    2: "A different error from A and B: this is a complete sentence, so joining it to the rest with only a comma splices two sentences together. Check what kind of thing each choice is before you check the meaning."
  }
},

{
  id: "rw065",
  domain: "Standard English Conventions",
  skill: "Form, Structure, and Sense",
  difficulty: "M",
  type: "mc",
  passage: "<p>A useful field notebook records not only what the observer sees but also ______, since conditions shape what is visible in the first place.</p>",
  prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
  choices: [
    "how was the weather",
    "what the weather was like",
    "the weather conditions",
    "noting the conditions"
  ],
  answer: 1,
  strategy: "“Not only … but also” is a paired construction: whatever grammatical form follows the first half must follow the second. Put the two halves side by side and compare.",
  hint: "The first half is “what the observer sees.” Build the second half in the same shape.",
  steps: [
    "First half after “not only”: “what the observer sees”, a noun clause starting with “what.”",
    "So the second half after “but also” needs a matching “what” clause.",
    "“What the weather was like” has that structure.",
    "Read the pair together: 'records not only what the observer sees but also what the weather was like.' Balanced."
  ],
  traps: {
    0: "Question word order. “How was the weather” is an interrogative, not a noun clause, so it cannot be the object of “records.”",
    2: "A plain noun phrase. It is not ungrammatical in isolation, which is what makes it tempting, but it does not mirror the “what” clause in the first half.",
    3: "A participial phrase, which matches neither half of the pair."
  }
},

{
  id: "rw066",
  domain: "Standard English Conventions",
  skill: "Form, Structure, and Sense",
  difficulty: "H",
  type: "mc",
  passage: "<p>Among the documents recovered from the wreck ______ a passenger list, three account books, and a bundle of letters still legible after two centuries.</p>",
  prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
  choices: [
    "was",
    "is",
    "were",
    "has been"
  ],
  answer: 2,
  strategy: "When a sentence opens with a prepositional phrase and the verb comes before the subject, flip the sentence around to find the real subject.",
  hint: "Rewrite it: 'A passenger list, three account books, and a bundle of letters ______ among the documents.'",
  steps: [
    "“Among the documents recovered from the wreck” is a prepositional phrase, so the subject is not inside it.",
    "The subject comes after the verb: “a passenger list, three account books, and a bundle of letters.”",
    "That is a compound subject joined by “and”, plural.",
    "Plural subject, plural verb, and the sentence is in the past: “were.”"
  ],
  traps: {
    0: "Singular, agreeing with the first item only. In inverted sentences the ear latches onto whatever noun comes next, which is why this trap works.",
    1: "Singular <em>and</em> present tense, clashing with “recovered.”",
    3: "Singular present perfect, wrong in both number and tense."
  }
},

{
  id: "rw067",
  domain: "Standard English Conventions",
  skill: "Form, Structure, and Sense",
  difficulty: "H",
  type: "mc",
  passage: "<p>The winters described in the whaling ship's logbooks were far colder than ______ in the same waters today.</p>",
  prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
  choices: [
    "today",
    "they record",
    "those recorded",
    "the records"
  ],
  answer: 2,
  strategy: "A comparison must join two things of the same kind. Say both sides out loud: X is colder than Y, and check that Y is the same type of thing as X.",
  hint: "Colder than what? Not colder than a time or a document, colder than other winters.",
  steps: [
    "Side one of the comparison: “The winters described in the logbooks.”",
    "So side two must also be winters, not a date and not a set of records.",
    "“Those recorded in the same waters today” means “the winters recorded today.” Same kind of thing.",
    "Choice C keeps the comparison parallel."
  ],
  traps: {
    0: "Compares winters to a day. The sentence already ends with “today,” so this also repeats the word.",
    1: "“They record” makes the winters do the recording and leaves the comparison without a second term.",
    3: "Compares winters to records, documents cannot be cold. Illogical comparisons are the hard version of this question type."
  }
},

{
  id: "rw068",
  domain: "Standard English Conventions",
  skill: "Form, Structure, and Sense",
  difficulty: "H",
  type: "mc",
  passage: "<p>After reviewing the inspection reports, the county's engineers recommended that the bridge ______ closed to truck traffic until the spring floods had passed.</p>",
  prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
  choices: [
    "is",
    "was",
    "be",
    "being"
  ],
  answer: 2,
  strategy: "Verbs of recommending, requiring, insisting, and demanding take the subjunctive in the clause that follows: use the base form of the verb, with no -s and no tense marker.",
  hint: "“Recommended that the bridge ___ closed”, try the base form, the way you would say “recommended that the bridge be closed.”",
  steps: [
    "Spot the trigger verb: “recommended that…”",
    "That construction requires the subjunctive in the following clause.",
    "The subjunctive uses the base form “be,” regardless of the subject or the tense of the main verb.",
    "Read it back: “recommended that the bridge be closed to truck traffic.” Correct."
  ],
  traps: {
    0: "Present indicative. It clashes with the past-tense “recommended” and ignores the subjunctive trigger.",
    1: "Past indicative. It sounds natural because “recommended” is past, which is exactly the trap. The subjunctive does not follow the main verb's tense.",
    3: "“Being closed” leaves the clause without a finite verb, producing a fragment."
  }
}
);

/* ---------- ADDED: coverage for thin trap types ---------- */
window.RW_BANK.push(

{
  id: "rw069",
  domain: "Standard English Conventions",
  skill: "Boundaries",
  difficulty: "E",
  type: "mc",
  passage: "<p>The Atacama Desert receives almost no rain, and its thin, cloudless air distorts starlight less than the air almost anywhere else on Earth. Astronomers noticed ______ more than a dozen major observatories now sit along its ridges.</p>",
  prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
  choices: [
    "this, more",
    "this more",
    "this, and, more",
    "this; more"
  ],
  answer: 3,
  strategy: "Cover the blank and check each side. If both sides could stand alone as sentences, a comma on its own cannot join them.",
  hint: "\u201cAstronomers noticed this\u201d is a sentence. So is \u201cmore than a dozen major observatories now sit along its ridges.\u201d",
  steps: [
    "Left side: \u201cAstronomers noticed this.\u201d Subject and verb, complete.",
    "Right side: \u201cMore than a dozen major observatories now sit along its ridges.\u201d Also complete.",
    "Two complete sentences need a period, a semicolon, or a comma plus a conjunction.",
    "Only the semicolon is offered, so choice D is correct."
  ],
  traps: {
    0: "A comma alone between two complete sentences is a comma splice. It reads smoothly, which is exactly why it is the most tested error in this domain.",
    1: "No punctuation at all fuses the two sentences into a run-on.",
    2: "The comma after \u201cand\u201d is wrong. \u201cthis, and more\u201d would have worked; \u201cand,\u201d does not."
  }
},

{
  id: "rw070",
  domain: "Standard English Conventions",
  skill: "Boundaries",
  difficulty: "M",
  type: "mc",
  passage: "<p>The vaquita\u2014a porpoise found only in the northern reaches of the Gulf of California, where fewer than a dozen ______ is the most endangered marine mammal in the world.</p>",
  prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
  choices: [
    "remain,",
    "remain\u2014",
    "remain;",
    "remain"
  ],
  answer: 1,
  strategy: "Match the mark you were given. A dash opens the interruption, so a dash has to close it. Commas and dashes are never a pair.",
  hint: "Look at the punctuation right after \u201cvaquita.\u201d",
  steps: [
    "The core sentence is \u201cThe vaquita is the most endangered marine mammal in the world.\u201d",
    "Everything between is extra information, and it opened with a dash after \u201cvaquita.\u201d",
    "Paired punctuation has to match, so it closes with a dash.",
    "Choice B closes the pair correctly."
  ],
  traps: {
    0: "A comma cannot close what a dash opened. Mixed pairs are tempting because the sentence still sounds fine when you read it aloud.",
    2: "A semicolon needs a complete sentence on both sides, and \u201cis the most endangered marine mammal\u201d has no subject of its own.",
    3: "With no closing mark, the interrupter never ends and the subject never reaches its verb."
  }
},

{
  id: "rw071",
  domain: "Standard English Conventions",
  skill: "Boundaries",
  difficulty: "M",
  type: "mc",
  passage: "<p>Restoring the salt marsh turned out to need three things the original plan had not budgeted ______ a new tide gate, ten thousand native seedlings, and five years of waiting.</p>",
  prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
  choices: [
    "for:",
    "for,",
    "for;",
    "for"
  ],
  answer: 0,
  strategy: "A colon introduces a list, and everything before it has to be a complete sentence on its own. Check that first, then check what follows.",
  hint: "Count how many things would look like list items if you used a comma here.",
  steps: [
    "Check the left side: \u201cRestoring the salt marsh turned out to need three things the original plan had not budgeted for.\u201d Complete.",
    "What follows is a list of three items, not a sentence.",
    "Complete sentence plus list means a colon.",
    "Choice A is correct."
  ],
  traps: {
    1: "A comma turns this into a four-item list, so \u201cthree things the original plan had not budgeted for\u201d reads as one more item alongside the tide gate.",
    2: "A semicolon needs a complete sentence after it, and a list of three nouns is not one.",
    3: "With no mark at all, the list runs straight into the clause with nothing to introduce it."
  }
},

{
  id: "rw072",
  domain: "Standard English Conventions",
  skill: "Boundaries",
  difficulty: "H",
  type: "mc",
  passage: "<p>Sea ice reflects most of the sunlight that strikes it, while open water absorbs nearly all of ______ the loss of summer ice warms the Arctic faster than anywhere else on the planet.</p>",
  prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
  choices: [
    "it,",
    "it",
    "it, and",
    "it; and"
  ],
  answer: 2,
  strategy: "When both sides are complete sentences, a comma works only if a conjunction comes with it. Decide what each side is before you look at the marks.",
  hint: "Both halves are full sentences, and the second follows from the first.",
  steps: [
    "Left side: \u201cSea ice reflects most of the sunlight that strikes it, while open water absorbs nearly all of it.\u201d Complete.",
    "Right side: \u201cthe loss of summer ice warms the Arctic faster than anywhere else on the planet.\u201d Complete.",
    "Two complete sentences can be joined by a comma plus a coordinating conjunction.",
    "Choice C supplies both the comma and the \u201cand.\u201d"
  ],
  traps: {
    0: "A comma with no conjunction is a comma splice, however natural the pause feels.",
    1: "Nothing at all fuses the two sentences.",
    3: "A semicolon already joins the clauses, so adding \u201cand\u201d makes the join redundant and wrong."
  }
},

{
  id: "rw073",
  domain: "Standard English Conventions",
  skill: "Boundaries",
  difficulty: "H",
  type: "mc",
  passage: "<p>The team of engineers and marine biologists who spent four seasons mapping the reef with towed cameras ______ published a survey that revised the reef's known area upward by a third.</p>",
  prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
  choices: [
    "have",
    "has,",
    "has",
    "has;"
  ],
  answer: 2,
  strategy: "Strip the modifiers to find the bare subject, then put it next to its verb. Nothing goes between a subject and its verb.",
  hint: "Cross out \u201cof engineers and marine biologists\u201d and the whole \u201cwho\u201d clause. What is left?",
  steps: [
    "Stripped down, the sentence is \u201cThe team published a survey.\u201d",
    "\u201cTeam\u201d is singular, so the verb is \u201chas,\u201d not \u201chave.\u201d",
    "Subject and verb must not be separated by punctuation.",
    "Choice C gives the singular verb with no intervening mark."
  ],
  traps: {
    0: "Agrees with \u201cbiologists,\u201d the nearest noun, rather than with \u201cteam.\u201d Collective nouns are singular in American usage.",
    1: "A single comma between the subject and its verb is an error, however long the subject was.",
    3: "A semicolon demands a complete sentence on each side, and \u201cpublished a survey\u201d has no subject."
  }
},

{
  id: "rw074",
  domain: "Standard English Conventions",
  skill: "Form, Structure, and Sense",
  difficulty: "M",
  type: "mc",
  passage: "<p>The three ______ field notes disagreed about the date of the eruption, even though all of them had been camped on the same ridge that week.</p>",
  prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
  choices: [
    "geologists's",
    "geologists'",
    "geologist's",
    "geologists"
  ],
  answer: 1,
  strategy: "Ask two questions in order: how many owners, and do they own something? Plural owners take the apostrophe after the s.",
  hint: "\u201cThe three\u201d fixes the number, and the notes belong to them.",
  steps: [
    "How many geologists? Three, confirmed by \u201call of them.\u201d So the noun is plural.",
    "Do they own the notes? Yes.",
    "A regular plural possessive puts the apostrophe after the s: geologists'.",
    "Choice B."
  ],
  traps: {
    0: "Apostrophe-s is never added to a regular plural. Save 's for singular nouns.",
    2: "Singular possessive, which contradicts \u201cThe three.\u201d",
    3: "Plural but not possessive, so the notes belong to nobody. It reads acceptably out loud, which is the trap."
  }
},

{
  id: "rw075",
  domain: "Standard English Conventions",
  skill: "Form, Structure, and Sense",
  difficulty: "M",
  type: "mc",
  passage: "<p>______ the ship's logbooks now provide climate scientists with a daily record of Atlantic weather stretching back to the 1780s.</p>",
  prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
  choices: [
    "Digitized by volunteers,",
    "Digitizing them,",
    "While digitizing them,",
    "Having digitized them,"
  ],
  answer: 0,
  strategy: "An opening phrase attaches to the subject that follows the comma. Name that subject first, then ask whether it can do what the phrase describes.",
  hint: "The subject after the comma is \u201cthe ship's logbooks.\u201d Can logbooks digitize anything?",
  steps: [
    "Find the subject of the main clause: \u201cthe ship's logbooks.\u201d",
    "The opening phrase has to describe the logbooks.",
    "\u201cDigitized by volunteers\u201d is passive, so the logbooks were digitized. That fits.",
    "Choice A."
  ],
  traps: {
    1: "A dangling modifier: it makes the logbooks the ones doing the digitizing.",
    2: "The same dangling error with \u201cwhile\u201d in front of it, which does nothing to fix who is acting.",
    3: "Also dangling, and it gives the logbooks credit for finishing the work."
  }
},

{
  id: "rw076",
  domain: "Standard English Conventions",
  skill: "Form, Structure, and Sense",
  difficulty: "M",
  type: "mc",
  passage: "<p>A useful lab notebook records not only the result of an experiment but also ______, since a method nobody can repeat proves nothing.</p>",
  prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
  choices: [
    "how were the steps carried out",
    "carrying out each step exactly",
    "the steps were carried out exactly",
    "the exact steps that produced it"
  ],
  answer: 3,
  strategy: "\u201cNot only ... but also\u201d is a paired construction. Whatever form follows the first half has to follow the second. Put them side by side.",
  hint: "The first half is \u201cthe result of an experiment,\u201d a noun phrase. The second half has to be a noun phrase too.",
  steps: [
    "After “not only” comes “the result of an experiment,” which is a noun phrase acting as the object of “records.”",
    "So whatever follows “but also” has to be a noun phrase filling the same slot.",
    "“the exact steps that produced it” is a noun phrase with its own relative clause. Same shape, same slot.",
    "Choice D. Read the two halves back to back and they match: records not only the result of an experiment but also the exact steps that produced it."
  ],
  traps: {
    0: "Question word order. An interrogative clause cannot serve as the object of “records,” and it does not match the noun phrase in the first half.",
    1: "A participial phrase. It names an activity rather than a thing recorded, so it matches neither half of the pair.",
    2: "A complete sentence dropped into a slot that needs a noun phrase. Say the first half and this half back to back and the sentence falls apart."
  }
},

{
  id: "rw077",
  domain: "Standard English Conventions",
  skill: "Form, Structure, and Sense",
  difficulty: "H",
  type: "mc",
  passage: "<p>The summers recorded in the monastery's harvest ledgers were noticeably cooler than ______ in the same valley over the past thirty years.</p>",
  prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
  choices: [
    "the ledgers",
    "those measured",
    "recently",
    "they measure"
  ],
  answer: 1,
  strategy: "A comparison has to join two things of the same kind. Say it out loud: X is cooler than Y, then check that Y is the same sort of thing as X.",
  hint: "Cooler than what? Not cooler than a document, and not cooler than a stretch of time.",
  steps: [
    "The first half of the comparison is \u201cthe summers recorded in the ledgers.\u201d",
    "So the second half has to be summers too.",
    "\u201cthose measured in the same valley over the past thirty years\u201d means the summers measured recently. Same kind of thing.",
    "Choice B keeps the comparison parallel."
  ],
  traps: {
    0: "Compares summers with documents. Ledgers cannot be cool, and this is the hard version of the error.",
    2: "Compares summers with a time period rather than with other summers.",
    3: "Makes the summers do the measuring and leaves the comparison with no second term."
  }
}

);

window.RW_BANK.push(

{
  id: "rw078",
  domain: "Information and Ideas",
  skill: "Central Ideas and Details",
  difficulty: "M",
  type: "mc",
  passage: "<p>Archaeologists once dated Polynesian settlement of the eastern Pacific to roughly 1,500 years ago, on the strength of charcoal from hearths. Reanalysis by Tui Fa'atoa has moved the date sharply later. Charcoal, she points out, can come from long-dead driftwood, which was already centuries old when it was burned. Dating only short-lived material such as seeds and twigs, her team arrived at settlement dates clustered around 1,000 years ago, and the revised sequence has the islands settled in a single rapid burst rather than a slow drift.</p>",
  prompt: "Which choice best states the main idea of the text?",
  choices: [
    "Fa'atoa's team dated seeds and twigs rather than charcoal.",
    "Driftwood was a common fuel on newly settled Pacific islands.",
    "Fa'atoa's team dated more reliable material and produced later settlement dates that imply rapid rather than gradual settlement.",
    "Charcoal from hearths is worthless as a dating material for Pacific archaeology."
  ],
  answer: 2,
  strategy: "Say the point in your own words before reading the choices. The main idea is the finding plus what the finding changes, not the method on its own.",
  hint: "The last sentence adds something the earlier ones do not. Whatever you pick has to account for it.",
  steps: [
    "The old view: settlement about 1,500 years ago, based on charcoal.",
    "The problem with charcoal: driftwood was already old when burned, so the dates run too early.",
    "The fix and the result: date short-lived material, and settlement lands around 1,000 years ago.",
    "The consequence, in the last sentence: a single rapid burst instead of a slow drift. Choice C carries the result and that consequence."
  ],
  traps: {
    0: "True, and it is the method, not the point. A choice that stops at how the work was done leaves out what the work showed.",
    1: "A detail that exists only to explain why charcoal misleads. It was never the subject.",
    3: "Goes further than Fa'atoa does. She says charcoal can mislead about age, not that it carries no information at all."
  }
},

{
  id: "rw079",
  domain: "Craft and Structure",
  skill: "Text Structure and Purpose",
  difficulty: "M",
  type: "mc",
  passage: "<p>Cities have tried for a century to cool themselves with trees. The modern version starts from a measurement: an infrared survey showing which blocks run hottest. Planting follows the map, concentrating canopy where the pavement bakes. Only afterward does anyone ask which species will still be alive in forty years, and in several cities the answer has arrived too late, with whole plantings replaced twice over.</p>",
  prompt: "Which choice best describes the overall structure of the text?",
  choices: [
    "It criticizes a long-standing practice and then proposes a replacement for it.",
    "It contrasts a historical approach with a modern one and endorses the historical one.",
    "It describes a sequence of steps and then notes a question that comes too late in that sequence.",
    "It lists the species most often planted as street trees in order of hardiness."
  ],
  answer: 2,
  strategy: "Map the text one sentence at a time in three or four words each, then find the choice whose sequence matches your map. Structure questions are about order.",
  hint: "Sentences two and three describe a procedure. Sentence four does something different to it.",
  steps: [
    "Sentence 1: the long practice of cooling cities with trees.",
    "Sentences 2 and 3: the modern procedure, first measure, then plant to the map.",
    "Sentence 4: the survival question gets asked only afterward, and sometimes too late.",
    "Procedure, then a question misplaced within it. Choice C."
  ],
  traps: {
    0: "No replacement is proposed anywhere. The text stops at identifying the gap.",
    1: "There is no endorsement of the older approach, and the text does not set the two eras against each other.",
    3: "The steps appear in a sequence, but no species are named and nothing is ranked. Right shape, wrong content."
  }
},

{
  id: "rw080",
  domain: "Craft and Structure",
  skill: "Text Structure and Purpose",
  difficulty: "H",
  type: "mc",
  passage: "<p>In her account of the 1911 mill strike, the historian devotes a full chapter to the weather. Rain on the fourth day, she notes, kept the crowd off the bridge; a cold snap on the ninth emptied the boarding houses. <u>Reviewers accused her of reducing a labor movement to a barometer.</u> But the strike committee's own minutes record the weather at the top of every page, above the day's demands. The organizers were reading the sky as carefully as she does, because a march that nobody could stand outside for was not a march.</p>",
  prompt: "Which choice best describes the function of the underlined portion in the text as a whole?",
  choices: [
    "It raises an objection that the text then answers with evidence from the strikers themselves.",
    "It provides an example of the weather events described in the previous sentence.",
    "It concedes a flaw in the historian's account that the author leaves unresolved.",
    "It summarizes the conclusion that the text ultimately reaches."
  ],
  answer: 0,
  strategy: "For the function of an underlined portion, read the sentence before and the sentence after. The first word after the underline usually tells you what the underline was for.",
  hint: "The sentence after the underline starts with \u201cBut,\u201d and then cites the strike committee's own minutes.",
  steps: [
    "The underlined sentence reports a criticism: she reduced a movement to a barometer.",
    "The next sentence opens with \u201cBut\u201d and produces the organizers' own minutes, which track the weather too.",
    "So the criticism was raised in order to be answered, not accepted.",
    "Choice A names both halves: the objection, and the evidence that answers it."
  ],
  traps: {
    1: "The examples of weather are in the sentence before the underline. This choice describes the wrong sentence.",
    2: "The author does resolve it, immediately and with evidence. This is the choice you pick if you stop reading at \u201cBut.\u201d",
    3: "The text's conclusion is that the organizers read the weather as closely as the historian does, which is the opposite of the criticism."
  }
},

{
  id: "rw081",
  domain: "Information and Ideas",
  skill: "Inferences",
  difficulty: "H",
  type: "mc",
  passage: "<p>A long-running study of a songbird population found that pairs nesting near streetlights laid their eggs, on average, nine days earlier than pairs nesting in darkness. Earlier clutches usually mean more surviving chicks, since food peaks in spring. Yet the lit-area pairs fledged fewer chicks, not more. The caterpillars the parents feed their young emerged on the same schedule as always, whatever the lighting, so the early hatchlings arrived before there was much to feed them. It can therefore be inferred that ______</p>",
  prompt: "Which choice most logically completes the text?",
  choices: [
    "artificial light at night has no measurable effect on the birds' breeding behavior.",
    "the birds nesting in lit areas would fledge more chicks if they laid their eggs even earlier.",
    "streetlights shifted the birds' timing without shifting the food supply they depend on.",
    "caterpillars in lit areas emerge later than caterpillars in dark areas."
  ],
  answer: 2,
  strategy: "An inference is one small step past what you were given. Look for the choice that names the mismatch the text has just set up, without adding a cause the text never mentions.",
  hint: "Two schedules are described. Only one of them moved.",
  steps: [
    "The lights moved the laying date nine days earlier.",
    "The caterpillars emerged on their usual schedule, unaffected by lighting.",
    "So the chicks hatched before the food arrived, and fewer survived.",
    "The supported step is that one schedule shifted and the other did not. Choice C."
  ],
  traps: {
    0: "Contradicted outright. The lights moved laying dates by nine days.",
    1: "Invents a remedy the text gives no basis for. Laying even earlier would widen the very gap that is killing the chicks.",
    3: "Reverses what the text says. The caterpillars emerged on the same schedule whatever the lighting."
  }
},

{
  id: "rw082",
  domain: "Expression of Ideas",
  skill: "Rhetorical Synthesis",
  difficulty: "H",
  type: "mc",
  passage: "<p>While researching a topic, a student has taken the following notes:</p><ul><li>A city replaced the asphalt on twelve streets with a lighter-colored surface.</li><li>Surface temperatures on the treated streets fell by up to 12&deg;F at midday.</li><li>Air temperature at head height barely changed.</li><li>Lighter surfaces reflect sunlight upward rather than absorbing it.</li><li>Pedestrians reported feeling hotter on the treated streets.</li></ul>",
  prompt: "The student wants to explain why pedestrians felt hotter despite the lower surface temperatures. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
  choices: [
    "Surface temperatures on the twelve treated streets fell by as much as 12\u00b0F at midday, though air temperature at head height barely changed.",
    "Because a lighter surface reflects sunlight upward instead of absorbing it, the cooler pavement sent more sunlight at the people walking on it.",
    "The city replaced the asphalt on twelve streets with a lighter-colored surface, and pedestrians reported feeling hotter.",
    "Air temperature at head height barely changed on the streets that had been resurfaced."
  ],
  answer: 1,
  strategy: "\u201cExplain why\u201d needs a mechanism. Find the note that could act as a cause, and check it actually explains the specific thing being asked about.",
  hint: "One note describes what a light surface physically does to sunlight. That is the only candidate for a cause.",
  steps: [
    "The thing to explain: cooler pavement, hotter pedestrians.",
    "Scan the notes for something that could cause it. Only one is a mechanism: light surfaces reflect sunlight upward instead of absorbing it.",
    "Upward reflection puts more sunlight on the person walking, which explains feeling hotter even as the ground cools.",
    "Choice B pairs that mechanism with the effect. Correct."
  ],
  traps: {
    0: "Accurately reports both measurements and explains neither. Stating the puzzle again is not solving it.",
    2: "Pairs the intervention with the complaint and leaves the why entirely open.",
    3: "One measurement, no cause, and it does not even mention the pedestrians."
  }
},

{
  id: "rw083",
  domain: "Expression of Ideas",
  skill: "Rhetorical Synthesis",
  difficulty: "M",
  type: "mc",
  passage: "<p>While researching a topic, a student has taken the following notes:</p><ul><li>A library began lending out tools alongside books in 2019.</li><li>Borrowing a tool requires the same library card as a book.</li><li>In the first year, 4,100 tool loans were recorded.</li><li>Circulation of print books rose 14 percent in the same year.</li><li>Staff attribute the book increase to first-time card holders who came for tools.</li></ul>",
  prompt: "The student wants to explain why print book circulation rose. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
  choices: [
    "Print book circulation rose 14 percent in the first year of the tool lending program.",
    "The library recorded 4,100 tool loans in the first year of the program.",
    "Borrowing a tool from the library requires the same card as borrowing a book.",
    "Because tools and books need the same card, people who joined for tools became book borrowers too, and print circulation rose 14 percent."
  ],
  answer: 3,
  strategy: "The goal asks why, so the answer needs a cause and the effect together. A choice with only the effect restates the question.",
  hint: "What connects tools to books? One note explains the link, and another names who did the borrowing.",
  steps: [
    "The effect to explain: print circulation up 14 percent.",
    "The link: tools and books use the same card, so a tool borrower is already a library member.",
    "The staff explanation: first-time card holders came for tools and borrowed books as well.",
    "Choice D chains the cause to the effect. Correct."
  ],
  traps: {
    0: "This is the effect on its own. Repeating what needs explaining is not an explanation.",
    1: "A true figure about tools that says nothing about books.",
    2: "The mechanism with no outcome attached, so it never reaches what the goal asked for."
  }
},

{
  id: "rw084",
  domain: "Information and Ideas",
  skill: "Command of Evidence (Quantitative)",
  difficulty: "M",
  type: "mc",
  figure: "<table class=\'data\'><tr><th>Depth</th><th>Species A: individuals per net</th><th>Species B: individuals per net</th></tr><tr><td>50 m</td><td>31</td><td>4</td></tr><tr><td>150 m</td><td>22</td><td>9</td></tr><tr><td>300 m</td><td>8</td><td>26</td></tr><tr><td>600 m</td><td>2</td><td>33</td></tr></table>",
  figcap: "Catch per net for two squid species at four depths",
  passage: "<p>Two related squid species were sampled with identical nets at four depths. The researchers concluded that the two species divide the water column between them, with one favoring shallow water and the other the deep, and pointed out that ______</p>",
  prompt: "Which choice most effectively uses data from the table to complete the statement?",
  choices: [
    "at 600 m, 33 individuals of species B were caught per net, the highest figure in the table.",
    "species A was caught at every depth sampled, from 50 m down to 600 m.",
    "at 50 m species A outnumbered species B by 31 to 4, while at 600 m species B outnumbered species A by 33 to 2.",
    "at 150 m species A was more numerous than species B, by 22 to 9."
  ],
  answer: 2,
  strategy: "A claim about two things dividing something up needs both of them, at both ends. One number, or one depth, cannot show a division.",
  hint: "The conclusion has two halves: one species shallow, the other deep. Both halves need numbers.",
  steps: [
    "The conclusion says the species split the water column, shallow versus deep.",
    "So the evidence needs both species at a shallow depth and both at a deep one.",
    "At 50 m it is 31 to 4 in favor of A; at 600 m it is 33 to 2 in favor of B.",
    "Choice C reports both reversals, which is exactly the division claimed."
  ],
  traps: {
    0: "A single maximum. It shows species B likes the deep and says nothing about species A or about a division.",
    1: "True, and it argues against a clean division rather than for one.",
    3: "A middle depth where the gap is narrow. It shows one species ahead at one depth, not a reversal across the column."
  }
}

);

window.RW_BANK.push(

{
  id: "rw085",
  domain: "Standard English Conventions",
  skill: "Boundaries",
  difficulty: "M",
  type: "mc",
  passage: "<p>Honeyguide birds lead human foragers to wild beehives and wait for the comb to be opened. The arrangement is genuinely mutual ______ the birds get wax they cannot reach alone, and the foragers find hives they would otherwise walk past.</p>",
  prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
  choices: [
    "mutual:",
    "mutual,",
    "mutual",
    "mutual, and,"
  ],
  answer: 0,
  strategy: "A colon can join a complete sentence to the explanation that follows it. Check that everything before the colon stands alone, then check that what follows explains it.",
  hint: "What comes after the blank explains what \u201cgenuinely mutual\u201d means.",
  steps: [
    "Left side: \u201cThe arrangement is genuinely mutual.\u201d Complete on its own.",
    "What follows spells out the mutual part: each side gets something.",
    "A complete sentence followed by its own explanation takes a colon.",
    "Choice A is correct."
  ],
  traps: {
    1: "A comma alone between two complete thoughts is a comma splice, and this one reads smoothly enough to slip past.",
    2: "No punctuation at all runs the explanation into the clause.",
    3: "The comma before \u201cand\u201d is fine; the one after it is not."
  }
},

{
  id: "rw086",
  domain: "Craft and Structure",
  skill: "Text Structure and Purpose",
  difficulty: "H",
  type: "mc",
  passage: "<p>The company's engineers reported the bridge's unusual sway to their managers within a month of opening. <u>The memo they wrote is three paragraphs long and contains no recommendation.</u> Its authors had been told, in a meeting no minutes record, that the client would not fund a redesign. Read against that instruction, the memo's flatness looks less like indifference than like a document written by people who knew what they were not allowed to ask for.</p>",
  prompt: "Which choice best describes the function of the underlined portion in the text as a whole?",
  choices: [
    "It provides an example of the sway the engineers had observed.",
    "It states a feature of the memo that the text goes on to reinterpret.",
    "It identifies the managers who declined to fund a redesign.",
    "It explains why the client refused to pay for the work."
  ],
  answer: 1,
  strategy: "When a later sentence tells you how to read an earlier one, the earlier one was set up to be reinterpreted. Ask what the text does with the detail, not just what the detail is.",
  hint: "The last sentence tells you to read the memo's flatness a particular way. What is it reinterpreting?",
  steps: [
    "The underlined sentence reports a plain feature: the memo is short and recommends nothing.",
    "The next sentence supplies the missing context, an instruction given off the record.",
    "The final sentence rereads that same flatness as constraint rather than indifference.",
    "So the feature was stated in order to be reinterpreted. Choice B."
  ],
  traps: {
    0: "The sway is in the sentence before the underline. This choice describes the wrong sentence.",
    2: "No managers are named anywhere, and the underlined sentence is about the memo, not about people.",
    3: "The text never explains the client's reasoning. It only reports that the engineers were told about it."
  }
},

{
  id: "rw087",
  domain: "Information and Ideas",
  skill: "Inferences",
  difficulty: "M",
  type: "mc",
  passage: "<p>A hospital cut its rate of central-line infections by more than half in eighteen months. The intervention was a five-item checklist that nurses were authorized to enforce, stopping a procedure if any step was skipped. A later review found that every item on the list had already been standard practice, written into the hospital's own protocols years earlier. What changed was that a nurse could now halt a senior physician. It can therefore be inferred that ______</p>",
  prompt: "Which choice most logically completes the text?",
  choices: [
    "the five items on the checklist were more effective than the hospital's earlier protocols.",
    "central-line infections cannot be reduced without a written checklist.",
    "the hospital's earlier protocols had been written by people unfamiliar with the procedure.",
    "the gain came from who was permitted to enforce the steps rather than from the steps themselves."
  ],
  answer: 3,
  strategy: "When a text tells you a change did not come from the obvious place, the inference names where it did come from. Find the one thing that actually differed.",
  hint: "The items were not new. The sentence before the blank tells you what was.",
  steps: [
    "The items on the checklist were already standard practice and already written down.",
    "So the content of the list cannot be what changed the outcome.",
    "The one new thing was the authority: a nurse could stop a senior physician.",
    "The supported inference is that enforcement, not content, produced the gain. Choice D."
  ],
  traps: {
    0: "The review found the items were identical to existing protocol, so they cannot have been more effective as content.",
    1: "Far too strong. One hospital's result says nothing about what is impossible elsewhere.",
    2: "Invents a reason nobody gives. The text says the protocols existed and were correct, not that they were written badly."
  }
}

);


/* ---- Pronouns, verb time, apostrophes, modifiers ----------------------
   Added after a review found the catalog had no pronoun trap at all and
   that one overloaded strategy was covering six different rules. ------ */
window.RW_BANK.push(
{
  id: "rw088",
  domain: "Standard English Conventions",
  skill: "Form, Structure, and Sense",
  difficulty: "E",
  type: "mc",
  passage: "<p>Each of the three laboratories published ______ findings separately, which is why the same experiment appears under three different titles.</p>",
  prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
  choices: [
    "its",
    "it's",
    "their",
    "there"
  ],
  answer: 0,
  strategy: "Send the pronoun back to the exact noun it replaces. Here that noun is “each,” not “laboratories,” and “each” is always singular.",
  hint: "What is the subject of “published”? It is not the word closest to it.",
  steps: [
    "The subject is “Each,” and “of the three laboratories” is just a phrase describing it.",
    "“Each” is singular, so the pronoun has to be singular too.",
    "The singular possessive pronoun is “its,” with no apostrophe.",
    "Choice A."
  ],
  traps: {
    1: "“It's” is the contraction of “it is,” which would give you “published it is findings.” Expand any apostrophe you see and read it back.",
    2: "Matches the nearest noun, “laboratories,” instead of the actual subject. This is the single most common pronoun error, and stripping the “of” phrase prevents it.",
    3: "A different word entirely. “There” is a place, not a possessive."
  }
},
{
  id: "rw089",
  domain: "Standard English Conventions",
  skill: "Form, Structure, and Sense",
  difficulty: "M",
  type: "mc",
  passage: "<p>Conservators examined the disputed panel alongside two later copies, and ______ turned out to contain a pigment that no workshop used before 1680.</p>",
  prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
  choices: [
    "they",
    "it",
    "the panel",
    "which"
  ],
  answer: 2,
  strategy: "If a pronoun could point at two different nouns, it points at neither. When no pronoun is unambiguous, the answer is the noun itself.",
  hint: "There are three things in the first half of the sentence. Which one does the pigment belong to?",
  steps: [
    "The first half names the panel and the two copies, so there are two candidate antecedents.",
    "“They” could mean the copies, and “it” could mean the panel or the whole group. Neither is pinned down.",
    "When every pronoun on offer is ambiguous, naming the noun is what fixes the sentence.",
    "Choice C."
  ],
  traps: {
    0: "Reads smoothly and points at the copies, or possibly at all three objects. Smooth is not the test; traceable is.",
    1: "Singular, so it seems to pick out the panel, but the copies are just as close and just as available. Ask whether you can point at one noun with certainty.",
    3: "“Which” turns the second half into a clause with nothing to attach to, leaving the sentence unfinished."
  }
},
{
  id: "rw090",
  domain: "Standard English Conventions",
  skill: "Form, Structure, and Sense",
  difficulty: "M",
  type: "mc",
  passage: "<p>Neither of the two survey crews filed ______ report before the deadline, so the mapping project stalled for a season.</p>",
  prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
  choices: [
    "their",
    "its",
    "they're",
    "there"
  ],
  answer: 1,
  strategy: "Find the real subject, then match the pronoun to it. Words like neither, either, each, and every are singular however many things follow them.",
  hint: "Strip out “of the two survey crews” and read what is left.",
  steps: [
    "“Neither” is the subject; “of the two survey crews” only describes it.",
    "“Neither” means not one, so it is singular.",
    "A singular subject takes the singular possessive “its.”",
    "Choice B."
  ],
  traps: {
    0: "Agrees with “crews” rather than with “neither.” The plural noun sitting right before the verb is the bait in every one of these.",
    2: "The contraction of “they are.” Expand it and the sentence reads “filed they are report.”",
    3: "“There” is not a possessive at all. These three sound identical out loud, which is why the ear is no help here."
  }
},
{
  id: "rw091",
  domain: "Standard English Conventions",
  skill: "Form, Structure, and Sense",
  difficulty: "H",
  type: "mc",
  passage: "<p>The committee released ______ recommendations in April, though the individual members disagreed sharply about the last of them.</p>",
  prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
  choices: [
    "their",
    "its",
    "it's",
    "there"
  ],
  answer: 1,
  strategy: "A collective noun is singular in American usage, even when the sentence goes on to talk about the individual people inside it.",
  hint: "One committee, however many members it contains.",
  steps: [
    "The noun doing the releasing is “committee,” a single body.",
    "Collective nouns like committee, team, jury, and staff take singular verbs and singular pronouns in American usage.",
    "So the pronoun is “its.”",
    "Choice B. The mention of individual members later in the sentence does not change what the pronoun refers back to."
  ],
  traps: {
    0: "The best trap here, because the second half of the sentence really is about several people. But the pronoun refers to the committee, not to its members. Check what the pronoun replaces, not what the sentence is about.",
    2: "The contraction of “it is.” No apostrophe belongs in a possessive pronoun, ever.",
    3: "A place word standing in for a possessive."
  }
},
{
  id: "rw092",
  domain: "Standard English Conventions",
  skill: "Form, Structure, and Sense",
  difficulty: "M",
  type: "mc",
  passage: "<p>By the time the survey team reached the summit in 1953, three earlier expeditions ______ on the same exposed ridge.</p>",
  prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
  choices: [
    "fail",
    "failed",
    "had failed",
    "have failed"
  ],
  answer: 2,
  strategy: "Find the words that fix the time, then pick the form that fits them. “By the time” plus a past event means anything earlier needs the past perfect.",
  hint: "Two things happened in the past. Which one happened first, and how does English mark that?",
  steps: [
    "The sentence gives two past moments: the team reaching the summit in 1953, and the earlier failures.",
    "“By the time” tells you the failures came first.",
    "To mark one past event as earlier than another past event, English uses the past perfect: had failed.",
    "Choice C."
  ],
  traps: {
    0: "Present tense in a sentence anchored to 1953. The date is the evidence, and it rules this out immediately.",
    1: "Simple past after a simple past reads perfectly smoothly, which is what makes it the real trap. It just loses the ordering that “by the time” sets up.",
    3: "The present perfect connects a past event to now, but this sentence is entirely finished in 1953."
  }
},
{
  id: "rw093",
  domain: "Standard English Conventions",
  skill: "Form, Structure, and Sense",
  difficulty: "M",
  type: "mc",
  passage: "<p>The safety board recommended that the operator ______ every valve on the line before restarting it.</p>",
  prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
  choices: [
    "inspects",
    "inspect",
    "will inspect",
    "is inspecting"
  ],
  answer: 1,
  strategy: "After recommend, require, insist, demand, ask, or propose, the verb in the that-clause goes into its plain form, with no ending, whatever the subject is.",
  hint: "Look at the verb in the first half of the sentence, not at the subject of the blank.",
  steps: [
    "The main verb is “recommended,” one of a small set of verbs that trigger the subjunctive.",
    "After those verbs, the that-clause takes the plain form of the verb.",
    "So it is “inspect,” even though “operator” is singular and would normally take “inspects.”",
    "Choice B."
  ],
  traps: {
    0: "The form that normally matches a singular subject, which is exactly why it gets picked. The subjunctive overrides ordinary agreement.",
    2: "A recommendation is not a prediction. The future tense makes it a statement about what will happen rather than what is being asked for.",
    3: "The progressive describes something in the middle of happening, which does not fit a recommendation about what to do."
  }
},
{
  id: "rw094",
  domain: "Standard English Conventions",
  skill: "Form, Structure, and Sense",
  difficulty: "E",
  type: "mc",
  passage: "<p>Both ______ notebooks record the same set of measurements, taken about an hour apart.</p>",
  prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
  choices: [
    "assistant's",
    "assistants",
    "assistants'",
    "assistant"
  ],
  answer: 2,
  strategy: "Count the owners first, then decide whether they own anything. Several owners take s-apostrophe.",
  hint: "The word “Both” tells you the number for free.",
  steps: [
    "“Both” means two, so there are two owners.",
    "The notebooks belong to them, so this is possessive.",
    "A regular plural possessive puts the apostrophe after the s: assistants'.",
    "Choice C."
  ],
  traps: {
    0: "Singular possessive, which contradicts “Both.” One owner, not two.",
    1: "Plural but not possessive, so the notebooks belong to nobody. It reads fine out loud, which is the whole problem.",
    3: "Singular and not possessive, which gets both halves wrong at once."
  }
},
{
  id: "rw095",
  domain: "Standard English Conventions",
  skill: "Form, Structure, and Sense",
  difficulty: "M",
  type: "mc",
  passage: "<p>The bridge has survived two floods since ______ completion in 1874, though the approach road has been rebuilt twice.</p>",
  prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
  choices: [
    "its",
    "it's",
    "its'",
    "their"
  ],
  answer: 0,
  strategy: "Possessive pronouns never take an apostrophe. When you see one, expand it and read the sentence back.",
  hint: "Expand each apostrophe into the two words it stands for and see which sentence still works.",
  steps: [
    "The thing that was completed is the bridge, which is singular.",
    "The singular possessive pronoun is “its,” with no apostrophe anywhere.",
    "Expanding the alternative gives “since it is completion in 1874,” which is not a sentence.",
    "Choice A."
  ],
  traps: {
    1: "The contraction of “it is.” This is the most frequently tested apostrophe on the whole exam, and expanding it catches it every time.",
    2: "Not a word in English. There is no form “its'.”",
    3: "Plural, but there is only one bridge. The pronoun has to match the noun it replaces, not the number of floods."
  }
},
{
  id: "rw096",
  domain: "Standard English Conventions",
  skill: "Form, Structure, and Sense",
  difficulty: "M",
  type: "mc",
  passage: "<p>______ the committee approved the design without asking for a single further change.</p>",
  prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
  choices: [
    "Impressed by the revised drawings,",
    "Impressing the revised drawings,",
    "The revised drawings impressed them,",
    "To impress the revised drawings,"
  ],
  answer: 0,
  strategy: "Read the opening phrase and ask who is doing it. Whatever sits right after the comma has to be that thing. Do not cross the phrase out here, because the phrase is the evidence.",
  hint: "Who was impressed? Check that the word after the comma names them.",
  steps: [
    "The word right after the comma is “committee,” so the opening phrase has to describe the committee.",
    "The committee is the thing that was impressed, so the passive form “Impressed by the revised drawings” attaches correctly.",
    "Read it straight through: impressed by the revised drawings, the committee approved the design.",
    "Choice A."
  ],
  traps: {
    1: "Makes the committee do the impressing, which reverses who affected whom. This is the standard dangling modifier.",
    2: "A complete sentence, so joining it to the rest with only a comma splices two sentences together. Notice this choice is a different kind of thing from the others, which is a clue in itself.",
    3: "Says the committee approved the design in order to impress the drawings, which is not a thing that can happen."
  }
},
{
  id: "rw097",
  domain: "Standard English Conventions",
  skill: "Form, Structure, and Sense",
  difficulty: "H",
  type: "mc",
  passage: "<p>______ the fresco's original colors became visible for the first time in four centuries.</p>",
  prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
  choices: [
    "Once conservators removed the layer of soot,",
    "Removing the layer of soot,",
    "Having removed the layer of soot,",
    "Conservators removed the layer of soot,"
  ],
  answer: 0,
  strategy: "When the thing after the comma cannot possibly be doing the opening phrase, the fix is a clause that names the real actor.",
  hint: "The colors did not remove anything. So who did, and which choice actually says so?",
  steps: [
    "The subject after the comma is “the fresco's original colors.”",
    "Any opening phrase has to describe those colors, and the colors did not remove soot.",
    "The repair is to make the opening a full clause with its own subject: once conservators removed the layer of soot.",
    "Choice A. Naming the actor is what fixes a dangling modifier, not rearranging the phrase."
  ],
  traps: {
    1: "Dangling: it makes the colors remove the soot.",
    2: "Also dangling, and the perfect form makes it sound more careful without changing who is doing the removing. Sounding formal is not the same as attaching correctly.",
    3: "A complete sentence attached with nothing but a comma, which splices two sentences together."
  }
},
{
  id: "rw098",
  domain: "Expression of Ideas",
  skill: "Command of Evidence (Quantitative)",
  difficulty: "M",
  type: "mc",
  passage: "<p>An ecologist compared heron nest counts at four wetland sites before and after a restoration project. The two sites nearest the river were restored; the two upland sites were left alone.</p><table class='data'><tr><th>Site</th><th>Nests, 2019</th><th>Nests, 2023</th></tr><tr><td>Riverbend (restored)</td><td>14</td><td>31</td></tr><tr><td>Millrace (restored)</td><td>9</td><td>22</td></tr><tr><td>Hilltop (upland)</td><td>18</td><td>20</td></tr><tr><td>Ridge (upland)</td><td>12</td><td>13</td></tr></table><p>The ecologist concludes that the restoration, rather than a region-wide change, drove the increase in nesting. Which choice most effectively uses data from the table to support that conclusion?</p>",
  prompt: "Which choice most effectively uses data from the table to support the conclusion?",
  choices: [
    "Riverbend recorded 31 nests in 2023, the highest count anywhere in the study.",
    "Millrace recorded fewer nests than Hilltop in both years.",
    "The restored sites rose from 14 to 31 and from 9 to 22, while the upland sites rose only from 18 to 20 and from 12 to 13.",
    "Ridge declined from 13 nests to 12."
  ],
  answer: 2,
  strategy: "The conclusion is a comparison between two groups, so the evidence has to cover both groups. One site cannot rule out a region-wide change.",
  hint: "To show the restoration did it and not the weather, what do you need to say about the sites that were not restored?",
  steps: [
    "The claim is that restoration caused the rise, not something affecting the whole region.",
    "To rule out a region-wide cause you have to show the untouched sites did not rise the same way.",
    "So the evidence needs numbers from both the restored pair and the upland pair.",
    "Choice C is the only one that cites both groups."
  ],
  traps: {
    0: "One site, one year. A single maximum cannot separate the restoration from a change that affected everywhere, because it says nothing about the sites left alone.",
    1: "Check it against the table: Millrace was below Hilltop in 2019, 9 to 18, but above it in 2023, 22 to 20. The claim is false for the second year.",
    3: "The columns are reversed. Ridge went from 12 up to 13, so this reports a rise as a decline."
  }
},
{
  id: "rw099",
  domain: "Standard English Conventions",
  skill: "Form, Structure, and Sense",
  difficulty: "M",
  type: "mc",
  passage: "<p>The list of species recorded by the two survey teams ______ three beetles never before seen in the county.</p>",
  prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?",
  choices: [
    "include",
    "includes",
    "are including",
    "have included"
  ],
  answer: 1,
  strategy: "Read the choices down the column first: they all differ in verb number, so this is an agreement question. Then strip the sentence to its bare subject.",
  hint: "Cross out “of species recorded by the two survey teams” and see what is left doing the verb.",
  steps: [
    "The four choices vary only in number and form of the verb, so the rule on trial is subject-verb agreement.",
    "Strip the modifiers: the list ______ three beetles.",
    "“List” is singular, so the verb is “includes.”",
    "Choice B."
  ],
  traps: {
    0: "Agrees with “teams,” the noun nearest the blank, rather than with “list.” The whole sentence is built to put a plural noun in that spot.",
    2: "Plural, and it also puts an ongoing action where a plain statement of fact belongs.",
    3: "Plural again, and the present perfect suggests the list has been changing over time rather than simply containing these species."
  }
}
);

/* stamp the section onto every item */
window.RW_BANK.forEach(function (q) { q.section = 'rw'; if (!q.type) q.type = 'mc'; });
