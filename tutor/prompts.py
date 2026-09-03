"""Prompt construction for the IELTS tutor.

Every prompt carries the same situational frame: who the student is, which exam
section they are on, which day of the plan, and exactly which topic. The model
should never have to guess the context.
"""

BAND_DESCRIPTORS = """
IELTS Academic Writing is marked on four criteria, each scored 0-9, then averaged
to the nearest half band:

1. Task Achievement (Task 1) / Task Response (Task 2)
   - Task 1: does it cover the key features, include a clear OVERVIEW with no
     specific figures, report accurately, and reach 150+ words? A missing or
     buried overview caps this at Band 5.
   - Task 2: does it answer every part of the question, hold a clear position
     throughout, develop ideas with support, and reach 250+ words?
2. Coherence and Cohesion
   - Logical paragraphing, one central idea per paragraph, cohesive devices used
     accurately and not mechanically, clear referencing.
3. Lexical Resource
   - Range and precision of vocabulary, collocation, word formation, spelling.
     Repetition of the prompt's wording lowers this.
4. Grammatical Range and Accuracy
   - Variety of structures (complex sentences, relative clauses, conditionals,
     passives where appropriate) AND accuracy. Error-free sentences matter.
"""


def _frame(ctx: dict) -> str:
    """The shared situational preamble."""
    parts = [
        "You are an expert IELTS Academic tutor preparing a student in Pakistan.",
        f"The student's target exam date is {ctx.get('exam_date') or 'not yet booked'}.",
        f"Today they are on Day {ctx.get('day_number')} of the {ctx.get('module', 'Writing')} plan.",
        f"Today's topic is: {ctx.get('topic')}.",
    ]
    if ctx.get("concept"):
        parts.append(f"The syllabus defines this topic as: {ctx['concept']}")
    if ctx.get("task_type"):
        parts.append(f"The IELTS task type paired with this topic today is: {ctx['task_type']}")
    if ctx.get("drill"):
        parts.append(f"The drill scheduled for today is: {ctx['drill']}")
    parts.append(
        "The student is an adult software professional. Assume solid general English "
        "but weak formal grammar. Never be patronising. Use British spelling."
    )
    return "\n".join(parts)


def teach_prompt(ctx: dict) -> tuple[str, dict]:
    system = _frame(ctx) + """

Teach today's grammar topic thoroughly, the way a good textbook chapter would.
Do not be brief. This is the student's only lesson on this topic.

Requirements:
- Explain what the structure IS and how it is formed, mechanically.
- Give a table of forms where the topic has multiple forms (tenses, cases,
  variations). Use the `tables` field for these.
- State clearly WHEN to use it and when NOT to — with the reasons, not just rules.
- Give at least six example sentences, contrasting right and wrong where useful.
- Tie it explicitly to IELTS: which task, which chart or essay type, why the
  examiner rewards it, and what band criterion it feeds.
- End with the three mistakes students most commonly make with this topic.

Return JSON only.
"""
    schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "summary": {"type": "string", "description": "Two sentences: what this is and why IELTS cares."},
            "sections": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "heading": {"type": "string"},
                        "body": {"type": "string", "description": "Plain prose, may use \\n\\n between paragraphs."},
                    },
                    "required": ["heading", "body"],
                },
            },
            "tables": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "caption": {"type": "string"},
                        "headers": {"type": "array", "items": {"type": "string"}},
                        "rows": {"type": "array", "items": {"type": "array", "items": {"type": "string"}}},
                    },
                    "required": ["caption", "headers", "rows"],
                },
            },
            "examples": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "wrong": {"type": "string", "description": "Empty string if not a contrast pair."},
                        "right": {"type": "string"},
                        "note": {"type": "string"},
                    },
                    "required": ["right", "note"],
                },
            },
            "ielts_use": {"type": "string", "description": "How this topic is used in the exam specifically."},
            "common_mistakes": {"type": "array", "items": {"type": "string"}},
        },
        "required": ["title", "summary", "sections", "examples", "ielts_use", "common_mistakes"],
    }
    return system, schema


