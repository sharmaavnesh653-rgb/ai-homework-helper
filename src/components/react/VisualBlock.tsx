import { useId, useMemo, useState } from 'react';
import type { ChartViz, ConceptMapViz, LabelledViz, TableViz, Visual } from '../../lib/types';

/* Fixed series order — never cycled. Tokens are validated per mode. */
const SERIES = [
  'var(--color-series-1)',
  'var(--color-series-2)',
  'var(--color-series-3)',
  'var(--color-series-4)',
];

function Figure({
  caption,
  children,
  aside,
}: {
  caption?: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <figure className="space-y-2.5">
      <div className="rounded-lg border border-line bg-surface p-3.5 sm:p-4">{children}</div>
      {(caption || aside) && (
        <figcaption className="flex items-start justify-between gap-3 text-xs leading-relaxed text-ink-3">
          <span>{caption}</span>
          {aside}
        </figcaption>
      )}
    </figure>
  );
}

/* ------------------------------- table ------------------------------- */

function TableView({ viz }: { viz: TableViz }) {
  return (
    <Figure caption={viz.caption}>
      <div className="scroll-slim -mx-1 overflow-x-auto px-1">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {viz.columns.map((c) => (
                <th
                  key={c}
                  scope="col"
                  className="border-b border-line-strong px-2.5 py-2 text-left text-overline text-ink-3 uppercase"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {viz.rows.map((row, i) => (
              <tr key={i} className="even:bg-sunken/50">
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className={`border-b border-line px-2.5 py-2 align-top ${
                      j === 0 ? 'font-medium text-ink' : 'text-ink-2'
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Figure>
  );
}

/* ------------------------------- chart ------------------------------- */

const PAD = { top: 12, right: 14, bottom: 30, left: 40 };
const W = 520;
const H = 240;

function niceTicks(min: number, max: number, count = 4): number[] {
  if (min === max) return [min];
  const span = max - min;
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? mag * 10;
  const start = Math.floor(min / step) * step;
  const out: number[] = [];
  for (let v = start; v <= max + step / 2; v += step) out.push(Number(v.toFixed(10)));
  return out;
}

function ChartView({ viz }: { viz: ChartViz }) {
  const titleId = useId();
  const [hover, setHover] = useState<{
    x: number;
    y: number;
    label: string;
  } | null>(null);
  const [showData, setShowData] = useState(false);

  const series = viz.series.slice(0, 4).filter((s) => s.points?.length);
  const all = series.flatMap((s) => s.points);
  const isBar = viz.chartType === 'bar';

  const scale = useMemo(() => {
    if (!all.length) return null;
    const xs = all.map((p) => p.x);
    const ys = all.map((p) => p.y);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    // Bars sit on a zero baseline; lines/scatter may float.
    const yMin = isBar ? Math.min(0, ...ys) : Math.min(...ys);
    const yMax = Math.max(...ys);
    const yTicks = niceTicks(yMin, yMax);
    const yLo = Math.min(yMin, yTicks[0]);
    const yHi = Math.max(yMax, yTicks[yTicks.length - 1]);

    const plotW = W - PAD.left - PAD.right;

    /*
      Bars use a band scale: categories are inset by half a band so the first
      and last bar stay inside the plot instead of straddling the y-axis and
      covering its tick labels. Lines and scatter keep a plain linear scale.
    */
    const categories = [...new Set(xs)].sort((a, b) => a - b);
    const band = plotW / Math.max(categories.length, 1);
    const bandCentre = (i: number) => PAD.left + band * (i + 0.5);

    const px = (x: number) =>
      xMax === xMin
        ? PAD.left + plotW / 2
        : PAD.left + ((x - xMin) / (xMax - xMin)) * plotW;

    const py = (y: number) =>
      yHi === yLo
        ? H - PAD.bottom
        : H - PAD.bottom - ((y - yLo) / (yHi - yLo)) * (H - PAD.top - PAD.bottom);

    return { px, py, xMin, xMax, yLo, yHi, yTicks, categories, band, bandCentre };
  }, [all, isBar]);

  if (!scale || !series.length) return null;

  const { px, py, yTicks, categories, band, bandCentre } = scale;
  const multi = series.length > 1;
  // Thin out category labels so they never collide.
  const labelEvery = Math.ceil(categories.length / 8);

  return (
    <Figure
      caption={viz.caption}
      aside={
        <button
          type="button"
          onClick={() => setShowData((v) => !v)}
          className="shrink-0 rounded border border-line px-2 py-0.5 text-xs text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
          aria-expanded={showData}
        >
          {showData ? 'Hide data' : 'Show data'}
        </button>
      }
    >
      {/* Legend: present whenever there are 2+ series, so identity is never colour-alone */}
      {multi && (
        <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {series.map((s, i) => (
            <li key={s.name} className="flex items-center gap-1.5 text-xs text-ink-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: SERIES[i] }}
                aria-hidden="true"
              />
              {s.name}
            </li>
          ))}
        </ul>
      )}

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-labelledby={titleId}
        onMouseLeave={() => setHover(null)}
      >
        {/* Single string: <title> children must not be an array. */}
        <title id={titleId}>
          {`${viz.caption ?? `${viz.chartType} chart`}${viz.yLabel ? ` — ${viz.yLabel}` : ''}`}
        </title>

        {/* Recessive gridlines + y ticks */}
        {yTicks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={py(t)}
              y2={py(t)}
              stroke="var(--color-line)"
              strokeWidth="1"
            />
            <text
              x={PAD.left - 7}
              y={py(t)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="10"
              fill="var(--color-ink-3)"
            >
              {t}
            </text>
          </g>
        ))}

        {/* Axis lines, deliberately quiet */}
        <line
          x1={PAD.left}
          x2={PAD.left}
          y1={PAD.top}
          y2={H - PAD.bottom}
          stroke="var(--color-line-strong)"
          strokeWidth="1"
        />
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={H - PAD.bottom}
          y2={H - PAD.bottom}
          stroke="var(--color-line-strong)"
          strokeWidth="1"
        />

        {isBar && (
          <>
            {/* Category labels under each band */}
            {categories.map((c, i) =>
              i % labelEvery === 0 ? (
                <text
                  key={`cat-${c}`}
                  x={bandCentre(i)}
                  y={H - PAD.bottom + 14}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--color-ink-3)"
                >
                  {c}
                </text>
              ) : null,
            )}

            {series.map((s, si) => {
              const n = series.length;
              // Leave ~30% of the band as breathing room between groups.
              const bw = Math.max(5, Math.min(38, (band * 0.7) / n));
              return s.points.map((p, i) => {
                const ci = categories.indexOf(p.x);
                if (ci === -1) return null;
                const groupLeft = bandCentre(ci) - (n * bw + (n - 1) * 2) / 2;
                const x = groupLeft + si * (bw + 2);
                const top = py(Math.max(p.y, 0));
                const base = py(0);
                const h = Math.max(2, Math.abs(base - top));
                return (
                  <rect
                    key={`${si}-${i}`}
                    x={x}
                    y={Math.min(top, base)}
                    width={bw}
                    height={h}
                    rx="4"
                    fill={SERIES[si]}
                    /* 2px surface gap between adjacent fills */
                    stroke="var(--color-surface)"
                    strokeWidth="2"
                    onMouseEnter={() =>
                      setHover({
                        x: x + bw / 2,
                        y: Math.min(top, base),
                        label: `${multi ? s.name + ' — ' : ''}${p.x}: ${p.y}`,
                      })
                    }
                  />
                );
              });
            })}
          </>
        )}

        {!isBar && viz.chartType === 'line' &&
          series.map((s, si) => {
            const pts = [...s.points].sort((a, b) => a.x - b.x);
            const d = pts.map((p, i) => `${i ? 'L' : 'M'}${px(p.x)},${py(p.y)}`).join(' ');
            return (
              <g key={si}>
                <path d={d} fill="none" stroke={SERIES[si]} strokeWidth="2" strokeLinecap="round" />
                {pts.map((p, i) => (
                  <circle
                    key={i}
                    cx={px(p.x)}
                    cy={py(p.y)}
                    r="4.5"
                    fill={SERIES[si]}
                    stroke="var(--color-surface)"
                    strokeWidth="2"
                    onMouseEnter={() =>
                      setHover({
                        x: px(p.x),
                        y: py(p.y),
                        label: `${multi ? s.name + ' — ' : ''}${p.x}: ${p.y}`,
                      })
                    }
                  />
                ))}
              </g>
            );
          })}

        {!isBar && viz.chartType === 'scatter' &&
          series.map((s, si) =>
            s.points.map((p, i) => (
              <circle
                key={`${si}-${i}`}
                cx={px(p.x)}
                cy={py(p.y)}
                r="5"
                fill={SERIES[si]}
                stroke="var(--color-surface)"
                strokeWidth="2"
                onMouseEnter={() =>
                  setHover({
                    x: px(p.x),
                    y: py(p.y),
                    label: `${multi ? s.name + ' — ' : ''}${p.x}: ${p.y}`,
                  })
                }
              />
            )),
          )}

        {/* Axis labels in ink tokens, never series colour */}
        {viz.xLabel && (
          <text
            x={(PAD.left + W - PAD.right) / 2}
            y={H - 6}
            textAnchor="middle"
            fontSize="10.5"
            fill="var(--color-ink-3)"
          >
            {viz.xLabel}
          </text>
        )}
        {viz.yLabel && (
          <text
            x={11}
            y={(PAD.top + H - PAD.bottom) / 2}
            textAnchor="middle"
            fontSize="10.5"
            fill="var(--color-ink-3)"
            transform={`rotate(-90 11 ${(PAD.top + H - PAD.bottom) / 2})`}
          >
            {viz.yLabel}
          </text>
        )}

        {hover && (
          <g pointerEvents="none">
            <rect
              x={Math.min(Math.max(hover.x - 62, 2), W - 126)}
              y={Math.max(hover.y - 30, 2)}
              width="124"
              height="22"
              rx="5"
              fill="var(--color-ink)"
              opacity="0.94"
            />
            <text
              x={Math.min(Math.max(hover.x - 62, 2), W - 126) + 62}
              y={Math.max(hover.y - 30, 2) + 15}
              textAnchor="middle"
              fontSize="10.5"
              fill="var(--color-canvas)"
            >
              {hover.label.length > 22 ? hover.label.slice(0, 21) + '…' : hover.label}
            </text>
          </g>
        )}
      </svg>

      {/* Table view of the same numbers — the accessible fallback */}
      {showData && (
        <div className="scroll-slim mt-3 overflow-x-auto border-t border-line pt-3">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th scope="col" className="py-1 pr-3 text-left text-overline text-ink-3 uppercase">
                  {viz.xLabel ?? 'x'}
                </th>
                {series.map((s) => (
                  <th
                    key={s.name}
                    scope="col"
                    className="py-1 pr-3 text-left text-overline text-ink-3 uppercase"
                  >
                    {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...new Set(all.map((p) => p.x))]
                .sort((a, b) => a - b)
                .map((x) => (
                  <tr key={x}>
                    <td className="py-1 pr-3 font-medium text-ink">{x}</td>
                    {series.map((s) => (
                      <td key={s.name} className="py-1 pr-3 text-ink-2">
                        {s.points.find((p) => p.x === x)?.y ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </Figure>
  );
}

/* ---------------------------- concept map & mindmap ---------------------------- */

function ConceptMapView({ viz }: { viz: ConceptMapViz }) {
  const nodes = viz.nodes.slice(0, 10);
  const cx = 260;
  const cy = 130;
  const r = 95;

  const pos = new Map(
    nodes.map((n, i) => {
      if (nodes.length === 1) return [n.id, { x: cx, y: cy }] as const;
      if (i === 0) return [n.id, { x: cx, y: cy }] as const; // Center root node
      const angle = ((i - 1) / (nodes.length - 1)) * Math.PI * 2 - Math.PI / 2;
      return [n.id, { x: cx + Math.cos(angle) * r * 2.1, y: cy + Math.sin(angle) * r * 0.95 }] as const;
    }),
  );

  return (
    <Figure caption={viz.caption}>
      <div className="relative overflow-hidden rounded-xl bg-sunken/40 p-2">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-ink-3 px-2">
          <span>🧠 Concept & MindMap Diagram</span>
          <span className="text-brand font-mono text-[11px]">{nodes.length} Nodes</span>
        </div>
        <svg viewBox="0 0 520 260" className="h-auto w-full filter drop-shadow-sm" role="img">
          <title>{viz.caption ?? 'Concept Map'}</title>
          <defs>
            <linearGradient id="nodeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--color-brand-soft)" />
              <stop offset="100%" stopColor="var(--color-surface)" />
            </linearGradient>
            <linearGradient id="rootGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--color-brand)" />
              <stop offset="100%" stopColor="var(--color-brand-hover)" />
            </linearGradient>
          </defs>

          {/* Links / Connections */}
          {viz.links.map((l, i) => {
            const a = pos.get(l.from);
            const b = pos.get(l.to);
            if (!a || !b) return null;
            const midX = (a.x + b.x) / 2;
            const midY = (a.y + b.y) / 2;
            return (
              <g key={i} className="transition-all duration-300">
                <path
                  d={`M ${a.x} ${a.y} Q ${midX} ${midY - 10} ${b.x} ${b.y}`}
                  fill="none"
                  stroke="var(--color-brand)"
                  strokeWidth="1.75"
                  strokeDasharray="4 2"
                  opacity="0.6"
                />
                {l.label && (
                  <g>
                    <rect
                      x={midX - (l.label.length * 3 + 6)}
                      y={midY - 14}
                      width={l.label.length * 6 + 12}
                      height="16"
                      rx="4"
                      fill="var(--color-surface)"
                      stroke="var(--color-line)"
                      strokeWidth="1"
                    />
                    <text
                      x={midX}
                      y={midY - 3}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="600"
                      fill="var(--color-brand)"
                    >
                      {l.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((n, i) => {
            const p = pos.get(n.id)!;
            const isRoot = i === 0;
            const w = Math.min(140, Math.max(60, n.label.length * 7.5 + 20));
            const h = isRoot ? 36 : 30;

            return (
              <g key={n.id} className="transition-transform duration-200 hover:scale-105 cursor-pointer">
                <rect
                  x={p.x - w / 2}
                  y={p.y - h / 2}
                  width={w}
                  height={h}
                  rx={isRoot ? '10' : '8'}
                  fill={isRoot ? 'url(#rootGrad)' : 'url(#nodeGrad)'}
                  stroke={isRoot ? 'var(--color-brand)' : 'var(--color-line-strong)'}
                  strokeWidth={isRoot ? '2' : '1.25'}
                  className="shadow-sm"
                />
                <text
                  x={p.x}
                  y={p.y + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={isRoot ? '12' : '11'}
                  fontWeight={isRoot ? '700' : '600'}
                  fill={isRoot ? '#ffffff' : 'var(--color-ink)'}
                >
                  {n.label.length > 18 ? n.label.slice(0, 17) + '…' : n.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </Figure>
  );
}

/* ------------------------- labelled diagram ------------------------- */

function LabelledView({ viz }: { viz: LabelledViz }) {
  return (
    <Figure caption={viz.caption}>
      <p className="mb-3 text-overline text-ink-3 uppercase">{viz.subject}</p>
      <ol className="space-y-2.5">
        {viz.parts.map((part, i) => (
          <li key={i} className="flex gap-3">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand text-[11px] font-semibold text-white">
              {i + 1}
            </span>
            <p className="text-sm leading-relaxed text-ink-2">
              <span className="font-semibold text-ink">{part.label}</span> — {part.describes}
            </p>
          </li>
        ))}
      </ol>
    </Figure>
  );
}

export default function VisualBlock({ visual }: { visual: Visual | null | undefined }) {
  if (!visual) return null;
  switch (visual.kind) {
    case 'table':
      return <TableView viz={visual} />;
    case 'chart':
      return <ChartView viz={visual} />;
    case 'concept-map':
      return <ConceptMapView viz={visual} />;
    case 'labelled':
      return <LabelledView viz={visual} />;
    default:
      return null;
  }
}
