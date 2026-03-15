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

// Glitch bars
const GLITCH_BARS = Array.from({ length: 14 }, (_, i) => ({
  y: hash(i * 31) * 400,
  h: 2 + hash(i * 47) * 10,
  color: i % 2 === 0 ? palette.warmGold : palette.coolBlue,
  trigger: Math.floor(hash(i * 13) * 400) + 120,
}));

// Generate car profile points (smooth curve evolving over time)
function carProfile(t: number, evolution: number): string {
  // A simplified side profile that evolves: roofline gets smoother
  const baseY = 220;
  const w = 160;
  const h = 60;
  const ox = 120;
  const roofDip = interpolate(evolution, [0, 1], [25, 10]);
  const frontSlope = interpolate(evolution, [0, 1], [0.6, 0.35]);
  const rearSlope = interpolate(evolution, [0, 1], [0.7, 0.45]);
  const cornerR = interpolate(evolution, [0, 1], [2, 12]);

  const pts = [
    `M ${ox} ${baseY}`,
    `L ${ox + w * 0.1} ${baseY - h * frontSlope}`,
    `Q ${ox + w * 0.25} ${baseY - h - roofDip}, ${ox + w * 0.5} ${baseY - h}`,
    `Q ${ox + w * 0.75} ${baseY - h - roofDip * 0.5}, ${ox + w * 0.85} ${baseY - h * rearSlope}`,
    `Q ${ox + w * 0.95} ${baseY - h * 0.2 + cornerR}, ${ox + w} ${baseY}`,
    `Z`,
  ];
  return pts.join(" ");
}

