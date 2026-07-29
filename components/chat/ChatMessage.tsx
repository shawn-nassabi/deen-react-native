/**
 * Chat message component
 * Displays individual user or bot messages
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import { View, StyleSheet, Image, Platform, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import ReferencesContainer from "@/components/references/ReferencesContainer";
import ReferencesModal from "./ReferencesModal";
import ChatMessageMarkdownRenderer from "./ChatMessageMarkdownRenderer";
import ChatMessageWebView from "./ChatMessageWebView";
import type { Message } from "@/utils/chatStorage";

interface ChatMessageProps {
  message: Message;
  onSelectionChange?: (selection: { text: string; context: string }) => void;
  isStreaming?: boolean;
}

export default function ChatMessage({ message, onSelectionChange, isStreaming = false }: ChatMessageProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isUser = message.sender === "user";
  const [showReferencesModal, setShowReferencesModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isWeb = Platform.OS === "web";

  const referenceGroups = useMemo(() => {
    const allReferences = Array.isArray(message.references)
      ? message.references
      : [];
    const shia = allReferences.filter(
      (ref) => String(ref.sect || "").toLowerCase() === "shia"
    );
    const sunni = allReferences.filter(
      (ref) => String(ref.sect || "").toLowerCase() === "sunni"
    );

    return {
      allReferences,
      results: { shia, sunni },
      totalCounts: {
        shia: shia.length,
        sunni: sunni.length,
      },
    };
  }, [message.references]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(message.text);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.warn("⚠️ copy to clipboard failed:", e);
    }
  };

  if (isUser) {
    return (
      <View style={styles.messageRow}>
        <View style={styles.userMessageContainer}>
          <View
            style={[
              styles.userMessage,
              {
                backgroundColor: colors.primary,
              },
            ]}
          >
            <ThemedText style={styles.userLabel}>You</ThemedText>
            <ThemedText style={styles.userText}>{message.text}</ThemedText>
          </View>
        </View>
      </View>
    );
  }

  // Bot message
  return (
    <View style={styles.messageRow}>
      <View
        style={[
          styles.botMessageContainer,
          isWeb && styles.webBotMessageContainer,
        ]}
      >
        <View style={styles.botHeader}>
          <Image
            source={require("@/assets/images/deen-logo-icon.png")}
            style={styles.botLogo}
          />
          <ThemedText style={[styles.botName, { color: colors.primary }]}>
            Deen
          </ThemedText>
        </View>
        <View
          style={[
            styles.botMessage,
            {
              backgroundColor: colors.panel,
              borderColor: colors.border,
            },
          ]}
        >
          {Platform.OS === "web" ? (
            <ChatMessageMarkdownRenderer
              markdown={message.text}
              onSelectionChange={onSelectionChange}
            />
          ) : (
            <ChatMessageWebView
              markdown={message.text}
              onSelectionChange={onSelectionChange}
            />
          )}
        </View>
        {!isStreaming && (
          <TouchableOpacity
            style={[
              styles.copyButton,
              { backgroundColor: colors.panel2, borderColor: colors.border },
            ]}
            onPress={handleCopy}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={
              copied ? "Response copied to clipboard" : "Copy response to clipboard"
            }
          >
            <Ionicons
              name={copied ? "checkmark" : "copy-outline"}
              size={16}
              color={colors.primary}
              style={styles.copyIcon}
            />
            <ThemedText
              style={[styles.copyButtonText, { color: colors.textSecondary }]}
            >
              {copied ? "Copied" : "Copy"}
            </ThemedText>
          </TouchableOpacity>
        )}
        {message.references && message.references.length > 0 && (
          <>
            <TouchableOpacity
              style={[
                styles.referencesHint,
                {
                  backgroundColor: colors.panel2,
                  borderColor: colors.border,
                },
              ]}
              onPress={() =>
                setShowReferencesModal((current) =>
                  isWeb ? !current : true
                )
              }
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={
                isWeb ? { expanded: showReferencesModal } : undefined
              }
            >
              <ThemedText
                style={[styles.referencesText, { color: colors.textSecondary }]}
              >
                {isWeb && showReferencesModal
                  ? "Hide references"
                  : `${message.references.length} reference${
                      message.references.length !== 1 ? "s" : ""
                    } available`}
              </ThemedText>
              <Ionicons
                name={
                  isWeb
                    ? showReferencesModal
                      ? "chevron-up"
                      : "chevron-down"
                    : "chevron-forward"
                }
                size={16}
                color={colors.primary}
                style={styles.chevronIcon}
              />
            </TouchableOpacity>
            {isWeb && showReferencesModal ? (
              <View style={styles.inlineReferencesPanel}>
                <ReferencesContainer
                  results={referenceGroups.results}
                  isLoading={false}
                  searchPerformed={true}
                  submittedQuery="Chat response references"
                  bottomPadding={0}
                  topPadding={0}
                  variant="webPanel"
                  totalCounts={referenceGroups.totalCounts}
                  embedded
                />
              </View>
            ) : null}
            {!isWeb ? (
              <ReferencesModal
                visible={showReferencesModal}
                onClose={() => setShowReferencesModal(false)}
                references={referenceGroups.allReferences}
              />
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  messageRow: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  userMessageContainer: {
    alignItems: "flex-end",
  },
  userMessage: {
    maxWidth: "85%",
    borderRadius: 16,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    opacity: 0.9,
    marginBottom: 4,
    color: "#fff",
  },
  userText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#fff",
  },
  botMessageContainer: {
    maxWidth: "90%",
  },
  webBotMessageContainer: {
    maxWidth: "100%",
    width: "100%",
  },
  botHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  botLogo: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  botName: {
    fontSize: 13,
    fontWeight: "600",
  },
  botMessage: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  referencesHint: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inlineReferencesPanel: {
    marginTop: 10,
    width: "100%",
  },
  referencesText: {
    fontSize: 12,
    flex: 1,
  },
  chevronIcon: {
    marginLeft: 8,
  },
  copyButton: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  copyIcon: {
    marginRight: 6,
  },
  copyButtonText: {
    fontSize: 12,
  },
});
