/**
 * Search input component for references
 * Bottom-fixed search bar with BlurView effect
 */

import React from "react";
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

export default function SearchInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  placeholder = PLACEHOLDERS.REFERENCES,
}: SearchInputProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const handleSubmit = () => {
    if (!isLoading && value.trim()) {
      onSubmit();
    }
  };

  const isDisabled = isLoading || !value.trim();

  return (
    <BlurView
      intensity={20}
      tint={colorScheme === "dark" ? "dark" : "light"}
      style={styles.blurContainer}
    >
      <View style={styles.searchIcon}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
      </View>
      <TextInput
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
        onSubmitEditing={handleSubmit}
        editable={!isLoading}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
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
        activeOpacity={0.2}
      >
        <Ionicons
          name="arrow-forward"
          size={20}
          color={isDisabled ? colors.muted : "#fff"}
        />
      </TouchableOpacity>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 28,
    marginHorizontal: 16,
    marginBottom: Platform.OS === "ios" ? 12 : 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  submitButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
});

