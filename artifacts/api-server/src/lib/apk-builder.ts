import { execSync, exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as fsp from "fs/promises";
import * as path from "path";
import * as os from "os";
import { logger } from "./logger";

const execAsync = promisify(exec);

const ANDROID_SDK_ROOT = process.env.ANDROID_SDK_ROOT || path.join(os.homedir(), "android-sdk");
const ANDROID_HOME = ANDROID_SDK_ROOT;
const TEMPLATE_DIR = path.resolve(__dirname, "../../android-template");
const SETUP_SCRIPT = path.resolve(__dirname, "../../scripts/setup-android-sdk.sh");
const KEYSTORE_PATH = path.join(os.homedir(), ".android", "debug.keystore");
const APK_OUTPUT_DIR = process.env.APK_OUTPUT_DIR || path.join(os.homedir(), "apk-outputs");

let sdkReady = false;
let sdkSetupPromise: Promise<void> | null = null;

export interface ApkBuildOptions {
  jobId: string;
  webUrl: string;
  appName: string;
  packageName: string;
  versionName?: string;
  splashScreenColor?: string | null;
  themeColor?: string | null;
}

export interface ApkBuildResult {
  apkPath: string;
  downloadUrl: string;
}

async function ensureAndroidSdk(): Promise<void> {
  if (sdkReady) return;
  if (sdkSetupPromise) return sdkSetupPromise;

  sdkSetupPromise = (async () => {
    logger.info("Checking Android SDK setup...");

    const sdkManagerPath = path.join(ANDROID_SDK_ROOT, "cmdline-tools", "latest", "bin", "sdkmanager");
    const buildToolsPath = path.join(ANDROID_SDK_ROOT, "build-tools", "34.0.0");
    const wrapperJar = path.join(TEMPLATE_DIR, "gradle", "wrapper", "gradle-wrapper.jar");

    if (!fs.existsSync(sdkManagerPath) || !fs.existsSync(buildToolsPath) || !fs.existsSync(wrapperJar)) {
      logger.info("Android SDK not fully set up — running setup script (this may take a few minutes on first run)...");
      try {
        fs.chmodSync(SETUP_SCRIPT, 0o755);
        await execAsync(`bash "${SETUP_SCRIPT}"`, {
          timeout: 10 * 60 * 1000,
          env: { ...process.env, ANDROID_SDK_ROOT, ANDROID_HOME },
        });
        logger.info("Android SDK setup complete.");
      } catch (err: any) {
        logger.error({ err }, "Android SDK setup failed");
        throw new Error("Android SDK setup failed: " + (err.stderr || err.message));
      }
    } else {
      logger.info("Android SDK already set up.");
    }

    await ensureDebugKeystore();
    sdkReady = true;
  })();

  return sdkSetupPromise;
}

async function ensureDebugKeystore(): Promise<void> {
  if (fs.existsSync(KEYSTORE_PATH)) return;

  await fsp.mkdir(path.dirname(KEYSTORE_PATH), { recursive: true });
  logger.info("Generating debug keystore...");

  await execAsync(
    `keytool -genkey -v -keystore "${KEYSTORE_PATH}" \
      -storepass android -alias androiddebugkey -keypass android \
      -keyalg RSA -keysize 2048 -validity 10000 \
      -dname "CN=Android Debug,O=Android,C=US"`,
    { timeout: 30000 }
  );
  logger.info("Debug keystore generated.");
}

async function generateAppIcon(
  outputDir: string,
  appName: string,
  color: string
): Promise<void> {
  const initials = appName
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);

  const bgColor = isValidHexColor(color) ? color : "#0891b2";

  const sizes: Record<string, number> = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
  };

  await Promise.all(
    Object.entries(sizes).map(async ([dir, size]) => {
      const outPath = path.join(outputDir, "app", "src", "main", "res", dir);
      await fsp.mkdir(outPath, { recursive: true });
      const fontSize = Math.round(size * 0.38);

      for (const name of ["ic_launcher.png", "ic_launcher_round.png"]) {
        const geometry = name.includes("round")
          ? `-resize ${size}x${size} ( +clone -alpha extract ( -size ${size}x${size} xc:black -fill white -draw "circle ${size / 2},${size / 2} ${size / 2},0" ) -compose Multiply -composite ) -compose CopyOpacity -composite`
          : "";

        await execAsync(
          `magick -size ${size}x${size} xc:"${bgColor}" \
            -gravity Center -fill white \
            -font "DejaVu-Sans-Bold" -pointsize ${fontSize} \
            -annotate 0 "${initials}" \
            ${geometry} \
            "${path.join(outPath, name)}"`,
          { timeout: 15000 }
        );
      }
    })
  );
}

function isValidHexColor(color: string | null | undefined): color is string {
  return typeof color === "string" && /^#[0-9a-fA-F]{6}$/.test(color);
}

function sanitizePackageName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, "")
    .replace(/^\.+|\.+$/g, "")
    .replace(/\.{2,}/g, ".")
    .split(".")
    .filter(Boolean)
    .join(".");
}

async function replacePlaceholders(dir: string, vars: Record<string, string>): Promise<void> {
  const files = await fsp.readdir(dir, { withFileTypes: true });

  await Promise.all(
    files.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await replacePlaceholders(fullPath, vars);
      } else if (
        entry.isFile() &&
        (entry.name.endsWith(".kt") ||
          entry.name.endsWith(".xml") ||
          entry.name.endsWith(".gradle") ||
          entry.name.endsWith(".gradle.kts") ||
          entry.name.endsWith(".properties"))
      ) {
        let content = await fsp.readFile(fullPath, "utf-8");
        let changed = false;
        for (const [key, value] of Object.entries(vars)) {
          const pattern = `{{${key}}}`;
          if (content.includes(pattern)) {
            content = content.split(pattern).join(value);
            changed = true;
          }
        }
        if (changed) await fsp.writeFile(fullPath, content, "utf-8");
      }
    })
  );
}

