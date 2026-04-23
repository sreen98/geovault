# GeoVault — Release Flow

Quick reference for shipping updates after the initial setup is done.
For first-time Play Console / OAuth / Data Safety setup, see `PLAYSTORE-RELEASE.md`.

---

## Before You Start

1. Merge all changes to `main` and pull locally.
2. Type check must be clean:
   ```bash
   node node_modules/typescript/bin/tsc --noEmit
   ```
3. Smoke test on a dev build (`npx expo run:android` or `run:ios`). Cover the golden path and anything you changed.
4. Decide which track you're shipping to:
   - **Closed testing** — existing testers, fast review, use for validating a build before going wide.
   - **Production** — public rollout. Only ship here after the same build has survived closed testing.

---

## Step 1: Bump the Version

Open `app.config.ts` and update `android.versionCode`. This is the only mandatory bump — Play Store requires it to be strictly increasing on every upload.

```ts
android: {
  package: "com.geovault.app",
  versionCode: 6,   // bump this every release
  ...
}
```

**When to also bump `version` (the user-facing `"1.0.x"` string):**
- Bug-fix only, no new features → usually **don't bump** the version string.
- New feature or UX change → bump the patch or minor (`"1.0.0"` → `"1.1.0"`).
- Breaking schema change or major redesign → bump major (`"1.0.0"` → `"2.0.0"`).

If you bump the version string, update all three spots so they stay in sync:
- `app.config.ts` → `version`
- `package.json` → `version`
- `src/constants/theme.ts` → `APP_VERSION` (shown in the app's Settings page)

---

## Step 2: Build the AAB

```bash
npm run build:android:production
```

This runs `eas build --platform android --profile production` in EAS's cloud. Takes 10–20 minutes.

While it's building:
- EAS reuses the same Android keystore it generated for earlier uploads. Don't create a new one — Play Store rejects AABs signed with a different key.
- You'll get a build URL. When it's done, download the `.aab` from there.

**If the build fails:**
- Click the build URL to see logs.
- Most failures are dependency mismatches after an Expo SDK upgrade, or a missing env var in `eas.json`'s `production` profile.
- Fix locally, re-run the script.

---

## Step 3: Upload to Play Console

1. Play Console → **GeoVault** → **Test and release**.
2. Pick the track:
   - **Closed testing** → your existing track → **Create new release**.
   - **Production** → **Production** page → **Create new release**.
3. Click **Upload** and drop the `.aab` from EAS.
4. Release name auto-fills from the AAB's versionCode (e.g. `6 (1.0.0)`). Leave it or rename.
5. Add **release notes** (see template below).
6. **Save** → **Review release** → **Start rollout**.

Review typically completes in a few hours for closed testing, 1–3 days for production.

---

## Step 4: Release Notes Template

Keep them terse and user-facing. Tester-facing notes can be more technical; production notes should read like App Store changelogs.

```
Improvements
- <short user-visible change>
- <another>

Bug fixes
- <what got fixed, no file names or commit hashes>
```

Example (bug-fix release):
```
Bug fixes
- Place names pasted from Maps URLs no longer include the full address.
- Pick on Map is now easier to find above the Map Link field.
- Coordinates are set explicitly via GPS, map picker, or manual entry for reliability.
```

---

## Step 5: Promote Closed Testing → Production

Once a closed-testing release has been live long enough to catch regressions (typically 2–7 days depending on confidence):

1. Play Console → **Test and release** → **Closed testing** → your track.
2. Open the release you want to promote.
3. Click **Promote release** → **Production**.
4. Confirm the rollout percentage (start with 20% for larger audiences; 100% is fine while the user base is small).

Same AAB, no rebuild needed.

---

## Step 6: Tag the Release in Git

After a successful production rollout:

```bash
git tag -a v1.0.0-vc6 -m "versionCode 6: <summary>"
git push origin v1.0.0-vc6
```

Using `v<version>-vc<versionCode>` makes it easy to map a Play Console release back to the exact commit.

---

## Quick Checklist

Copy this for every release:

- [ ] Code merged to `main`, pulled locally
- [ ] `tsc --noEmit` clean
- [ ] Smoke tested on device
- [ ] `versionCode` bumped in `app.config.ts`
- [ ] (If new feature) `version` bumped in all three files
- [ ] `npm run build:android:production` succeeded
- [ ] `.aab` downloaded from EAS
- [ ] Uploaded to correct Play Console track
- [ ] Release notes written
- [ ] Release submitted for review
- [ ] Git tag pushed

---

## Useful Commands

```bash
# Full type check
node node_modules/typescript/bin/tsc --noEmit

# Dev build on device
npx expo run:android
npx expo run:ios

# Production builds (AAB / IPA)
npm run build:android:production
npm run build:ios:production

# Internal-test APK (sideloadable, not for store)
npm run build:android:preview
npm run build:ios:preview

# Regenerate native projects if Expo SDK or native config changes
npx expo prebuild --clean
```

---

## Troubleshooting

**"Version code 6 has already been used":** bump `versionCode` again and rebuild.

**"Signing certificate does not match":** you built with a different keystore than Play App Signing expects. If you ran `eas build` locally with `--local` or recreated the EAS project, the managed keystore can drift. Use `eas credentials` to inspect.

**Build succeeds but Google Sign-In fails in the uploaded build:** the Play Store signing SHA-1 isn't registered in your Google Cloud OAuth client. See `PLAYSTORE-RELEASE.md` Step 11.

**Release stuck "In review" longer than expected:** check the Play Console inbox for a policy warning or additional info request.
