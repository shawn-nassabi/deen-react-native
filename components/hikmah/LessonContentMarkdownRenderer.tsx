import React, { useEffect, useMemo, useRef } from "react";
import { Linking, ScrollView, StyleSheet, View } from "react-native";
import Markdown from "react-native-markdown-display";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface LessonContentMarkdownRendererProps {
  markdown: string;
  onSelectionChange: (selection: { text: string; context: string }) => void;
}

const CONTEXT_RADIUS = 1000;

function getSelectionContext(baseText: string, selectedText: string) {
  const selectionIndex = baseText.indexOf(selectedText);

  if (selectionIndex === -1) {
    return selectedText.slice(0, CONTEXT_RADIUS);
  }

  const selectionCenter = selectionIndex + Math.floor(selectedText.length / 2);
  const halfContext = Math.floor(CONTEXT_RADIUS / 2);
  let start = selectionCenter - halfContext;
  let end = selectionCenter + halfContext;

  if (start < 0) {
    end += -start;
    start = 0;
  }

  if (end > baseText.length) {
    start -= end - baseText.length;
    end = baseText.length;
  }

  return baseText.slice(Math.max(0, start), end).trim();
}

export default function LessonContentMarkdownRenderer({
  markdown,
  onSelectionChange,
}: LessonContentMarkdownRendererProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const containerRef = useRef<View>(null);
  const lastSelectionKeyRef = useRef("");

  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleSelectionChange = () => {
      const container = containerRef.current as unknown as HTMLElement | null;
      const selection = document.getSelection();
      const selectedText = selection?.toString().trim() ?? "";

      if (!container || !selection || !selectedText || selection.rangeCount === 0) {
        if (lastSelectionKeyRef.current) {
          lastSelectionKeyRef.current = "";
          onSelectionChange({ text: "", context: "" });
        }
        return;
      }

      const range = selection.getRangeAt(0);
      const isInsideLesson = container.contains(range.commonAncestorContainer);

      if (!isInsideLesson) {
        if (lastSelectionKeyRef.current) {
          lastSelectionKeyRef.current = "";
          onSelectionChange({ text: "", context: "" });
        }
        return;
      }

      const baseText = container.textContent ?? "";
      const context = getSelectionContext(baseText, selectedText);
      const nextSelectionKey = `${selectedText}::${context}`;

      if (nextSelectionKey !== lastSelectionKeyRef.current) {
        lastSelectionKeyRef.current = nextSelectionKey;
        onSelectionChange({ text: selectedText, context });
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [onSelectionChange]);

  const markdownStyles = useMemo(
    () =>
      StyleSheet.create({
        body: {
          color: colors.text,
          fontSize: 18,
          lineHeight: 29,
          userSelect: "text",
        } as any,
        paragraph: {
          marginTop: 0,
          marginBottom: 16,
          userSelect: "text",
        } as any,
        textgroup: {
          color: colors.text,
          userSelect: "text",
        } as any,
        text: {
          color: colors.text,
          userSelect: "text",
        } as any,
        heading1: {
          color: colors.text,
          fontSize: 28,
          fontWeight: "700",
          lineHeight: 36,
          marginTop: 24,
          marginBottom: 12,
        },
        heading2: {
          color: colors.text,
          fontSize: 24,
          fontWeight: "700",
          lineHeight: 32,
          marginTop: 24,
          marginBottom: 12,
        },
        heading3: {
          color: colors.text,
          fontSize: 21,
          fontWeight: "700",
          lineHeight: 29,
          marginTop: 22,
          marginBottom: 10,
        },
        heading4: {
          color: colors.text,
          fontSize: 18,
          fontWeight: "700",
          marginTop: 18,
          marginBottom: 9,
        },
        strong: {
          color: colors.text,
          fontWeight: "700",
        },
        em: {
          color: colors.text,
          fontStyle: "italic",
        },
        link: {
          color: colors.primary,
          textDecorationLine: "underline",
        },
        bullet_list: {
          marginTop: 8,
          marginBottom: 16,
        },
        ordered_list: {
          marginTop: 8,
          marginBottom: 16,
        },
        list_item: {
          marginBottom: 8,
        },
        bullet_list_icon: {
          color: colors.text,
          marginRight: 8,
        },
        ordered_list_icon: {
          color: colors.text,
          marginRight: 8,
        },
        bullet_list_content: {
          color: colors.text,
          flex: 1,
        },
        ordered_list_content: {
          color: colors.text,
          flex: 1,
        },
        blockquote: {
          backgroundColor: colors.panel2,
          borderColor: colors.primary,
          borderLeftColor: colors.primary,
          borderLeftWidth: 4,
          borderRadius: 8,
          marginLeft: 0,
          marginTop: 16,
          marginBottom: 16,
          overflow: "hidden",
          paddingLeft: 16,
          paddingRight: 16,
          paddingVertical: 12,
        } as any,
        code_inline: {
          backgroundColor: colors.panel2,
          borderRadius: 4,
          color: colors.primary,
          fontFamily: "monospace",
          fontSize: 16,
          paddingHorizontal: 6,
          paddingVertical: 2,
        },
        code_block: {
          backgroundColor: colors.panel2,
          borderColor: colors.border,
          borderRadius: 8,
          borderWidth: 1,
          color: colors.text,
          fontFamily: "monospace",
          fontSize: 15,
          marginTop: 16,
          marginBottom: 16,
          padding: 16,
        },
        fence: {
          backgroundColor: colors.panel2,
          borderColor: colors.border,
          borderRadius: 8,
          borderWidth: 1,
          color: colors.text,
          fontFamily: "monospace",
          fontSize: 15,
          marginTop: 16,
          marginBottom: 16,
          padding: 16,
        },
        table: {
          borderColor: colors.border,
          borderWidth: 1,
          marginTop: 16,
          marginBottom: 16,
        },
        th: {
          backgroundColor: colors.panel2,
          borderColor: colors.border,
          borderWidth: 1,
          flex: 1,
          paddingHorizontal: 10,
          paddingVertical: 8,
        },
        td: {
          borderColor: colors.border,
          borderWidth: 1,
          flex: 1,
          paddingHorizontal: 10,
          paddingVertical: 8,
        },
        hr: {
          backgroundColor: colors.border,
          height: 1,
          marginTop: 20,
          marginBottom: 20,
        },
      }),
    [colors.border, colors.panel2, colors.primary, colors.text]
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.panel }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator
    >
      <View ref={containerRef}>
        <Markdown
          mergeStyle
          onLinkPress={(url) => {
            Linking.openURL(url).catch(() => {});
            return false;
          }}
          style={markdownStyles}
        >
          {markdown}
        </Markdown>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
});
