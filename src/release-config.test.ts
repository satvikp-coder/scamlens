import * as fs from 'fs';
import * as path from 'path';

import { PRIVACY_POLICY_URL, SUPPORT_EMAIL } from './config';

const root = path.join(__dirname, '..');
const appJson = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8')).expo;
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

describe('release configuration guards', () => {
  it('ships no invented contact details', () => {
    const looksFake = /example|yourdomain|placeholder|test@|lorem|todo|xxx/i;
    for (const v of [SUPPORT_EMAIL, PRIVACY_POLICY_URL]) {
      if (v !== null) {
        expect(v).not.toMatch(looksFake);
      }
    }
    if (PRIVACY_POLICY_URL !== null) expect(PRIVACY_POLICY_URL).toMatch(/^https:\/\//);
    if (SUPPORT_EMAIL !== null) expect(SUPPORT_EMAIL).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
  });

  it('removes the network and other unneeded permissions', () => {
    const blocked: string[] = appJson.android.blockedPermissions;
    for (const p of ['INTERNET', 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE', 'SYSTEM_ALERT_WINDOW', 'VIBRATE']) {
      expect(blocked).toContain(`android.permission.${p}`);
    }
    expect(appJson.android.permissions ?? []).toEqual([]);
  });

  it('keeps Android backup off so history is not copied to a cloud account', () => {
    expect(appJson.android.allowBackup).toBe(false);
  });

  it('is Android-only and has a package id and an increasing-capable version code', () => {
    expect(appJson.platforms).toEqual(['android']);
    expect(appJson.android.package).toMatch(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/);
    // The final Play application ID. It cannot change after the first upload.
    expect(appJson.android.package).toBe('in.satvikpatel.scamlens');
    expect(Number.isInteger(appJson.android.versionCode)).toBe(true);
  });

  it('includes no analytics, ads, crash-reporting or networking libraries', () => {
    const deps = Object.keys(pkg.dependencies).join(' ');
    expect(deps).not.toMatch(/firebase|analytics|sentry|bugsnag|crashlytics|amplitude|mixpanel|segment|admob|ads|facebook|axios|apollo|socket/i);
  });

  it('does not track keystores, service-account files or env files in the project root', () => {
    const files = fs.readdirSync(root);
    expect(files.filter((f) => /\.(jks|keystore|p12|pem)$/i.test(f) || /^\.env(\.|$)/.test(f) || /service-account/i.test(f))).toEqual([]);
  });
});