export const The911Doctrine: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // === PHASE TIMING (30s = 900 frames at 30fps) ===
  const titleEnd = 4 * fps;       // 120
  const p2End = 9 * fps;          // 270 — shapes appear, left begins evolving
  const p3End = 14 * fps;         // 420 — continuous refinement vs surface change
  const p4End = 19 * fps;         // 570 — wave of energy hits both
  const p5End = 24 * fps;         // 720 — aftermath: adapted vs cracked
  // Resolve: 720-900

  const ytpActive = frame > titleEnd && frame < p5End;

  // === SCREEN SHAKE ===
  const transitionFrames: [number, number][] = [
    [titleEnd - 3, titleEnd + 5],
    [titleEnd + 40, titleEnd + 46],
    [titleEnd + 90, titleEnd + 96],
    [titleEnd + 140, titleEnd + 146],
    [p2End - 4, p2End + 6],
    [p2End + 50, p2End + 58],
    [p3End - 4, p3End + 10],
    [p3End + 40, p3End + 48],
    [p4End - 8, p4End + 12],
    [p4End + 30, p4End + 38],
    [p5End - 12, p5End],
  ];
  const isTransition = transitionFrames.some(([a, b]) => frame >= a && frame <= b);
  const shakeIntensity = !ytpActive ? 0 : isTransition ? 16 : 1.2;
  const { x: sx, y: sy } = shake(frame, shakeIntensity);

  // === FLASH FRAMES ===
  const flashTriggers = [
    titleEnd, titleEnd + 41, titleEnd + 91, titleEnd + 141,
    p2End, p2End + 51, p3End, p3End + 41, p4End, p4End + 31,
  ];
  const isFlash = ytpActive && flashTriggers.some(f => Math.abs(frame - f) < 2);

  // === ZOOM PULSES ===
  const zoomPulses = [
    { f: titleEnd + 1, s: 1.5, d: 8 },
    { f: titleEnd + 41, s: 1.3, d: 6 },
    { f: titleEnd + 91, s: 1.4, d: 7 },
    { f: titleEnd + 141, s: 1.35, d: 6 },
    { f: p2End, s: 1.5, d: 10 },
    { f: p2End + 51, s: 1.3, d: 8 },
    { f: p3End, s: 1.6, d: 10 },
    { f: p3End + 41, s: 1.4, d: 8 },
    { f: p4End, s: 1.7, d: 12 },
    { f: p4End + 31, s: 1.4, d: 8 },
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

  // === LEFT SHAPE: evolving car profile ===
  const evolution = interpolate(frame, [titleEnd, p4End], [0, 1], clamp);
  // Stutter: occasionally jump back in evolution
  const stutterEvolution = ytpActive && hash(frame * 11) > 0.92
    ? Math.max(0, evolution - 0.15)
    : evolution;

  // === RIGHT SHAPE: rigid rectangle with surface color changes ===
  const rightColorPhase = Math.floor(frame / 90) % 4;
  const rightColors = [palette.coolBlue, "#4a6a7a", "#3a5a6a", palette.coolBlue];
  const rightColor = rightColors[rightColorPhase];

  // === WAVE OF ENERGY (phase 4) ===
  const waveProgress = interpolate(frame, [p3End + 30, p4End], [0, 1], clamp);
  const waveX = interpolate(waveProgress, [0, 1], [-50, 850]);

  // === CRACKING (right shape after wave hits) ===
  const crackProgress = interpolate(frame, [p3End + 80, p4End + 40], [0, 1], clamp);

  // === RESOLVE ===
  const resolveP = interpolate(frame, [p5End, p5End + 40], [0, 1], clamp);
  const resolveBreathe = frame >= p5End
    ? interpolate(Math.sin((frame - p5End) * 0.04), [-1, 1], [0.95, 1.05])
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
                <radialGradient id="911-evolve-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={palette.warmGold} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={palette.warmGold} stopOpacity={0} />
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

              {/* === DIVIDING LINE === */}
              <line
                x1={400} y1={60} x2={400} y2={340}
                stroke={palette.coolBlue}
                strokeWidth={0.5}
                opacity={ytpActive ? 0.15 + (hash(frame * 5) > 0.9 ? 0.3 : 0) : 0.08}
              />

              {/* === LEFT SHAPE: Evolving car profile === */}
              {(() => {
                const appear = interpolate(frame, [titleEnd, titleEnd + 30], [0, 1], clamp);
                if (appear <= 0) return null;
                const adaptWave = waveProgress > 0.3
                  ? interpolate(waveProgress, [0.3, 0.7, 1], [1, 0.85, 1], clamp)
                  : 1;
                const resolveScale = frame >= p5End ? resolveBreathe : 1;
                const resolveOp = frame >= p5End ? interpolate(resolveP, [0, 1], [0.8, 1]) : 1;
                return (
                  <g opacity={appear * resolveOp}
                    transform={`translate(0, 0) scale(${adaptWave * resolveScale})`}
                    style={{ transformOrigin: "200px 200px" } as any}>
                    {/* Glow underneath */}
                    <ellipse cx={200} cy={240} rx={100 * appear} ry={30 * appear}
                      fill="url(#911-evolve-glow)" opacity={0.4} />
                    {/* The evolving profile */}
                    <path
                      d={carProfile(frame, stutterEvolution)}
                      fill={palette.warmGold}
                      opacity={0.15}
                      stroke={palette.warmGold}
                      strokeWidth={2}
                    />
                    {/* Evolution trail lines — ghost of previous forms */}
                    {evolution > 0.2 && Array.from({ length: 4 }, (_, i) => {
                      const pastEvo = Math.max(0, evolution - (i + 1) * 0.15);
                      return (
                        <path
                          key={`trail-${i}`}
                          d={carProfile(frame, pastEvo)}
                          fill="none"
                          stroke={palette.warmGold}
                          strokeWidth={0.5}
                          opacity={0.06 * (4 - i)}
                        />
                      );
                    })}
                    {/* Refinement particles */}
                    {ytpActive && Array.from({ length: 8 }, (_, i) => {
                      const angle = (frame * 0.03 + i * 0.8) % (Math.PI * 2);
                      const dist = 30 + Math.sin(frame * 0.05 + i) * 15;
                      return (
                        <circle
                          key={`rp-${i}`}
                          cx={200 + Math.cos(angle) * dist}
                          cy={200 + Math.sin(angle) * dist * 0.6}
                          r={1 + hash(frame + i * 19) * 1.5}
                          fill={palette.warmGold}
                          opacity={0.3 + hash(frame * 3 + i) * 0.3}
                        />
                      );
                    })}
                  </g>
                );
              })()}

              {/* === RIGHT SHAPE: Rigid rectangle, cosmetic changes only === */}
              {(() => {
                const appear = interpolate(frame, [titleEnd + 15, titleEnd + 45], [0, 1], clamp);
                if (appear <= 0) return null;
                const crackOffset = crackProgress * 15;
                const rightFade = frame >= p5End ? interpolate(resolveP, [0, 1], [0.7, 0.2]) : 1;
                return (
                  <g opacity={appear * rightFade}>
                    {/* Rigid box — never changes shape */}
                    {crackProgress < 0.5 ? (
                      <rect
                        x={500} y={150} width={160} height={100}
                        fill={rightColor}
                        opacity={0.15}
                        stroke={rightColor}
                        strokeWidth={2}
                      />
                    ) : (
                      <>
                        {/* Cracked fragments */}
                        <rect
                          x={500 - crackOffset} y={150 - crackOffset * 0.5}
                          width={75} height={45}
                          fill={rightColor} opacity={0.12}
                          stroke={rightColor} strokeWidth={1.5}
                          transform={`rotate(${crackProgress * -5}, ${537}, ${172})`}
                        />
                        <rect
                          x={585 + crackOffset * 0.7} y={150 + crackOffset * 0.3}
                          width={75} height={45}
                          fill={rightColor} opacity={0.12}
                          stroke={rightColor} strokeWidth={1.5}
                          transform={`rotate(${crackProgress * 4}, ${622}, ${172})`}
                        />
                        <rect
                          x={500 + crackOffset * 0.3} y={205 + crackOffset}
                          width={75} height={45}
                          fill={rightColor} opacity={0.1}
                          stroke={rightColor} strokeWidth={1.5}
                          transform={`rotate(${crackProgress * 6}, ${537}, ${227})`}
                        />
                        <rect
                          x={585 - crackOffset * 0.5} y={205 + crackOffset * 1.2}
                          width={75} height={45}
                          fill={rightColor} opacity={0.08}
                          stroke={rightColor} strokeWidth={1.5}
                          transform={`rotate(${crackProgress * -3}, ${622}, ${227})`}
                        />
                        {/* Crack lines */}
                        {Array.from({ length: 6 }, (_, i) => {
                          const cx = 540 + hash(i * 41) * 80;
                          const cy = 170 + hash(i * 67) * 60;
                          const len = 10 + crackProgress * 30;
                          const angle = hash(i * 23) * Math.PI;
                          return (
                            <line
                              key={`crack-${i}`}
                              x1={cx} y1={cy}
                              x2={cx + Math.cos(angle) * len}
                              y2={cy + Math.sin(angle) * len}
                              stroke={palette.coolBlue}
                              strokeWidth={1}
                              opacity={crackProgress * 0.4}
                            />
                          );
                        })}
                      </>
                    )}
                    {/* Surface color flash — cosmetic "change" */}
                    {ytpActive && hash(frame * 7) > 0.85 && (
                      <rect
                        x={500} y={150} width={160} height={100}
                        fill={rightColors[(rightColorPhase + 1) % 4]}
                        opacity={0.08}
                      />
                    )}
                  </g>
                );
              })()}

              {/* === ENERGY WAVE === */}
              {waveProgress > 0 && waveProgress < 1 && (
                <g>
                  <line
                    x1={waveX} y1={50} x2={waveX} y2={350}
                    stroke={palette.brightBlue}
                    strokeWidth={3}
                    opacity={0.6}
                  />
                  <line
                    x1={waveX - 10} y1={50} x2={waveX - 10} y2={350}
                    stroke={palette.warmGold}
                    strokeWidth={1}
                    opacity={0.3}
                  />
                  <line
                    x1={waveX + 8} y1={50} x2={waveX + 8} y2={350}
                    stroke={palette.coolBlue}
                    strokeWidth={1.5}
                    opacity={0.25}
                  />
                  {/* Wave particles */}
                  {Array.from({ length: 12 }, (_, i) => (
                    <circle
                      key={`wp-${i}`}
                      cx={waveX + (hash(i * 31) - 0.5) * 20}
                      cy={60 + i * 25}
                      r={1.5 + hash(i * 17) * 2}
                      fill={i % 2 === 0 ? palette.brightBlue : palette.warmGold}
                      opacity={0.5}
                    />
                  ))}
                </g>
              )}

              {/* === RESOLVE: evolved shape breathing gracefully === */}
              {frame >= p5End && (
                <g opacity={resolveP}>
                  <ellipse
                    cx={200} cy={220}
                    rx={120 * resolveBreathe}
                    ry={40 * resolveBreathe}
                    fill={palette.warmGold}
                    opacity={0.04}
                  />
                  {/* Gentle orbiting particles */}
                  {Array.from({ length: 6 }, (_, i) => {
                    const angle = (frame - p5End) * 0.02 + i * (Math.PI * 2 / 6);
                    const r = 50 + Math.sin((frame - p5End) * 0.03 + i) * 10;
                    return (
                      <circle
                        key={`resolve-${i}`}
                        cx={200 + Math.cos(angle) * r}
                        cy={210 + Math.sin(angle) * r * 0.4}
                        r={2 * resolveBreathe}
                        fill={palette.warmGold}
                        opacity={0.4 * resolveP}
                      />
                    );
                  })}
                </g>
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
