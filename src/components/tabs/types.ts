import type { AgentFeed } from "../../types";

/** Every tab reads the same feed object and shares one selection. */
export interface TabProps {
  feed: AgentFeed;
  selectedId: string;
  onSelect: (id: string) => void;
}
