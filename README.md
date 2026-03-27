# Deen — React Native App

An Expo / React Native app for the Deen platform, built with [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing).

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 18 LTS or later | |
| npm | comes with Node | |
| Expo Go (mobile) | latest | for quick dev on a physical device |
| Xcode | 15+ | iOS simulator / native builds (macOS only) |
| CocoaPods | latest | iOS native dependencies (`sudo gem install cocoapods`) |
| Android Studio | latest | Android emulator / native builds |
| EAS CLI | ≥ 16.28.0 | production builds (`npm install -g eas-cli`) |

---

## Cloning

This repo is used as a git submodule inside `deen-mobile-frontend`. To clone it standalone:

```bash
git clone <repo-url> deen-react-native
cd deen-react-native
```

Or, when cloning the parent repo, make sure to initialise submodules:

```bash
git clone --recurse-submodules <parent-repo-url>
# or, if already cloned:
git submodule update --init --recursive
```

---

## Install dependencies

```bash
npm install
```

For iOS, also install native pod dependencies:

```bash
cd ios && pod install && cd ..
```

> Re-run `pod install` whenever you add or update packages that include native code.

---

## Environment setup

Runtime configuration lives in `utils/config.ts` and is driven by `EXPO_PUBLIC_*` environment variables.

### Quick start (no env file needed)

In Expo Go / dev mode the app automatically points to your local machine:

- **Android emulator** → `10.0.2.2:8080`
- **iOS simulator / web** → `127.0.0.1:8080`
- **Physical device** → inferred from the Expo dev server's LAN IP

No `.env` file is required for local development against a locally running backend.

### Overriding the API URL

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:8080 npx expo start
```

### Auth (AWS Cognito)

`utils/config.ts` ships with default Cognito values that point to the shared dev pool. If you need to use a different pool, set these env vars:

```
EXPO_PUBLIC_COGNITO_DOMAIN=
EXPO_PUBLIC_COGNITO_CLIENT_ID=
EXPO_PUBLIC_COGNITO_ISSUER=
EXPO_PUBLIC_AUTH_REDIRECT_URI=
```

For **Expo Go**, leave `AUTH_REDIRECT_URI` unset — it defaults to the Expo proxy URL (`https://auth.expo.io/@snassabi7/deen-react-native`), which must be registered as a Cognito callback/logout URL.

For **standalone / dev-client / TestFlight / App Store builds**, set `EXPO_PUBLIC_AUTH_REDIRECT_URI=deenreactnative://auth` and ensure both `deenreactnative://auth` and the Expo proxy URL are registered in your Cognito App Client's Allowed Callback and Sign-out URLs.

### `.env.appstore` template

A `.env.appstore` file is included in the repo as a reference template. Use it as a starting point when pushing env vars to EAS (see [Building for production](#building-for-testflight--app-store) below). Do **not** commit real secrets — the file contains only non-sensitive public values.

---

## Running locally

### Expo Go (fastest, no native build required)

```bash
npm run start
```

Scan the QR code with the Expo Go app on your phone, or press `i` for iOS simulator / `a` for Android emulator.

### iOS simulator (native build)

```bash
npm run ios
```

### Android emulator or device (native build)

```bash
npm run android
```

### Web

```bash
npm run web
```

---

## Project structure

```
app/                  # Expo Router routes (file-based navigation)
  (tabs)/             # Bottom-tab screens (chat, references, hikmah)
  hikmah/             # Lesson and tree sub-routes
  login.tsx           # Auth entry point
  settings.tsx        # Settings screen
components/           # Reusable UI components, grouped by feature
hooks/                # Shared React hooks (auth, theme, progress)
utils/                # App services and shared logic
  api.ts              # HTTP client
  auth.ts             # Cognito auth helpers
  config.ts           # Env-driven runtime configuration
constants/            # Theme tokens and shared constants
assets/               # Images and fonts
ios/                  # Native iOS project (tracked in git)
```

---

## Linting

```bash
npm run lint
```

Run this before every PR.

---

## Building for TestFlight / App Store

### 1. Fill in your env file

Edit `.env.appstore` with the correct production values:

```
EXPO_PUBLIC_API_BASE_URL=https://deen-fastapi.duckdns.org
EXPO_PUBLIC_AUTH_REDIRECT_URI=deenreactnative://auth
EXPO_PUBLIC_COGNITO_DOMAIN=https://eu-north-1nko9a23pf.auth.eu-north-1.amazoncognito.com
EXPO_PUBLIC_COGNITO_CLIENT_ID=1bukdrndjlh653q4ddfnmelunq
EXPO_PUBLIC_COGNITO_ISSUER=https://cognito-idp.eu-north-1.amazonaws.com/eu-north-1_nKO9a23pF
```

### 2. Push env vars to EAS

```bash
npx eas-cli env:push --environment appstore --path .env.appstore
```

### 3. Trigger a build

```bash
# iOS
npx eas-cli build --platform ios --profile production

# Android
npx eas-cli build --platform android --profile production
```

### 4. Local dev with production env vars (optional)

```bash
export $(cat .env.appstore | xargs) && npx expo start
```

---

## Useful links

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [AWS Cognito](https://docs.aws.amazon.com/cognito/)
