/**
 * Chat screen - Main chat interface with streaming AI responses
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ChatEmptyState from "@/components/chat/ChatEmptyState";
import ChatHistoryDrawer from "@/components/chat/ChatHistoryDrawer";
import ChatInput from "@/components/chat/ChatInput";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatWebScreen from "@/components/chat/ChatWebScreen";
import ElaborationModal from "@/components/hikmah/ElaborationModal";
import { ThemedText } from "@/components/themed-text";
import LoadingIndicator from "@/components/ui/LoadingIndicator";
import PlatformBlurView from "@/components/ui/PlatformBlurView";
import { WebBackHomeButton } from "@/components/ui/WebBackHomeButton";
import { Colors } from "@/constants/theme";
import { useChatController } from "@/hooks/useChatController";
import { useAuth } from "@/hooks/useAuth";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useWebGlobalTextInputShortcuts } from "@/hooks/use-web-global-text-input-shortcuts";
import type { Message } from "@/utils/chatStorage";
import { CHAT_LANGUAGES } from "@/utils/chatLanguage";

// Estimated input container height for padding calculations
const INPUT_CONTAINER_HEIGHT = 70;
const HEADER_HORIZONTAL_PADDING = 20;
const HEADER_BOTTOM_PADDING = 12;
const HEADER_ACTION_HIT_SLOP = { top: 12, right: 12, bottom: 12, left: 12 };

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { isWeb, isDesktop, pagePadding, contentMaxWidth, readingMaxWidth } =
    useResponsiveLayout();
  const blurIntensity = Platform.OS === "android" ? 120 : 60;
  const headerOverlayColor =
    colorScheme === "dark" ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.65)";

  const { status: authStatus } = useAuth();
  const isAuthenticated = authStatus === "signedIn";

  const {
    canSelectLanguage,
    displayedStreamingText,
    handleGlobalTextInput,
    handleNewChat,
    handleOpenLanguagePicker,
    handleSelectChat,
    handleSelectLanguage,
    handleSelectionChange,
    handleSendMessage,
    handleSuggestedQuestion,
    hasSelection,
    input,
    inputFocusRequest,
    isLanguageModalVisible,
    isLoading,
    isNewChatLoading,
    isStreaming,
    messages,
    selectedLanguage,
    selectedLanguageLabel,
    selection,
    sessionId,
    setInput,
    setIsLanguageModalVisible,
    showSuggestions,
    statusMessage,
  } = useChatController();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isElaborationModalVisible, setIsElaborationModalVisible] =
    useState(false);
  const flatListRef = useRef<FlatList<Message>>(null);

  const headerPaddingTop = Math.max(
    insets.top + 12,
    Platform.OS === "ios" ? 64 : 32
  );
  const messagesPaddingTop = headerPaddingTop + 56;

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";

    const showSub = Keyboard.addListener(showEvent, () => {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => {
      showSub.remove();
    };
  }, []);

  const handleDrawerSelectChat = useCallback(
    async (selectedSessionId: string) => {
      const didSelect = await handleSelectChat(selectedSessionId);
      if (didSelect) {
        setIsDrawerOpen(false);
      }
    },
    [handleSelectChat]
  );

  useWebGlobalTextInputShortcuts({
    canSubmit: !!input.trim() && !!sessionId,
    disabled:
      isLoading ||
      isLanguageModalVisible ||
      isDrawerOpen ||
      isElaborationModalVisible,
    onSubmit: handleSendMessage,
    onTextInput: handleGlobalTextInput,
  });

  const renderMessage = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
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

      const messageToRender: Message = isThisStreaming
        ? { ...item, text: displayedStreamingText }
        : item;

      return (
        <View
          style={[
            styles.messageRail,
            isDesktop && { maxWidth: readingMaxWidth },
          ]}
        >
          <ChatMessage
            message={messageToRender}
            onSelectionChange={handleSelectionChange}
            isStreaming={isThisStreaming}
          />
        </View>
      );
    },
    [
      displayedStreamingText,
      handleSelectionChange,
      isDesktop,
      isLoading,
      isStreaming,
      messages.length,
      readingMaxWidth,
    ]
  );

  const bottomPadding = INPUT_CONTAINER_HEIGHT + insets.bottom + 16;
  const screenHeight = Dimensions.get("window").height;
  const emptyStateHeight = Math.max(
    0,
    screenHeight - messagesPaddingTop - bottomPadding - INPUT_CONTAINER_HEIGHT
  );

  const emptyComponent = useMemo(() => {
    if (isLoading && messages.length === 0) return null;

    return (
      <ChatEmptyState
        showSuggestions={showSuggestions}
        onQuestionClick={handleSuggestedQuestion}
        showLanguageSelector={canSelectLanguage}
        selectedLanguageLabel={selectedLanguageLabel}
        selectedLanguage={selectedLanguage}
        onPressLanguageSelector={handleOpenLanguagePicker}
        isLanguageDropdownVisible={isLanguageModalVisible}
        languageOptions={CHAT_LANGUAGES}
        onSelectLanguage={handleSelectLanguage}
        pillBackgroundColor={colors.panel2}
        pillBorderColor={colors.border}
        pillTextColor={colors.text}
        dropdownBackgroundColor={colors.panel}
        dropdownSelectedColor={colors.primary + "18"}
        accentColor={colors.primary}
        textSecondaryColor={colors.textSecondary}
        minHeight={emptyStateHeight}
      />
    );
  }, [
    canSelectLanguage,
    colors.border,
    colors.panel,
    colors.panel2,
    colors.primary,
    colors.text,
    colors.textSecondary,
    emptyStateHeight,
    handleOpenLanguagePicker,
    handleSelectLanguage,
    handleSuggestedQuestion,
    isLanguageModalVisible,
    isLoading,
    messages.length,
    selectedLanguage,
    selectedLanguageLabel,
    showSuggestions,
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
  }, [colors.border, colors.panel, isLoading, statusMessage]);

  const askDeenFab = hasSelection ? (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => setIsElaborationModalVisible(true)}
      style={[
        styles.askDeenFab,
        {
          backgroundColor: colors.panel,
          borderColor: colors.primary,
          bottom: INPUT_CONTAINER_HEIGHT + insets.bottom + 12,
          shadowColor: colors.primary,
        },
      ]}
    >
      <View style={[styles.askDeenFabIcon, { backgroundColor: colors.primary }]}>
        <Image
          source={require("@/assets/images/deen-logo-icon.png")}
          style={{ width: 20, height: 20, tintColor: "#fff" }}
          resizeMode="contain"
        />
      </View>
      <ThemedText style={{ color: colors.primary, fontWeight: "600" }}>
        Ask Deen
      </ThemedText>
    </TouchableOpacity>
  ) : null;

  const elaborationModal = (
    <ElaborationModal
      visible={isElaborationModalVisible}
      onClose={() => setIsElaborationModalVisible(false)}
      contextText={selection.context}
      lessonTitle=""
      treeTitle=""
      lessonSummary=""
      initialQuery={selection.text}
    />
  );

  if (isWeb) {
    return (
      <ChatWebScreen
        askDeenFab={askDeenFab}
        canSelectLanguage={canSelectLanguage}
        colors={colors}
        contentMaxWidth={contentMaxWidth}
        elaborationModal={elaborationModal}
        flatListRef={flatListRef}
        handleDrawerSelectChat={handleDrawerSelectChat}
        handleNewChat={handleNewChat}
        handleOpenLanguagePicker={handleOpenLanguagePicker}
        handleSelectLanguage={handleSelectLanguage}
        handleSendMessage={handleSendMessage}
        handleSuggestedQuestion={handleSuggestedQuestion}
        input={input}
        inputFocusRequest={inputFocusRequest}
        isAuthenticated={isAuthenticated}
        isDrawerOpen={isDrawerOpen}
        isLanguageModalVisible={isLanguageModalVisible}
        isLoading={isLoading}
        isNewChatLoading={isNewChatLoading}
        messages={messages}
        pagePadding={pagePadding}
        readingMaxWidth={readingMaxWidth}
        renderFooter={renderFooter}
        renderMessage={renderMessage}
        screenHeight={screenHeight}
        selectedLanguage={selectedLanguage}
        selectedLanguageLabel={selectedLanguageLabel}
        sessionId={sessionId}
        setInput={setInput}
        setIsDrawerOpen={setIsDrawerOpen}
        showSuggestions={showSuggestions}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Modal
        transparent
        animationType="fade"
        visible={isLanguageModalVisible && !isDesktop}
        onRequestClose={() => setIsLanguageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            activeOpacity={1}
            style={StyleSheet.absoluteFill}
            onPress={() => setIsLanguageModalVisible(false)}
          />
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.panel, borderColor: colors.border },
            ]}
          >
            <ThemedText type="subtitle" style={styles.modalTitle}>
              Choose language
            </ThemedText>
            <View style={styles.modalOptions}>
              {CHAT_LANGUAGES.map((language) => {
                const isSelected = language.value === selectedLanguage;

                return (
                  <TouchableOpacity
                    key={language.value}
                    activeOpacity={0.8}
                    onPress={() => handleSelectLanguage(language.value)}
                    style={[
                      styles.modalOptionRow,
                      { borderColor: colors.border },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.modalOptionLabel,
                        { color: colors.text },
                      ]}
                    >
                      {language.label}
                    </ThemedText>
                    {isSelected ? (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={colors.primary}
                      />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      <PlatformBlurView
        intensity={blurIntensity}
        tint={colorScheme === "dark" ? "dark" : "light"}
        style={[
          styles.header,
          {
            backgroundColor: headerOverlayColor,
            borderBottomColor: colors.border,
            paddingTop: headerPaddingTop,
          },
        ]}
      >
        <View
          style={[
            styles.headerContent,
            isDesktop && { alignSelf: "center", maxWidth: readingMaxWidth },
          ]}
        >
          <View style={styles.headerLeft}>
            <WebBackHomeButton />
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
              Deen Chat
            </ThemedText>
          </View>
        </View>
      </PlatformBlurView>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(_, index) => `message-${index}`}
          contentContainerStyle={[
            styles.messagesList,
            {
              paddingBottom: bottomPadding,
              paddingTop: messagesPaddingTop,
            },
          ]}
          ListEmptyComponent={emptyComponent}
          ListFooterComponent={renderFooter}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          removeClippedSubviews={false}
        />

        <View
          style={[
            styles.inputContainer,
            isDesktop && {
              alignSelf: "center",
              maxWidth: readingMaxWidth,
              width: "100%",
            },
          ]}
        >
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={handleSendMessage}
            isLoading={isLoading}
            focusRequest={inputFocusRequest}
          />
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  askDeenFab: {
    alignItems: "center",
    borderRadius: 24,
    borderWidth: 2,
    elevation: 6,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    position: "absolute",
    right: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    zIndex: 5,
  },
  askDeenFabIcon: {
    alignItems: "center",
    borderRadius: 14,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    left: 0,
    overflow: "hidden",
    paddingBottom: HEADER_BOTTOM_PADDING,
    paddingHorizontal: HEADER_HORIZONTAL_PADDING,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 10,
  },
  headerContent: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  headerLeft: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  headerLogo: {
    height: 28,
    width: 28,
  },
  headerTitle: {
    fontSize: 17,
  },
  inputContainer: {
    borderTopWidth: 0,
  },
  keyboardAvoid: {
    flex: 1,
  },
  loadingBox: {
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: "85%",
    padding: 12,
  },
  loadingContainer: {
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  messageRail: {
    alignSelf: "center",
    width: "100%",
  },
  messagesList: {
    flexGrow: 1,
  },
  modalCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  modalOptionLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  modalOptionRow: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  modalOptions: {
    gap: 6,
  },
  modalOverlay: {
    backgroundColor: "rgba(0,0,0,0.35)",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalTitle: {
    marginBottom: 10,
  },
});
