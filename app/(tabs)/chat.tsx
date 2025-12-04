/**
 * Chat screen - Main chat interface with streaming AI responses
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Platform,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";
import LoadingIndicator from "@/components/ui/LoadingIndicator";
import SuggestedQuestions from "@/components/chat/SuggestedQuestions";
import {
  getOrCreateSessionId,
  sendChatMessage,
  startNewConversation,
} from "@/utils/api";
import {
  loadMessages,
  saveMessages,
  clearMessages,
  purgeExpiredSessions,
  type Message,
} from "@/utils/chatStorage";
import { ERROR_MESSAGES, UI_CONSTANTS } from "@/utils/constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Estimated input container height for padding calculations
const INPUT_CONTAINER_HEIGHT = 70;
const INPUT_ACCESSORY_ID = "chatInputAccessory";
const HEADER_HORIZONTAL_PADDING = 20;
const HEADER_BOTTOM_PADDING = 12;
const HEADER_ACTION_SIZE = 28;
const HEADER_ACTION_HIT_SLOP = { top: 12, right: 12, bottom: 12, left: 12 };

// Memoized empty state component to prevent re-renders
const EmptyState = React.memo(({
  showSuggestions,
  onQuestionClick,
  textSecondaryColor,
  minHeight,
}: {
  showSuggestions: boolean;
  onQuestionClick: (question: string) => void;
  textSecondaryColor: string;
  minHeight: number;
}) => {
  const verticalOffset = useMemo(() => {
    if (!minHeight || minHeight <= 0) {
      return 64;
    }

    const derivedOffset = minHeight * 0.12;
    return Math.max(48, Math.min(derivedOffset, 120));
  }, [minHeight]);

  return (
    <View
      style={[
        styles.emptyContainer,
        { minHeight, paddingTop: verticalOffset },
      ]}
    >
      <Image
        source={require("@/assets/images/deen-logo-icon.png")}
        style={styles.emptyLogo}
      />
      <ThemedText type="title" style={styles.emptyTitle}>
        How can I help you today?
      </ThemedText>
      <ThemedText
        style={[styles.emptySubtitle, { color: textSecondaryColor }]}
      >
        Ask any question about Islam and I'll do my best to provide a helpful
        response.
      </ThemedText>
      {showSuggestions && (
        <SuggestedQuestions onQuestionClick={onQuestionClick} />
      )}
    </View>
  );
});

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const blurIntensity = Platform.OS === "android" ? 120 : 60;
  const headerOverlayColor =
    colorScheme === "dark" ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.65)";

  const headerPaddingTop = Math.max(
    insets.top + 12,
    Platform.OS === "ios" ? 64 : 32
  );
  const messagesPaddingTop = headerPaddingTop + 56;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isNewChatLoading, setIsNewChatLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track if suggestions should show (separate state to avoid re-renders on every keystroke)
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Update showSuggestions when input changes (debounced effect)
  useEffect(() => {
    const shouldShow = !input.trim();
    if (shouldShow !== showSuggestions) {
      setShowSuggestions(shouldShow);
    }
  }, [input, showSuggestions]);

  // Initialize session and clean up expired sessions
  useEffect(() => {
    const initialize = async () => {
      console.log("🚀 Chat screen initialized");
      await purgeExpiredSessions();
      const sid = await getOrCreateSessionId();
      setSessionId(sid);
    };
    initialize();
  }, []);

  // Scroll to bottom when keyboard opens
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    
    const showSub = Keyboard.addListener(showEvent, () => {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => {
      showSub.remove();
    };
  }, []);

  // Load messages when session ID changes
  useEffect(() => {
    if (!sessionId) return;

    const loadInitialMessages = async () => {
      const initial = await loadMessages(sessionId);
      if (initial.length > 0) {
        console.log(`💾 Loaded ${initial.length} message(s) from storage`);
      }
      setMessages(initial);
    };
    loadInitialMessages();
  }, [sessionId]);

  // Save messages with debouncing
  useEffect(() => {
    if (!sessionId) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      saveMessages(sessionId, messages);
    }, UI_CONSTANTS.DEBOUNCE_DELAY);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [sessionId, messages]);

  // Smart auto-scroll
  const hasStartedChat = messages.some((m) => m.sender === "user");

  const handleSuggestedQuestion = useCallback((question: string) => {
    setInput(question);
  }, []);

  const handleNewChat = useCallback(async () => {
    if (isLoading || isNewChatLoading) return;

    setIsNewChatLoading(true);

    try {
      if (sessionId) {
        await clearMessages(sessionId);
      }

      const newId = await startNewConversation();
      setSessionId(newId);
      setMessages([]);
      setInput("");
      setShowSuggestions(true);
    } catch (e) {
      console.error("❌ Failed to start new chat:", e);
    } finally {
      setIsNewChatLoading(false);
    }
  }, [isLoading, isNewChatLoading, sessionId]);

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || !sessionId || isLoading) return;

    const userMessage: Message = { sender: "user", text: input };
    const botPlaceholder: Message = { sender: "bot", text: "" };

    setMessages((prev) => [...prev, userMessage, botPlaceholder]);
    setInput("");
    setIsLoading(true);
    try {
      await sendChatMessage(
        input,
        sessionId,
        "english",
        (fullMessage) => {
          setIsLoading(false);
          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            updated[lastIndex] = { sender: "bot", text: fullMessage };
            return updated;
          });
        },
        (responseText, references) => {
          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            updated[lastIndex] = {
              sender: "bot",
              text: responseText,
              references: references,
            };
            return updated;
          });
        },
        (error) => {
          console.error("❌ Chat error:", error);
          setIsLoading(false);
          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            updated[lastIndex] = {
              sender: "bot",
              text: ERROR_MESSAGES.CHAT_FAILED,
            };
            return updated;
          });
        }
      );
    } catch (error) {
      console.error("❌ Error in handleSendMessage:", error);
      setIsLoading(false);
      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        updated[lastIndex] = {
          sender: "bot",
          text: ERROR_MESSAGES.CHAT_FAILED,
        };
        return updated;
      });
    }
  }, [input, sessionId, isLoading]);

  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    if (
      item.sender === "bot" &&
      !item.text &&
      !item.references &&
      isLoading &&
      index === messages.length - 1
    ) {
      return null;
    }

    return <ChatMessage message={item} />;
  }, [isLoading, messages.length]);

  const bottomPadding = INPUT_CONTAINER_HEIGHT + insets.bottom + 16;

  // Calculate available height for empty state (screen - header - input - paddings)
  const screenHeight = Dimensions.get("window").height;
  const emptyStateHeight = Math.max(
    0,
    screenHeight - messagesPaddingTop - bottomPadding - INPUT_CONTAINER_HEIGHT
  );

  // Memoized empty state to prevent re-renders
  const emptyComponent = useMemo(() => {
    if (isLoading && messages.length === 0) return null;

    return (
      <EmptyState
        showSuggestions={showSuggestions}
        onQuestionClick={handleSuggestedQuestion}
        textSecondaryColor={colors.textSecondary}
        minHeight={emptyStateHeight}
      />
    );
  }, [isLoading, messages.length, showSuggestions, handleSuggestedQuestion, colors.textSecondary, emptyStateHeight]);

  const renderFooter = useCallback(() => {
    if (!isLoading) return null;

    return (
      <View style={styles.loadingContainer}>
        <View
          style={[
            styles.loadingBox,
            {
              backgroundColor: colors.panel,
              borderColor: colors.border,
            },
          ]}
        >
          <LoadingIndicator message="Thinking..." />
        </View>
      </View>
    );
  }, [isLoading, colors.panel, colors.border]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
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
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Image
              source={require("@/assets/images/deen-logo-icon.png")}
              style={styles.headerLogo}
            />
            <ThemedText type="subtitle" style={styles.headerTitle}>
              Deen Chat
            </ThemedText>
          </View>
          <TouchableOpacity
            hitSlop={HEADER_ACTION_HIT_SLOP}
            style={[
              styles.newChatButton,
              {
                backgroundColor: hasStartedChat
                  ? colors.panel2
                  : "transparent",
                borderColor: colors.border,
              },
            ]}
            onPress={handleNewChat}
            disabled={isLoading || isNewChatLoading}
            activeOpacity={0.7}
          >
            {isNewChatLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <ThemedText style={[styles.newChatLabel, { color: colors.text }]}>
                  New
                </ThemedText>
                <Ionicons name="add" size={20} color={colors.text} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </BlurView>

      {/* Main Content with KeyboardAvoidingView */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(_, index) => `message-${index}`}
          contentContainerStyle={[
            styles.messagesList,
            { 
              paddingTop: messagesPaddingTop,
              paddingBottom: bottomPadding,
            },
          ]}
          ListEmptyComponent={emptyComponent}
          ListFooterComponent={renderFooter}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          removeClippedSubviews={false}
        />

        {/* Input at bottom */}
        <View style={styles.inputContainer}>
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={handleSendMessage}
            isLoading={isLoading}
          />
        </View>
      </KeyboardAvoidingView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    paddingBottom: HEADER_BOTTOM_PADDING,
    paddingHorizontal: HEADER_HORIZONTAL_PADDING,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: "hidden",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
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
  newChatButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    height: HEADER_ACTION_SIZE,
    borderRadius: HEADER_ACTION_SIZE / 2,
    borderWidth: 1,
    justifyContent: "center",
  },
  newChatLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  messagesList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 16,
  },
  emptyLogo: {
    width: 64,
    height: 64,
    opacity: 0.8,
    marginBottom: 8,
  },
  emptyTitle: {
    marginBottom: 4,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 16,
  },
  loadingContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  loadingBox: {
    maxWidth: "85%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  inputContainer: {
    borderTopWidth: 0,
  },
});
