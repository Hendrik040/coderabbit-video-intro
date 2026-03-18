import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/IBMPlexMono";

const { fontFamily: FONT_FAMILY } = loadFont("normal", { weights: ["500"] });

// ─── Brand ───────────────────────────────────────────────────────────────────
const CR_ORANGE = "#FF570A";
const CR_DARK   = "#16161E";
const CR_CARD   = "#1E1E28";
const CR_DIM    = "#555566";
const PILL_H    = 116;   // pill height (also the starting circle diameter)
const PILL_R    = 58;    // border-radius stays constant throughout morph

// Node centers (absolute screen coords, 1920×1080)
const CX = 960;
const CY = 540;
const NODE_GAP   = 140;  // center-to-center between nodes
const PLAN_X     = CX - NODE_GAP;  // 820
const CODE_X     = CX;             // 960
const REVIEW_X   = CX + NODE_GAP;  // 1100
const NODE_R     = 50;             // white circle radius (fully grown)
const PILL_W_FULL = NODE_GAP * 2 + NODE_R * 2 + 52; // ~432

// ─── Timing (frames @ 30 fps, total 360 = 12 s) ───────────────────────────────
const T = {
  circleIn:    0,   // rabbit circle fades in, dur 20f
  morphStart:  35,  // pill starts expanding
  morphEnd:    78,  // pill fully wide
  dotsGrow:    85,  // inner circles scale up from tiny dots
  dotsMax:    138,  // circles at full radius
  labelsIn:   142,  // PLAN/CODE/REVIEW labels fade in
  loopStart:  185,  // agents start cycling
};

// Agent loop parameters
const LOOP_CYCLE  = 72;   // frames per single agent pass (PLAN→CODE→REVIEW)
const LOOP_STAGGER = 18;  // frames between successive agents
const NUM_AGENTS   = 4;

export const RABBIT_AGENT_LOOP_TOTAL_FRAMES = 360;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}
function fi(frame: number, start: number, dur = 14) {
  return interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}
function eased(frame: number, start: number, dur: number) {
  return interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
}

// ─── Rabbit SVG (clean silhouette, facing right, matching brand guide) ────────
const Rabbit: React.FC<{ size: number; color?: string }> = ({ size, color = "white" }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill={color}>
    {/* Body */}
    <ellipse cx="52" cy="68" rx="25" ry="20" />
    {/* Head */}
    <circle cx="56" cy="44" r="17" />
    {/* Long left ear */}
    <ellipse cx="44" cy="18" rx="6.5" ry="18" />
    {/* Short right ear */}
    <ellipse cx="62" cy="22" rx="5.5" ry="13" />
    {/* Eye highlight */}
    <circle cx="62" cy="42" r="3" fill={color === "white" ? CR_ORANGE : "white"} opacity={0.9} />
    {/* Front paw */}
    <ellipse cx="38" cy="84" rx="8" ry="5" />
    <ellipse cx="56" cy="85" rx="7" ry="5" />
    {/* Fluffy tail */}
    <circle cx="76" cy="70" r="9" opacity={0.65} />
  </svg>
);

