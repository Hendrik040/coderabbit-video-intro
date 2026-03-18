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
const CR = {
  primary:  "#FF570A",   // orange
  teal:     "#25BAB1",   // teal (outer loop)
  dark:     "#16161E",   // near-black bg (from brand guide)
  card:     "#1C1C28",   // card bg
  border:   "#2D2D3D",   // subtle border
  cream:    "#F6F6F1",   // text
  dim:      "#555566",   // muted text
  mid:      "#888899",   // secondary text
};

// ─── Timing (frames @ 30 fps, total 450 = 15 s) ───────────────────────────────
const T = {
  // Scene 1 — Inner/Outer Loop diagram
  s1In:           0,
  s1InnerDraw:    0,    // ring draws in, dur 32f
  s1OuterDraw:    22,   // staggered, dur 32f
  s1InnerLabels:  32,   // 4 labels × 9f stagger
  s1OuterLabels:  58,   // 5 labels × 9f stagger
  s1Arrows:       72,   // flow arrows draw, dur 20f
  s1CaptionIn:    88,
  s1ZoomInner:    92,   // dur 22f
  s1PanOuter:     114,  // dur 22f
  s1CaptionOut:   122,
  s1FadeOut:      132,  // dur 12f
  s1End:          144,

  // Scene 2 — Code Review flow (all drawn)
  s2In:           152,
  s2Node0:        162,
  s2Node1:        174,
  s2Node2:        186,
  s2DashStart:    194,  // 3 paths, 8f stagger each, dur 42f each
  s2Card:         218,
  s2CaptionIn:    232,
  s2Chip:         242,
  s2CaptionOut:   268,
  s2FadeOut:      278,
  s2End:          290,

  // Scene 3 — Integrations hub (all drawn)
  s3In:           298,
  s3Hub:          310,
  s3Line0:        322,  // GitHub
  s3Line1:        330,  // GitLab
  s3Line2:        338,  // Linear
  s3Line3:        346,  // Jira
  s3Icon0:        334,
  s3Icon1:        342,
  s3Icon2:        350,
  s3Icon3:        358,
  s3CaptionIn:    362,
  s3CaptionOut:   392,
  s3FadeOut:      403,
  s3End:          415,

  // Scene 4 — CTA
  s4In:           423,
  s4Line1:        426,
  s4Line2:        436,
  s4Logo:         444,
};

export const INNER_OUTER_LOOP_VIZ_TOTAL_FRAMES = 450;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fi(frame: number, start: number, dur = 15) {
  return interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}