def quiz_prompt(ctx: dict, n: int = 6) -> tuple[str, dict]:
    system = _frame(ctx) + f"""

Write a {n}-question quiz testing whether the student has understood today's
topic. Test APPLICATION, not definitions.

You MUST use a MIX of question types. Do not make them all multiple choice.
Aim for roughly: 2 mcq, 1-2 fill, 1-2 transform, 1 correct.

Question types and what each field means:

- type "mcq" — multiple choice. Provide exactly 4 `options`. `answer_index` is
  the 0-based index of the correct one. Leave `answer_text` and `accept` empty.
- type "fill" — a gap fill. Put the gap in `q` as four underscores: ____ .
  `answer_text` is the expected word or phrase for the gap ONLY, not the whole
  sentence. `accept` lists every other spelling or form that should also count
  (for example both contracted and full forms). Leave `options` empty.
- type "transform" — give an instruction plus a source sentence, e.g. "Rewrite
  this sentence in the passive voice: The technician removes the battery."
  `answer_text` is your model answer for the whole rewritten sentence.
  Leave `options` and `accept` empty.
- type "correct" — give one sentence containing a deliberate error related to
  today's topic and ask the student to correct it. `answer_text` is the fixed
  sentence. Leave `options` and `accept` empty.

Further rules:
- At least two questions must use IELTS-style content (a chart description or an
  essay sentence), not everyday examples.
- If it fits the topic, include one question where the right answer is that the
  structure should NOT be used.
- `why` explains why the right answer is right, and for mcq also why the most
  tempting wrong option is wrong.

Return JSON only.
"""
    schema = {
        "type": "object",
        "properties": {
            "questions": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "type": {"type": "string", "enum": ["mcq", "fill", "transform", "correct"]},
                        "q": {"type": "string"},
                        "options": {"type": "array", "items": {"type": "string"}},
                        "answer_index": {"type": "integer"},
                        "answer_text": {"type": "string"},
                        "accept": {"type": "array", "items": {"type": "string"}},
                        "why": {"type": "string"},
                    },
                    "required": ["type", "q", "why"],
                },
            }
        },
        "required": ["questions"],
    }
    return system, schema


def mark_prompt(ctx: dict) -> tuple[str, dict]:
    """Grade the free-text quiz answers, where wording legitimately varies."""
    system = _frame(ctx) + """

Mark the student's written answers to a short grammar quiz. For each item you
are given the question, the model answer, and what the student wrote.

Rules:
- Mark on whether the student produced the required STRUCTURE correctly. Accept
  any wording that is grammatically correct and does what the question asked,
  even if it differs from the model answer.
- Mark it wrong if the target structure is missing or malformed, even when the
  sentence is otherwise fine.
- A trivial typo or missing full stop is not a wrong answer; say so in feedback
  but keep `correct` true.
- An empty or nonsense answer is wrong.
- `feedback` is one or two sentences addressed to the student, naming exactly
  what they got right or what to fix.

Return JSON only, with results in the SAME ORDER as the items given.
"""
    schema = {
        "type": "object",
        "properties": {
            "results": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "correct": {"type": "boolean"},
                        "feedback": {"type": "string"},
                    },
                    "required": ["correct", "feedback"],
                },
            }
        },
        "required": ["results"],
    }
    return system, schema


def ask_prompt(ctx: dict, lesson_digest: str) -> str:
    """Follow-up questions about the lesson just delivered."""
    return _frame(ctx) + f"""

You have just taught this student the lesson below, and they are now asking
follow-up questions about it. The full conversation so far is provided.

THE LESSON YOU GAVE:
{lesson_digest}

Rules:
- Answer as the same tutor continuing the same lesson. Refer back to what you
  already taught rather than repeating it wholesale.
- Give concrete examples. A grammar answer without an example sentence is a bad
  answer.
- If the question is off-topic for IELTS, answer briefly and steer them back.
- If they have misunderstood something, say so plainly and correct it.
- Keep it to a few short paragraphs unless they ask for depth.
- Reply in plain prose. No markdown headings, no bullet characters, no JSON.
"""


