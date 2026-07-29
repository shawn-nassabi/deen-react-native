import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  StyleSheet,
  TouchableOpacity,
  View,
  type ListRenderItem,
} from "react-native";

import ChatHistoryDrawer from "@/components/chat/ChatHistoryDrawer";
import ChatInput from "@/components/chat/ChatInput";
import WebChatEmptyState from "@/components/chat/WebChatEmptyState";
import { ThemedText } from "@/components/themed-text";
import WebAppHeader from "@/components/ui/WebAppHeader";
import { Colors } from "@/constants/theme";
import type { Message } from "@/utils/chatStorage";
import { CHAT_LANGUAGES, type ChatLanguage } from "@/utils/chatLanguage";

const INPUT_CONTAINER_HEIGHT = 70;
const WEB_HEADER_HEIGHT = 58;
const WEB_DRAWER_WIDTH = 320;
const HEADER_ACTION_HIT_SLOP = { top: 12, right: 12, bottom: 12, left: 12 };

type ChatWebScreenProps = {
  askDeenFab: React.ReactNode;
  canSelectLanguage: boolean;
  colors: typeof Colors.light;
  contentMaxWidth: number;
  elaborationModal: React.ReactNode;
  flatListRef: React.RefObject<FlatList<Message> | null>;
  handleDrawerSelectChat: (sessionId: string) => Promise<void>;
  handleNewChat: () => Promise<void>;
  handleOpenLanguagePicker: () => void;
  handleSelectLanguage: (language: ChatLanguage) => Promise<void>;
  handleSendMessage: () => Promise<void>;
  handleSuggestedQuestion: (question: string) => void;
  input: string;
  inputFocusRequest: number;
  isAuthenticated: boolean;
  isDrawerOpen: boolean;
  isLanguageModalVisible: boolean;
  isLoading: boolean;
  isNewChatLoading: boolean;
  messages: Message[];
  pagePadding: number;
  readingMaxWidth: number;
  renderFooter: () => React.ReactElement | null;
  renderMessage: ListRenderItem<Message>;
  screenHeight: number;
  selectedLanguage: ChatLanguage;
  selectedLanguageLabel: string;
  sessionId: string | null;
  setInput: (value: string) => void;
  setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  showSuggestions: boolean;
};

