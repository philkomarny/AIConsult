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

// Silo colors
const SILO_COLORS = ["#e63946", "#2a9d8f", "#e9c46a", "#264653", "#a8c5d8"];

// 5 Silos with trapped dots
const SILOS = Array.from({ length: 5 }, (_, i) => ({
  x: 80 + i * 140,
  w: 80,
  color: SILO_COLORS[i],
  dots: Array.from({ length: 8 }, (_, j) => ({
    relX: 10 + hash(i * 100 + j * 31) * 60,
    y: 40 + hash(i * 100 + j * 47) * 320,
    r: 2 + hash(i * 100 + j * 19) * 2.5,
    phase: hash(i * 100 + j * 73) * Math.PI * 2,
    speed: 0.02 + hash(i * 100 + j * 59) * 0.03,
  })),
}));

// Crack positions per silo
const CRACKS = Array.from({ length: 5 }, (_, si) =>
  Array.from({ length: 6 }, (_, ci) => ({
    y: 40 + ci * 55 + hash(si * 50 + ci * 23) * 30,
    width: 10 + hash(si * 50 + ci * 37) * 30,
    side: hash(si * 50 + ci * 61) > 0.5 ? "left" as const : "right" as const,
  }))
);

// Glitch bars
const GLITCH_BARS = Array.from({ length: 14 }, (_, i) => ({
  y: hash(i * 31) * 400,
  h: 2 + hash(i * 47) * 10,
  color: SILO_COLORS[i % 5],
  trigger: Math.floor(hash(i * 13) * 400) + 120,
}));

