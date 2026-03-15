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
import { Background } from "../components/Background";
import { GridOverlay } from "../components/GridOverlay";
import { Stars } from "../components/Stars";
import { CornerAccents } from "../components/CornerAccents";
import { palette } from "../components/MountainPalette";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

// === SEED DATA ===
// Scattered learner dots — each is a life, a stopped journey
// Positioned to feel organic, not gridded
const LEARNERS = [
  { x: 68, y: 85, r: 2.0 },
  { x: 142, y: 310, r: 1.6 },
  { x: 95, y: 195, r: 1.8 },
  { x: 188, y: 52, r: 1.4 },
  { x: 210, y: 265, r: 2.2 },
  { x: 115, y: 355, r: 1.3 },
  { x: 265, y: 120, r: 1.7 },
  { x: 52, y: 255, r: 1.5 },
  { x: 305, y: 330, r: 1.9 },
  { x: 170, y: 160, r: 1.4 },
  { x: 330, y: 65, r: 1.6 },
  { x: 240, y: 370, r: 1.3 },
  { x: 88, y: 140, r: 1.8 },
  { x: 350, y: 220, r: 1.5 },
  { x: 155, y: 390, r: 1.2 },
  // Right side
  { x: 732, y: 90, r: 2.0 },
  { x: 658, y: 315, r: 1.6 },
  { x: 705, y: 200, r: 1.8 },
  { x: 612, y: 48, r: 1.4 },
  { x: 590, y: 270, r: 2.2 },
  { x: 685, y: 360, r: 1.3 },
  { x: 535, y: 115, r: 1.7 },
  { x: 748, y: 260, r: 1.5 },
  { x: 495, y: 335, r: 1.9 },
  { x: 630, y: 155, r: 1.4 },
  { x: 470, y: 70, r: 1.6 },
  { x: 560, y: 375, r: 1.3 },
  { x: 712, y: 145, r: 1.8 },
  { x: 450, y: 225, r: 1.5 },
  { x: 645, y: 385, r: 1.2 },
  // Closer to center
  { x: 340, y: 155, r: 1.6 },
  { x: 460, y: 150, r: 1.5 },
  { x: 370, y: 320, r: 1.7 },
  { x: 430, y: 340, r: 1.4 },
  { x: 310, y: 240, r: 1.3 },
  { x: 490, y: 245, r: 1.6 },
];

const CENTER_X = 400;
const CENTER_Y = 200;

// Data particles that flow along connections
const FLOW_PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  learnerIndex: i % LEARNERS.length,
  speed: 0.4 + (i * 0.137) % 0.6,
  offset: (i * 0.31) % 1,
}));

