/**
 * The mock feed's internals.
 *
 * `createFeedState()` builds a plausible mid-build snapshot; `advanceFeed()`
 * plays one poll's worth of beats on top of it. Both are pure with respect to
 * React — `useAgentFeed` just holds the state and calls `advanceFeed` on a
 * timer. Replacing this file with a real fetch/subscription is the only change
 * needed to go live.
 */
import type {
  Agent,
  ActivityEvent,
  ActivityKind,
  AgentRole,
  AgentStatus,
  Handoff,
  LogKind,
  MemoryFile,
  Ticket,
  TicketStatus,
} from "../types";
import { CHATTER, HANDOFF_LINES, TASKS } from "./script";

export interface FeedState {
  agents: Agent[];
  handoffs: Handoff[];
  tickets: Ticket[];
  activity: ActivityEvent[];
  memory: MemoryFile[];
  /** Monotonic counter behind generated ids. */
  seq: number;
}

const MAX_LOGS = 80;
const MAX_ACTIVITY = 240;
const MAX_HANDOFFS = 40;

const MINUTE = 60_000;

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function chance(p: number): boolean {
  return Math.random() < p;
}

function iso(ms: number): string {
  return new Date(ms).toISOString();
}

function withTicket(line: string, ticketId: string): string {
  return line.replaceAll("{t}", ticketId);
}

// --- seed ----------------------------------------------------------------

const AGENT_SEED: { id: string; name: string; role: AgentRole; harness: string }[] = [
  { id: "chief", name: "Chief", role: "chief", harness: "Claude Code — orchestrator" },
  { id: "pm", name: "Planner", role: "pm", harness: "Claude Code — subagent" },
  { id: "fe", name: "Weaver", role: "fe", harness: "Claude Code — subagent" },
  { id: "be", name: "Forge", role: "be", harness: "Claude Code — subagent" },
  { id: "qa", name: "Sentry", role: "qa", harness: "Claude Code — subagent" },
];

export const ROLE_LABEL: Record<AgentRole, string> = {
  chief: "Orchestrator",
  pm: "Product",
  fe: "Frontend",
  be: "Backend",
  qa: "QA",
};

const TICKET_SEED: { id: string; title: string; status: TicketStatus; ownerAgentId: string }[] = [
  { id: "ORD-141", title: "Orders table view — column set and sorting", status: "in_progress", ownerAgentId: "fe" },
  { id: "ORD-142", title: "/orders list endpoint + pagination cursor", status: "review", ownerAgentId: "be" },
  { id: "ORD-143", title: "Row-level security policy on orders", status: "in_progress", ownerAgentId: "be" },
  { id: "ORD-144", title: "Empty and loading states for the orders view", status: "blocked", ownerAgentId: "fe" },
  { id: "ORD-145", title: "Acceptance criteria for the filter bar", status: "done", ownerAgentId: "pm" },
  { id: "ORD-146", title: "Regression pass — orders", status: "in_progress", ownerAgentId: "qa" },
  { id: "ORD-147", title: "500 on /orders with an empty status filter", status: "todo", ownerAgentId: "be" },
  { id: "ORD-148", title: "Roll design tokens through the shell", status: "todo", ownerAgentId: "fe" },
  { id: "ORD-149", title: "Release gate checklist for the Ordi demo", status: "todo", ownerAgentId: "chief" },
  { id: "ORD-150", title: "Mobile layout below 900px", status: "todo", ownerAgentId: "fe" },
];

const SEED_LOGS: Record<AgentRole, [string, LogKind][]> = {
  chief: [
    ["Session opened on the Ordi build. Five agents up.", "info"],
    ["Read brief.md, schema.sql, api-contract.md into shared context.", "info"],
    ["@pm take the backlog first, I want ORD-141 unblocked before anything new starts.", "info"],
    ["Release gate is ORD-146 clearing. Everything else is negotiable.", "info"],
  ],
  pm: [
    ["Backlog groomed — ten tickets, four sized for this pass.", "info"],
    ["ORD-145 signed off, criteria are in the ticket.", "done"],
    ["@fe ORD-144 needs a decision on the empty state before you start it.", "warn"],
  ],
  fe: [
    ["Component shell for the orders table is up.", "info"],
    ["@be the /orders payload is missing `updated_at`, I need it for the list sort.", "warn"],
    ["Parked ORD-144 until the empty-state copy lands.", "warn"],
  ],
  be: [
    ["Migration for ORD-142 applied locally, schema.sql updated.", "info"],
    ["List endpoint was doing a seq scan. Index added, 240ms → 18ms.", "done"],
    ["Row-level security on orders is drafted — ORD-143 wants a second pair of eyes.", "info"],
  ],
  qa: [
    ["Regression pass on ORD-146 started — 22 cases.", "info"],
    ["@be got a 500 from /orders when the status filter is empty. Filed ORD-147.", "error"],
    ["ORD-141 passes on desktop, reproducing the mobile report now.", "info"],
  ],
};

