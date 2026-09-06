import type { TabProps } from "./types";
import { ROLE_LABEL } from "../../data/feed";
import { clock, since, uptime } from "../../lib/format";
import { logText } from "../../lib/status";
import { Initial, Label, StatusPill } from "../ui";

function Field({ name, value }: { name: string; value: string }) {
  return (
    <div className="border-b border-line px-3 py-2">
      <Label>{name}</Label>
      <div className="mt-0.5 text-[12px] text-ink">{value}</div>
    </div>
  );
}

/** Workers — the roster with depth. Deep-linked from the bottom strip. */
export function WorkersTab({ feed, selectedId, onSelect }: TabProps) {
  const agent = feed.agents.find((a) => a.id === selectedId) ?? feed.agents[0];
  if (!agent) return null;

  const nameOf = (id: string) => feed.agents.find((a) => a.id === id)?.name ?? id;
  const handoffs = feed.handoffs
    .filter((h) => h.from === agent.id || h.to === agent.id)
    .slice(-6)
    .reverse();
  const tickets = feed.tickets.filter((t) => t.ownerAgentId === agent.id);
  const logs = agent.logs.slice(-14).reverse();

  return (
    <div className="flex h-full min-h-0">
      <div className="w-[150px] shrink-0 overflow-y-auto border-r border-line">
        {feed.agents.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onSelect(a.id)}
            className={`flex w-full items-center gap-2 border-b border-line px-2 py-2 text-left ${
              a.id === agent.id ? "bg-bg" : "hover:bg-bg/60"
            }`}
          >
            <Initial name={a.name} status={a.status} size={22} />
            <div className="min-w-0">
              <div className="truncate text-[12px] text-ink">{a.name}</div>
              <div className="truncate text-[10px] text-ink-dim">{ROLE_LABEL[a.role]}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="min-w-0 flex-1 overflow-y-auto">
        <div className="flex items-center gap-2 border-b border-line px-3 py-2">
          <Initial name={agent.name} status={agent.status} />
          <div>
            <div className="text-[13px] text-ink">{agent.name}</div>
            <div className="text-[11px] text-ink-dim">
              {ROLE_LABEL[agent.role]} · {agent.id}
            </div>
          </div>
          <span className="ml-auto">
            <StatusPill status={agent.status} />
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2">
          <Field name="harness" value={agent.harness} />
          <Field name="uptime" value={uptime(agent.startedAt, feed.now)} />
          <Field name="current task" value={agent.task} />
          <Field name="last update" value={`${since(agent.updatedAt, feed.now)} ago`} />
        </div>

        <div className="border-b border-line px-3 py-1.5">
          <Label>tickets owned</Label>
        </div>
        {tickets.length === 0 && <div className="border-b border-line px-3 py-2 text-[12px] text-ink-dim">None</div>}
        {tickets.map((ticket) => (
          <div key={ticket.id} className="flex items-baseline gap-2 border-b border-line px-3 py-1.5">
            <span className="font-mono text-[11px] text-ink-dim">{ticket.id}</span>
            <span className="min-w-0 flex-1 truncate text-[12px] text-ink">{ticket.title}</span>
            <span className="text-[10px] uppercase tracking-[0.1em] text-ink-dim">
              {ticket.status.replace("_", " ")}
            </span>
          </div>
        ))}

        <div className="border-b border-line px-3 py-1.5">
          <Label>recent handoffs</Label>
        </div>
        {handoffs.length === 0 && <div className="border-b border-line px-3 py-2 text-[12px] text-ink-dim">None</div>}
        {handoffs.map((handoff) => (
          <div key={handoff.id} className="border-b border-line px-3 py-1.5">
            <div className="flex items-baseline gap-2 text-[12px]">
              <span className="font-mono text-[11px] text-ink-dim/70">{clock(handoff.time)}</span>
              <span className="text-ink">
                {nameOf(handoff.from)} → {nameOf(handoff.to)}
              </span>
              <span className={`ml-auto text-[10px] uppercase tracking-[0.1em] ${handoff.resolved ? "text-st-done" : "text-st-blocked"}`}>
                {handoff.resolved ? "resolved" : "open"}
              </span>
            </div>
            <div className="text-[11px] text-ink-dim">{handoff.text}</div>
          </div>
        ))}

        <div className="border-b border-line px-3 py-1.5">
          <Label>recent output</Label>
        </div>
        <div className="px-3 py-2 font-mono text-[11px] leading-[1.7]">
          {logs.map((log, i) => (
            <div key={`${log.time}-${i}`} className="flex gap-2">
              <span className="shrink-0 text-ink-dim/70">{clock(log.time)}</span>
              <span className={logText(log.kind)}>{log.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
