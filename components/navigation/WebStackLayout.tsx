import { Stack } from "expo-router";
import React from "react";

export default function WebStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: "Home" }} />
      <Stack.Screen name="chat" options={{ title: "Chat" }} />
      <Stack.Screen name="references" options={{ title: "References" }} />
      <Stack.Screen name="hikmah" options={{ title: "Hikmah Trees" }} />
    </Stack>
  );
}
