import { useMemo } from 'react';
import katex from 'katex';

interface Props {
  /** KaTeX source, without surrounding dollar signs. */
  tex: string;
  display?: boolean;
  className?: string;
}

/**
 * Renders KaTeX. On malformed input it falls back to showing the raw source in
 * a mono font rather than throwing — a bad formula shouldn't blank the answer.
 */
export default function Formula({ tex, display = true, className = '' }: Props) {
  const { html, failed } = useMemo(() => {
    try {
      return {
        html: katex.renderToString(tex, {
          displayMode: display,
          throwOnError: false,
          strict: false,
          trust: false,
        }),
        failed: false,
      };
    } catch {
      return { html: '', failed: true };
    }
  }, [tex, display]);

  if (failed) {
    return (
      <code className={`block rounded-sm bg-sunken px-2 py-1 font-mono text-sm ${className}`}>
        {tex}
      </code>
    );
  }

  return (
    <span
      className={className}
      // KaTeX output; input is model-generated with trust:false so no \href or
      // \includegraphics can be injected.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
