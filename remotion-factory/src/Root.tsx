import { Composition, Folder } from "remotion";
import { FutureIsNow } from "./compositions/FutureIsNow";

export const RemotionRoot = () => {
  return (
    <Folder name="Explainers">
      <Composition
        id="FutureIsNow"
        component={FutureIsNow}
        durationInFrames={420}
        fps={30}
        width={800}
        height={400}
        defaultProps={{}}
      />
    </Folder>
  );
};