export default function ChatWebScreen({
  askDeenFab,
  canSelectLanguage,
  colors,
  contentMaxWidth,
  elaborationModal,
  flatListRef,
  handleDrawerSelectChat,
  handleNewChat,
  handleOpenLanguagePicker,
  handleSelectLanguage,
  handleSendMessage,
  handleSuggestedQuestion,
  input,
  inputFocusRequest,
  isAuthenticated,
  isDrawerOpen,
  isLanguageModalVisible,
  isLoading,
  isNewChatLoading,
  messages,
  pagePadding,
  readingMaxWidth,
  renderFooter,
  renderMessage,
  screenHeight,
  selectedLanguage,
  selectedLanguageLabel,
  sessionId,
  setInput,
  setIsDrawerOpen,
  showSuggestions,
}: ChatWebScreenProps) {
  const isNewChatDisabled = isLoading || isNewChatLoading;
  const webContentOffset = isDrawerOpen ? WEB_DRAWER_WIDTH : 0;

  const webEmptyStateHeight = Math.max(
    300,
    screenHeight - WEB_HEADER_HEIGHT - INPUT_CONTAINER_HEIGHT - 220
  );

  const webEmptyComponent = useMemo(() => {
    if (isLoading && messages.length === 0) return null;

    return (
      <WebChatEmptyState
        minHeight={webEmptyStateHeight}
        onQuestionClick={handleSuggestedQuestion}
        showSuggestions={showSuggestions}
        textSecondaryColor={colors.textSecondary}
      />
    );
  }, [
    colors.textSecondary,
    handleSuggestedQuestion,
    isLoading,
    messages.length,
    showSuggestions,
    webEmptyStateHeight,
  ]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <WebAppHeader
        backHitSlop={HEADER_ACTION_HIT_SLOP}
        maxWidth={contentMaxWidth}
        paddingHorizontal={pagePadding}
        title="Deen Chat"
      />

      <KeyboardAvoidingView style={styles.keyboardAvoid}>
        <View
          style={[
            styles.main,
            {
              marginLeft: webContentOffset,
              paddingHorizontal: pagePadding,
              paddingTop: WEB_HEADER_HEIGHT + 10,
            },
          ]}
        >
          <View style={[styles.actionRail, { maxWidth: contentMaxWidth }]}>
            <TouchableOpacity
              accessibilityLabel={
                isDrawerOpen ? "Hide past chats" : "Show past chats"
              }
              accessibilityRole="button"
              activeOpacity={0.75}
              onPress={() => setIsDrawerOpen((prev) => !prev)}
              style={[
                styles.outlineButton,
                {
                  backgroundColor: colors.panel,
                  borderColor: colors.border,
                },
              ]}
            >
              <ThemedText
                style={[styles.outlineButtonText, { color: colors.text }]}
              >
                {isDrawerOpen ? "Hide chats" : "Show chats"}
              </ThemedText>
            </TouchableOpacity>

            <View style={styles.rightControls}>
              <View style={styles.languageWrap}>
                <TouchableOpacity
                  accessibilityLabel="Choose chat language"
                  accessibilityRole="button"
                  activeOpacity={0.75}
                  disabled={!canSelectLanguage}
                  onPress={handleOpenLanguagePicker}
                  style={[
                    styles.outlineButton,
                    {
                      backgroundColor: colors.panel,
                      borderColor: colors.border,
                      opacity: canSelectLanguage ? 1 : 0.55,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.outlineButtonText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {selectedLanguageLabel}
                  </ThemedText>
                  <Ionicons
                    name={
                      isLanguageModalVisible
                        ? "chevron-up"
                        : "chevron-down"
                    }
                    size={14}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>

                {isLanguageModalVisible && canSelectLanguage ? (
                  <View
                    style={[
                      styles.languageMenu,
                      {
                        backgroundColor: colors.panel,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    {CHAT_LANGUAGES.map((language) => {
                      const isSelected = language.value === selectedLanguage;

                      return (
                        <TouchableOpacity
                          key={language.value}
                          activeOpacity={0.75}
                          onPress={() => handleSelectLanguage(language.value)}
                          style={[
                            styles.languageMenuRow,
                            isSelected && {
                              backgroundColor: colors.primary + "18",
                            },
                          ]}
                        >
                          <ThemedText
                            style={[
                              styles.languageMenuText,
                              {
                                color: isSelected
                                  ? colors.primary
                                  : colors.text,
                              },
                            ]}
                          >
                            {language.label}
                          </ThemedText>
                          {isSelected ? (
                            <Ionicons
                              name="checkmark"
                              size={15}
                              color={colors.primary}
                            />
                          ) : null}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : null}
              </View>

              <TouchableOpacity
                accessibilityLabel="Start new chat"
                accessibilityRole="button"
                activeOpacity={0.75}
                disabled={isNewChatDisabled}
                onPress={handleNewChat}
                style={[
                  styles.outlineButton,
                  {
                    backgroundColor: colors.panel,
                    borderColor: colors.border,
                    opacity: isNewChatDisabled ? 0.55 : 1,
                  },
                ]}
              >
                <ThemedText
                  style={[styles.outlineButtonText, { color: colors.text }]}
                >
                  New chat
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(_, index) => `message-${index}`}
            style={styles.messages}
            contentContainerStyle={[
              styles.messagesList,
              {
                paddingBottom: 24,
              },
            ]}
            ListEmptyComponent={webEmptyComponent}
            ListFooterComponent={renderFooter}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            removeClippedSubviews={false}
          />

          <View style={[styles.inputRail, { maxWidth: readingMaxWidth }]}>
            <ChatInput
              value={input}
              onChange={setInput}
              onSubmit={handleSendMessage}
              isLoading={isLoading}
              placeholder="Ask Deen anything..."
              focusRequest={inputFocusRequest}
            />
            <View style={styles.inputHintRow}>
              <ThemedText
                style={[styles.inputHintText, { color: colors.textSecondary }]}
              >
                Press
              </ThemedText>
              <ThemedText
                style={[
                  styles.inputKey,
                  { backgroundColor: colors.panel, color: colors.text },
                ]}
              >
                Enter
              </ThemedText>
              <ThemedText
                style={[styles.inputHintText, { color: colors.textSecondary }]}
              >
                to send ·
              </ThemedText>
              <ThemedText
                style={[
                  styles.inputKey,
                  { backgroundColor: colors.panel, color: colors.text },
                ]}
              >
                Shift + Enter
              </ThemedText>
              <ThemedText
                style={[styles.inputHintText, { color: colors.textSecondary }]}
              >
                for new line
              </ThemedText>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {askDeenFab}
      {elaborationModal}

      <ChatHistoryDrawer
        visible={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSelectChat={handleDrawerSelectChat}
        onNewChat={handleNewChat}
        activeSessionId={sessionId}
        isAuthenticated={isAuthenticated}
        isLoadingChat={isLoading}
        presentation="inline"
        showNewChatButton={false}
        title="Past chats"
        subtitle="Select a chat to continue that session"
        topOffset={WEB_HEADER_HEIGHT}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actionRail: {
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    zIndex: 15,
  },
  container: {
    flex: 1,
  },
  inputHintRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: 2,
  },
  inputHintText: {
    fontSize: 12,
  },
  inputKey: {
    borderRadius: 4,
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 11,
    overflow: "hidden",
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  inputRail: {
    alignSelf: "center",
    paddingBottom: 0,
    width: "100%",
  },
  keyboardAvoid: {
    flex: 1,
  },
  languageMenu: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 6,
    position: "absolute",
    right: 0,
    top: 38,
    width: 170,
    zIndex: 40,
  },
  languageMenuRow: {
    alignItems: "center",
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 36,
    paddingHorizontal: 10,
  },
  languageMenuText: {
    fontSize: 13,
    fontWeight: "500",
  },
  languageWrap: {
    position: "relative",
    zIndex: 30,
  },
  main: {
    flex: 1,
    paddingBottom: 8,
  },
  messages: {
    flex: 1,
    marginTop: 48,
  },
  messagesList: {
    flexGrow: 1,
  },
  outlineButton: {
    alignItems: "center",
    borderRadius: 7,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    minHeight: 32,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  outlineButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  rightControls: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
});