// ─── Rabbit with bounce animation ────────────────────────────────────────────
const BouncingRabbit: React.FC<{ frame: number; size: number; opacity: number }> = ({
  frame, size, opacity,
}) => {
  const bounce = Math.sin(frame * 0.28) * 6;  // subtle vertical bounce
  const lean   = Math.sin(frame * 0.18) * 2;  // slight horizontal lean
  return (
    <div
      style={{
        transform: `translateY(${bounce}px) rotate(${lean}deg)`,
        opacity,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <Rabbit size={size} color="white" />
    </div>
  );
};

// ─── Agent icon definitions ───────────────────────────────────────────────────
// Simple but visually distinct, inspired by the style in the brand guide
const agents: { color: string; label: string; icon: React.ReactNode }[] = [
  {
    color: "#7C3AED",
    label: "Claude",
    icon: (
      // Sparkle / flower shape (Anthropic-style)
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2 L13.2 9.8 L20 8 L14.2 13 L18 20 L12 15.8 L6 20 L9.8 13 L4 8 L10.8 9.8 Z"
          fill="white" opacity={0.92} />
      </svg>
    ),
  },
  {
    color: "#10A37F",
    label: "GPT-4",
    icon: (
      // OpenAI — concentric rotated hexagon approximation
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2.5C9.1 2.5 6.6 4.1 5.3 6.5C3.7 6.6 2.4 7.5 1.8 8.9C0.6 11 1 13.5 2.6 15.1C2.2 16.6 2.6 18.2 3.8 19.3C5.5 21 8.1 21.4 10.2 20.4C11.2 21.2 12.5 21.5 13.8 21.1C15.9 20.5 17.3 18.5 17.2 16.3C18.4 15.4 19.2 14 19.2 12.5C19.2 10.9 18.3 9.4 17 8.6C17.1 7.1 16.4 5.6 15.1 4.6C14 3.8 12.5 3.5 11 3.9L12 2.5Z"
          fill="none" stroke="white" strokeWidth="1.5" opacity={0.9} />
        <circle cx="12" cy="12" r="2.5" fill="white" opacity={0.9} />
      </svg>
    ),
  },
  {
    color: "#1A73E8",
    label: "Gemini",
    icon: (
      // Gemini star / 4-pointed star
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2 C12 7 17 12 22 12 C17 12 12 17 12 22 C12 17 7 12 2 12 C7 12 12 7 12 2 Z"
          fill="white" opacity={0.92} />
      </svg>
    ),
  },
  {
    color: "#1C1C2E",
    label: "Cursor",
    icon: (
      // Arrow cursor
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M5 3 L19 12 L12 13.5 L8.5 20 Z"
          fill="white" stroke="white" strokeWidth="1.2"
          strokeLinejoin="round" opacity={0.9} />
      </svg>
    ),
  },
];

// ─── Agent token (the icon that travels through the loop) ─────────────────────
const AgentToken: React.FC<{
  agentIdx: number;
  frame: number;
  fps: number;
  loopFrame: number; // frame within the agent's own cycle
}> = ({ agentIdx, frame, fps, loopFrame }) => {
  const agent = agents[agentIdx % agents.length];
  const progress = Math.max(0, Math.min(1, loopFrame / LOOP_CYCLE));

  // ── X position: piecewise interpolation through PLAN→CODE→REVIEW ──
  // 0.00–0.20 : at PLAN
  // 0.20–0.47 : PLAN → CODE (eased)
  // 0.47–0.62 : at CODE
  // 0.62–0.88 : CODE → REVIEW (eased)
  // 0.88–1.00 : at REVIEW (fading)

  let x: number;
  let y: number = CY;
  const ARC_HEIGHT = 28; // agent arcs above the pill midline when traveling

  if (progress < 0.20) {
    x = PLAN_X;
    y = CY - ARC_HEIGHT * Math.sin((progress / 0.20) * Math.PI * 0.5);
  } else if (progress < 0.47) {
    const t = (progress - 0.20) / 0.27;
    const te = Easing.inOut(Easing.quad)(t);
    x = lerp(PLAN_X, CODE_X, te);
    y = CY - ARC_HEIGHT * Math.sin(t * Math.PI);
  } else if (progress < 0.62) {
    x = CODE_X;
    y = CY - ARC_HEIGHT * Math.sin(((0.62 - progress) / 0.15) * Math.PI * 0.5);
  } else if (progress < 0.88) {
    const t = (progress - 0.62) / 0.26;
    const te = Easing.inOut(Easing.quad)(t);
    x = lerp(CODE_X, REVIEW_X, te);
    y = CY - ARC_HEIGHT * Math.sin(t * Math.PI);
  } else {
    x = REVIEW_X;
    y = CY - ARC_HEIGHT * Math.sin(((1.0 - progress) / 0.12) * Math.PI * 0.5);
  }

  // Shift tokens up above the pill so they're clearly visible
  y = y - PILL_H / 2 - 20;

  // Fade in at start, fade out at end
  const opacity = Math.min(
    interpolate(progress, [0, 0.08], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    interpolate(progress, [0.88, 1.0], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
  );

  // Scale pulse when sitting at a node
  const atNode = progress < 0.20 || (progress >= 0.47 && progress < 0.62) || progress >= 0.88;
  const pulseSc = atNode
    ? 1 + Math.sin(loopFrame * 0.3) * 0.06
    : 1.0;

  const TOKEN_R = 22;

  return (
    <div
      style={{
        position: "absolute",
        left: x - TOKEN_R,
        top:  y - TOKEN_R,
        width:  TOKEN_R * 2,
        height: TOKEN_R * 2,
        borderRadius: "50%",
        backgroundColor: agent.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity,
        transform: `scale(${pulseSc})`,
        boxShadow: `0 0 16px ${agent.color}80, 0 2px 10px rgba(0,0,0,0.5)`,
        border: "1.5px solid rgba(255,255,255,0.18)",
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      {agent.icon}
    </div>
  );
};

// ─── Active node glow: which node is an agent currently "at"? ────────────────
function nodeActivity(frame: number): { plan: number; code: number; review: number } {
  if (frame < T.loopStart) return { plan: 0, code: 0, review: 0 };
  let plan = 0, code = 0, review = 0;
  for (let i = 0; i < NUM_AGENTS; i++) {
    const raw = (frame - T.loopStart) - i * LOOP_STAGGER;
    if (raw < 0) continue;
    const lf = raw % LOOP_CYCLE;
    const p  = lf / LOOP_CYCLE;
    if (p < 0.20 || p > 0.88) plan  = Math.max(plan,  Math.min(1, i === 0 ? 1 : 0.7));
    if (p >= 0.47 && p < 0.62) code  = Math.max(code,  1);
    // review: p approaching 1.0 wraps back and restarts - count the window
    if (p >= 0.62 && p < 0.88 && p > 0.80) review = Math.max(review, 1);
  }
  return { plan, code, review };
}

// ─── PILL + NODES component ───────────────────────────────────────────────────
const PillAndNodes: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {

  // Morph: pill width expands
  const pillWidth = interpolate(
    frame,
    [T.morphStart, T.morphEnd],
    [PILL_H, PILL_W_FULL],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }
  );

  // Inner white circle radius: starts as tiny dot, grows to NODE_R
  const nodeR = interpolate(
    frame,
    [T.dotsGrow, T.dotsMax],
    [4, NODE_R],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }
  );

  // Rabbit opacity: fades out as dots appear
  const rabbitOp = interpolate(
    frame,
    [T.dotsGrow, T.dotsGrow + 28],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Labels opacity
  const labelsOp = fi(frame, T.labelsIn, 18);

  // Node activity for glow
  const activity = nodeActivity(frame);
  const nodeGlowAmount = (a: number) => a * 18;

  const pillLeft = CX - pillWidth / 2;
  const pillTop  = CY - PILL_H / 2;

  // Circle and pill fade-in
  const pillOp = fi(frame, T.circleIn, 18);

  // Node positions relative to screen
  const nodes = [
    { x: PLAN_X,   label: "PLAN",   glow: activity.plan   },
    { x: CODE_X,   label: "CODE",   glow: activity.code   },
    { x: REVIEW_X, label: "REVIEW", glow: activity.review },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, opacity: pillOp }}>
      {/* Orange pill */}
      <div
        style={{
          position: "absolute",
          left: pillLeft,
          top: pillTop,
          width: pillWidth,
          height: PILL_H,
          borderRadius: PILL_R,
          backgroundColor: CR_ORANGE,
          boxShadow: `0 4px 40px ${CR_ORANGE}40`,
        }}
      />

      {/* Rabbit (fades out as dots appear) */}
      {rabbitOp > 0.01 && (
        <div
          style={{
            position: "absolute",
            left: CX - 32,
            top: CY - 32,
            width: 64,
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BouncingRabbit frame={frame} size={56} opacity={rabbitOp} />
        </div>
      )}

      {/* White node circles (SVG so we can clip to pill easily) */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {nodes.map((n, i) => (
            <filter key={i} id={`node-glow-${i}`} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation={nodeGlowAmount(n.glow)} result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          ))}
        </defs>

        {nodes.map((n, i) => {
          const appear = fi(frame, T.dotsGrow + i * 5, 12);
          const glowing = n.glow > 0.05;
          return (
            <g key={i}>
              <circle
                cx={n.x} cy={CY} r={Math.max(0, nodeR)}
                fill="white"
                opacity={appear}
                filter={glowing ? `url(#node-glow-${i})` : undefined}
              />
            </g>
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
              letterSpacing: 1.5,
            }}
          >
            {n.label}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Agent label strip (right side — shows which agents are plugged in) ───────
const AgentStrip: React.FC<{ frame: number }> = ({ frame }) => {
  const op = fi(frame, T.loopStart, 20);
  if (op < 0.01) return null;

  const stripX = CX + PILL_W_FULL / 2 + 40;
  const stripY = CY - (agents.length * 44) / 2;

  return (
    <div
      style={{
        position: "absolute",
        left: stripX,
        top: stripY,
        opacity: op,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {agents.map((a, i) => {
        const agentFadeIn = fi(frame, T.loopStart + i * 12, 12);
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              opacity: agentFadeIn,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                backgroundColor: a.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 2px 12px ${a.color}60`,
                border: "1px solid rgba(255,255,255,0.12)",
                flexShrink: 0,
              }}
            >
              {a.icon}
            </div>
            <span
              style={{
                fontSize: 14,
                fontFamily: FONT_FAMILY,
                fontWeight: 500,
                color: "#888899",
                letterSpacing: 0.5,
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

// ─── Flow arrows (drawn between nodes, animating once labels appear) ──────────
const FlowArrows: React.FC<{ frame: number }> = ({ frame }) => {
  const op = fi(frame, T.labelsIn + 14, 14);
  if (op < 0.01) return null;

  // Small arrows between the white circles (inside the orange pill)
  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      viewBox="0 0 1920 1080"
    >
      <defs>
        <marker id="fa-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 Z" fill={`rgba(255,255,255,0.5)`} />
        </marker>
      </defs>
      {/* PLAN → CODE */}
      <line
        x1={PLAN_X + NODE_R + 6} y1={CY}
        x2={CODE_X - NODE_R - 6} y2={CY}
        stroke="rgba(255,255,255,0.38)"
        strokeWidth="1.8"
        markerEnd="url(#fa-arr)"
        opacity={op}
        strokeDasharray="6 4"
      />
      {/* CODE → REVIEW */}
      <line
        x1={CODE_X + NODE_R + 6} y1={CY}
        x2={REVIEW_X - NODE_R - 6} y2={CY}
        stroke="rgba(255,255,255,0.38)"
        strokeWidth="1.8"
        markerEnd="url(#fa-arr)"
        opacity={op}
        strokeDasharray="6 4"
      />
    </svg>
  );
};

// ─── Background ───────────────────────────────────────────────────────────────
const Background: React.FC = () => (
  <>
    <div style={{ position: "absolute", inset: 0, backgroundColor: CR_DARK }} />
    {/* Fine grid */}
    <div
      style={{
        position: "absolute", inset: 0, opacity: 0.045,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
      }}
    />
    {/* Diagonal accent lines */}
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} viewBox="0 0 1920 1080" preserveAspectRatio="none">
      <line x1="960" y1="0" x2="0"    y2="1080" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <line x1="960" y1="0" x2="1920" y2="1080" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <line x1="960" y1="0" x2="380"  y2="1080" stroke="rgba(255,255,255,0.032)" strokeWidth="1" />
      <line x1="960" y1="0" x2="1540" y2="1080" stroke="rgba(255,255,255,0.032)" strokeWidth="1" />
    </svg>
    {/* Radial vignette glow */}
    <div
      style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at 50% 50%, ${CR_ORANGE}0A 0%, transparent 62%)`,
      }}
    />
  </>
);

// ─── Stage label (bottom-left, changes per phase) ─────────────────────────────
const StageLabel: React.FC<{ frame: number }> = ({ frame }) => {
  const stages: { start: number; end: number; text: string }[] = [
    { start: T.circleIn,   end: T.morphStart - 1,    text: "CodeRabbit" },
    { start: T.morphStart, end: T.dotsGrow - 1,      text: "Expanding loop..." },
    { start: T.dotsGrow,   end: T.labelsIn - 1,      text: "Plan · Code · Review" },
    { start: T.labelsIn,   end: T.loopStart - 1,     text: "Plan · Code · Review" },
    { start: T.loopStart,  end: 9999,                 text: "Agents in the loop" },
  ];
  const active = stages.find(s => frame >= s.start && frame <= s.end);
  if (!active) return null;
  const op = Math.min(fi(frame, active.start, 12), interpolate(frame, [active.end - 8, active.end], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));

  return (
    <div
      style={{
        position: "absolute",
        bottom: 72,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity: op,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontSize: 18,
          fontFamily: FONT_FAMILY,
          fontWeight: 500,
          color: CR_DIM,
          letterSpacing: 2,
        }}
      >
        {active.text}
      </div>
    </div>
  );
};

// ─── Main composition ─────────────────────────────────────────────────────────
export const RabbitAgentLoopViz: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Compute agent tokens (only after loop starts)
  const agentTokens: React.ReactNode[] = [];
  if (frame >= T.loopStart) {
    for (let i = 0; i < NUM_AGENTS; i++) {
      const raw = (frame - T.loopStart) - i * LOOP_STAGGER;
      if (raw < 0) continue; // not started yet
      const loopFrame = raw % LOOP_CYCLE;
      agentTokens.push(
        <AgentToken
          key={i}
          agentIdx={i}
          frame={frame}
          fps={fps}
          loopFrame={loopFrame}
        />
      );
    }
  }

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background />
      <PillAndNodes frame={frame} fps={fps} />
      <FlowArrows frame={frame} />
      {agentTokens}
      <AgentStrip frame={frame} />
      <StageLabel frame={frame} />
    </AbsoluteFill>
  );
};
