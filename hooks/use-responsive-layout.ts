import { Platform, useWindowDimensions } from "react-native";

export const RESPONSIVE_LAYOUT = {
  breakpoints: {
    tablet: 768,
    desktop: 1024,
  },
  maxWidth: {
    form: 480,
    footer: 640,
    reading: 760,
    home: 960,
    content: 1120,
  },
} as const;

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isTablet = width >= RESPONSIVE_LAYOUT.breakpoints.tablet;
  const isDesktop = isWeb && width >= RESPONSIVE_LAYOUT.breakpoints.desktop;
  const pagePadding = isDesktop ? 32 : isTablet ? 28 : 20;

  return {
    width,
    height,
    isWeb,
    isTablet,
    isDesktop,
    pagePadding,
    contentMaxWidth: RESPONSIVE_LAYOUT.maxWidth.content,
    formMaxWidth: RESPONSIVE_LAYOUT.maxWidth.form,
    footerMaxWidth: RESPONSIVE_LAYOUT.maxWidth.footer,
    readingMaxWidth: RESPONSIVE_LAYOUT.maxWidth.reading,
    homeMaxWidth: RESPONSIVE_LAYOUT.maxWidth.home,
  };
}