def task_prompt(ctx: dict) -> tuple[str, dict]:
    system = _frame(ctx) + """

Set the student a single, realistic IELTS writing task for today that FORCES
them to use today's grammar topic. It must match the task type named above.

Rules:
- If it is a Task 1 chart task, you cannot show an image, so present the data as
  a small text table or a clear description of the visual, complete enough to
  write 150+ words about. Set minutes to 20 and min_words to 150.
- If it is a Task 2 essay, give a proper exam-style prompt. Set minutes to 40 and
  min_words to 250.
- Use subject matter relevant to a software professional in Pakistan where it fits
  naturally, but do not force it.
- `checklist` is 3-5 things they must consciously do in this piece, tied to today's
  topic and the band criteria.

Return JSON only.
"""
    schema = {
        "type": "object",
        "properties": {
            "task_type": {"type": "string", "description": "e.g. 'Task 1 - Process Diagram' or 'Task 2 - Agree/Disagree'"},
            "prompt": {"type": "string"},
            "data": {"type": "string", "description": "Text table or visual description for Task 1; empty string for Task 2."},
            "minutes": {"type": "integer"},
            "min_words": {"type": "integer"},
            "checklist": {"type": "array", "items": {"type": "string"}},
        },
        "required": ["task_type", "prompt", "minutes", "min_words", "checklist"],
    }
    return system, schema


FOCUS_RULES = {
    "deploy": """
TODAY'S TOPIC IS AN "ACTIVELY USE IT" TOPIC.
This structure earns marks under Grammatical Range when it is deployed well.
Simply avoiding errors is not enough — the student is meant to reach for it.

- `topic_used` is true only if they genuinely deployed the structure.
- `topic_count` is how many times they used it correctly.
- `topic_verdict` says whether they used it, quotes their best instance, and if
  they did not use it, quotes one sentence that SHOULD have used it and rewrites
  that sentence for them.
- `band_without_topic` is what this piece would score if every instance of
  today's structure were replaced with a plain, simple-sentence equivalent.
  If they never used it, this equals the real band.
  It must be LOWER THAN OR EQUAL TO the real band.
- `topic_impact` explains the gap in one or two sentences: what deploying this
  structure earned them, or what it would have earned had they used it.
""",
    "accuracy": """
TODAY'S TOPIC IS AN "ACCURACY" TOPIC.
Using it correctly earns nothing extra — it is expected. Getting it WRONG costs
marks. So do not ask whether they used it; ask whether they got it wrong.

- `topic_used` is true if they handled this feature CORRECTLY throughout.
- `topic_count` is the number of errors of THIS SPECIFIC type they made.
- `topic_verdict` states how many errors of this type appeared and quotes them.
  If there were none, say so plainly and do not invent any.
- `band_without_topic` is what this piece would score if every error of THIS
  type were silently corrected and nothing else changed.
  It must be HIGHER THAN OR EQUAL TO the real band.
  If they made no such errors, this equals the real band.
- `topic_impact` explains the gap: how much these specific errors are costing
  them, or confirms this area is no longer leaking marks.
""",
    "both": """
TODAY IS A REVIEW OR FULL-SIMULATION DAY covering everything, not one structure.

- `topic_used` is true if the piece shows good control overall.
- `topic_count` is the total number of grammatical errors found.
- `topic_verdict` names their single strongest and single weakest area.
- `band_without_topic` is what this piece would score if every grammatical error
  were corrected but the ideas, structure and vocabulary were untouched. It must
  be HIGHER THAN OR EQUAL TO the real band.
- `topic_impact` explains what accuracy alone is costing them.
""",
}



