# Stepwise — AI study companion

**Ask anything, understand everything.** A homework helper built so students end
a session *able to do the next one themselves* — not holding an answer to copy.

> `Stepwise` is a working name. It lives in `src/components/Wordmark.astro` and
> the page copy, so renaming is cheap.

## Why it's different (enforced in the product, not promised in a footer)

| Mode | Behaviour |
| --- | --- |
| **Walk me through it** | Full reasoning in separated steps; names the rule at each step; ends with a self-check question it deliberately leaves unanswered. |
| **Just a hint** | One nudge. `finalAnswer` is stripped server-side, so the answer cannot leak even if the model ignores the instruction. |
| **Check my work** | Reviews the student's own attempt, names the first misconception, and is instructed **not** to produce a corrected version. |

Also: no ads, no credit/quota system, no "AI humanizer", and one honest price
shown per month *and* per year.

## The four destinations

- **`/solve`** — type, paste, or upload a photo/PDF. Structured answer: steps,
  rendered formulas, key concepts, a visual when one helps, final answer,
  check-yourself question, and follow-up chat.
- **`/notes`** — class → subject → textbook → chapter → structured revision notes,
  then a chat that stays anchored to that chapter.
- **`/practice`** — flashcards plus a quiz where each explanation names the
  misconception behind the tempting wrong answer.
- **`/subjects`**, **`/saved`**, **`/history`** — browse coverage, and your own
  saved work and question log (stored in the browser).

## Setup

```sh
npm install
cp .env.example .env    # then add your key
npm run dev             # http://localhost:4321
```

`ANTHROPIC_API_KEY` is the only required variable — get one from the
[Claude Console](https://platform.claude.com/settings/keys). It's declared as a
secret server variable via `astro:env`, so it never reaches the client bundle.
It's optional at build time (CI can build without it); the API routes return a
clear `503` at request time if it's absent.

## Commands

| Command | Action |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build to `./dist/` |
| `npm run preview` | Preview the build |
| `npx astro check` | Typecheck `.astro`, `.ts` and `.tsx` |

Run the built server directly:

```sh
HOST=127.0.0.1 PORT=4321 node ./dist/server/entry.mjs
```

## Architecture

```
src/
├── lib/
│   ├── types.ts            Shared types + the structured-answer contract
│   ├── prompts.ts          System prompts and JSON schemas
│   ├── curriculum.ts       Subjects, grades, textbooks, chapters, examples
│   ├── storage.ts          localStorage: saved notes, history, theme
│   ├── client/sse.ts       SSE reader + JSON POST helper
│   └── server/
│       ├── claude.ts       Client, error mapping, structured-output helper
│       └── validate.ts     Request validation
├── pages/
│   ├── index.astro         Landing page
│   ├── solve|notes|practice|subjects|saved|history|for-teachers
│   └── api/
│       ├── solve.ts        Structured answer (vision + PDF)
│       ├── chat.ts         Streaming follow-ups and chapter chat
│       ├── notes.ts        Chapter revision notes
│       └── practice.ts     Flashcards + quiz
├── components/
│   ├── Nav|SiteFooter|PageHeader|Wordmark  (.astro)
│   └── react/              Workspaces + Composer, AnswerCard, VisualBlock,
│                           Combobox, States, Formula, ThemeToggle, Library
└── styles/global.css       Design tokens, dark mode, utilities, keyframes
```

The four `/api/*` routes render on demand (`prerender = false`); every page is
prerendered static, so the site is cheap to serve.

### API contract

`POST /api/solve` → `{ answer: TutorAnswer, mode, depth }`
Body: `question`, optional `mode` (`guide|hint|check`), `depth`
(`normal|simpler|detailed`), `subject`, `grade`, `attachments[]`
(base64 PNG/JPEG/WebP/GIF/PDF, ≤4 files, ≤4 MB each).

`POST /api/chat` → `text/event-stream` with three named events: `delta`
(`{text}`), `error` (`{message}`), `done` (`{stopReason}`). Pass
`context: "notes"` plus grade/subject/book/chapter for chapter-scoped chat.

`POST /api/notes` → `{ notes: StudyNotes }` · `POST /api/practice` → `{ practice: PracticeSet }`

Validation failures return JSON with a `4xx` status *before* streaming starts.
Once a stream is open the status can't change, so failures travel in-band as an
`error` event — including `stop_reason: "refusal"` and `max_tokens`, which arrive
from the API as HTTP 200.

## Two implementation notes worth knowing

**Structured output has a fallback path.** `output_config.format` is
authoritative on the first-party API, but some gateways silently drop it and
return a ```` ```json ```` fenced block instead. `generateStructured` therefore
also restates the schema in the system prompt, tolerantly extracts the outermost
balanced JSON object (brace-counting that ignores braces inside strings, since
LaTeX is full of them), and retries once naming the missing keys. This was found
by testing against a live endpoint that ignores the parameter.

**Tailwind source scoping.** `@import "tailwindcss" source("../")` limits class
detection to `src/`. Without it Tailwind also scans `.claude/skills/` (which
ships the Tailwind docs) and emits a utility for every class named in them —
338 KB of dead CSS instead of 76 KB.

## Verification status

Typecheck and production build are clean. Verified end to end:

- **Against the live model:** all three modes, notes, practice, streaming chat,
  and table-visual generation. Hint mode was checked for answer leakage — the
  payload contained no final answer anywhere.
- **Against a mock API** (`stop_reason` refusal/`max_tokens`, upstream 401/429/500,
  socket killed mid-stream, malformed JSON): every path produces a specific,
  actionable message rather than a stack trace.
- **114 UI assertions** driving the real React components in jsdom: file upload
  through `FileReader`, mode and depth switching, follow-up streaming assembled
  from 7-byte chunks (frames split mid-JSON and mid-multibyte-character),
  quiz scoring, flashcard navigation, combobox keyboard selection and filtering,
  save/delete/clear persistence, and every error and empty state.
- **Structure:** all 8 pages have one `h1`, no duplicate ids, no heading-level
  skips, and a skip link; all 19 internal links and assets return 200.

Screenshots were reviewed at desktop and mobile widths in both light and dark
mode. Dark mode re-points the design tokens rather than inverting them, and the
chart palette has separate light/dark steps, each validated for colour-blind
separation and contrast against its own surface.
