---
name: infographic-flows
description: Use this skill whenever creating or modifying animated infographic flow compositions in this project — things like agent loops, pipeline diagrams, knowledge graphs, pill morphs, icon cycling, or any multi-phase animated infographic. Triggers on requests like "create a new infographic", "add an agent loop", "new flow animation", "build a context graph", "pill morph", "icon cycling", or any request to build or tweak a Remotion animated diagram. Always consult this skill before writing any infographic flow component from scratch.
version: 1.0.0
---

# Infographic Flows Skill

This project builds animated infographic flow compositions in Remotion. The canonical reference is `src/RabbitAgentLoopV4.tsx`. All infographic compositions follow the patterns established there. Apply them exactly — don't reinvent them.

## Brand constants

```ts
const CR_ORANGE = "#FF570A";  // CodeRabbit Primary Orange-500
const BG_COLOR  = "#000000";  // Pure black (V4/V5 default)
const CR_DARK   = "#16161E";  // Dark navy (V2/V6 style)
const CR_DIM    = "#444444";  // Dim label color
```

## Font setup

Always use IBM Plex Mono Medium. Load at the top of every component file:

```ts
import { loadFont } from "@remotion/google-fonts/IBMPlexMono";
const { fontFamily: FONT_FAMILY } = loadFont("normal", { weights: ["500"] });
```

## Imports

```ts
import React from "react";
import {
  AbsoluteFill, useCurrentFrame, useVideoConfig,
  interpolate, spring, Easing, Img, staticFile,
} from "remotion";
```

## The `fi()` helper

Use this everywhere for a standard fade-in interpolation:

```ts
function fi(frame: number, start: number, dur = 14) {
  return interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
}
```

## Background variants

**V4 (pure black with subtle grid):**
```tsx
const Background: React.FC = () => (
  <>
    <div style={{ position: "absolute", inset: 0, backgroundColor: BG_COLOR }} />
    <div style={{
      position: "absolute", inset: 0, opacity: 0.06,
      backgroundImage: `
        linear-gradient(rgba(255,255,255,0.22) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.22) 1px, transparent 1px)
      `,
      backgroundSize: "60px 60px",
    }} />
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      viewBox="0 0 1920 1080" preserveAspectRatio="none">
      <line x1="960" y1="0" x2="0"    y2="1080" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      <line x1="960" y1="0" x2="1920" y2="1080" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
    </svg>
    <div style={{
      position: "absolute", inset: 0,
      background: `radial-gradient(ellipse at 50% 50%, ${CR_ORANGE}0D 0%, transparent 58%)`,
    }} />
  </>
);
```

