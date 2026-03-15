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
  y: hash(i * 29) * 400,
  h: 2 + hash(i * 53) * 10,
  color: i % 3 === 0 ? palette.warmGold : i % 3 === 1 ? palette.coolBlue : palette.brightBlue,
  trigger: Math.floor(hash(i * 17) * 400) + 120,
}));

// Wave function: generate sine wave points
function wavePoints(
  ox: number, oy: number, width: number, amplitude: number,
  frequency: number, phase: number, segments: number,
): string {
  const pts: string[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = ox + t * width;
    const y = oy + Math.sin(t * frequency * Math.PI * 2 + phase) * amplitude;
    pts.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
  }
  return pts.join(" ");
}

export const TheAmplifier: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // === PHASE TIMING ===
  const titleEnd = 4 * fps;       // 120
  const p2End = 9 * fps;          // 270 — amplifier appears, first signal enters
  const p3End = 14 * fps;         // 420 — cold/mechanical signal amplified
  const p4End = 19 * fps;         // 570 — warm/human signal amplified
  const p5End = 24 * fps;         // 720 — contrast shown, warm fills screen
  // Resolve: 720-900

  const ytpActive = frame > titleEnd && frame < p5End;

  // === SCREEN SHAKE ===
  const transitionFrames: [number, number][] = [
    [titleEnd - 3, titleEnd + 5],
    [titleEnd + 50, titleEnd + 56],
    [titleEnd + 100, titleEnd + 106],
    [p2End - 4, p2End + 6],
    [p2End + 40, p2End + 48],
    [p3End - 6, p3End + 8],
    [p3End + 50, p3End + 56],
    [p4End - 6, p4End + 10],
    [p4End + 40, p4End + 46],
    [p5End - 12, p5End],
  ];
  const isTransition = transitionFrames.some(([a, b]) => frame >= a && frame <= b);
  const shakeIntensity = !ytpActive ? 0 : isTransition ? 15 : 1.3;
  const { x: sx, y: sy } = shake(frame, shakeIntensity);

  // === FLASH FRAMES ===
  const flashTriggers = [
    titleEnd, titleEnd + 51, titleEnd + 101,
    p2End, p2End + 41, p3End, p3End + 51, p4End, p4End + 41,
  ];
  const isFlash = ytpActive && flashTriggers.some(f => Math.abs(frame - f) < 2);

  // === ZOOM PULSES ===
  const zoomPulses = [
    { f: titleEnd + 1, s: 1.5, d: 8 },
    { f: titleEnd + 51, s: 1.3, d: 6 },
    { f: titleEnd + 101, s: 1.4, d: 7 },
    { f: p2End, s: 1.5, d: 10 },
    { f: p2End + 41, s: 1.35, d: 8 },
    { f: p3End, s: 1.6, d: 10 },
    { f: p3End + 51, s: 1.3, d: 8 },
    { f: p4End, s: 1.7, d: 12 },
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

  // === AMPLIFIER CIRCLE ===
  const ampAppear = spring({
    frame: frame - titleEnd - 10,
    fps,
    config: { damping: 8, stiffness: 200, mass: 0.6 },
  });
  const ampScale = Math.max(0, ampAppear);
  const ampPulse = ytpActive
    ? 1 + Math.sin(frame * 0.08) * 0.05
    : 1;

  // === COLD SIGNAL (phases 2-3) ===
  const coldSignalProgress = interpolate(frame, [titleEnd + 30, p3End], [0, 1], clamp);
  const coldAmplify = interpolate(frame, [p2End, p3End], [0, 1], clamp);

  // === WARM SIGNAL (phases 3-5) ===
  const warmSignalProgress = interpolate(frame, [p3End, p5End], [0, 1], clamp);
  const warmAmplify = interpolate(frame, [p3End + 30, p5End], [0, 1], clamp);

  // === RESOLVE ===
  const resolveP = interpolate(frame, [p5End, p5End + 40], [0, 1], clamp);
  const resolveBreathe = frame >= p5End
    ? interpolate(Math.sin((frame - p5End) * 0.04), [-1, 1], [0.93, 1.07])
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
                <radialGradient id="amp-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={palette.warmGold} stopOpacity={0.5} />
                  <stop offset="60%" stopColor={palette.warmGold} stopOpacity={0.1} />
                  <stop offset="100%" stopColor={palette.warmGold} stopOpacity={0} />
                </radialGradient>
                <radialGradient id="warm-fill" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={palette.warmGold} stopOpacity={0.15} />
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
                    opacity={0.05}
                  />
                );
              })}

              {/* === CENTRAL AMPLIFIER CIRCLE === */}
              {ampScale > 0 && (
                <g>
                  <ellipse cx={400} cy={200}
                    rx={70 * ampScale * ampPulse * (frame >= p5End ? resolveBreathe : 1)}
                    ry={70 * ampScale * ampPulse * (frame >= p5End ? resolveBreathe : 1)}
                    fill="url(#amp-glow)"
                    opacity={ampScale * 0.7}
                  />
                  <circle cx={400} cy={200}
                    r={40 * ampScale * ampPulse}
                    fill="none"
                    stroke={palette.warmGold}
                    strokeWidth={2}
                    opacity={0.5 * ampScale}
                  />
                  <circle cx={400} cy={200}
                    r={25 * ampScale * ampPulse}
                    fill={palette.warmGold}
                    opacity={0.12 * ampScale}
                  />
                  {/* Inner ring detail */}
                  <circle cx={400} cy={200}
                    r={15 * ampScale}
                    fill="none"
                    stroke={palette.warmGold}
                    strokeWidth={1}
                    opacity={0.3 * ampScale}
                    strokeDasharray={ytpActive ? "4,3" : "none"}
                  />
                </g>
              )}

              {/* === COLD/MECHANICAL SIGNAL (blue, angular) === */}
              {coldSignalProgress > 0 && (
                <g>
                  {/* Input: thin cold wave entering from left */}
                  {(() => {
                    const inputEnd = Math.min(coldSignalProgress * 350, 350);
                    const inputAmp = 8;
                    const freq = 6;
                    const stutter = ytpActive && hash(frame * 13) > 0.88
                      ? (hash(frame * 5) - 0.5) * 20 : 0;
                    return (
                      <path
                        d={wavePoints(30, 200 + stutter, inputEnd, inputAmp, freq, frame * 0.15, 60)}
                        fill="none"
                        stroke={palette.coolBlue}
                        strokeWidth={1.5}
                        opacity={0.6}
                      />
                    );
                  })()}
                  {/* Output: amplified cold wave exiting right — angular, harsh */}
                  {coldAmplify > 0 && (() => {
                    const outAmp = 8 + coldAmplify * 60;
                    const outWidth = coldAmplify * 350;
                    const harshFreq = 8;
                    // Make it angular: use sawtooth-ish wave
                    const pts: string[] = [];
                    const segs = 80;
                    for (let i = 0; i <= segs; i++) {
                      const t = i / segs;
                      const x = 430 + t * outWidth;
                      const raw = ((t * harshFreq + frame * 0.12) % 1);
                      const saw = raw < 0.5 ? raw * 4 - 1 : (1 - raw) * 4 - 1;
                      const y = 200 + saw * outAmp;
                      pts.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
                    }
                    const glitchOp = isTransition ? 0.3 + hash(frame * 7) * 0.5 : 0.5;
                    return (
                      <path
                        d={pts.join(" ")}
                        fill="none"
                        stroke={palette.coolBlue}
                        strokeWidth={2 + coldAmplify * 2}
                        opacity={glitchOp}
                      />
                    );
                  })()}
                  {/* Harsh artifacts from cold amplification */}
                  {coldAmplify > 0.3 && Array.from({ length: 6 }, (_, i) => {
                    const bx = 500 + i * 40;
                    const by = 200 + (hash(frame * 3 + i * 11) - 0.5) * 80 * coldAmplify;
                    if (hash(frame * 9 + i) > 0.6) return null;
                    return (
                      <rect
                        key={`harsh-${i}`}
                        x={bx} y={by - 5}
                        width={15 + hash(i * 31) * 20}
                        height={3}
                        fill={palette.coolBlue}
                        opacity={0.3 * coldAmplify}
                      />
                    );
                  })}
                </g>
              )}

              {/* === WARM/HUMAN SIGNAL (gold, smooth) === */}
              {warmSignalProgress > 0 && (
                <g>
                  {/* Input: thin warm wave entering from left */}
                  {(() => {
                    const inputEnd = Math.min(warmSignalProgress * 350, 350);
                    const inputAmp = 10;
                    const freq = 3;
                    return (
                      <path
                        d={wavePoints(30, 200, inputEnd, inputAmp, freq, frame * 0.06, 80)}
                        fill="none"
                        stroke={palette.warmGold}
                        strokeWidth={1.5}
                        opacity={0.7}
                      />
                    );
                  })()}
                  {/* Output: amplified warm wave — smooth, beautiful, expanding */}
                  {warmAmplify > 0 && (() => {
                    const outAmp = 10 + warmAmplify * 80;
                    const outWidth = warmAmplify * 370;
                    const smoothFreq = 2.5;
                    const resolveGrow = frame >= p5End ? resolveBreathe : 1;
                    return (
                      <g>
                        <path
                          d={wavePoints(430, 200, outWidth, outAmp * resolveGrow, smoothFreq, frame * 0.04, 100)}
                          fill="none"
                          stroke={palette.warmGold}
                          strokeWidth={2 + warmAmplify * 3}
                          opacity={0.5}
                        />
                        {/* Glow trail */}
                        <path
                          d={wavePoints(430, 200, outWidth, outAmp * resolveGrow * 0.8, smoothFreq, frame * 0.04 - 0.3, 100)}
                          fill="none"
                          stroke={palette.warmGold}
                          strokeWidth={1}
                          opacity={0.15}
                        />
                      </g>
                    );
                  })()}
                  {/* Warm glow particles */}
                  {warmAmplify > 0.2 && Array.from({ length: 10 }, (_, i) => {
                    const t = ((frame * 0.015 + i * 0.1) % 1);
                    const px = 430 + t * warmAmplify * 350;
                    const py = 200 + Math.sin(t * 2.5 * Math.PI * 2 + frame * 0.04) * (10 + warmAmplify * 70);
                    return (
                      <circle
                        key={`warm-p-${i}`}
                        cx={px} cy={py}
                        r={2 + warmAmplify * 2}
                        fill={palette.warmGold}
                        opacity={0.2 + hash(i * 41) * 0.2}
                      />
                    );
                  })}
                </g>
              )}

              {/* === RESOLVE: warm signal fills screen gently === */}
              {frame >= p5End && (
                <g opacity={resolveP}>
                  <ellipse cx={400} cy={200}
                    rx={350 * resolveP * resolveBreathe}
                    ry={150 * resolveP * resolveBreathe}
                    fill="url(#warm-fill)"
                    opacity={0.6 * resolveP}
                  />
                  {/* Breathing warm waves across full width */}
                  {Array.from({ length: 5 }, (_, i) => {
                    const yOff = (i - 2) * 40;
                    const amp = 20 + i * 8;
                    return (
                      <path
                        key={`rw-${i}`}
                        d={wavePoints(0, 200 + yOff, 800, amp * resolveBreathe, 1.5, frame * 0.025 + i * 0.5, 120)}
                        fill="none"
                        stroke={palette.warmGold}
                        strokeWidth={1}
                        opacity={0.08 * resolveP}
                      />
                    );
                  })}
                  {/* Fading amplifier */}
                  <circle cx={400} cy={200}
                    r={30 * resolveBreathe}
                    fill={palette.warmGold}
                    opacity={0.06 * resolveP}
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
    </AbsoluteFill>
  );
};
