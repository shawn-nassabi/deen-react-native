/**
 * Reusable single-select or multi-select option list for onboarding personalization steps.
 * Each row is a bordered rounded card that highlights with the accent color when selected.
 */

import React from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";

// ---- Types ----

interface SelectableOptionListProps {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  /** Allow selecting multiple options. Default: false (single-select). */
  multi?: boolean;
  /** Maximum number of selections allowed (multi only). */
  max?: number;
  accentColor: string;
  textColor: string;
  mutedColor: string;
  panelColor: string;
  borderColor: string;
}

// ---- Component ----

export default function SelectableOptionList({
  options,
  selected,
  onChange,
  multi = false,
  max,
  accentColor,
  textColor,
  mutedColor,
  panelColor,
  borderColor,
}: SelectableOptionListProps) {
  const handlePress = (option: string) => {
    if (!multi) {
      // Single-select: replace selection
      onChange([option]);
      return;
    }

    const isSelected = selected.includes(option);
    if (isSelected) {
      onChange(selected.filter((o) => o !== option));
    } else {
      // Enforce max for multi-select silently
      if (max !== undefined && selected.length >= max) return;
      onChange([...selected, option]);
    }
  };

  return (
    <View style={styles.list}>
      {options.map((option) => {
        const isSelected = selected.includes(option);
        const isMaxed =
          multi && max !== undefined && selected.length >= max && !isSelected;

        return (
          <TouchableOpacity
            key={option}
            style={[
              styles.row,
              {
                backgroundColor: isSelected
                  ? accentColor + "18"
                  : panelColor,
                borderColor: isSelected ? accentColor : borderColor,
              },
              isMaxed && styles.rowDisabled,
            ]}
            onPress={() => handlePress(option)}
            activeOpacity={isMaxed ? 1 : 0.7}
          >
            <ThemedText
              style={[
                styles.label,
                {
                  color: isSelected ? accentColor : isMaxed ? mutedColor : textColor,
                  fontFamily: isSelected
                    ? "Montserrat_600SemiBold"
                    : "Montserrat_400Regular",
                },
              ]}
            >
              {option}
            </ThemedText>

            {/* Icon: checkmark for multi, radio for single */}
            {isSelected ? (
              <Ionicons
                name={multi ? "checkmark-circle" : "radio-button-on"}
                size={20}
                color={accentColor}
              />
            ) : (
              <Ionicons
                name={multi ? "ellipse-outline" : "radio-button-off"}
                size={20}
                color={isMaxed ? mutedColor + "60" : mutedColor}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  rowDisabled: {
    opacity: 0.45,
  },
  label: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    marginRight: 10,
  },
});
