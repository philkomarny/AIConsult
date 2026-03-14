import React from "react";
import { AbsoluteFill } from "remotion";
import { palette } from "./MountainPalette";

export const GridOverlay: React.FC = () => {
  const dots: React.ReactNode[] = [];
  for (let x = 20; x < 800; x += 40) {
    for (let y = 20; y < 400; y += 40) {
      dots.push(
        <circle key={`${x}-${y}`} cx={x} cy={y} r={0.6} fill={palette.coolBlue} opacity={0.05} />
      );
    }
  }

  return (
    <AbsoluteFill>
      <svg width={800} height={400} viewBox="0 0 800 400">
        {dots}
      </svg>
    </AbsoluteFill>
  );
};
