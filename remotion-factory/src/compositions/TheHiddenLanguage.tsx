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

// Grid of rigid blocks (job title boxes)
const BLOCKS = Array.from({ length: 20 }, (_, i) => {
  const col = i % 5;
  const row = Math.floor(i / 5);
  return {
    x: 100 + col * 130,
    y: 60 + row * 80,
    w: 110,
    h: 60,
    // Each block has 2-4 hidden skill dots inside
    skills: Array.from({ length: 2 + Math.floor(hash(i * 37) * 3) }, (_, j) => ({
      sx: 100 + col * 130 + 15 + hash(i * 41 + j * 13) * 80,
      sy: 60 + row * 80 + 10 + hash(i * 53 + j * 17) * 40,
      r: 3 + hash(i * 67 + j * 23) * 3,
      phase: hash(i * 79 + j * 31) * Math.PI * 2,
    })),
  };
});

// All skills flattened for connection drawing
const ALL_SKILLS = BLOCKS.flatMap(b => b.skills);

// Pre-compute connections between nearby skills across different blocks
const CONNECTIONS: [number, number][] = [];
for (let i = 0; i < ALL_SKILLS.length; i++) {
  for (let j = i + 1; j < ALL_SKILLS.length; j++) {
    const dx = ALL_SKILLS[i].sx - ALL_SKILLS[j].sx;
    const dy = ALL_SKILLS[i].sy - ALL_SKILLS[j].sy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 120 && dist > 30) {
      CONNECTIONS.push([i, j]);
    }
  }
}

// Glitch bars
const GLITCH_BARS = Array.from({ length: 14 }, (_, i) => ({
  y: hash(i * 33) * 400,
  h: 2 + hash(i * 51) * 10,
  color: i % 2 === 0 ? palette.brightBlue : palette.warmGold,
  trigger: Math.floor(hash(i * 19) * 400) + 120,
}));

