import type { AgentRole } from "../../types";
import type { TabProps } from "./types";
import { ROLE_LABEL } from "../../data/feed";
import { STATUS_HEX } from "../../lib/status";
import { Label } from "../ui";

/**
 * Graph — who is waiting on whom. Nodes are agents, arrows are unresolved
 * handoffs. Hand-drawn SVG on purpose: a graph library would be more code than
 * five fixed nodes deserve.
 */

const NODES: Record<AgentRole, { x: number; y: number }> = {
  chief: { x: 240, y: 46 },
  pm: { x: 66, y: 132 },
  qa: { x: 414, y: 132 },
  fe: { x: 128, y: 250 },
  be: { x: 352, y: 250 },
};

const NODE_W = 96;
const NODE_H = 34;
const ARROW_GAP = 5;

/** Where a line coming from (fx, fy) meets the node box drawn at `node`. */
function edgeOfNode(node: { x: number; y: number }, fx: number, fy: number) {
  const dx = node.x - fx;
  const dy = node.y - fy;
  const halfW = NODE_W / 2;
  const halfH = NODE_H / 2;
  const tx = dx === 0 ? Infinity : halfW / Math.abs(dx);
  const ty = dy === 0 ? Infinity : halfH / Math.abs(dy);
  const t = Math.min(tx, ty);
  const gap = ARROW_GAP / (Math.hypot(dx, dy) || 1);
  return { x: node.x - dx * (t + gap), y: node.y - dy * (t + gap) };
}

export function GraphTab({ feed, selectedId, onSelect }: TabProps) {
  const byId = new Map(feed.agents.map((a) => [a.id, a]));
  const open = feed.handoffs.filter((h) => !h.resolved).slice(-8);

  const seenPairs = new Map<string, number>();
  const edges = open.map((handoff) => {
    const from = byId.get(handoff.from);
    const to = byId.get(handoff.to);
    if (!from || !to) return null;
    const a = NODES[from.role];
    const b = NODES[to.role];
    const pair = [from.id, to.id].sort().join(">");
    const nth = seenPairs.get(pair) ?? 0;
    seenPairs.set(pair, nth + 1);
    // Bow each repeated edge between the same pair so labels don't stack.
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const offset = 22 + nth * 26;
    const cx = mx + (-dy / len) * offset;
    const cy = my + (dx / len) * offset;
    // Stop the arrow at the target node's edge instead of its centre, so the
    // head stays visible in front of the box.
    const end = edgeOfNode(b, cx, cy);
    return { handoff, from, to, a, end, cx, cy };
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line px-3 py-1.5">
        <Label>blocking graph</Label>
        <span className="text-[10px] text-ink-dim">arrow points at whoever is being waited on</span>
      </div>
      <svg viewBox="0 0 480 300" className="w-full shrink-0" role="img" aria-label="Blocking graph">
        <defs>
          <marker id="arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" fill="#D9A05B" />
          </marker>
        </defs>

        {edges.map((edge) =>
          edge ? (
            <g key={edge.handoff.id}>
              <path
                d={`M ${edge.a.x} ${edge.a.y} Q ${edge.cx} ${edge.cy} ${edge.end.x} ${edge.end.y}`}
                fill="none"
                stroke="#D9A05B"
                strokeWidth={1}
                markerEnd="url(#arrow)"
                opacity={0.85}
              />
              {edge.handoff.ticketId && (
                <text
                  x={edge.cx}
                  y={edge.cy}
                  fill="#9AA0A6"
                  fontSize={9}
                  textAnchor="middle"
                  fontFamily="ui-monospace, monospace"
                >
                  {edge.handoff.ticketId}
                </text>
              )}
            </g>
          ) : null,
        )}

        {feed.agents.map((agent) => {
          const node = NODES[agent.role];
          if (!node) return null;
          const selected = agent.id === selectedId;
          return (
            <g
              key={agent.id}
              className="cursor-pointer"
              onClick={() => onSelect(agent.id)}
              shapeRendering="crispEdges"
            >
              <rect
                x={node.x - NODE_W / 2}
                y={node.y - NODE_H / 2}
                width={NODE_W}
                height={NODE_H}
                fill="#16191D"
                stroke={selected ? "#9AA0A6" : "#23272D"}
              />
              <rect
                x={node.x - NODE_W / 2}
                y={node.y - NODE_H / 2}
                width={3}
                height={NODE_H}
                fill={STATUS_HEX[agent.status]}
              />
              <text x={node.x - NODE_W / 2 + 11} y={node.y - 2} fill="#E8E6DF" fontSize={11}>
                {agent.name}
              </text>
              <text x={node.x - NODE_W / 2 + 11} y={node.y + 10} fill="#9AA0A6" fontSize={9}>
                {ROLE_LABEL[agent.role]}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="min-h-0 flex-1 overflow-y-auto border-t border-line">
        {open.length === 0 && (
          <div className="px-3 py-3 text-[12px] text-ink-dim">Nothing is blocking anything right now.</div>
        )}
        {open
          .slice()
          .reverse()
          .map((handoff) => {
            const from = byId.get(handoff.from);
            const to = byId.get(handoff.to);
            return (
              <div key={handoff.id} className="border-b border-line px-3 py-2 text-[12px]">
                <span className="text-st-blocked">{from?.name ?? handoff.from}</span>
                <span className="text-ink-dim"> blocked on </span>
                <span className="text-ink">{to?.name ?? handoff.to}</span>
                {handoff.ticketId && <span className="font-mono text-ink-dim"> · {handoff.ticketId}</span>}
                <div className="text-[11px] text-ink-dim">{handoff.text}</div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
