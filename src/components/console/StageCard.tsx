/**
 * A single entry inside a stage.
 *
 * `pending` marks a slot that exists in the structure but has no content yet —
 * shown deliberately rather than hidden, so the shape of the section is legible
 * while it fills up.
 */
export function StageCard({
  index,
  name,
  action,
  meta,
  pending = false,
}: {
  index: number;
  name: string;
  action: string;
  meta?: string;
  pending?: boolean;
}) {
  return (
    <article className="grid min-h-[9.5rem] content-between gap-4 rounded-sm border border-edge-soft bg-surface/60 p-4 transition-[border-color,background,transform] duration-200 ease-snap hover:-translate-y-[3px] hover:border-blue-deep hover:bg-surface-lift/80">
      <span className="font-mono text-[0.62rem] tracking-[0.14em] text-edge uppercase">
        Slot {String(index + 1).padStart(2, "0")}
      </span>
      <span
        className={
          pending
            ? "text-[1.05rem] font-light tracking-tight text-ink-faint"
            : "text-[1.05rem] font-normal tracking-tight text-ink"
        }
      >
        {name}
      </span>
      <span className="flex items-center justify-between gap-3">
        <span className="font-mono text-[0.64rem] tracking-[0.12em] text-blue-lit uppercase">
          {action} →
        </span>
        {meta ? (
          <span className="font-mono text-[0.64rem] text-ink-faint tabular-nums">
            {meta}
          </span>
        ) : null}
      </span>
    </article>
  );
}
