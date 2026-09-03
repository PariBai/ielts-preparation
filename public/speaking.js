/* Speaking practice: a topic bank plus ready-to-paste examiner prompts.
   You run the actual test in ChatGPT voice mode; this supplies the context and
   keeps the record. Nothing here calls an API — the prompts are built locally. */

const SPEAK_CRITERIA = `EVALUATION — only after the test has finished, never during it:

Score me 0-9 in half bands on each of the four official criteria:
1. Fluency and Coherence — hesitation, repetition, self-correction, whether I could
   keep going, and whether my ideas linked logically.
2. Lexical Resource — range and precision of vocabulary, collocation, paraphrase,
   and whether I could talk around a word I did not know.
3. Grammatical Range and Accuracy — variety of structures AND how many errors.
4. Pronunciation — individual sounds, word and sentence stress, intonation, and
   how much effort a listener needs to follow me.

Then give an OVERALL band: the average of the four, rounded to the nearest half.

Be honest and calibrated. Do NOT inflate — an inflated score is useless to me.
A competent but untrained speaker is usually Band 6-6.5. Reserve 8+ for genuinely
excellent performance.

Finally give me:
- THREE specific moments that cost me marks: quote my exact words, say which
  criterion they hurt, and give the better version.
- TWO things I did well, with what I actually said.
- ONE instruction to focus on next time.`;

const SPEAK_VOICE_NOTE = `You are speaking to me by voice, so talk naturally at a
normal examiner pace. Keep your own turns short. Do not read out long lists.`;

