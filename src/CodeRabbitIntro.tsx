import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from "remotion";

// CodeRabbit Brand Colors
const COLORS = {
  orange: "#FF570A",
  pink: "#F2B8EB",
  aquamarine: "#25BAB1",
  yellow: "#F0DF22",
  dark: "#171717",
  cream: "#F6F6F1",
};

// Particle component for background effect
const Particle: React.FC<{
  x: number;
  y: number;
  delay: number;
  size: number;
  color: string;
}> = ({ x, y, delay, size, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(
    frame - delay,
    [0, 20, 60, 80],
    [0, 0.8, 0.8, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const scale = interpolate(frame - delay, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const yOffset = interpolate(frame - delay, [0, 100], [0, -50], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: color,
        opacity,
        transform: `scale(${scale}) translateY(${yOffset}px)`,
        boxShadow: `0 0 ${size * 2}px ${color}`,
      }}
    />
  );
};

// Code line animation component
const CodeLine: React.FC<{
  text: string;
  delay: number;
  yPosition: number;
  color?: string;
}> = ({ text, delay, yPosition, color = COLORS.aquamarine }) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame - delay, [0, 10], [0, 0.6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const xOffset = interpolate(frame - delay, [0, 15], [-100, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fadeOut = interpolate(frame, [200, 240], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: "5%",
        top: `${yPosition}%`,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: 14,
        color,
        opacity: opacity * fadeOut,
        transform: `translateX(${xOffset}px)`,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

// Glitch text effect component
const GlitchText: React.FC<{
  text: string;
  fontSize: number;
  color: string;
  glitchIntensity?: number;
}> = ({ text, fontSize, color, glitchIntensity = 1 }) => {
  const frame = useCurrentFrame();

  // Create glitch offset
  const glitchX =
    Math.sin(frame * 0.5) * 3 * glitchIntensity * (frame % 5 === 0 ? 1 : 0);
  const glitchY =
    Math.cos(frame * 0.3) * 2 * glitchIntensity * (frame % 7 === 0 ? 1 : 0);

  return (
    <div style={{ position: "relative" }}>
      {/* Glitch layers */}
      <span
        style={{
          position: "absolute",
          left: glitchX,
          top: glitchY,
          color: COLORS.aquamarine,
          opacity: frame % 10 === 0 ? 0.7 : 0,
          fontSize,
          fontWeight: 700,
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
        }}
      >
        {text}
      </span>
      <span
        style={{
          position: "absolute",
          left: -glitchX,
          top: -glitchY,
          color: COLORS.pink,
          opacity: frame % 12 === 0 ? 0.7 : 0,
          fontSize,
          fontWeight: 700,
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
        }}
      >
        {text}
      </span>
      {/* Main text */}
      <span
        style={{
          fontSize,
          fontWeight: 700,
          color,
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          position: "relative",
        }}
      >
        {text}
      </span>
    </div>
  );
};

// Scanning line effect
const ScanLine: React.FC = () => {
  const frame = useCurrentFrame();

  const yPosition = interpolate(frame, [0, 120, 240, 360], [0, 100, 0, 100], {
    extrapolateRight: "clamp",
  });

  const opacity = interpolate(frame, [0, 30, 330, 360], [0, 0.3, 0.3, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: `${yPosition}%`,
        left: 0,
        right: 0,
        height: 2,
        background: `linear-gradient(90deg, transparent, ${COLORS.orange}, transparent)`,
        opacity,
        boxShadow: `0 0 20px ${COLORS.orange}, 0 0 40px ${COLORS.orange}`,
      }}
    />
  );
};

// Grid background
const GridBackground: React.FC = () => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 30, 300, 360], [0, 0.15, 0.15, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        backgroundImage: `
          linear-gradient(${COLORS.orange}22 1px, transparent 1px),
          linear-gradient(90deg, ${COLORS.orange}22 1px, transparent 1px)
        `,
        backgroundSize: "50px 50px",
      }}
    />
  );
};

// CodeRabbit Logo SVG (rabbit silhouette)
const RabbitLogo: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Circular background */}
      <circle cx="50" cy="50" r="48" fill={color} />
      {/* Rabbit silhouette */}
      <path
        d="M35 25 C35 15, 40 10, 42 25 L42 40
           M58 25 C58 15, 63 10, 65 25 L65 40
           M30 50 C25 45, 25 65, 35 70
           L35 80 C35 85, 65 85, 65 80
           L65 70 C75 65, 75 45, 70 50
           C70 40, 30 40, 30 50 Z"
        fill={COLORS.dark}
      />
      {/* Eye */}
      <circle cx="42" cy="52" r="3" fill={color} />
    </svg>
  );
};

