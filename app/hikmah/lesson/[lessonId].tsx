import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  getLessonById,
  getHikmahTree,
  getLessonContent,
  getLessonsByTreeId,
  upsertUserProgress,
  listUserProgress,
  HikmahTree,
  Lesson,
  LessonContent,
} from "@/utils/api";
import { setLastRead } from "@/utils/hikmahStorage";
import ElaborationModal from "@/components/hikmah/ElaborationModal";
import { useHikmahProgress } from "@/hooks/useHikmahProgress";
import LessonContentWebView from "@/components/hikmah/LessonContentWebView";

const USER_ID = "snassabi7@gmail.com";

export default function LessonReaderScreen() {
  const { lessonId, treeId } = useLocalSearchParams<{
    lessonId: string;
    treeId: string;
  }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [tree, setTree] = useState<HikmahTree | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]); // Full list for navigation
  const [pages, setPages] = useState<LessonContent[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  // Selection State
  const [selection, setSelection] = useState<{ text: string; context: string }>(
    { text: "", context: "" }
  );

  // Prevent hydration from overwriting manual toggles
  const pageUpsertSkipRef = useRef(false);
  const skipCompletionSyncRef = useRef(false);

  // Load Data
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    if (!lessonId || !treeId) return;

    Promise.all([
      getLessonById(lessonId),
      getHikmahTree(treeId),
      getLessonsByTreeId(Number(treeId), { limit: 200 }),
      getLessonContent(Number(lessonId), { limit: 500 }),
    ])
      .then(([lsn, tr, ls, content]) => {
        if (!mounted) return;
        setLesson(lsn);
        setTree(tr);
        setLessons(Array.isArray(ls) ? ls : []);
        const sortedPages = Array.isArray(content)
          ? content.slice().sort((a, b) => a.order_position - b.order_position)
          : [];
        setPages(sortedPages);
        setCurrentPageIndex(0);

        setLastRead(treeId, lessonId);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error("Failed to load lesson content:", err);
        setError(err?.message || "Failed to load lesson content.");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [lessonId, treeId]);

  // Sort lessons for next/prev logic
  const sortedLessons = useMemo(() => {
    return lessons
      .slice()
      .sort((a, b) => a.order_position - b.order_position)
      .map((l) => ({ id: String(l.id), title: l.title }));
  }, [lessons]);

  const currentLessonIndex = useMemo(
    () => sortedLessons.findIndex((l) => l.id === String(lessonId)),
    [sortedLessons, lessonId]
  );

  const nextLesson =
    currentLessonIndex >= 0 && currentLessonIndex < sortedLessons.length - 1
      ? sortedLessons[currentLessonIndex + 1]
      : null;

  // Use progress hook for completion status
  const treeWithLessons = useMemo(() => {
    if (!tree) return null;
    return {
      ...tree,
      lessons: sortedLessons,
    };
  }, [tree, sortedLessons]);

  const {
    isCompleted,
    toggleComplete,
    isLoaded: progressLoaded,
  } = useHikmahProgress(treeWithLessons);
  const done = isCompleted(lessonId!);

  // Hydrate Progress (Last Position)
  useEffect(() => {
    if (!pages.length || !treeId || !lessonId || !progressLoaded) return;

    let mounted = true;
    listUserProgress({
      user_id: USER_ID,
      hikmah_tree_id: Number(treeId),
      lesson_id: Number(lessonId),
    })
      .then((arr) => {
        if (!mounted) return;
        if (Array.isArray(arr) && arr.length > 0) {
          const p = arr[0];
          const lp = Number(p?.last_position);
          if (
            Number.isInteger(lp) &&
            lp >= 0 &&
            lp < pages.length &&
            lp !== currentPageIndex
          ) {
            setCurrentPageIndex(lp);
            pageUpsertSkipRef.current = true;
          }

          // Sync completion status if needed
          if (!skipCompletionSyncRef.current) {
            const isBackendCompleted = Boolean(p?.is_completed);
            const isLocalCompleted = isCompleted(lessonId);
            if (isBackendCompleted !== isLocalCompleted) {
              toggleComplete(lessonId);
            }
          }
          skipCompletionSyncRef.current = false;
        }
      })
      .catch((err) => console.warn("Progress fetch failed:", err));

    return () => {
      mounted = false;
    };
  }, [pages.length, lessonId, treeId, progressLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Upsert Progress on Page Change
  useEffect(() => {
    if (!pages.length || !treeId || !lessonId) return;

    // Clear selection on page change
    setSelection({ text: "", context: "" });

    if (pageUpsertSkipRef.current) {
      pageUpsertSkipRef.current = false;
      return;
    }

    const percent = Math.max(
      0,
      Math.min(100, Math.round(((currentPageIndex + 1) / pages.length) * 100))
    );

    upsertUserProgress({
      user_id: USER_ID,
      hikmah_tree_id: Number(treeId),
      lesson_id: Number(lessonId),
      last_position: currentPageIndex,
      percent_complete: percent,
    }).catch((err) => console.warn("Progress upsert failed:", err));
  }, [currentPageIndex, pages.length, lessonId, treeId]);

  const handleNextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex((i) => i + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex((i) => i - 1);
    }
  };

  const handleCompleteAndNext = async () => {
    const nextDone = !done;
    if (!done) {
      skipCompletionSyncRef.current = true;
      toggleComplete(lessonId!);
    }

    try {
      // Optimistic upsert
      upsertUserProgress({
        user_id: USER_ID,
        hikmah_tree_id: Number(treeId),
        lesson_id: Number(lessonId),
        is_completed: true,
        percent_complete: 100,
      }).catch((err) => console.warn("Progress complete upsert failed:", err));
    } catch (_) {}

    if (nextLesson) {
      // Replace current screen with next lesson to avoid stack buildup if user reads many lessons
      router.replace({
        pathname: "/hikmah/lesson/[lessonId]",
        params: { lessonId: nextLesson.id, treeId },
      });
    } else {
      router.back();
    }
  };

  if (loading || !lesson || !tree) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ThemedView>
    );
  }

  const currentPage = pages[currentPageIndex];
  const hasSelection = !!selection.text;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.iconButton, { backgroundColor: colors.panel }]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <ThemedText type="defaultSemiBold" numberOfLines={1}>
            {lesson.title}
          </ThemedText>
          <ThemedText style={{ fontSize: 10, color: colors.textSecondary }}>
            Page {currentPageIndex + 1} of {pages.length || 1}
          </ThemedText>
        </View>

        <View style={{ width: 40 }} />
      </View>

      {/* Content Area - Using WebView for content */}
      <View style={styles.contentContainer}>
        {currentPage ? (
          <LessonContentWebView
            markdown={currentPage.content_body}
            onSelectionChange={setSelection}
          />
        ) : (
          <View style={styles.center}>
            <ThemedText style={{ color: colors.textSecondary }}>
              Content coming soon...
            </ThemedText>
          </View>
        )}
      </View>

      {/* Bottom Controls (Navigation + Completion) */}
      <View
        style={[
          styles.bottomControls,
          { backgroundColor: colors.panel, borderTopColor: colors.border },
        ]}
      >
        <View style={styles.navRow}>
          <TouchableOpacity
            onPress={handlePrevPage}
            disabled={currentPageIndex === 0}
            style={[
              styles.navBtn,
              { opacity: currentPageIndex === 0 ? 0.3 : 1 },
            ]}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.pageIndicator}>
            {currentPageIndex >= pages.length - 1 ? (
              <TouchableOpacity
                onPress={() => {
                  skipCompletionSyncRef.current = true;
                  toggleComplete(lessonId!);
                  upsertUserProgress({
                    user_id: USER_ID,
                    hikmah_tree_id: Number(treeId),
                    lesson_id: Number(lessonId),
                    is_completed: !done,
                    percent_complete: !done
                      ? 100
                      : Math.max(
                          0,
                          Math.min(
                            100,
                            Math.round(
                              ((currentPageIndex + 1) / pages.length) * 100
                            )
                          )
                        ),
                  }).catch(console.warn);
                }}
                style={[
                  styles.completeBtn,
                  {
                    backgroundColor: done
                      ? colors.primary + "20"
                      : colors.panel,
                    borderColor: done ? colors.primary : colors.border,
                  },
                ]}
              >
                <ThemedText
                  style={{
                    color: done ? colors.primary : colors.textSecondary,
                    fontWeight: "600",
                    fontSize: 12,
                  }}
                >
                  {done ? "Completed" : "Mark Complete"}
                </ThemedText>
              </TouchableOpacity>
            ) : (
              <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>
                {currentPageIndex + 1} / {pages.length}
              </ThemedText>
            )}
          </View>

          {currentPageIndex < pages.length - 1 ? (
            <TouchableOpacity onPress={handleNextPage} style={styles.navBtn}>
              <Ionicons name="chevron-forward" size={24} color={colors.text} />
            </TouchableOpacity>
          ) : nextLesson ? (
            <TouchableOpacity
              onPress={handleCompleteAndNext}
              style={styles.navBtn}
            >
              <Ionicons
                name="play-skip-forward"
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
          ) : (
            <View style={[styles.navBtn, { opacity: 0 }]} />
          )}
        </View>
      </View>

      {/* Ask Deen FAB */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: colors.panel,
            borderColor: hasSelection ? colors.primary : colors.border,
            borderWidth: hasSelection ? 2 : 1,
            shadowColor: hasSelection ? colors.primary : "#000",
            shadowOpacity: hasSelection ? 0.3 : 0.2,
          },
        ]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.fabIcon,
            {
              backgroundColor: hasSelection
                ? colors.primary
                : colors.textSecondary,
            },
          ]}
        >
          <Image
            source={require("@/assets/images/deen-logo-icon.png")}
            style={{ width: 20, height: 20, tintColor: "#fff" }}
            resizeMode="contain"
          />
        </View>
        <ThemedText
          style={{
            fontWeight: "600",
            color: hasSelection ? colors.primary : colors.text,
          }}
        >
          {hasSelection ? "Ask Deen" : "Ask Deen"}
        </ThemedText>
      </TouchableOpacity>

      <ElaborationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        contextText={selection.context || currentPage?.content_body || ""}
        lessonTitle={lesson.title}
        treeTitle={tree.title}
        lessonSummary={lesson.summary || ""}
        initialQuery={selection.text} // Pre-fill selected text if any? Or just use context?
        // In web app: selected text IS the query context, but user might want to ask "Explain this".
        // The web app sends `selected_text` as payload.
      />
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
    padding: 20,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 12,
  },
  contentContainer: {
    flex: 1,
    // Remove padding here, handle in WebView CSS
  },
  bottomControls: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navBtn: {
    padding: 8,
  },
  pageIndicator: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  completeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  fab: {
    position: "absolute",
    bottom: 100, // Raised above bottom controls
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 32,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    borderWidth: 1,
  },
  fabIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