export const CultureEatsProcess: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // === PHASE TIMING (30s = 900 frames at 30fps) ===
  const titleEnd = 4 * fps;       // 120
  const p2End = 9 * fps;          // 270 — Silos standing, dots trapped
  const p3End = 14 * fps;         // 420 — Cracks appear, particles leak
  const p4End = 19 * fps;         // 570 — Walls shatter
  const p5End = 24 * fps;         // 720 — Free-flowing unified network
  // Resolve: 720-900

  const ytpActive = frame > titleEnd && frame < p5End;

  // === SCREEN SHAKE ===
  const transitionFrames: [number, number][] = [
    [titleEnd - 3, titleEnd + 5],
    [titleEnd + 45, titleEnd + 52],
    [titleEnd + 90, titleEnd + 97],
    [p2End - 4, p2End + 8],
    [p2End + 55, p2End + 62],
    [p3End - 6, p3End + 10],
    [p3End + 45, p3End + 52],
    [p4End - 8, p4End + 12],
    [p4End + 40, p4End + 48],
    [p5End - 12, p5End],
  ];
  const isTransition = transitionFrames.some(([a, b]) => frame >= a && frame <= b);
  const shakeIntensity = !ytpActive ? 0 : isTransition ? 15 : 1.2;
  const { x: sx, y: sy } = shake(frame, shakeIntensity);

  // === FLASH FRAMES ===
  const flashTriggers = [
    titleEnd, titleEnd + 46, titleEnd + 91,
    p2End, p2End + 56, p3End, p3End + 46, p4End, p4End + 41,
  ];
  const isFlash = ytpActive && flashTriggers.some(f => Math.abs(frame - f) < 2);

  // === ZOOM PULSES ===
  const zoomPulses = [
    { f: titleEnd + 1, s: 1.5, d: 8 },
    { f: titleEnd + 46, s: 1.3, d: 6 },
    { f: titleEnd + 91, s: 1.4, d: 7 },
    { f: p2End, s: 1.5, d: 10 },
    { f: p3End, s: 1.6, d: 10 },
    { f: p3End + 46, s: 1.3, d: 8 },
    { f: p4End, s: 1.9, d: 14 },
    { f: p5End - 10, s: 1.4, d: 12 },
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

  // === WALL INTEGRITY ===
  const crackProgress = interpolate(frame, [p2End, p3End], [0, 1], clamp);
  const wallShatter = interpolate(frame, [p3End + 30, p4End], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });

  // === DOT FREEDOM ===
  const dotFreedom = interpolate(frame, [p3End, p4End + 60], [0, 1], clamp);

  // === UNIFIED ORGANISM ===
  const unifyP = interpolate(frame, [p4End + 30, p5End], [0, 1], clamp);

  // === RESOLVE ===
  const resolveP = interpolate(frame, [p5End, p5End + 40], [0, 1], clamp);
  const resolveBreathe = frame >= p5End
    ? interpolate(Math.sin((frame - p5End) * 0.025), [-1, 1], [0.92, 1.08])
    : 1;

  // All dots flattened for network phase
  const allDots = SILOS.flatMap((silo, si) =>
    silo.dots.map((dot, di) => {
      const homeX = silo.x + dot.relX;
      const homeY = dot.y;
      // freed position: drift toward center organism
      const freeX = 400 + (homeX - 400) * 0.6 + Math.sin(frame * dot.speed + dot.phase) * 30;
      const freeY = 200 + (homeY - 200) * 0.6 + Math.cos(frame * dot.speed + dot.phase * 2) * 20;
      const x = interpolate(dotFreedom, [0, 1], [homeX, freeX]);
      const y = interpolate(dotFreedom, [0, 1], [homeY, freeY]);
      return { x, y, r: dot.r, color: silo.color, si, di, phase: dot.phase };
    })
  );

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

              {/* === SILO WALLS === */}
              {SILOS.map((silo, si) => {
                const wallOp = interpolate(wallShatter, [0, 0.5, 1], [0.7, 0.4, 0], clamp);
                if (wallOp <= 0) return null;
                // Left wall
                const leftFragments = wallShatter > 0.3 ? Array.from({ length: 6 }, (_, fi) => {
                  const fy = fi * 65 + 10;
                  const drift = (wallShatter - 0.3) * hash(si * 30 + fi * 7) * -60;
                  const rot = (wallShatter - 0.3) * (hash(si * 30 + fi * 11) - 0.5) * 40;
                  return { fy, drift, rot, h: 60 };
                }) : [{ fy: 0, drift: 0, rot: 0, h: 400 }];
                // Right wall
                const rightFragments = wallShatter > 0.3 ? Array.from({ length: 6 }, (_, fi) => {
                  const fy = fi * 65 + 10;
                  const drift = (wallShatter - 0.3) * hash(si * 30 + fi * 17) * 60;
                  const rot = (wallShatter - 0.3) * (hash(si * 30 + fi * 23) - 0.5) * 40;
                  return { fy, drift, rot, h: 60 };
                }) : [{ fy: 0, drift: 0, rot: 0, h: 400 }];

                return (
                  <g key={`silo-${si}`} opacity={wallOp}>
                    {/* Left wall fragments */}
                    {leftFragments.map((frag, fi) => (
                      <rect
                        key={`lw-${si}-${fi}`}
                        x={silo.x + frag.drift}
                        y={frag.fy}
                        width={4}
                        height={frag.h}
                        fill={silo.color}
                        opacity={0.6}
                        transform={`rotate(${frag.rot}, ${silo.x + frag.drift}, ${frag.fy + frag.h / 2})`}
                      />
                    ))}
                    {/* Right wall fragments */}
                    {rightFragments.map((frag, fi) => (
                      <rect
                        key={`rw-${si}-${fi}`}
                        x={silo.x + silo.w + frag.drift}
                        y={frag.fy}
                        width={4}
                        height={frag.h}
                        fill={silo.color}
                        opacity={0.6}
                        transform={`rotate(${frag.rot}, ${silo.x + silo.w + frag.drift}, ${frag.fy + frag.h / 2})`}
                      />
                    ))}

                    {/* Cracks */}
                    {crackProgress > 0 && CRACKS[si].map((crack, ci) => {
                      const crackP = interpolate(
                        crackProgress,
                        [ci * 0.12, ci * 0.12 + 0.3],
                        [0, 1],
                        clamp
                      );
                      if (crackP <= 0) return null;
                      const baseX = crack.side === "left" ? silo.x : silo.x + silo.w;
                      const dir = crack.side === "left" ? 1 : -1;
                      return (
                        <line
                          key={`crack-${si}-${ci}`}
                          x1={baseX}
                          y1={crack.y}
                          x2={baseX + dir * crack.width * crackP}
                          y2={crack.y + (hash(si * 50 + ci * 29) - 0.5) * 15}
                          stroke={palette.warmGold}
                          strokeWidth={1.5}
                          opacity={crackP * 0.7}
                        />
                      );
                    })}
                  </g>
                );
              })}

              {/* === DATA DOTS (trapped -> free -> unified) === */}
              {allDots.map((dot, i) => {
                const appear = interpolate(frame, [titleEnd + i * 2, titleEnd + i * 2 + 20], [0, 1], clamp);
                if (appear <= 0) return null;
                if (ytpActive && hash(frame * 7 + i * 13) > 0.95) return null;
                const wobble = frame >= p5End
                  ? resolveBreathe
                  : 1 + Math.sin(frame * 0.08 + dot.phase) * 0.15;
                const breatheOp = frame >= p5End
                  ? interpolate(Math.sin((frame - p5End) * 0.03 + dot.phase), [-1, 1], [0.4, 0.8])
                  : 0.7;
                return (
                  <circle
                    key={`dot-${i}`}
                    cx={dot.x}
                    cy={dot.y}
                    r={dot.r * wobble * appear}
                    fill={dot.color}
                    opacity={appear * breatheOp}
                  />
                );
              })}

              {/* === NETWORK CONNECTIONS (post-shatter) === */}
              {dotFreedom > 0.5 && allDots.map((dot, i) => {
                if (i % 2 !== 0) return null;
                return allDots.slice(i + 1).filter((other, j) => {
                  if (j % 3 !== 0) return null;
                  const dx = dot.x - other.x;
                  const dy = dot.y - other.y;
                  return Math.sqrt(dx * dx + dy * dy) < 120;
                }).map((other, j) => {
                  const connP = interpolate(dotFreedom, [0.5, 0.8], [0, 1], clamp);
                  const breatheOp = frame >= p5End
                    ? 0.06 + Math.sin(frame * 0.025 + i + j) * 0.03
                    : 0.08;
                  return (
                    <line
                      key={`net-${i}-${j}`}
                      x1={dot.x} y1={dot.y}
                      x2={other.x} y2={other.y}
                      stroke={palette.warmGold}
                      strokeWidth={0.5}
                      opacity={connP * breatheOp}
                    />
                  );
                });
              })}

              {/* === UNIFIED ORGANISM CENTER GLOW === */}
              {unifyP > 0.3 && (
                <ellipse
                  cx={400} cy={200}
                  rx={80 * (unifyP - 0.3) * resolveBreathe}
                  ry={60 * (unifyP - 0.3) * resolveBreathe}
                  fill={palette.warmGold}
                  opacity={(unifyP - 0.3) * 0.06}
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
