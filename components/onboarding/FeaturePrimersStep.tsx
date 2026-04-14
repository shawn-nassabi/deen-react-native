import React from "react";
import FeatureStepLayout from "./FeatureStepLayout";

interface Props {
  accentColor: string;
  textColor: string;
  mutedColor: string;
  panelColor: string;
  borderColor: string;
}

export default function FeaturePrimersStep(props: Props) {
  return (
    <FeatureStepLayout
      title="Personalized for you"
      subtitle="Every lesson opens with a primer written just for you — connecting new material to what you already know."
      images={[
        require("@/assets/images/ss_and_icon/personalized_primers_in_lesson.png"),
        require("@/assets/images/ss_and_icon/lesson_quiz_view.png"),
      ]}
      bullets={[
        "AI-generated introductions link each lesson to your prior conversations and knowledge gaps.",
        "Knowledge checks at the end of lessons reinforce what you've learned.",
        "The more you use Deen, the more tailored your experience becomes.",
      ]}
      {...props}
    />
  );
}
