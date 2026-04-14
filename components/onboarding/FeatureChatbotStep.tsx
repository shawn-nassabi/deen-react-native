import React from "react";
import FeatureStepLayout from "./FeatureStepLayout";

interface Props {
  accentColor: string;
  textColor: string;
  mutedColor: string;
  panelColor: string;
  borderColor: string;
}

export default function FeatureChatbotStep(props: Props) {
  return (
    <FeatureStepLayout
      title="Ask Deen anything"
      subtitle="Your AI tutor answers questions on fiqh, hadith, and Quranic tafsir — citing the exact sources it used."
      images={[
        require("@/assets/images/ss_and_icon/deen_chatbot_into.png"),
        require("@/assets/images/ss_and_icon/chatbot_qna.png"),
      ]}
      bullets={[
        "Ask follow-up questions naturally — Deen remembers your conversation.",
        "Every answer links to the hadith, ruling, or tafsir it's based on.",
        "The chatbot supports English, Arabic, Farsi, and more.",
      ]}
      {...props}
    />
  );
}
