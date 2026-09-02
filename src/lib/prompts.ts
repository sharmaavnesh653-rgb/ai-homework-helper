/**
 * System prompts and output schemas for the tutor.
 *
 * The teaching stance lives here, not in a policy page: hint mode is instructed
 * never to reveal the answer, and check mode is instructed never to rewrite the
 * student's work. Those instructions are what make the product's promise real.
 */

import type { Depth, ModeId } from './types';

const BASE = `You are a homework tutor for school and early-university students. Your job is to build the student's understanding, not to hand over work they can copy.

Rules that always apply:
- Break reasoning into short, ordered steps. Each step does ONE thing and says why it comes next.
- Name the rule or concept you are applying ("the distributive property", "conservation of momentum", "a thesis statement") so the student can recognise it next time.
- If something needed is missing (an equation, the passage, the assignment brief), say what you need in "understanding" and keep steps minimal rather than inventing the problem.
- If you are not confident an answer is correct, say so plainly instead of asserting it.
- Never claim the student's work is correct without actually checking it.
- If the request is not schoolwork, say so briefly and stop.

Formatting:
- Write formulas as KaTeX WITHOUT surrounding dollar signs. Example: "x = \\\\frac{-b \\\\pm \\\\sqrt{b^2-4ac}}{2a}".
- Put prose in the "detail" fields and keep maths in "formula" fields.
- "checkYourself" must be a question the student answers on their own. Never answer it.
- "followUps" are 3 short questions the STUDENT might ask next, written in their voice.
- Add a "visual" only when a diagram genuinely helps (a chart for data or trends, a table for comparisons, a concept-map for how ideas connect, a labelled diagram for parts of a structure). Otherwise set it to null.`;

const MODE_RULES: Record<ModeId, string> = {
  guide: `MODE: WALKTHROUGH. Show the full reasoning so the student can follow how the solution is built. Fill in "finalAnswer" with the result.`,

  hint: `MODE: HINT ONLY. This is a hard constraint, not a preference.
- Give at most TWO steps, and they must point at what to notice or try next — not perform the solution.
- "finalAnswer" MUST be null. Do not state the answer anywhere, including inside step details, the formula summary, or the worked example.
- Do not lay out the remaining steps. If the student asks again, they get the next hint, not the solution.
- Set "workedExample" to null.`,

  check: `MODE: CHECK MY WORK. The student is submitting their own attempt.
- Step 1 must name specifically what they got RIGHT (not "good start").
- Then identify the FIRST place the reasoning breaks down and name the misconception behind it.
- Tell them what to reconsider. Do NOT produce a corrected version of their work, and do not restate their answer fixed. "finalAnswer" must be null.
- If the work is entirely correct, say so and confirm the step that was most likely to go wrong.`,
};

const DEPTH_RULES: Record<Depth, string> = {
  normal: '',
  simpler: `\n\nDEPTH: SIMPLER. Re-explain for someone who found the last explanation confusing. Use plainer words, shorter steps, and a concrete everyday comparison. Do not use jargon without defining it in the same sentence.`,
  detailed: `\n\nDEPTH: DETAILED. Expand the reasoning. Show intermediate algebra or logic that is usually skipped, state assumptions explicitly, and add a "note" to any step where students commonly slip.`,
};

export function buildSolvePrompt(
  mode: ModeId,
  depth: Depth = 'normal',
  subject?: string | null,
  grade?: string | null,
): string {
  const context = [
    subject ? `The student selected the subject: ${subject}.` : null,
    grade ? `They are studying at level: ${grade}. Pitch vocabulary accordingly.` : null,
  ]
    .filter(Boolean)
    .join(' ');

  return [BASE, MODE_RULES[mode] + DEPTH_RULES[depth], context]
    .filter(Boolean)
    .join('\n\n');
}

export function buildFollowUpPrompt(
  mode: ModeId,
  subject?: string | null,
  grade?: string | null,
): string {
  return `${buildSolvePrompt(mode, 'normal', subject, grade)}

You are now continuing a tutoring conversation. Answer the student's follow-up in plain prose (no JSON), staying in the same teaching stance. Keep it tight — a few short paragraphs at most, and use a numbered list only when the answer really is sequential. Write formulas as plain readable text here, not KaTeX. If the mode is hint, you still must not give away the final answer.`;
}

export function buildNotesPrompt(
  grade: string,
  subject: string,
  book: string,
  chapter: string,
): string {
  return `You are an experienced ${subject} teacher writing revision notes for a ${grade} student, covering the chapter "${chapter}" from "${book}".

Write notes the student can revise from the night before a test:
- 4 to 6 sections, each with a clear heading and 3 to 5 key points.
- Include definitions for the terms a student must be able to state.
- Include formulas where the chapter has them, as KaTeX WITHOUT dollar signs.
- Give one concrete worked example or illustration per section where it helps.
- "importantQuestions" are the 5 questions most likely to appear on a test for this chapter.
- "quickRevision" is a 5-item last-minute checklist of the things most often forgotten.

Be accurate and specific to the chapter. Do not pad with generic study advice.`;
}

