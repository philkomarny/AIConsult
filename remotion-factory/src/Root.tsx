import { Composition, Folder } from "remotion";
import { FutureIsNow } from "./compositions/FutureIsNow";
import { TheUnfinished } from "./compositions/TheUnfinished";

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
      <Composition
        id="TheUnfinished"
        component={TheUnfinished}
        durationInFrames={420}
        fps={30}
        width={800}
        height={400}
        defaultProps={{}}
      />
    </Folder>
  );
};
