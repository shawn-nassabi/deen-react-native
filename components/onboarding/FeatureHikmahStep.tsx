import React from "react";
import FeatureStepLayout from "./FeatureStepLayout";

interface Props {
  accentColor: string;
  textColor: string;
  mutedColor: string;
  panelColor: string;
  borderColor: string;
}

export default function FeatureHikmahStep(props: Props) {
  return (
    <FeatureStepLayout
      title="Hikmah learning trees"
      subtitle="Structured lesson paths take you from foundational beliefs to advanced fiqh, one step at a time."
      images={[
        require("@/assets/images/ss_and_icon/hikmah_tree_view.png"),
        require("@/assets/images/ss_and_icon/hikmah_tree_lessons.png"),
      ]}
      bullets={[
        "Visual tree maps show your progress through interconnected topics.",
        "Lessons include rich text, references, and knowledge checks.",
        "Your place is saved — pick up exactly where you left off.",
      ]}
      {...props}
    />
  );
}
