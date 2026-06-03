# 🍎 Kall — calories from a photo

A React Native (Expo) mobile app: **take a photo of your food and an AI estimates
calories and macros** (protein / fat / carbs). Works with a 12k-item offline food
database for instant lookups and falls back to AI vision when you snap a picture.

> Personal mobile project. Demonstrates Expo, the device camera pipeline,
> on-device storage, an offline product database, and AI vision via an
> OpenAI-compatible API.

## ✨ Features

- 📷 **Snap & analyze** — photograph a meal, get calories + macros in seconds
- 🤖 **AI vision** through [OpenRouter](https://openrouter.ai) (free vision models, auto-fallback between models on rate limits)
- 📚 **Offline database** of ~12,000 Russian products (Open Food Facts, ODbL) for instant search without AI
- 📊 **Daily stats** — track intake against a goal, with onboarding to set targets
- 🔔 Local notifications / reminders
- 🔑 **Bring-your-own-key** — the API key is entered in-app and stored on device (nothing hardcoded)

## 🧱 Tech stack

| Area | Tech |
|------|------|
| Framework | React Native + [Expo](https://expo.dev) (~SDK 56) |
| Camera | `expo-camera`, `expo-image-picker`, `expo-image-manipulator` |
| Storage | `@react-native-async-storage/async-storage` |
| AI | OpenAI-compatible vision API (OpenRouter) |
| Data | Open Food Facts offline export (ODbL) |

## 🚀 Run it

### Quick test (APK)

Build a debug APK and install it on Android:

```bash
cd android
./gradlew assembleRelease
# -> android/app/build/outputs/apk/release/app-release.apk
```

On first launch the app asks for an **API key**:

1. Sign up free at <https://openrouter.ai>
2. Create a key at <https://openrouter.ai/keys> (starts with `sk-or-v1-...`)
3. Paste it in the app → it's saved on the device. Change it anytime via ⚙.

### Development (Expo Go)

```bash
npm install
npx expo start
# scan the QR code with Expo Go (Android) or the Camera app (iOS)
```

## 📁 Project layout

```
kall/
├── App.js                # root component / navigation
├── config.js             # AI endpoint + model list (key is entered at runtime)
├── screens/              # Home, Onboarding, Stats
├── components/           # UI, including the API-key screen
├── lib/                  # analyzeFood, calorie math, offline food DB, storage
└── assets/               # icons & images
```

## ⚖️ License

See [LICENSE](LICENSE). Food data from Open Food Facts under the ODbL.
