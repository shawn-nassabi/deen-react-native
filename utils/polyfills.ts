/**
 * Polyfills for React Native / Hermes
 * react-native-url-polyfill/auto MUST be first — Supabase requires a spec-compliant
 * URL global at module init time. Hermes does not ship one by default.
 */
import "react-native-url-polyfill/auto";

// No other polyfills needed — streaming handled natively
