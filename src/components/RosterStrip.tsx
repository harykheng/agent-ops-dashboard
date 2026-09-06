import type { Agent } from "../types";
import { ROLE_LABEL } from "../data/feed";
import { since } from "../lib/format";
import { StatusPill, Initial } from "./ui";

/**
 * Bottom strip: one compact card per agent. Clicking a card selects that agent
 * everywhere in the command center and deep-links into the Workers tab.
 */
export function RosterStrip({
  agents,
  selectedId,
  now,
  onSelect,
}: {
  agents: Agent[];
  selectedId: string;
  now: number;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex h-full items-stretch divide-x divide-line border-t border-line bg-panel">
      {agents.map((agent) => {
        const selected = agent.id === selectedId;
        return (
          <button
            key={agent.id}
            type="button"
            onClick={() => onSelect(agent.id)}
            aria-pressed={selected}
            className={`flex min-w-0 flex-1 flex-col justify-center gap-1.5 px-3 py-2 text-left transition-colors ${
              selected ? "bg-bg" : "hover:bg-bg/60"
            }`}
          >
            <div className="flex items-center gap-2">
              <Initial name={agent.name} status={agent.status} />
              <div className="min-w-0">
                <div className="truncate text-[13px] leading-tight text-ink">{agent.name}</div>
                <div className="truncate text-[11px] leading-tight text-ink-dim">{ROLE_LABEL[agent.role]}</div>
              </div>
              <div className="ml-auto flex shrink-0 items-center gap-2">
                <span className="text-[10px] text-ink-dim">{since(agent.updatedAt, now)}</span>
                <StatusPill status={agent.status} />
              </div>
            </div>
            <div className="truncate text-[11px] text-ink-dim">{agent.task}</div>
            {selected && <div className="h-[2px] w-full bg-ink/70" />}
          </button>
        );
      })}
    </div>
  );
}
