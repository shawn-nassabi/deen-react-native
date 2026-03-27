# Reference Lookup Implementation

## Overview

The Reference Lookup feature has been successfully implemented for the React Native mobile app, matching the functionality of the web app with mobile-optimized UX.

## Components Created

### 1. ReferenceItem (`components/references/ReferenceItem.tsx`)
- Expandable card component displaying individual Islamic references
- Shows metadata: author, reference, collection, volume, book details, hadith number, authenticity
- Supports both English and Arabic text with RTL layout for Arabic
- Text truncation at 300 characters with "Show more/less" button
- **Left-to-right reveal animation** on mount using React Native's Animated API
- Accepts `animationDelay` prop for staggered entrance effect

### 2. SearchInput (`components/references/SearchInput.tsx`)
- Bottom-fixed search input with BlurView effect (intensity: 60)
- Search icon on the left, submit button on the right
- Single-line TextInput with keyboard submission
- Matches the chat input styling for consistency
- Disabled state when loading or empty query
- Shadow/elevation for visual separation

### 3. ReferencesContainer (`components/references/ReferencesContainer.tsx`)
- Handles all result display states:
  - **Pulsing loading animation** - centered circular pulse during search
  - Empty state - initial welcome message
  - No results state - user-friendly message
  - Error state - displays error message
  - Results state - categorized Shia and Sunni sections
- Query display card showing the submitted search
- Badge counters for reference counts
- Staggered animation delays for smooth card entrance
- Bottom padding to account for fixed search input

### 4. References Screen (`app/(tabs)/references.tsx`)
- Complete rewrite with state management
- API integration with error handling
- Logging for user actions and API responses
- KeyboardAvoidingView for proper keyboard handling
- Bottom-fixed search input with translucent blur
- Results scroll beneath the search bar

## API Integration

### New Function in `utils/api.ts`
```typescript
searchReferences(userQuery: string)
```
- POST to `/references/` endpoint
- Returns: `{ response: { shia: [], sunni: [] } }`
- Includes comprehensive logging

## Constants Added

### `utils/constants.ts`
- `PLACEHOLDERS.REFERENCES`: "Search for references..."
- `ERROR_MESSAGES.REFERENCES_FAILED`: "Failed to get references. Please try again."

## Key Features

### Mobile-First UX
- **Bottom-fixed search input** with blur effect that hovers over content
- Results start at the top and scroll downward
- Search bar appears to float over scrolling cards
- Keyboard-aware layout with proper avoidance

### Smooth Animations
- **Pulsing loading animation** - centered circular pulse (scale 1.0 → 1.2 → 1.0)
- **Left-to-right card reveal** - each card slides in with fade (translateX + opacity)
- **Staggered entrance** - 100ms delay between each card
- All animations use native driver for 60fps performance

### Visual Design
- Consistent with chat page styling
- BlurView backgrounds for modern translucent effect
- Primary color accents for badges and buttons
- Proper spacing for mobile readability
- Card-based layout with hover states
- RTL support for Arabic text

### Data Display
- Categorized by Shia/Sunni sources
- Metadata displayed in clean grid
- Text preview with expansion
- "Your Search" card at top of results
- Empty states and error handling

## Usage

1. User enters search query in bottom input
2. Presses search button or keyboard "search" key
3. Pulsing animation shows while loading
4. Results appear with staggered left-to-right animation
5. User can scroll results while search bar stays fixed at bottom
6. Tap "Show more" to expand long references
7. Clear visual separation between Shia and Sunni sections

## Logging

All key actions are logged:
- Search query submission (with truncated preview)
- API success with reference counts
- API errors with details
- Search completion confirmation

## Dependencies

- `expo-blur` - for translucent search input
- React Native Animated API - for all animations
- Existing theme and color system
- AsyncStorage (not used here, but available)

## Performance

- Animated API with `useNativeDriver: true` for smooth 60fps
- ScrollView for categorized sections (simpler than FlatList for this use case)
- Optimized re-renders with proper state management
- Efficient animation cleanup on unmount