function fo(frame: number, start: number, dur = 12) {
  return interpolate(frame, [start, start + dur], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}
function rimPos(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// ─── Shared grid background ───────────────────────────────────────────────────
const GridBg: React.FC<{ accentColor?: string }> = ({ accentColor = CR.primary }) => (
  <>
    <div style={{ position: "absolute", inset: 0, backgroundColor: CR.dark }} />
    {/* Fine grid */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: 0.055,
        backgroundImage: `
          linear-gradient(${CR.cream}22 1px, transparent 1px),
          linear-gradient(90deg, ${CR.cream}22 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
      }}
    />
    {/* Diagonal accent lines (brand style) */}
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} viewBox="0 0 1920 1080" preserveAspectRatio="none">
      <line x1="960" y1="0" x2="0"    y2="1080" stroke={`${CR.cream}08`} strokeWidth="1" />
      <line x1="960" y1="0" x2="1920" y2="1080" stroke={`${CR.cream}08`} strokeWidth="1" />
      <line x1="960" y1="0" x2="480"  y2="1080" stroke={`${CR.cream}05`} strokeWidth="1" />
      <line x1="960" y1="0" x2="1440" y2="1080" stroke={`${CR.cream}05`} strokeWidth="1" />
    </svg>
    {/* Radial glow */}
    <div
      style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at 50% 50%, ${accentColor}09 0%, transparent 60%)`,
      }}
    />
  </>
);

// ─── Caption ─────────────────────────────────────────────────────────────────
const Caption: React.FC<{ text: string; opacity: number }> = ({ text, opacity }) => (
  <div
    style={{
      position: "absolute", bottom: 58, left: 0, right: 0,
      display: "flex", justifyContent: "center",
      opacity, pointerEvents: "none",
    }}
  >
    <div
      style={{
        backgroundColor: "rgba(22,22,30,0.88)",
        padding: "14px 48px",
        borderRadius: 14,
        fontSize: 34,
        fontFamily: FONT_FAMILY,
        fontWeight: 500,
        color: CR.cream,
        letterSpacing: -0.3,
        border: `1px solid ${CR.primary}28`,
        boxShadow: `0 0 24px ${CR.primary}18`,
      }}
    >
      {text}
    </div>
  </div>
);

// ─── CodeRabbit rabbit SVG (matches brand guide — sitting rabbit silhouette) ──
const RabbitMark: React.FC<{ size: number; color?: string }> = ({ size, color = CR.primary }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    {/* Body */}
    <ellipse cx="50" cy="65" rx="26" ry="22" fill={color} />
    {/* Head */}
    <circle cx="50" cy="42" r="18" fill={color} />
    {/* Left ear (longer) */}
    <ellipse cx="40" cy="18" rx="7" ry="18" fill={color} />
    {/* Right ear */}
    <ellipse cx="58" cy="20" rx="6" ry="14" fill={color} />
    {/* Inner ear left */}
    <ellipse cx="40" cy="18" rx="3.5" ry="11" fill={`${color}55`} />
    {/* Eye */}
    <circle cx="55" cy="40" r="3.5" fill="white" opacity={0.9} />
    {/* Nose */}
    <circle cx="56" cy="49" r="2" fill={color === CR.primary ? "#FF8C57" : "white"} opacity={0.7} />
    {/* Front paw */}
    <ellipse cx="38" cy="84" rx="8" ry="5" fill={color} />
    <ellipse cx="56" cy="84" rx="8" ry="5" fill={color} />
    {/* Tail */}
    <circle cx="74" cy="68" r="9" fill={color} opacity={0.7} />
  </svg>
);

// ─── SCENE 1 : Inner / Outer Loop Diagram ─────────────────────────────────────
const LoopDiagram: React.FC<{ frame: number }> = ({ frame }) => {
  const sceneOp  = fi(frame, T.s1In, 16);
  const fadeOut  = fo(frame, T.s1FadeOut, 12);
  const env      = sceneOp * fadeOut;

  // Ring draw-in progress
  const IC = { x: 540, y: 540, r: 240 };
  const OC = { x: 1360, y: 540, r: 310 };
  const iCirc = 2 * Math.PI * IC.r; // ~1508
  const oCirc = 2 * Math.PI * OC.r; // ~1947

  const innerDraw = interpolate(frame, [T.s1InnerDraw, T.s1InnerDraw + 32], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const outerDraw = interpolate(frame, [T.s1OuterDraw, T.s1OuterDraw + 32], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Camera zoom/pan
  const zoomT = interpolate(frame, [T.s1ZoomInner, T.s1ZoomInner + 22], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const panT = interpolate(frame, [T.s1PanOuter, T.s1PanOuter + 22], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const scale = 1 + zoomT * 0.20 - panT * 0.10;
  const tx    = -zoomT * 200 + panT * 380;

  const innerHL = zoomT * (1 - panT);
  const outerHL = panT;

  const captionOp = fi(frame, T.s1CaptionIn, 10) * fo(frame, T.s1CaptionOut, 10);

  // Arrow draw-in
  const arrowDraw = fi(frame, T.s1Arrows, 20);

  // Inner rim labels
  const innerLabels = [
    { text: "BUILD", angle: -130 },
    { text: "PUSH",  angle: -42  },
    { text: "CODE",  angle:  42  },
    { text: "DEBUG", angle: 130  },
  ];
  // Outer rim labels
  const outerLabels = [
    { text: "TEST",          angle: -140 },
    { text: "DATA",          angle:  -28 },
    { text: "ENVIRONMENTS",  angle:   28 },
    { text: "MONITORING",    angle:  108 },
    { text: "REQUIREMENTS",  angle:  158 },
  ];

  const innerColor = CR.primary;
  const outerColor = CR.teal;

  // Ring glow intensity
  const innerGlowStd = innerHL * 18;
  const outerGlowStd = outerHL * 18;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: env, overflow: "hidden" }}>
      <GridBg accentColor={CR.primary} />

      {/* Zoom / pan wrapper */}
      <div
        style={{
          position: "absolute", inset: 0,
          transform: `scale(${scale}) translateX(${tx}px)`,
          transformOrigin: "center center",
        }}
      >
        <svg
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Gradient strokes */}
            <linearGradient id="s1-iStroke" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF570A" />
              <stop offset="100%" stopColor="#FF8C57" />
            </linearGradient>
            <linearGradient id="s1-oStroke" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#25BAB1" />
              <stop offset="100%" stopColor="#1A8A86" />
            </linearGradient>
            {/* Ring fills */}
            <radialGradient id="s1-iFill" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#FF570A" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#FF570A" stopOpacity="0.02" />
            </radialGradient>
            <radialGradient id="s1-oFill" cx="60%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#25BAB1" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#25BAB1" stopOpacity="0.02" />
            </radialGradient>
            {/* Glow filters */}
            <filter id="s1-iGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation={innerGlowStd} result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="s1-oGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation={outerGlowStd} result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            {/* Arrow marker */}
            <marker id="s1-arr" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
              <path d="M0,0 L0,7 L7,3.5 z" fill="rgba(255,255,255,0.38)" />
            </marker>
          </defs>

          {/* ── Inner circle fill ── */}
          <circle cx={IC.x} cy={IC.y} r={IC.r} fill="url(#s1-iFill)" />

          {/* ── Inner circle ring (draw-in) ── */}
          <circle
            cx={IC.x} cy={IC.y} r={IC.r}
            fill="none"
            stroke="url(#s1-iStroke)"
            strokeWidth={4 + innerHL * 6}
            strokeDasharray={iCirc}
            strokeDashoffset={iCirc * (1 - innerDraw)}
            strokeLinecap="round"
            transform={`rotate(-90, ${IC.x}, ${IC.y})`}
            filter={innerHL > 0.15 ? "url(#s1-iGlow)" : undefined}
          />

          {/* ── Outer circle fill ── */}
          <circle cx={OC.x} cy={OC.y} r={OC.r} fill="url(#s1-oFill)" />

          {/* ── Outer circle ring (draw-in) ── */}
          <circle
            cx={OC.x} cy={OC.y} r={OC.r}
            fill="none"
            stroke="url(#s1-oStroke)"
            strokeWidth={4 + outerHL * 6}
            strokeDasharray={oCirc}
            strokeDashoffset={oCirc * (1 - outerDraw)}
            strokeLinecap="round"
            transform={`rotate(-90, ${OC.x}, ${OC.y})`}
            filter={outerHL > 0.15 ? "url(#s1-oGlow)" : undefined}
          />

          {/* ── Flow arrows ── */}
          {arrowDraw > 0 && (
            <>
              <path
                d={`M ${IC.x + IC.r * 0.62} ${IC.y - 52} Q 950 370 ${OC.x - OC.r * 0.55} ${OC.y - 85}`}
                fill="none" stroke="rgba(255,255,255,0.35)"
                strokeWidth="1.8" strokeDasharray="10 6" markerEnd="url(#s1-arr)"
                strokeDashoffset={600 * (1 - arrowDraw)}
                strokeLinecap="round" opacity={arrowDraw}
              />
              <path
                d={`M ${OC.x - OC.r * 0.55} ${OC.y + 85} Q 950 710 ${IC.x + IC.r * 0.62} ${IC.y + 52}`}
                fill="none" stroke="rgba(255,255,255,0.35)"
                strokeWidth="1.8" strokeDasharray="10 6" markerEnd="url(#s1-arr)"
                strokeDashoffset={600 * (1 - arrowDraw)}
                strokeLinecap="round" opacity={arrowDraw}
              />
            </>
          )}

          {/* ── Inner center label ── */}
          <text
            x={IC.x} y={IC.y + 10}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="24" fontWeight="700"
            fontFamily="'Inter', sans-serif"
            letterSpacing="3.5"
            fill={innerColor} opacity={innerDraw * 0.95}
          >
            INNER LOOP
          </text>

          {/* ── Outer center label ── */}
          <text
            x={OC.x} y={OC.y + 10}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="26" fontWeight="700"
            fontFamily="'Inter', sans-serif"
            letterSpacing="3.5"
            fill={outerColor} opacity={outerDraw * 0.95}
          >
            OUTER LOOP
          </text>

          {/* ── Inner rim labels ── */}
          {innerLabels.map(({ text, angle }, i) => {
            const p   = rimPos(IC.x, IC.y, IC.r + 52, angle);
            const op  = fi(frame, T.s1InnerLabels + i * 9, 10);
            return (
              <text
                key={text} x={p.x} y={p.y}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="19" fontWeight="700"
                fontFamily="'Inter', sans-serif"
                letterSpacing="2.5"
                fill={innerColor} opacity={op * 0.88}
              >
                {text}
              </text>
            );
          })}

          {/* ── Outer rim labels ── */}
          {outerLabels.map(({ text, angle }, i) => {
            const p   = rimPos(OC.x, OC.y, OC.r + 60, angle);
            const op  = fi(frame, T.s1OuterLabels + i * 9, 10);
            return (
              <text
                key={text} x={p.x} y={p.y}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="17" fontWeight="700"
                fontFamily="'Inter', sans-serif"
                letterSpacing="2"
                fill={outerColor} opacity={op * 0.88}
              >
                {text}
              </text>
            );
          })}
        </svg>
      </div>

      <Caption text="Inner loop → Outer loop" opacity={captionOp} />
    </div>
  );
};

// ─── SCENE 2 : Code Review Flow (fully drawn) ────────────────────────────────
const CodeReviewFlow: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const sceneOp  = fi(frame, T.s2In, 14);
  const fadeOut  = fo(frame, T.s2FadeOut, 12);
  const env      = sceneOp * fadeOut;
  const captionOp = fi(frame, T.s2CaptionIn, 10) * fo(frame, T.s2CaptionOut, 12);

  // Dev node positions
  const nodes = [
    { cx: 280, cy: 248, at: T.s2Node0 },
    { cx: 280, cy: 540, at: T.s2Node1 },
    { cx: 280, cy: 832, at: T.s2Node2 },
  ];
  const nodeR = 54;
  const cardX = 1110; // left edge of Code Review card
  const cardCY = 540;

  // Paths from each node right-edge to card left-edge
  const paths = nodes.map((n, i) => {
    const sx = n.cx + nodeR;
    const sy = n.cy;
    const ex = cardX;
    const ey = cardCY;
    const cpy = (sy + ey) / 2 + (i === 0 ? -60 : i === 2 ? 60 : 0);
    const cpx = (sx + ex) / 2 + 20;
    return {
      d: `M ${sx} ${sy} Q ${cpx} ${cpy} ${ex} ${ey}`,
      len: i === 1 ? 835 : 920,
      stagger: i * 8,
    };
  });

  // Card spring
  const cardSc = spring({ frame: Math.max(0, frame - T.s2Card), fps, config: { damping: 10, stiffness: 100 } });
  const cardOp = fi(frame, T.s2Card, 12);

  // Chip spring
  const chipSc = spring({ frame: Math.max(0, frame - T.s2Chip), fps, config: { damping: 9, stiffness: 140 } });
  const chipOp = fi(frame, T.s2Chip, 12);

  return (
    <div style={{ position: "absolute", inset: 0, opacity: env, overflow: "hidden" }}>
      <GridBg accentColor={CR.primary} />

      {/* ── SVG layer: nodes + paths ── */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <radialGradient id="s2-devGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FF8C57" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#FF570A" stopOpacity="0.08" />
          </radialGradient>
          <filter id="s2-nodeGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Animated orange dash paths */}
        {paths.map((p, i) => {
          const drawProg = interpolate(
            frame,
            [T.s2DashStart + p.stagger, T.s2DashStart + p.stagger + 42],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) }
          );
          const scrollOffset = -((frame - T.s2DashStart) * 3.8) + i * 22;
          return (
            <g key={i}>
              {/* Glow trail */}
              <path
                d={p.d} fill="none"
                stroke={CR.primary} strokeWidth="10"
                strokeDasharray={p.len} strokeDashoffset={p.len * (1 - drawProg)}
                strokeLinecap="round" opacity={0.10}
              />
              {/* Running dashes */}
              <path
                d={p.d} fill="none"
                stroke={CR.primary} strokeWidth="3"
                strokeDasharray="18 14"
                strokeDashoffset={scrollOffset}
                strokeLinecap="round"
                opacity={drawProg * 0.88}
                clipPath={`url(#s2-clip${i})`}
              />
              {/* Clip to drawn portion */}
              <clipPath id={`s2-clip${i}`}>
                <path
                  d={p.d}
                  fill="none" stroke="white" strokeWidth="20"
                  strokeDasharray={p.len} strokeDashoffset={p.len * (1 - drawProg)}
                />
              </clipPath>
            </g>
          );
        })}

        {/* Pulse at convergence point */}
        {frame >= T.s2DashStart + 30 && (
          <circle
            cx={cardX} cy={cardCY}
            r={20 + (frame % 24) * 2.2}
            fill="none" stroke={CR.primary} strokeWidth="1.5"
            opacity={Math.max(0, 1 - (frame % 24) / 24) * 0.55}
          />
        )}

        {/* Orange dot at junction */}
        {frame >= T.s2DashStart + 30 && (
          <circle cx={cardX} cy={cardCY} r="6" fill={CR.primary} opacity={0.9} />
        )}

        {/* Dev nodes */}
        {nodes.map((n, i) => {
          const sc = spring({ frame: Math.max(0, frame - n.at), fps, config: { damping: 11, stiffness: 120 } });
          const op = fi(frame, n.at, 12);
          return (
            <g key={i} transform={`translate(${n.cx}, ${n.cy})`} opacity={op}>
              <g transform={`scale(${Math.max(0, sc)})`}>
                {/* Outer glow ring */}
                <circle r={nodeR + 6} fill="none" stroke={CR.primary} strokeWidth="1" opacity={0.25} />
                {/* Main circle */}
                <circle r={nodeR} fill="url(#s2-devGrad)" stroke={CR.primary} strokeWidth="1.8" />
                {/* </> icon */}
                <text
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize="22" fontWeight="500"
                  fontFamily={FONT_FAMILY}
                  fill={CR.primary} opacity={0.9}
                >
                  {"</>"}
                </text>
              </g>
              {/* Label below */}
              <text
                y={nodeR + 26} textAnchor="middle"
                fontSize="15" fontFamily="'Inter', sans-serif" fontWeight="600"
                fill={CR.mid} letterSpacing="0.5"
                opacity={fi(frame, n.at + 8, 10)}
              >
                Dev {i + 1}
              </text>
            </g>
          );
        })}
      </svg>

      {/* ── Code Review card (HTML) ── */}
      {frame >= T.s2Card - 4 && (
        <div
          style={{
            position: "absolute",
            left: cardX + 20,
            top: cardCY - 140,
            width: 400,
            opacity: cardOp,
            transform: `scale(${Math.max(0, cardSc)})`,
            transformOrigin: "left center",
          }}
        >
          <div
            style={{
              backgroundColor: CR.card,
              border: `1.5px solid ${CR.primary}`,
              borderRadius: 16,
              padding: "22px 28px",
              boxShadow: `0 0 40px ${CR.primary}22, 0 12px 48px rgba(0,0,0,0.65)`,
            }}
          >
            {/* Header */}
            <div
              style={{
                fontSize: 11, fontFamily: FONT_FAMILY, fontWeight: 500,
                color: CR.primary, letterSpacing: 2.5, marginBottom: 12,
              }}
            >
              CODE REVIEW
            </div>
            <div style={{ height: 1, backgroundColor: CR.border, marginBottom: 16 }} />
            {/* Review rows */}
            {[
              "Null pointer check missing on L42",
              "Extract repeated logic into helper",
              "Add error handling for API failure",
            ].map((line, i) => (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  marginBottom: 12,
                  opacity: fi(frame, T.s2Card + 8 + i * 10, 10),
                }}
              >
                <div
                  style={{
                    width: 6, height: 6, borderRadius: "50%",
                    backgroundColor: CR.primary,
                    flexShrink: 0, marginTop: 5,
                  }}
                />
                <span
                  style={{
                    fontSize: 13, fontFamily: FONT_FAMILY, fontWeight: 500,
                    color: CR.mid, lineHeight: 1.5,
                  }}
                >
                  {line}
                </span>
              </div>
            ))}
            {/* LGTM badge */}
            <div
              style={{
                marginTop: 16, paddingTop: 14,
                borderTop: `1px solid ${CR.border}`,
                display: "flex", alignItems: "center", gap: 10,
                opacity: fi(frame, T.s2Card + 36, 10),
              }}
            >
              <div
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  backgroundColor: "#25BAB115",
                  border: `1px solid ${CR.teal}50`,
                  borderRadius: 8, padding: "6px 14px",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12">
                  <circle cx="6" cy="6" r="5.5" fill={CR.teal} opacity={0.18} />
                  <path d="M3 6 L5 8.2 L9.2 3.8" stroke={CR.teal} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ fontSize: 12, color: CR.teal, fontFamily: FONT_FAMILY, fontWeight: 500 }}>
                  LGTM · ready to merge
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── One-click apply chip ── */}
      {frame >= T.s2Chip && (
        <div
          style={{
            position: "absolute",
            left: cardX + 20,
            top: cardCY + 120,
            opacity: chipOp,
            transform: `scale(${Math.max(0, chipSc)})`,
            transformOrigin: "left top",
          }}
        >
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: 14,
              backgroundColor: CR.dark,
              border: `1.5px solid ${CR.primary}`,
              borderRadius: 50,
              padding: "12px 24px",
              boxShadow: `0 0 28px ${CR.primary}35`,
            }}
          >
            <div
              style={{
                width: 32, height: 32, borderRadius: "50%",
                backgroundColor: CR.primary,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 7 L5.8 10.5 L11.5 4.2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span style={{ fontSize: 16, fontFamily: FONT_FAMILY, fontWeight: 500, color: CR.cream }}>
              Apply fix · one click
            </span>
          </div>
        </div>
      )}

      <Caption text="Instant AI review + fixes" opacity={captionOp} />
    </div>
  );
};

