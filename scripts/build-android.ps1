<#
.SYNOPSIS
  Build the Android app from a SHORT folder path (Windows).

.DESCRIPTION
  Native C++ builds exceed Windows' 260-character path limit when the project
  lives in a deep folder. This script copies the source to a short folder
  (default C:\sl), installs dependencies there, generates the native project,
  runs Gradle, and copies the result back to <project>\build-output\.

  Requirements: JAVA_HOME must point to a JDK 17 (NOT 24/25), and ANDROID_HOME
  must point to the Android SDK.

.EXAMPLE
  $env:JAVA_HOME = "C:\Users\you\tools\jdk-17.0.20.1+1"
  .\scripts\build-android.ps1                       # test APK (debug-signed unless an upload key is configured)
  .\scripts\build-android.ps1 -Task bundleRelease   # Play bundle (.aab)
#>
param(
  [string]$Work = 'C:\s',
  [ValidateSet('assembleRelease', 'bundleRelease', 'both')]
  [string]$Task = 'assembleRelease',
  # Refuse to build if the upload key is not configured (default: required for bundle builds).
  [switch]$AllowDebugSigning,
  [string]$Architectures = 'arm64-v8a,x86_64'
)

# Native tools (npm, java, gradle) write warnings to stderr; that must not stop the script.
# Failures are detected through exit codes below.
$ErrorActionPreference = 'Continue'
$src = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

if (-not $env:JAVA_HOME) { throw 'JAVA_HOME is not set. Point it at a JDK 17.' }
# java prints its version on stderr, so go through cmd to read it safely.
$javaVersion = (cmd /c "`"$env:JAVA_HOME\bin\java.exe`" -version 2>&1" | Select-Object -First 1).ToString()
if ($javaVersion -notmatch '"17\.') { throw "JAVA_HOME must be JDK 17, but found: $javaVersion" }
if (-not $env:ANDROID_HOME) { $env:ANDROID_HOME = Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
# Keep the C++ build folder path short (see plugins/with-release-signing.js).
$env:SCAMLENS_CXX_DIR = 'C:\c'

# Release builds must be signed with the upload key (see plugins/with-release-signing.js).
$userGradle = Join-Path $env:USERPROFILE '.gradle\gradle.properties'
$hasKey = (Test-Path $userGradle) -and (Select-String -Path $userGradle -Pattern '^SCAMLENS_UPLOAD_STORE_FILE=' -Quiet)
if ($hasKey) {
  $keyFile = ((Select-String -Path $userGradle -Pattern '^SCAMLENS_UPLOAD_STORE_FILE=(.*)$').Matches[0].Groups[1].Value).Trim()
  if (-not (Test-Path $keyFile)) { throw "Upload keystore not found: $keyFile" }
} elseif (-not $AllowDebugSigning) {
  throw 'No upload key configured (SCAMLENS_UPLOAD_STORE_FILE in ~/.gradle/gradle.properties). Configure it, or pass -AllowDebugSigning for a test-only build.'
}

Write-Host "Copying source to $Work ..."

New-Item -ItemType Directory -Force $Work | Out-Null
robocopy $src $Work /MIR /XD node_modules android ios .git .expo .cxx build dist build-output /XF *.log /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy failed ($LASTEXITCODE)" }

Push-Location $Work
try {
  if (-not (Test-Path 'node_modules\.package-lock.json')) { npm ci; if ($LASTEXITCODE) { throw 'npm ci failed' } }
  npx expo prebuild --platform android --clean --no-install
  if ($LASTEXITCODE) { throw 'expo prebuild failed' }
  Push-Location android
  try {
    $tasks = if ($Task -eq 'both') { @('assembleRelease', 'bundleRelease') } else { @($Task) }
    .\gradlew.bat @tasks "-PreactNativeArchitectures=$Architectures"
    if ($LASTEXITCODE) { throw "Gradle $Task failed" }
  } finally { Pop-Location }
} finally { Pop-Location }

$out = Join-Path $src 'build-output'
New-Item -ItemType Directory -Force $out | Out-Null
Get-ChildItem "$Work\android\app\build\outputs" -Recurse -Include *.apk, *.aab | ForEach-Object {
  Copy-Item $_.FullName $out -Force
  Write-Host "Built: $(Join-Path $out $_.Name)"
}
