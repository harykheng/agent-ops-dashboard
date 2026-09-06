import { useState } from "react";
import type { TabProps } from "./types";
import { ROLE_LABEL } from "../../data/feed";
import { clock } from "../../lib/format";
import { Label, StatusPill } from "../ui";

/**
 * Commands — the actions an operator would reach for on the selected agent.
 *
 * Nothing here is wired to the orchestrator yet: pressing a command records it
 * in a local "sent" list so the intended shape is visible, and that list is the
 * only state this tab owns. When the control channel exists, each `command` id
 * maps to one call and the local list becomes an ack log from the server.
 */

interface Command {
  id: string;
  label: string;
  hint: string;
  tone?: "danger";
}

const COMMANDS: Command[] = [
  { id: "pause", label: "Pause agent", hint: "Finish the current tool call, then hold" },
  { id: "resume", label: "Resume", hint: "Release the hold and continue the queue" },
  { id: "ask", label: "Ask a question", hint: "Inject a prompt into the agent's next turn" },
  { id: "reassign", label: "Reassign task", hint: "Move the current ticket to another agent" },
  { id: "requeue", label: "Re-run last step", hint: "Replay the last step with fresh context" },
  { id: "reload", label: "Reload memory", hint: "Re-read the shared context files" },
  { id: "handoff", label: "Force handoff", hint: "Hand the current ticket back to the Chief" },
  { id: "stop", label: "Stop agent", hint: "Detach the agent from the run", tone: "danger" },
];

export function CommandsTab({ feed, selectedId }: TabProps) {
  const agent = feed.agents.find((a) => a.id === selectedId) ?? feed.agents[0];
  const [sent, setSent] = useState<{ id: string; label: string; at: string; target: string }[]>([]);

  if (!agent) return null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
        <Label>target</Label>
        <span className="text-[13px] text-ink">{agent.name}</span>
        <span className="text-[11px] text-ink-dim">{ROLE_LABEL[agent.role]}</span>
        <span className="ml-auto">
          <StatusPill status={agent.status} />
        </span>
      </div>

      <div className="grid grid-cols-1 border-l border-line md:grid-cols-2">
        {COMMANDS.map((command) => (
          <button
            key={command.id}
            type="button"
            onClick={() =>
              setSent((prev) =>
                [
                  { id: command.id, label: command.label, at: new Date().toISOString(), target: agent.name },
                  ...prev,
                ].slice(0, 12),
              )
            }
            className="border-r border-b border-line bg-panel px-3 py-2.5 text-left hover:bg-bg/60"
          >
            <div className={`text-[12px] ${command.tone === "danger" ? "text-st-error" : "text-ink"}`}>
              {command.label}
            </div>
            <div className="text-[11px] text-ink-dim">{command.hint}</div>
          </button>
        ))}
      </div>

      <div className="border-y border-line px-3 py-1.5">
        <Label>issued · not wired to the orchestrator yet</Label>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2 font-mono text-[11px]">
        {sent.length === 0 && <div className="text-ink-dim">No commands issued this session.</div>}
        {sent.map((entry, i) => (
          <div key={`${entry.id}-${i}`} className="flex gap-2">
            <span className="text-ink-dim/70">{clock(entry.at)}</span>
            <span className="text-ink-dim">{entry.target}</span>
            <span className="text-ink">{entry.id}</span>
            <span className="text-ink-dim">— queued locally, no-op</span>
          </div>
        ))}
      </div>
    </div>
  );
}
