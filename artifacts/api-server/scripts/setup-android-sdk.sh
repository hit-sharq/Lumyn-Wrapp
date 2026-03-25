#!/usr/bin/env bash
set -e

ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-/home/runner/android-sdk}"
CMDLINE_TOOLS_DIR="$ANDROID_SDK_ROOT/cmdline-tools/latest"
GRADLE_WRAPPER_JAR="$(dirname "$0")/../android-template/gradle/wrapper/gradle-wrapper.jar"

echo "==> Setting up Android SDK at $ANDROID_SDK_ROOT"

# Download command-line tools if not present
if [ ! -f "$CMDLINE_TOOLS_DIR/bin/sdkmanager" ]; then
    echo "==> Downloading Android Command-Line Tools..."
    mkdir -p "$ANDROID_SDK_ROOT/cmdline-tools"
    TMP_ZIP="/tmp/cmdline-tools.zip"
    curl -fsSL "https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip" -o "$TMP_ZIP"
    unzip -q "$TMP_ZIP" -d "$ANDROID_SDK_ROOT/cmdline-tools"
    mv "$ANDROID_SDK_ROOT/cmdline-tools/cmdline-tools" "$CMDLINE_TOOLS_DIR"
    rm "$TMP_ZIP"
    echo "==> Android Command-Line Tools downloaded."
fi

export ANDROID_HOME="$ANDROID_SDK_ROOT"
export PATH="$CMDLINE_TOOLS_DIR/bin:$ANDROID_SDK_ROOT/platform-tools:$PATH"

# Accept licenses and install required SDK components
echo "==> Installing Android SDK components..."
yes | sdkmanager --licenses > /dev/null 2>&1 || true
sdkmanager "build-tools;34.0.0" "platforms;android-34" > /dev/null 2>&1
echo "==> Android SDK components installed."

# Download Gradle wrapper JAR if not present
if [ ! -f "$GRADLE_WRAPPER_JAR" ]; then
    echo "==> Downloading Gradle wrapper JAR..."
    WRAPPER_DIR="$(dirname "$GRADLE_WRAPPER_JAR")"
    mkdir -p "$WRAPPER_DIR"
    curl -fsSL "https://github.com/gradle/gradle/raw/v8.6.0/gradle/wrapper/gradle-wrapper.jar" -o "$GRADLE_WRAPPER_JAR"
    echo "==> Gradle wrapper JAR downloaded."
fi

echo "==> Android SDK setup complete!"
