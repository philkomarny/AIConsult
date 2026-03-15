import React from "react";
import {
  AbsoluteFill,
  Audio,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  staticFile,
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

// Claude pixel mascot — traced from reference image
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

// Three force colors
const FORCE_COLORS = ["#e63946", "#2a9d8f", "#e9c46a"]; // digitization, quantization, equivalence

// Glitch bars
const GLITCH_BARS = Array.from({ length: 16 }, (_, i) => ({
  y: hash(i * 29) * 400,
  h: 2 + hash(i * 43) * 12,
  color: FORCE_COLORS[i % 3],
  trigger: Math.floor(hash(i * 17) * 400) + 120,
}));

export const TheThreeLaws: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // === PHASE TIMING (30s = 900 frames at 30fps) ===
  const titleEnd = 4 * fps;       // 120 — title card
  const p2End = 9 * fps;          // 270 — three shapes appear from edges
  const p3End = 14 * fps;         // 420 — shapes converge toward center
  const p4End = 19 * fps;         // 570 — institution encounters forces
  const p5End = 24 * fps;         // 720 — adaptation/absorption
  // Resolve: 720-900 — merged form breathing

  const ytpActive = frame > titleEnd && frame < p5End;

  // === SCREEN SHAKE ===
  const transitionFrames: [number, number][] = [
    [titleEnd - 3, titleEnd + 5],
    [titleEnd + 50, titleEnd + 56],
    [titleEnd + 100, titleEnd + 106],
    [p2End - 4, p2End + 8],
    [p2End + 40, p2End + 48],
    [p3End - 6, p3End + 10],
    [p3End + 60, p3End + 68],
    [p4End - 8, p4End + 12],
    [p4End + 50, p4End + 58],
    [p5End - 15, p5End],
  ];
  const isTransition = transitionFrames.some(([a, b]) => frame >= a && frame <= b);
  const shakeIntensity = !ytpActive ? 0 : isTransition ? 16 : 1.8;
  const { x: sx, y: sy } = shake(frame, shakeIntensity);

  // === FLASH FRAMES ===
  const flashTriggers = [
    titleEnd, titleEnd + 51, titleEnd + 101,
    p2End, p2End + 41, p3End, p3End + 61, p4End, p4End + 51,
  ];
  const isFlash = ytpActive && flashTriggers.some(f => Math.abs(frame - f) < 2);

  // === ZOOM PULSES ===
  const zoomPulses = [
    { f: titleEnd + 1, s: 1.5, d: 8 },
    { f: titleEnd + 51, s: 1.3, d: 6 },
    { f: titleEnd + 101, s: 1.4, d: 7 },
    { f: p2End, s: 1.6, d: 10 },
    { f: p2End + 41, s: 1.3, d: 8 },
    { f: p3End, s: 1.5, d: 10 },
    { f: p3End + 61, s: 1.4, d: 8 },
    { f: p4End, s: 1.7, d: 12 },
    { f: p4End + 51, s: 1.4, d: 8 },
    { f: p5End - 10, s: 1.8, d: 15 },
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

  // === THREE FORCES: triangle, square, circle ===
  // Each approaches from a different edge
  const cx = 400, cy = 200; // center

  // Triangle (digitization) — comes from top-left
  const triProgress = interpolate(frame, [titleEnd, p3End], [0, 1], clamp);
  const triX = interpolate(triProgress, [0, 0.3, 1], [-80, 120, 320], clamp);
  const triY = interpolate(triProgress, [0, 0.3, 1], [-80, 60, 160], clamp);

  // Square (quantization) — comes from right
  const sqProgress = interpolate(frame, [titleEnd + 30, p3End + 20], [0, 1], clamp);
  const sqX = interpolate(sqProgress, [0, 0.3, 1], [900, 650, 480], clamp);
  const sqY = interpolate(sqProgress, [0, 0.3, 1], [100, 140, 180], clamp);

  // Circle (equivalence) — comes from bottom
  const circProgress = interpolate(frame, [titleEnd + 60, p3End + 40], [0, 1], clamp);
  const circX = interpolate(circProgress, [0, 0.3, 1], [200, 300, 380], clamp);
  const circY = interpolate(circProgress, [0, 0.3, 1], [520, 380, 230], clamp);

  // Shape sizes — they grow as they approach
  const forceSize = interpolate(frame, [titleEnd, p3End], [30, 60], clamp);

  // Institution (small hexagonal shape at center)
  const instAppear = interpolate(frame, [titleEnd + 20, titleEnd + 60], [0, 1], clamp);

  // === ADAPTATION PHASE (p3End to p5End) ===
  const adaptP = interpolate(
    frame, [p3End + 30, p5End - 60], [0, 1],
    { ...clamp, easing: Easing.inOut(Easing.cubic) },
  );

  // Forces absorb into institution
  const absorbTriX = interpolate(adaptP, [0, 1], [triX, cx]);
  const absorbTriY = interpolate(adaptP, [0, 1], [triY, cy]);
  const absorbSqX = interpolate(adaptP, [0, 1], [sqX, cx]);
  const absorbSqY = interpolate(adaptP, [0, 1], [sqY, cy]);
  const absorbCircX = interpolate(adaptP, [0, 1], [circX, cy]);
  const absorbCircY = interpolate(adaptP, [0, 1], [circY, cy]);

  // Institution morph — grows and changes shape
  const instScale = interpolate(adaptP, [0, 0.4, 1], [1, 1.2, 2.5], clamp);
  const instRotation = interpolate(adaptP, [0, 1], [0, 360], clamp);

  // === RESOLVE ===
  const resolveP = interpolate(frame, [p5End, p5End + 40], [0, 1], clamp);
  const resolveBreathe = frame >= p5End
    ? interpolate(Math.sin((frame - p5End) * 0.035), [-1, 1], [0.9, 1.1])
    : 1;

  // Merged form: three colors pulse through it
  const colorCycle = frame >= p5End ? (frame - p5End) * 0.02 : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: palette.bgDark }}>
      <Audio src={staticFile("audio/the-three-laws.mp3")} volume={1} />

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
                <radialGradient id="tl-merge-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={palette.warmGold} stopOpacity={0.4} />
                  <stop offset="40%" stopColor={palette.coolBlue} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={palette.bgDark} stopOpacity={0} />
                </radialGradient>
              </defs>

              {/* === GLITCH BARS === */}
              {ytpActive && GLITCH_BARS.map((bar, i) => {
                const active = Math.abs(frame - bar.trigger - titleEnd) < 3 ||
                  (hash(frame * 17 + i * 3) > 0.9);
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

              {/* === INSTITUTION (center hex) === */}
              {instAppear > 0 && (() => {
                const iSize = 25 * instAppear * instScale * resolveBreathe;
                const iRot = instRotation;
                // Institution as a hexagon
                const hexPoints = Array.from({ length: 6 }, (_, i) => {
                  const angle = (Math.PI / 3) * i + (iRot * Math.PI / 180);
                  return `${cx + iSize * Math.cos(angle)},${cy + iSize * Math.sin(angle)}`;
                }).join(" ");

                // In resolve phase, show merged colors
                const isFused = adaptP > 0.8;
                const baseColor = isFused ? palette.warmGold : palette.coolBlue;

                return (
                  <g>
                    {/* Glow behind institution during adaptation */}
                    {adaptP > 0.3 && (
                      <ellipse cx={cx} cy={cy}
                        rx={80 * adaptP * resolveBreathe}
                        ry={80 * adaptP * resolveBreathe}
                        fill="url(#tl-merge-glow)"
                        opacity={adaptP * 0.6}
                      />
                    )}
                    <polygon
                      points={hexPoints}
                      fill={baseColor}
                      opacity={0.15 * instAppear}
                      stroke={baseColor}
                      strokeWidth={2}
                    />
                    {/* During/after adaptation: three color rings */}
                    {adaptP > 0.2 && FORCE_COLORS.map((col, ci) => {
                      const ringR = iSize * (1.2 + ci * 0.35) * resolveBreathe;
                      const ringOp = interpolate(adaptP, [0.2, 0.8], [0, 0.5], clamp);
                      const pulseMod = frame >= p5End
                        ? interpolate(Math.sin(colorCycle + ci * 2.1), [-1, 1], [0.3, 0.7])
                        : ringOp;
                      return (
                        <circle key={`ring-${ci}`}
                          cx={cx} cy={cy} r={ringR}
                          fill="none" stroke={col}
                          strokeWidth={1.5 + ci * 0.5}
                          opacity={pulseMod}
                          strokeDasharray={frame >= p5End ? "none" : `${4 + ci * 2},${3 + ci}`}
                        />
                      );
                    })}
                  </g>
                );
              })()}

              {/* === TRIANGLE (digitization) === */}
              {triProgress > 0 && adaptP < 1 && (() => {
                const tx = frame >= p3End + 30 ? absorbTriX : triX;
                const ty = frame >= p3End + 30 ? absorbTriY : triY;
                const s = forceSize * (1 - adaptP * 0.7);
                const flickOff = isTransition && hash(frame * 13) > 0.6;
                if (flickOff) return null;
                const pts = `${tx},${ty - s} ${tx - s * 0.866},${ty + s * 0.5} ${tx + s * 0.866},${ty + s * 0.5}`;
                return (
                  <g>
                    <polygon points={pts}
                      fill={FORCE_COLORS[0]} opacity={0.12 * (1 - adaptP)} />
                    <polygon points={pts}
                      fill="none" stroke={FORCE_COLORS[0]} strokeWidth={2.5}
                      opacity={0.8 * (1 - adaptP * 0.6)} />
                  </g>
                );
              })()}

              {/* === SQUARE (quantization) === */}
              {sqProgress > 0 && adaptP < 1 && (() => {
                const sx2 = frame >= p3End + 30 ? absorbSqX : sqX;
                const sy2 = frame >= p3End + 30 ? absorbSqY : sqY;
                const s = forceSize * (1 - adaptP * 0.7);
                const flickOff = isTransition && hash(frame * 19 + 7) > 0.6;
                if (flickOff) return null;
                // Slight rotation for dynamism
                const rot = interpolate(frame, [titleEnd, p4End], [0, 45], clamp);
                return (
                  <g transform={`rotate(${rot}, ${sx2}, ${sy2})`}>
                    <rect x={sx2 - s} y={sy2 - s} width={s * 2} height={s * 2}
                      fill={FORCE_COLORS[1]} opacity={0.12 * (1 - adaptP)} />
                    <rect x={sx2 - s} y={sy2 - s} width={s * 2} height={s * 2}
                      fill="none" stroke={FORCE_COLORS[1]} strokeWidth={2.5}
                      opacity={0.8 * (1 - adaptP * 0.6)} />
                  </g>
                );
              })()}

              {/* === CIRCLE (equivalence) === */}
              {circProgress > 0 && adaptP < 1 && (() => {
                const cx2 = frame >= p3End + 30 ? absorbCircX : circX;
                const cy2 = frame >= p3End + 30 ? absorbCircY : circY;
                const r = forceSize * (1 - adaptP * 0.7);
                const flickOff = isTransition && hash(frame * 23 + 13) > 0.6;
                if (flickOff) return null;
                return (
                  <g>
                    <circle cx={cx2} cy={cy2} r={r}
                      fill={FORCE_COLORS[2]} opacity={0.12 * (1 - adaptP)} />
                    <circle cx={cx2} cy={cy2} r={r}
                      fill="none" stroke={FORCE_COLORS[2]} strokeWidth={2.5}
                      opacity={0.8 * (1 - adaptP * 0.6)} />
                  </g>
                );
              })()}

              {/* === CONVERGENCE ENERGY LINES === */}
              {frame >= p2End && frame < p5End && (() => {
                const energyP = interpolate(frame, [p2End, p3End + 60], [0, 1], clamp);
                if (energyP <= 0) return null;
                const forces = [
                  { x: frame >= p3End + 30 ? absorbTriX : triX, y: frame >= p3End + 30 ? absorbTriY : triY, col: FORCE_COLORS[0] },
                  { x: frame >= p3End + 30 ? absorbSqX : sqX, y: frame >= p3End + 30 ? absorbSqY : sqY, col: FORCE_COLORS[1] },
                  { x: frame >= p3End + 30 ? absorbCircX : circX, y: frame >= p3End + 30 ? absorbCircY : circY, col: FORCE_COLORS[2] },
                ];
                return (
                  <g>
                    {forces.map((f, i) => {
                      // Particles flowing from forces to center
                      return Array.from({ length: 5 }, (_, j) => {
                        const t = ((frame * 0.025 + j * 0.2 + i * 0.33) % 1);
                        const px = f.x + (cx - f.x) * t;
                        const py = f.y + (cy - f.y) * t;
                        const op = interpolate(t, [0, 0.1, 0.9, 1], [0, 0.6, 0.6, 0], clamp);
                        return (
                          <circle key={`ep-${i}-${j}`}
                            cx={px} cy={py} r={2}
                            fill={f.col} opacity={op * energyP} />
                        );
                      });
                    })}
                  </g>
                );
              })()}

              {/* === RESOLVE: breathing merged form with orbital pulses === */}
              {frame >= p5End && (() => {
                // Orbiting force echoes
                const orbitAngle = (frame - p5End) * 0.02;
                const orbitR = 50 * resolveBreathe;
                return (
                  <g opacity={resolveP}>
                    {FORCE_COLORS.map((col, i) => {
                      const angle = orbitAngle + (i * Math.PI * 2) / 3;
                      const ox = cx + orbitR * Math.cos(angle);
                      const oy = cy + orbitR * Math.sin(angle) * 0.6;
                      return (
                        <g key={`orb-${i}`}>
                          <circle cx={ox} cy={oy} r={4 * resolveBreathe}
                            fill={col} opacity={0.7} />
                          <line x1={cx} y1={cy} x2={ox} y2={oy}
                            stroke={col} strokeWidth={0.5}
                            opacity={0.15} />
                        </g>
                      );
                    })}
                    {/* Center calm pulse */}
                    <circle cx={cx} cy={cy} r={8 * resolveBreathe}
                      fill={palette.warmGold} opacity={0.6} />
                  </g>
                );
              })()}

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

      {/* === CLAUDEVISION CAPTION === */}
      <div style={{
        position: "absolute",
        bottom: 8,
        right: 12,
        fontFamily: "Outfit, sans-serif",
        fontSize: 11,
        color: "rgba(255,255,255,0.35)",
        letterSpacing: 1.5,
      }}>ClaudeVision</div>
    </AbsoluteFill>
  );
};
