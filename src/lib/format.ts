/** Display helpers. Pure functions, no data of their own. */

/** "14:32:07" from an ISO timestamp. */
export function clock(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString("en-GB", { hour12: false });
}

/** Compact elapsed label: "4s", "2m 10s", "1h 04m". */
export function since(fromMs: number, nowMs: number): string {
  const secs = Math.max(0, Math.round((nowMs - fromMs) / 1000));
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ${String(secs % 60).padStart(2, "0")}s`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${String(mins % 60).padStart(2, "0")}m`;
}

/** Longer-form elapsed label used for uptime: "3h 12m". */
export function uptime(fromMs: number, nowMs: number): string {
  const mins = Math.max(0, Math.floor((nowMs - fromMs) / 60000));
  const hours = Math.floor(mins / 60);
  return hours > 0 ? `${hours}h ${String(mins % 60).padStart(2, "0")}m` : `${mins}m`;
}

export function bytes(n: number): string {
  if (n < 1024) return `${n} B`;
  return `${(n / 1024).toFixed(1)} KB`;
}
