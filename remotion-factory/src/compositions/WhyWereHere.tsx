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

// Claude pixel mascot
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

// People dots — 40 dots scattered at the bottom
const PEOPLE = Array.from({ length: 40 }, (_, i) => ({
  baseX: 60 + (i * 173 + i * i * 13) % 680,
  baseY: 340 + hash(i * 37) * 50, // ground level: 340-390
  r: 2 + hash(i * 41) * 2.5,
  phase: hash(i * 67) * Math.PI * 2,
  speed: 0.6 + hash(i * 53) * 0.8, // climbing speed variation
  reachOrder: i, // who reaches first
}));

// Mountain triangle peak
const PEAK = { x: 400, y: 60 };
const BASE_LEFT = { x: 100, y: 380 };
const BASE_RIGHT = { x: 700, y: 380 };

// Glitch bars
const GLITCH_BARS = Array.from({ length: 14 }, (_, i) => ({
  y: hash(i * 31) * 400,
  h: 2 + hash(i * 47) * 10,
  color: i % 2 === 0 ? palette.warmGold : palette.coolBlue,
  trigger: Math.floor(hash(i * 13) * 400) + 120,
}));

export const WhyWereHere: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // === PHASE TIMING (30s = 900 frames at 30fps) ===
  const titleEnd = 4 * fps;       // 120 — title card
  const p2End = 9 * fps;          // 270 — dots gather, begin stirring
  const p3End = 14 * fps;         // 420 — climbing begins, mountain forms
  const p4End = 19 * fps;         // 570 — group ascent, helping each other
  const p5End = 24 * fps;         // 720 — reaching the summit
  // Resolve: 720-900 — group at summit, breathing, connected

  const ytpActive = frame > titleEnd && frame < p5End;

  // === SCREEN SHAKE ===
  const transitionFrames: [number, number][] = [
    [titleEnd - 3, titleEnd + 5],
    [titleEnd + 45, titleEnd + 52],
    [titleEnd + 90, titleEnd + 96],
    [p2End - 4, p2End + 6],
    [p2End + 50, p2End + 58],
    [p3End - 5, p3End + 8],
    [p3End + 40, p3End + 48],
    [p4End - 6, p4End + 10],
    [p4End + 60, p4End + 66],
    [p5End - 12, p5End],
  ];
  const isTransition = transitionFrames.some(([a, b]) => frame >= a && frame <= b);
  const shakeIntensity = !ytpActive ? 0 : isTransition ? 14 : 1.5;
  const { x: sx, y: sy } = shake(frame, shakeIntensity);

  // === FLASH FRAMES ===
  const flashTriggers = [
    titleEnd, titleEnd + 46, titleEnd + 91,
    p2End, p2End + 51, p3End, p3End + 41, p4End, p4End + 61,
  ];
  const isFlash = ytpActive && flashTriggers.some(f => Math.abs(frame - f) < 2);

  // === ZOOM PULSES ===
  const zoomPulses = [
    { f: titleEnd + 1, s: 1.5, d: 8 },
    { f: titleEnd + 46, s: 1.3, d: 6 },
    { f: titleEnd + 91, s: 1.35, d: 7 },
    { f: p2End, s: 1.5, d: 10 },
    { f: p2End + 51, s: 1.3, d: 8 },
    { f: p3End, s: 1.6, d: 10 },
    { f: p3End + 41, s: 1.4, d: 8 },
    { f: p4End, s: 1.5, d: 10 },
    { f: p4End + 61, s: 1.35, d: 8 },
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

  // === MOUNTAIN OUTLINE — fades in as group climbs ===
  const mtnOpacity = interpolate(frame, [p2End + 30, p3End], [0, 0.15], clamp);

  // === PEOPLE CLIMBING ===
  // Each dot follows a path from their base position toward the peak
  // Staggered start — leaders go first, pull others up
  const climbStart = titleEnd + 30;
  const summitFrame = p5End - 30;

  // === RESOLVE ===
  const resolveP = interpolate(frame, [p5End, p5End + 40], [0, 1], clamp);
  const resolveBreathe = frame >= p5End
    ? interpolate(Math.sin((frame - p5End) * 0.04), [-1, 1], [0.92, 1.08])
    : 1;

  return (
    <AbsoluteFill style={{ backgroundColor: palette.bgDark }}>
      <Audio src={staticFile("audio/why-were-here.mp3")} volume={1} />

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
                <radialGradient id="wh-summit-glow" cx="50%" cy="30%" r="50%">
                  <stop offset="0%" stopColor={palette.warmGold} stopOpacity={0.35} />
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
                    opacity={0.04}
                  />
                );
              })}

              {/* === MOUNTAIN OUTLINE === */}
              {mtnOpacity > 0 && (
                <g opacity={mtnOpacity * resolveBreathe}>
                  <polygon
                    points={`${BASE_LEFT.x},${BASE_LEFT.y} ${PEAK.x},${PEAK.y} ${BASE_RIGHT.x},${BASE_RIGHT.y}`}
                    fill="none"
                    stroke={palette.coolBlue}
                    strokeWidth={1.5}
                    strokeDasharray={frame >= p5End ? "none" : "8,6"}
                  />
                  {/* Secondary ridges */}
                  <line x1={250} y1={280} x2={PEAK.x} y2={PEAK.y}
                    stroke={palette.coolBlue} strokeWidth={0.5}
                    opacity={mtnOpacity * 0.5} />
                  <line x1={550} y1={300} x2={PEAK.x} y2={PEAK.y}
                    stroke={palette.coolBlue} strokeWidth={0.5}
                    opacity={mtnOpacity * 0.5} />
                </g>
              )}

              {/* === GROUND LINE === */}
              <line x1={0} y1={380} x2={800} y2={380}
                stroke={palette.warmGold} strokeWidth={0.8}
                opacity={interpolate(frame, [titleEnd, titleEnd + 30], [0, 0.2], clamp)} />

              {/* === PEOPLE DOTS === */}
              {PEOPLE.map((p, i) => {
                // Phase 1 (titleEnd to p2End): dots appear at ground level, stir
                const appear = interpolate(
                  frame, [titleEnd + i * 2, titleEnd + 20 + i * 2], [0, 1], clamp);
                if (appear <= 0) return null;

                // Stirring at ground
                const stirX = Math.sin(frame * 0.05 + p.phase) * 8;
                const stirY = Math.cos(frame * 0.07 + p.phase) * 3;

                // Phase 2 (p2End to p5End): climb toward peak
                // Leaders (low index) start earlier
                const myClimbStart = climbStart + i * 8;
                const myClimbEnd = summitFrame - (40 - i) * 2;
                const climbP = interpolate(frame, [myClimbStart, myClimbEnd], [0, 1],
                  { ...clamp, easing: Easing.inOut(Easing.quad) });

                // Path: from base position toward summit area
                // Not a straight line — curve through the mountain shape
                const targetX = PEAK.x + (hash(i * 71) - 0.5) * 60;
                const targetY = PEAK.y + 10 + hash(i * 83) * 40;

                // Mid-point: slightly scattered along the mountain face
                const midX = p.baseX + (targetX - p.baseX) * 0.5 + (hash(i * 97) - 0.5) * 80;
                const midY = p.baseY + (targetY - p.baseY) * 0.4;

                let dotX: number, dotY: number;
                if (climbP <= 0.5) {
                  const t = climbP * 2;
                  dotX = interpolate(t, [0, 1], [p.baseX + stirX, midX]);
                  dotY = interpolate(t, [0, 1], [p.baseY + stirY, midY]);
                } else {
                  const t = (climbP - 0.5) * 2;
                  dotX = interpolate(t, [0, 1], [midX, targetX]);
                  dotY = interpolate(t, [0, 1], [midY, targetY]);
                }

                // Resolve breathing
                if (frame >= p5End) {
                  dotX += Math.sin((frame - p5End) * 0.03 + p.phase) * 2 * resolveBreathe;
                  dotY += Math.cos((frame - p5End) * 0.025 + p.phase) * 1.5 * resolveBreathe;
                }

                // YTP stutter: random dropout
                if (ytpActive && hash(frame * 7 + i * 11) > 0.95) return null;

                const breath = interpolate(
                  Math.sin(frame * 0.03 + p.phase), [-1, 1], [0.3, 0.6]);

                return (
                  <circle key={`ppl-${i}`}
                    cx={dotX} cy={dotY}
                    r={p.r * (frame >= p5End ? resolveBreathe : 1)}
                    fill={i < 8 ? palette.brightBlue : palette.warmGold}
                    opacity={appear * breath * (frame >= p5End ? 0.7 : 1)} />
                );
              })}

              {/* === HELPING FILAMENTS: leaders pulling others up === */}
              {frame >= p3End && (() => {
                const filP = interpolate(frame, [p3End, p4End], [0, 1], clamp);
                if (filP <= 0) return null;
                // Connect nearby dots — leaders (low index) to followers (higher index)
                const connections: [number, number][] = [];
                for (let i = 0; i < 8; i++) {
                  for (let j = i + 5; j < Math.min(i + 12, 40); j += 3) {
                    connections.push([i, j]);
                  }
                }
                return (
                  <g>
                    {connections.map(([a, b], ci) => {
                      const pa = PEOPLE[a];
                      const pb = PEOPLE[b];
                      const aClimbP = interpolate(frame, [climbStart + a * 8, summitFrame - (40 - a) * 2], [0, 1], clamp);
                      const bClimbP = interpolate(frame, [climbStart + b * 8, summitFrame - (40 - b) * 2], [0, 1], clamp);

                      const aTargetX = PEAK.x + (hash(a * 71) - 0.5) * 60;
                      const aTargetY = PEAK.y + 10 + hash(a * 83) * 40;
                      const bTargetX = PEAK.x + (hash(b * 71) - 0.5) * 60;
                      const bTargetY = PEAK.y + 10 + hash(b * 83) * 40;

                      const ax = interpolate(aClimbP, [0, 1], [pa.baseX, aTargetX]);
                      const ay = interpolate(aClimbP, [0, 1], [pa.baseY, aTargetY]);
                      const bx = interpolate(bClimbP, [0, 1], [pb.baseX, bTargetX]);
                      const by = interpolate(bClimbP, [0, 1], [pb.baseY, bTargetY]);

                      const dist = Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
                      if (dist > 120) return null;

                      return (
                        <line key={`fil-${ci}`}
                          x1={ax} y1={ay} x2={bx} y2={by}
                          stroke={palette.warmGold} strokeWidth={0.4}
                          opacity={filP * 0.12 * (1 - dist / 120)} />
                      );
                    })}
                  </g>
                );
              })()}

              {/* === SUMMIT GLOW === */}
              {frame >= p4End && (
                <ellipse cx={PEAK.x} cy={PEAK.y + 20}
                  rx={80 * interpolate(frame, [p4End, p5End], [0, 1], clamp) * resolveBreathe}
                  ry={50 * interpolate(frame, [p4End, p5End], [0, 1], clamp) * resolveBreathe}
                  fill="url(#wh-summit-glow)"
                  opacity={interpolate(frame, [p4End, p5End], [0, 0.6], clamp)} />
              )}

              {/* === RESOLVE: connected filament network at summit === */}
              {frame >= p5End && (() => {
                return (
                  <g opacity={resolveP}>
                    {/* Gentle web connecting all summit dots */}
                    {PEOPLE.slice(0, 20).map((p, i) => {
                      const tx = PEAK.x + (hash(i * 71) - 0.5) * 60;
                      const ty = PEAK.y + 10 + hash(i * 83) * 40;
                      const bx = tx + Math.sin((frame - p5End) * 0.03 + p.phase) * 2;
                      const by = ty + Math.cos((frame - p5End) * 0.025 + p.phase) * 1.5;
                      // Connect to 2 neighbors
                      const n1 = (i + 1) % 20;
                      const n2 = (i + 7) % 20;
                      const n1x = PEAK.x + (hash(n1 * 71) - 0.5) * 60 + Math.sin((frame - p5End) * 0.03 + PEOPLE[n1].phase) * 2;
                      const n1y = PEAK.y + 10 + hash(n1 * 83) * 40 + Math.cos((frame - p5End) * 0.025 + PEOPLE[n1].phase) * 1.5;
                      const n2x = PEAK.x + (hash(n2 * 71) - 0.5) * 60 + Math.sin((frame - p5End) * 0.03 + PEOPLE[n2].phase) * 2;
                      const n2y = PEAK.y + 10 + hash(n2 * 83) * 40 + Math.cos((frame - p5End) * 0.025 + PEOPLE[n2].phase) * 1.5;
                      return (
                        <g key={`rfl-${i}`}>
                          <line x1={bx} y1={by} x2={n1x} y2={n1y}
                            stroke={palette.coolBlue} strokeWidth={0.3}
                            opacity={0.15 * resolveBreathe} />
                          <line x1={bx} y1={by} x2={n2x} y2={n2y}
                            stroke={palette.warmGold} strokeWidth={0.3}
                            opacity={0.1 * resolveBreathe} />
                        </g>
                      );
                    })}
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
