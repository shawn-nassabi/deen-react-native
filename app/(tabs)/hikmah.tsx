import React, { useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getHikmahTrees, getLessonsByTreeId, HikmahTree } from "@/utils/api";
import TreeCard from "@/components/hikmah/TreeCard";
import { Ionicons } from "@expo/vector-icons";

export default function HikmahScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [trees, setTrees] = useState<HikmahTree[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <ThemedText type="title" style={styles.pageTitle}>
          Hikmah Trees
        </ThemedText>
        
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
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={{ marginTop: 16, color: colors.textSecondary }}>
            Loading topics...
          </ThemedText>
        </View>
      ) : error ? (
        <View style={styles.center}>
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
          contentContainerStyle={styles.scrollContent}
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
            <ThemedText style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
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
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  pageTitle: {
    marginBottom: 16,
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
