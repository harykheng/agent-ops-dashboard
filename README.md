# Agent Ops Dashboard

Ops console for the Studio Harel multi-agent Claude Code workflow: a Chief
orchestrator plus PM, Frontend, Backend and QA subagents working the Ordi
build. Two panels — an ambient office scene on the left, the command center on
the right — with an agent roster along the bottom.

React + Vite + TypeScript + Tailwind CSS v4. No backend yet: the whole UI runs
against a typed mock feed shaped like the eventual real one.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build
```

## Layout

- **Left (55%) — office scene.** Flat top-down room drawn in SVG: desks, a
  shared table, plants. One figure per agent parked at a fixed desk (no
  pathfinding), each with a bob/blink idle loop and two poses — leaning into
  the screen when `status === "running"`, leaned back otherwise. Hovering a
  figure shows the same task line the roster card shows; clicking selects.
- **Right (45%) — command center.** Project header with the derived overall
  status and an auto/manual toggle (cosmetic until there is an orchestrator to
  talk to), then eight tabs:

  | Tab | What it is |
  | --- | --- |
  | Terminal | Agent logs and handoffs merged into one chronological transcript. Auto-scrolls unless you scroll up. |
  | Monitor | Per-agent grid: status, current task, time since last update. |
  | Tasks | Tickets grouped by status, each showing its owner. |
  | Memory | Shared context files with size, last-updated and last-read-by. |
  | Graph | Node-and-arrow view of unresolved handoffs — who is waiting on whom. |
  | Activity | Flat audit trail, newest first. |
  | Commands | Quick actions on the selected agent. Visual only — see below. |
  | Workers | Per-agent detail: harness, uptime, tickets, handoffs, recent output. |

- **Bottom — roster strip.** One card per agent. Clicking a card selects that
  agent everywhere and deep-links into the Workers tab.

## Data layer

`src/types.ts` is the contract: `Agent`, `Handoff`, `Ticket`, `ActivityEvent`
and `MemoryFile` (the extra collection the Memory tab needs). Every `time`
field is an ISO 8601 string; `updatedAt` fields are epoch milliseconds.

`useAgentFeed()` (`src/hooks/useAgentFeed.ts`) is the only source of data in the
app — no component holds agent state of its own. It returns all collections
plus a `now` clock and `lastPollAt`, and today drives them from
`src/data/feed.ts`, which seeds a mid-build snapshot and plays a few beats of
simulated activity on a 2.5s interval, exactly as a poll would.

### Going live

Replace the intervals inside `useAgentFeed` with a real source. Nothing else in
the app changes:

```ts
// polling a JSON endpoint
useEffect(() => {
  const id = setInterval(async () => {
    const res = await fetch("/api/agent-feed");
    setState(await res.json());
    setLastPollAt(Date.now());
  }, 2500);
  return () => clearInterval(id);
}, []);

// or a Supabase subscription
useEffect(() => {
  const channel = supabase
    .channel("agent-feed")
    .on("postgres_changes", { event: "*", schema: "public" }, () => refetch())
    .subscribe();
  return () => { void supabase.removeChannel(channel); };
}, []);
```

`src/data/feed.ts` and `src/data/script.ts` exist only for the mock and can be
deleted at that point — apart from `ROLE_LABEL`, which is UI copy.

## Not in this pass

- Real orchestrator wiring, auth, persistence.
- The Commands tab's buttons. They record what was pressed in a local list so
  the intended shape is visible, but issue nothing; the auto/manual toggle is
  likewise cosmetic.
