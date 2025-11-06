/**
 * Chat input component
 * Text input with send button and auto-growing functionality
 */

import React, { useState } from "react";
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
import { UI_CONSTANTS, PLACEHOLDERS } from "@/utils/constants";

interface ChatInputProps {
  value: string;
  onChange: (text: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  placeholder?: string;
}

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  placeholder = PLACEHOLDERS.CHAT,
}: ChatInputProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [inputHeight, setInputHeight] = useState<number>(
    UI_CONSTANTS.MIN_INPUT_HEIGHT
  );

  const handleSubmit = () => {
    if (!isLoading && value.trim()) {
      onSubmit();
    }
  };

  const handleContentSizeChange = (event: any) => {
    const newHeight = Math.min(
      Math.max(
        UI_CONSTANTS.MIN_INPUT_HEIGHT,
        event.nativeEvent.contentSize.height
      ),
      UI_CONSTANTS.MAX_INPUT_HEIGHT
    );
    setInputHeight(newHeight);
  };

  const isDisabled = isLoading || !value.trim();

  return (
    <BlurView
      intensity={70}
      tint={colorScheme === "dark" ? "dark" : "light"}
      style={styles.container}
    >
      <TextInput
        style={[
          styles.input,
          {
            color: colors.text,
            height: inputHeight,
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        value={value}
        onChangeText={onChange}
        multiline
        onContentSizeChange={handleContentSizeChange}
        editable={!isLoading}
        returnKeyType="default"
        blurOnSubmit={false}
      />
      <TouchableOpacity
        style={[
          styles.sendButton,
          {
            backgroundColor: isDisabled ? colors.panel2 : colors.primary,
          },
        ]}
        onPress={handleSubmit}
        disabled={isDisabled}
        activeOpacity={0.7}
      >
        <Ionicons
          name="arrow-up"
          size={20}
          color={isDisabled ? colors.muted : "#fff"}
        />
      </TouchableOpacity>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    margin: 8,
    marginBottom: Platform.OS === "ios" ? 8 : 12,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -1 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingTop: Platform.OS === "ios" ? 8 : 6,
    paddingBottom: Platform.OS === "ios" ? 8 : 6,
    paddingHorizontal: 4,
    maxHeight: UI_CONSTANTS.MAX_INPUT_HEIGHT,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    marginBottom: 2,
  },
});
