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
import PlatformBlurView from "@/components/ui/PlatformBlurView";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
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
  fetchSavedChatDetail,
} from "@/utils/api";
import {
  loadMessages,
  saveMessages,
  clearMessages,
  purgeExpiredSessions,
  type Message,
} from "@/utils/chatStorage";
import { useLanguagePreference } from "@/hooks/use-language-preference";
import { LANGUAGES, getLanguageConfig, type LanguageCode } from "@/utils/languageConfig";
import { consumePendingChatPrompt } from "@/utils/pendingChatPrompt";
import { ERROR_MESSAGES, UI_CONSTANTS } from "@/utils/constants";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import { useStreamingText } from "@/hooks/useStreamingText";
import ChatHistoryDrawer from "@/components/chat/ChatHistoryDrawer";
import ElaborationModal from "@/components/hikmah/ElaborationModal";

// Module-level flag: true once the chat screen has mounted at least once in this JS runtime.
// Reset to false on every cold start (new process / OS-kill / dev reload), which is exactly
// when we want to start a fresh chat instead of restoring the previously-active session.
let coldStartHandled = false;

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
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { languageCode, setLanguage, pendingRTLRestart } = useLanguagePreference();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const currentLang = getLanguageConfig(languageCode);

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
        {t("chat.emptyTitle")}
      </ThemedText>
      <ThemedText
        style={[styles.emptySubtitle, { color: textSecondaryColor }]}
      >
        {t("chat.emptySubtitle")}
      </ThemedText>
      {showSuggestions && (
        <>
          {/* Language dropdown */}
          <View style={styles.langDropdownWrapper}>
            <TouchableOpacity
              style={[
                styles.langDropdownTrigger,
                { backgroundColor: colors.panel, borderColor: colors.border },
              ]}
              onPress={() => setIsLangOpen((prev) => !prev)}
              activeOpacity={0.7}
            >
              <Ionicons name="language-outline" size={16} color={colors.textSecondary} />
              <ThemedText style={[styles.langDropdownValue, { color: colors.text }]}>
                {currentLang.nativeName}
              </ThemedText>
              <Ionicons
                name={isLangOpen ? "chevron-up" : "chevron-down"}
                size={14}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {isLangOpen && (
              <View
                style={[
                  styles.langDropdownList,
                  { backgroundColor: colors.panel, borderColor: colors.border },
                ]}
              >
                {LANGUAGES.map((lang, idx) => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.langDropdownItem,
                      idx < LANGUAGES.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                      languageCode === lang.code && { backgroundColor: colors.primary + "18" },
                    ]}
                    onPress={() => {
                      setLanguage(lang.code as LanguageCode);
                      setIsLangOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.langDropdownItemText}>
                      <ThemedText style={[styles.langDropdownNative, { color: colors.text }]}>
                        {lang.nativeName}
                      </ThemedText>
                      <ThemedText style={[styles.langDropdownEnglish, { color: colors.textSecondary }]}>
                        {lang.name}
                      </ThemedText>
                    </View>
                    {languageCode === lang.code && (
                      <Ionicons name="checkmark" size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          {pendingRTLRestart && (
            <View
              style={[
                styles.rtlBanner,
                { backgroundColor: "#fff1f1", borderColor: "#f87171" },
              ]}
            >
              <Ionicons name="warning-outline" size={14} color="#dc2626" />
              <ThemedText style={[styles.rtlBannerText, { color: "#dc2626" }]}>
                {t("settings.languageRestartBanner")}
              </ThemedText>
            </View>
          )}
          </View>

          <SuggestedQuestions onQuestionClick={onQuestionClick} />
        </>
      )}
    </View>
  );
});

EmptyState.displayName = "EmptyState";

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const blurIntensity = Platform.OS === "android" ? 120 : 60;
  const headerOverlayColor =
    colorScheme === "dark" ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.65)";

  const { status: authStatus } = useAuth();
  const isAuthenticated = authStatus === "signedIn";
  const { apiCode } = useLanguagePreference();
  const { t } = useTranslation();

  const headerPaddingTop = Math.max(
    insets.top + 12,
    Platform.OS === "ios" ? 64 : 32
  );
  const messagesPaddingTop = headerPaddingTop + 56;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  // Target text fed by sendChatMessage onChunk; the typewriter hook smooths
  // this into displayedStreamingText for the active streaming bot row.
  const [streamingTarget, setStreamingTarget] = useState("");
  const displayedStreamingText = useStreamingText(streamingTarget, isStreaming);
  const [statusMessage, setStatusMessage] = useState("Thinking...");
  const [isNewChatLoading, setIsNewChatLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selection, setSelection] = useState<{ text: string; context: string }>({ text: "", context: "" });
  const [isElaborationModalVisible, setIsElaborationModalVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // When true, the next session-id-driven message load is skipped. Set in the
  // cold-start branch so we don't overwrite the freshly-emptied messages list
  // with whatever loadMessages() returns for the new (empty) session.
  const skipNextMessageLoadRef = useRef(false);

  const hasSelection = !!selection.text;

  // Track if suggestions should show (separate state to avoid re-renders on every keystroke)
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Update showSuggestions when input changes (debounced effect)
  useEffect(() => {
    const shouldShow = !input.trim();
    if (shouldShow !== showSuggestions) {
      setShowSuggestions(shouldShow);
    }
  }, [input, showSuggestions]);

  // Initialize session: on cold start, force a fresh session and empty chat.
  // On warm remounts (tab switches within the same JS runtime), restore the active session.
  useEffect(() => {
    // Read-then-set synchronously (before any await) so React StrictMode's
    // double-invocation in dev falls into the warm branch on the second pass.
    const isColdStart = !coldStartHandled;
    coldStartHandled = true;

    const initialize = async () => {
      console.log(
        isColdStart
          ? "🚀 Chat screen cold-start — starting fresh session"
          : "🚀 Chat screen warm-mount — restoring active session"
      );
      // Always safe to run; only deletes sessions older than CHAT_EXPIRY_SECONDS.
      await purgeExpiredSessions();

      if (isColdStart) {
        // Fresh session id; also overwrites the persisted "active session" pointer
        // so any future code that reads it sees the new one. Old per-session message
        // blobs under deen:msgs:<oldId>:v1 are intentionally left untouched — history
        // remains available via the ChatHistoryDrawer (server-backed).
        skipNextMessageLoadRef.current = true;
        const freshId = await startNewConversation();
        setSessionId(freshId);
        setMessages([]);
        setShowSuggestions(true);
      } else {
        const sid = await getOrCreateSessionId();
        setSessionId(sid);
      }
    };
    initialize();
  }, []);

  // Pending-prompt handoff from the References tab ("Ask about this"). Runs on
  // every focus of the Chat tab — not just first mount — because Expo Router
  // keeps tab screens mounted across navigations. If a pending prompt is
  // present, start a fresh session and seed the input (do NOT auto-send).
  useFocusEffect(
    useCallback(() => {
      const pendingPrompt = consumePendingChatPrompt();
      if (!pendingPrompt) return;

      let cancelled = false;
      const seedFromReferences = async () => {
        console.log("🚀 Chat screen focus — seeding from References 'Ask about this'");
        skipNextMessageLoadRef.current = true;
        const freshId = await startNewConversation();
        if (cancelled) return;
        setMessages([]);
        setSessionId(freshId);
        setInput(pendingPrompt);
        setShowSuggestions(false);
        setSelection({ text: "", context: "" });
      };
      seedFromReferences();

      return () => {
        cancelled = true;
      };
    }, [])
  );

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
    // On cold-start the initialize effect has already set messages to []
    // for the freshly-created session — skip the load so we don't re-fetch.
    if (skipNextMessageLoadRef.current) {
      skipNextMessageLoadRef.current = false;
      return;
    }

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

  const handleSelectionChange = useCallback((sel: { text: string; context: string }) => {
    setSelection(sel);
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
      setSelection({ text: "", context: "" });
    } catch (e) {
      console.error("❌ Failed to start new chat:", e);
    } finally {
      setIsNewChatLoading(false);
    }
  }, [isLoading, isNewChatLoading, sessionId]);

  const handleSelectChat = useCallback(
    async (selectedSessionId: string) => {
      if (isLoading) return;

      try {
        const detail = await fetchSavedChatDetail(selectedSessionId);
        if (!detail) return;

        const hydrated: Message[] = detail.messages.map((m) => ({
          sender: m.role === "user" ? "user" : "bot",
          text: m.content,
        }));

        setMessages(hydrated);
        setSessionId(selectedSessionId);
        setInput("");
        setShowSuggestions(false);
        setSelection({ text: "", context: "" });

        // Warm the local cache so future loads are instant
        await saveMessages(selectedSessionId, hydrated);
      } catch (e) {
        console.error("❌ Failed to load saved chat:", e);
      }

      setIsDrawerOpen(false);
    },
    [isLoading]
  );

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || !sessionId || isLoading) return;

    const userMessage: Message = { sender: "user", text: input };
    const botPlaceholder: Message = { sender: "bot", text: "" };

    setMessages((prev) => [...prev, userMessage, botPlaceholder]);
    setInput("");
    setIsLoading(true);
    setIsStreaming(true);
    // Clear any leftover target from a previous response so the smoother doesn't
    // bleed prior text into the new reveal.
    setStreamingTarget("");
    setStatusMessage("Thinking...");
    setSelection({ text: "", context: "" });
    try {
      await sendChatMessage(
        input,
        sessionId,
        apiCode,
        (fullMessage) => {
          // First chunk has arrived — hide the loading indicator
          setIsLoading(false);
          // Feed the smoother. Do NOT write into messages[] on every chunk —
          // the typewriter renders via displayedStreamingText in renderMessage.
          setStreamingTarget(fullMessage);
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
          setIsStreaming(false);
          // Do NOT reset streamingTarget here — the hook will keep ticking
          // until displayed catches up to target, then stop on its own. The
          // next handleSendMessage call clears it before the new stream starts.
        },
        (error) => {
          console.error("❌ Chat error:", error);
          setIsLoading(false);
          setIsStreaming(false);
          setStreamingTarget("");
          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            updated[lastIndex] = {
              sender: "bot",
              text: ERROR_MESSAGES.CHAT_FAILED,
            };
            return updated;
          });
        },
        (status) => {
          // Show the current agentic step as the loading message
          setStatusMessage(status.message || "Thinking...");
        }
      );
    } catch (error) {
      console.error("❌ Error in handleSendMessage:", error);
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingTarget("");
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
  }, [input, sessionId, apiCode, isLoading]);

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

    const isThisStreaming =
      isStreaming && item.sender === "bot" && index === messages.length - 1;

    // While this specific message is streaming, render the smoothed displayed
    // text instead of whatever's in messages[].text. After streaming completes,
    // messages[].text already holds the final value (set by onComplete) and
    // isThisStreaming flips to false, so the substitution disappears cleanly.
    const messageToRender: Message = isThisStreaming
      ? { ...item, text: displayedStreamingText }
      : item;

    return (
      <ChatMessage
        message={messageToRender}
        onSelectionChange={handleSelectionChange}
        isStreaming={isThisStreaming}
      />
    );
  }, [isLoading, isStreaming, messages.length, handleSelectionChange, displayedStreamingText]);

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
  }, [
    isLoading,
    messages.length,
    showSuggestions,
    handleSuggestedQuestion,
    colors.textSecondary,
    emptyStateHeight,
  ]);

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
          <LoadingIndicator message={statusMessage} />
        </View>
      </View>
    );
  }, [isLoading, statusMessage, colors.panel, colors.border]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
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
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              hitSlop={HEADER_ACTION_HIT_SLOP}
              onPress={() => setIsDrawerOpen((prev) => !prev)}
              activeOpacity={0.7}
            >
              <Ionicons name="menu" size={22} color={colors.text} />
            </TouchableOpacity>
            <Image
              source={require("@/assets/images/deen-logo-icon.png")}
              style={styles.headerLogo}
            />
            <ThemedText type="subtitle" style={styles.headerTitle}>
              {t("chat.title")}
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
                  {t("chat.newChat")}
                </ThemedText>
                <Ionicons name="add" size={20} color={colors.text} />
              </>
            )}
          </TouchableOpacity>
        </View>

      </PlatformBlurView>

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

      {/* Ask Deen FAB — visible only when text is selected */}
      {hasSelection && (
        <TouchableOpacity
          style={[
            styles.askDeenFab,
            {
              backgroundColor: colors.panel,
              borderColor: colors.primary,
              shadowColor: colors.primary,
              bottom: INPUT_CONTAINER_HEIGHT + insets.bottom + 12,
            },
          ]}
          onPress={() => setIsElaborationModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={[styles.askDeenFabIcon, { backgroundColor: colors.primary }]}>
            <Image
              source={require("@/assets/images/deen-logo-icon.png")}
              style={{ width: 20, height: 20, tintColor: "#fff" }}
              resizeMode="contain"
            />
          </View>
          <ThemedText style={{ fontWeight: "600", color: colors.primary }}>
            Ask Deen
          </ThemedText>
        </TouchableOpacity>
      )}

      {/* Elaboration Modal */}
      <ElaborationModal
        visible={isElaborationModalVisible}
        onClose={() => setIsElaborationModalVisible(false)}
        contextText={selection.context}
        lessonTitle=""
        treeTitle=""
        lessonSummary=""
        initialQuery={selection.text}
      />

      {/* Chat history side drawer — renders as absolute overlay */}
      <ChatHistoryDrawer
        visible={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        activeSessionId={sessionId}
        isAuthenticated={isAuthenticated}
        isLoadingChat={isLoading}
      />
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
  askDeenFab: {
    position: "absolute",
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 5,
  },
  askDeenFabIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  langDropdownWrapper: {
    width: "100%",
    paddingHorizontal: 16,
    marginBottom: 4,
    zIndex: 10,
  },
  langDropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  langDropdownValue: {
    flex: 1,
    fontSize: 14,
  },
  langDropdownList: {
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  langDropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  langDropdownItemText: {
    flex: 1,
  },
  langDropdownNative: {
    fontSize: 14,
    fontWeight: "500",
  },
  langDropdownEnglish: {
    fontSize: 12,
    marginTop: 1,
  },
  rtlBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  rtlBannerText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
});
