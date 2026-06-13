import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  RefreshControl,
  Platform,
  Image,
  Keyboard,
  Pressable,
  TouchableOpacity,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import PlatformBlurView from "@/components/ui/PlatformBlurView";
import { WebBackHomeButton } from "@/components/ui/WebBackHomeButton";
import WebAppHeader from "@/components/ui/WebAppHeader";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useWebGlobalTextInputShortcuts } from "@/hooks/use-web-global-text-input-shortcuts";
import {
  getHikmahTrees,
  getLessonsByTreeId,
  HikmahTree,
  listUserProgress,
} from "@/utils/api";
import { setProgress } from "@/utils/hikmahStorage";
import TreeCard from "@/components/hikmah/TreeCard";
import TreeCardSkeleton from "@/components/hikmah/TreeCardSkeleton";
import ComingSoonCard from "@/components/hikmah/ComingSoonCard";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";

const COMING_SOON_COURSES = [
  { id: "foundations-islam", title: "The Foundations of Islam" },
  { id: "14-masumeen", title: "The 14 Masumeen" },
  { id: "tawheed", title: "Tawheed" },
];

const WEB_TAG_ALL = "ALL";
const WEB_TAG_ORDER = [
  "DIVINE-JUSTICE",
  "THEOLOGY",
  "PREDESTINATION",
  "FREE-WILL",
  "TAWHID",
  "ADL",
  "NUBUWWAH",
  "IMAMAH",
  "MAAD",
  "SHIA-THEOLOGY",
  "FUNDAMENTALS",
];

const normalizeWebTag = (tag: string) =>
  tag.trim().replace(/[\s_]+/g, "-").toUpperCase();

const webInputFocusReset = Platform.select({
  web: {
    outlineStyle: "none",
    outlineWidth: 0,
    boxShadow: "none",
  } as unknown as TextStyle,
});

