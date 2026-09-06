import type { CSSProperties } from "react";
import type { Agent, AgentRole } from "../../types";
import { ROLE_LABEL } from "../../data/feed";
import { STATUS_HEX } from "../../lib/status";

/**
 * Decorative top-down office. Flat shapes only — no sprites, no pathfinding.
 * Each agent is parked at a fixed desk; the only thing that moves is the idle
 * loop and the two-pose swap, both driven by the same `status` field the rest
 * of the console reads.
 */

const VIEW_W = 480;
const VIEW_H = 460;

interface Desk {
  /** Where the figure sits. */
  x: number;
  y: number;
  /** Which way the desk is from the figure — the direction "working" leans. */
  facing: "up" | "down";
  desk: { x: number; y: number; w: number; h: number };
}

const DESKS: Record<AgentRole, Desk> = {
  pm: { x: 92, y: 116, facing: "up", desk: { x: 52, y: 62, w: 80, h: 32 } },
  chief: { x: 240, y: 116, facing: "up", desk: { x: 182, y: 56, w: 116, h: 38 } },
  qa: { x: 388, y: 116, facing: "up", desk: { x: 348, y: 62, w: 80, h: 32 } },
  fe: { x: 92, y: 330, facing: "down", desk: { x: 52, y: 356, w: 80, h: 32 } },
  be: { x: 388, y: 330, facing: "down", desk: { x: 348, y: 356, w: 80, h: 32 } },
};

/** Muted body/hair tints so the five figures are distinguishable up close. */
const TINT: Record<AgentRole, { body: string; hair: string; skin: string }> = {
  chief: { body: "#3B4149", hair: "#2A2E34", skin: "#8A7C6E" },
  pm: { body: "#3A4048", hair: "#37302B", skin: "#7E7266" },
  fe: { body: "#34404A", hair: "#2C3238", skin: "#8C7E70" },
  be: { body: "#3A4440", hair: "#2E332F", skin: "#7A6E62" },
  qa: { body: "#443C3C", hair: "#332B2B", skin: "#877A6C" },
};

const FLOOR = "#121417";
const TILE = "#191D22";
const SURFACE = "#1B1F24";
const EDGE = "#23272D";
const SCREEN = "#252A31";

function Workstation({ desk }: { desk: Desk["desk"] }) {
  return (
    <g shapeRendering="crispEdges">
      <rect x={desk.x} y={desk.y} width={desk.w} height={desk.h} fill={SURFACE} stroke={EDGE} />
      {/* monitor + keyboard, seen from above */}
      <rect x={desk.x + desk.w / 2 - 16} y={desk.y + 6} width={32} height={10} fill={SCREEN} stroke={EDGE} />
      <rect x={desk.x + desk.w / 2 - 12} y={desk.y + desk.h - 12} width={24} height={6} fill={EDGE} />
    </g>
  );
}

function Plant({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} shapeRendering="crispEdges">
      <rect x={-7} y={0} width={14} height={12} fill="#2A2E33" stroke={EDGE} />
      <rect x={-6} y={-8} width={5} height={8} fill="#4E5F4C" />
      <rect x={1} y={-12} width={5} height={12} fill="#5B6E58" />
      <rect x={-2} y={-16} width={4} height={8} fill="#4E5F4C" />
    </g>
  );
}

