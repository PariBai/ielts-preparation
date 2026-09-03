/* All syllabus content, transcribed from ielts.docx.
   Nothing here is user data — this is the static curriculum. */

const RESOURCES = {
  writing: [
    {
      name: 'Grammarly Free Web Editor',
      url: 'https://app.grammarly.com/',
      note: 'Your essential tool for fixing weak grammar. Type your daily tasks directly into it to instantly catch tense slips, missing articles, and subject-verb mistakes.',
    },
    {
      name: 'IELTS Liz — Task 1 Lessons & Tips',
      url: 'https://ieltsliz.com/ielts-writing-task-1-lessons-and-tips/',
      note: 'Lesson-by-lesson coverage of every Task 1 chart format, with model answers and the language of trends. Work through this alongside Week 1 of the day plan.',
    },
    {
      name: 'IELTS Liz — Task 2 Writing',
      url: 'https://ieltsliz.com/ielts-writing-task-2/',
      note: 'The best free site for essay structures — step-by-step templates for balancing an essay and building each paragraph. Pairs with Week 2.',
    },
    {
      name: 'IELTS Buddy — Grammar for IELTS',
      url: 'https://www.ieltsbuddy.com/ielts-grammar.html',
      note: 'Grammar explanations aimed squarely at IELTS writing — tenses, articles, clauses, conditionals. Pairs directly with the grammar concept named on each day card.',
    },
    {
      name: 'AI4IELTS',
      url: 'https://ai4ielts.com/',
      note: 'AI-assisted IELTS practice. Use it as a second opinion on a piece you have already had marked here — two independent estimates of the same essay tell you more than either alone.',
    },
    {
      name: 'IELTS Buddy — Band 7 Essay Samples',
      url: 'https://www.ieltsbuddy.com/ielts-band-7-essay-samples.html',
      note: 'Full Task 2 essays at Band 7 with examiner commentary. Read one before writing your own for the day, to calibrate what the target actually looks like.',
    },
  ],
  listening: [
    {
      name: 'IELTS Online Tests (IOT)',
      url: 'https://ieltsonlinetests.com/',
      note: 'Completely free. Hundreds of mock tests that copy the exact computer-delivered IELTS layout — practise typing answers while tracking the audio countdown.',
    },
  ],
  speaking: [
    {
      name: 'IELTS by IDP (mobile app)',
      url: 'https://ielts.idp.com/prepare/app',
      note: 'Free official app with speaking test sample audio and video — study what real Band 8 and Band 9 candidates sound like.',
    },
    {
      name: 'ELSA Speak — AI pronunciation coach',
      url: 'https://elsaspeak.com/',
      note: 'Listens through your mic and highlights the exact words where your syllable stress or accent becomes unclear.',
    },
    {
      name: 'HelloTalk / Tandem',
      url: 'https://www.hellotalk.com/',
      note: 'Free language-exchange apps. Join live vocal chat rooms ("Language Parties") to build confidence with real people from home.',
    },
  ],
  reading: [
    {
      name: 'British Council — IELTS Ready (free tier)',
      url: 'https://takeielts.britishcouncil.org/take-ielts/prepare',
      note: 'Free practice module with mock reading passages on screen. Trains your eyes to read left-to-right on a monitor without losing your place.',
    },
  ],
};

/* ------------------------------------------------------------------ */
/*  WRITING                                                            */
/* ------------------------------------------------------------------ */

