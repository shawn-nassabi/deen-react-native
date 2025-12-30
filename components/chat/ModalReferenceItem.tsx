/**
 * Modal Reference Item Component
 * Simplified version of ReferenceItem for modal context
 * Renders without entrance animations for immediate visibility
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { Reference } from "@/utils/chatStorage";

interface ModalReferenceItemProps {
  reference: Reference;
  type: "shia" | "sunni";
  index: number;
}

export default function ModalReferenceItem({
  reference,
  type,
  index,
}: ModalReferenceItemProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [isExpanded, setIsExpanded] = useState(false);

  const metadata = reference || {};
  const en = (reference?.text || "").trim();
  const ar = (reference?.text_ar || "").trim();

  // Build condensed preview with essential metadata
  const buildMetadataLine = () => {
    const parts = [];
    if (metadata.collection) parts.push(metadata.collection);
    if (metadata.author) parts.push(metadata.author);
    if (metadata.hadith_no) parts.push(`Hadith #${metadata.hadith_no}`);
    return parts.filter(Boolean).join(" • ");
  };

  const buildSecondaryLine = () => {
    const parts = [];
    if (metadata.chapter_number) parts.push(`Ch. ${metadata.chapter_number}`);
    if (metadata.chapter_title) parts.push(metadata.chapter_title);
    if (metadata.book_title) parts.push(metadata.book_title);
    if (metadata.volume) parts.push(`Vol. ${metadata.volume}`);
    return parts.filter(Boolean).join(" • ");
  };

  const metadataLine1 = buildMetadataLine() || "Reference";
  const metadataLine2 = buildSecondaryLine();
  const textPreview = en ? en.substring(0, 80) : "No text available";

  const handleToggle = () => {
    if (Platform.OS === "ios" || Platform.OS === "android") {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setIsExpanded(!isExpanded);
  };

  const renderField = (label: string, value: any) => {
    if (
      !value ||
      String(value).trim() === "" ||
      String(value).trim() === "N/A" ||
      String(value).trim() === "unspecified"
    )
      return null;

    return (
      <View style={styles.field}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
          {label}
        </Text>
        <Text style={[styles.fieldValue, { color: colors.text }]}>
          {String(value)}
        </Text>
      </View>
    );
  };

  return (
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
        // Expanded View
        <>
          <View style={styles.metadataGrid}>
            {renderField("Author", metadata.author)}
            {renderField("Reference", metadata.reference)}
            {renderField("Source", metadata.collection)}
            {renderField("Volume", metadata.volume)}
            {renderField("Book number", metadata.book_number)}
            {renderField("Book title", metadata.book_title)}
            {renderField("Chapter number", metadata.chapter_number)}
            {renderField("Chapter title", metadata.chapter_title)}
            {renderField("Hadith number", metadata.hadith_no)}
            {renderField("Authenticity", metadata.grade_en)}
          </View>

          <View style={styles.textSection}>
            <Text style={[styles.textLabel, { color: colors.textSecondary }]}>
              Text
            </Text>
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
            </View>
          </View>

          <View style={styles.chevronContainer}>
            <Ionicons name="chevron-up" size={20} color={colors.primary} />
          </View>
        </>
      ) : (
        // Condensed View
        <>
          <View style={styles.condensedContent}>
            <Text
              style={[styles.condensedLine1, { color: colors.text }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {metadataLine1}
            </Text>
            {metadataLine2 && (
              <Text
                style={[styles.condensedLine2, { color: colors.textSecondary }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {metadataLine2}
              </Text>
            )}
            <Text
              style={[styles.condensedLine3, { color: colors.textSecondary }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {textPreview}
            </Text>
          </View>
          <View style={styles.chevronContainer}>
            <Ionicons name="chevron-down" size={20} color={colors.primary} />
          </View>
        </>
      )}
    </TouchableOpacity>
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
  metadataGrid: {
    gap: 12,
    marginBottom: 16,
  },
  field: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 14,
    lineHeight: 20,
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

