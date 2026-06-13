/**
 * Reference item component
 * Displays individual reference with expandable text and metadata
 * Includes left-to-right reveal animation on mount
 * Condensed by default with tap-to-expand functionality
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  LayoutAnimation,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { setPendingChatPrompt } from "@/utils/pendingChatPrompt";

interface ReferenceMetadata {
  type?: "hadith" | "quran";
  text?: string;
  text_ar?: string;
  author?: string;
  reference?: string;
  collection?: string;
  volume?: string;
  book_number?: string;
  book_title?: string;
  chapter_number?: string;
  chapter_title?: string;
  hadith_no?: string;
  grade_en?: string;
  surah_name?: string;
  title?: string;
  verses_covered?: string;
  starting_verse?: string;
  ending_verse?: string;
  quran_translation?: string;
  tafsir_text?: string;
}

interface ReferenceItemProps {
  reference: ReferenceMetadata;
  type: "shia" | "sunni";
  animationDelay?: number;
}

export default function ReferenceItem({
  reference,
  type,
  animationDelay = 0,
}: ReferenceItemProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Animation values for reveal
  const translateX = useRef(new Animated.Value(-50)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered left-to-right reveal animation
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 400,
        delay: animationDelay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay: animationDelay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [animationDelay]);

  const metadata = reference || {};
  const isQuran =
    metadata.type === "quran" || Boolean(metadata.surah_name);
  const en = (metadata.text || "").trim();
  const ar = (metadata.text_ar || "").trim();
  const quranTranslation = (metadata.quran_translation || "").trim();
  const tafsirText = (metadata.tafsir_text || "").trim();
  const quranVerseLabel =
    metadata.verses_covered ||
    (metadata.starting_verse && metadata.ending_verse
      ? `${metadata.starting_verse}-${metadata.ending_verse}`
      : metadata.starting_verse || metadata.ending_verse);

  const isEmpty = (value: any) =>
    !value ||
    String(value).trim() === "" ||
    String(value).trim() === "N/A" ||
    String(value).trim() === "unspecified";

  // Build condensed preview with essential metadata
  const buildHadithMetadataLine = () => {
    const parts = [];
    
    // Primary identifiers
    if (metadata.collection) parts.push(metadata.collection);
    if (metadata.author) parts.push(metadata.author);
    if (metadata.hadith_no) parts.push(`Hadith #${metadata.hadith_no}`);
    
    return parts.filter(Boolean).join(" • ");
  };

  const buildHadithSecondaryLine = () => {
    const parts = [];
    
    // Secondary details
    if (metadata.chapter_number) parts.push(`Ch. ${metadata.chapter_number}`);
    if (metadata.chapter_title) parts.push(metadata.chapter_title);
    if (metadata.book_title) parts.push(metadata.book_title);
    if (metadata.volume) parts.push(`Vol. ${metadata.volume}`);
    
    return parts.filter(Boolean).join(" • ");
  };

  const buildQuranMetadataLine = () => {
    const parts = [];
    if (metadata.surah_name) parts.push(metadata.surah_name);
    if (quranVerseLabel) parts.push(`Verses ${quranVerseLabel}`);
    if (metadata.title) parts.push(metadata.title);
    return parts.filter(Boolean).join(" • ");
  };

  const buildQuranSecondaryLine = () => {
    const parts = [];
    if (metadata.author) parts.push(metadata.author);
    if (metadata.collection) parts.push(metadata.collection);
    if (metadata.volume) parts.push(`Vol. ${metadata.volume}`);
    return parts.filter(Boolean).join(" • ");
  };

  const metadataLine1 = isQuran
    ? buildQuranMetadataLine() || "Quran Reference"
    : buildHadithMetadataLine() || "Reference";
  const metadataLine2 = isQuran
    ? buildQuranSecondaryLine()
    : buildHadithSecondaryLine();
  const textPreview = isQuran
    ? (quranTranslation || tafsirText).substring(0, 80) ||
      "No translation available"
    : en
      ? en.substring(0, 80)
      : "No text available";

  const buildCopyText = () => {
    const lines: string[] = [];

    const add = (label: string, value?: string) => {
      if (value && value.trim() && value.trim() !== "N/A" && value.trim() !== "unspecified") {
        lines.push(`${label}: ${value.trim()}`);
      }
    };

    if (isQuran) {
      const header = [
        metadata.surah_name,
        quranVerseLabel ? `Verses ${quranVerseLabel}` : "",
      ].filter(Boolean).join(" — ");
      if (header) lines.push(header);

      add("Title", metadata.title);

      const sourceParts = [
        metadata.author ? `Author: ${metadata.author}` : "",
        metadata.collection ? `Source: ${metadata.collection}` : "",
      ].filter(Boolean);
      if (sourceParts.length) lines.push(sourceParts.join(" | "));

      if (quranTranslation) {
        lines.push("");
        lines.push("Translation:");
        lines.push(quranTranslation);
      }
      if (tafsirText) {
        lines.push("");
        lines.push("Tafsir:");
        lines.push(tafsirText);
      }
    } else {
      // Header line
      const header = [metadata.collection, metadata.hadith_no ? `Hadith #${metadata.hadith_no}` : ""].filter(Boolean).join(" — ");
      if (header) lines.push(header);

      add("Author", metadata.author);
      add("Reference", metadata.reference);

      // Book line
      const bookParts = [
        metadata.book_title,
        metadata.volume ? `Vol. ${metadata.volume}` : "",
        metadata.book_number ? `Book ${metadata.book_number}` : "",
      ].filter(Boolean);
      if (bookParts.length) lines.push(`Book: ${bookParts.join(", ")}`);

      // Chapter line
      const chapterParts = [
        metadata.chapter_number ? `Chapter ${metadata.chapter_number}` : "",
        metadata.chapter_title,
      ].filter(Boolean);
      if (chapterParts.length) lines.push(chapterParts.join(": "));

      add("Grade", metadata.grade_en);

      if (en) {
        lines.push("");
        lines.push(en);
      }
      if (ar) {
        lines.push("");
        lines.push(ar);
      }
    }

    return lines.join("\n");
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(buildCopyText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAskAboutThis = () => {
    const citation = buildCitation();
    const referenceText = isQuran
      ? quranTranslation || tafsirText
      : (reference?.text || "").trim();

    // Template MUST match the spec exactly. Citation is required-ish; if empty,
    // fall back to "this reference" so the sentence stays grammatical.
    const citationSegment = citation || "this reference";
    const referenceKind = isQuran ? "Quran/tafsir reference" : "reference";
    const prompt =
      `Please elaborate on this ${referenceKind} from ${citationSegment}. ` +
      `Help me understand its meaning, the context in which it was given, ` +
      `and how it has traditionally been understood in Islamic scholarship.\n\n` +
      `Reference text: ${referenceText || "(no English text available)"}`;

    setPendingChatPrompt(prompt);
    router.push("/(tabs)/chat");
  };

  // Toggle expand/collapse with animation
  const handleToggle = () => {
    if (Platform.OS === "ios" || Platform.OS === "android") {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setIsExpanded(!isExpanded);
  };

  const buildCitation = () => {
    const parts: string[] = [];

    if (isQuran) {
      if (!isEmpty(metadata.surah_name)) parts.push(String(metadata.surah_name).trim());
      if (!isEmpty(quranVerseLabel)) parts.push(`Verses ${String(quranVerseLabel).trim()}`);
      if (!isEmpty(metadata.title)) parts.push(String(metadata.title).trim());
      if (!isEmpty(metadata.author)) parts.push(String(metadata.author).trim());
      if (!isEmpty(metadata.collection)) parts.push(String(metadata.collection).trim());
      if (!isEmpty(metadata.volume)) parts.push(`Vol. ${String(metadata.volume).trim()}`);
    } else {
      if (!isEmpty(metadata.collection)) parts.push(String(metadata.collection).trim());
      if (!isEmpty(metadata.author)) parts.push(String(metadata.author).trim());
      if (!isEmpty(metadata.hadith_no)) parts.push(`Hadith #${String(metadata.hadith_no).trim()}`);

      const bookNumber = !isEmpty(metadata.book_number) ? String(metadata.book_number).trim() : "";
      const bookTitle = !isEmpty(metadata.book_title) ? String(metadata.book_title).trim() : "";
      if (bookNumber && bookTitle) {
        parts.push(`Book ${bookNumber}: ${bookTitle}`);
      } else if (bookNumber) {
        parts.push(`Book ${bookNumber}`);
      } else if (bookTitle) {
        parts.push(bookTitle);
      }

      const chapterNumber = !isEmpty(metadata.chapter_number) ? String(metadata.chapter_number).trim() : "";
      const chapterTitle = !isEmpty(metadata.chapter_title) ? String(metadata.chapter_title).trim() : "";
      if (chapterNumber && chapterTitle) {
        parts.push(`Ch. ${chapterNumber}: ${chapterTitle}`);
      } else if (chapterNumber) {
        parts.push(`Ch. ${chapterNumber}`);
      } else if (chapterTitle) {
        parts.push(chapterTitle);
      }

      if (!isEmpty(metadata.volume)) parts.push(`Vol. ${String(metadata.volume).trim()}`);
      if (!isEmpty(metadata.reference)) parts.push(String(metadata.reference).trim());
      if (!isEmpty(metadata.grade_en)) parts.push(`Graded ${String(metadata.grade_en).trim()}`);
    }

    return parts.join(" · ");
  };

  return (
    <Animated.View
      style={[
        {
          transform: [{ translateX }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleToggle}
        style={[
          styles.container,
          isExpanded ? styles.expandedContainer : styles.condensedContainer,
          {
            backgroundColor: colors.panel2,
            borderColor: colors.border,
          },
        ]}
      >
        {isExpanded ? (
          // Expanded View - Show all content
          <>
            {/* Citation Paragraph */}
            {(() => {
              const citation = buildCitation();
              return citation ? (
                <Text style={[styles.citationText, { color: colors.textSecondary }]}>
                  {citation}
                </Text>
              ) : null;
            })()}

            {/* Text Section */}
            <View style={styles.textSection}>
              {isQuran ? (
                <>
                  {quranTranslation ? (
                    <>
                      <Text style={[styles.textLabel, { color: colors.textSecondary }]}>
                        Translation
                      </Text>
                      <Text style={[styles.textContent, { color: colors.text }]}>
                        {quranTranslation}
                      </Text>
                    </>
                  ) : null}
                  {tafsirText ? (
                    <>
                      <Text
                        style={[
                          styles.textLabel,
                          { color: colors.textSecondary, marginTop: 12 },
                        ]}
                      >
                        Tafsir
                      </Text>
                      <Text style={[styles.textContent, { color: colors.text }]}>
                        {tafsirText}
                      </Text>
                    </>
                  ) : null}
                  {!quranTranslation && !tafsirText ? (
                    <Text style={[styles.textContent, { color: colors.textSecondary }]}>
                      No translation available
                    </Text>
                  ) : null}
                </>
              ) : (
                <View>
                  {en && (
                    <Text style={[styles.textContent, { color: colors.text }]}>
                      {en}
                    </Text>
                  )}
                  {ar && (
                    <Text
                      style={[
                        styles.textContent,
                        styles.arabicText,
                        { color: colors.text },
                      ]}
                    >
                      {ar}
                    </Text>
                  )}
                  {!en && !ar ? (
                    <Text style={[styles.textContent, { color: colors.textSecondary }]}>
                      No text available
                    </Text>
                  ) : null}
                </View>
              )}
            </View>

            {/* Expanded Footer: Copy + Ask about this + Chevron Up */}
            <View style={styles.expandedFooter}>
              <TouchableOpacity onPress={handleCopy} style={styles.copyButton}>
                <Ionicons
                  name={copied ? "checkmark-done" : "copy-outline"}
                  size={18}
                  color={colors.primary}
                />
                <Text style={[styles.copyButtonText, { color: colors.primary }]}>
                  {copied ? "Copied!" : "Copy"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAskAboutThis}
                style={[
                  styles.askAboutButton,
                  { backgroundColor: colors.primary + "15", borderColor: colors.primary + "55" },
                ]}
                activeOpacity={0.75}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.primary} />
                <Text style={[styles.askAboutButtonText, { color: colors.primary }]}>
                  Ask about this
                </Text>
              </TouchableOpacity>

              <Ionicons name="chevron-up" size={20} color={colors.primary} />
            </View>
          </>
        ) : (
          // Condensed View - Show 3-line preview
          <>
            <View style={styles.condensedContent}>
              {/* Line 1: Primary metadata */}
              <Text
                style={[styles.condensedLine1, { color: colors.text }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {metadataLine1}
              </Text>
              
              {/* Line 2: Secondary metadata (if available) */}
              {metadataLine2 && (
                <Text
                  style={[styles.condensedLine2, { color: colors.textSecondary }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {metadataLine2}
                </Text>
              )}
              
              {/* Line 3: Text preview */}
              <Text
                style={[styles.condensedLine3, { color: colors.textSecondary }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {textPreview}
              </Text>
            </View>
            
            <View style={styles.chevronContainer} key="chevron-down">
              <Ionicons
                name="chevron-down"
                size={20}
                color={colors.primary}
              />
            </View>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  condensedContainer: {
    minHeight: 90,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
  },
  expandedContainer: {
    padding: 16,
  },
  condensedContent: {
    flex: 1,
    marginRight: 12,
    gap: 4,
    overflow: "hidden",
    maxWidth: "100%",
  },
  condensedLine1: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
  },
  condensedLine2: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
  },
  condensedLine3: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: "italic",
    opacity: 0.85,
  },
  chevronContainer: {
    marginLeft: 8,
    alignSelf: "center",
    flexShrink: 0,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  expandedFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  copyButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  askAboutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  askAboutButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  citationText: {
    fontSize: 13,
    lineHeight: 20,
    fontStyle: "italic",
    marginBottom: 16,
  },
  textSection: {
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.2)",
    paddingTop: 16,
    gap: 8,
  },
  textLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  textContent: {
    fontSize: 14,
    lineHeight: 22,
  },
  arabicText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: "right",
    writingDirection: "rtl",
  },
});