const WRITING_SYLLABUS = [
  {
    heading: 'The shape of the test',
    body:
      'The writing test lasts exactly 60 minutes and consists of two completely different tasks. The screen shows a timer counting down from 60:00 — you manage the split between both tasks yourself.',
    diagram: '[Total 60 min]  →  [Task 1: Describe Data — 20 min]  +  [Task 2: Academic Essay — 40 min]',
  },
  {
    heading: '📊 Task 1 — Data Description (report writing)',
    facts: [
      ['Time', '20 minutes'],
      ['Weight', '1/3 of your total writing score'],
      ['Words', 'Minimum 150 (aim 160–180 — below 150 is penalised)'],
      ['Your role', 'Act like a data scientist. Extract the important information and write a completely objective, factual report. You are forbidden from giving your opinion or explaining why the data changed.'],
    ],
    list: {
      title: 'The 6 visual formats you must learn to describe',
      items: [
        ['Line graph', 'Tracking trends changing over a period of time.'],
        ['Bar chart', 'Comparing different categories or groups.'],
        ['Pie chart', 'Showing proportions and percentages of a whole.'],
        ['Table', 'A grid of raw numbers you must group together.'],
        ['Process diagram / flowchart', 'Step-by-step diagram of how something is made or works (e.g. how a computer chip is recycled).'],
        ['Map layout', 'Comparing two maps of the same area in different years (e.g. a village before and after a technology park).'],
      ],
    },
    structure: {
      title: 'The flawless 4-paragraph structure — Task 1',
      steps: [
        ['1. Introduction (1–2 sentences)', 'Rewrite the exam question in your own words. e.g. change "The chart shows the number of people…" to "The bar graph illustrates the quantity of individuals…".'],
        ['2. Overview (2–3 sentences) ⭐', 'The most important paragraph. State the main overall trends with NO specific numbers. What is the biggest, smallest, most obvious change? Skip the overview and you cannot score above Band 5.'],
        ['3. Detail paragraph 1 (3–4 sentences)', 'Focus on one specific group of data, backed with exact numbers and dates from the chart.'],
        ['4. Detail paragraph 2 (3–4 sentences)', 'Focus on the remaining data points, making clear comparisons between categories.'],
      ],
    },
  },
  {
    heading: '✍️ Task 2 — Academic Essay',
    facts: [
      ['Time', '40 minutes'],
      ['Weight', '2/3 of your total writing score'],
      ['Words', 'Minimum 250 (aim 260–290)'],
      ['Your role', 'Write a formal, well-structured essay responding to a specific point of view, argument, or societal issue.'],
    ],
    list: {
      title: 'The 5 essay types you must master',
      items: [
        ['Agree / Disagree', 'Given an opinion — state whether you fully agree, fully disagree, or take a balanced middle ground.'],
        ['Discuss Both Views', 'Given two opposing viewpoints — explain both sides thoroughly and explicitly state your own opinion.'],
        ['Advantages vs. Disadvantages', 'Analyse the pros and cons of a phenomenon (e.g. working from home).'],
        ['Problem and Solution', 'Explain the root causes of a modern problem (e.g. cybercrime) and propose practical solutions.'],
        ['Two-Part Question', 'The prompt asks two distinct, direct questions you must address sequentially.'],
      ],
    },
    structure: {
      title: 'The flawless 4-paragraph structure — Task 2',
      steps: [
        ['1. Introduction (3 sentences)', 'S1: paraphrase the background statement. S2: thesis statement — your clear, direct answer. S3: outline statement — briefly state what the essay will discuss.'],
        ['2. Body paragraph 1 (4–5 sentences)', 'Topic sentence → explanation → specific realistic example → result/link back to your central argument.'],
        ['3. Body paragraph 2 (4–5 sentences)', 'Exact same structure, second main supporting point.'],
        ['4. Conclusion (2 sentences)', 'Summarise your main points and restate your opinion in fresh vocabulary. Introduce no new information.'],
      ],
    },
  },
];

