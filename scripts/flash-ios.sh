#!/usr/bin/env bash
# Builds a release app (JS bundled in, no Metro needed) and installs it on
# the iPhone plugged into this Mac.
#
#   scripts/flash-ios.sh
#
# One-time setup:
#   1. Xcode → Settings → Accounts: add your Apple ID (free is fine).
#   2. Run this once; it generates app/ios. If signing fails, open
#      app/ios/Spark.xcworkspace, select the Spark target → Signing &
#      Capabilities → pick your Team, then run this again.
#   3. iPhone: Settings → Privacy & Security → Developer Mode → on.
#   4. After the first install: Settings → General → VPN & Device
#      Management → trust your Apple ID.
# Free Apple IDs re-sign every 7 days: just run this again.
set -euo pipefail
cd "$(dirname "$0")/../app"

# Local build: never talk to Expo's servers (no Expo account needed).
export EXPO_OFFLINE=1

npx expo run:ios --device --configuration Release "$@"
