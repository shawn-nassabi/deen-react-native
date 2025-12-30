/**
 * References Modal Component
 * Displays references from chat responses in a modal with Shia/Sunni tabs
 * Reuses ReferenceItem component for consistent display
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Text,
  Animated,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import ModalReferenceItem from "./ModalReferenceItem";
import type { Reference } from "@/utils/chatStorage";

interface ReferencesModalProps {
  visible: boolean;
  onClose: () => void;
  references: Reference[];
}

export default function ReferencesModal({
  visible,
  onClose,
  references = [],
}: ReferencesModalProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const blurIntensity = Platform.OS === "android" ? 120 : 60;

  // Tab state: 'shia' or 'sunni'
  const [activeTab, setActiveTab] = useState<"shia" | "sunni">("shia");

  // Animation for modal entrance
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Animation for count text reveal
  const countTranslateX = useRef(new Animated.Value(-50)).current;
  const countOpacity = useRef(new Animated.Value(0)).current;

  // Categorize references by sect field
  const allRefs = Array.isArray(references) ? references : [];
  
  // Filter references by sect
  const shiaRefs = allRefs.filter((ref: any) => 
    ref.sect === "shia" || ref.sect === "Shia"
  );
  const sunniRefs = allRefs.filter((ref: any) => 
    ref.sect === "sunni" || ref.sect === "Sunni"
  );

  const hasShiaRefs = shiaRefs.length > 0;
  const hasSunniRefs = sunniRefs.length > 0;
  const activeRefs = activeTab === "shia" ? shiaRefs : sunniRefs;

  // Animate modal entrance
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  // Animate count text when tab changes
  useEffect(() => {
    if (visible && activeRefs.length > 0) {
      // Reset animation values
      countTranslateX.setValue(-50);
      countOpacity.setValue(0);

      // Trigger reveal animation
      Animated.parallel([
        Animated.timing(countTranslateX, {
          toValue: 0,
          duration: 400,
          delay: 100,
          useNativeDriver: true,
        }),
        Animated.timing(countOpacity, {
          toValue: 1,
          duration: 400,
          delay: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [activeTab, visible, activeRefs.length]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const slideTranslate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        {/* Backdrop */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: opacityAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backdropTouchable}
            activeOpacity={1}
            onPress={handleClose}
          >
            <BlurView
              intensity={blurIntensity}
              tint={colorScheme === "dark" ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Modal Content */}
        <Animated.View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.background,
              paddingTop: insets.top + 16,
              paddingBottom: insets.bottom + 16,
              transform: [{ translateY: slideTranslate }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <ThemedText type="subtitle" style={styles.headerTitle}>
              References
            </ThemedText>
            <TouchableOpacity
              onPress={handleClose}
              style={[
                styles.closeButton,
                {
                  backgroundColor: colors.panel2,
                  borderColor: colors.border,
                },
              ]}
              hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Tab Switcher */}
          {(hasShiaRefs || hasSunniRefs) && (
            <View style={styles.tabSection}>
              <View style={styles.tabContainer}>
                {/* Shia Tab */}
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    {
                      backgroundColor:
                        activeTab === "shia" && hasShiaRefs
                          ? colors.primary
                          : colors.panel2,
                      borderColor:
                        activeTab === "shia" && hasShiaRefs
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                  onPress={() => setActiveTab("shia")}
                  activeOpacity={0.7}
                  disabled={!hasShiaRefs}
                >
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color:
                          activeTab === "shia" && hasShiaRefs
                            ? "#ffffff"
                            : colors.muted,
                        opacity: hasShiaRefs ? 1 : 0.4,
                      },
                    ]}
                  >
                    Shia References
                  </Text>
                </TouchableOpacity>

                {/* Sunni Tab */}
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    {
                      backgroundColor:
                        activeTab === "sunni" && hasSunniRefs
                          ? colors.primary
                          : colors.panel2,
                      borderColor:
                        activeTab === "sunni" && hasSunniRefs
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                  onPress={() => setActiveTab("sunni")}
                  activeOpacity={0.7}
                  disabled={!hasSunniRefs}
                >
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color:
                          activeTab === "sunni" && hasSunniRefs
                            ? "#ffffff"
                            : colors.muted,
                        opacity: hasSunniRefs ? 1 : 0.4,
                      },
                    ]}
                  >
                    Sunni References
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Count Display - Only for Active Tab */}
              {activeRefs.length > 0 && (
                <Animated.Text
                  style={[
                    styles.countText,
                    {
                      color: colors.textSecondary,
                      transform: [{ translateX: countTranslateX }],
                      opacity: countOpacity,
                    },
                  ]}
                >
                  {activeRefs.length} found
                </Animated.Text>
              )}
            </View>
          )}

          {/* References List */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            {activeRefs.length > 0 ? (
              <View style={styles.referencesSection}>
                {activeRefs.map((ref: any, idx: number) => (
                  <ModalReferenceItem
                    key={`${activeTab}-${idx}`}
                    reference={ref}
                    type={activeTab}
                    index={idx}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <ThemedText
                  style={[styles.emptyText, { color: colors.textSecondary }]}
                >
                  No {activeTab === "shia" ? "Shia" : "Sunni"} references found
                </ThemedText>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropTouchable: {
    flex: 1,
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
  },
  countText: {
    fontSize: 13,
    textAlign: "left",
    marginTop: 16,
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  referencesSection: {
    flex: 1,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
  },
});

