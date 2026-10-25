#!/usr/bin/env bash
# Builds a standalone release APK (JS bundled in, no Metro needed) and
# installs it on the Android phone plugged in over USB.
#
#   scripts/flash-android.sh
#
# Phone: enable Developer options + USB debugging, plug in, accept the prompt.
set -euo pipefail
cd "$(dirname "$0")/../app"

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
if [[ -z "${JAVA_HOME:-}" ]]; then
  # Gradle needs JDK 17+.
  for jdk in /usr/lib/jvm/java-21-openjdk /usr/lib/jvm/java-17-openjdk; do
    [[ -d "$jdk" ]] && export JAVA_HOME="$jdk" && break
  done
  [[ -z "${JAVA_HOME:-}" && "$(uname)" == Darwin ]] && export JAVA_HOME="$(/usr/libexec/java_home -v 17+)"
fi

npx expo run:android --variant release "$@"
