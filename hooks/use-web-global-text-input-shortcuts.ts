import { useCallback } from "react";
import { Platform } from "react-native";
import { useFocusEffect } from "expo-router";

const INTERACTIVE_SELECTOR =
  "input, textarea, select, button, [contenteditable='true'], [role='button'], [role='menuitem'], [role='option']";

type UseWebGlobalTextInputShortcutsOptions = {
  canSubmit?: boolean;
  disabled?: boolean;
  onSubmit: () => void;
  onTextInput: (text: string) => void;
};

export function useWebGlobalTextInputShortcuts({
  canSubmit = true,
  disabled = false,
  onSubmit,
  onTextInput,
}: UseWebGlobalTextInputShortcutsOptions) {
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "web") return;

      const handleWindowKeyDown = (event: KeyboardEvent) => {
        if (event.defaultPrevented || event.isComposing) {
          return;
        }

        const hasModifier = event.metaKey || event.ctrlKey || event.altKey;
        const isEnterSubmit =
          event.key === "Enter" && !event.shiftKey && !hasModifier;
        const isPrintableKey =
          event.key.length === 1 && !hasModifier;

        if (!isEnterSubmit && !isPrintableKey) {
          return;
        }

        const activeElement =
          event.target instanceof HTMLElement
            ? event.target
            : document.activeElement;
        const interactiveElement = activeElement?.closest?.(
          INTERACTIVE_SELECTOR
        );

        if (interactiveElement || disabled) {
          return;
        }

        if (isEnterSubmit) {
          if (!canSubmit) return;

          event.preventDefault();
          onSubmit();
          return;
        }

        event.preventDefault();
        onTextInput(event.key);
      };

      window.addEventListener("keydown", handleWindowKeyDown);

      return () => {
        window.removeEventListener("keydown", handleWindowKeyDown);
      };
    }, [canSubmit, disabled, onSubmit, onTextInput])
  );
}
