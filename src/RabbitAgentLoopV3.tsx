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

// ─── Brand constants (from skill spec) ───────────────────────────────────────
const CR_ORANGE = "#FF570A";   // CodeRabbit Primary Orange-500
const BG_COLOR  = "#000000";   // Pure black (brand spec)
const CR_DIM    = "#444444";

// ─── Pill geometry ────────────────────────────────────────────────────────────
const PILL_H    = 120;
const PILL_R    = 60;
const CX        = 960;
const CY        = 540;
const NODE_GAP  = 148;
const PLAN_X    = CX - NODE_GAP;   // 812
const CODE_X    = CX;              // 960
const REVIEW_X  = CX + NODE_GAP;  // 1108
const NODE_R    = 52;
const PILL_W_FULL = NODE_GAP * 2 + NODE_R * 2 + 56; // ≈ 460

// ─── Agent definitions (real logos from public/) ─────────────────────────────
const AGENTS = [
  { file: "agent-chatgpt.png", label: "ChatGPT", bg: "#000000", pad: 6 },
  { file: "agent-gemini.png",  label: "Gemini",  bg: "#FFFFFF", pad: 4 },
  { file: "agent-cursor.png",  label: "Cursor",  bg: "#FFFFFF", pad: 2 },
  { file: "agent-claude.png",  label: "Claude",  bg: "#FFFFFF", pad: 4 },
];

// ─── Timing ───────────────────────────────────────────────────────────────────
const T = {
  circleIn:    0,
  morphStart:  36,
  morphEnd:    80,
  logoFadeOut: 82,
  dotsGrow:    88,   // PLAN starts here
  loopStart:   196,
};

// ─── Sequential node reveal timing ───────────────────────────────────────────
const NODE_GROW_DUR  = 16;
const PLAN_GROW      = 88;
const CODE_GROW      = 116;
const REVIEW_GROW    = 144;
const NODE_GROW_STARTS = [PLAN_GROW, CODE_GROW, REVIEW_GROW];
const ARROW1_IN      = PLAN_GROW   + NODE_GROW_DUR + 2;  // 106: after PLAN done
const ARROW2_IN      = CODE_GROW   + NODE_GROW_DUR + 2;  // 134: after CODE done
const ARROW_FADE_DUR = 12;

const AGENT_DWELL  = 52;
const AGENT_XFADE  = 14;
const AGENT_CYCLE  = AGENT_DWELL + AGENT_XFADE; // 66 frames ≈ 2.2 s

export const RABBIT_AGENT_LOOP_V3_TOTAL_FRAMES = 380;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fi(frame: number, start: number, dur = 14) {
  return interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
}

// ─── CodeRabbit logo mark ─────────────────────────────────────────────────────
// No circular clip — the PNG is screen-blended directly over the orange pill.
// mix-blend-mode: screen keeps the white rabbit white and dissolves the PNG's
// orange circle into the identical pill orange behind it, so no border shows.
const CRLogoMark: React.FC<{ size: number }> = ({ size }) => (
  <Img
    src={staticFile("cr-logo.png")}
    style={{
      width: size,
      height: size,
      objectFit: "contain",
      // No blend mode needed — the PNG already has transparent outer area and
      // #FF570A orange circle background exactly matching the pill. Normal
      // compositing produces a seamless result.
    }}
  />
);

