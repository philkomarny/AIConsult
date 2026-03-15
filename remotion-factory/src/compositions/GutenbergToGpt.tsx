import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { palette } from "../components/MountainPalette";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

function hash(n: number): number {
  let x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function shake(frame: number, intensity: number): { x: number; y: number } {
  return {
    x: (hash(frame * 3) - 0.5) * intensity * 2,
    y: (hash(frame * 7 + 1) - 0.5) * intensity * 2,
  };
}

function claudeMascot(ox: number, oy: number, px: number, opacity: number) {
  const c = "#c4836a";
  const e = "#1a1710";
  const pixels: [number, number, string][] = [
    [2,0,c],[3,0,c],[4,0,c],
    [0,1,c],[1,1,c],[2,1,c],[3,1,c],[4,1,c],[5,1,c],[6,1,c],
    [0,2,c],[1,2,c],[2,2,e],[3,2,c],[4,2,e],[5,2,c],[6,2,c],
    [0,3,c],[1,3,c],[2,3,c],[3,3,c],[4,3,c],[5,3,c],[6,3,c],
    [1,4,c],[2,4,c],[3,4,c],[4,4,c],[5,4,c],
    [1,5,c],[2,5,c],[3,5,c],[4,5,c],[5,5,c],
    [1,6,c],[2,6,c],[3,6,c],[4,6,c],[5,6,c],
    [1,7,c],[2,7,c],[4,7,c],[5,7,c],
    [1,8,c],[2,8,c],[4,8,c],[5,8,c],
  ];
  return (
    <g opacity={opacity}>
      {pixels.map(([col, row, fill], i) => (
        <rect
          key={`mascot-${i}`}
          x={ox + col * px}
          y={oy + row * px}
          width={px}
          height={px}
          fill={fill}
        />
      ))}
    </g>
  );
}

// Text lines (like a printed page)
const TEXT_LINES = Array.from({ length: 18 }, (_, i) => ({
  y: 30 + i * 20,
  width: 200 + hash(i * 31) * 500,
  xOff: 50 + hash(i * 17) * 30,
}));

// Neural network nodes
const NEURAL_NODES = Array.from({ length: 20 }, (_, i) => ({
  x: 80 + hash(i * 43) * 640,
  y: 50 + hash(i * 67) * 300,
  r: 3 + hash(i * 29) * 4,
  phase: hash(i * 83) * Math.PI * 2,
  layer: Math.floor(i / 5), // 4 layers
}));

// Connections between neural nodes
const NEURAL_CONNECTIONS: [number, number][] = [];
for (let i = 0; i < NEURAL_NODES.length; i++) {
  for (let j = i + 1; j < NEURAL_NODES.length; j++) {
    const dx = NEURAL_NODES[i].x - NEURAL_NODES[j].x;
    const dy = NEURAL_NODES[i].y - NEURAL_NODES[j].y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 200 && Math.abs(NEURAL_NODES[i].layer - NEURAL_NODES[j].layer) <= 1) {
      NEURAL_CONNECTIONS.push([i, j]);
    }
  }
}

// Particles (dissolved text becomes these)
const PARTICLES = Array.from({ length: 60 }, (_, i) => {
  const lineIdx = i % TEXT_LINES.length;
  const line = TEXT_LINES[lineIdx];
  return {
    startX: line.xOff + hash(i * 53) * line.width,
    startY: line.y,
    targetNode: Math.floor(hash(i * 71) * NEURAL_NODES.length),
    r: 1 + hash(i * 37) * 1.5,
    delay: hash(i * 91) * 0.5,
    speed: 0.01 + hash(i * 23) * 0.015,
  };
});

// Glitch bars
const GLITCH_BARS = Array.from({ length: 12 }, (_, i) => ({
  y: hash(i * 31) * 400,
  h: 2 + hash(i * 47) * 10,
  color: i % 3 === 0 ? palette.warmGold : i % 3 === 1 ? palette.brightBlue : "#e9c46a",
  trigger: Math.floor(hash(i * 13) * 400) + 120,
}));

