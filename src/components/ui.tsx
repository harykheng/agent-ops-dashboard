import type { ReactNode } from "react";
import type { AgentStatus } from "../types";
import { statusBg, statusText } from "../lib/status";

/** Small caps label used for column headers and field names. */
export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`text-[10px] uppercase tracking-[0.12em] text-ink-dim ${className}`}>{children}</span>
  );
}

export function StatusPill({ status, label }: { status: AgentStatus; label?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 border border-line px-1.5 py-[1px] text-[10px] uppercase tracking-[0.1em] ${statusText(status)}`}
    >
      <span className={`h-[5px] w-[5px] ${statusBg(status)}`} />
      {label ?? status}
    </span>
  );
}

/** Square initial tile standing in for an avatar. */
export function Initial({ name, status, size = 26 }: { name: string; status: AgentStatus; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center border border-line bg-bg text-[11px] font-medium text-ink"
      style={{ width: size, height: size }}
    >
      {name.slice(0, 1).toUpperCase()}
      <span className={`ml-[3px] h-[5px] w-[5px] self-start ${statusBg(status)}`} />
    </span>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`border border-line bg-panel ${className}`}>{children}</div>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <div className="border-b border-line px-3 py-1.5">
    <Label>{children}</Label>
  </div>;
}