// ─── Background ───────────────────────────────────────────────────────────────
const Background: React.FC = () => (
  <>
    <div style={{ position: "absolute", inset: 0, backgroundColor: BG_COLOR }} />
    {/* Subtle grid — white lines on black */}
    <div
      style={{
        position: "absolute", inset: 0, opacity: 0.06,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.22) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.22) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
      }}
    />
    {/* Diagonal accent lines */}
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      viewBox="0 0 1920 1080" preserveAspectRatio="none"
    >
      <line x1="960" y1="0" x2="0"    y2="1080" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      <line x1="960" y1="0" x2="1920" y2="1080" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
    </svg>
    {/* Very faint orange radial glow */}
    <div
      style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at 50% 50%, ${CR_ORANGE}0D 0%, transparent 58%)`,
      }}
    />
  </>
);

// ─── Pill + nodes ─────────────────────────────────────────────────────────────
const Pill: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {

  const pillWidth = interpolate(frame, [T.morphStart, T.morphEnd], [PILL_H, PILL_W_FULL], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Each node grows independently — PLAN first, then CODE, then REVIEW
  const getNodeR = (i: number) => interpolate(
    frame,
    [NODE_GROW_STARTS[i], NODE_GROW_STARTS[i] + NODE_GROW_DUR],
    [0, NODE_R],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
  );

  const logoOp = interpolate(frame, [T.logoFadeOut, T.logoFadeOut + 22], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const pillOp = fi(frame, T.circleIn, 18);

  const pillLeft = CX - pillWidth / 2;
  const pillTop  = CY - PILL_H / 2;

  const nodes = [
    { x: PLAN_X,   label: "PLAN"   },
    { x: CODE_X,   label: "CODE"   },
    { x: REVIEW_X, label: "REVIEW" },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, opacity: pillOp }}>

      {/* Orange pill — exact brand orange */}
      <div
        style={{
          position: "absolute",
          left: pillLeft, top: pillTop,
          width: pillWidth, height: PILL_H,
          borderRadius: PILL_R,
          backgroundColor: CR_ORANGE,
          boxShadow: `0 6px 52px ${CR_ORANGE}3A`,
        }}
      />

      {/* CR logo — SVG rabbit on #FF570A circle, same orange as pill */}
      {logoOp > 0.01 && (
        <div
          style={{
            position: "absolute",
            left: CX - PILL_H / 2,
            top:  CY - PILL_H / 2,
            opacity: logoOp,
          }}
        >
          <CRLogoMark size={PILL_H} />
        </div>
      )}

      {/* White node circles — sequential: PLAN → CODE → REVIEW */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid meet"
      >
        {nodes.map((n, i) => (
          <circle
            key={i}
            cx={n.x} cy={CY}
            r={Math.max(0, getNodeR(i))}
            fill="white"
          />
        ))}
      </svg>

      {/* PLAN / CODE / REVIEW labels — each fades in after its circle is fully grown */}
      {nodes.map((n, i) => {
        const labelOp = fi(frame, NODE_GROW_STARTS[i] + NODE_GROW_DUR, 12);
        if (labelOp < 0.01) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: n.x, top: CY,
              transform: "translate(-50%, -50%)",
              opacity: labelOp,
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontFamily: FONT_FAMILY,
                fontWeight: 500,
                color: CR_ORANGE,
                letterSpacing: 2,
              }}
            >
              {n.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ─── Flow arrows ──────────────────────────────────────────────────────────────
const FlowArrows: React.FC<{ frame: number }> = ({ frame }) => {
  const arrow1Op = fi(frame, ARROW1_IN, ARROW_FADE_DUR);
  const arrow2Op = fi(frame, ARROW2_IN, ARROW_FADE_DUR);
  if (arrow1Op < 0.01 && arrow2Op < 0.01) return null;

  // Each arrow scrolls from the moment it appears
  const scroll1 = Math.max(0, frame - ARROW1_IN) * 2.8;
  const scroll2 = Math.max(0, frame - ARROW2_IN) * 2.8;

  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      viewBox="0 0 1920 1080"
    >
      <defs>
        <marker id="v3-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 Z" fill="rgba(255,255,255,0.36)" />
        </marker>
      </defs>
      {/* PLAN → CODE: appears after PLAN circle is done */}
      <line
        x1={PLAN_X + NODE_R + 5} y1={CY}
        x2={CODE_X - NODE_R - 5} y2={CY}
        stroke="rgba(255,255,255,0.28)" strokeWidth="1.8"
        strokeDasharray="8 6" strokeDashoffset={-scroll1}
        markerEnd="url(#v3-arr)" opacity={arrow1Op}
      />
      {/* CODE → REVIEW: appears after CODE circle is done */}
      <line
        x1={CODE_X + NODE_R + 5} y1={CY}
        x2={REVIEW_X - NODE_R - 5} y2={CY}
        stroke="rgba(255,255,255,0.28)" strokeWidth="1.8"
        strokeDasharray="8 6" strokeDashoffset={-scroll2}
        markerEnd="url(#v3-arr)" opacity={arrow2Op}
      />
    </svg>
  );
};

// ─── CODE node glow ───────────────────────────────────────────────────────────
const CodeGlow: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < T.loopStart) return null;
  const loopFrame = frame - T.loopStart;
  const pulse     = Math.sin(loopFrame * 0.13) * 0.5 + 0.5;
  const op        = fi(frame, T.loopStart, 16) * 0.6;

  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      viewBox="0 0 1920 1080"
    >
      <defs>
        <filter id="v3-cg" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation={14 + pulse * 10} result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <circle
        cx={CODE_X} cy={CY} r={NODE_R + 5}
        fill="none" stroke={CR_ORANGE}
        strokeWidth={2.5 + pulse * 2}
        opacity={op}
        filter="url(#v3-cg)"
      />
    </svg>
  );
};

// ─── Agent cycling at CODE ─────────────────────────────────────────────────────
const AgentAtCode: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < T.loopStart) return null;

  const loopFrame    = frame - T.loopStart;
  const agentIdx     = Math.floor(loopFrame / AGENT_CYCLE) % AGENTS.length;
  const nextIdx      = (agentIdx + 1) % AGENTS.length;
  const frameInCycle = loopFrame % AGENT_CYCLE;

  const currentOp = interpolate(frameInCycle, [AGENT_DWELL, AGENT_DWELL + AGENT_XFADE], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const nextOp = interpolate(frameInCycle, [AGENT_DWELL, AGENT_DWELL + AGENT_XFADE], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const pulse    = 1 + Math.sin(frameInCycle * 0.18) * 0.028;
  const ICON     = NODE_R * 2 - 10;
  const inXfade  = frameInCycle >= AGENT_DWELL;

  const icon = (idx: number, op: number, sc = 1) => {
    const a = AGENTS[idx];
    return (
      <div
        key={idx}
        style={{
          position: "absolute",
          left: CODE_X - ICON / 2,
          top:  CY    - ICON / 2,
          width: ICON, height: ICON,
          borderRadius: "50%",
          overflow: "hidden",
          backgroundColor: a.bg,
          opacity: op,
          transform: `scale(${sc})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: a.pad, boxSizing: "border-box",
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
      {icon(agentIdx, currentOp, pulse)}
      {inXfade && icon(nextIdx, nextOp)}
    </>
  );
};

