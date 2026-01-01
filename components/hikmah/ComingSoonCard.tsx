import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface ComingSoonCardProps {
  title: string;
  style?: ViewStyle;
}

export default function ComingSoonCard({ title, style }: ComingSoonCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.panel, borderColor: colors.border },
        style,
      ]}
    >
      <View style={styles.content}>
        {/* Title */}
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.title}>
            {title}
          </ThemedText>
        </View>

        {/* Coming Soon Button */}
        <View style={styles.actions}>
          <View
            style={[
              styles.comingSoonBtn,
              { borderColor: colors.border },
            ]}
          >
            <ThemedText style={{ color: colors.textSecondary }}>
              Coming Soon
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    opacity: 0.6,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    marginBottom: 8,
    fontSize: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  comingSoonBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
});

