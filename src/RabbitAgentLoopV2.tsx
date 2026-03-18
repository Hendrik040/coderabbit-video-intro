import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
  Img,
  staticFile,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/IBMPlexMono";

const { fontFamily: FONT_FAMILY } = loadFont("normal", { weights: ["500"] });

// ─── Brand ────────────────────────────────────────────────────────────────────
const CR_ORANGE = "#FF570A";
const CR_DARK   = "#16161E";
const CR_DIM    = "#555566";

// ─── Pill geometry ────────────────────────────────────────────────────────────
const PILL_H    = 120;
const PILL_R    = 60;   // border-radius (constant — keeps pill shape)
const CX        = 960;
const CY        = 540;
const NODE_GAP  = 148;  // center-to-center
const PLAN_X    = CX - NODE_GAP;   // 812
const CODE_X    = CX;              // 960
const REVIEW_X  = CX + NODE_GAP;  // 1108
const NODE_R    = 52;
const PILL_W_FULL = NODE_GAP * 2 + NODE_R * 2 + 56; // ≈ 460

// ─── Agent definitions (real logos) ───────────────────────────────────────────
const AGENTS = [
  { file: "agent-chatgpt.png", label: "ChatGPT",  bg: "#000000", pad: 6  },
  { file: "agent-gemini.png",  label: "Gemini",   bg: "#FFFFFF", pad: 4  },
  { file: "agent-cursor.png",  label: "Cursor",   bg: "#FFFFFF", pad: 2  },
  { file: "agent-claude.png",  label: "Claude",   bg: "#FFFFFF", pad: 4  },
];

// ─── Timing (frames @ 30 fps, total 360 = 12 s) ───────────────────────────────
const T = {
  circleIn:    0,    // real CR logo fades in
  morphStart:  36,   // pill starts expanding
  morphEnd:    80,   // pill fully wide
  logoFadeOut: 82,   // CR logo fades as dots appear
  dotsGrow:    88,   // inner circles grow from zero
  dotsMax:    140,   // circles at full radius
  labelsIn:   144,   // PLAN / CODE / REVIEW labels appear
  loopStart:  188,   // agents start cycling through CODE
};

// Each agent fully occupies the CODE circle for a window, then transitions
const AGENT_DWELL  = 48;  // frames each agent stays at CODE
const AGENT_XFADE  = 14;  // frames for cross-fade between agents
const AGENT_CYCLE  = AGENT_DWELL + AGENT_XFADE; // 62 frames per agent

export const RABBIT_AGENT_LOOP_V2_TOTAL_FRAMES = 380;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fi(frame: number, start: number, dur = 14) {
  return interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

// ─── Background ───────────────────────────────────────────────────────────────
const Background: React.FC = () => (
  <>
    <div style={{ position: "absolute", inset: 0, backgroundColor: CR_DARK }} />
    <div
      style={{
        position: "absolute", inset: 0, opacity: 0.048,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
      }}
    />
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      viewBox="0 0 1920 1080" preserveAspectRatio="none"
    >
      <line x1="960" y1="0" x2="0"    y2="1080" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <line x1="960" y1="0" x2="1920" y2="1080" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <line x1="960" y1="0" x2="380"  y2="1080" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
      <line x1="960" y1="0" x2="1540" y2="1080" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
    </svg>
    <div
      style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at 50% 50%, ${CR_ORANGE}0B 0%, transparent 60%)`,
      }}
    />
  </>
);

// ─── Agent icon shown inside CODE circle ──────────────────────────────────────
const AgentAtCode: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < T.loopStart) return null;

  const loopFrame = frame - T.loopStart;

  // Figure out which agents are visible (current + possibly fading out previous)
  const agentIndex   = Math.floor(loopFrame / AGENT_CYCLE) % AGENTS.length;
  const nextIndex    = (agentIndex + 1) % AGENTS.length;
  const frameInCycle = loopFrame % AGENT_CYCLE;

  // Current agent fades out during xfade window
  const currentOp = interpolate(
    frameInCycle,
    [AGENT_DWELL, AGENT_DWELL + AGENT_XFADE],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  // Next agent fades in during xfade window
  const nextOp = interpolate(
    frameInCycle,
    [AGENT_DWELL, AGENT_DWELL + AGENT_XFADE],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const inXfade = frameInCycle >= AGENT_DWELL;

  // Subtle scale pulse while dwell (breathing feel)
  const pulse = 1 + Math.sin(frameInCycle * 0.18) * 0.03;

  const ICON_SIZE = NODE_R * 2 - 8; // slightly smaller than white circle

  const renderAgent = (idx: number, op: number, sc = 1) => {
    const a = AGENTS[idx];
    return (
      <div
        style={{
          position: "absolute",
          left: CODE_X - ICON_SIZE / 2,
          top:  CY    - ICON_SIZE / 2,
          width:  ICON_SIZE,
          height: ICON_SIZE,
          borderRadius: "50%",
          overflow: "hidden",
          backgroundColor: a.bg,
          opacity: op,
          transform: `scale(${sc})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: a.pad,
          boxSizing: "border-box",
        }}
      >
        <Img
          src={staticFile(a.file)}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </div>
    );
  };

  return (
    <>
      {renderAgent(agentIndex, currentOp, pulse)}
      {inXfade && renderAgent(nextIndex, nextOp, 1)}
    </>
  );
};

