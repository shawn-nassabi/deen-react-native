import React, { useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Image,
} from "react-native";
import { BlurView } from "expo-blur";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  getHikmahTrees,
  getLessonsByTreeId,
  HikmahTree,
  listUserProgress,
} from "@/utils/api";
import { setProgress } from "@/utils/hikmahStorage";
import TreeCard from "@/components/hikmah/TreeCard";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// TODO: replace with authenticated user identity when available
const USER_ID = "snassabi7@gmail.com";

export default function HikmahScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const blurIntensity = Platform.OS === "android" ? 120 : 60;
  const headerOverlayColor =
    colorScheme === "dark" ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.65)";
  const [headerHeight, setHeaderHeight] = useState(0);
  const [trees, setTrees] = useState<HikmahTree[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const hydrateBackendProgress = async (treesWithLessons: HikmahTree[]) => {
    try {
      const progress = await listUserProgress({ user_id: USER_ID });
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return trees.filter((t) => {
      return (
        !q ||
        t.title.toLowerCase().includes(q) ||
        (t.subtitle || "").toLowerCase().includes(q)
      );
    });
  }, [trees, query]);

  const headerPaddingTop = Math.max(
    insets.top + 12,
    Platform.OS === "ios" ? 64 : 32
  );
  const estimatedHeaderOffset = headerPaddingTop + 120;
  const contentTopOffset = (headerHeight || estimatedHeaderOffset) + 16;

  return (
    <ThemedView style={styles.container}>
      <BlurView
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
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
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
          ]}
        >
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search topics..."
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
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
      </BlurView>

      {loading && !refreshing ? (
        <View style={[styles.center, { paddingTop: contentTopOffset }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={{ marginTop: 16, color: colors.textSecondary }}>
            Loading topics...
          </ThemedText>
        </View>
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
            { paddingTop: contentTopOffset },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <ThemedText style={{ color: colors.textSecondary }}>
                No topics found matching "{query}"
              </ThemedText>
            </View>
          ) : (
            filtered.map((tree) => <TreeCard key={tree.id} tree={tree} />)
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
