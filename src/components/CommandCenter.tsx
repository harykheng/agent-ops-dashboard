import type { ReactElement } from "react";
import type { AgentFeed } from "../types";
import { overallStatus } from "../lib/status";
import { since } from "../lib/format";
import { StatusPill, Label } from "./ui";
import { TerminalTab } from "./tabs/TerminalTab";
import { MonitorTab } from "./tabs/MonitorTab";
import { TasksTab } from "./tabs/TasksTab";
import { MemoryTab } from "./tabs/MemoryTab";
import { GraphTab } from "./tabs/GraphTab";
import { ActivityTab } from "./tabs/ActivityTab";
import { CommandsTab } from "./tabs/CommandsTab";
import { WorkersTab } from "./tabs/WorkersTab";
import type { TabProps } from "./tabs/types";

export const TABS = [
  "terminal",
  "monitor",
  "tasks",
  "memory",
  "graph",
  "activity",
  "commands",
  "workers",
] as const;

export type TabId = (typeof TABS)[number];

const VIEWS: Record<TabId, (props: TabProps) => ReactElement | null> = {
  terminal: TerminalTab,
  monitor: MonitorTab,
  tasks: TasksTab,
  memory: MemoryTab,
  graph: GraphTab,
  activity: ActivityTab,
  commands: CommandsTab,
  workers: WorkersTab,
};

const PROJECT = "Studio Harel — Ordi build";

export function CommandCenter({
  feed,
  selectedId,
  onSelect,
  tab,
  onTabChange,
  mode,
  onModeChange,
}: {
  feed: AgentFeed;
  selectedId: string;
  onSelect: (id: string) => void;
  tab: TabId;
  onTabChange: (tab: TabId) => void;
  mode: "auto" | "manual";
  onModeChange: (mode: "auto" | "manual") => void;
}) {
  const overall = overallStatus(feed.agents.map((a) => a.status));
  const View = VIEWS[tab];

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-panel">
      <header className="flex items-center gap-3 border-b border-line px-3 py-2">
        <h1 className="text-[13px] text-ink">{PROJECT}</h1>
        <StatusPill status={overall} />
        <span className="font-mono text-[10px] text-ink-dim">
          polled {since(feed.lastPollAt, feed.now)} ago
        </span>

        <div className="ml-auto flex items-center gap-2">
          <Label>mode</Label>
          <div className="flex border border-line">
            {(["auto", "manual"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onModeChange(option)}
                aria-pressed={mode === option}
                className={`px-2 py-[3px] text-[10px] uppercase tracking-[0.1em] ${
                  mode === option ? "bg-bg text-ink" : "text-ink-dim hover:text-ink"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </header>

      <nav className="flex shrink-0 overflow-x-auto border-b border-line">
        {TABS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            aria-current={tab === id}
            className={`relative shrink-0 px-2 py-2 text-[11px] uppercase tracking-[0.06em] ${
              tab === id ? "text-ink" : "text-ink-dim hover:text-ink"
            }`}
          >
            {id}
            {tab === id && <span className="absolute inset-x-0 bottom-0 h-[2px] bg-ink" />}
          </button>
        ))}
      </nav>

      <div className="min-h-0 flex-1 overflow-hidden">
        <View feed={feed} selectedId={selectedId} onSelect={onSelect} />
      </div>
    </section>
  );
}
