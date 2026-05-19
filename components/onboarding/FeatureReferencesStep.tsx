import React from "react";
import FeatureStepLayout from "./FeatureStepLayout";

interface Props {
  accentColor: string;
  textColor: string;
  mutedColor: string;
  panelColor: string;
  borderColor: string;
}

export default function FeatureReferencesStep(props: Props) {
  return (
    <FeatureStepLayout
      title="Islamic reference lookup"
      subtitle="Search hadith, Quranic tafsir, and Ayatollah Sistani's rulings directly — no question required."
      images={[
        require("@/assets/images/ss_and_icon/reference_lookup_search.png"),
        require("@/assets/images/ss_and_icon/reference_lookup_scroll.png"),
      ]}
      bullets={[
        "Semantic search — finds relevant passages even if you don't know the exact wording.",
        "Browse results from multiple sources side by side.",
        "Copy and share reference cards with a single tap.",
      ]}
      {...props}
    />
  );
}
