import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface LessonPrimerCardProps {
  baselineBullets: string[];
  personalizedBullets: string[];
  personalizedLoading: boolean;
  personalizedUnavailable: boolean;
  defaultExpanded?: boolean;
}

function BulletList({
  items,
  bulletColor,
  textColor,
}: {
  items: string[];
  bulletColor: string;
  textColor: string;
}) {
  return (
    <View style={styles.bulletList}>
      {items.map((item, index) => (
        <View style={styles.bulletRow} key={`${item}-${index}`}>
          <View style={[styles.bulletDot, { backgroundColor: bulletColor }]} />
          <ThemedText style={[styles.bulletText, { color: textColor }]}>
            {item}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

export default function LessonPrimerCard({
  baselineBullets,
  personalizedBullets,
  personalizedLoading,
  personalizedUnavailable,
  defaultExpanded = true,
}: LessonPrimerCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [expanded, setExpanded] = useState(defaultExpanded);

  useEffect(() => {
    setExpanded(defaultExpanded);
  }, [defaultExpanded]);

  const shouldShowFallback = useMemo(() => {
    if (personalizedLoading) return false;
    if (personalizedBullets.length > 0) return false;
    return personalizedUnavailable;
  }, [personalizedBullets.length, personalizedLoading, personalizedUnavailable]);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.panel,
          borderColor: colors.border,
          borderLeftColor: colors.primary,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded((value) => !value)}
        activeOpacity={0.85}
      >
        <View style={styles.headerLabel}>
          <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
          <ThemedText style={[styles.headerText, { color: colors.primary }]}>
            LESSON PRIMER
          </ThemedText>
        </View>

        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {expanded ? (
        <View style={styles.body}>
          <BulletList
            items={baselineBullets}
            bulletColor={colors.primary}
            textColor={colors.text}
          />

          <View style={styles.personalizedSection}>
            <View style={styles.subHeader}>
              <Ionicons name="person-outline" size={15} color={colors.primary} />
              <ThemedText style={[styles.subHeaderText, { color: colors.primary }]}>
                PERSONALIZED FOR YOU
              </ThemedText>
            </View>

            {personalizedLoading && personalizedBullets.length === 0 ? (
              <ThemedText style={[styles.stateText, { color: colors.textSecondary }]}>
                Preparing personalized primers...
              </ThemedText>
            ) : null}

            {personalizedBullets.length > 0 ? (
              <BulletList
                items={personalizedBullets}
                bulletColor={colors.primary}
                textColor={colors.text}
              />
            ) : null}

            {shouldShowFallback ? (
              <ThemedText style={[styles.stateText, { color: colors.textSecondary }]}>
                No recommended personalized primers for this lesson.
              </ThemedText>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderLeftWidth: 3,
    borderRadius: 12,
    padding: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerText: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  body: {
    marginTop: 12,
    gap: 16,
  },
  personalizedSection: {
    gap: 10,
  },
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  subHeaderText: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  bulletList: {
    gap: 10,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 9,
    flexShrink: 0,
  },
  bulletText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  stateText: {
    fontSize: 15,
    lineHeight: 22,
  },
});
