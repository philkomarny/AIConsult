import React from "react";
import { AbsoluteFill } from "remotion";
import { palette } from "./MountainPalette";

export const Background: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${palette.bgDark} 0%, ${palette.bgMid} 50%, ${palette.bgLight} 100%)`,
      }}
    />
  );
};
