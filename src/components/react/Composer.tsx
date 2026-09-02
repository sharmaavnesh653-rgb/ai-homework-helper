import { useEffect, useRef, useState } from 'react';
import Combobox, { type Option } from './Combobox';
import {
  GRADES,
  SUBJECTS,
  examplesFor,
  type SubjectId,
} from '../../lib/curriculum';
import {
  ACCEPTED_DOC_TYPES,
  ACCEPTED_IMAGE_TYPES,
  MAX_FILE_BYTES,
  MAX_QUESTION_LENGTH,
  MODES,
  type Attachment,
  type ModeId,
} from '../../lib/types';

export interface PendingFile {
  id: string;
  name: string;
  size: number;
  kind: 'image' | 'pdf';
  /** 'reading' while the FileReader runs, then 'ready' or 'error'. */
  status: 'reading' | 'ready' | 'error';
  error?: string;
  mediaType?: string;
  data?: string;
  previewUrl?: string;
}

const ACCEPT = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_DOC_TYPES].join(',');

interface Props {
  onSubmit: (payload: {
    question: string;
    mode: ModeId;
    subject: SubjectId | null;
    grade: string | null;
    attachments: Attachment[];
  }) => void;
  busy: boolean;
  subject: SubjectId | null;
  setSubject: (s: SubjectId | null) => void;
  grade: string | null;
  setGrade: (g: string | null) => void;
  /** Prefilled question text, e.g. from History "Ask again". */
  initialText?: string | null;
  /** Bump to re-apply the same initialText again. */
  initialTextNonce?: number;
  /** Reported upward so the landing panel can react as the student types. */
  onDraftChange?: (text: string) => void;
  /** Suppressed when the entry gallery below already shows examples. */
  showExamples?: boolean;
  /** Spells out the three input routes on the empty state. */
  showInputHints?: boolean;
}

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Composer({
  onSubmit,
  busy,
  subject,
  setSubject,
  grade,
  setGrade,
  initialText,
  initialTextNonce = 0,
  onDraftChange,
  showExamples = true,
  showInputHints = false,
}: Props) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<ModeId>('guide');
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialText) {
      setText(initialText);
      onDraftChange?.(initialText);
    }
    // initialTextNonce lets the same question be re-applied on a second pick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialText, initialTextNonce]);

  const write = (value: string) => {
    setText(value);
    onDraftChange?.(value);
  };

  const subjectOptions: Option[] = SUBJECTS.map((s) => ({
    value: s.id,
    label: s.name,
    hint: undefined,
    dot: `var(--color-${s.hue})`,
  }));

  const gradeOptions: Option[] = GRADES.map((g) => ({ value: g, label: g }));

  const readFile = (file: File) => {
    const id = `${file.name}-${file.size}-${Date.now()}`;
    const isImage = (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type);
    const isDoc = (ACCEPTED_DOC_TYPES as readonly string[]).includes(file.type);

    if (!isImage && !isDoc) {
      setNotice(`"${file.name}" isn't a supported type. Use PNG, JPEG, WebP, GIF or PDF.`);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setNotice(`"${file.name}" is ${humanSize(file.size)} — the limit is 4 MB.`);
      return;
    }

    const entry: PendingFile = {
      id,
      name: file.name,
      size: file.size,
      kind: isImage ? 'image' : 'pdf',
      status: 'reading',
      previewUrl: isImage ? URL.createObjectURL(file) : undefined,
    };
    setFiles((prev) => [...prev, entry]);

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      const base64 = result.slice(result.indexOf(',') + 1);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, status: 'ready', data: base64, mediaType: file.type } : f,
        ),
      );
    };
    reader.onerror = () => {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, status: 'error', error: 'Could not read this file' } : f,
        ),
      );
    };
    reader.readAsDataURL(file);
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setNotice(null);
    const room = 4 - files.length;
    if (room <= 0) {
      setNotice('You can attach up to 4 files at a time.');
      return;
    }
    Array.from(list).slice(0, room).forEach(readFile);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  const ready = files.filter((f) => f.status === 'ready');
  const stillReading = files.some((f) => f.status === 'reading');
  const canSend = !busy && !stillReading && (text.trim().length > 0 || ready.length > 0);

  const submit = () => {
    if (!canSend) return;
    onSubmit({
      question: text.trim(),
      mode,
      subject,
      grade,
      attachments: ready.map((f) => ({
        kind: f.kind,
        mediaType: f.mediaType!,
        data: f.data!,
        name: f.name,
      })),
    });
    write('');
    files.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
    setFiles([]);
  };

  const examples = examplesFor(subject).slice(0, 4);

  return (
    <div className="space-y-4">
      {/* Selectors */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Combobox
          label="Subject"
          options={subjectOptions}
          value={subject}
          onChange={(v) => setSubject(v as SubjectId | null)}
          placeholder="Any subject"
          clearable
        />
        <Combobox
          label="Class / level"
          options={gradeOptions}
          value={grade}
          onChange={setGrade}
          placeholder="Any level"
          clearable
        />
      </div>

      {/* The three routes in, spelled out on the empty state */}
      {showInputHints && (
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex min-h-[2.25rem] items-center gap-1.5 rounded-lg border border-brand/25 bg-brand-soft px-3 py-1.5 text-[13px] font-medium text-brand">
            <span aria-hidden="true">⌨</span> Type or paste it
          </span>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="inline-flex min-h-[2.25rem] items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-[13px] font-medium text-ink-2 transition-all duration-150 hover:-translate-y-0.5 hover:border-brand/40 hover:text-brand hover:shadow-e1"
          >
            <span aria-hidden="true">📷</span> Photo of the page
          </button>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="inline-flex min-h-[2.25rem] items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-[13px] font-medium text-ink-2 transition-all duration-150 hover:-translate-y-0.5 hover:border-brand/40 hover:text-brand hover:shadow-e1"
          >
            <span aria-hidden="true">📄</span> PDF worksheet
          </button>
        </div>
      )}

      {/* Input surface */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`rounded-xl border bg-surface shadow-e1 transition-all duration-200 ${
          dragging
            ? 'border-brand ring-4 ring-brand-ring'
            : 'border-line focus-within:border-brand focus-within:ring-4 focus-within:ring-brand-ring'
        }`}
      >
        <label htmlFor="question" className="sr-only">
          Your question
        </label>
        <textarea
          id="question"
          value={text}
          onChange={(e) => write(e.target.value)}
          onPaste={(e) => {
            const imgs = Array.from(e.clipboardData.files).filter((f) =>
              f.type.startsWith('image/'),
            );
            if (imgs.length) {
              e.preventDefault();
              addFiles(e.clipboardData.files);
            }
          }}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
          rows={4}
          maxLength={MAX_QUESTION_LENGTH}
          placeholder="Type or paste your question — or drop a photo of the problem here."
          className="w-full resize-y bg-transparent px-4 pt-4 text-[15px] leading-relaxed outline-none placeholder:text-ink-3"
        />

        {/* Attachment tray */}
        {files.length > 0 && (
          <ul className="flex flex-wrap gap-2 px-4 pb-1">
            {files.map((f) => (
              <li
                key={f.id}
                className="animate-fade group relative flex items-center gap-2.5 rounded-lg border border-line bg-canvas py-1.5 pr-2 pl-2"
              >
                {f.previewUrl ? (
                  <img
                    src={f.previewUrl}
                    alt=""
                    className="h-9 w-9 rounded object-cover"
                  />
                ) : (
                  <span
                    className="grid h-9 w-9 place-items-center rounded bg-sunken text-[10px] font-semibold text-ink-2"
                    aria-hidden="true"
                  >
                    PDF
                  </span>
                )}

                <span className="max-w-[9rem] min-w-0">
                  <span className="block truncate text-xs font-medium text-ink">
                    {f.name}
                  </span>
                  <span className="block text-[11px] text-ink-3">
                    {f.status === 'reading' && (
                      <span className="inline-flex items-center gap-1">
                        <span className="h-1 w-8 overflow-hidden rounded-full bg-line">
                          <span
                            className="block h-full w-1/3 rounded-full bg-brand"
                            style={{ animation: 'sweep 1s linear infinite' }}
                          />
                        </span>
                        reading
                      </span>
                    )}
                    {f.status === 'ready' && humanSize(f.size)}
                    {f.status === 'error' && (
                      <span className="text-danger">{f.error}</span>
                    )}
                  </span>
                </span>

                <button
                  type="button"
                  onClick={() => removeFile(f.id)}
                  aria-label={`Remove ${f.name}`}
                  className="ml-0.5 grid h-5 w-5 place-items-center rounded-full text-ink-3 transition-colors hover:bg-danger-soft hover:text-danger"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-t border-line px-3 py-2.5">
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPT}
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-ink-2 transition-colors hover:bg-sunken hover:text-ink"
          >
            <span aria-hidden="true">📎</span> Attach
          </button>

          {/* Mode segmented control */}
          <div
            className="flex rounded-lg bg-sunken p-0.5"
            role="radiogroup"
            aria-label="How much help"
          >
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={mode === m.id}
                title={m.blurb}
                onClick={() => setMode(m.id)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-150 ${
                  mode === m.id
                    ? 'bg-surface text-ink shadow-e1'
                    : 'text-ink-3 hover:text-ink-2'
                }`}
              >
                {m.short}
              </button>
            ))}
          </div>

          <span className="ml-auto hidden text-xs text-ink-3 sm:block">
            {text.length > MAX_QUESTION_LENGTH - 400 &&
              `${MAX_QUESTION_LENGTH - text.length} left · `}
            ⌘↵
          </span>

          <button
            type="button"
            onClick={submit}
            disabled={!canSend}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-all duration-150 hover:bg-brand-hover active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45"
          >
            {busy ? 'Working…' : stillReading ? 'Reading file…' : 'Explain it'}
          </button>
        </div>
      </div>

      {notice && (
        <p className="animate-fade rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm text-danger" role="alert">
          {notice}
        </p>
      )}

      {/* Example starters */}
      {showExamples && examples.length > 0 && (
        <div className="space-y-2">
          <p className="text-overline text-ink-3 uppercase">Try an example</p>
          <div className="flex flex-wrap gap-2">
            {examples.map((ex) => (
              <button
                key={ex.question}
                type="button"
                onClick={() => write(ex.question)}
                className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-2 transition-all hover:border-brand/40 hover:bg-brand-soft hover:text-brand"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
