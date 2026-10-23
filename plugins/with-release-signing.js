/**
 * Expo config plugin: sign the Android release build with an UPLOAD key that
 * lives OUTSIDE the repository.
 *
 * Put these four lines in your user-level Gradle file (never in this repo):
 *   Windows: %USERPROFILE%\.gradle\gradle.properties
 *   macOS/Linux: ~/.gradle/gradle.properties
 *
 *   SCAMLENS_UPLOAD_STORE_FILE=C:/secure/scamlens-upload.keystore
 *   SCAMLENS_UPLOAD_STORE_PASSWORD=...
 *   SCAMLENS_UPLOAD_KEY_ALIAS=...
 *   SCAMLENS_UPLOAD_KEY_PASSWORD=...
 *
 * If SCAMLENS_UPLOAD_STORE_FILE is not set, the release build falls back to
 * the debug key. A debug-signed build can be installed for testing but MUST
 * NOT be uploaded to Google Play.
 */
const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = 'SCAMLENS_UPLOAD_STORE_FILE';

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (c) => {
    let src = c.modResults.contents;
    if (src.includes(MARKER)) return c;

    // 1) Use the release signing config for the release build type when present.
    //    (Done first: the first "release {" in the file is the build type.)
    src = src.replace(
      /(release \{[\s\S]*?)signingConfig signingConfigs\.debug/,
      `$1signingConfig project.hasProperty('${MARKER}') ? signingConfigs.release : signingConfigs.debug`,
    );

    // 2) Define signingConfigs.release from user-level Gradle properties.
    src = src.replace(
      /signingConfigs \{\n/,
      `signingConfigs {
        release {
            if (project.hasProperty('${MARKER}')) {
                storeFile file(project.property('${MARKER}'))
                storePassword project.property('SCAMLENS_UPLOAD_STORE_PASSWORD')
                keyAlias project.property('SCAMLENS_UPLOAD_KEY_ALIAS')
                keyPassword project.property('SCAMLENS_UPLOAD_KEY_PASSWORD')
            }
        }
`,
    );

    // 3) Windows only: keep the C++ build folder path short. Set SCAMLENS_CXX_DIR
    //    (scripts/build-android.ps1 does) to avoid the 260-character path limit.
    src = src.replace(
      /android \{\n/,
      `android {
    if (System.getenv('SCAMLENS_CXX_DIR')) {
        externalNativeBuild {
            cmake {
                buildStagingDirectory file(System.getenv('SCAMLENS_CXX_DIR'))
            }
        }
    }
`,
    );

    c.modResults.contents = src;
    return c;
  });
};
