import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
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

const CX = 400;
const CY = 200;
const RADIUS = 120;

// The arc covers ~330 degrees (leaving a 30-degree gap at top-right)
// Gap runs from roughly -15deg to +15deg (in standard math, measuring from 3 o'clock)
// In SVG terms, the gap is at the 1 o'clock position
const ARC_START_ANGLE = 25; // degrees from 3 o'clock
const ARC_END_ANGLE = 335; // degrees, leaving a 30-degree gap
const GAP_CENTER_ANGLE = 10; // center of the gap in degrees

// Scattered dots — the 42 million outside the circle
const SCATTERED = [
  { x: 580, y: 65, r: 1.8 },
  { x: 620, y: 120, r: 1.5 },
  { x: 560, y: 140, r: 2.0 },
  { x: 640, y: 85, r: 1.3 },
  { x: 600, y: 170, r: 1.6 },
  { x: 680, y: 110, r: 1.4 },
  { x: 550, y: 50, r: 1.7 },
  { x: 700, y: 150, r: 1.2 },
  // Further out
  { x: 720, y: 60, r: 1.5 },
  { x: 660, y: 200, r: 1.3 },
  { x: 740, y: 130, r: 1.1 },
  { x: 580, y: 30, r: 1.4 },
  // Left side — fewer, these are the ones further from returning
  { x: 120, y: 140, r: 1.5 },
  { x: 155, y: 260, r: 1.2 },
  { x: 95, y: 200, r: 1.8 },
  { x: 680, y: 250, r: 1.3 },
  { x: 710, y: 300, r: 1.6 },
  { x: 650, y: 310, r: 1.2 },
  { x: 180, y: 330, r: 1.4 },
  { x: 130, y: 90, r: 1.0 },
  { x: 200, y: 350, r: 1.3 },
  { x: 100, y: 310, r: 1.5 },
  { x: 720, y: 340, r: 1.1 },
  { x: 170, y: 170, r: 1.6 },
];

