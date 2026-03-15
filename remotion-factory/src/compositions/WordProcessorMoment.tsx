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

// Grid definition — rigid rows and columns representing the old market
const GRID_COLS = 16;
const GRID_ROWS = 8;
const CELL_W = 800 / GRID_COLS; // 50
const CELL_H = 400 / GRID_ROWS; // 50

// Organic path nodes that replace the grid
const ORGANIC_NODES = Array.from({ length: 60 }, (_, i) => ({
  x: 50 + hash(i * 43) * 700,
  y: 30 + hash(i * 59) * 340,
  r: 2 + hash(i * 73) * 3,
  phase: hash(i * 89) * Math.PI * 2,
  connections: [
    Math.floor(hash(i * 101) * 60),
    Math.floor(hash(i * 113) * 60),
    Math.floor(hash(i * 127) * 60),
  ].filter(c => c !== i),
}));

// Glitch bars
const GLITCH_BARS = Array.from({ length: 14 }, (_, i) => ({
  y: hash(i * 31) * 400,
  h: 2 + hash(i * 47) * 10,
  color: i % 3 === 0 ? palette.brightBlue : i % 3 === 1 ? palette.warmGold : palette.coolBlue,
  trigger: Math.floor(hash(i * 13) * 400) + 120,
}));

export const WordProcessorMoment: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // === PHASE TIMING (30s = 900 frames at 30fps) ===
  const titleEnd = 4 * fps;       // 120 — title card
  const p2End = 9 * fps;          // 270 — rigid grid fully visible, locked
  const p3End = 14 * fps;         // 420 — dissolution begins at edges
  const p4End = 19 * fps;         // 570 — transformation accelerates
  const p5End = 24 * fps;         // 720 — old structure gone, organic network
  // Resolve: 720-900 — organic network breathing

  const ytpActive = frame > titleEnd && frame < p5End;

  // === SCREEN SHAKE ===
  const transitionFrames: [number, number][] = [
    [titleEnd - 3, titleEnd + 5],
    [titleEnd + 55, titleEnd + 62],
    [titleEnd + 110, titleEnd + 116],
    [p2End - 4, p2End + 8],
    [p2End + 45, p2End + 52],
    [p3End - 5, p3End + 10],
    [p3End + 55, p3End + 62],
    [p4End - 8, p4End + 12],
    [p4End + 40, p4End + 48],
    [p5End - 14, p5End],
  ];
  const isTransition = transitionFrames.some(([a, b]) => frame >= a && frame <= b);
  const shakeIntensity = !ytpActive ? 0 : isTransition ? 15 : 1.6;
  const { x: sx, y: sy } = shake(frame, shakeIntensity);

  // === FLASH FRAMES ===
  const flashTriggers = [
    titleEnd, titleEnd + 56, titleEnd + 111,
    p2End, p2End + 46, p3End, p3End + 56, p4End, p4End + 41,
  ];
  const isFlash = ytpActive && flashTriggers.some(f => Math.abs(frame - f) < 2);

  // === ZOOM PULSES ===
  const zoomPulses = [
    { f: titleEnd + 1, s: 1.5, d: 8 },
    { f: titleEnd + 56, s: 1.3, d: 6 },
    { f: titleEnd + 111, s: 1.35, d: 7 },
    { f: p2End, s: 1.5, d: 10 },
    { f: p2End + 46, s: 1.3, d: 8 },
    { f: p3End, s: 1.6, d: 10 },
    { f: p3End + 56, s: 1.4, d: 8 },
    { f: p4End, s: 1.6, d: 12 },
    { f: p4End + 41, s: 1.4, d: 8 },
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

  // === GRID DISSOLUTION ===
  // Grid appears solid, then dissolves from edges toward center
  const gridAppear = interpolate(frame, [titleEnd, titleEnd + 60], [0, 1], clamp);
  const dissolveStart = p2End + 30;
  const dissolveEnd = p5End - 30;

  // Distance from center determines when each grid cell dissolves
  const centerCol = GRID_COLS / 2;
  const centerRow = GRID_ROWS / 2;
  const maxDist = Math.sqrt(centerCol * centerCol + centerRow * centerRow);

  // === ORGANIC NETWORK ===
  // Appears as grid dissolves
  const organicAppear = interpolate(frame, [p3End, p5End], [0, 1], clamp);

  // === RESOLVE ===
  const resolveP = interpolate(frame, [p5End, p5End + 40], [0, 1], clamp);
  const resolveBreathe = frame >= p5End
    ? interpolate(Math.sin((frame - p5End) * 0.035), [-1, 1], [0.92, 1.08])
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
                <radialGradient id="wp-center-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={palette.brightBlue} stopOpacity={0.3} />
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

              {/* === RIGID GRID (the old market) === */}
              {gridAppear > 0 && (() => {
                const lines: React.ReactNode[] = [];
                // Vertical lines
                for (let c = 0; c <= GRID_COLS; c++) {
                  const x = c * CELL_W;
                  const distFromCenter = Math.abs(c - centerCol) / centerCol;
                  // Dissolve from edges: edges dissolve first (low distFromCenter = last)
                  const dissolveP = interpolate(
                    frame, [dissolveStart, dissolveEnd], [0, 1], clamp);
                  // Edge cells dissolve when dissolveP reaches their threshold
                  const cellDissolve = interpolate(
                    dissolveP, [distFromCenter * 0.3, distFromCenter * 0.3 + 0.4], [0, 1], clamp);
                  const opacity = gridAppear * (1 - cellDissolve);
                  if (opacity <= 0.01) return null;

                  // Glitch offset during YTP
                  const glitchOff = ytpActive && hash(frame * 11 + c * 7) > 0.88
                    ? (hash(frame * 3 + c) - 0.5) * 20 : 0;

                  lines.push(
                    <line key={`gv-${c}`}
                      x1={x + glitchOff} y1={0}
                      x2={x + glitchOff} y2={400}
                      stroke={palette.coolBlue}
                      strokeWidth={1}
                      opacity={opacity * 0.3}
                    />
                  );
                }
                // Horizontal lines
                for (let r = 0; r <= GRID_ROWS; r++) {
                  const y = r * CELL_H;
                  const distFromCenter = Math.abs(r - centerRow) / centerRow;
                  const dissolveP = interpolate(
                    frame, [dissolveStart, dissolveEnd], [0, 1], clamp);
                  const cellDissolve = interpolate(
                    dissolveP, [distFromCenter * 0.3, distFromCenter * 0.3 + 0.4], [0, 1], clamp);
                  const opacity = gridAppear * (1 - cellDissolve);
                  if (opacity <= 0.01) return null;

                  const glitchOff = ytpActive && hash(frame * 13 + r * 11) > 0.88
                    ? (hash(frame * 5 + r) - 0.5) * 20 : 0;

                  lines.push(
                    <line key={`gh-${r}`}
                      x1={0} y1={y + glitchOff}
                      x2={800} y2={y + glitchOff}
                      stroke={palette.coolBlue}
                      strokeWidth={1}
                      opacity={opacity * 0.3}
                    />
                  );
                }

                // Grid intersection dots
                for (let c = 0; c <= GRID_COLS; c++) {
                  for (let r = 0; r <= GRID_ROWS; r++) {
                    const dist = Math.sqrt(
                      ((c - centerCol) / centerCol) ** 2 +
                      ((r - centerRow) / centerRow) ** 2
                    );
                    const dissolveP = interpolate(
                      frame, [dissolveStart, dissolveEnd], [0, 1], clamp);
                    // Reverse: edges dissolve first
                    const normDist = Math.min(dist / 1.2, 1);
                    const cellDissolve = interpolate(
                      dissolveP, [normDist * 0.2, normDist * 0.2 + 0.35], [0, 1], clamp);
                    const opacity = gridAppear * (1 - cellDissolve);
                    if (opacity <= 0.01) continue;

                    lines.push(
                      <circle key={`gd-${c}-${r}`}
                        cx={c * CELL_W} cy={r * CELL_H}
                        r={2} fill={palette.warmGold}
                        opacity={opacity * 0.4}
                      />
                    );
                  }
                }

                return <g>{lines}</g>;
              })()}

              {/* === DISSOLVE PARTICLES (grid breaking apart) === */}
              {frame >= dissolveStart && frame < p5End && (() => {
                const dissolveP = interpolate(
                  frame, [dissolveStart, dissolveEnd], [0, 1], clamp);
                if (dissolveP <= 0) return null;
                // Particles fly off from dissolving grid edges
                const particles: React.ReactNode[] = [];
                for (let i = 0; i < 30; i++) {
                  const birthP = hash(i * 37) * 0.7; // when this particle appears
                  if (dissolveP < birthP) continue;
                  const age = (dissolveP - birthP) / (1 - birthP);
                  const startX = hash(i * 43) * 800;
                  const startY = hash(i * 59) * 400;
                  // Fly outward from dissolving position
                  const angle = hash(i * 67) * Math.PI * 2;
                  const speed = 30 + hash(i * 79) * 60;
                  const px = startX + Math.cos(angle) * speed * age;
                  const py = startY + Math.sin(angle) * speed * age;
                  const op = interpolate(age, [0, 0.2, 0.8, 1], [0, 0.6, 0.3, 0], clamp);
                  particles.push(
                    <rect key={`dp-${i}`}
                      x={px - 1} y={py - 1} width={2} height={2}
                      fill={palette.coolBlue} opacity={op * 0.5}
                      transform={`rotate(${age * 180}, ${px}, ${py})`}
                    />
                  );
                }
                return <g>{particles}</g>;
              })()}

              {/* === ORGANIC NETWORK (fluid pathways) === */}
              {organicAppear > 0 && (() => {
                return (
                  <g opacity={organicAppear}>
                    {/* Organic connections — bezier curves */}
                    {ORGANIC_NODES.map((node, i) => {
                      return node.connections.map((ci, j) => {
                        const target = ORGANIC_NODES[ci];
                        if (!target) return null;
                        // Bezier control point — organic curve
                        const mx = (node.x + target.x) / 2 + (hash(i * 137 + j * 41) - 0.5) * 80;
                        const my = (node.y + target.y) / 2 + (hash(i * 149 + j * 53) - 0.5) * 60;

                        // Breathing in resolve
                        const bOff = frame >= p5End
                          ? Math.sin((frame - p5End) * 0.025 + node.phase) * 3 : 0;

                        const pathD = `M ${node.x + bOff} ${node.y + bOff * 0.5} Q ${mx} ${my} ${target.x - bOff * 0.5} ${target.y - bOff * 0.3}`;

                        const lineOp = frame >= p5End
                          ? interpolate(Math.sin((frame - p5End) * 0.03 + i * 0.5), [-1, 1], [0.05, 0.15])
                          : 0.08;

                        return (
                          <path key={`oc-${i}-${j}`}
                            d={pathD}
                            fill="none"
                            stroke={i % 3 === 0 ? palette.brightBlue : palette.warmGold}
                            strokeWidth={0.6}
                            opacity={lineOp * organicAppear * resolveBreathe}
                          />
                        );
                      });
                    })}

                    {/* Organic nodes */}
                    {ORGANIC_NODES.map((node, i) => {
                      const bOff = frame >= p5End
                        ? Math.sin((frame - p5End) * 0.025 + node.phase) * 3 : 0;
                      const nodeOp = frame >= p5End
                        ? interpolate(Math.sin((frame - p5End) * 0.04 + node.phase), [-1, 1], [0.2, 0.5])
                        : 0.3;
                      return (
                        <circle key={`on-${i}`}
                          cx={node.x + bOff}
                          cy={node.y + bOff * 0.5}
                          r={node.r * resolveBreathe}
                          fill={i % 4 === 0 ? palette.brightBlue : i % 4 === 1 ? palette.warmGold : palette.coolBlue}
                          opacity={nodeOp * organicAppear}
                        />
                      );
                    })}
                  </g>
                );
              })()}

              {/* === CENTER GLOW (new world) === */}
              {frame >= p4End && (
                <ellipse cx={400} cy={200}
                  rx={150 * interpolate(frame, [p4End, p5End], [0, 1], clamp) * resolveBreathe}
                  ry={120 * interpolate(frame, [p4End, p5End], [0, 1], clamp) * resolveBreathe}
                  fill="url(#wp-center-glow)"
                  opacity={interpolate(frame, [p4End, p5End], [0, 0.5], clamp)} />
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
