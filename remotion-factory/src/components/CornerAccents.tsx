import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { palette } from "./MountainPalette";

export const CornerAccents: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 60], [0, 0.12], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <svg width={800} height={400} viewBox="0 0 800 400">
        <g stroke={palette.coolBlue} strokeWidth={1} fill="none" opacity={opacity}>
          <path d="M25,25 L25,55 M25,25 L55,25" />
          <path d="M775,25 L775,55 M775,25 L745,25" />
          <path d="M25,375 L25,345 M25,375 L55,375" />
          <path d="M775,375 L775,345 M775,375 L745,375" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
