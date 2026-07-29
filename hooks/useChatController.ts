import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { useStreamingText } from "@/hooks/useStreamingText";
import {
  fetchSavedChatDetail,
  getOrCreateSessionId,
  sendChatMessage,
  startNewConversation,
} from "@/utils/api";
import {
  clearMessages,
  getChatLanguage,
  getLastChatLanguage,
  loadMessages,
  purgeExpiredSessions,
  saveMessages,
  setChatLanguage,
  setLastChatLanguage,
  type Message,
} from "@/utils/chatStorage";
import {
  CHAT_LANGUAGES,
  DEFAULT_LANGUAGE,
  getChatLanguageLabel,
  type ChatLanguage,
} from "@/utils/chatLanguage";
import { ERROR_MESSAGES, UI_CONSTANTS } from "@/utils/constants";
import { consumePendingChatPrompt } from "@/utils/pendingChatPrompt";

type ChatSelection = { text: string; context: string };

let coldStartHandled = false;

export function useChatController() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingTarget, setStreamingTarget] = useState("");
  const displayedStreamingText = useStreamingText(streamingTarget, isStreaming);
  const [statusMessage, setStatusMessage] = useState("Thinking...");
  const [isNewChatLoading, setIsNewChatLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] =
    useState<ChatLanguage>(DEFAULT_LANGUAGE);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [inputFocusRequest, setInputFocusRequest] = useState(0);
  const [selection, setSelection] = useState<ChatSelection>({
    text: "",
    context: "",
  });
  const [showSuggestions, setShowSuggestions] = useState(true);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextMessageLoadRef = useRef(false);

  const hasSelection = !!selection.text;
  const hasStartedChat = messages.some((message) => message.sender === "user");
  const canSelectLanguage = !hasStartedChat;
  const selectedLanguageLabel = getChatLanguageLabel(selectedLanguage);

  useEffect(() => {
    const shouldShow = !input.trim();
    if (shouldShow !== showSuggestions) {
      setShowSuggestions(shouldShow);
    }
  }, [input, showSuggestions]);

  useEffect(() => {
    const isColdStart = !coldStartHandled;
    coldStartHandled = true;

    const initialize = async () => {
      console.log(
        isColdStart
          ? "🚀 Chat screen cold-start — starting fresh session"
          : "🚀 Chat screen warm-mount — restoring active session"
      );

      await purgeExpiredSessions();

      if (isColdStart) {
        skipNextMessageLoadRef.current = true;
        const freshId = await startNewConversation();
        setSessionId(freshId);
        setMessages([]);
        setShowSuggestions(true);
      } else {
        const sid = await getOrCreateSessionId();
        setSessionId(sid);
      }
    };

    initialize();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const pendingPrompt = consumePendingChatPrompt();
      if (!pendingPrompt) return;

      let cancelled = false;

      const seedFromReferences = async () => {
        console.log("🚀 Chat screen focus — seeding from References 'Ask about this'");
        skipNextMessageLoadRef.current = true;
        const freshId = await startNewConversation();
        if (cancelled) return;

        setMessages([]);
        setSessionId(freshId);
        setInput(pendingPrompt);
        setShowSuggestions(false);
        setSelection({ text: "", context: "" });
      };

      seedFromReferences();

      return () => {
        cancelled = true;
      };
    }, [])
  );

  useEffect(() => {
    if (!sessionId) return;

    if (skipNextMessageLoadRef.current) {
      skipNextMessageLoadRef.current = false;
      return;
    }

    const loadInitialMessages = async () => {
      const initial = await loadMessages(sessionId);
      if (initial.length > 0) {
        console.log(`💾 Loaded ${initial.length} message(s) from storage`);
      }
      setMessages(initial);
    };

    loadInitialMessages();
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    let isCancelled = false;

    const loadInitialLanguage = async () => {
      const sessionLanguage = (await getChatLanguage(sessionId)) as
        | ChatLanguage
        | null;
      const lastLanguage = (await getLastChatLanguage()) as ChatLanguage | null;
      const resolved = sessionLanguage || lastLanguage || DEFAULT_LANGUAGE;

      if (!isCancelled) {
        setSelectedLanguage(resolved);
      }

      if (!sessionLanguage) {
        await setChatLanguage(sessionId, resolved);
      }
    };

    loadInitialLanguage();

    return () => {
      isCancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      saveMessages(sessionId, messages);
    }, UI_CONSTANTS.DEBOUNCE_DELAY);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [sessionId, messages]);

  const handleSuggestedQuestion = useCallback((question: string) => {
    setInput(question);
  }, []);

  const handleSelectionChange = useCallback((nextSelection: ChatSelection) => {
    setSelection(nextSelection);
  }, []);

  const handleOpenLanguagePicker = useCallback(() => {
    if (!canSelectLanguage) return;
    setIsLanguageModalVisible((prev) => !prev);
  }, [canSelectLanguage]);

  const handleSelectLanguage = useCallback(
    async (language: ChatLanguage) => {
      if (!canSelectLanguage) return;

      setSelectedLanguage(language);
      setIsLanguageModalVisible(false);

      await setLastChatLanguage(language);
      if (sessionId) {
        await setChatLanguage(sessionId, language);
      }
    },
    [canSelectLanguage, sessionId]
  );

  const handleNewChat = useCallback(async () => {
    if (isLoading || isNewChatLoading) return;

    setIsNewChatLoading(true);

    try {
      if (sessionId) {
        await clearMessages(sessionId);
      }

      const newId = await startNewConversation();
      setSessionId(newId);
      setMessages([]);
      setInput("");
      setShowSuggestions(true);
      setSelection({ text: "", context: "" });

      const lastLanguage = (await getLastChatLanguage()) as ChatLanguage | null;
      const resolved = lastLanguage || DEFAULT_LANGUAGE;
      setSelectedLanguage(resolved);
      await setChatLanguage(newId, resolved);
    } catch (e) {
      console.error("❌ Failed to start new chat:", e);
    } finally {
      setIsNewChatLoading(false);
    }
  }, [isLoading, isNewChatLoading, sessionId]);

  const handleSelectChat = useCallback(
    async (selectedSessionId: string) => {
      if (isLoading) return false;

      try {
        const detail = await fetchSavedChatDetail(selectedSessionId);
        if (!detail) return false;

        const hydrated: Message[] = detail.messages.map((message) => ({
          sender: message.role === "user" ? "user" : "bot",
          text: message.content,
        }));

        setMessages(hydrated);
        setSessionId(selectedSessionId);
        setInput("");
        setShowSuggestions(false);
        setSelection({ text: "", context: "" });

        await saveMessages(selectedSessionId, hydrated);
        return true;
      } catch (e) {
        console.error("❌ Failed to load saved chat:", e);
        return false;
      }
    },
    [isLoading]
  );

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || !sessionId || isLoading) return;

    const userMessage: Message = { sender: "user", text: input };
    const botPlaceholder: Message = { sender: "bot", text: "" };

    setMessages((prev) => [...prev, userMessage, botPlaceholder]);
    setInput("");
    setIsLoading(true);
    setIsStreaming(true);
    setStreamingTarget("");
    setStatusMessage("Thinking...");
    setSelection({ text: "", context: "" });

    try {
      await sendChatMessage(
        input,
        sessionId,
        selectedLanguage,
        (fullMessage) => {
          setIsLoading(false);
          setStreamingTarget(fullMessage);
        },
        (responseText, references) => {
          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            updated[lastIndex] = {
              sender: "bot",
              text: responseText,
              references,
            };
            return updated;
          });
          setIsStreaming(false);
        },
        (error) => {
          console.error("❌ Chat error:", error);
          setIsLoading(false);
          setIsStreaming(false);
          setStreamingTarget("");
          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            updated[lastIndex] = {
              sender: "bot",
              text: ERROR_MESSAGES.CHAT_FAILED,
            };
            return updated;
          });
        },
        (status) => {
          setStatusMessage(status.message || "Thinking...");
        }
      );
    } catch (error) {
      console.error("❌ Error in handleSendMessage:", error);
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingTarget("");
      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        updated[lastIndex] = {
          sender: "bot",
          text: ERROR_MESSAGES.CHAT_FAILED,
        };
        return updated;
      });
    }
  }, [input, sessionId, selectedLanguage, isLoading]);

  const handleGlobalTextInput = useCallback((text: string) => {
    setInput((prev) => `${prev}${text}`);
    setInputFocusRequest((prev) => prev + 1);
  }, []);

  return {
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
    setSelection,
    showSuggestions,
    statusMessage,
  };
}

export { CHAT_LANGUAGES };
export type { ChatLanguage };