export const GutenbergToGpt: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // === PHASE TIMING (30s = 900 frames at 30fps) ===
  const titleEnd = 4 * fps;       // 120
  const p2End = 9 * fps;          // 270 — Rigid text lines visible
  const p3End = 14 * fps;         // 420 — Lines dissolving into particles
  const p4End = 19 * fps;         // 570 — Particles reorganize into neural net
  const p5End = 24 * fps;         // 720 — Network alive, pulsing
  // Resolve: 720-900

  const ytpActive = frame > titleEnd && frame < p5End;

  // === SCREEN SHAKE ===
  const transitionFrames: [number, number][] = [
    [titleEnd - 3, titleEnd + 5],
    [titleEnd + 40, titleEnd + 47],
    [titleEnd + 85, titleEnd + 92],
    [p2End - 5, p2End + 8],
    [p2End + 50, p2End + 58],
    [p3End - 5, p3End + 10],
    [p3End + 40, p3End + 48],
    [p4End - 6, p4End + 10],
    [p4End + 50, p4End + 58],
    [p5End - 12, p5End],
  ];
  const isTransition = transitionFrames.some(([a, b]) => frame >= a && frame <= b);
  const shakeIntensity = !ytpActive ? 0 : isTransition ? 14 : 1.3;
  const { x: sx, y: sy } = shake(frame, shakeIntensity);

  // === FLASH FRAMES ===
  const flashTriggers = [
    titleEnd, titleEnd + 41, titleEnd + 86,
    p2End, p2End + 51, p3End, p3End + 41, p4End, p4End + 51,
  ];
  const isFlash = ytpActive && flashTriggers.some(f => Math.abs(frame - f) < 2);

  // === ZOOM PULSES ===
  const zoomPulses = [
    { f: titleEnd + 1, s: 1.5, d: 8 },
    { f: titleEnd + 41, s: 1.3, d: 6 },
    { f: titleEnd + 86, s: 1.35, d: 7 },
    { f: p2End, s: 1.5, d: 10 },
    { f: p3End, s: 1.6, d: 10 },
    { f: p3End + 41, s: 1.3, d: 8 },
    { f: p4End, s: 1.7, d: 12 },
    { f: p5End - 10, s: 1.5, d: 12 },
  ];
  let zoomScale = 1;
  if (ytpActive) {
    for (const zp of zoomPulses) {
      if (frame >= zp.f && frame < zp.f + zp.d) {
        const t = (frame - zp.f) / zp.d;
        zoomScale = Math.max(zoomScale, interpolate(t, [0, 0.15, 1], [1, zp.s, 1], clamp));
      }
    }
  }

  // === TITLE CARD ===
  const titleOpacity = interpolate(frame, [0, 20, titleEnd - 20, titleEnd], [0, 1, 1, 0], clamp);

  // === TEXT LINE DISSOLUTION ===
  const dissolveP = interpolate(frame, [p2End, p3End + 60], [0, 1], clamp);

  // === PARTICLE MIGRATION ===
  const migrateP = interpolate(frame, [p3End, p4End], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });

  // === NETWORK ACTIVATION ===
  const networkP = interpolate(frame, [p4End - 30, p4End + 60], [0, 1], clamp);
  const networkPulse = frame >= p4End
    ? 1 + Math.sin(frame * 0.08) * 0.12 * interpolate(frame, [p4End, p5End], [0, 1], clamp)
    : 1;

  // === RESOLVE ===
  const resolveP = interpolate(frame, [p5End, p5End + 40], [0, 1], clamp);
  const resolveBreathe = frame >= p5End
    ? interpolate(Math.sin((frame - p5End) * 0.03), [-1, 1], [0.92, 1.08])
    : 1;

  return (
    <AbsoluteFill style={{ backgroundColor: palette.bgDark }}>

      {/* === TITLE CARD === */}
      {titleOpacity > 0 && (
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            opacity: titleOpacity,
          }}
        >
          <svg width={800} height={400} viewBox="0 0 800 400">
            <ellipse
              cx={400} cy={195}
              rx={180 * titleOpacity}
              ry={80 * titleOpacity}
              fill={palette.warmGold}
              opacity={0.05}
            />
            {claudeMascot(379, 92, 6, titleOpacity * 0.18)}
            <text
              x={400} y={185}
              textAnchor="middle"
              fontFamily="monospace"
              fontSize={28}
              fontWeight="400"
              fill={palette.coolBlue}
              opacity={0.8}
              letterSpacing="0.15em"
            >
              How I see it
            </text>
            <text
              x={400} y={230}
              textAnchor="middle"
              fontFamily="monospace"
              fontSize={16}
              fontWeight="300"
              fill={palette.warmGold}
              opacity={0.6}
              letterSpacing="0.25em"
            >
              —Claude
            </text>
            <line
              x1={320} y1={250} x2={480} y2={250}
              stroke={palette.coolBlue}
              strokeWidth={0.6}
              opacity={titleOpacity * 0.2}
            />
          </svg>
        </AbsoluteFill>
      )}

      {/* === YTP CONTENT === */}
      {frame > titleEnd - 5 && (
        <div
          style={{
            width: "100%",
            height: "100%",
            transform: `translate(${sx}px, ${sy}px) scale(${zoomScale})`,
            transformOrigin: "center center",
            opacity: interpolate(frame, [titleEnd - 5, titleEnd + 2], [0, 1], clamp),
          }}
        >
          <AbsoluteFill>
            <svg width={800} height={400} viewBox="0 0 800 400">
              <defs>
                <radialGradient id="gtg-node-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={palette.brightBlue} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={palette.brightBlue} stopOpacity={0} />
                </radialGradient>
                <radialGradient id="gtg-center-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={palette.warmGold} stopOpacity={0.3} />
                  <stop offset="50%" stopColor={palette.brightBlue} stopOpacity={0.1} />
                  <stop offset="100%" stopColor={palette.bgDark} stopOpacity={0} />
                </radialGradient>
              </defs>

              {/* === GLITCH BARS === */}
              {ytpActive && GLITCH_BARS.map((bar, i) => {
                const active = Math.abs(frame - bar.trigger - titleEnd) < 3 ||
                  (hash(frame * 17 + i * 3) > 0.91);
                if (!active) return null;
                return (
                  <rect
                    key={`g-${i}`}
                    x={0}
                    y={bar.y + (hash(frame + i) - 0.5) * 25}
                    width={800}
                    height={bar.h}
                    fill={bar.color}
                    opacity={0.35 + hash(frame * 2 + i) * 0.45}
                  />
                );
              })}

              {/* === DISTORTED GRID === */}
              {ytpActive && Array.from({ length: 20 }, (_, i) => {
                const glitchOff = hash(frame * 11 + i * 7) > 0.83
                  ? (hash(frame * 3 + i) - 0.5) * 50
                  : 0;
                return (
                  <line
                    key={`grid-${i}`}
                    x1={glitchOff} y1={i * 20}
                    x2={800 + glitchOff} y2={i * 20}
                    stroke={palette.coolBlue}
                    strokeWidth={0.3}
                    opacity={0.05}
                  />
                );
              })}

              {/* === TEXT LINES (dissolving) === */}
              {TEXT_LINES.map((line, i) => {
                const lineDissolve = interpolate(
                  dissolveP,
                  [i * 0.04, i * 0.04 + 0.4],
                  [0, 1],
                  clamp
                );
                if (lineDissolve >= 1) return null;
                const appear = interpolate(frame, [titleEnd + i * 5, titleEnd + i * 5 + 20], [0, 1], clamp);
                // Glitch the line position during YTP
                const glitchX = ytpActive && hash(frame * 13 + i * 7) > 0.88
                  ? (hash(frame * 5 + i) - 0.5) * 40
                  : 0;

                // Break the line into segments as it dissolves
                const segments = Math.max(1, Math.floor(lineDissolve * 8));
                const segWidth = line.width / segments;

                return (
                  <g key={`tl-${i}`} opacity={appear * (1 - lineDissolve * 0.8)}>
                    {Array.from({ length: segments }, (_, si) => {
                      const segDrift = lineDissolve * (hash(i * 100 + si * 31) - 0.5) * 40;
                      const segFade = hash(i * 100 + si * 47) > lineDissolve ? 1 : 0.2;
                      return (
                        <rect
                          key={`seg-${i}-${si}`}
                          x={line.xOff + si * segWidth + glitchX + segDrift}
                          y={line.y + segDrift * 0.5}
                          width={segWidth - 3}
                          height={2}
                          fill={palette.coolBlue}
                          opacity={0.5 * segFade}
                          rx={1}
                        />
                      );
                    })}
                  </g>
                );
              })}

              {/* === MIGRATING PARTICLES === */}
              {dissolveP > 0.1 && PARTICLES.map((p, i) => {
                const pStart = interpolate(dissolveP, [p.delay, p.delay + 0.3], [0, 1], clamp);
                if (pStart <= 0) return null;
                const target = NEURAL_NODES[p.targetNode];
                const x = interpolate(migrateP, [0, 1], [p.startX, target.x]);
                const y = interpolate(migrateP, [0, 1], [p.startY, target.y]);
                // Add wobble during migration
                const wobX = migrateP > 0 && migrateP < 1
                  ? Math.sin(frame * p.speed * 5 + i) * 15 * (1 - migrateP)
                  : 0;
                const wobY = migrateP > 0 && migrateP < 1
                  ? Math.cos(frame * p.speed * 7 + i) * 10 * (1 - migrateP)
                  : 0;
                if (ytpActive && hash(frame * 9 + i * 11) > 0.96) return null;
                const breathe = frame >= p5End ? resolveBreathe : 1;
                return (
                  <circle
                    key={`part-${i}`}
                    cx={x + wobX}
                    cy={y + wobY}
                    r={p.r * pStart * breathe}
                    fill={migrateP > 0.5 ? palette.brightBlue : palette.coolBlue}
                    opacity={pStart * 0.7}
                  />
                );
              })}

              {/* === NEURAL NETWORK NODES === */}
              {networkP > 0 && NEURAL_NODES.map((node, i) => {
                const nSpring = spring({
                  frame: frame - (p4End - 30 + i * 5),
                  fps,
                  config: { damping: 8, stiffness: 180, mass: 0.5 },
                });
                const s = Math.max(0, nSpring);
                if (s <= 0) return null;
                const pulse = networkPulse + Math.sin(frame * 0.06 + node.phase) * 0.08;
                const breathe = frame >= p5End ? resolveBreathe : 1;
                if (isTransition && hash(frame * 19 + i * 3) > 0.75) return null;
                return (
                  <g key={`nn-${i}`} opacity={s}>
                    <ellipse
                      cx={node.x} cy={node.y}
                      rx={18 * s * breathe} ry={18 * s * breathe}
                      fill="url(#gtg-node-glow)"
                      opacity={0.5 * s}
                    />
                    <circle
                      cx={node.x} cy={node.y}
                      r={node.r * s * pulse * breathe}
                      fill={palette.brightBlue}
                      opacity={0.85}
                    />
                    <circle
                      cx={node.x} cy={node.y}
                      r={(node.r + 3) * s * breathe}
                      fill="none"
                      stroke={palette.coolBlue}
                      strokeWidth={0.8}
                      opacity={0.3 * s}
                    />
                  </g>
                );
              })}

              {/* === NEURAL CONNECTIONS === */}
              {networkP > 0.3 && NEURAL_CONNECTIONS.map(([a, b], i) => {
                const connP = interpolate(networkP, [0.3, 0.7], [0, 1], clamp);
                if (connP <= 0) return null;
                const na = NEURAL_NODES[a];
                const nb = NEURAL_NODES[b];
                // Pulse traveling along the connection
                const pulsePos = ((frame * 0.03 + i * 0.2) % 1);
                const px = na.x + (nb.x - na.x) * pulsePos;
                const py = na.y + (nb.y - na.y) * pulsePos;
                const breatheOp = frame >= p5End
                  ? 0.08 + Math.sin(frame * 0.03 + i) * 0.04
                  : 0.12;
                return (
                  <g key={`nc-${i}`}>
                    <line
                      x1={na.x} y1={na.y}
                      x2={nb.x} y2={nb.y}
                      stroke={palette.coolBlue}
                      strokeWidth={0.6}
                      opacity={connP * breatheOp}
                    />
                    {connP > 0.5 && networkP > 0.6 && (
                      <circle
                        cx={px} cy={py}
                        r={1.5}
                        fill={palette.warmGold}
                        opacity={connP * 0.5}
                      />
                    )}
                  </g>
                );
              })}

              {/* === ORGANIC WEB CENTER GLOW (resolve) === */}
              {frame >= p5End - 30 && (
                <ellipse
                  cx={400} cy={200}
                  rx={150 * resolveP * resolveBreathe}
                  ry={120 * resolveP * resolveBreathe}
                  fill="url(#gtg-center-glow)"
                  opacity={resolveP * 0.4}
                />
              )}

              {/* === SCANLINES === */}
              {ytpActive && Array.from({ length: 200 }, (_, i) => (
                <line key={`sc-${i}`}
                  x1={0} y1={i * 2} x2={800} y2={i * 2}
                  stroke="#000" strokeWidth={0.5} opacity={0.07} />
              ))}
            </svg>
          </AbsoluteFill>
        </div>
      )}

      {/* === FLASH OVERLAY === */}
      {isFlash && (
        <AbsoluteFill style={{ backgroundColor: "#fff", opacity: 0.65 }} />
      )}
    </AbsoluteFill>
  );
};