const MEMORY_SEED: Omit<MemoryFile, "updatedAt" | "lastReadAt">[] = [
  {
    id: "brief",
    name: "brief.md",
    kind: "brief",
    bytes: 7420,
    lastReadBy: "chief",
    summary: "Scope, non-goals and the demo cut for the Ordi build.",
  },
  {
    id: "schema",
    name: "schema.sql",
    kind: "schema",
    bytes: 12840,
    lastReadBy: "be",
    summary: "Tables, indexes and RLS policies. Written by BE, read by everyone.",
  },
  {
    id: "api",
    name: "api-contract.md",
    kind: "spec",
    bytes: 5310,
    lastReadBy: "fe",
    summary: "Request/response shapes for /orders. The FE/BE handshake.",
  },
  {
    id: "tokens",
    name: "design-tokens.json",
    kind: "config",
    bytes: 2180,
    lastReadBy: "fe",
    summary: "Palette, type scale and spacing. Source of truth for the shell.",
  },
  {
    id: "qa",
    name: "qa-checklist.md",
    kind: "notes",
    bytes: 3960,
    lastReadBy: "qa",
    summary: "Per-ticket sign-off checklist and the known-flaky list.",
  },
  {
    id: "claude",
    name: "CLAUDE.md",
    kind: "config",
    bytes: 1890,
    lastReadBy: "chief",
    summary: "Repo conventions every subagent loads before its first edit.",
  },
];

export function createFeedState(now: number = Date.now()): FeedState {
  let seq = 0;
  const nextId = (prefix: string) => `${prefix}-${++seq}`;

  const statuses: Record<string, AgentStatus> = {
    chief: "running",
    pm: "idle",
    fe: "blocked",
    be: "running",
    qa: "running",
  };

  const agents: Agent[] = AGENT_SEED.map((seed, i) => {
    const logs = SEED_LOGS[seed.role].map(([text, kind], j) => ({
      time: iso(now - (18 - j * 4 - i) * MINUTE),
      text,
      kind,
    }));
    return {
      ...seed,
      status: statuses[seed.id],
      task: pick(TASKS[seed.role]),
      updatedAt: now - (i * 37 + 11) * 1000,
      startedAt: now - (196 + i * 3) * MINUTE,
      logs,
    };
  });

  const handoffs: Handoff[] = [
    {
      id: nextId("ho"),
      from: "fe",
      to: "be",
      text: "needs `updated_at` on the /orders payload before ORD-141 can sort",
      time: iso(now - 14 * MINUTE),
      resolved: true,
      ticketId: "ORD-141",
    },
    {
      id: nextId("ho"),
      from: "fe",
      to: "pm",
      text: "needs a decision on the empty state for ORD-144",
      time: iso(now - 9 * MINUTE),
      resolved: false,
      ticketId: "ORD-144",
    },
    {
      id: nextId("ho"),
      from: "qa",
      to: "be",
      text: "found a 500 on the empty status filter, sending ORD-147 back",
      time: iso(now - 4 * MINUTE),
      resolved: false,
      ticketId: "ORD-147",
    },
  ];

  const tickets: Ticket[] = TICKET_SEED.map((t) => ({ ...t }));

  const activity: ActivityEvent[] = [
    { agentId: "chief", text: "Session opened — five agents attached to the Ordi build", kind: "status_change", at: 22 },
    { agentId: "pm", text: "ORD-145 moved to done", kind: "completion", at: 19 },
    { agentId: "be", text: "ORD-142 moved to review", kind: "status_change", at: 16 },
    { agentId: "fe", text: "Handed ORD-141 to Forge — missing `updated_at`", kind: "handoff", at: 14 },
    { agentId: "be", text: "Resolved the ORD-141 handoff — field added to the payload", kind: "handoff", at: 12 },
    { agentId: "fe", text: "running → blocked", kind: "status_change", at: 9 },
    { agentId: "qa", text: "Filed ORD-147 against the orders endpoint", kind: "handoff", at: 4 },
  ].map((e) => ({
    id: nextId("ev"),
    time: iso(now - e.at * MINUTE),
    agentId: e.agentId,
    text: e.text,
    kind: e.kind as ActivityKind,
  }));

  const memory: MemoryFile[] = MEMORY_SEED.map((m, i) => ({
    ...m,
    updatedAt: now - (24 + i * 13) * MINUTE,
    lastReadAt: now - (i * 47 + 30) * 1000,
  }));

  return { agents, handoffs, tickets, activity, memory, seq };
}

