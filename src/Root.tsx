import { Composition } from "remotion";
import { CodeRabbitIntro } from "./CodeRabbitIntro";
import { ImpactSlicerViz } from "./ImpactSlicerViz";

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
    </>
  );
};
