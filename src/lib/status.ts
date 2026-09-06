import type { AgentStatus, LogKind, TicketStatus } from "../types";

/**
 * Status → colour. Tailwind can't build class names at runtime, so every class
 * string a status can produce is spelled out here.
 */
const STATUS_CLASSES: Record<AgentStatus, { text: string; bg: string; border: string }> = {
  running: { text: "text-st-running", bg: "bg-st-running", border: "border-st-running" },
  blocked: { text: "text-st-blocked", bg: "bg-st-blocked", border: "border-st-blocked" },
  idle: { text: "text-st-idle", bg: "bg-st-idle", border: "border-st-idle" },
  done: { text: "text-st-done", bg: "bg-st-done", border: "border-st-done" },
  error: { text: "text-st-error", bg: "bg-st-error", border: "border-st-error" },
};

export function statusText(status: AgentStatus): string {
  return STATUS_CLASSES[status].text;
}

export function statusBg(status: AgentStatus): string {
  return STATUS_CLASSES[status].bg;
}

export function statusBorder(status: AgentStatus): string {
  return STATUS_CLASSES[status].border;
}

/** Raw hex for SVG fills in the office scene and graph, keyed off the same field. */
export const STATUS_HEX: Record<AgentStatus, string> = {
  running: "#5FB89C",
  blocked: "#D9A05B",
  idle: "#6B7280",
  done: "#7C9473",
  error: "#C9564F",
};

const LOG_CLASSES: Record<LogKind, string> = {
  info: "text-ink",
  warn: "text-st-blocked",
  error: "text-st-error",
  done: "text-st-done",
};

export function logText(kind: LogKind): string {
  return LOG_CLASSES[kind];
}

/** Ticket columns borrow the agent status palette so one glance reads the same. */
export const TICKET_STATUS_TONE: Record<TicketStatus, AgentStatus> = {
  todo: "idle",
  in_progress: "running",
  blocked: "blocked",
  review: "idle",
  done: "done",
};

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  todo: "todo",
  in_progress: "in progress",
  blocked: "blocked",
  review: "review",
  done: "done",
};

/**
 * Overall project status: the worst thing happening anywhere wins, except that
 * a fleet with nothing left to do reads as done rather than idle.
 */
export function overallStatus(statuses: AgentStatus[]): AgentStatus {
  if (statuses.length === 0) return "idle";
  if (statuses.includes("error")) return "error";
  if (statuses.includes("blocked")) return "blocked";
  if (statuses.includes("running")) return "running";
  if (statuses.every((s) => s === "done")) return "done";
  return "idle";
}
