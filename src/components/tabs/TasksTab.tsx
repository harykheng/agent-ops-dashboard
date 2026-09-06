import type { TicketStatus } from "../../types";
import type { TabProps } from "./types";
import { TICKET_STATUS_LABEL, TICKET_STATUS_TONE, statusBg } from "../../lib/status";
import { Label } from "../ui";

const GROUPS: TicketStatus[] = ["blocked", "in_progress", "review", "todo", "done"];

/**
 * Tasks — tickets grouped by status. A list rather than side-by-side columns:
 * the command center is the narrow half of the screen, and five columns here
 * would clip every title.
 */
export function TasksTab({ feed, selectedId, onSelect }: TabProps) {
  const nameOf = (id: string) => feed.agents.find((a) => a.id === id)?.name ?? id;

  return (
    <div className="h-full overflow-y-auto">
      {GROUPS.map((group) => {
        const tickets = feed.tickets.filter((t) => t.status === group);
        return (
          <section key={group}>
            <div className="sticky top-0 flex items-center gap-2 border-y border-line bg-panel px-3 py-1.5">
              <span className={`h-[5px] w-[5px] ${statusBg(TICKET_STATUS_TONE[group])}`} />
              <Label>{TICKET_STATUS_LABEL[group]}</Label>
              <span className="ml-auto font-mono text-[11px] text-ink-dim">{tickets.length}</span>
            </div>
            {tickets.length === 0 && <div className="px-3 py-2 text-[11px] text-ink-dim">Empty</div>}
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => onSelect(ticket.ownerAgentId)}
                className={`flex w-full items-baseline gap-3 border-b border-line px-3 py-2 text-left hover:bg-bg/60 ${
                  ticket.ownerAgentId === selectedId ? "bg-bg" : ""
                }`}
              >
                <span className="w-[62px] shrink-0 font-mono text-[11px] text-ink-dim">{ticket.id}</span>
                <span className="min-w-0 flex-1 text-[12px] leading-snug text-ink">{ticket.title}</span>
                <span className="w-[64px] shrink-0 truncate text-right text-[11px] text-ink-dim">
                  {nameOf(ticket.ownerAgentId)}
                </span>
              </button>
            ))}
          </section>
        );
      })}
    </div>
  );
}
