import { useEffect, useMemo, useRef, useState } from "react";
import type { LogKind } from "../../types";
import type { TabProps } from "./types";
import { clock } from "../../lib/format";
import { logText } from "../../lib/status";

interface Line {
  key: string;
  time: string;
  speaker: string;
  target?: string;
  text: string;
  kind: LogKind;
  agentId: string;
}

/**
 * Terminal — the narrative view. Agent logs and handoffs merged into one
 * chronological transcript so it reads as a conversation rather than a
 * status board. Auto-scrolls unless the operator has scrolled up to read.
 */
export function TerminalTab({ feed, selectedId }: TabProps) {
  const [onlySelected, setOnlySelected] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);

  const lines = useMemo<Line[]>(() => {
    const byId = new Map(feed.agents.map((a) => [a.id, a]));
    const out: Line[] = [];

    for (const agent of feed.agents) {
      agent.logs.forEach((log, i) => {
        out.push({
          key: `${agent.id}-${i}-${log.time}`,
          time: log.time,
          speaker: agent.name,
          text: log.text,
          kind: log.kind,
          agentId: agent.id,
        });
      });
    }
    for (const handoff of feed.handoffs) {
      out.push({
        key: handoff.id,
        time: handoff.time,
        speaker: byId.get(handoff.from)?.name ?? handoff.from,
        target: byId.get(handoff.to)?.name ?? handoff.to,
        text: handoff.text,
        kind: handoff.resolved ? "done" : "warn",
        agentId: handoff.from,
      });
    }
    return out.sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
  }, [feed.agents, feed.handoffs]);

  const visible = onlySelected ? lines.filter((l) => l.agentId === selectedId) : lines;

  useEffect(() => {
    const el = scroller.current;
    if (el && pinned.current) el.scrollTop = el.scrollHeight;
  }, [visible.length]);

  const selectedName = feed.agents.find((a) => a.id === selectedId)?.name ?? "selected";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line px-3 py-1.5">
        <span className="font-mono text-[11px] text-ink-dim">
          {visible.length} lines · live
        </span>
        <button
          type="button"
          onClick={() => setOnlySelected((v) => !v)}
          className={`border px-2 py-[2px] text-[10px] uppercase tracking-[0.1em] ${
            onlySelected ? "border-ink-dim text-ink" : "border-line text-ink-dim hover:text-ink"
          }`}
        >
          only {selectedName}
        </button>
      </div>

      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
        }}
        className="flex-1 overflow-y-auto px-3 py-2 font-mono text-[12px] leading-[1.65]"
      >
        {visible.map((line) => (
          <div key={line.key} className="flex gap-2 whitespace-pre-wrap">
            <span className="shrink-0 text-ink-dim/70">{clock(line.time)}</span>
            <span className="w-[134px] shrink-0 truncate text-ink-dim">
              {line.speaker}
              {line.target ? ` → ${line.target}` : ""}
            </span>
            <span className={logText(line.kind)}>{line.text}</span>
          </div>
        ))}
        {visible.length === 0 && (
          <div className="text-ink-dim">No lines from {selectedName} yet.</div>
        )}
      </div>
    </div>
  );
}
