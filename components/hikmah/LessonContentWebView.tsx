import React, { useRef, useEffect } from "react";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import showdown from "showdown";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface LessonContentWebViewProps {
  markdown: string;
  onSelectionChange: (selection: { text: string; context: string }) => void;
}

export default function LessonContentWebView({
  markdown,
  onSelectionChange,
}: LessonContentWebViewProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const webViewRef = useRef<WebView>(null);

  // Convert markdown to HTML
  const converter = new showdown.Converter();
  const htmlContent = converter.makeHtml(markdown);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: ${colors.text};
            background-color: ${colors.panel};
            padding: 20px;
            padding-bottom: 60px; /* Space for bottom controls */
            margin: 0;
            font-size: 18px;
            line-height: 1.6;
          }
          h1, h2, h3, h4, h5, h6 { color: ${colors.text}; margin-top: 1.5em; margin-bottom: 0.5em; }
          h1 { font-size: 24px; }
          h2 { font-size: 22px; }
          h3 { font-size: 20px; }
          p { margin-bottom: 16px; }
          blockquote {
            background-color: ${colors.panel2};
            border-left: 4px solid ${colors.primary};
            margin: 0;
            padding: 12px 16px;
            border-radius: 8px;
          }
          code {
            background-color: ${colors.panel2};
            color: ${colors.primary};
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.9em;
          }
          pre {
            background-color: ${colors.panel2};
            padding: 16px;
            border-radius: 8px;
            overflow-x: auto;
          }
          img { max-width: 100%; border-radius: 8px; }
          a { color: ${colors.primary}; text-decoration: none; }
        </style>
      </head>
      <body>
        ${htmlContent}
        <script>
          (function() {
            function computeContext(range, contextRadius) {
              if (!range) return "";
              const container = document.body;
              const baseText = container.innerText || "";
              const sel = range.toString().trim();
              if (!sel) return "";

              const idx = baseText.indexOf(sel);
              if (idx !== -1) {
                const selectionCenter = idx + Math.floor(sel.length / 2);
                const halfContext = Math.floor(contextRadius / 2);
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
                if (start < 0) start = 0;

                return baseText.slice(start, end).trim();
              }
              return sel.slice(0, contextRadius);
            }

            document.addEventListener("selectionchange", function() {
              const selection = window.getSelection();
              const text = selection.toString().trim();
              let context = "";
              
              if (text && selection.rangeCount > 0) {
                context = computeContext(selection.getRangeAt(0), 1000);
              }

              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: "selection",
                text: text,
                context: context
              }));
            });
          })();
        </script>
      </body>
    </html>
  `;

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "selection") {
        onSelectionChange({ text: data.text, context: data.context });
      }
    } catch (e) {
      // Ignore parse errors
    }
  };

  return (
    <WebView
      ref={webViewRef}
      originWhitelist={["*"]}
      source={{ html }}
      onMessage={onMessage}
      style={{ flex: 1, backgroundColor: "transparent" }}
      containerStyle={{ flex: 1 }}
      scrollEnabled={true} // Enable internal scrolling
      // We want the WebView to handle scrolling, not the parent ScrollView
    />
  );
}
