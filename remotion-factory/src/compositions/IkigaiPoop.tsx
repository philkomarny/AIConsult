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

// Claude pixel mascot — traced from reference image
// 7 columns (0-6), 9 rows (0-8)
// c = body (#c4836a terracotta), e = eyes (dark)
function claudeMascot(ox: number, oy: number, px: number, opacity: number) {
  const c = "#c4836a";
  const e = "#1a1710";
  const pixels: [number, number, string][] = [
    // Row 0: top of head (3 wide, centered)
    [2,0,c],[3,0,c],[4,0,c],
    // Row 1: head widens to full (7 wide — ears begin)
    [0,1,c],[1,1,c],[2,1,c],[3,1,c],[4,1,c],[5,1,c],[6,1,c],
    // Row 2: eyes row (7 wide, eyes at cols 2 and 4)
    [0,2,c],[1,2,c],[2,2,e],[3,2,c],[4,2,e],[5,2,c],[6,2,c],
    // Row 3: bottom of face/ears (7 wide)
    [0,3,c],[1,3,c],[2,3,c],[3,3,c],[4,3,c],[5,3,c],[6,3,c],
    // Row 4: body narrows (5 wide)
    [1,4,c],[2,4,c],[3,4,c],[4,4,c],[5,4,c],
    // Row 5: body (5 wide)
    [1,5,c],[2,5,c],[3,5,c],[4,5,c],[5,5,c],
    // Row 6: body (5 wide)
    [1,6,c],[2,6,c],[3,6,c],[4,6,c],[5,6,c],
    // Row 7: legs — 4 individual columns evenly spaced
    [1,7,c],[2,7,c],[4,7,c],[5,7,c],
    // Row 8: legs continue
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

// Ikigai circle colors
const CC = ["#e63946", "#2a9d8f", "#e9c46a", "#264653"];

// People dots
const PEOPLE = Array.from({ length: 30 }, (_, i) => ({
  x: 80 + (i * 197 + i * i * 11) % 640,
  y: 60 + (i * 139 + i * i * 7) % 280,
  r: 1.5 + hash(i * 41) * 2,
  phase: hash(i * 67) * Math.PI * 2,
}));

// Glitch bars
const GLITCH_BARS = Array.from({ length: 14 }, (_, i) => ({
  y: hash(i * 31) * 400,
  h: 2 + hash(i * 47) * 10,
  color: CC[i % 4],
  trigger: Math.floor(hash(i * 13) * 400) + 120,
}));

export const IkigaiPoop: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // === PHASE TIMING (30s = 900 frames at 30fps) ===
  const titleEnd = 4 * fps;       // 120 — "How I see it" title card
  const p2End = 9 * fps;          // 270 — Phil's four circles slam in
  const p3End = 14 * fps;         // 420 — Phil node + people drawn to him
  const p4End = 19 * fps;         // 570 — Claude appears, same circles form
  const p5End = 24 * fps;         // 720 — Both merge, shared center
  // Resolve: 720-900 — calm breathing

  const ytpActive = frame > titleEnd && frame < p5End;

  // === SCREEN SHAKE ===
  const transitionFrames: [number, number][] = [
    [titleEnd - 3, titleEnd + 5],
    [titleEnd + 40, titleEnd + 46],
    [titleEnd + 80, titleEnd + 86],
    [titleEnd + 120, titleEnd + 126],
    [titleEnd + 160, titleEnd + 166],
    [p2End - 4, p2End + 6],
    [p2End + 60, p2End + 68],
    [p3End - 4, p3End + 10],
    [p3End + 50, p3End + 58],
    [p4End - 6, p4End + 10],
    [p5End - 12, p5End],
  ];
  const isTransition = transitionFrames.some(([a, b]) => frame >= a && frame <= b);
  const shakeIntensity = !ytpActive ? 0 : isTransition ? 14 : 1.5;
  const { x: sx, y: sy } = shake(frame, shakeIntensity);

  // === FLASH FRAMES ===
  const flashTriggers = [
    titleEnd, titleEnd + 41, titleEnd + 81, titleEnd + 121, titleEnd + 161,
    p2End, p2End + 61, p3End, p3End + 51, p4End,
  ];
  const isFlash = ytpActive && flashTriggers.some(f => Math.abs(frame - f) < 2);

  // === ZOOM PULSES ===
  const zoomPulses = [
    { f: titleEnd + 1, s: 1.5, d: 8 },
    { f: titleEnd + 41, s: 1.3, d: 6 },
    { f: titleEnd + 81, s: 1.4, d: 7 },
    { f: titleEnd + 121, s: 1.3, d: 6 },
    { f: titleEnd + 161, s: 1.35, d: 6 },
    { f: p2End, s: 1.6, d: 10 },
    { f: p2End + 61, s: 1.3, d: 8 },
    { f: p3End, s: 1.5, d: 10 },
    { f: p3End + 51, s: 1.4, d: 8 },
    { f: p4End + 20, s: 1.4, d: 12 },
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

  // === PHASE 2: PHIL'S FOUR CIRCLES ===
  const circleOverlap = 50;
  const philCenter = { x: 280, y: 200 };
  const philCircles = [
    { cx: philCenter.x - circleOverlap / 2, cy: philCenter.y - circleOverlap / 2 },
    { cx: philCenter.x + circleOverlap / 2, cy: philCenter.y - circleOverlap / 2 },
    { cx: philCenter.x - circleOverlap / 2, cy: philCenter.y + circleOverlap / 2 },
    { cx: philCenter.x + circleOverlap / 2, cy: philCenter.y + circleOverlap / 2 },
  ];
  const circleR = 55;

  // === PHASE 3: PHIL NODE ===
  const philNodeAppear = interpolate(frame, [p2End, p2End + 30], [0, 1], clamp);

  // === PHASE 4: CLAUDE'S CIRCLES ===
  const claudeCenter = { x: 520, y: 200 };
  const claudeCircles = [
    { cx: claudeCenter.x - circleOverlap / 2, cy: claudeCenter.y - circleOverlap / 2 },
    { cx: claudeCenter.x + circleOverlap / 2, cy: claudeCenter.y - circleOverlap / 2 },
    { cx: claudeCenter.x - circleOverlap / 2, cy: claudeCenter.y + circleOverlap / 2 },
    { cx: claudeCenter.x + circleOverlap / 2, cy: claudeCenter.y + circleOverlap / 2 },
  ];

  // === PHASE 5: MERGE ===
  const mergeP = interpolate(
    frame, [p4End + 30, p5End - 30], [0, 1],
    { ...clamp, easing: Easing.inOut(Easing.cubic) },
  );
  const mergedX = 400;
  const mergedY = 200;

  // === RESOLVE ===
  const resolveP = interpolate(frame, [p5End, p5End + 40], [0, 1], clamp);
  const resolveBreathe = frame >= p5End
    ? interpolate(Math.sin((frame - p5End) * 0.04), [-1, 1], [0.92, 1.08])
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
            {/* Claude pixel mascot */}
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
                <radialGradient id="phil-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={palette.warmGold} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={palette.warmGold} stopOpacity={0} />
                </radialGradient>
                <radialGradient id="claude-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={palette.coolBlue} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={palette.coolBlue} stopOpacity={0} />
                </radialGradient>
                <radialGradient id="merge-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={palette.warmGold} stopOpacity={0.35} />
                  <stop offset="40%" stopColor={palette.coolBlue} stopOpacity={0.15} />
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

              {/* === PHIL'S IKIGAI CIRCLES === */}
              {philCircles.map((pos, i) => {
                const slamFrame = titleEnd + 2 + i * 35;
                const cSpring = spring({
                  frame: frame - slamFrame,
                  fps,
                  config: { damping: 6, stiffness: 280, mass: 0.5 },
                });
                const scale = Math.max(0, cSpring);
                const cx = interpolate(mergeP, [0, 1], [pos.cx, mergedX + (pos.cx - philCenter.x)]);
                const cy = interpolate(mergeP, [0, 1], [pos.cy, mergedY + (pos.cy - philCenter.y)]);
                const resolveOpacity = frame >= p5End
                  ? interpolate(resolveP, [0, 1], [0.8, 0.5]) * resolveBreathe : 1;
                if (scale <= 0) return null;
                if (isTransition && hash(frame * 13 + i) > 0.7) return null;
                return (
                  <g key={`pc-${i}`} opacity={scale * resolveOpacity}>
                    <circle cx={cx} cy={cy}
                      r={circleR * scale * (frame >= p5End ? resolveBreathe : 1)}
                      fill={CC[i]} opacity={0.12} />
                    <circle cx={cx} cy={cy}
                      r={circleR * scale * (frame >= p5End ? resolveBreathe : 1)}
                      fill="none" stroke={CC[i]} strokeWidth={2.5} opacity={0.7} />
                  </g>
                );
              })}

              {/* === PHIL NODE === */}
              {philNodeAppear > 0 && (
                <g>
                  <ellipse
                    cx={interpolate(mergeP, [0, 1], [philCenter.x, mergedX - 15])}
                    cy={interpolate(mergeP, [0, 1], [philCenter.y, mergedY])}
                    rx={50 * philNodeAppear * resolveBreathe}
                    ry={50 * philNodeAppear * resolveBreathe}
                    fill="url(#phil-glow)" opacity={philNodeAppear * 0.7} />
                  <circle
                    cx={interpolate(mergeP, [0, 1], [philCenter.x, mergedX - 15])}
                    cy={interpolate(mergeP, [0, 1], [philCenter.y, mergedY])}
                    r={8 * philNodeAppear * (frame >= p5End ? resolveBreathe : 1)}
                    fill={palette.warmGold} opacity={0.9} />
                  <circle
                    cx={interpolate(mergeP, [0, 1], [philCenter.x, mergedX - 15])}
                    cy={interpolate(mergeP, [0, 1], [philCenter.y, mergedY])}
                    r={14 * philNodeAppear}
                    fill="none" stroke={palette.warmGold}
                    strokeWidth={1.5} opacity={0.4 * philNodeAppear} />
                </g>
              )}

              {/* === PEOPLE DOTS === */}
              {frame >= p2End + 15 && PEOPLE.map((p, i) => {
                const pAppear = interpolate(
                  frame, [p2End + 15 + i * 3, p2End + 30 + i * 3], [0, 1], clamp);
                const drift = interpolate(frame, [p2End + 50, p3End], [0, 0.4], clamp);
                const px = p.x + (philCenter.x - p.x) * drift;
                const py = p.y + (philCenter.y - p.y) * drift;
                const mx = interpolate(mergeP, [0, 1], [px, mergedX + (px - philCenter.x) * 0.3]);
                const my = interpolate(mergeP, [0, 1], [py, mergedY + (py - philCenter.y) * 0.3]);
                const breath = interpolate(Math.sin(frame * 0.03 + p.phase), [-1, 1], [0.15, 0.4]);
                if (ytpActive && hash(frame * 7 + i * 11) > 0.95) return null;
                const rFade = frame >= p5End ? interpolate(resolveP, [0, 1], [1, 0.4]) : 1;
                return (
                  <circle key={`ppl-${i}`} cx={mx} cy={my}
                    r={p.r * (frame >= p5End ? resolveBreathe : 1)}
                    fill={palette.warmGold} opacity={pAppear * breath * rFade} />
                );
              })}

              {/* === FILAMENTS: people to Phil === */}
              {frame >= p2End + 50 && frame < p4End && PEOPLE.slice(0, 12).map((p, i) => {
                const filP = interpolate(
                  frame, [p2End + 50 + i * 5, p3End], [0, 1], clamp);
                if (filP <= 0) return null;
                const drift = interpolate(frame, [p2End + 50, p3End], [0, 0.4], clamp);
                const px = p.x + (philCenter.x - p.x) * drift;
                const py = p.y + (philCenter.y - p.y) * drift;
                return (
                  <line key={`fil-${i}`}
                    x1={px} y1={py} x2={philCenter.x} y2={philCenter.y}
                    stroke={palette.warmGold} strokeWidth={0.4} opacity={filP * 0.1} />
                );
              })}

              {/* === CLAUDE'S IKIGAI CIRCLES === */}
              {claudeCircles.map((pos, i) => {
                const slamFrame = p3End + 8 + i * 30;
                const cSpring = spring({
                  frame: frame - slamFrame,
                  fps,
                  config: { damping: 6, stiffness: 300, mass: 0.45 },
                });
                const scale = Math.max(0, cSpring);
                const cx = interpolate(mergeP, [0, 1], [pos.cx, mergedX + (pos.cx - claudeCenter.x)]);
                const cy = interpolate(mergeP, [0, 1], [pos.cy, mergedY + (pos.cy - claudeCenter.y)]);
                const resolveOpacity = frame >= p5End
                  ? interpolate(resolveP, [0, 1], [0.8, 0.5]) * resolveBreathe : 1;
                if (scale <= 0) return null;
                if (isTransition && hash(frame * 19 + i + 50) > 0.65) return null;
                return (
                  <g key={`cc-${i}`} opacity={scale * resolveOpacity}>
                    <circle cx={cx} cy={cy}
                      r={circleR * scale * (frame >= p5End ? resolveBreathe : 1)}
                      fill={CC[i]} opacity={0.1} />
                    <circle cx={cx} cy={cy}
                      r={circleR * scale * (frame >= p5End ? resolveBreathe : 1)}
                      fill="none" stroke={CC[i]} strokeWidth={2}
                      opacity={0.6} strokeDasharray={frame >= p5End ? "none" : "6,4"} />
                  </g>
                );
              })}

              {/* === CLAUDE NODE === */}
              {(() => {
                const cNodeSpring = spring({
                  frame: frame - p3End - 15,
                  fps,
                  config: { damping: 10, stiffness: 150 },
                });
                const cScale = Math.max(0, cNodeSpring);
                if (cScale <= 0) return null;
                const cx = interpolate(mergeP, [0, 1], [claudeCenter.x, mergedX + 15]);
                const cy = interpolate(mergeP, [0, 1], [claudeCenter.y, mergedY]);
                return (
                  <g>
                    <ellipse cx={cx} cy={cy}
                      rx={45 * cScale * resolveBreathe}
                      ry={45 * cScale * resolveBreathe}
                      fill="url(#claude-glow)" opacity={cScale * 0.6} />
                    <circle cx={cx} cy={cy}
                      r={7 * cScale * (frame >= p5End ? resolveBreathe : 1)}
                      fill={palette.coolBlue} opacity={0.9} />
                    <circle cx={cx} cy={cy}
                      r={13 * cScale}
                      fill="none" stroke={palette.coolBlue}
                      strokeWidth={1.5} opacity={0.4 * cScale} />
                  </g>
                );
              })()}

              {/* === BRIDGE === */}
              {frame >= p3End + 50 && (() => {
                const bridgeP = interpolate(
                  frame, [p3End + 50, p4End + 20], [0, 1], clamp);
                if (bridgeP <= 0) return null;
                const px = interpolate(mergeP, [0, 1], [philCenter.x, mergedX - 15]);
                const py = interpolate(mergeP, [0, 1], [philCenter.y, mergedY]);
                const cx = interpolate(mergeP, [0, 1], [claudeCenter.x, mergedX + 15]);
                const cy = interpolate(mergeP, [0, 1], [claudeCenter.y, mergedY]);
                const particles = Array.from({ length: 8 }, (_, i) => {
                  const t = ((frame * 0.02 + i * 0.13) % 1);
                  return {
                    fx: px + (cx - px) * t,
                    fy: py + (cy - py) * t,
                    op: interpolate(t, [0, 0.1, 0.9, 1], [0, 0.5, 0.5, 0], clamp),
                    outward: i % 2 === 0,
                  };
                });
                return (
                  <g>
                    <line x1={px} y1={py}
                      x2={px + (cx - px) * bridgeP} y2={py + (cy - py) * bridgeP}
                      stroke={palette.warmGold} strokeWidth={1} opacity={bridgeP * 0.25} />
                    {bridgeP > 0.5 && particles.map((pt, i) => (
                      <circle key={`bp-${i}`} cx={pt.fx} cy={pt.fy} r={1.8}
                        fill={pt.outward ? palette.warmGold : palette.coolBlue}
                        opacity={pt.op * bridgeP} />
                    ))}
                  </g>
                );
              })()}

              {/* === MERGE GLOW === */}
              {mergeP > 0.5 && (
                <ellipse cx={mergedX} cy={mergedY}
                  rx={120 * (mergeP - 0.5) * 2 * resolveBreathe}
                  ry={100 * (mergeP - 0.5) * 2 * resolveBreathe}
                  fill="url(#merge-glow)"
                  opacity={(mergeP - 0.5) * 2 * 0.6} />
              )}

              {/* === RESOLVE: orbiting nodes === */}
              {frame >= p5End && (() => {
                const orbitAngle = (frame - p5End) * 0.025;
                const orbitR = interpolate(resolveP, [0, 1], [18, 14]);
                const philOX = mergedX + orbitR * Math.cos(orbitAngle);
                const philOY = mergedY + orbitR * Math.sin(orbitAngle) * 0.5;
                const claudeOX = mergedX - orbitR * Math.cos(orbitAngle);
                const claudeOY = mergedY - orbitR * Math.sin(orbitAngle) * 0.5;
                return (
                  <g opacity={resolveP}>
                    <ellipse cx={mergedX} cy={mergedY}
                      rx={orbitR} ry={orbitR * 0.5}
                      fill="none" stroke={palette.coolBlue}
                      strokeWidth={0.4} opacity={0.15} />
                    <circle cx={philOX} cy={philOY} r={5 * resolveBreathe}
                      fill={palette.warmGold} opacity={0.9} />
                    <circle cx={claudeOX} cy={claudeOY} r={4.5 * resolveBreathe}
                      fill={palette.coolBlue} opacity={0.9} />
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