// --- simulation ----------------------------------------------------------

/** Weighted next-status table. Keeps the fleet moving without thrashing. */
const TRANSITIONS: Record<AgentStatus, AgentStatus[]> = {
  running: ["running", "running", "idle", "blocked", "blocked", "done", "error"],
  idle: ["running", "running", "running", "idle"],
  blocked: ["running", "running", "blocked"],
  done: ["idle", "running", "running"],
  error: ["running", "idle"],
};

interface Draft extends FeedState {
  now: number;
}

function nextId(d: Draft, prefix: string): string {
  d.seq += 1;
  return `${prefix}-${d.seq}`;
}

function agentName(d: Draft, id: string): string {
  return d.agents.find((a) => a.id === id)?.name ?? id;
}

function addLog(d: Draft, agentId: string, text: string, kind: LogKind): void {
  d.agents = d.agents.map((a) =>
    a.id === agentId
      ? {
          ...a,
          updatedAt: d.now,
          logs: [...a.logs, { time: iso(d.now), text, kind }].slice(-MAX_LOGS),
        }
      : a,
  );
}

function addActivity(d: Draft, agentId: string, text: string, kind: ActivityKind): void {
  d.activity = [
    ...d.activity,
    { id: nextId(d, "ev"), time: iso(d.now), agentId, text, kind },
  ].slice(-MAX_ACTIVITY);
}

function patchAgent(d: Draft, agentId: string, patch: Partial<Agent>): void {
  d.agents = d.agents.map((a) => (a.id === agentId ? { ...a, ...patch, updatedAt: d.now } : a));
}

function setTicketStatus(d: Draft, ticketId: string, status: TicketStatus): void {
  d.tickets = d.tickets.map((t) => (t.id === ticketId ? { ...t, status } : t));
}

/** A ticket the agent could plausibly be talking about. */
function ticketFor(d: Draft, agentId: string): Ticket {
  const owned = d.tickets.filter((t) => t.ownerAgentId === agentId && t.status !== "done");
  if (owned.length > 0) return pick(owned);
  const open = d.tickets.filter((t) => t.status !== "done");
  return open.length > 0 ? pick(open) : pick(d.tickets);
}

function beatChatter(d: Draft): void {
  const agent = pick(d.agents);
  const ticket = ticketFor(d, agent.id);
  const text = withTicket(pick(CHATTER[agent.role]), ticket.id);
  const kind: LogKind = agent.status === "error" ? "error" : agent.status === "blocked" ? "warn" : "info";
  addLog(d, agent.id, text, kind);
}

function beatStatusChange(d: Draft): void {
  const agent = pick(d.agents);
  const next = pick(TRANSITIONS[agent.status]);
  if (next === agent.status) {
    beatChatter(d);
    return;
  }

  const task =
    next === "idle" ? "Waiting for work" : next === "done" ? "Queue clear for this pass" : pick(TASKS[agent.role]);
  patchAgent(d, agent.id, { status: next, task });
  addActivity(d, agent.id, `${agent.status} → ${next}`, "status_change");

  const owned = d.tickets.find((t) => t.ownerAgentId === agent.id && t.status === "in_progress");
  if (next === "blocked" && owned) setTicketStatus(d, owned.id, "blocked");
  if (next === "running") {
    const stalled = d.tickets.find((t) => t.ownerAgentId === agent.id && t.status === "blocked");
    if (stalled) setTicketStatus(d, stalled.id, "in_progress");
  }

  const line: Record<AgentStatus, string> = {
    running: `Picking this back up: ${task.toLowerCase()}.`,
    blocked: "Parking this — I can't move without the other side.",
    idle: "Nothing assigned to me right now, standing by.",
    done: "That's my queue clear for this pass.",
    error: "Tool call failed twice in a row. Backing off and retrying.",
  };
  addLog(d, agent.id, line[next], next === "error" ? "error" : next === "blocked" ? "warn" : next === "done" ? "done" : "info");
}

function beatHandoff(d: Draft): void {
  const from = pick(d.agents);
  const candidates = d.agents.filter((a) => a.id !== from.id);
  const to = pick(candidates);
  const ticket = ticketFor(d, from.id);
  const text = withTicket(pick(HANDOFF_LINES), ticket.id);

  d.handoffs = [
    ...d.handoffs,
    { id: nextId(d, "ho"), from: from.id, to: to.id, text, time: iso(d.now), resolved: false, ticketId: ticket.id },
  ].slice(-MAX_HANDOFFS);

  addActivity(d, from.id, `Handed ${ticket.id} to ${to.name} — ${text}`, "handoff");
  addLog(d, from.id, `@${to.id} ${text}.`, "warn");
  addLog(d, to.id, `Picking up ${ticket.id} from ${from.name}.`, "info");

  if (chance(0.55)) {
    patchAgent(d, from.id, { status: "blocked" });
    setTicketStatus(d, ticket.id, "blocked");
    addActivity(d, from.id, `${from.status} → blocked`, "status_change");
  }
}

