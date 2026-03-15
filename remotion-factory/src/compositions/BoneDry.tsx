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

// Small dots that orbit or get consumed by the central mass
const SMALL_DOTS = Array.from({ length: 40 }, (_, i) => ({
  angle: (i / 40) * Math.PI * 2 + hash(i * 53) * 0.5,
  dist: 100 + hash(i * 37) * 180,
  r: 2 + hash(i * 19) * 3,
  speed: 0.008 + hash(i * 71) * 0.012,
  phase: hash(i * 91) * Math.PI * 2,
}));

// Distributed nodes post-shatter
const DIST_NODES = Array.from({ length: 24 }, (_, i) => ({
  x: 60 + (i % 6) * 120 + (hash(i * 43) - 0.5) * 60,
  y: 60 + Math.floor(i / 6) * 80 + (hash(i * 67) - 0.5) * 40,
  r: 3 + hash(i * 29) * 3,
  phase: hash(i * 83) * Math.PI * 2,
  orbitals: Math.floor(1 + hash(i * 17) * 3),
}));

// Glitch bars
const GLITCH_BARS = Array.from({ length: 12 }, (_, i) => ({
  y: hash(i * 31) * 400,
  h: 2 + hash(i * 47) * 10,
  color: i % 2 === 0 ? palette.brightBlue : palette.warmGold,
  trigger: Math.floor(hash(i * 13) * 400) + 120,
}));

