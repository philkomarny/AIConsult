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

// Left cluster (warm gold dots)
const LEFT_CLUSTER = Array.from({ length: 18 }, (_, i) => ({
  x: 80 + hash(i * 41) * 160,
  y: 100 + hash(i * 67) * 200,
  r: 3 + hash(i * 89) * 4,
  phase: hash(i * 31) * Math.PI * 2,
  baseSpeed: 0.03 + hash(i * 53) * 0.04,
}));

// Right cluster (cool blue dots)
const RIGHT_CLUSTER = Array.from({ length: 18 }, (_, i) => ({
  x: 560 + hash(i * 43) * 160,
  y: 100 + hash(i * 71) * 200,
  r: 3 + hash(i * 97) * 4,
  phase: hash(i * 37) * Math.PI * 2,
  baseSpeed: 0.05 + hash(i * 59) * 0.03,
}));

// Glitch bars
const GLITCH_BARS = Array.from({ length: 14 }, (_, i) => ({
  y: hash(i * 37) * 400,
  h: 2 + hash(i * 59) * 10,
  color: i % 2 === 0 ? palette.warmGold : palette.brightBlue,
  trigger: Math.floor(hash(i * 23) * 400) + 120,
}));

export const TheNod: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // === PHASE TIMING ===
  const titleEnd = 4 * fps;       // 120
  const p2End = 9 * fps;          // 270 — two clusters appear, different rhythms
  const p3End = 14 * fps;         // 420 — bridge begins building
  const p4End = 19 * fps;         // 570 — bridge connects, rhythms start syncing
  const p5End = 24 * fps;         // 720 — full sync, colors blending
  // Resolve: 720-900

  const ytpActive = frame > titleEnd && frame < p5End;

  // === SCREEN SHAKE ===
  const transitionFrames: [number, number][] = [
    [titleEnd - 3, titleEnd + 5],
    [titleEnd + 55, titleEnd + 61],
    [titleEnd + 105, titleEnd + 111],
    [p2End - 4, p2End + 6],
    [p2End + 45, p2End + 53],
    [p3End - 6, p3End + 8],
    [p3End + 50, p3End + 58],
    [p4End - 8, p4End + 10],
    [p4End + 40, p4End + 48],
    [p5End - 12, p5End],
  ];
  const isTransition = transitionFrames.some(([a, b]) => frame >= a && frame <= b);
  const shakeIntensity = !ytpActive ? 0 : isTransition ? 13 : 1.1;
  const { x: sx, y: sy } = shake(frame, shakeIntensity);

  // === FLASH FRAMES ===
  const flashTriggers = [
    titleEnd, titleEnd + 56, titleEnd + 106,
    p2End, p2End + 46, p3End, p3End + 51, p4End, p4End + 41,
  ];
  const isFlash = ytpActive && flashTriggers.some(f => Math.abs(frame - f) < 2);

  // === ZOOM PULSES ===
  const zoomPulses = [
    { f: titleEnd + 1, s: 1.4, d: 8 },
    { f: titleEnd + 56, s: 1.3, d: 6 },
    { f: titleEnd + 106, s: 1.35, d: 7 },
    { f: p2End, s: 1.5, d: 10 },
    { f: p2End + 46, s: 1.3, d: 8 },
    { f: p3End, s: 1.5, d: 10 },
    { f: p3End + 51, s: 1.4, d: 8 },
    { f: p4End, s: 1.6, d: 12 },
    { f: p4End + 41, s: 1.35, d: 8 },
    { f: p5End - 10, s: 1.7, d: 15 },
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

  // === RHYTHM SYNC ===
  // Left cluster has faster rhythm, right cluster has slower
  // They gradually synchronize as bridge connects
  const syncProgress = interpolate(frame, [p3End + 30, p5End], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const leftRhythm = (f: number, phase: number, speed: number) => {
    const baseFreq = speed;
    const syncFreq = 0.04; // target synchronized frequency
    const freq = interpolate(syncProgress, [0, 1], [baseFreq, syncFreq]);
    return Math.sin(f * freq + phase);
  };
  const rightRhythm = (f: number, phase: number, speed: number) => {
    const baseFreq = speed;
    const syncFreq = 0.04;
    const freq = interpolate(syncProgress, [0, 1], [baseFreq, syncFreq]);
    return Math.sin(f * freq + phase);
  };

  // === BRIDGE BUILDING ===
  const bridgeBuildP = interpolate(frame, [p2End + 30, p4End], [0, 1], clamp);

  // === COLOR BLENDING ===
  const colorBlend = interpolate(frame, [p4End, p5End], [0, 1], clamp);

  // === RESOLVE ===
  const resolveP = interpolate(frame, [p5End, p5End + 40], [0, 1], clamp);
  const resolveBreathe = frame >= p5End
    ? interpolate(Math.sin((frame - p5End) * 0.04), [-1, 1], [0.93, 1.07])
    : 1;

  // Bridge midpoint
  const bridgeMidX = 400;
  const bridgeMidY = 200;

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
                <radialGradient id="nod-left-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={palette.warmGold} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={palette.warmGold} stopOpacity={0} />
                </radialGradient>
                <radialGradient id="nod-right-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={palette.coolBlue} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={palette.coolBlue} stopOpacity={0} />
                </radialGradient>
                <linearGradient id="nod-bridge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={palette.warmGold} stopOpacity={0.6} />
                  <stop offset="50%" stopColor={palette.brightBlue} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={palette.coolBlue} stopOpacity={0.6} />
                </linearGradient>
                <radialGradient id="nod-resolve-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={palette.warmGold} stopOpacity={0.12} />
                  <stop offset="50%" stopColor={palette.brightBlue} stopOpacity={0.06} />
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
                    opacity={0.3 + hash(frame * 2 + i) * 0.4}
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
                    opacity={0.04}
                  />
                );
              })}

              {/* === LEFT CLUSTER GLOW === */}
              {(() => {
                const appear = interpolate(frame, [titleEnd, titleEnd + 30], [0, 1], clamp);
                if (appear <= 0) return null;
                return (
                  <ellipse cx={160} cy={200}
                    rx={120 * appear * (frame >= p5End ? resolveBreathe : 1)}
                    ry={100 * appear * (frame >= p5End ? resolveBreathe : 1)}
                    fill="url(#nod-left-glow)"
                    opacity={appear * 0.5}
                  />
                );
              })()}

              {/* === RIGHT CLUSTER GLOW === */}
              {(() => {
                const appear = interpolate(frame, [titleEnd + 15, titleEnd + 45], [0, 1], clamp);
                if (appear <= 0) return null;
                return (
                  <ellipse cx={640} cy={200}
                    rx={120 * appear * (frame >= p5End ? resolveBreathe : 1)}
                    ry={100 * appear * (frame >= p5End ? resolveBreathe : 1)}
                    fill="url(#nod-right-glow)"
                    opacity={appear * 0.5}
                  />
                );
              })()}

              {/* === LEFT CLUSTER DOTS (warm gold) === */}
              {LEFT_CLUSTER.map((dot, i) => {
                const appear = spring({
                  frame: frame - titleEnd - 5 - i * 3,
                  fps,
                  config: { damping: 10, stiffness: 200, mass: 0.5 },
                });
                const scale = Math.max(0, appear);
                if (scale <= 0) return null;

                const rhythm = leftRhythm(frame, dot.phase, dot.baseSpeed);
                const pulse = interpolate(rhythm, [-1, 1], [0.5, 1.2]);
                const yBob = rhythm * 5;

                // Color blending toward center
                const blendedColor = colorBlend > 0
                  ? `rgba(${Math.round(212 + (168 - 212) * colorBlend * 0.3)}, ${Math.round(165 + (197 - 165) * colorBlend * 0.3)}, ${Math.round(116 + (216 - 116) * colorBlend * 0.3)}, ${0.7 * pulse})`
                  : palette.warmGold;

                const glitchFlicker = ytpActive && hash(frame * 9 + i * 13) > 0.94 ? 0 : 1;

                return (
                  <circle
                    key={`lc-${i}`}
                    cx={dot.x}
                    cy={dot.y + yBob}
                    r={dot.r * scale * pulse * (frame >= p5End ? resolveBreathe : 1)}
                    fill={blendedColor}
                    opacity={0.7 * pulse * scale * glitchFlicker}
                  />
                );
              })}

              {/* === RIGHT CLUSTER DOTS (cool blue) === */}
              {RIGHT_CLUSTER.map((dot, i) => {
                const appear = spring({
                  frame: frame - titleEnd - 20 - i * 3,
                  fps,
                  config: { damping: 10, stiffness: 200, mass: 0.5 },
                });
                const scale = Math.max(0, appear);
                if (scale <= 0) return null;

                const rhythm = rightRhythm(frame, dot.phase, dot.baseSpeed);
                const pulse = interpolate(rhythm, [-1, 1], [0.5, 1.2]);
                const yBob = rhythm * 5;

                const blendedColor = colorBlend > 0
                  ? `rgba(${Math.round(168 + (212 - 168) * colorBlend * 0.3)}, ${Math.round(197 + (165 - 197) * colorBlend * 0.3)}, ${Math.round(216 + (116 - 216) * colorBlend * 0.3)}, ${0.7 * pulse})`
                  : palette.coolBlue;

                const glitchFlicker = ytpActive && hash(frame * 11 + i * 17) > 0.94 ? 0 : 1;

                return (
                  <circle
                    key={`rc-${i}`}
                    cx={dot.x}
                    cy={dot.y + yBob}
                    r={dot.r * scale * pulse * (frame >= p5End ? resolveBreathe : 1)}
                    fill={blendedColor}
                    opacity={0.7 * pulse * scale * glitchFlicker}
                  />
                );
              })}

              {/* === BRIDGE OF LIGHT === */}
              {bridgeBuildP > 0 && (() => {
                const leftAnchorX = 240;
                const rightAnchorX = 560;
                const bridgeEndX = leftAnchorX + (rightAnchorX - leftAnchorX) * bridgeBuildP;

                // Bridge main line
                const bridgeOpacity = interpolate(bridgeBuildP, [0, 0.3, 1], [0, 0.15, 0.35], clamp);
                const glitchBreak = ytpActive && isTransition;

                return (
                  <g>
                    {!glitchBreak && (
                      <>
                        <line
                          x1={leftAnchorX} y1={200}
                          x2={bridgeEndX} y2={200}
                          stroke="url(#nod-bridge-grad)"
                          strokeWidth={2 + bridgeBuildP * 2}
                          opacity={bridgeOpacity}
                        />
                        {/* Secondary bridge lines */}
                        <line
                          x1={leftAnchorX} y1={195}
                          x2={bridgeEndX} y2={195}
                          stroke={palette.warmGold}
                          strokeWidth={0.5}
                          opacity={bridgeOpacity * 0.4}
                        />
                        <line
                          x1={leftAnchorX} y1={205}
                          x2={bridgeEndX} y2={205}
                          stroke={palette.coolBlue}
                          strokeWidth={0.5}
                          opacity={bridgeOpacity * 0.4}
                        />
                      </>
                    )}

                    {/* Bridge particles traveling along it */}
                    {bridgeBuildP > 0.2 && Array.from({ length: 12 }, (_, i) => {
                      const t = ((frame * 0.018 + i * 0.083) % 1);
                      if (t > bridgeBuildP) return null;
                      const px = leftAnchorX + (rightAnchorX - leftAnchorX) * t;
                      const py = 200 + Math.sin(t * Math.PI * 3 + frame * 0.05) * 8;
                      const isWarm = i % 2 === 0;
                      return (
                        <circle
                          key={`bp-${i}`}
                          cx={px} cy={py}
                          r={2 + hash(i * 29) * 1.5}
                          fill={isWarm ? palette.warmGold : palette.coolBlue}
                          opacity={interpolate(t, [0, 0.1, 0.9, 1], [0, 0.5, 0.5, 0], clamp) * bridgeBuildP}
                        />
                      );
                    })}

                    {/* Bridge glow at connection point */}
                    {bridgeBuildP > 0.9 && (
                      <ellipse
                        cx={bridgeMidX} cy={bridgeMidY}
                        rx={30 * (bridgeBuildP - 0.9) * 10 * (frame >= p5End ? resolveBreathe : 1)}
                        ry={20 * (bridgeBuildP - 0.9) * 10 * (frame >= p5End ? resolveBreathe : 1)}
                        fill={palette.brightBlue}
                        opacity={0.1 * (bridgeBuildP - 0.9) * 10}
                      />
                    )}
                  </g>
                );
              })()}

              {/* === INTRA-CLUSTER FILAMENTS === */}
              {LEFT_CLUSTER.slice(0, 8).map((dot, i) => {
                const next = LEFT_CLUSTER[(i + 1) % LEFT_CLUSTER.length];
                const filP = interpolate(frame, [titleEnd + 60 + i * 8, titleEnd + 90 + i * 8], [0, 1], clamp);
                if (filP <= 0) return null;
                return (
                  <line
                    key={`lf-${i}`}
                    x1={dot.x} y1={dot.y}
                    x2={next.x} y2={next.y}
                    stroke={palette.warmGold}
                    strokeWidth={0.4}
                    opacity={filP * 0.08}
                  />
                );
              })}
              {RIGHT_CLUSTER.slice(0, 8).map((dot, i) => {
                const next = RIGHT_CLUSTER[(i + 1) % RIGHT_CLUSTER.length];
                const filP = interpolate(frame, [titleEnd + 80 + i * 8, titleEnd + 110 + i * 8], [0, 1], clamp);
                if (filP <= 0) return null;
                return (
                  <line
                    key={`rf-${i}`}
                    x1={dot.x} y1={dot.y}
                    x2={next.x} y2={next.y}
                    stroke={palette.coolBlue}
                    strokeWidth={0.4}
                    opacity={filP * 0.08}
                  />
                );
              })}

              {/* === RESOLVE: both clusters breathing in unison, bridge glowing warmly === */}
              {frame >= p5End && (
                <g opacity={resolveP}>
                  {/* Full-width bridge glow */}
                  <ellipse
                    cx={400} cy={200}
                    rx={300 * resolveP * resolveBreathe}
                    ry={60 * resolveP * resolveBreathe}
                    fill="url(#nod-resolve-glow)"
                    opacity={0.5 * resolveP}
                  />
                  {/* Warm bridge line */}
                  <line
                    x1={160} y1={200} x2={640} y2={200}
                    stroke={palette.warmGold}
                    strokeWidth={1.5 * resolveBreathe}
                    opacity={0.2 * resolveP}
                  />
                  {/* Gentle resolve particles */}
                  {Array.from({ length: 8 }, (_, i) => {
                    const t = ((frame - p5End) * 0.01 + i * 0.125) % 1;
                    const px = 160 + t * 480;
                    const py = 200 + Math.sin(t * Math.PI * 2 + (frame - p5End) * 0.03) * 15 * resolveBreathe;
                    return (
                      <circle
                        key={`rp-${i}`}
                        cx={px} cy={py}
                        r={2.5 * resolveBreathe}
                        fill={i % 2 === 0 ? palette.warmGold : palette.coolBlue}
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