function AgentFigure({
  agent,
  desk,
  index,
  selected,
  onSelect,
}: {
  agent: Agent;
  desk: Desk;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const working = agent.status === "running";
  const lean = desk.facing === "up" ? -1 : 1;
  // Two poses: leaning toward the screen, or leaned back in the chair.
  const poseY = working ? lean * 4 : lean * -3;
  const tint = TINT[agent.role];
  const tip = `${agent.name} · ${ROLE_LABEL[agent.role]} — ${agent.task}`;
  const tipW = Math.min(268, tip.length * 4.7 + 14);
  const tipX = Math.max(6, Math.min(VIEW_W - tipW - 6, desk.x - tipW / 2));
  const tipY = desk.facing === "up" ? desk.y + 34 : desk.y - 52;

  return (
    <g className="group cursor-pointer" onClick={onSelect}>
      {/* chair */}
      <rect
        x={desk.x - 15}
        y={desk.y - 8}
        width={30}
        height={30}
        fill={SURFACE}
        stroke={selected ? "#9AA0A6" : EDGE}
        shapeRendering="crispEdges"
      />
      <g
        className="agent-bob"
        style={
          {
            "--bob-duration": `${2.4 + index * 0.4}s`,
            "--bob-delay": `${index * 0.5}s`,
          } as CSSProperties
        }
        transform={`translate(0 ${poseY})`}
      >
        <g shapeRendering="crispEdges">
          {/* arms reach for the keyboard only in the working pose */}
          {working && (
            <>
              <rect x={desk.x - 12} y={desk.y + lean * 9 - 2} width={5} height={9} fill={tint.body} />
              <rect x={desk.x + 7} y={desk.y + lean * 9 - 2} width={5} height={9} fill={tint.body} />
            </>
          )}
          <rect x={desk.x - 11} y={desk.y - 4} width={22} height={20} fill={tint.body} />
          <rect x={desk.x - 8} y={desk.y - 19} width={16} height={16} fill={tint.skin} />
          <rect x={desk.x - 8} y={desk.y - 19} width={16} height={5} fill={tint.hair} />
          <g
            className="agent-blink"
            style={
              {
                "--blink-duration": `${5 + index * 1.3}s`,
                "--blink-delay": `${index * 0.9}s`,
              } as CSSProperties
            }
          >
            <rect x={desk.x - 5} y={desk.y - 11} width={3} height={3} fill="#15181B" />
            <rect x={desk.x + 2} y={desk.y - 11} width={3} height={3} fill="#15181B" />
          </g>
          <rect x={desk.x + 9} y={desk.y - 24} width={5} height={5} fill={STATUS_HEX[agent.status]} />
        </g>
      </g>

      {/* hover tooltip — same text the roster card shows */}
      <g className="pointer-events-none opacity-0 transition-opacity group-hover:opacity-100">
        <rect x={tipX} y={tipY} width={tipW} height={20} fill="#16191D" stroke={EDGE} />
        <text x={tipX + 7} y={tipY + 13.5} fill="#E8E6DF" fontSize={9} fontFamily="inherit">
          {tip.length > 58 ? `${tip.slice(0, 57)}…` : tip}
        </text>
      </g>
    </g>
  );
}

export function OfficeScene({
  agents,
  selectedId,
  onSelect,
}: {
  agents: Agent[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className="h-full w-full"
      role="img"
      aria-label="Top-down view of the agent office"
    >
      <rect x={0} y={0} width={VIEW_W} height={VIEW_H} fill={FLOOR} />
      {/* floor tiles */}
      <g stroke={TILE} strokeWidth={1} shapeRendering="crispEdges">
        {Array.from({ length: Math.floor(VIEW_W / 40) }, (_, i) => (
          <line key={`v${i}`} x1={(i + 1) * 40} y1={0} x2={(i + 1) * 40} y2={VIEW_H} />
        ))}
        {Array.from({ length: Math.floor(VIEW_H / 40) }, (_, i) => (
          <line key={`h${i}`} x1={0} y1={(i + 1) * 40} x2={VIEW_W} y2={(i + 1) * 40} />
        ))}
      </g>
      <rect x={0.5} y={0.5} width={VIEW_W - 1} height={VIEW_H - 1} fill="none" stroke={EDGE} />

      {/* shared table + stools */}
      <g shapeRendering="crispEdges">
        <rect x={180} y={196} width={120} height={68} fill={SURFACE} stroke={EDGE} />
        <rect x={158} y={210} width={14} height={14} fill={SURFACE} stroke={EDGE} />
        <rect x={158} y={236} width={14} height={14} fill={SURFACE} stroke={EDGE} />
        <rect x={308} y={210} width={14} height={14} fill={SURFACE} stroke={EDGE} />
        <rect x={308} y={236} width={14} height={14} fill={SURFACE} stroke={EDGE} />
        <rect x={210} y={218} width={60} height={24} fill={FLOOR} stroke={EDGE} />
      </g>

      <Plant x={34} y={222} />
      <Plant x={446} y={222} />

      {(Object.keys(DESKS) as AgentRole[]).map((role) => (
        <Workstation key={`desk-${role}`} desk={DESKS[role].desk} />
      ))}

      {agents.map((agent, i) => {
        const desk = DESKS[agent.role];
        if (!desk) return null;
        return (
          <AgentFigure
            key={agent.id}
            agent={agent}
            desk={desk}
            index={i}
            selected={agent.id === selectedId}
            onSelect={() => onSelect(agent.id)}
          />
        );
      })}
    </svg>
  );
}
