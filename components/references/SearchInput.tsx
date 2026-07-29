/**
 * Search input component for references
 * Bottom search bar with BlurView effect and auto-growing (up to 4 lines)
 * ChatGPT-style input field
 */

import React, { useEffect, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  type TextStyle,
} from "react-native";
import PlatformBlurView from "@/components/ui/PlatformBlurView";
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
  focusRequest?: number;
}

// Height constants
const MIN_INPUT_HEIGHT = 40;
const MAX_INPUT_HEIGHT = 120; // Roughly 4 lines
const webInputFocusReset = Platform.select({
  web: {
    outlineStyle: "none",
    outlineWidth: 0,
    boxShadow: "none",
  } as unknown as TextStyle,
});

export default function SearchInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  placeholder = PLACEHOLDERS.REFERENCES,
  focusRequest = 0,
}: SearchInputProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const inputRef = useRef<TextInput>(null);

  const handleSubmit = () => {
    if (!isLoading && value.trim()) {
      onSubmit();
    }
  };

  const handleKeyPress = (event: any) => {
    if (Platform.OS !== "web") return;

    const key = event?.key ?? event?.nativeEvent?.key;
    if (key !== "Enter" || event?.shiftKey) return;

    event.preventDefault?.();
    handleSubmit();
  };

  const isDisabled = isLoading || !value.trim();

  useEffect(() => {
    if (Platform.OS !== "web" || focusRequest <= 0) return;

    inputRef.current?.focus();
  }, [focusRequest]);

  return (
    <View style={styles.container}>
      <PlatformBlurView
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
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            webInputFocusReset,
            {
              color: colors.text,
            },
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          value={value}
          onChangeText={onChange}
          multiline
          editable={!isLoading}
          returnKeyType={Platform.OS === "web" ? "search" : "default"}
          enterKeyHint={Platform.OS === "web" ? "search" : undefined}
          blurOnSubmit={false}
          onKeyPress={handleKeyPress}
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
            name="search"
            size={18}
            color={isDisabled ? colors.muted : "#fff"}
          />
        </TouchableOpacity>
      </PlatformBlurView>
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
    alignItems: "center",
    paddingLeft: 16,
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