export const BoneDry: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // === PHASE TIMING (30s = 900 frames at 30fps) ===
  const titleEnd = 4 * fps;       // 120
  const p2End = 9 * fps;          // 270 — Central mass consuming dots
  const p3End = 14 * fps;         // 420 — Dots dimming, mass pulsing greedily
  const p4End = 19 * fps;         // 570 — Shatter! Mass fractures
  const p5End = 24 * fps;         // 720 — Distributed nodes emerge
  // Resolve: 720-900

  const ytpActive = frame > titleEnd && frame < p5End;

  // === SCREEN SHAKE ===
  const transitionFrames: [number, number][] = [
    [titleEnd - 3, titleEnd + 5],
    [titleEnd + 50, titleEnd + 56],
    [titleEnd + 100, titleEnd + 106],
    [p2End - 4, p2End + 8],
    [p2End + 60, p2End + 68],
    [p3End - 4, p3End + 8],
    [p3End + 40, p3End + 48],
    [p4End - 10, p4End + 15],  // big shatter shake
    [p4End + 50, p4End + 56],
    [p5End - 12, p5End],
  ];
  const isTransition = transitionFrames.some(([a, b]) => frame >= a && frame <= b);
  const shakeIntensity = !ytpActive ? 0 : isTransition ? 16 : 1.5;
  const { x: sx, y: sy } = shake(frame, shakeIntensity);

  // === FLASH FRAMES ===
  const flashTriggers = [
    titleEnd, titleEnd + 51, titleEnd + 101,
    p2End, p2End + 61, p3End, p3End + 41, p4End, p4End + 51,
  ];
  const isFlash = ytpActive && flashTriggers.some(f => Math.abs(frame - f) < 2);

  // === ZOOM PULSES ===
  const zoomPulses = [
    { f: titleEnd + 1, s: 1.5, d: 8 },
    { f: titleEnd + 51, s: 1.3, d: 6 },
    { f: titleEnd + 101, s: 1.4, d: 7 },
    { f: p2End, s: 1.6, d: 10 },
    { f: p3End, s: 1.5, d: 10 },
    { f: p4End, s: 2.0, d: 15 },  // massive shatter zoom
    { f: p4End + 51, s: 1.3, d: 8 },
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

  // === CENTRAL MASS ===
  const centralR = interpolate(frame, [titleEnd, p2End, p3End, p4End - 5, p4End], [40, 80, 100, 110, 0], clamp);
  const centralPulse = ytpActive ? 1 + Math.sin(frame * 0.1) * 0.08 : 1;

  // === CONSUMPTION: dots drawn inward ===
  const consumeP = interpolate(frame, [titleEnd, p3End], [0, 1], clamp);

  // === SHATTER ===
  const shatterP = interpolate(frame, [p4End - 10, p4End + 20], [0, 1], clamp);

  // Shatter fragments
  const FRAGMENTS = Array.from({ length: 16 }, (_, i) => ({
    angle: (i / 16) * Math.PI * 2,
    speed: 3 + hash(i * 41) * 8,
    rot: (hash(i * 73) - 0.5) * 10,
    size: 8 + hash(i * 59) * 20,
  }));

  // === DISTRIBUTED NETWORK ===
  const distAppear = interpolate(frame, [p4End + 30, p4End + 90], [0, 1], clamp);

  // === RESOLVE ===
  const resolveP = interpolate(frame, [p5End, p5End + 40], [0, 1], clamp);
  const resolveBreathe = frame >= p5End
    ? interpolate(Math.sin((frame - p5End) * 0.03), [-1, 1], [0.93, 1.07])
    : 1;

  return (
    <AbsoluteFill style={{ backgroundColor: palette.bgDark }}>
      <Audio src={staticFile("audio/bone-dry.mp3")} volume={1} />

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
                <radialGradient id="bd-central-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#e63946" stopOpacity={0.5} />
                  <stop offset="60%" stopColor="#e63946" stopOpacity={0.1} />
                  <stop offset="100%" stopColor={palette.bgDark} stopOpacity={0} />
                </radialGradient>
                <radialGradient id="bd-node-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={palette.brightBlue} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={palette.brightBlue} stopOpacity={0} />
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

              {/* === CENTRAL MASS (pre-shatter) === */}
              {centralR > 0 && shatterP < 1 && (
                <g opacity={1 - shatterP}>
                  <ellipse
                    cx={400} cy={200}
                    rx={centralR * centralPulse * 1.8}
                    ry={centralR * centralPulse * 1.8}
                    fill="url(#bd-central-glow)"
                    opacity={0.6}
                  />
                  <circle
                    cx={400} cy={200}
                    r={centralR * centralPulse}
                    fill="#e63946"
                    opacity={0.25}
                  />
                  <circle
                    cx={400} cy={200}
                    r={centralR * centralPulse}
                    fill="none"
                    stroke="#e63946"
                    strokeWidth={3}
                    opacity={0.7}
                  />
                  {/* Greedy tendrils reaching outward */}
                  {frame > titleEnd + 30 && frame < p4End && Array.from({ length: 8 }, (_, i) => {
                    const a = (i / 8) * Math.PI * 2 + frame * 0.02;
                    const len = centralR * 0.6 + Math.sin(frame * 0.15 + i) * 15;
                    return (
                      <line
                        key={`tend-${i}`}
                        x1={400} y1={200}
                        x2={400 + Math.cos(a) * (centralR + len)}
                        y2={200 + Math.sin(a) * (centralR + len)}
                        stroke="#e63946"
                        strokeWidth={1.5}
                        opacity={0.2 + Math.sin(frame * 0.2 + i) * 0.1}
                      />
                    );
                  })}
                </g>
              )}

              {/* === SMALL DOTS BEING CONSUMED === */}
              {frame > titleEnd && shatterP < 0.5 && SMALL_DOTS.map((dot, i) => {
                const appear = interpolate(frame, [titleEnd + i * 2, titleEnd + i * 2 + 15], [0, 1], clamp);
                const pullIn = consumeP * 0.85;
                const currentDist = dot.dist * (1 - pullIn);
                const a = dot.angle + frame * dot.speed;
                const dx = 400 + Math.cos(a) * currentDist;
                const dy = 200 + Math.sin(a) * currentDist;
                const dimming = interpolate(consumeP, [0, 0.5, 1], [1, 0.6, 0.15], clamp);
                if (ytpActive && hash(frame * 7 + i * 11) > 0.95) return null;
                return (
                  <circle
                    key={`sd-${i}`}
                    cx={dx} cy={dy}
                    r={dot.r * appear}
                    fill={palette.warmGold}
                    opacity={appear * dimming}
                  />
                );
              })}

              {/* === SHATTER FRAGMENTS === */}
              {shatterP > 0 && shatterP < 1 && FRAGMENTS.map((frag, i) => {
                const dist = frag.speed * shatterP * 40;
                const fx = 400 + Math.cos(frag.angle) * dist;
                const fy = 200 + Math.sin(frag.angle) * dist;
                return (
                  <rect
                    key={`frag-${i}`}
                    x={fx - frag.size / 2}
                    y={fy - frag.size / 2}
                    width={frag.size}
                    height={frag.size * 0.6}
                    fill="#e63946"
                    opacity={(1 - shatterP) * 0.6}
                    transform={`rotate(${frag.rot * shatterP * 30}, ${fx}, ${fy})`}
                  />
                );
              })}

              {/* === DISTRIBUTED NODES === */}
              {distAppear > 0 && DIST_NODES.map((node, i) => {
                const nSpring = spring({
                  frame: frame - (p4End + 30 + i * 3),
                  fps,
                  config: { damping: 8, stiffness: 200, mass: 0.5 },
                });
                const s = Math.max(0, nSpring);
                if (s <= 0) return null;
                const breathe = frame >= p5End ? resolveBreathe : 1;
                const pulse = 1 + Math.sin(frame * 0.05 + node.phase) * 0.1;
                return (
                  <g key={`dn-${i}`} opacity={s * (frame >= p5End ? interpolate(resolveP, [0, 1], [0.8, 1]) : 1)}>
                    {/* node glow */}
                    <ellipse
                      cx={node.x} cy={node.y}
                      rx={20 * s * breathe} ry={20 * s * breathe}
                      fill="url(#bd-node-glow)"
                      opacity={0.4 * s}
                    />
                    {/* node core */}
                    <circle
                      cx={node.x} cy={node.y}
                      r={node.r * s * breathe * pulse}
                      fill={palette.brightBlue}
                      opacity={0.85}
                    />
                    {/* orbital particles */}
                    {Array.from({ length: node.orbitals }, (_, j) => {
                      const oa = frame * 0.04 + node.phase + j * (Math.PI * 2 / node.orbitals);
                      const od = 10 + j * 4;
                      return (
                        <circle
                          key={`orb-${i}-${j}`}
                          cx={node.x + Math.cos(oa) * od * s * breathe}
                          cy={node.y + Math.sin(oa) * od * s * breathe}
                          r={1.2}
                          fill={palette.coolBlue}
                          opacity={0.6 * s}
                        />
                      );
                    })}
                  </g>
                );
              })}

              {/* === CONNECTIONS BETWEEN DISTRIBUTED NODES === */}
              {distAppear > 0.5 && DIST_NODES.map((node, i) => {
                return DIST_NODES.slice(i + 1).filter((other, j) => {
                  const dx = node.x - other.x;
                  const dy = node.y - other.y;
                  return Math.sqrt(dx * dx + dy * dy) < 160;
                }).map((other, j) => {
                  const connP = interpolate(frame, [p4End + 60 + i * 2, p4End + 90 + i * 2], [0, 1], clamp);
                  if (connP <= 0) return null;
                  const breatheOp = frame >= p5End ? 0.08 + Math.sin(frame * 0.03 + i + j) * 0.04 : 0.1;
                  return (
                    <line
                      key={`conn-${i}-${j}`}
                      x1={node.x} y1={node.y}
                      x2={other.x} y2={other.y}
                      stroke={palette.coolBlue}
                      strokeWidth={0.6}
                      opacity={connP * breatheOp}
                    />
                  );
                });
              })}

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