export const TheHiddenLanguage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // === PHASE TIMING ===
  const titleEnd = 4 * fps;       // 120
  const p2End = 9 * fps;          // 270 — rigid blocks visible, grid established
  const p3End = 14 * fps;         // 420 — blocks dissolving, skills emerging
  const p4End = 19 * fps;         // 570 — connections forming, Rosetta wave
  const p5End = 24 * fps;         // 720 — full web visible
  // Resolve: 720-900

  const ytpActive = frame > titleEnd && frame < p5End;

  // === SCREEN SHAKE ===
  const transitionFrames: [number, number][] = [
    [titleEnd - 3, titleEnd + 5],
    [titleEnd + 45, titleEnd + 51],
    [titleEnd + 95, titleEnd + 101],
    [p2End - 4, p2End + 6],
    [p2End + 55, p2End + 63],
    [p3End - 6, p3End + 8],
    [p3End + 45, p3End + 53],
    [p4End - 8, p4End + 10],
    [p4End + 35, p4End + 43],
    [p5End - 12, p5End],
  ];
  const isTransition = transitionFrames.some(([a, b]) => frame >= a && frame <= b);
  const shakeIntensity = !ytpActive ? 0 : isTransition ? 14 : 1.0;
  const { x: sx, y: sy } = shake(frame, shakeIntensity);

  // === FLASH FRAMES ===
  const flashTriggers = [
    titleEnd, titleEnd + 46, titleEnd + 96,
    p2End, p2End + 56, p3End, p3End + 46, p4End, p4End + 36,
  ];
  const isFlash = ytpActive && flashTriggers.some(f => Math.abs(frame - f) < 2);

  // === ZOOM PULSES ===
  const zoomPulses = [
    { f: titleEnd + 1, s: 1.4, d: 8 },
    { f: titleEnd + 46, s: 1.3, d: 6 },
    { f: titleEnd + 96, s: 1.35, d: 7 },
    { f: p2End, s: 1.5, d: 10 },
    { f: p2End + 56, s: 1.3, d: 8 },
    { f: p3End, s: 1.6, d: 10 },
    { f: p3End + 46, s: 1.4, d: 8 },
    { f: p4End, s: 1.7, d: 12 },
    { f: p4End + 36, s: 1.35, d: 8 },
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

  // === BLOCK DISSOLUTION ===
  const dissolveProgress = interpolate(frame, [p2End, p3End + 60], [0, 1], clamp);

  // === SKILL EMERGENCE ===
  const skillReveal = interpolate(frame, [p2End + 30, p3End], [0, 1], clamp);

  // === CONNECTION FORMATION ===
  const connectionProgress = interpolate(frame, [p3End, p4End], [0, 1], clamp);

  // === ROSETTA WAVE (decoding sweep) ===
  const rosettaWaveX = interpolate(frame, [p3End + 60, p4End + 30], [-100, 900], clamp);
  const rosettaActive = frame >= p3End + 60 && frame <= p4End + 30;

  // === RESOLVE ===
  const resolveP = interpolate(frame, [p5End, p5End + 40], [0, 1], clamp);
  const resolveBreathe = frame >= p5End
    ? interpolate(Math.sin((frame - p5End) * 0.04), [-1, 1], [0.94, 1.06])
    : 1;

  return (
    <AbsoluteFill style={{ backgroundColor: palette.bgDark }}>
      <Audio src={staticFile("audio/the-hidden-language.mp3")} volume={1} />

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
                <radialGradient id="hl-skill-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={palette.warmGold} stopOpacity={0.6} />
                  <stop offset="100%" stopColor={palette.warmGold} stopOpacity={0} />
                </radialGradient>
                <linearGradient id="hl-rosetta" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={palette.brightBlue} stopOpacity={0} />
                  <stop offset="40%" stopColor={palette.brightBlue} stopOpacity={0.6} />
                  <stop offset="60%" stopColor={palette.warmGold} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={palette.warmGold} stopOpacity={0} />
                </linearGradient>
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

              {/* === RIGID BLOCKS (dissolving) === */}
              {BLOCKS.map((block, i) => {
                const blockAppear = spring({
                  frame: frame - titleEnd - 5 - i * 4,
                  fps,
                  config: { damping: 8, stiffness: 250, mass: 0.5 },
                });
                const bScale = Math.max(0, blockAppear);
                if (bScale <= 0) return null;

                // Dissolution: opacity decreases, edges fragment
                const blockOpacity = interpolate(dissolveProgress, [0, 0.5, 1], [0.8, 0.4, 0], clamp);
                if (blockOpacity <= 0) return null;

                // Glitch stutter on blocks
                const glitchShift = ytpActive && hash(frame * 7 + i * 19) > 0.88
                  ? (hash(frame * 3 + i) - 0.5) * 15 : 0;

                // Fragment during dissolution
                const fragmented = dissolveProgress > 0.3;
                const fragOffsets = fragmented ? [
                  { dx: (hash(i * 11) - 0.5) * dissolveProgress * 30, dy: (hash(i * 23) - 0.5) * dissolveProgress * 20 },
                  { dx: (hash(i * 37) - 0.5) * dissolveProgress * 25, dy: (hash(i * 43) - 0.5) * dissolveProgress * 25 },
                ] : [{ dx: 0, dy: 0 }];

                return (
                  <g key={`block-${i}`} opacity={blockOpacity * bScale}>
                    {fragOffsets.map((frag, fi) => (
                      <rect
                        key={`bf-${i}-${fi}`}
                        x={block.x + glitchShift + frag.dx}
                        y={block.y + frag.dy}
                        width={fragmented ? block.w / 2 : block.w}
                        height={fragmented ? block.h / 2 : block.h}
                        fill="none"
                        stroke={palette.coolBlue}
                        strokeWidth={1.5}
                        opacity={0.6}
                      />
                    ))}
                    {/* Block interior lines (rigid structure) */}
                    {!fragmented && (
                      <>
                        <line
                          x1={block.x + 8} y1={block.y + 18}
                          x2={block.x + block.w - 8} y2={block.y + 18}
                          stroke={palette.coolBlue} strokeWidth={0.8} opacity={0.2}
                        />
                        <line
                          x1={block.x + 8} y1={block.y + 35}
                          x2={block.x + block.w * 0.6} y2={block.y + 35}
                          stroke={palette.coolBlue} strokeWidth={0.6} opacity={0.15}
                        />
                      </>
                    )}
                  </g>
                );
              })}

              {/* === SKILL DOTS (emerging from dissolved blocks) === */}
              {skillReveal > 0 && ALL_SKILLS.map((skill, i) => {
                const delay = i * 0.02;
                const reveal = interpolate(skillReveal, [delay, delay + 0.15], [0, 1], clamp);
                if (reveal <= 0) return null;
                const breath = frame >= p5End
                  ? interpolate(Math.sin((frame - p5End) * 0.05 + skill.phase), [-1, 1], [0.7, 1.3])
                  : 1;
                const glitchFlicker = ytpActive && hash(frame * 11 + i * 7) > 0.93 ? 0 : 1;
                return (
                  <g key={`skill-${i}`} opacity={reveal * glitchFlicker}>
                    <ellipse
                      cx={skill.sx} cy={skill.sy}
                      rx={skill.r * 3 * reveal * (frame >= p5End ? resolveBreathe : 1)}
                      ry={skill.r * 3 * reveal * (frame >= p5End ? resolveBreathe : 1)}
                      fill={palette.warmGold}
                      opacity={0.08 * breath}
                    />
                    <circle
                      cx={skill.sx} cy={skill.sy}
                      r={skill.r * reveal * (frame >= p5End ? resolveBreathe : 1)}
                      fill={palette.warmGold}
                      opacity={0.7 * breath}
                    />
                  </g>
                );
              })}

              {/* === CONNECTIONS (filaments between skills) === */}
              {connectionProgress > 0 && CONNECTIONS.map(([a, b], ci) => {
                const delay = ci * 0.008;
                const connP = interpolate(connectionProgress, [delay, delay + 0.1], [0, 1], clamp);
                if (connP <= 0) return null;
                const sa = ALL_SKILLS[a];
                const sb = ALL_SKILLS[b];
                const glitchBreak = ytpActive && hash(frame * 5 + ci * 13) > 0.92;
                if (glitchBreak) return null;
                const resolveOp = frame >= p5End
                  ? interpolate(Math.sin((frame - p5End) * 0.03 + ci * 0.1), [-1, 1], [0.05, 0.2])
                  : 0.12;
                return (
                  <line
                    key={`conn-${ci}`}
                    x1={sa.sx} y1={sa.sy}
                    x2={sa.sx + (sb.sx - sa.sx) * connP}
                    y2={sa.sy + (sb.sy - sa.sy) * connP}
                    stroke={palette.warmGold}
                    strokeWidth={0.6}
                    opacity={connP * resolveOp}
                  />
                );
              })}

              {/* === ROSETTA WAVE (decoding sweep) === */}
              {rosettaActive && (
                <g>
                  <rect
                    x={rosettaWaveX - 30} y={0}
                    width={60} height={400}
                    fill="url(#hl-rosetta)"
                    opacity={0.5}
                  />
                  {/* Particles riding the wave */}
                  {Array.from({ length: 8 }, (_, i) => (
                    <circle
                      key={`rosetta-p-${i}`}
                      cx={rosettaWaveX + (hash(i * 29) - 0.5) * 40}
                      cy={30 + i * 45 + Math.sin(frame * 0.1 + i) * 10}
                      r={2 + hash(i * 41) * 2}
                      fill={i % 2 === 0 ? palette.brightBlue : palette.warmGold}
                      opacity={0.6}
                    />
                  ))}
                </g>
              )}

              {/* === RESOLVE: beautiful breathing web === */}
              {frame >= p5End && (
                <g opacity={resolveP}>
                  {/* Subtle central glow */}
                  <ellipse
                    cx={400} cy={200}
                    rx={250 * resolveP * resolveBreathe}
                    ry={120 * resolveP * resolveBreathe}
                    fill={palette.warmGold}
                    opacity={0.03 * resolveP}
                  />
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
