# Mobile App (Android APK) with Capacitor - Quick Guide

This project is configured with **Capacitor 8** to build and run as an Android mobile app alongside the web application.

---

## 1. Prerequisites

- **Android Studio**: Installed on your system ([Download Android Studio](https://developer.android.com/studio)).
- **Android SDK & Platform Tools**: Configured via Android Studio SDK Manager.
- **Java JDK**: JDK 17 or higher (recommended).

---

## 2. Generate the Android Project

Run this command once to initialize the native Android platform:

```bash
pnpm cap:add
```

_(This creates an `android/` directory inside `full-stack-school/` with a full Gradle Android project.)_

---

## 3. How to Develop & Test on Android

### Method A: Live Dev Server (Recommended during development)

1. Find your computer's local IP address (run `ipconfig` in Windows PowerShell, e.g. `192.168.1.15`).
2. In `capacitor.config.ts`, set:
   ```ts
   server: {
     url: 'http://192.168.1.15:3000', // your PC's IP or 'http://10.0.2.2:3000' if using Android Studio emulator
     cleartext: true
   }
   ```
3. Run the Next.js dev server:
   ```bash
   pnpm dev
   ```
4. Sync and open the app in Android Studio:
   ```bash
   pnpm cap:sync
   pnpm cap:open
   ```
5. In Android Studio, click **Run** (Green play button) targeting your connected phone or emulator.

---

### Method B: Build a Standalone APK

1. Open Android Studio:
   ```bash
   pnpm cap:open
   ```
2. In Android Studio's top menu, go to:
   **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
3. Once completed, a notification will appear with a **"locate"** link pointing to your debug APK:
   `android/app/build/outputs/apk/debug/app-debug.apk`.
4. Transfer this `.apk` to any Android phone and install!

---

## 4. Useful NPM Scripts

- `pnpm cap:add` : Adds the native Android project.
- `pnpm cap:sync` : Syncs plugins, web assets, and configs to Android.
- `pnpm cap:open` : Launches the project directly into Android Studio.
