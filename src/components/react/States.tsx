/** Loading, empty and state primitives shared across workspaces. */

export function SkeletonLine({ w = '100%' }: { w?: string }) {
  return (
    <div className="skeleton h-3.5" style={{ width: w }}>
      <div className="skeleton-sheen" />
    </div>
  );
}

export function SkeletonBlock({ h = '5rem' }: { h?: string }) {
  return (
    <div className="skeleton w-full" style={{ height: h }}>
      <div className="skeleton-sheen" />
    </div>
  );
}

/** Mirrors the shape of an answer card so the layout doesn't jump on arrival. */
export function AnswerSkeleton() {
  return (
    <div
      className="animate-fade space-y-6 rounded-xl border border-line bg-surface p-5 shadow-e1 sm:p-6"
      aria-hidden="true"
    >
      <div className="space-y-2">
        <SkeletonLine w="34%" />
        <SkeletonLine w="88%" />
      </div>

      <div className="space-y-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-3.5">
            <div className="skeleton h-7 w-7 shrink-0 rounded-full">
              <div className="skeleton-sheen" />
            </div>
            <div className="flex-1 space-y-2 pt-1">
              <SkeletonLine w={['52%', '46%', '58%'][i]} />
              <SkeletonLine />
              <SkeletonLine w="72%" />
              {i === 1 && <SkeletonBlock h="3rem" />}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <SkeletonLine w="28%" />
        <SkeletonLine w="22%" />
      </div>
    </div>
  );
}

export function TypingDots({ label = 'Tutor is thinking' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2.5" role="status" aria-live="polite">
      <span className="flex gap-1" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-brand"
            style={{ animation: `blink 1.25s ${i * 0.16}s infinite ease-in-out` }}
          />
        ))}
      </span>
      <span className="text-sm text-ink-3">{label}</span>
    </div>
  );
}

export function ErrorNote({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="animate-rise flex flex-col gap-3 rounded-lg border border-danger/25 bg-danger-soft p-4 sm:flex-row sm:items-center sm:justify-between"
      role="alert"
    >
      <p className="text-sm leading-relaxed text-danger">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 rounded-md border border-danger/30 px-3 py-1.5 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  glyph,
  title,
  body,
  children,
}: {
  glyph: string;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="animate-fade flex flex-col items-center rounded-xl border border-dashed border-line-strong bg-surface/60 px-6 py-14 text-center">
      <span
        className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-xl text-brand"
        aria-hidden="true"
      >
        {glyph}
      </span>
      <h3 className="text-h3 text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-2">{body}</p>
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