async function copyDir(src: string, dest: string): Promise<void> {
  await fsp.mkdir(dest, { recursive: true });
  const entries = await fsp.readdir(src, { withFileTypes: true });

  await Promise.all(
    entries.map(async (entry) => {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        await copyDir(srcPath, destPath);
      } else {
        await fsp.copyFile(srcPath, destPath);
      }
    })
  );
}

export async function buildApk(options: ApkBuildOptions): Promise<ApkBuildResult> {
  const {
    jobId,
    webUrl,
    appName,
    packageName,
    versionName = "1.0.0",
    splashScreenColor,
    themeColor,
  } = options;

  await ensureAndroidSdk();

  const buildDir = path.join(os.tmpdir(), `lumyn-build-${jobId}`);
  await fsp.mkdir(buildDir, { recursive: true });

  try {
    logger.info({ jobId, webUrl }, "Copying Android template...");
    await copyDir(TEMPLATE_DIR, buildDir);

    const safePackage = sanitizePackageName(packageName || `com.lumynwrapp.${jobId.replace(/-/g, "").slice(0, 8)}`);
    const versionCode = Math.floor(Date.now() / 1000) % 999999;
    const splash = isValidHexColor(splashScreenColor) ? splashScreenColor : "#0f172a";
    const theme = isValidHexColor(themeColor) ? themeColor : "#0891b2";

    const kotlinSrcOriginal = path.join(buildDir, "app", "src", "main", "kotlin", "com", "lumyn", "webwrapper");
    const packageParts = safePackage.split(".");
    const kotlinSrcNew = path.join(buildDir, "app", "src", "main", "kotlin", ...packageParts);
    await fsp.mkdir(kotlinSrcNew, { recursive: true });

    const mainActivitySrc = path.join(kotlinSrcOriginal, "MainActivity.kt");
    const mainActivityDest = path.join(kotlinSrcNew, "MainActivity.kt");
    if (fs.existsSync(mainActivitySrc) && kotlinSrcOriginal !== kotlinSrcNew) {
      await fsp.copyFile(mainActivitySrc, mainActivityDest);
      await fsp.rm(kotlinSrcOriginal, { recursive: true, force: true });
    }

    const placeholders: Record<string, string> = {
      APP_NAME: appName,
      PACKAGE_NAME: safePackage,
      WEB_URL: webUrl,
      VERSION_NAME: versionName,
      VERSION_CODE: String(versionCode),
      SPLASH_COLOR: splash,
      THEME_COLOR: theme,
    };

    logger.info({ jobId, placeholders }, "Replacing template placeholders...");
    await replacePlaceholders(buildDir, placeholders);

    logger.info({ jobId }, "Generating app icon...");
    await generateAppIcon(buildDir, appName, theme);

    const localProperties = path.join(buildDir, "local.properties");
    await fsp.writeFile(
      localProperties,
      `sdk.dir=${ANDROID_SDK_ROOT}\njava.home=${process.env.JAVA_HOME || ""}\n`,
      "utf-8"
    );

    const gradlew = path.join(buildDir, "gradlew");
    fs.chmodSync(gradlew, 0o755);

    logger.info({ jobId }, "Running Gradle build (this may take 1-2 minutes)...");
    const buildEnv = {
      ...process.env,
      ANDROID_HOME,
      ANDROID_SDK_ROOT,
      JAVA_HOME: process.env.JAVA_HOME || execSync("dirname $(dirname $(readlink -f $(which java)))").toString().trim(),
      GRADLE_OPTS: "-Dorg.gradle.daemon=false -Dorg.gradle.jvmargs=-Xmx1g",
    };

    const { stdout, stderr } = await execAsync(
      `"${gradlew}" assembleRelease --no-daemon --stacktrace`,
      {
        cwd: buildDir,
        timeout: 10 * 60 * 1000,
        env: buildEnv,
        maxBuffer: 50 * 1024 * 1024,
      }
    );

    if (process.env.NODE_ENV !== "production") {
      logger.debug({ stdout: stdout.slice(-3000), stderr: stderr.slice(-3000) }, "Gradle output");
    }

    const apkSrc = path.join(buildDir, "app", "build", "outputs", "apk", "release", "app-release.apk");

    if (!fs.existsSync(apkSrc)) {
      throw new Error(`APK not found at expected path: ${apkSrc}. Build may have failed.`);
    }

    await fsp.mkdir(APK_OUTPUT_DIR, { recursive: true });
    const apkOutputPath = path.join(APK_OUTPUT_DIR, `${jobId}.apk`);
    await fsp.copyFile(apkSrc, apkOutputPath);

    const appUrl = process.env.APP_URL || `http://localhost:${process.env.PORT}`;
    const downloadUrl = `${appUrl}/api/conversions/${jobId}/download`;

    logger.info({ jobId, apkOutputPath }, "APK build complete.");
    return { apkPath: apkOutputPath, downloadUrl };
  } finally {
    fsp.rm(buildDir, { recursive: true, force: true }).catch(() => {});
  }
}

export function getApkPath(jobId: string): string {
  return path.join(APK_OUTPUT_DIR, `${jobId}.apk`);
}

export { ensureAndroidSdk };
