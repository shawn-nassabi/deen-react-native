/**
 * Search input component for references
 * Bottom search bar with BlurView effect and auto-growing (up to 4 lines)
 * ChatGPT-style input field
 */

import React, { useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { PLACEHOLDERS } from "@/utils/constants";

interface SearchInputProps {
  value: string;
  onChange: (text: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  placeholder?: string;
}

// Height constants
const MIN_INPUT_HEIGHT = 40;
const MAX_INPUT_HEIGHT = 120; // Roughly 4 lines

export default function SearchInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  placeholder = PLACEHOLDERS.REFERENCES,
}: SearchInputProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const inputRef = useRef<TextInput>(null);

  const handleSubmit = () => {
    if (!isLoading && value.trim()) {
      onSubmit();
    }
  };

  const isDisabled = isLoading || !value.trim();

  return (
    <View style={styles.container}>
      <BlurView
        intensity={80}
        tint={colorScheme === "dark" ? "dark" : "light"}
        style={[
          styles.blurContainer,
          {
            borderColor:
              colorScheme === "dark"
                ? "rgba(255, 255, 255, 0.15)"
                : "rgba(0, 0, 0, 0.1)",
            backgroundColor:
              colorScheme === "dark"
                ? "rgba(30, 30, 30, 0.8)"
                : "rgba(255, 255, 255, 0.8)",
          },
        ]}
      >
        <View style={styles.searchIconContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
        </View>
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            {
              color: colors.text,
            },
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          value={value}
          onChangeText={onChange}
          multiline
          onSubmitEditing={handleSubmit}
          editable={!isLoading}
          returnKeyType="search"
          blurOnSubmit={false}
          textAlignVertical="center"
        />
        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: isDisabled ? colors.panel2 : colors.primary,
            },
          ]}
          onPress={handleSubmit}
          disabled={isDisabled}
          activeOpacity={0.8}
        >
          <Ionicons
            name="arrow-up"
            size={20}
            color={isDisabled ? colors.muted : "#fff"}
          />
        </TouchableOpacity>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 10,
  },
  blurContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 8,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  searchIconContainer: {
    marginRight: 8,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    minHeight: MIN_INPUT_HEIGHT,
    maxHeight: MAX_INPUT_HEIGHT,
    paddingTop: Platform.OS === "ios" ? 9 : 9,
    paddingBottom: Platform.OS === "ios" ? 9 : 9,
    paddingHorizontal: 0,
  },
  submitButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
});
