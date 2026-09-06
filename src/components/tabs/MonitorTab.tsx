import type { TabProps } from "./types";
import { ROLE_LABEL } from "../../data/feed";
import { since } from "../../lib/format";
import { statusBg } from "../../lib/status";
import { StatusPill, Label } from "../ui";

/** Monitor — one glance answers "is everything moving". */
export function MonitorTab({ feed, selectedId, onSelect }: TabProps) {
  return (
    <div className="h-full overflow-y-auto p-3">
      <div className="grid grid-cols-1 border-t border-l border-line lg:grid-cols-2">
        {feed.agents.map((agent) => {
          const stale = feed.now - agent.updatedAt > 20_000;
          const last = agent.logs[agent.logs.length - 1];
          return (
            <button
              key={agent.id}
              type="button"
              onClick={() => onSelect(agent.id)}
              className={`flex flex-col gap-2 border-r border-b border-line p-3 text-left ${
                agent.id === selectedId ? "bg-bg" : "bg-panel hover:bg-bg/60"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 ${statusBg(agent.status)}`} />
                <span className="text-[13px] text-ink">{agent.name}</span>
                <span className="text-[11px] text-ink-dim">{ROLE_LABEL[agent.role]}</span>
                <span className="ml-auto">
                  <StatusPill status={agent.status} />
                </span>
              </div>
              <div className="text-[12px] text-ink">{agent.task}</div>
              <div className="flex items-baseline gap-2">
                <Label>last update</Label>
                <span className={`font-mono text-[11px] ${stale ? "text-st-blocked" : "text-ink-dim"}`}>
                  {since(agent.updatedAt, feed.now)} ago
                </span>
              </div>
              {last && (
                <div className="truncate border-t border-line pt-2 font-mono text-[11px] text-ink-dim">
                  {last.text}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
