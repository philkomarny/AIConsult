import { Composition, Folder } from "remotion";
import { FutureIsNow } from "./compositions/FutureIsNow";
import { TheUnfinished } from "./compositions/TheUnfinished";
import { IkigaiPoop } from "./compositions/IkigaiPoop";
import { BoneDry } from "./compositions/BoneDry";
import { CultureEatsProcess } from "./compositions/CultureEatsProcess";
import { GutenbergToGpt } from "./compositions/GutenbergToGpt";
import { ScalingYourTalents } from "./compositions/ScalingYourTalents";
import { The911Doctrine } from "./compositions/The911Doctrine";
import { TheAmplifier } from "./compositions/TheAmplifier";
import { TheHiddenLanguage } from "./compositions/TheHiddenLanguage";
import { TheNod } from "./compositions/TheNod";
import { TheThreeLaws } from "./compositions/TheThreeLaws";
import { WhyWereHere } from "./compositions/WhyWereHere";
import { WordProcessorMoment } from "./compositions/WordProcessorMoment";

const YTP_PROPS = {
  durationInFrames: 900,
  fps: 30,
  width: 800,
  height: 400,
  defaultProps: {},
} as const;

const ORIG_PROPS = {
  durationInFrames: 420,
  fps: 30,
  width: 800,
  height: 400,
  defaultProps: {},
} as const;

export const RemotionRoot = () => {
  return (
    <Folder name="Explainers">
      <Composition id="FutureIsNow" component={FutureIsNow} {...ORIG_PROPS} />
      <Composition id="TheUnfinished" component={TheUnfinished} {...ORIG_PROPS} />
      <Composition id="IkigaiPoop" component={IkigaiPoop} {...YTP_PROPS} />
      <Composition id="BoneDry" component={BoneDry} {...YTP_PROPS} />
      <Composition id="CultureEatsProcess" component={CultureEatsProcess} {...YTP_PROPS} />
      <Composition id="GutenbergToGpt" component={GutenbergToGpt} {...YTP_PROPS} />
      <Composition id="ScalingYourTalents" component={ScalingYourTalents} {...YTP_PROPS} />
      <Composition id="The911Doctrine" component={The911Doctrine} {...YTP_PROPS} />
      <Composition id="TheAmplifier" component={TheAmplifier} {...YTP_PROPS} />
      <Composition id="TheHiddenLanguage" component={TheHiddenLanguage} {...YTP_PROPS} />
      <Composition id="TheNod" component={TheNod} {...YTP_PROPS} />
      <Composition id="TheThreeLaws" component={TheThreeLaws} {...YTP_PROPS} />
      <Composition id="WhyWereHere" component={WhyWereHere} {...YTP_PROPS} />
      <Composition id="WordProcessorMoment" component={WordProcessorMoment} {...YTP_PROPS} />
    </Folder>
  );
};
