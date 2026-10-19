# iOS Launcher

An iOS-style home screen launcher for Android. Hybrid app: a tiny Java/WebView shell (`android/`) rendering a React UI (`web/`), built automatically to an APK by GitHub Actions.

## Features (current)

- iOS home screen: app grid pages, iOS-style folder ("iOS" folder with the built-in simulator apps), A–Z App Library, dock, widgets page
- Real installed apps with real icons, launch, long-press menu (App Info / Uninstall / hide)
- Spotlight search includes installed apps
- Live status bar: battery, charging, Wi-Fi / cellular, clock
- Default-launcher banner with direct link to system home settings

## Download

Grab the APK from the [latest build artifact](../../actions) (log in to GitHub), or from Releases when a tag is pushed.

## Build locally

```
cd web && npm ci && npm run build
rm -rf ../android/app/src/main/assets/web && mkdir -p ../android/app/src/main/assets/web
cp -R dist/. ../android/app/src/main/assets/web/
cd ../android && ./gradlew assembleRelease
```

Requires JDK 17+ and Android SDK (API 36).

## CI

`.github/workflows/build.yml` builds the web bundle, embeds it into the APK, and signs it when these repository secrets are set:

- `KEYSTORE_BASE64` — base64 of the release keystore
- `KEYSTORE_PASSWORD`
- `KEY_ALIAS`
- `KEY_PASSWORD`

Every push to `main` uploads an APK artifact. Pushing a tag like `v0.1.0` also creates a Release with the APK attached. `versionCode` = workflow run number.

## Set as default launcher

After installing: `Settings → Apps → Default apps → Home app → iOS Launcher`, or tap the banner inside the app. On some OEM ROMs (XOS/MIUI/etc.) also allow autostart and disable battery optimization so the launcher stays responsive.

## Disclaimer

Fan-made project. Not affiliated with, endorsed by, or connected to Apple Inc. iOS is a trademark of Apple Inc. All app icons used for the simulator apps are drawn from scratch and are original artwork.
