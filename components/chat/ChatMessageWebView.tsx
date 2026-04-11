import React, { useState, useRef, useCallback } from "react";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import showdown from "showdown";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface ChatMessageWebViewProps {
  markdown: string;
  onSelectionChange?: (selection: { text: string; context: string }) => void;
}

const MIN_HEIGHT = 20;

export default function ChatMessageWebView({
  markdown,
  onSelectionChange,
}: ChatMessageWebViewProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const webViewRef = useRef<WebView>(null);
  const [webViewHeight, setWebViewHeight] = useState(MIN_HEIGHT);

  const converter = new showdown.Converter();
  const htmlContent = converter.makeHtml(markdown);

  const codeInlineColor = colorScheme === "dark" ? "#d1fae5" : "#059669";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: ${colors.text};
            background-color: transparent;
            padding: 0;
            margin: 0;
            font-size: 15px;
            line-height: 25px;
            -webkit-text-size-adjust: none;
          }
          p {
            margin-top: 15px;
            margin-bottom: 15px;
            line-height: 25px;
          }
          p:first-child { margin-top: 0; }
          p:last-child { margin-bottom: 0; }
          h1 { font-size: 24px; font-weight: 700; margin-top: 24px; margin-bottom: 12px; line-height: 31px; color: ${colors.text}; }
          h2 { font-size: 20px; font-weight: 700; margin-top: 22px; margin-bottom: 11px; line-height: 28px; color: ${colors.text}; }
          h3 { font-size: 18px; font-weight: 700; margin-top: 20px; margin-bottom: 10px; line-height: 25px; color: ${colors.text}; }
          h4 { font-size: 16px; font-weight: 700; margin-top: 18px; margin-bottom: 9px; color: ${colors.text}; }
          h5 { font-size: 15px; font-weight: 700; margin-top: 16px; margin-bottom: 8px; color: ${colors.text}; }
          h6 { font-size: 14px; font-weight: 700; margin-top: 14px; margin-bottom: 7px; color: ${colors.text}; }
          strong { font-weight: 700; color: ${colors.text}; }
          em { font-style: italic; }
          a { color: ${colors.primary}; text-decoration: underline; }
          ul, ol { margin-top: 15px; margin-bottom: 15px; padding-left: 24px; }
          li { margin-top: 8px; margin-bottom: 8px; line-height: 24px; }
          code {
            background-color: ${colors.panel2};
            color: ${codeInlineColor};
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 14px;
          }
          pre {
            background-color: ${colors.panel2};
            border: 1px solid ${colors.border};
            border-radius: 12px;
            padding: 12px;
            margin-top: 15px;
            margin-bottom: 15px;
            overflow-x: auto;
          }
          pre code {
            padding: 0;
            background: none;
          }
          blockquote {
            background-color: transparent;
            border-left: 4px solid ${colors.primary};
            padding-left: 15px;
            margin: 15px 0;
            font-style: italic;
            color: ${colors.textSecondary};
          }
          hr {
            border: none;
            height: 1px;
            background-color: ${colors.border};
            margin: 30px 0;
          }
          ::selection {
            background-color: rgba(91, 193, 161, 0.3);
          }
        </style>
      </head>
      <body>
        ${htmlContent}
        <script>
          (function() {
            function computeContext(range, contextRadius) {
              if (!range) return "";
              var baseText = document.body.innerText || "";
              var sel = range.toString().trim();
              if (!sel) return "";

              var idx = baseText.indexOf(sel);
              if (idx !== -1) {
                var selectionCenter = idx + Math.floor(sel.length / 2);
                var halfContext = Math.floor(contextRadius / 2);
                var start = selectionCenter - halfContext;
                var end = selectionCenter + halfContext;

                if (start < 0) { end += -start; start = 0; }
                if (end > baseText.length) { start -= end - baseText.length; end = baseText.length; }
                if (start < 0) start = 0;

                return baseText.slice(start, end).trim();
              }
              return sel.slice(0, contextRadius);
            }

            function sendHeight() {
              var h = document.body.scrollHeight;
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: "height", height: h }));
            }

            window.addEventListener("load", sendHeight);
            new MutationObserver(sendHeight).observe(document.body, { childList: true, subtree: true });
            setTimeout(sendHeight, 100);

            document.addEventListener("selectionchange", function() {
              var selection = window.getSelection();
              var text = selection.toString().trim();
              var context = "";

              if (text && selection.rangeCount > 0) {
                context = computeContext(selection.getRangeAt(0), 2000);
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

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === "height" && typeof data.height === "number") {
          setWebViewHeight(Math.max(MIN_HEIGHT, data.height));
        } else if (data.type === "selection") {
          onSelectionChange?.({ text: data.text, context: data.context });
        }
      } catch {
        // Ignore parse errors
      }
    },
    [onSelectionChange]
  );

  return (
    <WebView
      ref={webViewRef}
      originWhitelist={["*"]}
      source={{ html }}
      onMessage={onMessage}
      style={{ height: webViewHeight, backgroundColor: "transparent" }}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
    />
  );
}
