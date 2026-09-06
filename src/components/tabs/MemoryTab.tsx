import type { TabProps } from "./types";
import { bytes, since } from "../../lib/format";
import { Label } from "../ui";

/** Memory — the shared context files, with read/write recency. Not a viewer. */
export function MemoryTab({ feed, onSelect }: TabProps) {
  const nameOf = (id: string) => feed.agents.find((a) => a.id === id)?.name ?? id;
  const sorted = [...feed.memory].sort((a, b) => b.lastReadAt - a.lastReadAt);

  return (
    <div className="h-full overflow-y-auto">
      <div className="grid grid-cols-[minmax(0,1fr)_70px_90px_130px] gap-x-3 border-b border-line px-3 py-1.5">
        <Label>file</Label>
        <Label>size</Label>
        <Label>updated</Label>
        <Label>last read</Label>
      </div>
      {sorted.map((file) => (
        <div
          key={file.id}
          className="grid grid-cols-[minmax(0,1fr)_70px_90px_130px] items-baseline gap-x-3 border-b border-line px-3 py-2.5"
        >
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[12px] text-ink">{file.name}</span>
              <span className="text-[10px] uppercase tracking-[0.1em] text-ink-dim">{file.kind}</span>
            </div>
            <div className="mt-0.5 truncate text-[11px] text-ink-dim">{file.summary}</div>
          </div>
          <div className="font-mono text-[11px] text-ink-dim">{bytes(file.bytes)}</div>
          <div className="font-mono text-[11px] text-ink-dim">{since(file.updatedAt, feed.now)} ago</div>
          <div className="text-[11px] text-ink-dim">
            <span className="font-mono">{since(file.lastReadAt, feed.now)} ago</span>{" "}
            <button
              type="button"
              onClick={() => onSelect(file.lastReadBy)}
              className="underline decoration-line underline-offset-2 hover:text-ink"
            >
              {nameOf(file.lastReadBy)}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
