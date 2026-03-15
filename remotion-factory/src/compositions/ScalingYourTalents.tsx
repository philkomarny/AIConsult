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

// Concentric rings of capability
const RINGS = Array.from({ length: 7 }, (_, i) => ({
  r: 30 + i * 25,
  dots: Array.from({ length: 4 + i * 2 }, (_, j) => ({
    angle: (j / (4 + i * 2)) * Math.PI * 2 + hash(i * 100 + j * 41) * 0.3,
    r: 2 + hash(i * 100 + j * 67) * 2,
    phase: hash(i * 100 + j * 83) * Math.PI * 2,
  })),
  color: i % 2 === 0 ? palette.warmGold : palette.brightBlue,
  spawnFrame: i * 25, // staggered appearance
}));

// Constellation points for the resolve
const CONSTELLATION = Array.from({ length: 50 }, (_, i) => {
  const angle = hash(i * 47) * Math.PI * 2;
  const dist = 20 + hash(i * 59) * 170;
  return {
    x: 400 + Math.cos(angle) * dist,
    y: 200 + Math.sin(angle) * dist * 0.7,
    r: 1 + hash(i * 73) * 2.5,
    phase: hash(i * 91) * Math.PI * 2,
    brightness: 0.3 + hash(i * 37) * 0.7,
  };
});

// Glitch bars
const GLITCH_BARS = Array.from({ length: 12 }, (_, i) => ({
  y: hash(i * 31) * 400,
  h: 2 + hash(i * 47) * 10,
  color: i % 3 === 0 ? palette.warmGold : i % 3 === 1 ? palette.brightBlue : "#e9c46a",
  trigger: Math.floor(hash(i * 13) * 400) + 120,
}));