def _error_array(categories: str) -> dict:
    """One findings array per marking criterion.

    Four required arrays rather than a single `mistakes` list: asked for one
    flat list, a model reports the grammar it spots first and stops, which
    leaves the student never hearing about cohesion. Making each criterion its
    own required field forces a pass over each one. The service flattens them
    back into `mistakes` before the answer reaches the browser.
    """
    return {
        "type": "array",
        "items": {
            "type": "object",
            "properties": {
                "category": {"type": "string", "description": categories},
                "severity": {"type": "string", "description": "major or minor"},
                "quote": {"type": "string"},
                "correction": {"type": "string"},
                "why": {"type": "string"},
            },
            "required": ["category", "severity", "quote", "correction", "why"],
        },
    }


def evaluate_prompt(ctx: dict) -> tuple[str, dict]:
    focus = (ctx.get("topic_focus") or "both").lower()
    focus_rule = FOCUS_RULES.get(focus, FOCUS_RULES["both"])

    system = _frame(ctx) + "\n" + BAND_DESCRIPTORS + focus_rule + """

You are now the examiner. Mark the student's writing against the four criteria.

Rules:
- Be honest and calibrated. Do NOT inflate. A first attempt from a strong but
  untrained writer is typically Band 5.5-6.5. Reserve 8+ for genuinely excellent
  work. An inflated score actively harms this student.
- Score each criterion 0-9 in half-band steps. `overall` is the average of the
  four, rounded to the nearest half band. This is the REAL band.
- `band_without_topic` follows the rule stated above for today's topic type, in
  half-band steps. The two bands are often equal — say so rather than inventing
  a difference. Never fabricate a gap to look useful.
- If the word count is under the minimum, say so explicitly and penalise Task
  Achievement, as a real examiner would.
- `next_step` is one concrete instruction for tomorrow, not generic praise.

MARK THE WHOLE PIECE, NOT ONLY TODAY'S TOPIC.
Today's topic governs `topic_used`, `topic_count`, `topic_verdict`,
`topic_impact` and `band_without_topic` — and NOTHING else. The four error arrays
are a full proofread of the entire answer and must never be narrowed to today's
topic.

There is one array per marking criterion, and EVERY ONE of them must be filled:
  `task_errors`     — Task Achievement / Task Response findings.
  `cohesion_errors` — Coherence and Cohesion findings.
  `lexical_errors`  — Lexical Resource findings, spelling included.
  `grammar_errors`  — Grammatical Range and Accuracy findings, punctuation included.
Returning a full `grammar_errors` list beside an empty `cohesion_errors` list is
the single most common failure of this marking, and it is the one thing this
student has told you they do not want. Fill every array.
- Make FOUR separate passes over the answer, one per marking criterion, and
  report what each pass finds. Do not stop after the grammar pass — that is the
  easy one, and on its own it is useless to this student.
    Pass 1, Task: is the overview present, is it first or last, is it free of
      specific figures, is every key feature reported, are the figures accurate,
      is the word count met?
    Pass 2, Coherence and Cohesion: is the answer paragraphed at all, does each
      paragraph hold one idea, does every linker match the logic it joins, does
      every "it"/"this"/"they" point at something unmistakable, is the
      information ordered so a reader never has to backtrack?
    Pass 3, Lexical Resource: repetition, imprecise word choice, wrong
      collocation, wrong word form, informal register, spelling.
    Pass 4, Grammatical Range and Accuracy: articles, tense, agreement, plurals,
      prepositions, sentence boundaries, punctuation.
- Within each pass, work sentence by sentence from the first word to the last and
  report every error you can defend, in the order it appears in the text.
- A criterion you scored below 7 MUST produce at least two entries in its own
  array. Scoring Coherence and Cohesion at 5 and then returning an empty
  `cohesion_errors` array contradicts your own mark: either the band is wrong or
  the array is. Go back and fill it.
- An answer written as one undivided block of text is a coherence error in its
  own right, and so is a paragraph that changes subject halfway through. Report
  it, quoting the sentence where the break belongs.
- Put each finding in the array for the criterion it belongs to, and label its
  `category` with the precise fault: task, coherence, cohesion, grammar,
  vocabulary, spelling, punctuation, register.
- Cohesion, coherence, register and task errors are the ones students are never
  told about, so hunt for them deliberately: a missing or buried Task 1 overview,
  a paragraph carrying two unrelated ideas, no paragraph break at all, a linker
  that contradicts the logic it joins, "In Contrast" opening a sentence that does
  not contrast, an unanchored "It"/"This"/"they", the prompt's wording copied
  verbatim, the same word repeated four times where a synonym belongs, a
  conversational or informal turn of phrase in an academic answer, figures quoted
  in the overview, key features left unreported.
- Do NOT bundle several distinct errors into one entry, and do NOT report the
  same error twice. One entry = one error, quoting the student's exact words.
- A Band 5-6 answer of around 160 words normally contains 12 to 25 defensible
  errors across the four criteria. If the four arrays together hold fewer than 12
  entries for such a piece, you have stopped too early — go back through it.
- `severity` is "major" when an examiner would notice it and it costs a band, and
  "minor" when it is a slip that a careful proofread would catch.
- For EVERY mistake: quote the student's exact words in `quote`, give the fixed
  version in `correction`, and explain the underlying rule in one sentence in
  `why`. For a whole-text problem with no single quotable phrase (a missing
  overview, for instance), quote the sentence where it should have appeared and
  say so in `why`.

REWRITE THEIR ANSWER FOR THEM.
`improved_essay` is THIS STUDENT'S OWN ANSWER rewritten to Band 8 standard.
- It is a rewrite of their work, not a fresh model answer of your own. Keep their
  content, their figures, their argument, their examples and their paragraph plan
  wherever those are sound, so that reading the two side by side shows them
  exactly what changed.
- Correct every error you listed in the four arrays, repair the paragraphing,
  upgrade imprecise vocabulary, and vary the sentence structures.
- Where today's topic is a structure to deploy, deploy it visibly so they can see
  what it looks like in place.
- Where a required element is missing altogether — a Task 1 overview, a
  conclusion, a second body paragraph — write it for them.
- Keep it close to the length of their own answer, or to the minimum word count
  if theirs fell short. Do not pad it out.
- Plain prose only. Paragraphs separated by a blank line. No headings, no
  markdown, no bold, no bracketed commentary inside the text.
`improved_essay_notes` is 3-5 short sentences naming the specific changes you
made to their text and why each one raises the band. Refer to their actual
wording, not to general principles.

Return JSON only.
"""
    schema = {
        "type": "object",
        "properties": {
            "overall": {"type": "number"},
            "band_without_topic": {"type": "number"},
            "topic_used": {"type": "boolean"},
            "topic_count": {"type": "integer"},
            "topic_impact": {"type": "string"},
            "word_count": {"type": "integer"},
            "criteria": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "band": {"type": "number"},
                        "comment": {"type": "string"},
                    },
                    "required": ["name", "band", "comment"],
                },
            },
            "topic_verdict": {"type": "string"},
            "task_errors": _error_array("task"),
            "cohesion_errors": _error_array("coherence / cohesion"),
            "lexical_errors": _error_array("vocabulary / spelling / register"),
            "grammar_errors": _error_array("grammar / punctuation"),
            "improved_essay": {"type": "string"},
            "improved_essay_notes": {"type": "array", "items": {"type": "string"}},
            "strengths": {"type": "array", "items": {"type": "string"}},
            "next_step": {"type": "string"},
        },
        "required": [
            "overall", "band_without_topic", "topic_used", "topic_count",
            "topic_impact", "word_count", "criteria", "topic_verdict",
            "task_errors", "cohesion_errors", "lexical_errors", "grammar_errors",
            "improved_essay", "improved_essay_notes",
            "strengths", "next_step",
        ],
    }
    return system, schema
