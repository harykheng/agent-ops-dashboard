import { useState } from "react";
import { useAgentFeed } from "./hooks/useAgentFeed";
import { OfficeScene } from "./components/office/OfficeScene";
import { CommandCenter, type TabId } from "./components/CommandCenter";
import { RosterStrip } from "./components/RosterStrip";

export default function App() {
  const feed = useAgentFeed();
  const [selectedId, setSelectedId] = useState("chief");
  const [tab, setTab] = useState<TabId>("terminal");
  const [mode, setMode] = useState<"auto" | "manual">("auto");

  /** Selecting from the roster deep-links into the agent's detail view. */
  const selectFromRoster = (id: string) => {
    setSelectedId(id);
    setTab("workers");
  };

  return (
    <div className="flex h-full flex-col bg-bg text-ink">
      <main className="flex min-h-0 flex-1">
        <section className="flex min-h-0 w-[55%] flex-col border-r border-line bg-bg">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <span className="text-[11px] uppercase tracking-[0.12em] text-ink-dim">office</span>
            <span className="font-mono text-[10px] text-ink-dim">
              {feed.agents.filter((a) => a.status === "running").length}/{feed.agents.length} at desk
            </span>
          </div>
          <div className="min-h-0 flex-1 p-3">
            <OfficeScene agents={feed.agents} selectedId={selectedId} onSelect={setSelectedId} />
          </div>
        </section>

        <div className="flex min-h-0 w-[45%] flex-col">
          <CommandCenter
            feed={feed}
            selectedId={selectedId}
            onSelect={setSelectedId}
            tab={tab}
            onTabChange={setTab}
            mode={mode}
            onModeChange={setMode}
          />
        </div>
      </main>

      <div className="h-[76px] shrink-0">
        <RosterStrip agents={feed.agents} selectedId={selectedId} now={feed.now} onSelect={selectFromRoster} />
      </div>
    </div>
  );
}