export const ScalingYourTalents: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // === PHASE TIMING (30s = 900 frames at 30fps) ===
  const titleEnd = 4 * fps;       // 120
  const p2End = 9 * fps;          // 270 — Single spark appears, pulses
  const p3End = 14 * fps;         // 420 — Concentric rings expand outward
  const p4End = 19 * fps;         // 570 — Rings spawn capability dots, acceleration
  const p5End = 24 * fps;         // 720 — Gap collapses inward
  // Resolve: 720-900

  const ytpActive = frame > titleEnd && frame < p5End;

  // === SCREEN SHAKE ===
  const transitionFrames: [number, number][] = [
    [titleEnd - 3, titleEnd + 5],
    [titleEnd + 35, titleEnd + 42],
    [titleEnd + 75, titleEnd + 82],
    [titleEnd + 115, titleEnd + 122],
    [p2End - 5, p2End + 8],
    [p2End + 50, p2End + 58],
    [p3End - 5, p3End + 10],
    [p3End + 45, p3End + 52],
    [p4End - 8, p4End + 12],
    [p5End - 12, p5End],
  ];
  const isTransition = transitionFrames.some(([a, b]) => frame >= a && frame <= b);
  const shakeIntensity = !ytpActive ? 0 : isTransition ? 15 : 1.4;
  const { x: sx, y: sy } = shake(frame, shakeIntensity);

  // === FLASH FRAMES ===
  const flashTriggers = [
    titleEnd, titleEnd + 36, titleEnd + 76, titleEnd + 116,
    p2End, p2End + 51, p3End, p3End + 46, p4End,
  ];
  const isFlash = ytpActive && flashTriggers.some(f => Math.abs(frame - f) < 2);

  // === ZOOM PULSES ===
  const zoomPulses = [
    { f: titleEnd + 1, s: 1.5, d: 8 },
    { f: titleEnd + 36, s: 1.35, d: 6 },
    { f: titleEnd + 76, s: 1.4, d: 7 },
    { f: titleEnd + 116, s: 1.3, d: 6 },
    { f: p2End, s: 1.6, d: 10 },
    { f: p3End, s: 1.5, d: 10 },
    { f: p3End + 46, s: 1.3, d: 8 },
    { f: p4End, s: 1.8, d: 14 },
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

  // === CENTRAL SPARK ===
  const sparkAppear = interpolate(frame, [titleEnd, titleEnd + 30], [0, 1], clamp);
  const sparkPulse = sparkAppear > 0
    ? 1 + Math.sin(frame * 0.12) * 0.3 * sparkAppear
    : 0;
  const sparkGrow = interpolate(frame, [titleEnd, p2End], [2, 6], clamp);

  // === RING EXPANSION ===
  const ringExpansion = interpolate(frame, [p2End, p3End + 60], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });

  // === CAPABILITY DOTS SPAWNING ===
  const dotSpawnP = interpolate(frame, [p3End, p4End], [0, 1], clamp);

  // === COLLAPSE INWARD (gap between knowing and building closes) ===
  const collapseP = interpolate(frame, [p4End, p5End], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });

  // === RESOLVE ===
  const resolveP = interpolate(frame, [p5End, p5End + 40], [0, 1], clamp);
  const resolveBreathe = frame >= p5End
    ? interpolate(Math.sin((frame - p5End) * 0.025), [-1, 1], [0.93, 1.07])
    : 1;

  const cx = 400;
  const cy = 200;

  return (
    <AbsoluteFill style={{ backgroundColor: palette.bgDark }}>
      <Audio src={staticFile("audio/scaling-your-talents.mp3")} volume={1} />

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
                <radialGradient id="syt-spark-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={palette.warmGold} stopOpacity={0.7} />
                  <stop offset="40%" stopColor={palette.warmGold} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={palette.bgDark} stopOpacity={0} />
                </radialGradient>
                <radialGradient id="syt-constellation-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={palette.warmGold} stopOpacity={0.25} />
                  <stop offset="30%" stopColor={palette.brightBlue} stopOpacity={0.1} />
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

              {/* === CENTRAL SPARK === */}
              {sparkAppear > 0 && (
                <g>
                  {/* Outer glow */}
                  <ellipse
                    cx={cx} cy={cy}
                    rx={40 * sparkPulse * sparkAppear * resolveBreathe}
                    ry={40 * sparkPulse * sparkAppear * resolveBreathe}
                    fill="url(#syt-spark-glow)"
                    opacity={sparkAppear * 0.8}
                  />
                  {/* Core */}
                  <circle
                    cx={cx} cy={cy}
                    r={sparkGrow * sparkPulse * resolveBreathe}
                    fill={palette.warmGold}
                    opacity={0.95}
                  />
                  {/* Halo ring */}
                  <circle
                    cx={cx} cy={cy}
                    r={(sparkGrow + 6) * sparkAppear * resolveBreathe}
                    fill="none"
                    stroke={palette.warmGold}
                    strokeWidth={1}
                    opacity={0.3 * sparkAppear}
                  />
                  {/* Radiating spikes */}
                  {Array.from({ length: 6 }, (_, i) => {
                    const a = (i / 6) * Math.PI * 2 + frame * 0.03;
                    const len = (8 + sparkPulse * 12) * sparkAppear;
                    return (
                      <line
                        key={`spike-${i}`}
                        x1={cx + Math.cos(a) * (sparkGrow + 4)}
                        y1={cy + Math.sin(a) * (sparkGrow + 4)}
                        x2={cx + Math.cos(a) * (sparkGrow + 4 + len)}
                        y2={cy + Math.sin(a) * (sparkGrow + 4 + len)}
                        stroke={palette.warmGold}
                        strokeWidth={1}
                        opacity={0.4 * sparkAppear * (0.5 + Math.sin(frame * 0.15 + i) * 0.5)}
                      />
                    );
                  })}
                </g>
              )}

              {/* === CONCENTRIC RINGS === */}
              {ringExpansion > 0 && RINGS.map((ring, ri) => {
                const ringP = interpolate(
                  ringExpansion,
                  [ri * 0.1, ri * 0.1 + 0.3],
                  [0, 1],
                  clamp
                );
                if (ringP <= 0) return null;
                const currentR = ring.r * ringP * (1 - collapseP * 0.6) * resolveBreathe;
                const ringOp = frame >= p5End
                  ? interpolate(resolveP, [0, 1], [0.3, 0.15])
                  : 0.25 + ringP * 0.15;
                if (isTransition && hash(frame * 13 + ri * 7) > 0.7) return null;
                return (
                  <g key={`ring-${ri}`}>
                    {/* Ring circle */}
                    <circle
                      cx={cx} cy={cy}
                      r={currentR}
                      fill="none"
                      stroke={ring.color}
                      strokeWidth={1.2 * ringP}
                      opacity={ringOp}
                      strokeDasharray={frame < p4End ? `${3 + ri * 2},${2 + ri}` : "none"}
                    />
                    {/* Capability dots on the ring */}
                    {dotSpawnP > 0 && ring.dots.map((dot, di) => {
                      const dotP = interpolate(
                        dotSpawnP,
                        [di * 0.05 + ri * 0.08, di * 0.05 + ri * 0.08 + 0.2],
                        [0, 1],
                        clamp
                      );
                      if (dotP <= 0) return null;
                      const a = dot.angle + frame * 0.015 * (ri % 2 === 0 ? 1 : -1);
                      const dx = cx + Math.cos(a) * currentR;
                      const dy = cy + Math.sin(a) * currentR;
                      const breatheR = frame >= p5End
                        ? resolveBreathe * (0.8 + Math.sin(frame * 0.04 + dot.phase) * 0.2)
                        : 1;
                      if (ytpActive && hash(frame * 11 + ri * 100 + di * 7) > 0.94) return null;
                      return (
                        <circle
                          key={`rd-${ri}-${di}`}
                          cx={dx} cy={dy}
                          r={dot.r * dotP * breatheR}
                          fill={ring.color}
                          opacity={dotP * 0.7}
                        />
                      );
                    })}
                  </g>
                );
              })}

              {/* === ACCELERATION LINES (collapse phase) === */}
              {collapseP > 0 && collapseP < 1 && Array.from({ length: 16 }, (_, i) => {
                const a = (i / 16) * Math.PI * 2;
                const outerR = 200 * (1 - collapseP * 0.5);
                const innerR = 30 * (1 - collapseP * 0.3);
                const lineP = interpolate(collapseP, [0, 0.3], [0, 1], clamp);
                return (
                  <line
                    key={`acc-${i}`}
                    x1={cx + Math.cos(a) * outerR}
                    y1={cy + Math.sin(a) * outerR * 0.7}
                    x2={cx + Math.cos(a) * innerR}
                    y2={cy + Math.sin(a) * innerR * 0.7}
                    stroke={palette.brightBlue}
                    strokeWidth={0.8}
                    opacity={lineP * 0.2 * (1 - collapseP * 0.5)}
                  />
                );
              })}

              {/* === INWARD-RUSHING PARTICLES (collapse) === */}
              {collapseP > 0.2 && Array.from({ length: 20 }, (_, i) => {
                const a = hash(i * 53) * Math.PI * 2;
                const startDist = 180 + hash(i * 67) * 60;
                const t = ((frame * 0.04 + hash(i * 41) * 2) % 1);
                const dist = startDist * (1 - t) * (1 - collapseP * 0.3);
                return (
                  <circle
                    key={`rush-${i}`}
                    cx={cx + Math.cos(a) * dist}
                    cy={cy + Math.sin(a) * dist * 0.7}
                    r={1 + t * 1.5}
                    fill={palette.warmGold}
                    opacity={(1 - t) * collapseP * 0.5}
                  />
                );
              })}

              {/* === CONSTELLATION (resolve) === */}
              {frame >= p5End - 20 && CONSTELLATION.map((star, i) => {
                const starP = interpolate(
                  frame,
                  [p5End - 20 + i * 1.5, p5End + 20 + i * 1.5],
                  [0, 1],
                  clamp
                );
                if (starP <= 0) return null;
                const twinkle = 0.5 + Math.sin(frame * 0.05 + star.phase) * 0.5;
                return (
                  <circle
                    key={`star-${i}`}
                    cx={star.x}
                    cy={star.y}
                    r={star.r * starP * resolveBreathe}
                    fill={i % 3 === 0 ? palette.warmGold : palette.brightBlue}
                    opacity={starP * star.brightness * twinkle * resolveP}
                  />
                );
              })}

              {/* === CONSTELLATION CONNECTIONS === */}
              {resolveP > 0.3 && CONSTELLATION.filter((_, i) => i < 30).map((star, i) => {
                return CONSTELLATION.slice(i + 1).filter((other, j) => {
                  if (j > 5) return false;
                  const dx = star.x - other.x;
                  const dy = star.y - other.y;
                  return Math.sqrt(dx * dx + dy * dy) < 100;
                }).map((other, j) => (
                  <line
                    key={`cline-${i}-${j}`}
                    x1={star.x} y1={star.y}
                    x2={other.x} y2={other.y}
                    stroke={palette.coolBlue}
                    strokeWidth={0.4}
                    opacity={resolveP * 0.06 * resolveBreathe}
                  />
                ));
              })}

              {/* === RESOLVE CENTER GLOW === */}
              {resolveP > 0 && (
                <ellipse
                  cx={cx} cy={cy}
                  rx={100 * resolveP * resolveBreathe}
                  ry={80 * resolveP * resolveBreathe}
                  fill="url(#syt-constellation-glow)"
                  opacity={resolveP * 0.5}
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
