/**
 * Chat message component
 * Displays individual user or bot messages
 */

import React, { useState } from "react";
import { View, StyleSheet, Image, TouchableOpacity } from "react-native";
import Markdown from "react-native-markdown-display";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import ReferencesModal from "./ReferencesModal";
import type { Message } from "@/utils/chatStorage";

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isUser = message.sender === "user";
  const [showReferencesModal, setShowReferencesModal] = useState(false);

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
      <View style={styles.botMessageContainer}>
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
          <Markdown
            style={{
              body: {
                color: colors.text,
                fontSize: 15,
                lineHeight: 25,
              },
              paragraph: {
                marginTop: 15,
                marginBottom: 15,
                lineHeight: 25,
              },
              heading1: {
                fontSize: 24,
                fontWeight: "700",
                marginTop: 24,
                marginBottom: 12,
                lineHeight: 31,
                color: colors.text,
              },
              heading2: {
                fontSize: 20,
                fontWeight: "700",
                marginTop: 22,
                marginBottom: 11,
                lineHeight: 28,
                color: colors.text,
              },
              heading3: {
                fontSize: 18,
                fontWeight: "700",
                marginTop: 20,
                marginBottom: 10,
                lineHeight: 25,
                color: colors.text,
              },
              heading4: {
                fontSize: 16,
                fontWeight: "700",
                marginTop: 18,
                marginBottom: 9,
                color: colors.text,
              },
              heading5: {
                fontSize: 15,
                fontWeight: "700",
                marginTop: 16,
                marginBottom: 8,
                color: colors.text,
              },
              heading6: {
                fontSize: 14,
                fontWeight: "700",
                marginTop: 14,
                marginBottom: 7,
                color: colors.text,
              },
              strong: {
                fontWeight: "700",
                color: colors.text,
              },
              em: {
                fontStyle: "italic",
              },
              link: {
                color: colors.primary,
                textDecorationLine: "underline",
              },
              bullet_list: {
                marginTop: 15,
                marginBottom: 15,
              },
              ordered_list: {
                marginTop: 15,
                marginBottom: 15,
              },
              list_item: {
                marginTop: 8,
                marginBottom: 8,
                lineHeight: 24,
              },
              code_inline: {
                backgroundColor: colors.panel2,
                color: colorScheme === "dark" ? "#d1fae5" : "#059669",
                paddingHorizontal: 6,
                paddingVertical: 3,
                borderRadius: 4,
                fontFamily: "monospace",
                fontSize: 14,
              },
              code_block: {
                backgroundColor: colors.panel2,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 12,
                padding: 12,
                marginTop: 15,
                marginBottom: 15,
                fontFamily: "monospace",
              },
              fence: {
                backgroundColor: colors.panel2,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 12,
                padding: 12,
                marginTop: 15,
                marginBottom: 15,
                fontFamily: "monospace",
              },
              blockquote: {
                backgroundColor: "transparent",
                borderLeftColor: colors.primary,
                borderLeftWidth: 4,
                paddingLeft: 15,
                marginTop: 15,
                marginBottom: 15,
                fontStyle: "italic",
                color: colors.textSecondary,
              },
              hr: {
                backgroundColor: colors.border,
                height: 1,
                marginTop: 30,
                marginBottom: 30,
              },
            }}
          >
            {message.text}
          </Markdown>
        </View>
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
              onPress={() => setShowReferencesModal(true)}
              activeOpacity={0.7}
            >
              <ThemedText
                style={[styles.referencesText, { color: colors.textSecondary }]}
              >
                {message.references.length} reference
                {message.references.length !== 1 ? "s" : ""} available
              </ThemedText>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.primary}
                style={styles.chevronIcon}
              />
            </TouchableOpacity>
            <ReferencesModal
              visible={showReferencesModal}
              onClose={() => setShowReferencesModal(false)}
              references={message.references}
            />
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
  referencesText: {
    fontSize: 12,
    flex: 1,
  },
  chevronIcon: {
    marginLeft: 8,
  },
});
