import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { palette } from "./MountainPalette";

const STAR_DATA = [
  { cx: 55, cy: 28, r: 1.0 },
  { cx: 170, cy: 50, r: 0.7 },
  { cx: 310, cy: 22, r: 1.2 },
  { cx: 490, cy: 38, r: 0.8 },
  { cx: 630, cy: 15, r: 1.1 },
  { cx: 745, cy: 45, r: 0.9 },
  { cx: 125, cy: 65, r: 0.6 },
  { cx: 560, cy: 58, r: 0.7 },
  { cx: 700, cy: 70, r: 1.0 },
];

export const Stars: React.FC = () => {
  const frame = useCurrentFrame();
  const globalOpacity = interpolate(frame, [0, 30], [0, 0.5], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <svg width={800} height={400} viewBox="0 0 800 400">
        <g fill={palette.white} opacity={globalOpacity}>
          {STAR_DATA.map((star, i) => {
            const twinkle = interpolate(
              Math.sin(frame * 0.05 + i * 1.7),
              [-1, 1],
              [0.3, 1]
            );
            return (
              <circle
                key={i}
                cx={star.cx}
                cy={star.cy}
                r={star.r}
                opacity={twinkle}
              />
            );
          })}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