const SPEAKING_BANK = {
  part1: {
    label: 'Part 1 — Introduction & familiar topics',
    blurb:
      '4–5 minutes. Short questions about your own life. The skill is answering within a second without overthinking, in two or three sentences — not one word, not a speech.',
    topics: [
      {
        id: 'p1-work',
        title: 'Work & Study',
        questions: [
          'Do you work or are you a student?',
          'What do you do in your job?',
          'Why did you choose that field?',
          'What is the most difficult part of your work?',
          'Would you like to change your job in the future?',
          'Do you prefer working alone or in a team?',
        ],
      },
      {
        id: 'p1-hometown',
        title: 'Hometown',
        questions: [
          'Where is your hometown?',
          'What is it known for?',
          'Has it changed much since you were a child?',
          'What do you like most about living there?',
          'Would you recommend it to a visitor?',
          'Do you think you will live there in ten years?',
        ],
      },
      {
        id: 'p1-tech',
        title: 'Technology',
        questions: [
          'How often do you use a computer?',
          'What was the first piece of technology you owned?',
          'Do you think you spend too much time on your phone?',
          'How has technology changed the way you work?',
          'Are there any technologies you dislike?',
          'Do older people in your family use technology easily?',
        ],
      },
      {
        id: 'p1-freetime',
        title: 'Free time & hobbies',
        questions: [
          'What do you usually do in your free time?',
          'Has that changed since you were younger?',
          'Do you prefer spending free time alone or with others?',
          'Is there a hobby you would like to take up?',
          'Do you get enough free time during the week?',
          'What did you do last weekend?',
        ],
      },
      {
        id: 'p1-food',
        title: 'Food & cooking',
        questions: [
          'What kind of food do you like?',
          'Do you cook at home?',
          'Have your eating habits changed in recent years?',
          'Do people in your country eat out often?',
          'Is there a food you disliked as a child but enjoy now?',
          'What is a typical meal in your household?',
        ],
      },
      {
        id: 'p1-travel',
        title: 'Travel & transport',
        questions: [
          'How do you usually get to work or college?',
          'Do you enjoy travelling?',
          'What is the public transport like where you live?',
          'Do you prefer short trips or long holidays?',
          'Is there anywhere you would like to visit?',
          'Has the way people travel changed in your country?',
        ],
      },
      {
        id: 'p1-sleep',
        title: 'Daily routine & sleep',
        questions: [
          'Are you a morning person or a night person?',
          'What does a typical weekday look like for you?',
          'Do you get enough sleep?',
          'Has your routine changed in the last few years?',
          'Do you plan your day in advance?',
          'What time of day are you most productive?',
        ],
      },
      {
        id: 'p1-learning',
        title: 'Learning & languages',
        questions: [
          'How did you learn English?',
          'Do you find learning languages easy?',
          'What is the best way to learn something new?',
          'Have you learned any skill recently outside work?',
          'Do you prefer learning from books or from people?',
          'Would you like to learn another language?',
        ],
      },
    ],
  },

  part2: {
    label: 'Part 2 — The long turn',
    blurb:
      '1 minute to prepare with notes, then speak for 1–2 minutes alone with no interruption. The whole skill is not stopping early.',
    topics: [
      {
        id: 'p2-tech',
        title: 'A piece of technology you use daily',
        card: 'Describe a piece of technology you use every day.',
        bullets: ['what it is', 'how often and why you use it', 'how you learned to use it', 'and explain how your life would differ without it'],
      },
      {
        id: 'p2-skill',
        title: 'A skill you learned as an adult',
        card: 'Describe a skill you learned after you finished school.',
        bullets: ['what the skill is', 'why you decided to learn it', 'how you learned it', 'and explain how useful it has been'],
      },
      {
        id: 'p2-person',
        title: 'A person who influenced you',
        card: 'Describe a person who has had a strong influence on you.',
        bullets: ['who they are', 'how you know them', 'what they did', 'and explain why their influence mattered'],
      },
      {
        id: 'p2-decision',
        title: 'A difficult decision',
        card: 'Describe a difficult decision you had to make.',
        bullets: ['what the decision was', 'what the options were', 'how you decided', 'and explain whether it was the right choice'],
      },
      {
        id: 'p2-place',
        title: 'A place you find peaceful',
        card: 'Describe a place where you feel calm and relaxed.',
        bullets: ['where it is', 'how often you go there', 'what you do there', 'and explain why it has that effect on you'],
      },
      {
        id: 'p2-memory',
        title: 'A childhood memory',
        card: 'Describe an important memory from your childhood.',
        bullets: ['what happened', 'when and where it happened', 'who was there', 'and explain why you still remember it'],
      },
      {
        id: 'p2-change',
        title: 'A change in your city',
        card: 'Describe a change you have seen in the place where you live.',
        bullets: ['what changed', 'when it happened', 'who it affected', 'and explain whether you think it was positive'],
      },
      {
        id: 'p2-project',
        title: 'A project you worked on',
        card: 'Describe a project or piece of work you were proud of.',
        bullets: ['what the project was', 'what your role was', 'what problems came up', 'and explain why you were proud of it'],
      },
    ],
  },

  part3: {
    label: 'Part 3 — Abstract discussion',
    blurb:
      '4–5 minutes of two-way debate on the ideas behind your Part 2 topic. Answers should be developed, not short — use Point, Explanation, Example, Link.',
    topics: [
      {
        id: 'p3-tech',
        title: 'Technology & society',
        pairs: 'p2-tech',
        questions: [
          'How has technology changed the way families communicate?',
          'Do you think people rely too heavily on their devices?',
          'Will artificial intelligence replace most office jobs in the next fifty years?',
          'Should governments regulate how children use technology?',
          'Who benefits most from rapid technological change?',
        ],
      },
      {
        id: 'p3-education',
        title: 'Education & learning',
        pairs: 'p2-skill',
        questions: [
          'Should adults keep studying throughout their careers?',
          'Is formal education still the best way to learn a skill?',
          'Do you think university degrees will matter less in future?',
          'Whose responsibility is it to retrain workers whose jobs disappear?',
          'How should schools prepare students for jobs that do not exist yet?',
        ],
      },
      {
        id: 'p3-work',
        title: 'Work & careers',
        pairs: 'p2-project',
        questions: [
          'Is job satisfaction more important than a high salary?',
          'Has remote work been good for society?',
          'Do you think people change jobs too often nowadays?',
          'Should companies be responsible for their employees wellbeing?',
          'What makes someone good at their job?',
        ],
      },
      {
        id: 'p3-city',
        title: 'Cities & the environment',
        pairs: 'p2-change',
        questions: [
          'What problems do fast-growing cities face?',
          'Should governments limit private car use in city centres?',
          'Is it possible to develop a city without harming the environment?',
          'Who should pay for dealing with electronic waste?',
          'Will more people live in cities or leave them in future?',
        ],
      },
      {
        id: 'p3-influence',
        title: 'Influence & role models',
        pairs: 'p2-person',
        questions: [
          'Do young people today have good role models?',
          'How much are we shaped by the people around us?',
          'Is the influence of social media figures a problem?',
          'Should famous people be expected to behave responsibly?',
          'Do families have less influence on children than they used to?',
        ],
      },
      {
        id: 'p3-decisions',
        title: 'Decisions & risk',
        pairs: 'p2-decision',
        questions: [
          'Do people make better decisions alone or in groups?',
          'Is it better to plan carefully or to act quickly?',
          'Why do people often regret their decisions?',
          'Should important decisions be based on data or instinct?',
          'Do you think people take fewer risks as they get older?',
        ],
      },
    ],
  },
};

/* ---------- prompt builders ---------- */