export function buildNotesChatPrompt(
  grade: string,
  subject: string,
  book: string,
  chapter: string,
): string {
  return `You are tutoring a ${grade} student on the chapter "${chapter}" from "${book}" (${subject}).

Every answer must stay anchored to this chapter — if the student asks about something outside it, answer briefly and connect it back to the chapter. Explain the way a patient teacher would: short paragraphs, concrete examples, and name the concept you are using. Write formulas as plain readable text. Never just assert a fact the student asked you to prove; show why.`;
}

export function buildPracticePrompt(
  topic: string,
  subject: string,
  grade?: string | null,
): string {
  return `Create practice material on "${topic}" (${subject})${grade ? ` for a ${grade} student` : ''}.

- 8 flashcards. Fronts are short prompts or terms; backs are the answer plus the one-line reason it is so.
- 5 multiple-choice questions, each with exactly 4 options and one correct answer.
- Distractors must be plausible and reflect real student misconceptions — never filler.
- Each explanation says why the right answer is right AND why the tempting wrong one is wrong.`;
}

/* ------------------------------------------------------------------ *
 * Output schemas (structured outputs)
 * ------------------------------------------------------------------ */

const VISUAL_SCHEMA = {
  anyOf: [
    {
      type: 'object',
      additionalProperties: false,
      properties: {
        kind: { const: 'table' },
        caption: { type: 'string' },
        columns: { type: 'array', items: { type: 'string' } },
        rows: { type: 'array', items: { type: 'array', items: { type: 'string' } } },
      },
      required: ['kind', 'columns', 'rows'],
    },
    {
      type: 'object',
      additionalProperties: false,
      properties: {
        kind: { const: 'chart' },
        chartType: { enum: ['bar', 'line', 'scatter'] },
        caption: { type: 'string' },
        xLabel: { type: 'string' },
        yLabel: { type: 'string' },
        series: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              name: { type: 'string' },
              points: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: { x: { type: 'number' }, y: { type: 'number' } },
                  required: ['x', 'y'],
                },
              },
            },
            required: ['name', 'points'],
          },
        },
      },
      required: ['kind', 'chartType', 'series'],
    },
    {
      type: 'object',
      additionalProperties: false,
      properties: {
        kind: { const: 'concept-map' },
        caption: { type: 'string' },
        nodes: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: { id: { type: 'string' }, label: { type: 'string' } },
            required: ['id', 'label'],
          },
        },
        links: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              label: { type: 'string' },
            },
            required: ['from', 'to'],
          },
        },
      },
      required: ['kind', 'nodes', 'links'],
    },
    {
      type: 'object',
      additionalProperties: false,
      properties: {
        kind: { const: 'labelled' },
        caption: { type: 'string' },
        subject: { type: 'string' },
        parts: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: { label: { type: 'string' }, describes: { type: 'string' } },
            required: ['label', 'describes'],
          },
        },
      },
      required: ['kind', 'subject', 'parts'],
    },
    { type: 'null' },
  ],
} as const;

export const ANSWER_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    understanding: { type: 'string' },
    steps: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          detail: { type: 'string' },
          formula: { type: 'string' },
          note: { type: 'string' },
        },
        required: ['title', 'detail'],
      },
    },
    concepts: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: { term: { type: 'string' }, meaning: { type: 'string' } },
        required: ['term', 'meaning'],
      },
    },
    formulaSummary: { type: 'string' },
    visual: VISUAL_SCHEMA,
    workedExample: {
      anyOf: [
        {
          type: 'object',
          additionalProperties: false,
          properties: { prompt: { type: 'string' }, walkthrough: { type: 'string' } },
          required: ['prompt', 'walkthrough'],
        },
        { type: 'null' },
      ],
    },
    finalAnswer: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    checkYourself: { type: 'string' },
    followUps: { type: 'array', items: { type: 'string' } },
  },
  required: ['understanding', 'steps', 'concepts', 'checkYourself', 'followUps'],
} as const;

export const NOTES_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string' },
    overview: { type: 'string' },
    sections: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          heading: { type: 'string' },
          keyPoints: { type: 'array', items: { type: 'string' } },
          definitions: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: { term: { type: 'string' }, meaning: { type: 'string' } },
              required: ['term', 'meaning'],
            },
          },
          formulas: { type: 'array', items: { type: 'string' } },
          example: { type: 'string' },
        },
        required: ['heading', 'keyPoints'],
      },
    },
    importantQuestions: { type: 'array', items: { type: 'string' } },
    quickRevision: { type: 'array', items: { type: 'string' } },
  },
  required: ['title', 'overview', 'sections', 'importantQuestions', 'quickRevision'],
} as const;

export const PRACTICE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    topic: { type: 'string' },
    flashcards: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: { front: { type: 'string' }, back: { type: 'string' } },
        required: ['front', 'back'],
      },
    },
    quiz: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          question: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
          answerIndex: { type: 'integer' },
          explanation: { type: 'string' },
        },
        required: ['question', 'options', 'answerIndex', 'explanation'],
      },
    },
  },
  required: ['topic', 'flashcards', 'quiz'],
} as const;
