import React, { useEffect, useState, useMemo } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getHikmahTree, getLessonsByTreeId, HikmahTree, Lesson } from "@/utils/api";
import { useHikmahProgress } from "@/hooks/useHikmahProgress";

export default function TreeDetailScreen() {
  const { treeId } = useLocalSearchParams<{ treeId: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [tree, setTree] = useState<HikmahTree | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    if (!treeId) return;

    Promise.all([
      getHikmahTree(treeId),
      getLessonsByTreeId(Number(treeId), {
        order_by: "order_position",
        limit: 200,
      }),
    ])
      .then(([t, ls]) => {
        if (!mounted) return;
        setTree(t);
        setLessons(Array.isArray(ls) ? ls : []);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error("Failed to load tree details:", err);
        setError(err?.message || "Failed to load tree details.");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [treeId]);

  const sortedLessons = useMemo(() => {
    return lessons
      .slice()
      .sort((a, b) => a.order_position - b.order_position)
      .map((l) => ({
        id: String(l.id),
        title: l.title,
        estMinutes: l.estimated_minutes,
      }));
  }, [lessons]);

  // Pass tree with lessons attached for progress computation
  const treeWithLessons = useMemo(() => {
    if (!tree) return null;
    return {
      ...tree,
      lessons: sortedLessons.map((l) => ({ id: l.id, title: l.title })),
    };
  }, [tree, sortedLessons]);

  const { percent, isCompleted, completedCount, total } =
    useHikmahProgress(treeWithLessons);

  if (loading || !tree) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Custom Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.panel }]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText type="subtitle" numberOfLines={1} style={styles.headerTitle}>
          {tree.title}
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Hero / Summary Card */}
        <View
          style={[
            styles.heroCard,
            { backgroundColor: colors.panel, borderColor: colors.border },
          ]}
        >
          <ThemedText type="title" style={styles.treeTitle}>
            {tree.title}
          </ThemedText>

          {tree.summary && (
            <View style={styles.summaryContainer}>
              <ThemedText
                style={[
                  styles.summaryText,
                  { color: colors.textSecondary },
                ]}
                numberOfLines={isSummaryExpanded ? undefined : 3}
              >
                {tree.summary}
              </ThemedText>
              <TouchableOpacity
                onPress={() => setIsSummaryExpanded(!isSummaryExpanded)}
                style={styles.readMoreBtn}
              >
                <ThemedText style={{ color: colors.primary, fontSize: 12 }}>
                  {isSummaryExpanded ? "Read less" : "Read more"}
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* Meta Info */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="document-text-outline" size={16} color={colors.primary} />
              <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>
                {total} lessons
              </ThemedText>
            </View>
            {completedCount > 0 && (
              <View style={styles.metaItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.primary}
                />
                <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>
                  {completedCount} completed
                </ThemedText>
              </View>
            )}
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
          <ThemedText
            style={[styles.percentText, { color: colors.textSecondary }]}
          >
            {percent}% Complete
          </ThemedText>
        </View>

        {/* Lessons List */}
        <View style={styles.lessonsList}>
          {sortedLessons.length === 0 ? (
             <View style={[styles.emptyCard, { borderColor: colors.border }]}>
               <ThemedText style={{ color: colors.textSecondary }}>
                 Lessons coming soon...
               </ThemedText>
             </View>
          ) : (
            sortedLessons.map((lesson, idx) => {
              const done = isCompleted(lesson.id);
              return (
                <TouchableOpacity
                  key={lesson.id}
                  style={[
                    styles.lessonItem,
                    {
                      backgroundColor: done ? colors.panel + "80" : colors.panel, // slightly transparent if done
                      borderColor: done ? colors.primary + "50" : colors.border,
                      borderWidth: 1,
                    },
                  ]}
                  onPress={() => router.push(`/hikmah/lesson/${lesson.id}?treeId=${tree.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.lessonLeft}>
                    <View
                      style={[
                        styles.indexBadge,
                        {
                          borderColor: done ? colors.primary : colors.border,
                          backgroundColor: done ? colors.primary + "20" : "transparent",
                        },
                      ]}
                    >
                      <ThemedText
                        style={{
                          color: done ? colors.primary : colors.textSecondary,
                          fontSize: 12,
                          fontWeight: "600",
                        }}
                      >
                        {idx + 1}
                      </ThemedText>
                    </View>
                    <View style={styles.lessonInfo}>
                      <ThemedText
                        type="defaultSemiBold"
                        style={styles.lessonTitle}
                      >
                        {lesson.title}
                      </ThemedText>
                      {lesson.estMinutes ? (
                        <ThemedText
                          style={{ color: colors.textSecondary, fontSize: 11 }}
                        >
                          {lesson.estMinutes} min read
                        </ThemedText>
                      ) : null}
                    </View>
                  </View>
                  
                  {done && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    marginBottom: 24,
    overflow: "hidden",
  },
  treeTitle: {
    marginBottom: 12,
    fontSize: 24,
  },
  summaryContainer: {
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 22,
  },
  readMoreBtn: {
    marginTop: 8,
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  progressContainer: {
    height: 6,
    borderRadius: 3,
    width: "100%",
    marginBottom: 8,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 3,
  },
  percentText: {
    fontSize: 11,
    fontWeight: "600",
  },
  lessonsList: {
    gap: 12,
  },
  lessonItem: {
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lessonLeft: {
    flexDirection: "row",
    gap: 12,
    flex: 1,
  },
  indexBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  lessonInfo: {
    flex: 1,
    justifyContent: "center",
  },
  lessonTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  emptyCard: {
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    borderStyle: 'dashed',
  }
});


