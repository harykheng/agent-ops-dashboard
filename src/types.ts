/**
 * Wire shapes for the agent feed.
 *
 * These are the contract between the UI and whatever produces the data. Right
 * now that producer is `useAgentFeed()`'s in-memory simulation; later it will
 * be a Supabase subscription or a polled JSON endpoint. Nothing in the UI may
 * depend on anything outside this file.
 *
 * Convention: every `time` field is an ISO 8601 timestamp string, so it sorts
 * lexicographically and formats for display without extra parsing rules.
 * `updatedAt` is epoch milliseconds because it is used for elapsed-time maths.
 */

export type AgentStatus = "running" | "blocked" | "idle" | "done" | "error";

export type AgentRole = "chief" | "pm" | "fe" | "be" | "qa";

export type LogKind = "info" | "warn" | "error" | "done";

export interface AgentLogEntry {
  time: string;
  text: string;
  kind: LogKind;
}

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  status: AgentStatus;
  task: string;
  updatedAt: number; // epoch ms
  logs: AgentLogEntry[];
  /** Harness the agent wraps, e.g. "Claude Code — Opus". Shown in Workers. */
  harness: string;
  /** Epoch ms the agent came online; Workers renders this as uptime. */
  startedAt: number;
}

export interface Handoff {
  id: string;
  from: string; // agent id
  to: string; // agent id
  text: string;
  time: string;
  resolved: boolean;
  /** Ticket the handoff is about, when there is one. Drives the Graph edges. */
  ticketId?: string;
}

export type TicketStatus = "todo" | "in_progress" | "blocked" | "review" | "done";

export interface Ticket {
  id: string;
  title: string;
  status: TicketStatus;
  ownerAgentId: string;
}

export type ActivityKind = "status_change" | "handoff" | "completion";

export interface ActivityEvent {
  id: string;
  time: string;
  agentId: string;
  text: string;
  kind: ActivityKind;
}

/** A shared context file the agents read from / write to. */
export interface MemoryFile {
  id: string;
  name: string;
  kind: "brief" | "schema" | "spec" | "notes" | "config";
  bytes: number;
  updatedAt: number; // epoch ms
  lastReadAt: number; // epoch ms
  lastReadBy: string; // agent id
  summary: string;
}

/** Everything a consumer of the feed gets back. */
export interface AgentFeed {
  agents: Agent[];
  handoffs: Handoff[];
  tickets: Ticket[];
  activity: ActivityEvent[];
  memory: MemoryFile[];
  /** Wall clock from the feed, ticking once a second, for elapsed-time labels. */
  now: number;
  /** Epoch ms of the last successful poll — the console's "connected" signal. */
  lastPollAt: number;
}