const WRITING_PLAN = {
  title: '21-Day Writing Syllabus',
  blurb: 'Three weeks: mechanics + every Task 1 chart type, then sentence complexity + every Task 2 essay type, then advanced logic and full simulations.',
  weeks: [
    {
      title: 'Week 1 — Foundational Grammar & Chart Mastery',
      blurb: 'Fix mechanical errors while mastering all data formats for Writing Task 1.',
      days: [
        {
          id: 'w1', n: 1, title: 'Punctuation, Spacing & Mechanics',
          focus: 'accuracy',
          rows: [
            ['Grammar concept', 'Absolute mastery of spacing (one space after periods and commas, zero before), proper capitalisation of proper nouns (names, countries, software), and avoiding run-on sentences.'],
            ['Task 1 type', 'Line Graph — tracking trends over time.'],
          ],
          drill: 'Write a 150-word report describing a graph showing fluctuations in global tech stocks.',
        },
        {
          id: 'w2', n: 2, title: 'Present Simple vs. Past Simple',
          focus: 'accuracy',
          rows: [
            ['Grammar concept', 'Choosing the right tense from the chart timeline. Past Simple for historical years ("in 2010, production fell"), Present Simple for permanent facts, cycles, or processes.'],
            ['Task 1 type', 'Bar Chart — comparing discrete categories.'],
          ],
          drill: 'Write a 150-word comparison report on computer hardware sales across different regions in 2022.',
        },
        {
          id: 'w3', n: 3, title: 'Present Perfect & Approximations',
          focus: 'accuracy',
          rows: [
            ['Grammar concept', '"Has/Have + past participle" for changes extending from the past into the present ("The enrolment has grown significantly"). Master qualifiers: approximately, roughly, just under.'],
            ['Task 1 type', 'Pie Chart — proportions and percentages of a whole.'],
          ],
          drill: 'Write a 150-word analysis comparing budget allocations for two separate software development firms.',
        },
        {
          id: 'w4', n: 4, title: 'Subject-Verb Agreement & Data Fractions',
          focus: 'accuracy',
          rows: [
            ['Grammar concept', 'Matching singular/plural subjects accurately. Watch fractions and percentages ("A third of the participants is" vs "Most of the files are"). "Data" can take plural verbs in formal writing ("The data show").'],
            ['Task 1 type', 'Data Table — complex grids of raw numbers.'],
          ],
          drill: 'Group and summarise a dense numerical table outlining global internet speed indices across 10 countries.',
        },
        {
          id: 'w5', n: 5, title: 'The Passive Voice for Sequential Events',
          focus: 'deploy',
          rows: [
            ['Grammar concept', 'Shift focus from who acts to what receives the action using "to be + past participle" ("The silicon is melted", "The code is executed"). Mandatory for process tasks.'],
            ['Task 1 type', 'Process Diagram / Flowchart — how something is made or functions.'],
          ],
          drill: 'Write a 150-word report explaining the systematic lifecycle of e-waste recycling.',
        },
        {
          id: 'w6', n: 6, title: 'Prepositions of Time, Direction & Change',
          focus: 'accuracy',
          rows: [
            ['Grammar concept', 'Eliminate preposition slips. Master the exact differences: increased BY 10%, peaked AT 90%, rose FROM X TO Y, fluctuated BETWEEN A AND B.'],
            ['Task 1 type', 'Map Comparison Layout — before and after developmental changes.'],
          ],
          drill: 'Write a 150-word report detailing urban expansion and technological infrastructure updates in a city layout from 2015 to today.',
        },
        {
          id: 'w7', n: 7, title: 'Weekly Review & Synthesis Challenge',
          focus: 'both',
          rows: [
            ['Grammar concept', "Consolidate all of Week 1's mechanics, tenses, agreements, and prepositions."],
            ['Task 1 type', 'Mixed / Combination Chart — e.g. a bar chart alongside a line graph.'],
          ],
          drill: 'Complete a full 150-word Task 1 integration report combining two distinct data formats under a strict 20-minute countdown.',
        },
      ],
    },
    {
      title: 'Week 2 — Sentence Complexity & Core Essay Foundations',
      blurb: 'Shift to Task 2: generate complex sentence structures safely to pull your score into the Band 7–9 range.',
      days: [
        {
          id: 'w8', n: 8, title: 'Sentence Clauses & The Introduction Layout',
          focus: 'deploy',
          rows: [
            ['Grammar concept', 'Independent vs. dependent clauses. Connect them properly with coordinating conjunctions (FANBOYS) without creating fragments.'],
            ['Task 2 structure', 'The introduction paragraph — paraphrase the background prompt + draft a definitive thesis statement.'],
          ],
          drill: 'Write three alternative, perfect 50-word introduction layouts for an essay prompt regarding cybersecurity.',
        },
        {
          id: 'w9', n: 9, title: 'Complex Sentences (Subordinating Conjunctions)',
          focus: 'deploy',
          rows: [
            ['Grammar concept', 'The "Holy Grail" of IELTS scoring. Sentences using although, while, because, unless, whereas, even though — to showcase grammatical range.'],
            ['Task 2 type', 'Agree / Disagree essay — take a definitive, single-sided stance.'],
          ],
          drill: 'Write a 250-word essay arguing whether computer programming should be mandatory for all primary school children.',
        },
        {
          id: 'w10', n: 10, title: 'Relative Clauses (Defining vs. Non-Defining)',
          focus: 'deploy',
          rows: [
            ['Grammar concept', 'Expand sentences smoothly with who, which, that, where, whose — add detail without starting weak, repetitive sentences.'],
            ['Task 2 structure', 'The body paragraph layout: topic sentence → explanation → concrete example → concluding result.'],
          ],
          drill: 'Practise writing isolated, highly cohesive 100-word body paragraphs using relative clauses.',
        },
        {
          id: 'w11', n: 11, title: 'Modal Verbs of Advice, Necessity & Speculation',
          focus: 'deploy',
          rows: [
            ['Grammar concept', 'Use should, must, might, could, would to express degrees of certainty, recommendations, and future implications.'],
            ['Task 2 type', 'Discuss Both Views — balance two contrasting perspectives objectively before offering your own stance.'],
          ],
          drill: 'Write a full 250-word essay evaluating automation replacing human manual labour.',
        },
        {
          id: 'w12', n: 12, title: 'Parallel Structure & List Balancing',
          focus: 'accuracy',
          rows: [
            ['Grammar concept', 'Keep identical grammatical forms across a list: "Preparing layouts, writing code, and deploying apps" — not "Preparing layouts, to write code, and deployment".'],
            ['Task 2 type', 'Advantages vs. Disadvantages essay.'],
          ],
          drill: 'Write a complete 250-word essay analysing the pros and cons of remote university degree programmes.',
        },
        {
          id: 'w13', n: 13, title: 'Noun Clauses & Academic Transition Signals',
          focus: 'deploy',
          rows: [
            ['Grammar concept', 'Clauses starting with that, what, how, why as subject or object ("What remains clear is that…"). Integrate connectors: Furthermore, Consequently, In contrast.'],
            ['Task 2 structure', 'The conclusion paragraph — restate your central thesis + summarise body arguments in 40 words.'],
          ],
          drill: 'Practise writing alternative concluding paragraphs for every essay you wrote earlier this week.',
        },
        {
          id: 'w14', n: 14, title: 'Mid-Syllabus Full Simulation Challenge',
          focus: 'both',
          rows: [
            ['Grammar concept', 'Eliminate repetitive vocabulary, verify clause boundaries, adjust sentence transitions.'],
            ['Task 2 run', 'Fully timed, 40-minute essay challenge.'],
          ],
          drill: 'Write a comprehensive 260-word essay on a random, unseen general education prompt.',
        },
      ],
    },
    {
      title: 'Week 3 — Advanced Logic, Conditionals & Elite Drills',
      blurb: 'Inject logic, precise argumentative structures, and diagnostic conditioning to polish your writing before decision day.',
      days: [
        {
          id: 'w15', n: 15, title: 'Zero & First Conditionals',
          focus: 'deploy',
          rows: [
            ['Grammar concept', 'Conditional frames ("If + present simple, present/future simple") for undeniable facts or high-probability future results.'],
            ['Task 2 type', 'Problem and Solution essay — analyse root causes and propose practical fixes.'],
          ],
          drill: 'Write a 250-word essay detailing the problems caused by urban traffic pollution and the respective technological solutions.',
        },
        {
          id: 'w16', n: 16, title: 'Second & Third Conditionals',
          focus: 'deploy',
          rows: [
            ['Grammar concept', '"If + past simple, would + verb" for imaginary concepts; "If + past perfect, would have + past participle" for historical counterfactuals.'],
            ['Task 2 type', 'Two-Part / Direct Question essay — answer two distinct prompt questions sequentially.'],
          ],
          drill: 'Write a 250-word essay addressing: Is job satisfaction more important than salary? What factors contribute to professional happiness?',
        },
        {
          id: 'w17', n: 17, title: 'Gerunds vs. Infinitives',
          focus: 'accuracy',
          rows: [
            ['Grammar concept', 'When to use verbal nouns in -ing ("Implementing cybersecurity measures minimises data leaks") versus infinitives (to implement).'],
            ['Practice layout', 'Advanced, high-speed paragraph building.'],
          ],
          drill: 'Write a dense 150-word single-paragraph argument concerning international space exploration investments.',
        },
        {
          id: 'w18', n: 18, title: 'Grammatical Inversion for Emphasis',
          focus: 'deploy',
          rows: [
            ['Grammar concept', 'Flip subject and verb after negative or restrictive expressions: "Not only does artificial intelligence improve efficiency, but it also reduces human error."'],
            ['Essay focus', 'Re-drill your weakest essay format from Week 2.'],
          ],
          drill: 'Integrate at least two inverted sentences into a fresh 250-word essay draft.',
        },
        {
          id: 'w19', n: 19, title: 'Mixed Conditionals',
          focus: 'deploy',
          rows: [
            ['Grammar concept', 'Combine past hypothetical timeframes with current realities: "If governments had invested in green infrastructure years ago, our environment would be much cleaner today."'],
            ['Task integration', 'Polish argument logic within essay body structural lines.'],
          ],
          drill: 'Write a 200-word logical response on the impacts of early childhood education choices on adult workplace settings.',
        },
        {
          id: 'w20', n: 20, title: 'Full Test Simulation (Task 1 + Task 2)',
          focus: 'both',
          rows: [
            ['Grammar concept', 'Real-time self-monitoring — detect and correct your own grammatical, mechanical, and punctuation slips under stress.'],
            ['Exam run', 'Timed, unbroken 60-minute full computer simulation with an unseen chart and an unseen essay topic.'],
          ],
          drill: 'Produce 400+ words across both tasks within the 60:00 countdown window.',
        },
        {
          id: 'w21', n: 21, title: 'Final Diagnosis & Decision Day',
          focus: 'both',
          rows: [
            ['Syllabus cap', 'Take your comprehensive self-evaluation. Paste your accumulated writing archive into your grammar tools to calculate your error-density drop.'],
            ['Decision', 'Decide confidently whether you are ready to book your official test date, or whether you need additional diagnostic practice weeks.'],
          ],
          drill: 'Run the full diagnosis and record your decision in the notes below.',
        },
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/*  SPEAKING                                                           */
/* ------------------------------------------------------------------ */

const SPEAKING_SYLLABUS = [
  {
    heading: 'The shape of the test',
    body:
      'A live, face-to-face interactive interview with a human examiner, 11 to 14 minutes total, divided into three parts.',
    diagram: '[Part 1: 4–5 min]  →  [Part 2: 3–4 min — the Long Turn]  →  [Part 3: 4–5 min]',
  },
  {
    heading: 'The three parts',
    structure: {
      title: 'What happens in each part',
      steps: [
        ['Part 1 (4–5 min) — Introduction & familiar topics', 'The examiner asks simple questions about your home, family, studies, or hobbies.'],
        ['Part 2 (3–4 min) — The Long Turn', 'You are handed a card with a topic (e.g. "Describe a piece of technology you use daily"). You get exactly 1 minute to prepare and take notes, then you must speak continuously for 2 minutes alone.'],
        ['Part 3 (4–5 min) — Abstract discussion', 'A deep discussion. The examiner asks complex follow-up questions linked to your Part 2 topic (e.g. "How has artificial intelligence changed modern human relationships?").'],
      ],
    },
  },
];

const SPEAKING_PLAN = {
  title: '10-Day Speaking Sprint',
  blurb: 'Designed to fit your home hours. It separates conversational fluency from analytical debate, building skill step-by-step.',
  weeks: [
    {
      title: 'Day 1 — Baseline',
      blurb: 'Test your absolute baseline for clarity, speed, and confidence.',
      days: [
        {
          id: 's1', n: 1, title: '🏁 The Baseline Demo & Diagnostic Test',
          rows: [
            ['Goal', 'Test your absolute baseline for clarity, speed, and confidence.'],
            ['Self-correction checklist', 'Listen back to your audio. Did you pause for more than 3 seconds? Did you repeat "and" or "um" more than 5 times? Note your weaknesses below.'],
          ],
          drill: 'Open your phone\'s voice recorder. Without looking at any template, speak for exactly 2 minutes on: "Describe a technology that has completely changed how you work or study."',
        },
      ],
    },
    {
      title: 'Days 2–4 — Conversational Fluency (Parts 1 & 2)',
      blurb: 'Fluency and sentence structure on familiar ground.',
      days: [
        {
          id: 's2', n: 2, title: 'Eliminating Hesitation on Everyday Topics',
          rows: [['Syllabus', 'Practise Part 1 questions (hobbies, home town, studies) without overthinking.']],
          drill: 'Answer 5 simple questions rapidly. Focus on starting your sentence within 1 second of the question being asked.',
        },
        {
          id: 's3', n: 3, title: 'Mastering the 1-Minute Note-Taking Grid',
          rows: [['Syllabus', 'Learn how to use your 60-second preparation time in Part 2.']],
          drill: 'Pick a cue card topic. Spend 1 minute writing only keywords in a 4-quadrant box, then talk for 2 minutes using only those keywords.',
        },
        {
          id: 's4', n: 4, title: 'Storytelling & Tense Consistency',
          rows: [['Syllabus', 'Move smoothly between past tense (how your story started) and present tense (how you feel now) during the Part 2 monologue.']],
          drill: 'Describe an important childhood memory. Ensure you do not slip into present tense while describing past events.',
        },
      ],
    },
    {
      title: 'Days 5–10 — Advanced Argumentation & Abstract Debate (Part 3)',
      blurb: 'Build the structured, abstract answers Part 3 rewards.',
      days: [
        {
          id: 's5', n: 5, title: 'The PEEL Argument Structure',
          rows: [['Syllabus', 'The elite 4-step structure for Part 3: Point → Explanation → Example → Link.']],
          drill: 'Answer: "Why do you think technology creates distance between family members?" Use PEEL to build a long, 5-sentence response.',
        },
        {
          id: 's6', n: 6, title: 'Speculating About Future Global Trends',
          rows: [['Syllabus', 'Use modal verbs of possibility (might, would, could) to debate abstract future scenarios.']],
          drill: 'Debate: "Will artificial intelligence completely replace corporate office environments in the next fifty years?"',
        },
        {
          id: 's7', n: 7, title: 'Agreeing & Disagreeing with Complex Statements',
          rows: [['Syllabus', 'Advanced conversational concessions: "While I concede that point, it is crucial to recognise that…"']],
          drill: 'Answer abstract prompts by taking a strong stance and actively defending it with data analogies.',
        },
        {
          id: 's8', n: 8, title: 'High-Level Word Choices (Lexical Density)',
          rows: [['Syllabus', 'Swap common words (good, bad, change) for precise synonyms (advantageous, detrimental, transform).']],
          drill: 'Record yourself re-answering Day 5\'s question, forcing yourself to use 5 advanced vocabulary words naturally.',
        },
        {
          id: 's9', n: 9, title: 'Handling Unexpected Questions Fluidly',
          rows: [['Syllabus', 'Master "buying time" phrases: "That is a multifaceted question, let me consider that for a moment…"']],
          drill: 'Have a family member read 3 complex global-economy questions out loud to you completely unannounced.',
        },
        {
          id: 's10', n: 10, title: 'Full Timed 14-Minute Mock Interview',
          rows: [['Syllabus', 'Combine all three parts under strict exam conditions.']],
          drill: 'Sit in front of a mirror or webcam. Complete an entire unbroken 14-minute interview simulation from Part 1 through Part 3.',
        },
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/*  LISTENING                                                          */
/* ------------------------------------------------------------------ */

const LISTENING_SYLLABUS = [
  {
    heading: 'The shape of the test',
    body:
      'You listen to four separate recordings of native English speakers (British, Australian, and American accents) and answer 40 questions in total. Approximately 30 minutes. The audio plays only once.',
    diagram: '[Part 1: social convo]  →  [Part 2: monologue]  →  [Part 3: academic discussion]  →  [Part 4: lecture]',
  },
  {
    heading: 'The four parts',
    structure: {
      title: 'What you will hear',
      steps: [
        ['Part 1 — Social conversation', 'Two people, everyday context (e.g. booking a hotel room, checking a gym membership).'],
        ['Part 2 — Monologue', 'About a local social facility (e.g. a guided tour of a library, a speech about a park layout).'],
        ['Part 3 — Academic discussion', 'Between 2 to 4 people in an academic setting (e.g. a professor and two students discussing a Computer Science project).'],
        ['Part 4 — Academic lecture', 'A formal lecture on a specific university topic (e.g. the history of artificial intelligence).'],
      ],
    },
  },
];

/* ------------------------------------------------------------------ */
/*  READING                                                            */
/* ------------------------------------------------------------------ */

const READING_SYLLABUS = [
  {
    heading: 'The shape of the test',
    body:
      'You read three long academic passages taken from journals, magazines, books, and research papers, and answer 40 questions in total, in 60 minutes.',
    diagram: '[3 passages]  +  [40 questions]  in  [60 minutes — no extra transfer time]',
  },
  {
    heading: 'Task types',
    list: {
      title: 'Question formats you will meet',
      items: [
        ['Multiple Choice', 'Pick the correct option from a set.'],
        ['True / False / Not Given', 'Decide whether a statement matches, contradicts, or is absent from the passage.'],
        ['Matching Headings', 'Match given headings to the correct paragraphs.'],
        ['Sentence / Summary Completion', 'Fill gaps using words from the passage.'],
      ],
    },
    body:
      'You must manage your own time — there is no extra time at the end to transfer your answers.',
  },
];

/* ------------------------------------------------------------------ */

const MODULES = {
  writing: {
    id: 'writing',
    name: 'Writing',
    icon: '✍️',
    time: '60 minutes',
    blurb: 'Task 1 data report (20 min, 150+ words) and Task 2 academic essay (40 min, 250+ words).',
    accent: '#7c9cff',
    syllabus: WRITING_SYLLABUS,
    plan: WRITING_PLAN,
    vault: true,
    resources: RESOURCES.writing,
  },
  speaking: {
    id: 'speaking',
    name: 'Speaking',
    icon: '🗣️',
    time: '11–14 minutes',
    blurb: 'A live three-part interview with a human examiner: familiar topics, the long turn, then abstract debate.',
    accent: '#f0a35e',
    syllabus: SPEAKING_SYLLABUS,
    plan: SPEAKING_PLAN,
    prompts: true,
    resources: RESOURCES.speaking,
  },
  listening: {
    id: 'listening',
    name: 'Listening',
    icon: '🎧',
    time: '~30 minutes',
    blurb: 'Four recordings, 40 questions, played once only. Accents: British, Australian, American.',
    accent: '#5ec9a5',
    syllabus: LISTENING_SYLLABUS,
    log: {
      title: 'Listening Practice Log',
      blurb:
        'The document gives no day-by-day plan for Listening, so this module tracks practice sessions instead. Log each mock test from IELTS Online Tests and watch the trend.',
      partOptions: ['Full test (40 Q)', 'Part 1', 'Part 2', 'Part 3', 'Part 4'],
      maxScore: 40,
    },
    resources: RESOURCES.listening,
  },
  reading: {
    id: 'reading',
    name: 'Reading',
    icon: '📖',
    time: '60 minutes',
    blurb: 'Three long academic passages, 40 questions, no extra time to transfer answers.',
    accent: '#d98ec4',
    syllabus: READING_SYLLABUS,
    log: {
      title: 'Reading Practice Log',
      blurb:
        'The document gives no day-by-day plan for Reading, so this module tracks practice sessions instead. Log each timed passage set and note which question type cost you the most marks.',
      partOptions: ['Full test (40 Q)', 'Passage 1', 'Passage 2', 'Passage 3'],
      maxScore: 40,
    },
    resources: RESOURCES.reading,
  },
};

const MODULE_ORDER = ['writing', 'speaking', 'listening', 'reading'];

/* Raw band conversion for Academic Reading / Listening — approximate,
   used only to give the practice log a rough band estimate. */
function estimateBand(correct, max) {
  if (max !== 40 || correct == null || correct === '') return null;
  const c = Number(correct);
  if (c >= 39) return 9.0;
  if (c >= 37) return 8.5;
  if (c >= 35) return 8.0;
  if (c >= 33) return 7.5;
  if (c >= 30) return 7.0;
  if (c >= 27) return 6.5;
  if (c >= 23) return 6.0;
  if (c >= 19) return 5.5;
  if (c >= 15) return 5.0;
  if (c >= 13) return 4.5;
  if (c >= 10) return 4.0;
  return 3.5;
}