// ─── Brand integration icons (matching brand guide style) ────────────────────
// Brand guide: dark bg panel, muted gray icons — we'll use full-color versions
// with white bg circles (as shown for the integration connectors)

const LinearBrandIcon: React.FC<{ size: number }> = ({ size }) => (
  // Linear: circle with 3 diagonal parallel lines (as shown in brand guide)
  <svg width={size} height={size} viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="18" fill="#111" />
    <circle cx="20" cy="20" r="18" fill="none" stroke="#444" strokeWidth="1" />
    {/* Diagonal stripes */}
    <clipPath id="li-clip"><circle cx="20" cy="20" r="16" /></clipPath>
    <g clipPath="url(#li-clip)" opacity="0.85">
      <line x1="4"  y1="28" x2="28" y2="4"  stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="12" y1="36" x2="36" y2="12" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="-4" y1="20" x2="20" y2="-4" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
    </g>
  </svg>
);

const JiraBrandIcon: React.FC<{ size: number }> = ({ size }) => (
  // Jira: rotated diamond/square as in brand guide
  <svg width={size} height={size} viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="18" fill="#111" />
    <circle cx="20" cy="20" r="18" fill="none" stroke="#444" strokeWidth="1" />
    <g transform="translate(20,20) rotate(45)" opacity="0.85">
      <rect x="-9" y="-9" width="18" height="18" fill="none" stroke="white" strokeWidth="3" />
      <rect x="-4" y="-4" width="8"  height="8"  fill="white" />
    </g>
  </svg>
);

const GitHubBrandIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="18" fill="#111" />
    <circle cx="20" cy="20" r="18" fill="none" stroke="#444" strokeWidth="1" />
    <g transform="translate(9,9)" opacity="0.85">
      <path
        fill="white"
        d="M11 1.5C5.75 1.5 1.5 5.75 1.5 11c0 4.14 2.69 7.65 6.43 8.89.47.09.64-.2.64-.45 0-.22-.01-.81-.01-1.59-2.6.57-3.15-1.25-3.15-1.25-.43-1.08-1.04-1.37-1.04-1.37-.85-.58.07-.57.07-.57.94.07 1.44.97 1.44.97.84 1.43 2.19 1.02 2.73.78.08-.6.33-1.02.6-1.25-2.08-.24-4.27-1.04-4.27-4.63 0-1.02.37-1.86.97-2.51-.1-.24-.42-1.19.09-2.48 0 0 .79-.25 2.58.97A8.97 8.97 0 0111 7.1c.8.004 1.6.11 2.34.32 1.79-1.22 2.58-.97 2.58-.97.51 1.29.19 2.24.09 2.48.6.66.97 1.49.97 2.51 0 3.6-2.2 4.39-4.29 4.62.34.29.64.86.64 1.74 0 1.25-.01 2.26-.01 2.57 0 .25.17.55.65.45C18.81 18.65 21.5 15.14 21.5 11c0-5.25-4.25-9.5-9.5-9.5l-.5-.5.5.5z"
      />
    </g>
  </svg>
);

const GitLabBrandIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="18" fill="#111" />
    <circle cx="20" cy="20" r="18" fill="none" stroke="#444" strokeWidth="1" />
    <g transform="translate(9, 9)" opacity="0.85">
      <path
        d="M11 20.5l-3.29-10.1-.01-.03-1.83-5.64a.45.45 0 00-.86 0L3.18 10.37 1 17.4a.9.9 0 00.33 1.01L11 25.5l9.67-7.09A.9.9 0 0021 17.4l-2.18-7.03-1.83-5.64a.45.45 0 00-.86 0l-1.83 5.64L11 20.5z"
        fill="white"
        transform="translate(0, -3) scale(0.95)"
      />
    </g>
  </svg>
);

// ─── SCENE 3 : Integrations Hub (fully drawn) ────────────────────────────────
const IntegrationsHub: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const sceneOp  = fi(frame, T.s3In, 14);
  const fadeOut  = fo(frame, T.s3FadeOut, 12);
  const env      = sceneOp * fadeOut;
  const captionOp = fi(frame, T.s3CaptionIn, 10) * fo(frame, T.s3CaptionOut, 12);

  // Hub pill geometry
  const HUB_CX = 640;
  const HUB_CY = 540;
  const HUB_W  = 310;
  const HUB_H  = 86;

  // Junction node
  const JX = 1020;
  const JY = 540;

  // Integration positions
  const integrations = [
    { icon: <GitHubBrandIcon size={40} />,  label: "GitHub",  x: 1280, y: 230,  lineAt: T.s3Line0, iconAt: T.s3Icon0 },
    { icon: <GitLabBrandIcon size={40} />,  label: "GitLab",  x: 1530, y: 400,  lineAt: T.s3Line1, iconAt: T.s3Icon1 },
    { icon: <LinearBrandIcon size={40} />,  label: "Linear",  x: 1530, y: 680,  lineAt: T.s3Line2, iconAt: T.s3Icon2 },
    { icon: <JiraBrandIcon size={40} />,    label: "Jira",    x: 1280, y: 850,  lineAt: T.s3Line3, iconAt: T.s3Icon3 },
  ];

  // Hub spring
  const hubSc = spring({ frame: Math.max(0, frame - T.s3Hub), fps, config: { damping: 12, stiffness: 100 } });
  const hubOp = fi(frame, T.s3Hub, 12);
  const hubPulse = Math.sin(frame * 0.12) * 0.5 + 0.5;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: env, overflow: "hidden" }}>
      <GridBg accentColor={CR.primary} />

      {/* SVG lines layer */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Hub → junction horizontal line (draws left-to-right) */}
        {(() => {
          // Compute line progress based on the first integration line starting
          const lineProg = fi(frame, T.s3Line0, 20);
          const lineLen = JX - (HUB_CX + HUB_W / 2);
          return (
            <line
              x1={HUB_CX + HUB_W / 2} y1={HUB_CY}
              x2={JX} y2={JY}
              stroke={CR.primary} strokeWidth="2.5"
              strokeDasharray={lineLen}
              strokeDashoffset={lineLen * (1 - lineProg)}
              strokeLinecap="round" opacity={0.85}
            />
          );
        })()}

        {/* Junction → each icon */}
        {integrations.map((int, i) => {
          const lineLen = Math.hypot(int.x - JX, int.y - JY) + 10;
          const lineProg = interpolate(frame, [int.lineAt, int.lineAt + 28], [0, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
            easing: Easing.out(Easing.quad),
          });
          if (lineProg === 0) return null;
          return (
            <line
              key={i}
              x1={JX} y1={JY}
              x2={int.x} y2={int.y}
              stroke={CR.primary} strokeWidth="2.5"
              strokeDasharray={lineLen}
              strokeDashoffset={lineLen * (1 - lineProg)}
              strokeLinecap="round" opacity={0.85}
            />
          );
        })}

        {/* Junction orange dot */}
        {frame >= T.s3Line0 + 5 && (
          <>
            <circle cx={JX} cy={JY} r="10" fill={CR.dark} stroke={CR.primary} strokeWidth="2" />
            <circle cx={JX} cy={JY} r="5"  fill={CR.primary} opacity={0.9} />
          </>
        )}

        {/* Pulse ring at junction */}
        {frame >= T.s3Line0 + 5 && (
          <circle
            cx={JX} cy={JY}
            r={18 + (frame % 28) * 1.5}
            fill="none" stroke={CR.primary} strokeWidth="1.2"
            opacity={Math.max(0, 1 - (frame % 28) / 28) * 0.4}
          />
        )}
      </svg>

      {/* Hub pill */}
      {frame >= T.s3Hub - 4 && (
        <div
          style={{
            position: "absolute",
            left: HUB_CX - HUB_W / 2,
            top: HUB_CY - HUB_H / 2,
            width: HUB_W, height: HUB_H,
            opacity: hubOp,
            transform: `scale(${Math.max(0, hubSc)})`,
            transformOrigin: "center center",
          }}
        >
          <div
            style={{
              width: "100%", height: "100%",
              backgroundColor: CR.card,
              border: `2px solid ${CR.primary}`,
              borderRadius: HUB_H / 2,
              display: "flex", alignItems: "center",
              justifyContent: "center", gap: 14,
              boxShadow: `0 0 ${20 + hubPulse * 18}px ${CR.primary}45, 0 8px 32px rgba(0,0,0,0.7)`,
            }}
          >
            {/* Rabbit mark */}
            <RabbitMark size={36} color={CR.primary} />
            <span
              style={{
                fontSize: 18, fontFamily: FONT_FAMILY, fontWeight: 500,
                color: CR.cream, letterSpacing: 0.5,
              }}
            >
              CodeRabbit
            </span>
          </div>
        </div>
      )}

      {/* Integration icons */}
      {integrations.map((int, i) => {
        const sc = spring({ frame: Math.max(0, frame - int.iconAt), fps, config: { damping: 10, stiffness: 140 } });
        const op = fi(frame, int.iconAt, 12);
        const pulse = Math.sin((frame - int.iconAt) * 0.14) * 0.5 + 0.5;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: int.x, top: int.y,
              transform: `translate(-50%, -50%) scale(${Math.max(0, sc)})`,
              opacity: op,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
            }}
          >
            {/* Icon circle */}
            <div
              style={{
                width: 68, height: 68, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 0 ${14 + pulse * 12}px ${CR.primary}50, 0 4px 20px rgba(0,0,0,0.5)`,
                border: `1.5px solid ${CR.primary}`,
                backgroundColor: CR.card,
              }}
            >
              {int.icon}
            </div>
            {/* Label */}
            <div
              style={{
                fontSize: 15, fontFamily: FONT_FAMILY, fontWeight: 500,
                color: CR.cream,
                backgroundColor: "rgba(22,22,30,0.85)",
                padding: "4px 14px", borderRadius: 8,
                whiteSpace: "nowrap",
              }}
            >
              {int.label}
            </div>
          </div>
        );
      })}

      <Caption text="Connect Linear, Jira, GitHub, GitLab" opacity={captionOp} />
    </div>
  );
};

// ─── SCENE 4 : CTA ────────────────────────────────────────────────────────────
const CTA: React.FC<{ frame: number }> = ({ frame }) => {
  const sceneOp = fi(frame, T.s4In, 14);
  const line1Op = fi(frame, T.s4Line1, 14);
  const line2Op = fi(frame, T.s4Line2, 12);
  const logoOp  = fi(frame, T.s4Logo, 10);

  return (
    <div
      style={{
        position: "absolute", inset: 0,
        opacity: sceneOp,
        backgroundColor: CR.dark,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}
    >
      <GridBg />
      {/* Top accent */}
      <div
        style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, transparent, ${CR.primary}, ${CR.teal}, transparent)`,
        }}
      />

      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-start" }}>
        <div style={{ opacity: line1Op, display: "flex", alignItems: "baseline", gap: 18 }}>
          <span style={{ fontSize: 56, fontFamily: FONT_FAMILY, fontWeight: 500, color: CR.primary }}>
            Inner loop:
          </span>
          <span style={{ fontSize: 56, fontFamily: FONT_FAMILY, fontWeight: 500, color: CR.cream }}>
            faster flow.
          </span>
        </div>
        <div style={{ opacity: line2Op, display: "flex", alignItems: "baseline", gap: 18 }}>
          <span style={{ fontSize: 56, fontFamily: FONT_FAMILY, fontWeight: 500, color: CR.teal }}>
            Outer loop:
          </span>
          <span style={{ fontSize: 56, fontFamily: FONT_FAMILY, fontWeight: 500, color: CR.cream }}>
            aligned releases.
          </span>
        </div>

        {/* Logo + URL */}
        <div
          style={{
            opacity: logoOp, marginTop: 48,
            display: "flex", alignItems: "center", gap: 20,
          }}
        >
          <div
            style={{
              width: 52, height: 52, borderRadius: "50%",
              backgroundColor: CR.primary,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <RabbitMark size={34} color="white" />
          </div>
          <span style={{ fontSize: 28, fontFamily: FONT_FAMILY, fontWeight: 500, color: CR.dim }}>
            coderabbit.ai
          </span>
        </div>
      </div>

      {/* Bottom accent */}
      <div
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, transparent, ${CR.teal}, ${CR.primary}, transparent)`,
        }}
      />
    </div>
  );
};

// ─── Black flash between scenes ───────────────────────────────────────────────
function sceneTransitionOpacity(frame: number, outStart: number, inStart: number) {
  const fadeOut = interpolate(frame, [outStart, outStart + 8], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const fadeIn  = interpolate(frame, [inStart - 8, inStart], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  return Math.min(fadeOut, fadeIn);
}

// ─── Main composition ─────────────────────────────────────────────────────────
export const InnerOuterLoopViz: React.FC = () => {
  const frame = useCurrentFrame();

  const flash1 = sceneTransitionOpacity(frame, T.s1FadeOut, T.s2In);
  const flash2 = sceneTransitionOpacity(frame, T.s2FadeOut, T.s3In);
  const flash3 = sceneTransitionOpacity(frame, T.s3FadeOut, T.s4In);

  return (
    <AbsoluteFill style={{ backgroundColor: CR.dark, overflow: "hidden" }}>
      {frame < T.s1End + 6 && <LoopDiagram frame={frame} />}
      {frame >= T.s2In - 12 && frame < T.s2End + 6 && <CodeReviewFlow frame={frame} />}
      {frame >= T.s3In - 12 && frame < T.s3End + 6 && <IntegrationsHub frame={frame} />}
      {frame >= T.s4In - 8 && <CTA frame={frame} />}

      {flash1 > 0 && <AbsoluteFill style={{ backgroundColor: "#000", opacity: flash1 }} />}
      {flash2 > 0 && <AbsoluteFill style={{ backgroundColor: "#000", opacity: flash2 }} />}
      {flash3 > 0 && <AbsoluteFill style={{ backgroundColor: "#000", opacity: flash3 }} />}
    </AbsoluteFill>
  );
};
