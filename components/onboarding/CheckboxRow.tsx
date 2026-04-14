/**
 * Reusable checkbox row for onboarding consent steps.
 * Supports embedded tappable link text via the `links` prop.
 */

import React from "react";
import { StyleSheet, TouchableOpacity, View, Text, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// ---- Types ----

interface LinkSpec {
  label: string;
  url: string;
}

interface CheckboxRowProps {
  checked: boolean;
  onToggle: () => void;
  /** Main label. Use {link:0}, {link:1} as placeholders for embedded links. */
  label: string;
  /** Substitution links for {link:N} placeholders in label. */
  links?: LinkSpec[];
  /** Text color (pass colors.text from theme). */
  color: string;
  /** Accent color for checkbox and links. */
  accentColor: string;
}

// ---- Component ----

export default function CheckboxRow({
  checked,
  onToggle,
  label,
  links = [],
  color,
  accentColor,
}: CheckboxRowProps) {
  // Parse label into segments: plain text and link references
  const segments = parseLabel(label, links);

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onToggle}
      activeOpacity={0.7}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
    >
      <View style={styles.checkboxArea}>
        <Ionicons
          name={checked ? "checkbox" : "square-outline"}
          size={24}
          color={checked ? accentColor : color}
        />
      </View>
      <View style={styles.labelArea}>
        <Text style={[styles.label, { color }]}>
          {segments.map((seg, i) =>
            seg.type === "text" ? (
              <Text key={i}>{seg.value}</Text>
            ) : (
              <Text
                key={i}
                style={[styles.link, { color: accentColor }]}
                onPress={() => Linking.openURL(seg.url)}
                suppressHighlighting
              >
                {seg.value}
              </Text>
            )
          )}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ---- Helpers ----

type Segment =
  | { type: "text"; value: string }
  | { type: "link"; value: string; url: string };

function parseLabel(label: string, links: LinkSpec[]): Segment[] {
  const parts = label.split(/(\{link:\d+\})/);
  return parts.map((part) => {
    const match = part.match(/^\{link:(\d+)\}$/);
    if (match) {
      const idx = parseInt(match[1], 10);
      const link = links[idx];
      if (link) return { type: "link" as const, value: link.label, url: link.url };
    }
    return { type: "text" as const, value: part };
  });
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 4,
  },
  checkboxArea: {
    marginTop: 1,
  },
  labelArea: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: "Montserrat_400Regular",
  },
  link: {
    fontFamily: "Montserrat_500Medium",
    textDecorationLine: "underline",
  },
});
