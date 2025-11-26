import React from "react";
import { StyleSheet, TouchableOpacity, View, ViewStyle } from "react-native";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { HikmahTree } from "@/utils/api";
import { useHikmahProgress } from "@/hooks/useHikmahProgress";

interface TreeCardProps {
  tree: HikmahTree;
  style?: ViewStyle;
}

export default function TreeCard({ tree, style }: TreeCardProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { total, percent } = useHikmahProgress(tree);

  const handlePress = () => {
    router.push(`/hikmah/${tree.id}`);
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.panel, borderColor: colors.border },
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <View style={styles.content}>
        {/* Title & Summary */}
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.title}>
            {tree.title}
          </ThemedText>
          {tree.summary ? (
            <ThemedText
              style={[styles.summary, { color: colors.textSecondary }]}
              numberOfLines={3}
            >
              {tree.summary}
            </ThemedText>
          ) : null}
        </View>

        {/* Tags & Count */}
        <View style={styles.metaRow}>
          <View style={styles.tags}>
            {(tree.tags || []).slice(0, 2).map((tag) => (
              <View
                key={tag}
                style={[styles.tag, { borderColor: colors.border, backgroundColor: colors.background }]}
              >
                <ThemedText style={[styles.tagText, { color: colors.textSecondary }]}>
                  {tag}
                </ThemedText>
              </View>
            ))}
          </View>
          <ThemedText style={[styles.count, { color: colors.textSecondary }]}>
            {total} {total === 1 ? "lesson" : "lessons"}
          </ThemedText>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.viewBtn,
              { borderColor: colors.border },
            ]}
            onPress={handlePress}
          >
            <ThemedText style={{ color: colors.textSecondary }}>View Tree</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressContainer, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressBar,
            { width: `${percent}%`, backgroundColor: colors.primary },
          ]}
        />
      </View>
      {percent > 0 && (
        <ThemedText
          style={[styles.percentText, { color: colors.textSecondary }]}
        >
          {percent}%
        </ThemedText>
      )}
    </TouchableOpacity>
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
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    marginBottom: 8,
    fontSize: 20,
  },
  summary: {
    fontSize: 14,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  tags: {
    flexDirection: "row",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 10,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  count: {
    fontSize: 12,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  continueBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  continueBtnText: {
    color: "#000",
    fontWeight: "600",
    fontSize: 14,
  },
  viewBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  progressContainer: {
    height: 4,
    width: "100%",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  progressBar: {
    height: "100%",
  },
  percentText: {
    position: "absolute",
    bottom: 8,
    left: 20,
    fontSize: 10,
    fontWeight: "600",
    opacity: 0.7,
  },
});
