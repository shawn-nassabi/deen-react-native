import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Modal,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/hooks/useAuth";
import { elaborateSelectionStream, ElaborationPayload } from "@/utils/api";
import * as Haptics from "expo-haptics";
import Markdown from "react-native-markdown-display";

interface ElaborationModalProps {
  visible: boolean;
  onClose: () => void;
  contextText: string;
  lessonTitle: string;
  treeTitle: string;
  lessonSummary: string;
  initialQuery?: string; // Optional initial query (e.g. selected text)
}

export default function ElaborationModal({
  visible,
  onClose,
  contextText,
  lessonTitle,
  treeTitle,
  lessonSummary,
  initialQuery,
}: ElaborationModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const hasAutoSentRef = useRef(false);

  useEffect(() => {
    if (visible) {
      setQuery(initialQuery || "");
      setResponse("");
      setError("");
      hasAutoSentRef.current = false;

      if (initialQuery) {
        // Auto-send if we have an initial query (selected text)
        handleAsk(initialQuery);
      } else {
        setLoading(false);
      }
    }
  }, [visible, initialQuery]);

  const handleAsk = async (textToAsk: string) => {
    if (!textToAsk.trim()) return;

    Keyboard.dismiss();
    setLoading(true);
    setResponse("");
    setError("");
    hasAutoSentRef.current = true;

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const userId = user?.email || user?.sub;
    if (!userId) {
      setLoading(false);
      setError("Please sign in again to continue.");
      return;
    }

    const payload: ElaborationPayload = {
      selected_text: textToAsk,
      context_text: contextText,
      hikmah_tree_name: treeTitle,
      lesson_name: lessonTitle,
      lesson_summary: lessonSummary,
      user_id: userId,
    };

    try {
      await elaborateSelectionStream(payload, (chunk) => {
        setResponse(chunk);
      });
    } catch (err: any) {
      if (!err.message?.includes("aborted")) {
        console.error("Elaboration failed:", err);
        setError(
          "Sorry, I couldn't get an answer right now. Please try again."
        );
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleClose = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <ThemedText type="subtitle">Ask Deen</ThemedText>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          {/* Selected Text Preview (Only if auto-sent) */}
          {initialQuery && (
            <View
              style={[
                styles.selectedTextPreview,
                { backgroundColor: colors.panel2, borderColor: colors.border },
              ]}
            >
              <ThemedText
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  marginBottom: 4,
                }}
              >
                SELECTED TEXT
              </ThemedText>
              <ThemedText style={{ fontStyle: "italic", color: colors.text }}>
                {`"${initialQuery}"`}
              </ThemedText>
            </View>
          )}

          {/* Introduction / Context (Only if NOT auto-sent) */}
          {!initialQuery && !response && !loading && !error && (
            <View style={[styles.intro, { backgroundColor: colors.panel }]}>
              <Ionicons name="sparkles" size={24} color={colors.primary} />
              <ThemedText style={{ textAlign: "center", marginTop: 12 }}>
                Ask a question about this lesson or ask for an elaboration on a
                specific concept.
              </ThemedText>
            </View>
          )}

          {/* Loading State */}
          {loading && !response && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText
                style={{ marginTop: 16, color: colors.textSecondary }}
              >
                Thinking...
              </ThemedText>
            </View>
          )}

          {/* Response */}
          {response ? (
            <View
              style={[
                styles.responseCard,
                { backgroundColor: colors.panel, borderColor: colors.border },
              ]}
            >
              <View style={styles.botHeader}>
                <View
                  style={[styles.botIcon, { backgroundColor: colors.primary }]}
                >
                  <Image
                    source={require("@/assets/images/deen-logo-icon.png")}
                    style={{ width: 16, height: 16, tintColor: "#fff" }}
                    resizeMode="contain"
                  />
                </View>
                <ThemedText type="defaultSemiBold">Deen AI</ThemedText>
              </View>
              <Markdown
                style={{
                  body: { color: colors.text, fontSize: 16, lineHeight: 24 },
                  paragraph: { marginBottom: 12 },
                }}
              >
                {response}
              </Markdown>
              {loading && (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                  style={{ alignSelf: "flex-start", marginTop: 8 }}
                />
              )}
            </View>
          ) : null}

          {/* Error */}
          {error ? (
            <View
              style={[
                styles.errorCard,
                { backgroundColor: colors.errorBackground },
              ]}
            >
              <ThemedText style={{ color: colors.error }}>{error}</ThemedText>
            </View>
          ) : null}
        </ScrollView>

        {/* Input Area - Hidden if auto-sent (selected text mode) */}
        {!initialQuery && (
          <View
            style={[
              styles.inputContainer,
              { borderTopColor: colors.border, backgroundColor: colors.panel },
            ]}
          >
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Ask about this lesson..."
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={setQuery}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor: query.trim()
                    ? colors.primary
                    : colors.border,
                },
              ]}
              disabled={!query.trim() || loading}
              onPress={() => handleAsk(query)}
            >
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color={query.trim() ? "#fff" : colors.textSecondary}
                />
              ) : (
                <Ionicons
                  name="arrow-up"
                  size={20}
                  color={query.trim() ? "#fff" : colors.textSecondary}
                />
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  intro: {
    padding: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  responseCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  botHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  botIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  errorCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  inputContainer: {
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 16,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedTextPreview: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
});
