# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## API base URL and auth config

- The API base URL is resolved in `utils/config.ts`. Priority:
  1. `EXPO_PUBLIC_API_BASE_URL` env var (set this for any environment to override)
  2. In Expo Go/dev: falls back to your dev host (Android emulator `10.0.2.2`, iOS simulator `127.0.0.1`, physical device uses Expo’s inferred LAN IP)
  3. In standalone/TestFlight/App Store builds: falls back to `https://deen-fastapi.duckdns.org`
- Cognito/OIDC settings are also in `utils/config.ts` and can be overridden with `EXPO_PUBLIC_COGNITO_*` vars. The default redirect is the Expo proxy URL; for production/dev-client builds, set `EXPO_PUBLIC_AUTH_REDIRECT_URI` to your custom app scheme (e.g., `deenreactnative://auth`) and register it in Cognito.
- To change these values:
  - Temporary: run with env vars, e.g. `EXPO_PUBLIC_API_BASE_URL=http://192.168.x.y:8080 npx expo start`
  - Persistent: edit the defaults inside `utils/config.ts` (but prefer env vars for per-env overrides)

## Building for TestFlight / App Store (env vars + EAS)

- Env file example (`.env.appstore` in repo):

  ```
  EXPO_PUBLIC_API_BASE_URL=
  EXPO_PUBLIC_AUTH_REDIRECT_URI=
  EXPO_PUBLIC_COGNITO_DOMAIN=
  EXPO_PUBLIC_COGNITO_CLIENT_ID=
  EXPO_PUBLIC_COGNITO_ISSUER=
  ```

  (Add your own Cognito values if you switch pools/clients.)

- Push envs to Expo Application Services (EAS):

  ```
  npx eas-cli env:push --environment appstore --path .env.appstore
  ```

  Use whatever environment name you like (e.g., `appstore`, `production`).

- Build using that environment:

  ```
  npx eas-cli build --platform ios --environment appstore
  # or Android:
  npx eas-cli build --platform android --environment appstore
  ```

- Local dev with these envs (optional): export them before `expo start`, e.g. `export $(cat .env.appstore | xargs)` then `npx expo start`.

- Cognito callbacks: keep the Expo proxy URLs for Expo Go, and add `deenreactnative://auth` to Allowed Callback and Sign-out URLs for standalone/dev-client/TestFlight/App Store builds.