// Helper: get point on circle at angle (degrees, 0 = 3 o'clock, clockwise)
function circlePoint(angle: number, r: number = RADIUS) {
  const rad = (angle * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

// SVG arc path from startAngle to endAngle
function arcPath(startAngle: number, endAngle: number, r: number = RADIUS) {
  const start = circlePoint(startAngle, r);
  const end = circlePoint(endAngle, r);
  const sweep = endAngle - startAngle;
  const largeArc = sweep > 180 ? 1 : 0;
  return `M${start.x},${start.y} A${r},${r} 0 ${largeArc} 1 ${end.x},${end.y}`;
}

export const TheUnfinished: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const p1End = 3 * fps;   // 90
  const p2End = 6 * fps;   // 180
  const p3End = 9 * fps;   // 270
  const p4End = 12 * fps;  // 360

  // === PHASE 1: THE CIRCLE DRAWS ITSELF (0-3s) ===
  const drawProgress = interpolate(frame, [10, p1End - 5], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });

  // The arc draws from the bottom, sweeping both directions, leaving the gap
  const currentEndAngle = interpolate(drawProgress, [0, 1], [ARC_START_ANGLE, ARC_END_ANGLE]);

  // Inner and outer echo arcs (from the SVG)
  const echoOpacity = interpolate(frame, [p1End - 20, p1End + 10], [0, 1], clamp);

  // === PHASE 2: SCATTERED DOTS APPEAR (3-6s) ===
  // (dots render below)

  // === PHASE 3: FILAMENTS TOWARD THE GAP (6-9s) ===
  // Gap center point
  const gapPoint = circlePoint(GAP_CENTER_ANGLE);

  // === PHASE 4: GAP NARROWS (9-12s) ===
  // The arc extends, gap shrinks from 30 degrees to ~8 degrees
  const gapNarrow = interpolate(
    frame,
    [p3End, p4End],
    [0, 1],
    { ...clamp, easing: Easing.inOut(Easing.quad) },
  );
  const finalStartAngle = interpolate(gapNarrow, [0, 1], [ARC_START_ANGLE, 8]);
  const finalEndAngle = interpolate(gapNarrow, [0, 1], [ARC_END_ANGLE, 352]);

  // Use the narrowing angles once we're in phase 4
  const activeStartAngle = frame >= p3End ? finalStartAngle : ARC_START_ANGLE;
  const activeEndAngle = frame >= p3End
    ? finalEndAngle
    : Math.min(currentEndAngle, ARC_END_ANGLE);

  // === PHASE 5: RESOLVE (12-14s) ===
  const resolveBreath = frame >= p4End
    ? interpolate(Math.sin((frame - p4End) * 0.06), [-1, 1], [0.6, 1])
    : 1;

  // Napkin appears
  const napkinSpring = spring({
    frame: frame - p4End - 10,
    fps,
    config: { damping: 200 },
  });
  const napkinOpacity = Math.max(0, napkinSpring) * 0.5;

  // Inner glow grows during phase 4-5
  const innerGlow = interpolate(
    frame,
    [p3End, p4End, p4End + 30],
    [0, 0.12, 0.18],
    clamp,
  );

  return (
    <AbsoluteFill>
      <Background />
      <GridOverlay />
      <Stars />

      <AbsoluteFill>
        <svg width={800} height={400} viewBox="0 0 800 400">
          <defs>
            <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={palette.warmGold} />
              <stop offset="60%" stopColor={palette.coolBlue} />
              <stop offset="100%" stopColor="#5ba3c8" />
            </linearGradient>
            <radialGradient id="innerGlow" cx="50%" cy="50%" r="35%">
              <stop offset="0%" stopColor={palette.warmGold} stopOpacity={innerGlow} />
              <stop offset="60%" stopColor={palette.coolBlue} stopOpacity={innerGlow * 0.4} />
              <stop offset="100%" stopColor={palette.coolBlue} stopOpacity={0} />
            </radialGradient>
            <radialGradient id="napkinGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#e8d5b8" stopOpacity={0.15} />
              <stop offset="100%" stopColor={palette.warmGold} stopOpacity={0} />
            </radialGradient>
          </defs>

          {/* Inner glow */}
          <ellipse
            cx={CX}
            cy={CY}
            rx={RADIUS * 1.2 * resolveBreath}
            ry={RADIUS * 1.2 * resolveBreath}
            fill="url(#innerGlow)"
          />

          {/* === THE MAIN ARC === */}
          {drawProgress > 0 && (
            <path
              d={arcPath(activeStartAngle, activeEndAngle)}
              fill="none"
              stroke="url(#arcGrad)"
              strokeWidth={3}
              opacity={0.7 * resolveBreath}
              strokeLinecap="round"
            />
          )}

          {/* Inner echo arc */}
          {echoOpacity > 0 && (
            <path
              d={arcPath(
                frame >= p3End ? finalStartAngle + 2 : ARC_START_ANGLE + 2,
                frame >= p3End ? finalEndAngle - 2 : Math.min(currentEndAngle - 2, ARC_END_ANGLE - 2),
                RADIUS - 15,
              )}
              fill="none"
              stroke={palette.coolBlue}
              strokeWidth={1}
              opacity={echoOpacity * 0.15 * resolveBreath}
              strokeLinecap="round"
            />
          )}

          {/* Outer echo arc */}
          {echoOpacity > 0 && (
            <path
              d={arcPath(
                frame >= p3End ? finalStartAngle - 1 : ARC_START_ANGLE - 1,
                frame >= p3End ? finalEndAngle + 1 : Math.min(currentEndAngle + 1, ARC_END_ANGLE + 1),
                RADIUS + 15,
              )}
              fill="none"
              stroke={palette.warmGold}
              strokeWidth={0.8}
              opacity={echoOpacity * 0.12 * resolveBreath}
              strokeLinecap="round"
            />
          )}

          {/* === GAP GLOW — warm particles near the opening === */}
          {frame >= p1End && (() => {
            const gapGlowOpacity = interpolate(
              frame,
              [p1End, p1End + 30],
              [0, 1],
              clamp,
            );
            // Particles drifting toward the gap
            return [0, 1, 2, 3].map((i) => {
              const angle = GAP_CENTER_ANGLE + (i - 1.5) * 8;
              const dist = RADIUS + 30 + Math.sin(frame * 0.04 + i * 2) * 15;
              const pt = circlePoint(angle, dist);
              const particleOpacity = interpolate(
                Math.sin(frame * 0.05 + i * 1.7),
                [-1, 1],
                [0.1, 0.5],
              );

              return (
                <circle
                  key={`gap-${i}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={2}
                  fill={palette.warmGold}
                  opacity={gapGlowOpacity * particleOpacity * resolveBreath}
                />
              );
            });
          })()}

          {/* === SCATTERED DOTS (Phase 2+) === */}
          {SCATTERED.map((dot, i) => {
            const stagger = p1End + 1 + (i * 0.8) % 12;
            const dotAppear = interpolate(frame, [stagger, stagger + 8], [0, 1], clamp);

            const breath = interpolate(
              Math.sin(frame * 0.025 + i * 2.3),
              [-1, 1],
              [0.08, 0.22],
            );

            // During phase 4, some dots migrate toward the gap and fade
            const migrateProgress = i < 8
              ? interpolate(
                  frame,
                  [p3End + i * 8, p4End + i * 5],
                  [0, 1],
                  clamp,
                )
              : 0;

            const dotX = interpolate(migrateProgress, [0, 1], [dot.x, gapPoint.x]);
            const dotY = interpolate(migrateProgress, [0, 1], [dot.y, gapPoint.y]);
            const dotOpacity = dotAppear * breath * (1 - migrateProgress * 0.8);

            return (
              <circle
                key={`dot-${i}`}
                cx={dotX}
                cy={dotY}
                r={dot.r}
                fill={palette.coolBlue}
                opacity={dotOpacity}
              />
            );
          })}

          {/* === FILAMENTS (Phase 3+) === */}
          {frame >= p2End && SCATTERED.slice(0, 12).map((dot, i) => {
            const filamentProgress = interpolate(
              frame,
              [p2End + i * 5, p2End + i * 5 + 40],
              [0, 1],
              clamp,
            );

            if (filamentProgress <= 0) return null;

            const endX = interpolate(filamentProgress, [0, 1], [dot.x, gapPoint.x]);
            const endY = interpolate(filamentProgress, [0, 1], [dot.y, gapPoint.y]);

            // Curved path
            const midX = (dot.x + gapPoint.x) / 2 + (i % 2 === 0 ? 20 : -20);
            const midY = (dot.y + gapPoint.y) / 2 + (i % 3 === 0 ? 15 : -15);
            const cpX = interpolate(filamentProgress, [0, 1], [dot.x, midX]);
            const cpY = interpolate(filamentProgress, [0, 1], [dot.y, midY]);

            const strength = interpolate(
              frame,
              [p2End, p3End],
              [0.04, 0.1],
              clamp,
            );

            return (
              <path
                key={`fil-${i}`}
                d={`M${dot.x},${dot.y} Q${cpX},${cpY} ${endX},${endY}`}
                stroke={palette.coolBlue}
                strokeWidth={0.5}
                fill="none"
                opacity={strength}
                strokeDasharray="4,6"
                strokeDashoffset={interpolate(frame, [0, 420], [0, -200])}
              />
            );
          })}

          {/* === FLOW PARTICLES along filaments (Phase 3+) === */}
          {frame >= p2End + 20 && SCATTERED.slice(0, 10).map((dot, i) => {
            const cycleLen = 70 + i * 7;
            const t = ((frame - p2End - 20 + i * 11) % cycleLen) / cycleLen;

            const midX = (dot.x + gapPoint.x) / 2 + (i % 2 === 0 ? 20 : -20);
            const midY = (dot.y + gapPoint.y) / 2 + (i % 3 === 0 ? 15 : -15);

            const px = (1 - t) * (1 - t) * dot.x + 2 * (1 - t) * t * midX + t * t * gapPoint.x;
            const py = (1 - t) * (1 - t) * dot.y + 2 * (1 - t) * t * midY + t * t * gapPoint.y;

            const pOpacity = interpolate(t, [0, 0.1, 0.85, 1], [0, 0.35, 0.35, 0], clamp);
            const phaseIn = interpolate(frame, [p2End + 20, p2End + 50], [0, 1], clamp);

            return (
              <circle
                key={`flow-${i}`}
                cx={px}
                cy={py}
                r={1.3}
                fill={palette.warmGold}
                opacity={pOpacity * phaseIn * resolveBreath}
              />
            );
          })}

          {/* === THE NAPKIN (Phase 5) === */}
          {napkinOpacity > 0 && (
            <g transform={`translate(${CX}, ${CY + 40}) rotate(-8)`}>
              <rect
                x={-35}
                y={-25}
                width={70}
                height={50}
                rx={2}
                fill="url(#napkinGlow)"
                stroke={palette.warmGold}
                strokeWidth={0.5}
                opacity={napkinOpacity}
              />
              {/* Handwritten lines on napkin */}
              <line
                x1={-20} y1={-8} x2={22} y2={-8}
                stroke={palette.warmGold}
                strokeWidth={0.8}
                opacity={napkinOpacity * 0.6}
              />
              <line
                x1={-18} y1={0} x2={15} y2={0}
                stroke={palette.warmGold}
                strokeWidth={0.6}
                opacity={napkinOpacity * 0.4}
              />
            </g>
          )}

          {/* === AMBIENT PARTICLES === */}
          {[
            { x: 80, y: 350, speed: 0.015, phase: 0 },
            { x: 730, y: 360, speed: 0.018, phase: 1.5 },
            { x: 200, y: 80, speed: 0.012, phase: 3 },
            { x: 600, y: 340, speed: 0.016, phase: 4.5 },
          ].map((p, i) => {
            const yOff = Math.sin(frame * p.speed + p.phase) * 8;
            const opacity = interpolate(
              Math.sin(frame * 0.02 + p.phase),
              [-1, 1],
              [0.05, 0.2],
            );
            return (
              <circle
                key={`amb-${i}`}
                cx={p.x}
                cy={p.y + yOff}
                r={1.2}
                fill={i % 2 === 0 ? palette.coolBlue : palette.warmGold}
                opacity={opacity}
              />
            );
          })}
        </svg>
      </AbsoluteFill>

      <CornerAccents />
    </AbsoluteFill>
  );
};
