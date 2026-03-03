import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/PlusJakartaSans";

const { fontFamily: FONT_FAMILY } = loadFont("normal", { weights: ["600"] });

const LINE_1 = "Let your agents cook...";
const TEXT_COLOR = "#FF570A";
const BG_COLOR = "#000000";
const FONT_SIZE = 90;
const START_FRAME = 18;

const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

const computeCharFrames = (): number[] => {
  const frames: number[] = [];
  let currentFrame = START_FRAME;

  for (let i = 0; i < LINE_1.length; i++) {
    frames.push(currentFrame);
    const char = LINE_1[i];

    if (char === " ") {
      currentFrame += 3 + Math.floor(seededRandom(i * 17 + 3) * 2);
    } else if (char === ".") {
      // Dramatic pause on each dot
      currentFrame += 12 + Math.floor(seededRandom(i * 7 + 5) * 6);
    } else {
      currentFrame += 4 + Math.floor(seededRandom(i * 31 + 17) * 4);
    }
  }

  return frames;
};

const CHAR_FRAMES = computeCharFrames();

export const AgentsCookSlide: React.FC = () => {
  const frame = useCurrentFrame();

  const charsVisible = CHAR_FRAMES.filter((f) => frame >= f).length;
  const displayText = LINE_1.slice(0, charsVisible);

  const typingStarted = frame >= START_FRAME;
  const cursorBlink = Math.floor(frame / 15) % 2 === 0;
  const cursorVisibility = typingStarted && cursorBlink ? "visible" : "hidden";

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BG_COLOR,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: FONT_SIZE,
          fontWeight: 600,
          color: TEXT_COLOR,
          textAlign: "center",
          lineHeight: 1.4,
        }}
      >
        {displayText}
        <span style={{ visibility: cursorVisibility }}>|</span>
      </div>
    </AbsoluteFill>
  );
};
