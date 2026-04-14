import React from "react";
import FeatureStepLayout from "./FeatureStepLayout";

interface Props {
  accentColor: string;
  textColor: string;
  mutedColor: string;
  panelColor: string;
  borderColor: string;
}

export default function FeatureAskDeenStep(props: Props) {
  return (
    <FeatureStepLayout
      title="Ask Deen to elaborate"
      subtitle="While reading a lesson, tap 'Ask Deen' to get a deeper explanation of any concept — in context."
      images={[
        require("@/assets/images/ss_and_icon/lesson_ask_deen_button_usage.png"),
        require("@/assets/images/ss_and_icon/ask_deen_elaboration_view.png"),
      ]}
      bullets={[
        "Highlight any passage and ask the AI to explain it further.",
        "Responses are aware of the lesson you're studying, so context is never lost.",
        "Perfect for terms you don't recognise or concepts that need unpacking.",
      ]}
      {...props}
    />
  );
}
