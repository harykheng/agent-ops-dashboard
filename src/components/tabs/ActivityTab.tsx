import type { ActivityKind } from "../../types";
import type { TabProps } from "./types";
import { clock } from "../../lib/format";
import { Label } from "../ui";

const KIND_LABEL: Record<ActivityKind, string> = {
  status_change: "status",
  handoff: "handoff",
  completion: "done",
};

const KIND_CLASS: Record<ActivityKind, string> = {
  status_change: "text-ink-dim",
  handoff: "text-st-blocked",
  completion: "text-st-done",
};

/** Activity — the flat audit trail. Newest first, every agent, every event. */
export function ActivityTab({ feed, selectedId, onSelect }: TabProps) {
  const nameOf = (id: string) => feed.agents.find((a) => a.id === id)?.name ?? id;
  const events = [...feed.activity].reverse();

  return (
    <div className="h-full overflow-y-auto">
      <div className="grid grid-cols-[74px_84px_70px_minmax(0,1fr)] gap-x-3 border-b border-line px-3 py-1.5">
        <Label>time</Label>
        <Label>agent</Label>
        <Label>kind</Label>
        <Label>event</Label>
      </div>
      {events.map((event) => (
        <button
          key={event.id}
          type="button"
          onClick={() => onSelect(event.agentId)}
          className={`grid w-full grid-cols-[74px_84px_70px_minmax(0,1fr)] gap-x-3 border-b border-line px-3 py-1.5 text-left hover:bg-bg/60 ${
            event.agentId === selectedId ? "bg-bg" : ""
          }`}
        >
          <span className="font-mono text-[11px] text-ink-dim/70">{clock(event.time)}</span>
          <span className="truncate text-[12px] text-ink-dim">{nameOf(event.agentId)}</span>
          <span className={`text-[10px] uppercase tracking-[0.1em] ${KIND_CLASS[event.kind]}`}>
            {KIND_LABEL[event.kind]}
          </span>
          <span className="truncate text-[12px] text-ink">{event.text}</span>
        </button>
      ))}
    </div>
  );
}