function beatResolveHandoff(d: Draft): void {
  const open = d.handoffs.filter((h) => !h.resolved);
  if (open.length === 0) {
    beatChatter(d);
    return;
  }
  const handoff = open[0];
  d.handoffs = d.handoffs.map((h) => (h.id === handoff.id ? { ...h, resolved: true } : h));

  const fromName = agentName(d, handoff.from);
  addLog(d, handoff.to, `Unblocked ${fromName}${handoff.ticketId ? ` on ${handoff.ticketId}` : ""} — it's back with them.`, "done");
  addLog(d, handoff.from, "Unblocked, resuming.", "info");
  addActivity(d, handoff.to, `Resolved the handoff from ${fromName}`, "handoff");

  patchAgent(d, handoff.from, { status: "running", task: pick(TASKS[d.agents.find((a) => a.id === handoff.from)!.role]) });
  if (handoff.ticketId) {
    const ticket = d.tickets.find((t) => t.id === handoff.ticketId);
    if (ticket && ticket.status === "blocked") setTicketStatus(d, ticket.id, "in_progress");
  }
}

function beatTicketProgress(d: Draft): void {
  const movable = d.tickets.filter((t) => t.status === "in_progress" || t.status === "review");
  if (movable.length === 0) {
    beatStartTicket(d);
    return;
  }
  const ticket = pick(movable);
  if (ticket.status === "in_progress") {
    setTicketStatus(d, ticket.id, "review");
    addActivity(d, ticket.ownerAgentId, `${ticket.id} moved to review`, "handoff");
    addLog(d, ticket.ownerAgentId, `@qa ${ticket.id} is ready for review.`, "info");
    addLog(d, "qa", `Taking ${ticket.id} — running the checklist.`, "info");
  } else {
    setTicketStatus(d, ticket.id, "done");
    addActivity(d, "qa", `${ticket.id} signed off — done`, "completion");
    addLog(d, "qa", `Signed off ${ticket.id}. Checklist is in qa-checklist.md.`, "done");
    addLog(d, ticket.ownerAgentId, `${ticket.id} is closed out.`, "done");
    if (chance(0.6)) beatStartTicket(d);
  }
}

function beatStartTicket(d: Draft): void {
  const todo = d.tickets.filter((t) => t.status === "todo");
  if (todo.length === 0) return;
  const ticket = pick(todo);
  setTicketStatus(d, ticket.id, "in_progress");
  patchAgent(d, ticket.ownerAgentId, { status: "running", task: ticket.title });
  addActivity(d, ticket.ownerAgentId, `Started ${ticket.id} — ${ticket.title}`, "status_change");
  addLog(d, ticket.ownerAgentId, `Starting ${ticket.id}: ${ticket.title.toLowerCase()}.`, "info");
}

function beatMemoryTouch(d: Draft): void {
  const file = pick(d.memory);
  const reader = pick(d.agents);
  const written = chance(0.3);
  d.memory = d.memory.map((m) =>
    m.id === file.id
      ? {
          ...m,
          lastReadAt: d.now,
          lastReadBy: reader.id,
          updatedAt: written ? d.now : m.updatedAt,
          bytes: written ? m.bytes + Math.floor(Math.random() * 400) - 120 : m.bytes,
        }
      : m,
  );
  addLog(d, reader.id, written ? `Updated ${file.name}.` : `Reading ${file.name} for context.`, "info");
}

function beat(d: Draft): void {
  const roll = Math.random();
  if (roll < 0.44) beatChatter(d);
  else if (roll < 0.62) beatStatusChange(d);
  else if (roll < 0.74) beatHandoff(d);
  else if (roll < 0.83) beatResolveHandoff(d);
  else if (roll < 0.94) beatTicketProgress(d);
  else beatMemoryTouch(d);
}

/** One poll's worth of change. Returns a new state; never mutates `prev`. */
export function advanceFeed(prev: FeedState, now: number = Date.now()): FeedState {
  const draft: Draft = { ...prev, now };
  const beats = chance(0.35) ? 2 : 1;
  for (let i = 0; i < beats; i += 1) beat(draft);
  return {
    agents: draft.agents,
    handoffs: draft.handoffs,
    tickets: draft.tickets,
    activity: draft.activity,
    memory: draft.memory,
    seq: draft.seq,
  };
}
