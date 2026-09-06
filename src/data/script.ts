/**
 * Canned dialogue for the simulated feed.
 *
 * This file exists only to make the mock feel like a real crew talking. When
 * the feed is wired to the orchestrator none of this survives — `feed.ts` is
 * the only module that reads it.
 */
import type { AgentRole } from "../types";

/** `{t}` in a line is replaced with a ticket id, e.g. ORD-147. */
export const CHATTER: Record<AgentRole, string[]> = {
  chief: [
    "Re-reading brief.md — {t} is the one that gates the demo, everything else can slip.",
    "@pm split {t}, it's carrying two changes and QA can't sign off on half of it.",
    "Budget check: we're 40% through the window with the schema landed. Comfortable.",
    "@fe @be sync on the contract before either of you touches {t} again.",
    "Holding the release train until QA clears {t}.",
    "Reassigning {t} — @be has the deeper context on that path.",
    "Not taking new scope this pass. Anything new goes to the backlog under todo.",
  ],
  pm: [
    "Wrote acceptance criteria for {t}. Three cases, all in the ticket.",
    "@qa {t} is ready for review — the edge case is empty-state, start there.",
    "Cut {t} from this pass, it depends on copy we don't have yet.",
    "Groomed the backlog: {t} moved ahead of the settings work.",
    "@chief flagging that {t} has been blocked for a while now.",
    "Updated brief.md with the revised scope for the Ordi build.",
    "{t} needs a decision on the empty state before anyone starts it.",
  ],
  fe: [
    "Building the {t} view — component shell is up, wiring data next.",
    "@be the /orders payload is missing `updated_at`, I need it for the list sort. Blocking {t}.",
    "Pulled the tokens from design-tokens.json, dropped the local hex values.",
    "Hover and focus states done on {t}. Keyboard nav still owes me a tab order.",
    "Layout reflows badly under 900px — filing that separately, not folding it into {t}.",
    "Swapped the placeholder fetch for the real client on {t}.",
    "@qa {t} is on the preview build, the loading state is the interesting bit.",
  ],
  be: [
    "Migration for {t} applied locally, schema.sql updated.",
    "@fe added `updated_at` to the orders payload, redeploy and it's yours.",
    "Row-level security policy on orders is written — {t} needs a second pair of eyes.",
    "Query on the list endpoint was doing a seq scan. Index added, 240ms → 18ms.",
    "@qa {t} deployed to staging, the pagination cursor changed shape.",
    "Rolling back the enum change on {t}, it breaks two existing rows.",
    "Contract for {t} is in api-contract.md, I'd rather not change it again.",
  ],
  qa: [
    "Running the regression pass on {t} — 22 cases, 3 to go.",
    "@fe {t} fails on empty results: the table renders a header and nothing else.",
    "{t} passes on desktop, reproducing the mobile report now.",
    "@be got a 500 from /orders when the status filter is empty. Repro is in {t}.",
    "Signed off {t}. Checklist is in qa-checklist.md.",
    "Can't verify {t} until staging picks up the migration.",
    "Flaky test in the {t} suite — passes in isolation, fails in the run. Investigating.",
  ],
};

/** Text used when an agent hands work to another agent. */
export const HANDOFF_LINES: string[] = [
  "needs the API contract confirmed before {t} can move",
  "is blocked on the migration landing for {t}",
  "wants a review pass on {t} before it goes to QA",
  "is handing {t} over — context is in the ticket",
  "needs a decision on the empty state for {t}",
  "found a regression in {t}, sending it back",
];

/** Task lines an agent shows while running, per role. */
export const TASKS: Record<AgentRole, string[]> = {
  chief: [
    "Sequencing the Ordi build queue",
    "Reviewing scope against brief.md",
    "Arbitrating the FE/BE contract",
    "Watching the release gate",
  ],
  pm: [
    "Writing acceptance criteria",
    "Grooming the Ordi backlog",
    "Splitting oversized tickets",
    "Updating brief.md",
  ],
  fe: [
    "Building the orders table view",
    "Wiring the filter bar to the API",
    "Applying design tokens",
    "Fixing the empty state",
  ],
  be: [
    "Writing the orders migration",
    "Tightening row-level security",
    "Indexing the list endpoint",
    "Publishing the API contract",
  ],
  qa: [
    "Regression pass on the orders view",
    "Reproducing the mobile report",
    "Verifying the migration on staging",
    "Chasing a flaky suite",
  ],
};