// ─── Agent name below CODE ─────────────────────────────────────────────────────
const AgentLabel: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < T.loopStart) return null;
  const loopFrame    = frame - T.loopStart;
  const agentIdx     = Math.floor(loopFrame / AGENT_CYCLE) % AGENTS.length;
  const frameInCycle = loopFrame % AGENT_CYCLE;
  const op = Math.min(
    fi(frame, T.loopStart, 10),
    interpolate(frameInCycle, [AGENT_DWELL + 2, AGENT_DWELL + AGENT_XFADE], [1, 0], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
    })
  );
  return (
    <div
      style={{
        position: "absolute",
        left: CODE_X, top: CY + NODE_R + 24,
        transform: "translateX(-50%)",
        opacity: op, pointerEvents: "none",
      }}
    >
      <span style={{
        fontSize: 13, fontFamily: FONT_FAMILY, fontWeight: 500,
        color: CR_ORANGE, letterSpacing: 2,
      }}>
        {AGENTS[agentIdx].label}
      </span>
    </div>
  );
};

// ─── Agent queue (right side) ─────────────────────────────────────────────────
const AgentQueue: React.FC<{ frame: number }> = ({ frame }) => {
  const op = fi(frame, T.loopStart + 10, 20);
  if (op < 0.01) return null;

  const loopFrame = frame - T.loopStart;
  const activeIdx = Math.floor(loopFrame / AGENT_CYCLE) % AGENTS.length;

  const ICON  = 42;
  const GAP   = 12;
  const totalH = AGENTS.length * ICON + (AGENTS.length - 1) * GAP;
  const stripX = CX + PILL_W_FULL / 2 + 48;
  const stripY = CY - totalH / 2;

  return (
    <div style={{ position: "absolute", left: stripX, top: stripY, opacity: op }}>
      {AGENTS.map((a, i) => {
        const isActive  = i === activeIdx;
        const itemOp    = fi(frame, T.loopStart + i * 10, 12);

        return (
          <div
            key={i}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              marginBottom: i < AGENTS.length - 1 ? GAP : 0,
              opacity: itemOp,
            }}
          >
            {/* Active dot */}
            <div
              style={{
                width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
                backgroundColor: isActive ? CR_ORANGE : "transparent",
                border: `1.5px solid ${isActive ? CR_ORANGE : "rgba(255,255,255,0.18)"}`,
              }}
            />
            {/* Icon */}
            <div
              style={{
                width: ICON, height: ICON, borderRadius: "50%",
                overflow: "hidden",
                backgroundColor: a.bg,
                border: isActive
                  ? `2px solid ${CR_ORANGE}`
                  : "2px solid rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: a.pad, boxSizing: "border-box",
                boxShadow: isActive ? `0 0 16px ${CR_ORANGE}55` : "none",
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
                fontSize: 13, fontFamily: FONT_FAMILY, fontWeight: 500,
                letterSpacing: 0.5, whiteSpace: "nowrap",
                color: isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.28)",
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
    { start: T.circleIn,   end: T.morphStart, text: "CodeRabbit" },
    { start: T.morphStart, end: T.dotsGrow,   text: "Plan · Code · Review" },
    { start: T.dotsGrow,   end: T.loopStart,  text: "Plan · Code · Review" },
    { start: T.loopStart,  end: 9999,         text: "Coding agents in the loop" },
  ];
  const s = stages.find(x => frame >= x.start && frame < x.end);
  if (!s) return null;
  const op = Math.min(
    fi(frame, s.start, 10),
    interpolate(frame, [s.end - 8, s.end], [1, 0], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
    })
  );
  return (
    <div
      style={{
        position: "absolute", bottom: 72, left: 0, right: 0,
        display: "flex", justifyContent: "center",
        opacity: op, pointerEvents: "none",
      }}
    >
      <span style={{
        fontSize: 15, fontFamily: FONT_FAMILY, fontWeight: 500,
        color: CR_DIM, letterSpacing: 3,
      }}>
        {s.text}
      </span>
    </div>
  );
};

// ─── Main composition ─────────────────────────────────────────────────────────
export const RabbitAgentLoopV3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background />
      <Pill frame={frame} fps={fps} />
      <FlowArrows frame={frame} />
      <CodeGlow frame={frame} />
      <AgentAtCode frame={frame} />
      <AgentLabel frame={frame} />
      <AgentQueue frame={frame} />
      <StageLabel frame={frame} />
    </AbsoluteFill>
  );
};