// ─── Agent name label (appears below CODE during loop) ────────────────────────
const AgentNameLabel: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < T.loopStart) return null;
  const loopFrame    = frame - T.loopStart;
  const agentIndex   = Math.floor(loopFrame / AGENT_CYCLE) % AGENTS.length;
  const frameInCycle = loopFrame % AGENT_CYCLE;

  const op = Math.min(
    fi(frame, T.loopStart, 12),
    interpolate(frameInCycle, [AGENT_DWELL + 2, AGENT_DWELL + AGENT_XFADE], [1, 0], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
    })
  );

  return (
    <div
      style={{
        position: "absolute",
        left: CODE_X,
        top:  CY + NODE_R + 22,
        transform: "translateX(-50%)",
        opacity: op,
        pointerEvents: "none",
        textAlign: "center",
      }}
    >
      <span
        style={{
          fontSize: 14,
          fontFamily: FONT_FAMILY,
          fontWeight: 500,
          color: CR_ORANGE,
          letterSpacing: 1.5,
        }}
      >
        {AGENTS[agentIndex].label}
      </span>
    </div>
  );
};

// ─── Glow pulse on CODE node when an agent is active ─────────────────────────
const CodeNodeGlow: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < T.loopStart) return null;
  const loopFrame    = frame - T.loopStart;
  const frameInCycle = loopFrame % AGENT_CYCLE;
  const glowOp       = fi(frame, T.loopStart, 16) * 0.55;
  const pulse        = Math.sin(loopFrame * 0.14) * 0.5 + 0.5;

  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      viewBox="0 0 1920 1080"
    >
      <defs>
        <filter id="v2-codeGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={12 + pulse * 8} result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <circle
        cx={CODE_X} cy={CY} r={NODE_R + 4}
        fill="none"
        stroke={CR_ORANGE}
        strokeWidth={2 + pulse * 2}
        opacity={glowOp}
        filter="url(#v2-codeGlow)"
      />
    </svg>
  );
};

// ─── Flow arrows (PLAN → CODE → REVIEW) ──────────────────────────────────────
const FlowArrows: React.FC<{ frame: number }> = ({ frame }) => {
  const op = fi(frame, T.labelsIn + 16, 14);
  if (op < 0.01) return null;

  // Animate travelling dash offset
  const scroll = (frame - T.labelsIn) * 2.5;

  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      viewBox="0 0 1920 1080"
    >
      <defs>
        <marker id="v2-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 Z" fill="rgba(255,255,255,0.4)" />
        </marker>
      </defs>
      {/* PLAN → CODE */}
      <line
        x1={PLAN_X + NODE_R + 5} y1={CY}
        x2={CODE_X - NODE_R - 5} y2={CY}
        stroke="rgba(255,255,255,0.32)"
        strokeWidth="1.8"
        strokeDasharray="8 6"
        strokeDashoffset={-scroll}
        markerEnd="url(#v2-arr)"
        opacity={op}
      />
      {/* CODE → REVIEW */}
      <line
        x1={CODE_X + NODE_R + 5} y1={CY}
        x2={REVIEW_X - NODE_R - 5} y2={CY}
        stroke="rgba(255,255,255,0.32)"
        strokeWidth="1.8"
        strokeDasharray="8 6"
        strokeDashoffset={-scroll}
        markerEnd="url(#v2-arr)"
        opacity={op}
      />
    </svg>
  );
};