**V6 (dark #16161E with richer grid + extra diagonals):** Use `CR_DARK` as background color, increase diagonal SVG lines to 4, reduce grid opacity to `0.048`, and change radial to `${CR_ORANGE}0B`.

**V5 (PNG background):** Use `<Img src={staticFile("matrix-grid.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />` plus the radial glow div.

## Pill morph pattern

The orange pill starts as a circle (just the CR logo), expands to hold PLAN/CODE/REVIEW nodes, then can collapse back.

```ts
// Geometry
const PILL_H      = 120;
const PILL_R      = 60;   // constant border-radius
const CX          = 960;  // horizontal center
const CY          = 540;  // vertical center
const NODE_GAP    = 148;  // center-to-center between nodes
const PLAN_X      = CX - NODE_GAP;
const CODE_X      = CX;
const REVIEW_X    = CX + NODE_GAP;
const NODE_R      = 52;   // white node radius
const PILL_W_FULL = NODE_GAP * 2 + NODE_R * 2 + 56;

// Morph in
const pillWidthIn = interpolate(frame, [T.morphStart, T.morphEnd], [PILL_H, PILL_W_FULL], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp",
  easing: Easing.out(Easing.cubic),
});

// Morph out (collapse at end)
const pillWidthOut = interpolate(frame, [COLLAPSE_START, COLLAPSE_START + COLLAPSE_DUR], [PILL_W_FULL, PILL_H], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp",
  easing: Easing.inOut(Easing.cubic),
});
const pillWidth = frame < COLLAPSE_START ? pillWidthIn : pillWidthOut;
```

**CR logo:** fades out when pill expands, fades back in when it collapses:
```ts
const logoFadeOut = interpolate(frame, [T.logoFadeOut, T.logoFadeOut + 22], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const logoFadeIn  = interpolate(frame, [LOGO_REFADE_IN, LOGO_REFADE_IN + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const logoOp = frame < COLLAPSE_START ? logoFadeOut : logoFadeIn;
```

**CR logo asset:** `staticFile("cr-logo.png")` — PNG with transparent outer area, `#FF570A` orange circle, white rabbit center. Use normal compositing, **never** `mix-blend-mode: screen` (it brightens same-color pixels and creates a visible lighter circle).

## Sequential node reveal

Nodes appear one at a time — PLAN first, then arrow, then CODE, then arrow, then REVIEW:

```ts
const NODE_GROW_DUR    = 16;
const PLAN_GROW        = 148;
const CODE_GROW        = 176;
const REVIEW_GROW      = 204;
const NODE_GROW_STARTS = [PLAN_GROW, CODE_GROW, REVIEW_GROW];
const ARROW1_IN        = PLAN_GROW + NODE_GROW_DUR + 2;
const ARROW2_IN        = CODE_GROW + NODE_GROW_DUR + 2;

// Per-node radius — multiplied by nodesFade to vanish on collapse
const nodesFade = interpolate(frame, [COLLAPSE_START, COLLAPSE_START + 16], [1, 0], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp",
});
const getNodeR = (i: number) => interpolate(
  frame,
  [NODE_GROW_STARTS[i], NODE_GROW_STARTS[i] + NODE_GROW_DUR],
  [0, NODE_R],
  { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
) * nodesFade;
```

**Labels** must also multiply by `nodesFade` so they vanish with the nodes:
```ts
const labelOp = fi(frame, NODE_GROW_STARTS[i] + NODE_GROW_DUR, 12) * nodesFade;
```

**Animated dashed arrows** between nodes — also fade out on collapse:
```tsx
const collapsingFade = interpolate(frame, [COLLAPSE_START, COLLAPSE_START + 16], [1, 0], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp",
});
const arrow1Op = fi(frame, ARROW1_IN, ARROW_FADE_DUR) * collapsingFade;
// strokeDashoffset scrolls: Math.max(0, frame - ARROW_IN) * 2.8
```

## Context knowledge graph (slides in from left)

The context section contains a hub-and-spoke graph with labeled source boxes. It slides in from the left before the PLAN/CODE/REVIEW reveal, then fades out as the agent loop starts.

**Timing:**
```ts
const CONTEXT_IN          = 85;   // section slides in
const CONTEXT_GRAPH_IN    = 94;   // hub + spokes appear
const CONTEXT_SRC_TIMINGS = [100, 109, 118, 127, 136]; // per-source stagger (9 frames each)
const CONTEXT_FLOW_IN     = 142;  // orange dashed flow line toward PLAN
const CONTEXT_FADE_START  = 232;  // fades as agents start
const CONTEXT_FADE_END    = 255;
```

**Slide-in:**
```ts
const slideX = interpolate(frame, [CONTEXT_IN, CONTEXT_IN + 24], [-360, 0], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp",
  easing: Easing.out(Easing.cubic),
});
// Apply: transform: `translateX(${slideX}px)`
```

**Hub geometry (left side of screen):**
```ts
const CTX_HUB_X = 405;
const CTX_HUB_Y = 535;
const CTX_BOX_W = 152;
const CTX_BOX_H = 50;
```

**Spokes** — use organic/irregular angles, NOT uniform:
```ts
const CTX_SPOKES = [
  { x: 325, y: 520 },  // CODEBASE (left, slightly up)
  { x: 350, y: 465 },  // DOCUMENTATION (upper-left)
  { x: 465, y: 470 },  // GITHUB (upper-right)
  { x: 340, y: 595 },  // JIRA (lower-left)
  { x: 420, y: 615 },  // SLACK (lower-center)
];
// Each spoke must have exactly one labeled source box — no orphan spokes
```

**Source boxes** — each has a center `cx/cy`, icon type, spoke index `si`, and box-edge anchor `ax/ay` (toward the spoke node):
```ts
const CTX_SOURCES = [
  { label: "CODEBASE",      icon: "code",    cx: 145, cy: 498, si: 0, ax: 221, ay: 507 },
  { label: "DOCUMENTATION", icon: "bars",    cx: 195, cy: 330, si: 1, ax: 224, ay: 355 },
  { label: "GITHUB",        icon: "github",  cx: 580, cy: 315, si: 2, ax: 562, ay: 340 },
  { label: "JIRA",          icon: "jira",    cx: 155, cy: 670, si: 3, ax: 217, ay: 645 },
  { label: "SLACK",         icon: "slack",   cx: 410, cy: 750, si: 4, ax: 412, ay: 725 },
];
```

**Icon renderer** — called inside SVG context. Icon `x` is offset left of box center (`cx - 36`). Use real PNG assets for brand logos:
```ts
const renderCtxIcon = (type: string, cx: number, cy: number) => {
  const ix = cx - 36;
  switch (type) {
    case "code":   return <text x={ix} y={cy} ...>{"</>"}</text>;
    case "bars":   return <>3 horizontal rects at decreasing opacity</>;
    case "github": return <image href={staticFile("github.png")} x={ix-10} y={cy-10} width={20} height={20} />;
    case "jira":   return <image href={staticFile("jira.png")}   x={ix-10} y={cy-10} width={20} height={20} />;
    case "slack":  return <image href={staticFile("slack.png")}  x={ix-10} y={cy-10} width={20} height={20} />;
  }
};
// Always use <image href={staticFile(...)}> inside SVG, not <Img> (which is for HTML context)
// Always use real PNG brand assets — never hand-drawn SVG approximations for logos
```

**Hub (glowing orange dot):**
```tsx
<circle cx={CTX_HUB_X} cy={CTX_HUB_Y} r={11}
  fill={CR_ORANGE} opacity={graphOp} filter="url(#v4-hub-glow)" />
// Filter: feGaussianBlur stdDeviation="8" merged with SourceGraphic
```

**Orange animated flow line** — hub → PLAN node:
```tsx
<line
  x1={CTX_HUB_X + 14} y1={CTX_HUB_Y}
  x2={PLAN_X - NODE_R - 6} y2={CTX_HUB_Y}
  stroke={CR_ORANGE} strokeWidth={2}
  strokeDasharray="10 6" strokeDashoffset={-flowScroll}
  markerEnd="url(#v4-flow-arr)"
  opacity={flowOp * 0.82}
/>
// flowScroll = Math.max(0, frame - CONTEXT_FLOW_IN) * 3.5
```

**"BUILDING CONTEXT" header text** — dim, spaced, small (10px, letterSpacing 3):
```tsx
<text x={380} y={268} textAnchor="middle" fontFamily={FONT_FAMILY}
  fontSize={10} fontWeight={500} fill="rgba(255,255,255,0.22)"
  letterSpacing={3} opacity={graphOp}>BUILDING CONTEXT</text>
```
Do NOT add a "KNOWLEDGE GRAPH" label — it was removed as it cluttered the layout.

## Agent cycling

Agents cycle through the CODE node with a crossfade. Stop after the last agent — **never wrap back to the first**.

```ts
const AGENTS = [
  { file: "agent-chatgpt.png", label: "Codex",  bg: "#FFFFFF", pad: 6 },
  { file: "agent-gemini.png",  label: "Gemini", bg: "#FFFFFF", pad: 4 },
  { file: "agent-cursor.png",  label: "Cursor", bg: "#FFFFFF", pad: 2 },
  { file: "agent-claude.png",  label: "Claude", bg: "#FFFFFF", pad: 4 },
];
// agent-chatgpt.png is the official OpenAI logo (black on white), bg must be #FFFFFF
// Cycle order ends on Claude — this is intentional

const AGENT_DWELL = 26;  // frames each agent is fully visible (≈ 0.87s at 30fps)
const AGENT_XFADE = 7;   // crossfade frames
const AGENT_CYCLE = AGENT_DWELL + AGENT_XFADE; // 33 frames ≈ 1.1s per agent (2x speed)

// AGENTS_DONE: stops at end of last agent's dwell, no xfade into first agent again
const AGENTS_DONE = T.loopStart + (AGENTS.length - 1) * AGENT_CYCLE + AGENT_DWELL;

// Always clamp agentIdx — never let it wrap:
const agentIdx    = Math.min(Math.floor(loopFrame / AGENT_CYCLE), AGENTS.length - 1);
const isLastAgent = agentIdx === AGENTS.length - 1;
// Last agent stays solid (currentOp = 1), xfade is suppressed:
const inXfade = !isLastAgent && frameInCycle >= AGENT_DWELL;
```

**Agent icon** — circular crop with colored background, subtle scale pulse:
```tsx
<div style={{
  position: "absolute",
  left: CODE_X - ICON / 2, top: CY - ICON / 2,
  width: ICON, height: ICON,  // ICON = NODE_R * 2 - 10
  borderRadius: "50%", overflow: "hidden",
  backgroundColor: a.bg,
  opacity: op, transform: `scale(${pulse})`,
  display: "flex", alignItems: "center", justifyContent: "center",
  padding: a.pad, boxSizing: "border-box",
}}>
  <Img src={staticFile(a.file)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
</div>
```

**Agent queue (right side strip)** — shows all agents with active indicator:
- Small dot (5px) left of each icon: orange filled + orange border when active, transparent fill + dim border when inactive
- Icon: 42px circle, orange border + glow when active, dim border when inactive
- Label: bright white when active, dim `rgba(255,255,255,0.28)` when inactive
- Queue fades out as AGENTS_DONE approaches (`interpolate([AGENTS_DONE-10, AGENTS_DONE], [1, 0])`)
- Strip positioned at `CX + PILL_W_FULL/2 + 48` (right of pill)

**CODE node glow** — orange pulsing glow ring visible only during agent loop:
```tsx
// Only renders between T.loopStart and AGENTS_DONE
const pulse = Math.sin(loopFrame * 0.13) * 0.5 + 0.5;
// feGaussianBlur stdDeviation={14 + pulse * 10}
// strokeWidth={2.5 + pulse * 2}
```

## End sequence (collapse + fade out)

After agents finish, the pill collapses back to a circle and the CR logo reappears, then fades to black:

```ts
const COLLAPSE_START   = AGENTS_DONE;
const COLLAPSE_DUR     = 24;
const LOGO_REFADE_IN   = COLLAPSE_START + 14;
const FINAL_FADE_START = COLLAPSE_START + COLLAPSE_DUR + 20;
const FINAL_FADE_DUR   = 24;

export const TOTAL_FRAMES = FINAL_FADE_START + FINAL_FADE_DUR + 15;
```

Fade-to-black overlay in the main composition:
```tsx
const finalFadeOp = interpolate(frame, [FINAL_FADE_START, FINAL_FADE_START + FINAL_FADE_DUR], [0, 1], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp",
});
// Rendered last so it covers everything:
{finalFadeOp > 0 && <AbsoluteFill style={{ backgroundColor: BG_COLOR, opacity: finalFadeOp }} />}
```

## Stage label

A dim bottom label that describes the current phase. Each stage auto-fades in at its start and out at its end:

```ts
const stages = [
  { start: T.circleIn,   end: T.morphStart,   text: "CodeRabbit" },
  { start: T.morphStart, end: CONTEXT_IN,     text: "Plan · Code · Review" },
  { start: CONTEXT_IN,   end: PLAN_GROW,      text: "Building context" },
  { start: PLAN_GROW,    end: T.loopStart,    text: "Plan · Code · Review" },
  { start: T.loopStart,  end: AGENTS_DONE,   text: "Coding agents in the loop" },
];
// fontSize: 15, color: CR_DIM (#444444), letterSpacing: 3, centered bottom: 72px
```

## Master timing (V4 reference)

```
Frame 0    — CR logo fades in (pill = circle)
Frame 36   — Pill starts morphing wide
Frame 80   — Pill fully wide
Frame 82   — CR logo fades out
Frame 85   — Context graph slides in from left
Frame 94   — Hub + spokes appear
Frame 100–136 — Source boxes appear (staggered 9 frames each)
Frame 142  — Orange flow line animates hub → PLAN
Frame 148  — PLAN node grows
Frame 166  — Arrow 1 appears (PLAN → CODE)
Frame 176  — CODE node grows
Frame 194  — Arrow 2 appears (CODE → REVIEW)
Frame 204  — REVIEW node grows
Frame 232  — Context graph starts fading
Frame 242  — Agent loop starts (Codex → Gemini → Cursor → Claude)
Frame 367  — Last agent (Claude) dwell ends, all agent UI stops
Frame 367  — Pill collapse begins, nodes/labels/arrows fade
Frame 391  — Collapse complete, CR logo fully visible
Frame 391–411 — Hold on logo
Frame 418  — Fade to black begins
Frame 442  — Fully black
Frame 457  — End
```

## Component structure

```tsx
export const MyFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // ...
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background />
      <ContextSection frame={frame} />
      <Pill frame={frame} fps={fps} />
      <FlowArrows frame={frame} />
      <CodeGlow frame={frame} />
      <AgentAtCode frame={frame} />
      <AgentLabel frame={frame} />
      <AgentQueue frame={frame} />
      <StageLabel frame={frame} />
      {finalFadeOp > 0 && <AbsoluteFill style={{ backgroundColor: BG_COLOR, opacity: finalFadeOp }} />}
    </AbsoluteFill>
  );
};
```

## Versioning pattern

When making significant visual changes, create a new versioned file rather than modifying an existing one:
- Copy the previous version: `sed 's/V4/V5/g; s/V4_TOTAL/V5_TOTAL/g' V4.tsx > V5.tsx`
- Change only what differs (e.g. the Background component)
- Register the new composition in `Root.tsx`
- Keep old versions intact as references

## Public assets

All assets referenced via `staticFile()` must live in `public/`:

| File | Description |
|------|-------------|
| `cr-logo.png` | CodeRabbit pill logo — transparent background, `#FF570A` circle, white rabbit |
| `agent-chatgpt.png` | Official OpenAI logo (black on white) — label as "Codex" |
| `agent-gemini.png` | Gemini logo (white background) |
| `agent-cursor.png` | Cursor logo (white background) |
| `agent-claude.png` | Claude/Anthropic logo (white background) |
| `github.png` | GitHub Octocat logo |
| `jira.png` | Jira diamond logo |
| `slack.png` | Slack logo |
| `matrix-grid.png` | Dark perspective grid background (used in V5) |

Source originals live in `brand-samples/` — copy to `public/` before referencing.

## Key rules (learned from iteration)

1. **Never use `mix-blend-mode: screen` on the CR logo** — the PNG's orange area is exactly `#FF570A`, so screen blending brightens orange-on-orange pixels and creates a visible lighter circle.
2. **Every spoke must have exactly one source box** — orphan spokes (no label/box) look broken and should be removed.
3. **Agent cycling must never wrap** — clamp `agentIdx` to `AGENTS.length - 1` and suppress the xfade on the last agent.
4. **PLAN/CODE/REVIEW labels must multiply by `nodesFade`** — if only node circles use `nodesFade`, the text labels remain visible during pill collapse, which looks wrong.
5. **Always use real PNG assets for brand logos** — never approximate Slack, Jira, GitHub with hand-drawn SVG shapes. The result is always recognizable and never matches.
6. **Use `<image href={staticFile(...)}>` inside SVG** — `<Img>` is an HTML element; inside `<svg>` you must use the native `<image>` element.
7. **No "KNOWLEDGE GRAPH" label** — it was removed as visual clutter; don't add it back.
