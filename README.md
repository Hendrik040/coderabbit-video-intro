# CodeRabbit YouTube Intro - Remotion Project

A tech/futuristic animated intro for CodeRabbit's "How to Build an AI Code Review Agent" YouTube video.

## Features

- 🐰 **CodeRabbit Logo Animation** - Spinning logo reveal with glow effects
- ⚡ **Glitch Text Effects** - Tech-style glitch on the brand name
- 🔮 **Particle System** - Floating particles in brand colors (orange, aquamarine, pink)
- 💻 **Code Background** - Animated code lines appearing in the background
- 📡 **Scan Line Effect** - Moving horizontal scan line for futuristic feel
- 🎯 **Grid Background** - Subtle tech grid overlay
- ✨ **Smooth Transitions** - Spring-based animations for natural movement

## Duration

12 seconds (360 frames @ 30fps)

## Brand Colors Used

- **Orange** (#FF570A) - Primary accent
- **Aquamarine** (#25BAB1) - Secondary accent
- **Pink** (#F2B8EB) - Secondary accent
- **Dark** (#171717) - Background
- **Cream** (#F6F6F1) - Text

## Prerequisites

- Node.js 18+
- npm or yarn

## Installation

```bash
npm install
```

## Development

Start the Remotion Studio to preview and edit:

```bash
npm start
```

This opens the Remotion Studio at http://localhost:3000

## Render Video

Render the final MP4:

```bash
npm run build
```

Output: `out/intro.mp4`

### Custom Render Options

```bash
# Render as GIF
npx remotion render src/index.ts CodeRabbitIntro out/intro.gif --codec=gif

# Render at different resolution
npx remotion render src/index.ts CodeRabbitIntro out/intro.mp4 --height=720 --width=1280

# Render specific frame range
npx remotion render src/index.ts CodeRabbitIntro out/intro.mp4 --frames=0-180
```

## Customization

### Edit Text

In `src/CodeRabbitIntro.tsx`, find and modify:

```tsx
// Brand name
<GlitchText text="CodeRabbit" ... />

// Tagline
<span>How to Build an AI Code Review Agent</span>

// Subtitle
{"<"} TUTORIAL {"/>"}
```

### Adjust Timing

The composition is 360 frames (12 seconds) at 30fps. Key timing:
- Frame 30: Logo appears
- Frame 80: Title appears
- Frame 140: Tagline appears
- Frame 180: Subtitle appears
- Frame 300-360: Fade out

### Change Duration

In `src/Root.tsx`:
```tsx
<Composition
  durationInFrames={360}  // Change this (30 frames = 1 second)
  fps={30}
  ...
/>
```

## Project Structure

```
coderabbit-video-intro/
├── src/
│   ├── index.ts          # Entry point
│   ├── Root.tsx          # Composition setup
│   └── CodeRabbitIntro.tsx # Main animation component
├── package.json
├── tsconfig.json
└── remotion.config.ts
```

## License

MIT
