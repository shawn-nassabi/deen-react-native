import React, { useEffect, useMemo, useRef } from "react";
import { Linking, StyleSheet, View } from "react-native";
import Markdown from "react-native-markdown-display";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface ChatMessageMarkdownRendererProps {
  markdown: string;
  onSelectionChange?: (selection: { text: string; context: string }) => void;
}

const CONTEXT_RADIUS = 2000;

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

export default function ChatMessageMarkdownRenderer({
  markdown,
  onSelectionChange,
}: ChatMessageMarkdownRendererProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const containerRef = useRef<View>(null);
  const lastSelectionKeyRef = useRef("");

  useEffect(() => {
    if (!onSelectionChange || typeof document === "undefined") return;

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
      const isInsideMessage = container.contains(range.commonAncestorContainer);

      if (!isInsideMessage) {
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
          fontSize: 15,
          lineHeight: 25,
          userSelect: "text",
        } as any,
        paragraph: {
          marginTop: 0,
          marginBottom: 15,
          userSelect: "text",
        } as any,
        textgroup: {
          color: colors.text,
          userSelect: "text",
        } as any,
        text: {
          color: colors.text,
          userSelect: "text",
        },
        heading1: {
          color: colors.text,
          fontSize: 24,
          fontWeight: "700",
          lineHeight: 31,
          marginTop: 24,
          marginBottom: 12,
        },
        heading2: {
          color: colors.text,
          fontSize: 20,
          fontWeight: "700",
          lineHeight: 28,
          marginTop: 22,
          marginBottom: 11,
        },
        heading3: {
          color: colors.text,
          fontSize: 18,
          fontWeight: "700",
          lineHeight: 25,
          marginTop: 20,
          marginBottom: 10,
        },
        heading4: {
          color: colors.text,
          fontSize: 16,
          fontWeight: "700",
          marginTop: 18,
          marginBottom: 9,
        },
        heading5: {
          color: colors.text,
          fontSize: 15,
          fontWeight: "700",
          marginTop: 16,
          marginBottom: 8,
        },
        heading6: {
          color: colors.text,
          fontSize: 14,
          fontWeight: "700",
          marginTop: 14,
          marginBottom: 7,
        },
        strong: {
          color: colors.text,
          fontWeight: "700",
        },
        em: {
          fontStyle: "italic",
        },
        link: {
          color: colors.primary,
          textDecorationLine: "underline",
        },
        bullet_list: {
          marginTop: 8,
          marginBottom: 15,
        },
        ordered_list: {
          marginTop: 8,
          marginBottom: 15,
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
        code_inline: {
          backgroundColor: colors.panel2,
          color: colorScheme === "dark" ? "#d1fae5" : "#059669",
          borderRadius: 4,
          fontFamily: "monospace",
          fontSize: 14,
          paddingHorizontal: 6,
          paddingVertical: 2,
        },
        code_block: {
          backgroundColor: colors.panel2,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 12,
          color: colors.text,
          fontFamily: "monospace",
          fontSize: 14,
          marginTop: 15,
          marginBottom: 15,
          padding: 12,
        },
        fence: {
          backgroundColor: colors.panel2,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 12,
          color: colors.text,
          fontFamily: "monospace",
          fontSize: 14,
          marginTop: 15,
          marginBottom: 15,
          padding: 12,
        },
        blockquote: {
          borderLeftColor: colors.primary,
          borderLeftWidth: 4,
          color: colors.textSecondary,
          marginTop: 15,
          marginBottom: 15,
          paddingLeft: 15,
        },
        table: {
          borderColor: colors.border,
          borderWidth: 1,
          marginTop: 15,
          marginBottom: 15,
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
      }),
    [colorScheme, colors.border, colors.panel2, colors.primary, colors.text, colors.textSecondary]
  );

  return (
    <View ref={containerRef} style={styles.container}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    cursor: "text",
    userSelect: "text",
  } as any,
});