export default function HikmahScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { height, isWeb, isDesktop, pagePadding, contentMaxWidth } =
    useResponsiveLayout();
  const { user } = useAuth();
  const userId = user?.id;
  const blurIntensity = Platform.OS === "android" ? 120 : 60;
  const headerOverlayColor =
    colorScheme === "dark" ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.65)";
  const [headerHeight, setHeaderHeight] = useState(0);
  const [trees, setTrees] = useState<HikmahTree[]>([]);
  const [query, setQuery] = useState("");
  const [isWebSearchFocused, setIsWebSearchFocused] = useState(false);
  const [selectedWebTag, setSelectedWebTag] = useState(WEB_TAG_ALL);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const searchInputRef = useRef<TextInput>(null);

  const hydrateBackendProgress = async (treesWithLessons: HikmahTree[]) => {
    try {
      if (!userId) return;
      const progress = await listUserProgress({ user_id: userId });
      if (!Array.isArray(progress) || progress.length === 0) return;

      // Map treeId -> valid lesson ids (to filter out stale backend data)
      const lessonMap = new Map<number | string, Set<string>>();
      treesWithLessons.forEach((tree) => {
        if (tree?.id && Array.isArray(tree.lessons)) {
          lessonMap.set(
            tree.id,
            new Set(tree.lessons.map((l) => String(l.id)))
          );
        }
      });

      // Group completed lessons by tree
      const grouped = new Map<number | string, Set<string>>();
      progress.forEach((p: any) => {
        const treeId = p?.hikmah_tree_id;
        const lessonId = p?.lesson_id;
        if (treeId == null || lessonId == null || !p?.is_completed) return;
        const validLessons = lessonMap.get(treeId);
        if (!validLessons) return;
        const lessonIdStr = String(lessonId);
        if (!validLessons.has(lessonIdStr)) return;
        if (!grouped.has(treeId)) grouped.set(treeId, new Set());
        grouped.get(treeId)!.add(lessonIdStr);
      });

      if (grouped.size === 0) return;

      // Persist to local storage so useHikmahProgress picks it up
      await Promise.all(
        Array.from(grouped.entries()).map(([treeId, lessonIds]) =>
          setProgress(treeId, Array.from(lessonIds))
        )
      );
    } catch (err) {
      console.warn("⚠️ Progress hydration failed:", err);
    }
  };

  const loadData = async () => {
    try {
      setError("");
      const data = await getHikmahTrees({ limit: 100 });
      const treesArray = Array.isArray(data) ? data : [];

      // Fetch lessons for each tree to compute progress
      // In a real app, we might want to do this lazily or have the backend return counts
      // but for now we match web implementation
      const treesWithLessons = await Promise.all(
        treesArray.map(async (tree) => {
          try {
            const lessons = await getLessonsByTreeId(tree.id, {
              order_by: "order_position",
              limit: 200,
            });
            return {
              ...tree,
              lessons: Array.isArray(lessons)
                ? lessons.map((l) => ({ id: String(l.id), title: l.title }))
                : [],
            };
          } catch (err) {
            console.warn(`Failed to fetch lessons for tree ${tree.id}:`, err);
            return { ...tree, lessons: [] };
          }
        })
      );

      // Pull down latest completion data from backend so first-time installs show progress
      await hydrateBackendProgress(treesWithLessons);

      setTrees(treesWithLessons);
    } catch (err: any) {
      console.error("Failed to load hikmah trees:", err);
      setError(err?.message || "Failed to load hikmah trees.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const webTagFilters = useMemo(() => {
    const tagSet = new Set<string>();
    trees.forEach((tree) => {
      tree.tags?.forEach((tag) => {
        const normalized = normalizeWebTag(tag);
        if (normalized) tagSet.add(normalized);
      });
    });

    const orderedTags = WEB_TAG_ORDER.filter((tag) => tagSet.has(tag));
    const extraTags = Array.from(tagSet)
      .filter((tag) => !WEB_TAG_ORDER.includes(tag))
      .sort((a, b) => a.localeCompare(b));

    return [WEB_TAG_ALL, ...orderedTags, ...extraTags];
  }, [trees]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return trees.filter((t) => {
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        (t.subtitle || "").toLowerCase().includes(q);
      const matchesTag =
        selectedWebTag === WEB_TAG_ALL ||
        t.tags?.some((tag) => normalizeWebTag(tag) === selectedWebTag);

      return matchesSearch && matchesTag;
    });
  }, [trees, query, selectedWebTag]);

  const filteredComingSoon = useMemo(() => {
    if (selectedWebTag !== WEB_TAG_ALL) return [];

    const q = query.trim().toLowerCase();
    if (!q) return COMING_SOON_COURSES;
    return COMING_SOON_COURSES.filter((c) =>
      c.title.toLowerCase().includes(q)
    );
  }, [query, selectedWebTag]);

  const emptyStateMessage =
    selectedWebTag !== WEB_TAG_ALL && !query.trim()
      ? `No topics found for ${selectedWebTag}`
      : `No topics found matching "${query}"`;

  const handleSearchSubmit = useCallback(() => {
    searchInputRef.current?.blur();
    Keyboard.dismiss();
  }, []);

  const handleSearchKeyPress = (event: any) => {
    if (Platform.OS !== "web") return;

    const key = event?.key ?? event?.nativeEvent?.key;
    if (key !== "Enter") return;

    event.preventDefault?.();
    handleSearchSubmit();
  };

  const handleGlobalTextInput = useCallback((text: string) => {
    setQuery((prev) => `${prev}${text}`);
    searchInputRef.current?.focus();
  }, []);

  useWebGlobalTextInputShortcuts({
    onSubmit: handleSearchSubmit,
    onTextInput: handleGlobalTextInput,
  });

  const headerPaddingTop = Math.max(
    insets.top + 12,
    Platform.OS === "ios" ? 64 : 32
  );
  const estimatedHeaderOffset = headerPaddingTop + 120;
  const contentTopOffset = (headerHeight || estimatedHeaderOffset) + 16;
  const webHeaderHeight = 80;
  const webPageMaxWidth = 1180;
  const webSearchMaxWidth = 512;
  const webContentMinHeight = Math.max(height - webHeaderHeight, 600);

  if (isWeb) {
    return (
      <ThemedView
        style={[
          styles.webPage,
          { backgroundColor: colors.background },
        ]}
      >
        <WebAppHeader
          height={webHeaderHeight}
          logoSize={32}
          maxWidth={webPageMaxWidth}
          paddingHorizontal={24}
          title="Hikmah Trees"
          titleStyle={styles.webHeaderTitle}
        />

        <ScrollView
          style={styles.webScroll}
          contentContainerStyle={[
            styles.webScrollContent,
            {
              minHeight: webContentMinHeight,
              paddingHorizontal: pagePadding,
              paddingTop: webHeaderHeight + 32,
            },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={[styles.webSearchRow, { maxWidth: contentMaxWidth }]}>
            <View
              style={[
                styles.webSearchColumn,
                {
                  maxWidth: webSearchMaxWidth,
                  width: isDesktop ? undefined : "100%",
                },
              ]}
            >
              <View
                style={[
                  styles.webSearchBox,
                  {
                    backgroundColor: colors.panel,
                    borderColor: isWebSearchFocused
                      ? colors.primary
                      : colors.border,
                    boxShadow: isWebSearchFocused
                      ? "0 0 18px rgba(91, 193, 161, 0.18)"
                      : "none",
                  },
                ]}
              >
                <TextInput
                  ref={searchInputRef}
                  style={[
                    styles.webSearchInput,
                    webInputFocusReset,
                    { color: colors.text },
                  ]}
                  placeholder="Search topics..."
                  placeholderTextColor={colors.textSecondary}
                  value={query}
                  onChangeText={setQuery}
                  returnKeyType="search"
                  enterKeyHint="search"
                  onSubmitEditing={handleSearchSubmit}
                  onKeyPress={handleSearchKeyPress}
                  onFocus={() => setIsWebSearchFocused(true)}
                  onBlur={() => setIsWebSearchFocused(false)}
                />
                {query.length > 0 ? (
                  <TouchableOpacity
                    accessibilityLabel="Clear Hikmah search"
                    accessibilityRole="button"
                    activeOpacity={0.72}
                    onPress={() => setQuery("")}
                    style={styles.webClearButton}
                  >
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            <View style={styles.webTagFilters}>
              {webTagFilters.map((tag) => {
                const selected = selectedWebTag === tag;

                return (
                  <Pressable
                    key={tag}
                    accessibilityLabel={
                      tag === WEB_TAG_ALL
                        ? "Show all Hikmah topics"
                        : `Filter Hikmah topics by ${tag}`
                    }
                    accessibilityRole="button"
                    onPress={() => setSelectedWebTag(tag)}
                    style={({ hovered }) => [
                      styles.webTagPill,
                      {
                        backgroundColor: selected
                          ? `${colors.primary}1A`
                          : hovered
                            ? colors.hoverBg
                            : "transparent",
                        borderColor: selected
                          ? colors.primary
                          : hovered
                            ? colors.hoverBorder
                            : colors.border,
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.webTagPillText,
                        {
                          color: selected
                            ? colors.primary
                            : colors.textSecondary,
                        },
                      ]}
                    >
                      {tag}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.webBody}>
            {loading && !refreshing ? (
              <View style={[styles.webResults, { maxWidth: contentMaxWidth }]}>
                <TreeCardSkeleton />
                <TreeCardSkeleton />
                <TreeCardSkeleton />
                <ThemedText
                  style={[
                    styles.webStateText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Loading topics...
                </ThemedText>
              </View>
            ) : error ? (
              <View style={styles.webState}>
                <ThemedText style={[styles.webErrorText, { color: colors.error }]}>
                  {error}
                </ThemedText>
              </View>
            ) : filtered.length === 0 && filteredComingSoon.length === 0 ? (
              <View style={styles.webState}>
                <ThemedText
                  style={[styles.webStateText, { color: colors.textSecondary }]}
                >
                  {emptyStateMessage}
                </ThemedText>
              </View>
            ) : (
              <View style={[styles.webResults, { maxWidth: contentMaxWidth }]}>
                <View style={styles.desktopGrid}>
                  {filtered.map((tree) => (
                    <View key={tree.id} style={styles.desktopGridItem}>
                      <TreeCard tree={tree} />
                    </View>
                  ))}
                  {filteredComingSoon.map((course) => (
                    <View key={course.id} style={styles.desktopGridItem}>
                      <ComingSoonCard title={course.title} />
                    </View>
                  ))}
                </View>

                <View
                  style={[
                    styles.comingSoonCard,
                    { backgroundColor: colors.panel2, borderColor: colors.border },
                  ]}
                >
                  <ThemedText type="subtitle" style={{ color: colors.textSecondary }}>
                    More Coming Soon
                  </ThemedText>
                  <ThemedText
                    style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}
                  >
                    Inshallah...
                  </ThemedText>
                </View>
              </View>
            )}
          </View>

          <ThemedText
            style={[styles.webFooter, { color: colors.textSecondary }]}
          >
            © {new Date().getFullYear()} Deen. All rights reserved.
          </ThemedText>
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <PlatformBlurView
        intensity={blurIntensity}
        tint={colorScheme === "dark" ? "dark" : "light"}
        style={[
          styles.header,
          {
            borderBottomColor: colors.border,
            paddingTop: headerPaddingTop,
            backgroundColor: headerOverlayColor,
          },
        ]}
        onLayout={({ nativeEvent }) =>
          setHeaderHeight(nativeEvent.layout.height)
        }
      >
        <View
          style={[
            styles.headerContent,
            isDesktop && { maxWidth: contentMaxWidth, alignSelf: "center", width: "100%" },
          ]}
        >
          <View style={styles.headerLeft}>
            <WebBackHomeButton />
            <Image
              source={require("@/assets/images/deen-logo-icon.png")}
              style={styles.headerLogo}
            />
            <ThemedText type="subtitle" style={styles.headerTitle}>
              Hikmah Trees
            </ThemedText>
          </View>
        </View>

        {/* Search Bar */}
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: colors.panel, borderColor: colors.border },
            isDesktop && { maxWidth: contentMaxWidth, alignSelf: "center", width: "100%" },
          ]}
        >
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            ref={searchInputRef}
            style={[styles.searchInput, webInputFocusReset, { color: colors.text }]}
            placeholder="Search topics..."
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            enterKeyHint={Platform.OS === "web" ? "search" : undefined}
            onSubmitEditing={handleSearchSubmit}
            onKeyPress={handleSearchKeyPress}
          />
          {query.length > 0 && (
            <Ionicons
              name="close-circle"
              size={20}
              color={colors.muted}
              onPress={() => setQuery("")}
            />
          )}
        </View>
      </PlatformBlurView>

      {loading && !refreshing ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: contentTopOffset, paddingHorizontal: pagePadding },
            isDesktop && {
              maxWidth: contentMaxWidth,
              alignSelf: "center",
              width: "100%",
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <TreeCardSkeleton />
          <TreeCardSkeleton />
          <TreeCardSkeleton />
          <ThemedText
            style={{
              marginTop: 8,
              textAlign: "center",
              color: colors.textSecondary,
            }}
          >
            Loading topics...
          </ThemedText>
        </ScrollView>
      ) : error ? (
        <View style={[styles.center, { paddingTop: contentTopOffset }]}>
          <ThemedText style={{ color: "red", textAlign: "center" }}>
            {error}
          </ThemedText>
          <ThemedText
            style={{
              marginTop: 16,
              color: colors.primary,
              textDecorationLine: "underline",
            }}
            onPress={loadData}
          >
            Try Again
          </ThemedText>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: contentTopOffset, paddingHorizontal: pagePadding },
            isDesktop && {
              maxWidth: contentMaxWidth,
              alignSelf: "center",
              width: "100%",
            },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filtered.length === 0 && filteredComingSoon.length === 0 ? (
            <View style={styles.emptyState}>
              <ThemedText style={{ color: colors.textSecondary }}>
                {emptyStateMessage}
              </ThemedText>
            </View>
          ) : (
            <View style={isDesktop && styles.desktopGrid}>
              {filtered.map((tree) => (
                <View key={tree.id} style={isDesktop && styles.desktopGridItem}>
                  <TreeCard tree={tree} />
                </View>
              ))}
              {filteredComingSoon.map((course) => (
                <View key={course.id} style={isDesktop && styles.desktopGridItem}>
                  <ComingSoonCard title={course.title} />
                </View>
              ))}
            </View>
          )}

          <View
            style={[
              styles.comingSoonCard,
              { backgroundColor: colors.panel2, borderColor: colors.border },
            ]}
          >
            <ThemedText type="subtitle" style={{ color: colors.textSecondary }}>
              More Coming Soon
            </ThemedText>
            <ThemedText
              style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}
            >
              Inshallah...
            </ThemedText>
          </View>
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webPage: {
    flex: 1,
  },
  webHeaderTitle: {
    fontSize: 24,
    fontWeight: "600",
    letterSpacing: 0,
  },
  webScroll: {
    flex: 1,
  },
  webScrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingBottom: 24,
  },
  webSearchRow: {
    width: "100%",
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    gap: 16,
  },
  webSearchColumn: {
    flexBasis: 512,
    flexGrow: 0,
    flexShrink: 1,
    minWidth: 280,
  },
  webSearchBox: {
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  } as ViewStyle,
  webSearchInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    minWidth: 0,
    padding: 0,
  },
  webClearButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    marginRight: -8,
    width: 36,
  },
  webTagFilters: {
    flex: 1,
    minWidth: 280,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    paddingTop: 6,
  },
  webTagPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  } as ViewStyle,
  webTagPillText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0,
  },
  webBody: {
    width: "100%",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
  },
  webState: {
    flex: 1,
    minHeight: 320,
    alignItems: "center",
    justifyContent: "center",
  },
  webStateText: {
    fontSize: 16,
    textAlign: "center",
  },
  webErrorText: {
    fontSize: 22,
    fontWeight: "500",
    textAlign: "center",
  },
  webResults: {
    width: "100%",
    alignSelf: "center",
  },
  webFooter: {
    fontSize: 14,
    textAlign: "center",
    marginTop: "auto",
    paddingTop: 28,
  },
  header: {
    borderBottomWidth: 1,
    paddingBottom: 16,
    paddingHorizontal: 20,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: "hidden",
    gap: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerLogo: {
    width: 28,
    height: 28,
  },
  headerTitle: {
    fontSize: 17,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  desktopGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  desktopGridItem: {
    width: "48.9%",
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  comingSoonCard: {
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.7,
    marginBottom: 20,
  },
});
