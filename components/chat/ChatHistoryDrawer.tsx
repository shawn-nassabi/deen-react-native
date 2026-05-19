/**
 * ChatHistoryDrawer - Animated slide-in side panel for browsing saved chat history.
 * Slides in from the left. Auth-gated: shows sign-in prompt if unauthenticated.
 */

import React, { useEffect, useRef, useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import PlatformBlurView from "@/components/ui/PlatformBlurView";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  fetchSavedChats,
  type SavedChatListItem,
} from "@/utils/api";

const DRAWER_MAX_WIDTH = 320;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.82, DRAWER_MAX_WIDTH);

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelectChat: (sessionId: string) => void;
  onNewChat: () => void;
  activeSessionId: string | null;
  isAuthenticated: boolean;
  isLoadingChat: boolean;
};

export default function ChatHistoryDrawer({
  visible,
  onClose,
  onSelectChat,
  onNewChat,
  activeSessionId,
  isAuthenticated,
  isLoadingChat,
}: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const [chats, setChats] = useState<SavedChatListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const loadChats = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setHasError(false);
    try {
      const result = await fetchSavedChats(50, 0);
      setChats(result?.items ?? []);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Animate open/close and load data when opened
  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          damping: 22,
          stiffness: 200,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      loadChats();
    } else {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: -DRAWER_WIDTH,
          useNativeDriver: true,
          damping: 22,
          stiffness: 200,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setIsVisible(false);
      });
    }
  }, [visible, loadChats, translateX, overlayOpacity]);

  const handleSelectChat = useCallback(
    (sessionId: string) => {
      if (isLoadingChat) return;
      onSelectChat(sessionId);
    },
    [isLoadingChat, onSelectChat]
  );

  const handleNewChat = useCallback(() => {
    onNewChat();
    onClose();
  }, [onNewChat, onClose]);

  const renderItem = useCallback(
    ({ item }: { item: SavedChatListItem }) => {
      const isActive = item.session_id === activeSessionId;
      return (
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={isLoadingChat}
          onPress={() => handleSelectChat(item.session_id)}
          style={[
            styles.chatItem,
            {
              backgroundColor: isActive ? colors.primary + "22" : "transparent",
              borderColor: isActive ? colors.primary + "55" : colors.border,
            },
          ]}
        >
          <View style={styles.chatItemContent}>
            <ThemedText
              numberOfLines={1}
              style={[
                styles.chatItemTitle,
                { color: isActive ? colors.primary : colors.text },
              ]}
            >
              {item.title || "Untitled Chat"}
            </ThemedText>
            <View style={styles.chatItemMeta}>
              <ThemedText style={[styles.chatItemTime, { color: colors.muted }]}>
                {formatRelativeTime(item.last_message_at)}
              </ThemedText>
              <View
                style={[
                  styles.messageBadge,
                  { backgroundColor: colors.panel2 },
                ]}
              >
                <ThemedText style={[styles.messageBadgeText, { color: colors.muted }]}>
                  {item.message_count}
                </ThemedText>
              </View>
            </View>
          </View>
          {isActive && (
            <View
              style={[styles.activeIndicator, { backgroundColor: colors.primary }]}
            />
          )}
        </TouchableOpacity>
      );
    },
    [activeSessionId, colors, handleSelectChat, isLoadingChat]
  );

  const renderListContent = () => {
    if (!isAuthenticated) {
      return (
        <View style={styles.centeredState}>
          <Ionicons name="lock-closed-outline" size={36} color={colors.muted} />
          <ThemedText style={[styles.stateText, { color: colors.textSecondary }]}>
            Sign in to view your chat history
          </ThemedText>
        </View>
      );
    }

    if (isLoading) {
      return (
        <View style={styles.centeredState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }

    if (hasError) {
      return (
        <View style={styles.centeredState}>
          <Ionicons name="cloud-offline-outline" size={36} color={colors.muted} />
          <ThemedText style={[styles.stateText, { color: colors.textSecondary }]}>
            Failed to load history
          </ThemedText>
          <TouchableOpacity
            style={[styles.retryButton, { borderColor: colors.border }]}
            onPress={loadChats}
            activeOpacity={0.7}
          >
            <ThemedText style={[styles.retryText, { color: colors.primary }]}>
              Retry
            </ThemedText>
          </TouchableOpacity>
        </View>
      );
    }

    if (chats.length === 0) {
      return (
        <View style={styles.centeredState}>
          <Ionicons name="chatbubble-outline" size={36} color={colors.muted} />
          <ThemedText style={[styles.stateText, { color: colors.textSecondary }]}>
            No saved chats yet
          </ThemedText>
          <ThemedText style={[styles.stateSubText, { color: colors.muted }]}>
            Start a conversation and it will appear here
          </ThemedText>
        </View>
      );
    }

    return (
      <FlatList
        data={chats}
        renderItem={renderItem}
        keyExtractor={(item) => item.session_id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  if (!isVisible) return null;

  const drawerBackground = colorScheme === "dark" ? colors.panel : colors.panel;
  const blurIntensity = Platform.OS === "android" ? 120 : 70;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop overlay */}
      <Animated.View
        style={[styles.overlay, { opacity: overlayOpacity }]}
        pointerEvents={visible ? "auto" : "none"}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>

      {/* Drawer panel */}
      <Animated.View
        style={[
          styles.drawer,
          {
            width: DRAWER_WIDTH,
            transform: [{ translateX }],
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 16,
          },
        ]}
        pointerEvents={visible ? "auto" : "none"}
      >
        <PlatformBlurView
          intensity={blurIntensity}
          tint={colorScheme === "dark" ? "dark" : "light"}
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: drawerBackground + "e8" },
          ]}
        />

        {/* Drawer content above blur */}
        <View style={styles.drawerInner}>
          {/* Header */}
          <View style={[styles.drawerHeader, { borderBottomColor: colors.border }]}>
            <ThemedText type="subtitle" style={styles.drawerTitle}>
              Chat History
            </ThemedText>
            <TouchableOpacity
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={22} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {/* New Chat button */}
          <TouchableOpacity
            style={[
              styles.newChatRow,
              {
                backgroundColor: colors.panel2,
                borderColor: colors.border,
              },
            ]}
            onPress={handleNewChat}
            activeOpacity={0.75}
          >
            <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
            <ThemedText style={[styles.newChatRowText, { color: colors.primary }]}>
              New Chat
            </ThemedText>
          </TouchableOpacity>

          {/* Saved chats list or states */}
          <View style={styles.listWrapper}>{renderListContent()}</View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  drawer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    overflow: "hidden",
    borderRightWidth: 1,
    borderRightColor: "rgba(0,0,0,0.08)",
  },
  drawerInner: {
    flex: 1,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  drawerTitle: {
    fontSize: 17,
  },
  newChatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  newChatRowText: {
    fontSize: 14,
    fontWeight: "600",
  },
  listWrapper: {
    flex: 1,
    marginTop: 6,
  },
  listContent: {
    paddingHorizontal: 10,
    paddingBottom: 16,
    gap: 4,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 8,
  },
  chatItemContent: {
    flex: 1,
    gap: 4,
  },
  chatItemTitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  chatItemMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chatItemTime: {
    fontSize: 12,
  },
  messageBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  messageBadgeText: {
    fontSize: 11,
    fontWeight: "500",
  },
  activeIndicator: {
    width: 3,
    height: 20,
    borderRadius: 2,
    marginLeft: 6,
  },
  centeredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 10,
  },
  stateText: {
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
  },
  stateSubText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  retryButton: {
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  retryText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
