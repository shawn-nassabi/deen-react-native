/**
 * References screen - Search and display Islamic references
 */

import React, { useState } from "react";
import { StyleSheet, KeyboardAvoidingView, Platform, View } from "react-native";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { searchReferences } from "@/utils/api";
import { ERROR_MESSAGES } from "@/utils/constants";
import ReferencesContainer from "@/components/references/ReferencesContainer";
import SearchInput from "@/components/references/SearchInput";

export default function ReferencesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    console.log(`🔍 User searching: "${query.substring(0, 50)}..."`);
    
    setSubmittedQuery(query);
    setSearchPerformed(true);
    setIsLoading(true);
    setResults(null);

    try {
      const data = await searchReferences(query);
      setResults(data.response);
      console.log(`✅ Reference search completed successfully`);
    } catch (error) {
      console.error("❌ Reference search failed:", error);
      setResults({
        error: ERROR_MESSAGES.REFERENCES_FAILED,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ReferencesContainer
          results={results}
          isLoading={isLoading}
          searchPerformed={searchPerformed}
          submittedQuery={submittedQuery}
        />
      </KeyboardAvoidingView>
      <SearchInput
        value={query}
        onChange={setQuery}
        onSubmit={handleSearch}
        isLoading={isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