function speakPromptPart1(topic) {
  return `You are an IELTS Speaking examiner. We are doing PART 1 of the IELTS Academic Speaking test.

${SPEAK_VOICE_NOTE}

HOW TO RUN IT:
- Begin the way a real examiner does: greet me, ask my full name, then start.
- Ask me ONE question at a time and wait for my answer before the next one.
- Ask 10 to 12 short questions in total, drawn from or similar to the list below.
- Keep the pace brisk. Part 1 lasts 4 to 5 minutes.
- Do NOT comment on, correct, praise or react to my answers during the test.
- If I give a one-word answer, simply move on — note it for the feedback later.

TOPIC: ${topic.title}

Questions to draw from:
${topic.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

When you have asked your last question, say "That is the end of Part 1" and then
give me the evaluation below.

${SPEAK_CRITERIA}`;
}

function speakPromptPart2(topic) {
  return `You are an IELTS Speaking examiner. We are doing PART 2 of the IELTS Academic Speaking test — the long turn.

${SPEAK_VOICE_NOTE}

HOW TO RUN IT:
- Read me the cue card below, then say "You have one minute to prepare."
- Wait for me to say I am ready. Do not talk during my preparation minute.
- Then say "Please begin" and STAY SILENT while I speak. Do not interrupt,
  prompt, encourage or fill my pauses, even if I go quiet.
- I should speak for 1 to 2 minutes. If I stop before one minute, note it and
  wait a moment before ending the turn.
- After I finish, ask ONE short rounding-off question related to what I said.
- Do NOT give feedback during the task.

THE CUE CARD:
${topic.card}
You should say:
${topic.bullets.slice(0, -1).map((b) => `  - ${b}`).join('\n')}
and ${topic.bullets[topic.bullets.length - 1].replace(/^and /, '')}

IMPORTANT for the feedback: tell me exactly how long I spoke for, how many times
I paused for more than two seconds, and whether I covered all four bullet points.

${SPEAK_CRITERIA}`;
}

function speakPromptPart3(topic) {
  return `You are an IELTS Speaking examiner. We are doing PART 3 of the IELTS Academic Speaking test — the abstract discussion.

${SPEAK_VOICE_NOTE}

HOW TO RUN IT:
- Ask me one question at a time from the theme below, starting with the more
  concrete questions and moving to the more abstract ones.
- This is a DISCUSSION, not an interview. Push back on my answers: ask "why do
  you think that?", offer a counter-example, or ask me to compare or speculate.
- Ask 5 to 7 questions in total. Part 3 lasts 4 to 5 minutes.
- Expect developed answers. If I answer in one short sentence, follow up and
  make me extend it — then note that in the feedback.
- Do NOT correct my English during the discussion.

DISCUSSION THEME: ${topic.title}

Questions to draw from and build on:
${topic.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

IMPORTANT for the feedback: tell me whether my answers were developed enough for
Part 3, and whether I used Point-Explanation-Example-Link structure or just
asserted opinions without support.

${SPEAK_CRITERIA}`;
}

function speakPromptFull() {
  const p1 = SPEAKING_BANK.part1.topics[Math.floor(Math.random() * SPEAKING_BANK.part1.topics.length)];
  const p2 = SPEAKING_BANK.part2.topics[Math.floor(Math.random() * SPEAKING_BANK.part2.topics.length)];
  const linked = SPEAKING_BANK.part3.topics.find((t) => t.pairs === p2.id) || SPEAKING_BANK.part3.topics[0];

  return `You are an IELTS Speaking examiner. We are doing a COMPLETE IELTS Academic Speaking test, all three parts, under exam conditions. It should last 11 to 14 minutes.

${SPEAK_VOICE_NOTE}

RUN ALL THREE PARTS BACK TO BACK WITHOUT STOPPING FOR FEEDBACK:

PART 1 (4-5 min) — greet me, ask my name, then ask 10-12 short questions on:
${p1.title}
${p1.questions.map((q) => `  - ${q}`).join('\n')}

PART 2 (3-4 min) — read this cue card, give me one minute to prepare, then stay
completely silent while I speak for 1-2 minutes, then ask one follow-up question:
${p2.card}
You should say:
${p2.bullets.slice(0, -1).map((b) => `  - ${b}`).join('\n')}
and ${p2.bullets[p2.bullets.length - 1].replace(/^and /, '')}

PART 3 (4-5 min) — a two-way discussion on ${linked.title}. Push back on my
answers and make me justify them:
${linked.questions.map((q) => `  - ${q}`).join('\n')}

Give NO feedback at all until all three parts are complete.

${SPEAK_CRITERIA}

Also tell me which of the three parts was my weakest and why.`;
}