export const FutureIsNow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase timing
  const p1End = 3 * fps;    // 90
  const p2End = 6 * fps;    // 180
  const p3End = 9 * fps;    // 270
  const p4End = 12 * fps;   // 360
  // p5: 360-420 (resolve)

  return (
    <AbsoluteFill>
      <Audio src={staticFile("audio/future-is-now.mp3")} volume={1} />
      <Background />
      <GridOverlay />
      <Stars />

      <AbsoluteFill>
        <svg width={800} height={400} viewBox="0 0 800 400">
          <defs>
            <radialGradient id="centerPulse" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={palette.warmGold} stopOpacity={0.25} />
              <stop offset="40%" stopColor={palette.warmGold} stopOpacity={0.08} />
              <stop offset="100%" stopColor={palette.warmGold} stopOpacity={0} />
            </radialGradient>
            <radialGradient id="waveGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={palette.warmGold} stopOpacity={0} />
              <stop offset="85%" stopColor={palette.warmGold} stopOpacity={0.12} />
              <stop offset="100%" stopColor={palette.warmGold} stopOpacity={0} />
            </radialGradient>
          </defs>

          {/* === PHASE 1: SCATTERED DOTS (0-3s) === */}
          {/* Each dot fades in with a slight stagger — isolated, still */}
          {LEARNERS.map((dot, i) => {
            const stagger = 1 + (i * 0.8) % 12;
            const dotAppear = interpolate(frame, [stagger, stagger + 8], [0, 1], clamp);

            // Gentle breathing — each dot on its own rhythm
            const breath = interpolate(
              Math.sin(frame * 0.025 + i * 2.3),
              [-1, 1],
              [0.08, 0.22],
            );

            // Distance from center (for phase 2 wave timing)
            const dist = Math.sqrt(
              (dot.x - CENTER_X) ** 2 + (dot.y - CENTER_Y) ** 2
            );

            // Phase 2: Wave reaches this dot → it brightens
            const waveReachFrame = p1End + 15 + dist * 0.12;
            const connected = interpolate(
              frame,
              [waveReachFrame, waveReachFrame + 30],
              [0, 1],
              clamp,
            );

            // Phase 3: Dots warm up from blue to gold as network strengthens
            const warmth = interpolate(
              frame,
              [p2End, p2End + 60 + i * 2],
              [0, 1],
              clamp,
            );

            // Phase 4: System pulse — all dots breathe together
            const systemPulse = frame >= p3End
              ? interpolate(
                  Math.sin((frame - p3End) * 0.06),
                  [-1, 1],
                  [0.3, 0.55],
                )
              : 0;

            // Composite opacity
            const baseOpacity = dotAppear * breath;
            const connectedOpacity = connected * 0.35;
            const finalOpacity = Math.min(
              baseOpacity + connectedOpacity + systemPulse,
              0.7,
            );

            // Color transition: cool blue → warm gold
            const r = Math.round(interpolate(warmth, [0, 1], [168, 212]));
            const g = Math.round(interpolate(warmth, [0, 1], [197, 165]));
            const b = Math.round(interpolate(warmth, [0, 1], [216, 116]));

            return (
              <circle
                key={`dot-${i}`}
                cx={dot.x}
                cy={dot.y}
                r={dot.r + connected * 0.8}
                fill={`rgb(${r}, ${g}, ${b})`}
                opacity={finalOpacity}
              />
            );
          })}

          {/* === PHASE 2: PULSE WAVE (3-6s) === */}
          {/* Expanding ring from center */}
          {frame >= p1End && frame < p3End + 30 && (() => {
            const waveProgress = interpolate(
              frame,
              [p1End + 10, p2End + 20],
              [0, 1],
              clamp,
            );
            const waveRadius = interpolate(waveProgress, [0, 1], [0, 450]);
            const waveOpacity = interpolate(
              waveProgress,
              [0, 0.2, 0.8, 1],
              [0, 0.15, 0.08, 0],
              clamp,
            );

            return (
              <circle
                cx={CENTER_X}
                cy={CENTER_Y}
                r={waveRadius}
                fill="none"
                stroke={palette.warmGold}
                strokeWidth={2}
                opacity={waveOpacity}
              />
            );
          })()}

          {/* Second, slower wave */}
          {frame >= p1End + 25 && frame < p3End + 50 && (() => {
            const wave2Progress = interpolate(
              frame,
              [p1End + 25, p2End + 40],
              [0, 1],
              clamp,
            );
            const wave2Radius = interpolate(wave2Progress, [0, 1], [0, 450]);
            const wave2Opacity = interpolate(
              wave2Progress,
              [0, 0.15, 0.7, 1],
              [0, 0.08, 0.04, 0],
              clamp,
            );

            return (
              <circle
                cx={CENTER_X}
                cy={CENTER_Y}
                r={wave2Radius}
                fill="none"
                stroke={palette.warmGold}
                strokeWidth={1}
                opacity={wave2Opacity}
              />
            );
          })()}

          {/* Central glow — appears with the pulse */}
          {(() => {
            const glowAppear = interpolate(
              frame,
              [p1End, p1End + 30],
              [0, 1],
              clamp,
            );
            const glowPulse = frame >= p3End
              ? interpolate(
                  Math.sin((frame - p3End) * 0.06),
                  [-1, 1],
                  [0.8, 1.2],
                )
              : 1;

            return (
              <ellipse
                cx={CENTER_X}
                cy={CENTER_Y}
                rx={80 * glowAppear * glowPulse}
                ry={60 * glowAppear * glowPulse}
                fill="url(#centerPulse)"
                opacity={glowAppear}
              />
            );
          })()}

          {/* Central node */}
          {(() => {
            const nodeSpring = spring({
              frame: frame - p1End - 5,
              fps,
              config: { damping: 15, stiffness: 100 },
            });
            const nodeScale = Math.max(0, nodeSpring);
            const nodePulse = frame >= p3End
              ? interpolate(
                  Math.sin((frame - p3End) * 0.06),
                  [-1, 1],
                  [5, 7],
                )
              : 6;

            return (
              <g>
                <circle
                  cx={CENTER_X}
                  cy={CENTER_Y}
                  r={nodePulse * nodeScale}
                  fill={palette.bgDark}
                  stroke={palette.warmGold}
                  strokeWidth={2 * nodeScale}
                />
                <circle
                  cx={CENTER_X}
                  cy={CENTER_Y}
                  r={3 * nodeScale}
                  fill={palette.warmGold}
                  opacity={0.9 * nodeScale}
                />
              </g>
            );
          })()}

          {/* === PHASE 2-3: FILAMENTS (connections from center to dots) === */}
          {LEARNERS.map((dot, i) => {
            const dist = Math.sqrt(
              (dot.x - CENTER_X) ** 2 + (dot.y - CENTER_Y) ** 2
            );
            const waveReachFrame = p1End + 15 + dist * 0.12;

            // Filament draws from center outward
            const filamentProgress = interpolate(
              frame,
              [waveReachFrame, waveReachFrame + 40],
              [0, 1],
              clamp,
            );

            if (filamentProgress <= 0) return null;

            // Filament strengthens during phase 3
            const strength = interpolate(
              frame,
              [p2End, p3End],
              [0.06, 0.14],
              clamp,
            );

            // System pulse affects filament opacity
            const systemPulse = frame >= p3End
              ? interpolate(
                  Math.sin((frame - p3End) * 0.06 + i * 0.2),
                  [-1, 1],
                  [0.08, 0.2],
                )
              : strength;

            // Draw partial line based on progress
            const endX = interpolate(filamentProgress, [0, 1], [CENTER_X, dot.x]);
            const endY = interpolate(filamentProgress, [0, 1], [CENTER_Y, dot.y]);

            // Slight curve via control point
            const midX = (CENTER_X + dot.x) / 2 + (i % 2 === 0 ? 15 : -15);
            const midY = (CENTER_Y + dot.y) / 2 + (i % 3 === 0 ? 10 : -10);

            const cpX = interpolate(filamentProgress, [0, 1], [CENTER_X, midX]);
            const cpY = interpolate(filamentProgress, [0, 1], [CENTER_Y, midY]);

            // Color transitions with warmth
            const warmth = interpolate(
              frame,
              [p2End, p3End],
              [0, 1],
              clamp,
            );

            const strokeColor = warmth < 0.5 ? palette.coolBlue : palette.warmGold;

            return (
              <path
                key={`fil-${i}`}
                d={`M${CENTER_X},${CENTER_Y} Q${cpX},${cpY} ${endX},${endY}`}
                stroke={strokeColor}
                strokeWidth={0.6}
                fill="none"
                opacity={systemPulse}
              />
            );
          })}

          {/* === PHASE 3-4: DATA FLOW PARTICLES === */}
          {frame >= p2End && FLOW_PARTICLES.map((particle, i) => {
            const dot = LEARNERS[particle.learnerIndex];

            // Particle travels along the filament
            const cycleLength = 80 + particle.speed * 60;
            const t = ((frame - p2End + particle.offset * cycleLength) % cycleLength) / cycleLength;

            // Alternate direction: some flow out, some flow in
            const outward = i % 3 !== 0;
            const progress = outward ? t : 1 - t;

            const midX = (CENTER_X + dot.x) / 2 + (particle.learnerIndex % 2 === 0 ? 15 : -15);
            const midY = (CENTER_Y + dot.y) / 2 + (particle.learnerIndex % 3 === 0 ? 10 : -10);

            // Quadratic bezier point
            const px = (1 - progress) * (1 - progress) * CENTER_X +
              2 * (1 - progress) * progress * midX +
              progress * progress * dot.x;
            const py = (1 - progress) * (1 - progress) * CENTER_Y +
              2 * (1 - progress) * progress * midY +
              progress * progress * dot.y;

            // Fade in/out at endpoints
            const particleOpacity = interpolate(
              progress,
              [0, 0.1, 0.9, 1],
              [0, 0.4, 0.4, 0],
              clamp,
            );

            // Overall phase-in
            const phaseIn = interpolate(
              frame,
              [p2End + i * 3, p2End + i * 3 + 30],
              [0, 1],
              clamp,
            );

            return (
              <circle
                key={`flow-${i}`}
                cx={px}
                cy={py}
                r={1.2}
                fill={outward ? palette.warmGold : palette.coolBlue}
                opacity={particleOpacity * phaseIn}
              />
            );
          })}

          {/* === PHASE 4: SYSTEM HEARTBEAT (9-12s) === */}
          {/* Additional concentric rings that pulse outward */}
          {frame >= p3End && [0, 1, 2].map((ringIdx) => {
            const ringCycle = 60;
            const ringFrame = (frame - p3End + ringIdx * 20) % ringCycle;
            const ringProgress = ringFrame / ringCycle;
            const ringRadius = interpolate(ringProgress, [0, 1], [10, 180]);
            const ringOpacity = interpolate(
              ringProgress,
              [0, 0.1, 0.6, 1],
              [0, 0.1, 0.04, 0],
              clamp,
            );

            return (
              <circle
                key={`ring-${ringIdx}`}
                cx={CENTER_X}
                cy={CENTER_Y}
                r={ringRadius}
                fill="none"
                stroke={palette.warmGold}
                strokeWidth={0.8}
                opacity={ringOpacity}
              />
            );
          })}
        </svg>
      </AbsoluteFill>

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

      <CornerAccents />
    </AbsoluteFill>
  );
};
