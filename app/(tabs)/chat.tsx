/**
 * Chat screen - Main chat interface with streaming AI responses
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  ActivityIndicator,
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

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const baseHeaderPadding = Platform.OS === "ios" ? 24 : 12;
  const headerPaddingTop = Math.max(insets.top + 8, baseHeaderPadding);
  const messagesPaddingTop = headerPaddingTop + 56;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isNewChatLoading, setIsNewChatLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isNearBottomRef = useRef(true); // Track if user is near bottom

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

    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Debounce save
    saveTimerRef.current = setTimeout(() => {
      saveMessages(sessionId, messages);
    }, UI_CONSTANTS.DEBOUNCE_DELAY);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [sessionId, messages]);

  // Smart auto-scroll: only scroll if user is near bottom
  useEffect(() => {
    if (messages.length > 0 && isNearBottomRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Handle scroll events to track user position
  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;

    // Check if user is near bottom (within 100px)
    const isNearBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;

    isNearBottomRef.current = isNearBottom;

    // Show scroll button when user scrolls up
    setShowScrollButton(!isNearBottom && messages.length > 0);
  };

  // Scroll to bottom manually
  const scrollToBottom = () => {
    console.log("⬇️ User tapped 'Scroll to bottom' button");
    flatListRef.current?.scrollToEnd({ animated: true });
    isNearBottomRef.current = true;
    setShowScrollButton(false);
  };

  // Check if chat has started (any user messages exist)
  const hasStartedChat = messages.some((m) => m.sender === "user");

  // Handle suggested question click
  const handleSuggestedQuestion = (question: string) => {
    console.log(
      `💡 Suggested question selected: "${question.substring(0, 50)}..."`
    );
    setInput(question);
  };

  // Start a new conversation
  const handleNewChat = async () => {
    if (isLoading || isNewChatLoading) {
      console.log("⏸️ New chat blocked - Operation already in progress");
      return;
    }

    console.log("🆕 User clicked 'New Chat' button");
    setIsNewChatLoading(true);

    try {
      // Clear UI persistence for old session
      if (sessionId) {
        console.log(`🗑️ Clearing old session: ${sessionId.substring(0, 8)}...`);
        await clearMessages(sessionId);
      }

      // Create new session ID
      const newId = await startNewConversation();
      setSessionId(newId);
      setMessages([]);
      setInput("");
      setShowScrollButton(false);

      console.log("✅ New chat created successfully");
    } catch (e) {
      console.error("❌ Failed to start new chat:", e);
    } finally {
      setIsNewChatLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !sessionId || isLoading) return;

    console.log(
      `📤 User sending message: "${input.substring(0, 50)}${
        input.length > 50 ? "..." : ""
      }"`
    );

    const userMessage: Message = { sender: "user", text: input };
    const botPlaceholder: Message = { sender: "bot", text: "" };

    setMessages((prev) => [...prev, userMessage, botPlaceholder]);
    setInput("");
    setIsLoading(true);

    // Always scroll to bottom when sending a new message
    isNearBottomRef.current = true;

    try {
      await sendChatMessage(
        input,
        sessionId,
        "english",
        (fullMessage) => {
          // Update bot message as chunks arrive
          setIsLoading(false);
          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            updated[lastIndex] = { sender: "bot", text: fullMessage };
            return updated;
          });
        },
        (responseText, references) => {
          // Stream completed - update with final parsed response
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
          console.error("❌ Chat error in callback:", error);
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
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    // Skip empty bot placeholder while loading
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
  };

  const renderEmptyState = () => {
    if (isLoading && messages.length === 0) return null;

    return (
      <View style={styles.emptyContainer}>
        <Image
          source={require("@/assets/images/deen-logo-icon.png")}
          style={styles.emptyLogo}
        />
        <ThemedText type="title" style={styles.emptyTitle}>
          How can I help you today?
        </ThemedText>
        <ThemedText
          style={[styles.emptySubtitle, { color: colors.textSecondary }]}
        >
          Ask any question about Islam and I'll do my best to provide a helpful
          response.
        </ThemedText>
        <SuggestedQuestions onQuestionClick={handleSuggestedQuestion} />
      </View>
    );
  };

  const renderFooter = () => {
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
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Header */}
        <BlurView
          intensity={60}
          tint={colorScheme === "dark" ? "dark" : "light"}
          style={[
            styles.header,
            {
              borderBottomColor: colors.border,
              paddingTop: headerPaddingTop,
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
                <Ionicons name="add" size={20} color={colors.text} />
              )}
            </TouchableOpacity>
          </View>
        </BlurView>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(_, index) => `message-${index}`}
          contentContainerStyle={[
            styles.messagesList,
            { paddingTop: messagesPaddingTop },
          ]}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        />
        {showScrollButton && (
          <TouchableOpacity
            style={[
              styles.scrollToBottomButton,
              {
                backgroundColor: colors.primary,
              },
            ]}
            onPress={scrollToBottom}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-down" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={handleSendMessage}
        isLoading={isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    paddingBottom: 12,
    paddingHorizontal: 16,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  messagesList: {
    paddingBottom: 8,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 60,
    gap: 16,
  },
  emptyLogo: {
    width: 64,
    height: 64,
    opacity: 0.5,
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
  scrollToBottomButton: {
    position: "absolute",
    bottom: 80,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
});
