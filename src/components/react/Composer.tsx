import { useEffect, useRef, useState } from 'react';
import Combobox, { type Option } from './Combobox';
import TypewriterHeading from './TypewriterHeading';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
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
import {
  Sparkles,
  Paperclip,
  FileText,
  Image as ImageIcon,
  HelpCircle,
  Zap,
  Command,
  X,
  AlertCircle,
  Send,
  Upload
} from 'lucide-react';

export interface PendingFile {
  id: string;
  name: string;
  size: number;
  kind: 'image' | 'pdf';
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
  initialText?: string | null;
  initialTextNonce?: number;
  onDraftChange?: (text: string) => void;
  showExamples?: boolean;
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
    <div className="space-y-5">
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

      {/* Hero Typewriter Heading */}
      <div className="pt-2 pb-1">
        <TypewriterHeading />
      </div>

      {/* Input Route Hints */}
      {showInputHints && (
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-emerald-950/80 text-emerald-300 border-emerald-500/30 gap-1 px-3 py-1 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>Type or paste text</span>
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInput.current?.click()}
            className="h-8 gap-1.5 border-zinc-800 bg-zinc-900/60 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <ImageIcon className="h-3.5 w-3.5 text-blue-400" />
            <span>Photo of page</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInput.current?.click()}
            className="h-8 gap-1.5 border-zinc-800 bg-zinc-900/60 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <FileText className="h-3.5 w-3.5 text-purple-400" />
            <span>PDF worksheet</span>
          </Button>
        </div>
      )}

      {/* Elevated Study Card */}
      <Card
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
        className={`border-zinc-800 bg-zinc-900/90 shadow-2xl backdrop-blur-md transition-all duration-200 ${
          dragging ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'focus-within:border-emerald-500/50'
        }`}
      >
        <CardContent className="p-4 space-y-3">
          <Textarea
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
            placeholder="Type or paste your question — or drop a photo/PDF problem here..."
            className="w-full border-0 bg-transparent p-0 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-0 shadow-none resize-y min-h-[100px]"
          />

          {/* Attachments Tray */}
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-800/80">
              {files.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-1.5 text-xs text-zinc-200"
                >
                  {f.previewUrl ? (
                    <img src={f.previewUrl} alt="" className="h-8 w-8 rounded object-cover" />
                  ) : (
                    <div className="grid h-8 w-8 place-items-center rounded bg-zinc-900 text-[10px] font-mono font-bold text-emerald-400">
                      PDF
                    </div>
                  )}

                  <div className="max-w-[120px]">
                    <span className="block truncate font-medium text-zinc-200">{f.name}</span>
                    <span className="block text-[10px] text-zinc-500 font-mono">
                      {f.status === 'ready' && humanSize(f.size)}
                      {f.status === 'reading' && 'Reading...'}
                      {f.status === 'error' && <span className="text-red-400">{f.error}</span>}
                    </span>
                  </div>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeFile(f.id)}
                    className="h-6 w-6 text-zinc-400 hover:text-red-400 hover:bg-zinc-900 rounded-full ml-1"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-wrap items-center justify-between border-t border-zinc-800/80 bg-zinc-950/60 px-4 py-3 gap-3">
          <div className="flex items-center gap-2">
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
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInput.current?.click()}
              className="h-8 gap-1.5 border-zinc-800 bg-zinc-900 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              <Paperclip className="h-3.5 w-3.5 text-emerald-400" />
              <span>Attach File</span>
            </Button>

            {/* Mode selection tabs */}
            <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                    mode === m.id
                      ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title={m.blurb}
                >
                  {m.short}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-zinc-500 font-mono sm:inline-block">
              {text.length > MAX_QUESTION_LENGTH - 400 &&
                `${MAX_QUESTION_LENGTH - text.length} left · `}
              ⌘↵
            </span>

            <Button
              type="button"
              onClick={submit}
              disabled={!canSend}
              className="h-9 gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4"
            >
              <span>{busy ? 'Working...' : stillReading ? 'Reading file...' : 'Explain it'}</span>
              <Send className="h-3.5 w-3.5 ml-0.5" />
            </Button>
          </div>
        </CardFooter>
      </Card>

      {notice && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-950/40 p-3 text-xs font-semibold text-red-300">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Example Starters */}
      {showExamples && examples.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Try an example</p>
          <div className="flex flex-wrap gap-2">
            {examples.map((ex) => (
              <button
                key={ex.question}
                type="button"
                onClick={() => write(ex.question)}
                className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition-all hover:border-emerald-500/50 hover:bg-emerald-950/30 hover:text-emerald-300"
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
