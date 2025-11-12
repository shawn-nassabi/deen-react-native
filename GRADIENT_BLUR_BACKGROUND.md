# Gradient Blur Background Implementation

## Overview

Added a gradient blur background behind the chat and reference search inputs to create a more natural, iOS-like transition between the content and the floating input fields.

## Changes Made

### 1. Reduced Input Blur Intensity

Both `ChatInput` and `SearchInput` components:
- **Before**: `intensity={80}`
- **After**: `intensity={60}`

This makes the input itself less blurred while maintaining the translucent effect.

### 2. Added Gradient Blur Background Layer

Implemented a new blur layer behind both inputs with the following characteristics:

#### Structure:
```jsx
<View style={styles.inputBackgroundContainer} pointerEvents="none">
  <BlurView intensity={80} tint={colorScheme}>
    <LinearGradient
      colors={["transparent", "rgba(0,0,0,0.3)"]}
      style={styles.inputGradient}
    />
  </BlurView>
</View>
```

#### Key Features:
- **Absolute positioning** at bottom with `height: 150px`
- **pointerEvents="none"** - allows touches to pass through to content
- **zIndex: 999** - sits between content (z-index: 1) and input (z-index: 1000)
- **Higher blur intensity (80)** for the background layer
- **LinearGradient overlay** fades from transparent (top) to semi-transparent black (bottom)

### 3. Gradient Effect Details

The gradient creates a natural fade:
- **Top**: Completely transparent - seamless transition from content
- **Bottom**: `rgba(0,0,0,0.3)` - subtle darkening at the very bottom
- **Blur**: Strongest at bottom, gradually fades as it goes up
- **Height**: 150px - extends well above the input field (~70px)

### 4. Files Modified

#### Chat Screen (`app/(tabs)/chat.tsx`)
- Installed `expo-linear-gradient`
- Imported `BlurView` and `LinearGradient`
- Added gradient blur background container
- Added styles: `inputBackgroundContainer`, `inputBackground`, `inputGradient`

#### References Screen (`app/(tabs)/references.tsx`)
- Imported `BlurView` and `LinearGradient`
- Added gradient blur background container
- Added styles: `inputBackgroundContainer`, `inputBackground`, `inputGradient`

#### ChatInput Component (`components/chat/ChatInput.tsx`)
- Reduced blur intensity from 80 to 60

#### SearchInput Component (`components/references/SearchInput.tsx`)
- Reduced blur intensity from 80 to 60

## Visual Effect

### Before:
- Single blur layer on input
- Abrupt transition from content to input
- Content visible but no gradient fade

### After:
- **Two-layer system**:
  1. Background blur (intensity 80) with gradient fade
  2. Input blur (intensity 60) on top
- **Smooth transition**: Gradient fades from transparent at top to slightly darker at bottom
- **Natural appearance**: Mimics iOS keyboard, Control Center, and bottom sheet effects
- **Depth perception**: Layered blur creates sophisticated depth

## iOS-Inspired Design

This implementation matches Apple's design patterns:
- **iOS Keyboard**: Gradient blur fading up from the keyboard
- **Control Center**: Blur extends beyond the panel with gradient fade
- **Bottom Sheets**: Content visible through graduated blur
- **Safari Toolbar**: Translucent with subtle gradient at bottom

## Technical Details

### Layer Stack (bottom to top):
1. **Content** (messages/cards) - z-index: default
2. **Gradient blur background** - z-index: 999, pointerEvents: none
3. **Input field** - z-index: 1000, interactive

### Touch Handling:
- Background layer has `pointerEvents="none"`
- Touches pass through to scroll content
- Input remains fully interactive

### Performance:
- Hardware-accelerated blur (expo-blur)
- Native LinearGradient rendering
- No impact on scroll or animation performance

## Dependencies Added

- `expo-linear-gradient` - for gradient overlay effect