// ─── Main pill + nodes ────────────────────────────────────────────────────────
const Pill: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {

  // Pill width morphs circle → full pill
  const pillWidth = interpolate(frame, [T.morphStart, T.morphEnd], [PILL_H, PILL_W_FULL], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // White node circle radius: tiny dot → full
  const nodeR = interpolate(frame, [T.dotsGrow, T.dotsMax], [3, NODE_R], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // CR logo opacity: fades out when dots appear
  const logoOp = interpolate(frame, [T.logoFadeOut, T.logoFadeOut + 22], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Overall pill fade-in
  const pillOp  = fi(frame, T.circleIn, 18);
  const labelsOp = fi(frame, T.labelsIn, 18);

  const pillLeft = CX - pillWidth / 2;
  const pillTop  = CY - PILL_H / 2;

  const nodes = [
    { x: PLAN_X,   label: "PLAN"   },
    { x: CODE_X,   label: "CODE"   },
    { x: REVIEW_X, label: "REVIEW" },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, opacity: pillOp }}>

      {/* Orange pill */}
      <div
        style={{
          position: "absolute",
          left: pillLeft,
          top:  pillTop,
          width: pillWidth,
          height: PILL_H,
          borderRadius: PILL_R,
          backgroundColor: CR_ORANGE,
          boxShadow: `0 6px 48px ${CR_ORANGE}38`,
        }}
      />

      {/* Real CodeRabbit logo — visible until dots appear */}
      {logoOp > 0.01 && (
        <div
          style={{
            position: "absolute",
            left: CX - PILL_H / 2,
            top:  CY - PILL_H / 2,
            width: PILL_H,
            height: PILL_H,
            borderRadius: "50%",
            overflow: "hidden",
            opacity: logoOp,
          }}
        >
          <Img
            src={staticFile("cr-logo.png")}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      )}

      {/* White node circles (SVG) */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid meet"
      >
        {nodes.map((n, i) => {
          const appear = fi(frame, T.dotsGrow + i * 6, 12);
          return (
            <circle
              key={i}
              cx={n.x} cy={CY}
              r={Math.max(0, nodeR)}
              fill="white"
              opacity={appear}
            />
          );
        })}
      </svg>

      {/* PLAN / CODE / REVIEW labels */}
      {labelsOp > 0.01 && nodes.map((n, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: n.x,
            top: CY,
            transform: "translate(-50%, -50%)",
            opacity: labelsOp,
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontFamily: FONT_FAMILY,
              fontWeight: 500,
              color: CR_ORANGE,
              letterSpacing: 1.8,
            }}
          >
            {n.label}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Queue strip: agent icons on right side (shows rotation order) ────────────
const AgentQueue: React.FC<{ frame: number }> = ({ frame }) => {
  const op = fi(frame, T.loopStart + 10, 20);
  if (op < 0.01) return null;

  const loopFrame  = frame - T.loopStart;
  const activeIdx  = Math.floor(loopFrame / AGENT_CYCLE) % AGENTS.length;
  const ICON_SIZE  = 44;
  const GAP        = 14;
  const stripX     = CX + PILL_W_FULL / 2 + 44;
  const totalH     = AGENTS.length * ICON_SIZE + (AGENTS.length - 1) * GAP;
  const stripY     = CY - totalH / 2;

  return (
    <div style={{ position: "absolute", left: stripX, top: stripY, opacity: op }}>
      {AGENTS.map((a, i) => {
        const isActive = i === activeIdx;
        const itemOp   = fi(frame, T.loopStart + i * 10, 12);

        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: i < AGENTS.length - 1 ? GAP : 0,
              opacity: itemOp,
            }}
          >
            {/* Active indicator dot */}
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: isActive ? CR_ORANGE : "transparent",
                border: `1.5px solid ${isActive ? CR_ORANGE : "rgba(255,255,255,0.2)"}`,
                flexShrink: 0,
                transition: "background-color 0.1s",
              }}
            />
            {/* Icon */}
            <div
              style={{
                width: ICON_SIZE,
                height: ICON_SIZE,
                borderRadius: "50%",
                overflow: "hidden",
                backgroundColor: a.bg,
                border: isActive
                  ? `2px solid ${CR_ORANGE}`
                  : "2px solid rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: a.pad,
                boxSizing: "border-box",
                boxShadow: isActive ? `0 0 14px ${CR_ORANGE}60` : "none",
                flexShrink: 0,
              }}
            >
              <Img
                src={staticFile(a.file)}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>
            {/* Label */}
            <span
              style={{
                fontSize: 14,
                fontFamily: FONT_FAMILY,
                fontWeight: 500,
                color: isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)",
                letterSpacing: 0.5,
                whiteSpace: "nowrap",
              }}
            >
              {a.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ─── Bottom stage label ────────────────────────────────────────────────────────
const StageLabel: React.FC<{ frame: number }> = ({ frame }) => {
  const stages = [
    { start: T.circleIn,   end: T.morphStart,  text: "CodeRabbit" },
    { start: T.morphStart, end: T.dotsGrow,    text: "Plan · Code · Review" },
    { start: T.dotsGrow,   end: T.labelsIn,    text: "Plan · Code · Review" },
    { start: T.labelsIn,   end: T.loopStart,   text: "Plan · Code · Review" },
    { start: T.loopStart,  end: 9999,          text: "Coding agents in the loop" },
  ];
  const s = stages.find(x => frame >= x.start && frame < x.end);
  if (!s) return null;
  const op = Math.min(
    fi(frame, s.start, 10),
    interpolate(frame, [s.end - 8, s.end], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
  );
  return (
    <div
      style={{
        position: "absolute", bottom: 68, left: 0, right: 0,
        display: "flex", justifyContent: "center",
        opacity: op, pointerEvents: "none",
      }}
    >
      <span style={{ fontSize: 16, fontFamily: FONT_FAMILY, fontWeight: 500, color: CR_DIM, letterSpacing: 2.5 }}>
        {s.text}
      </span>
    </div>
  );
};

// ─── Main composition ─────────────────────────────────────────────────────────
export const RabbitAgentLoopV2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background />
      <Pill frame={frame} fps={fps} />
      <FlowArrows frame={frame} />
      <CodeNodeGlow frame={frame} />
      <AgentAtCode frame={frame} />
      <AgentNameLabel frame={frame} />
      <AgentQueue frame={frame} />
      <StageLabel frame={frame} />
    </AbsoluteFill>
  );
};