// Main component
export const CodeRabbitIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Logo animation
  const logoScale = spring({
    frame: frame - 30,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const logoRotation = interpolate(frame, [30, 90], [0, 360], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const logoOpacity = interpolate(frame, [30, 50, 300, 340], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Text animations
  const titleOpacity = interpolate(frame, [80, 110, 300, 340], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleY = spring({
    frame: frame - 80,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  const taglineOpacity = interpolate(
    frame,
    [140, 170, 300, 340],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const taglineY = spring({
    frame: frame - 140,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  // Subtitle animation
  const subtitleOpacity = interpolate(
    frame,
    [180, 210, 300, 340],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Generate particles
  const particles = [];
  for (let i = 0; i < 30; i++) {
    particles.push({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 60,
      size: Math.random() * 6 + 2,
      color: [COLORS.orange, COLORS.aquamarine, COLORS.pink][
        Math.floor(Math.random() * 3)
      ],
    });
  }

  // Code lines for background
  const codeLines = [
    { text: "const review = await coderabbit.analyze(pr);", delay: 10, y: 15 },
    { text: "// AI-powered code analysis", delay: 20, y: 25 },
    { text: "if (review.issues.length > 0) {", delay: 30, y: 35 },
    { text: '  console.log("Improvements found!");', delay: 40, y: 45 },
    { text: "  await review.suggestFixes();", delay: 50, y: 55 },
    { text: "}", delay: 60, y: 65 },
    { text: "// Ship better code, faster", delay: 70, y: 75 },
  ];

  // Glow pulse effect
  const glowIntensity = interpolate(
    Math.sin(frame * 0.1),
    [-1, 1],
    [0.5, 1],
    {}
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.dark,
        overflow: "hidden",
      }}
    >
      {/* Grid background */}
      <GridBackground />

      {/* Code lines in background */}
      {codeLines.map((line, i) => (
        <CodeLine
          key={i}
          text={line.text}
          delay={line.delay}
          yPosition={line.y}
          color={i % 2 === 0 ? COLORS.aquamarine : COLORS.pink}
        />
      ))}

      {/* Particles */}
      {particles.map((p, i) => (
        <Particle key={i} {...p} />
      ))}

      {/* Scanning line effect */}
      <ScanLine />

      {/* Main content */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
        }}
      >
        {/* Logo */}
        <div
          style={{
            opacity: logoOpacity,
            transform: `scale(${logoScale}) rotate(${logoRotation}deg)`,
            marginBottom: 30,
            filter: `drop-shadow(0 0 ${30 * glowIntensity}px ${COLORS.orange})`,
          }}
        >
          <RabbitLogo size={120} color={COLORS.orange} />
        </div>

        {/* Brand name with glitch effect */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${(1 - titleY) * 50}px)`,
          }}
        >
          <GlitchText
            text="CodeRabbit"
            fontSize={72}
            color={COLORS.cream}
            glitchIntensity={0.5}
          />
        </div>

        {/* Tagline */}
        <div
          style={{
            opacity: taglineOpacity,
            transform: `translateY(${(1 - taglineY) * 30}px)`,
            marginTop: 20,
          }}
        >
          <span
            style={{
              fontSize: 32,
              color: COLORS.orange,
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              textShadow: `0 0 20px ${COLORS.orange}40`,
            }}
          >
            How to Build an AI Code Review Agent
          </span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            opacity: subtitleOpacity,
            marginTop: 15,
          }}
        >
          <span
            style={{
              fontSize: 22,
              color: COLORS.aquamarine,
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 400,
              letterSpacing: 2,
            }}
          >
            {"<"} TUTORIAL {"/>"}
          </span>
        </div>
      </AbsoluteFill>

      {/* Vignette effect */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at center, transparent 40%, ${COLORS.dark} 100%)`,
          pointerEvents: "none",
        }}
      />

      {/* Border glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          border: `2px solid ${COLORS.orange}`,
          opacity: interpolate(frame, [0, 30, 330, 360], [0, 0.3, 0.3, 0]),
          boxShadow: `inset 0 0 50px ${COLORS.orange}20`,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
