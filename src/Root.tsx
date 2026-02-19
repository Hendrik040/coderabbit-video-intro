import { Composition } from "remotion";
import { CodeRabbitIntro } from "./CodeRabbitIntro";
import { ImpactSlicerViz } from "./ImpactSlicerViz";
import { ASTWalkViz } from "./ASTWalkViz";
import { ReviewSystemsCompare } from "./ReviewSystemsCompare";
import { CustomerQuote } from "./CustomerQuote";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="CodeRabbitIntro"
        component={CodeRabbitIntro}
        durationInFrames={360}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ImpactSlicerViz"
        component={ImpactSlicerViz}
        durationInFrames={3240}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ASTWalkViz"
        component={ASTWalkViz}
        durationInFrames={540}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ReviewSystemsCompare"
        component={ReviewSystemsCompare}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="CustomerQuote"
        component={CustomerQuote}
        durationInFrames={510}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
