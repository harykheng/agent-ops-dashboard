import { useEffect, useState } from "react";
import type { AgentFeed } from "../types";
import { advanceFeed, createFeedState, type FeedState } from "../data/feed";

/** How often the simulated poll lands. A real poll would use the same cadence. */
const POLL_MS = 2500;
/** Separate, faster tick so "time since last update" labels stay honest. */
const CLOCK_MS = 1000;

/**
 * The single source of data for the whole console.
 *
 * Every component reads from this hook's return value and nothing else, so the
 * swap to live data is contained here: replace the two intervals below with a
 * `fetch` loop or a Supabase channel subscription that produces the same
 * `FeedState`, and the UI is unchanged. For reference:
 *
 * ```ts
 * useEffect(() => {
 *   const channel = supabase
 *     .channel("agent-feed")
 *     .on("postgres_changes", { event: "*", schema: "public" }, () => refetch())
 *     .subscribe();
 *   return () => { void supabase.removeChannel(channel); };
 * }, []);
 * ```
 */
export function useAgentFeed(): AgentFeed {
  const [state, setState] = useState<FeedState>(() => createFeedState());
  const [lastPollAt, setLastPollAt] = useState<number>(() => Date.now());
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const poll = window.setInterval(() => {
      const at = Date.now();
      setState((prev) => advanceFeed(prev, at));
      setLastPollAt(at);
    }, POLL_MS);
    const clock = window.setInterval(() => setNow(Date.now()), CLOCK_MS);
    return () => {
      window.clearInterval(poll);
      window.clearInterval(clock);
    };
  }, []);

  return {
    agents: state.agents,
    handoffs: state.handoffs,
    tickets: state.tickets,
    activity: state.activity,
    memory: state.memory,
    now,
    lastPollAt,
  };
}
