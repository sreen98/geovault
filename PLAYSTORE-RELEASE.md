# GeoVault — Play Store Release Guide

## Prerequisites Completed
- [x] Google Play Developer account ($25, identity verified)
- [x] Privacy policy hosted
- [x] App icon (512x512), feature graphic (1024x500), 6 screenshots ready
- [x] Google Drive backup working in dev

---

## Step 1: Build the AAB (Android App Bundle)

### 1a. Install EAS CLI
```bash
npm install -g eas-cli
```

### 1b. Login to Expo
```bash
eas login
```
If you don't have an Expo account, create one at https://expo.dev/signup

### 1c. Configure EAS
```bash
eas build:configure
```
This creates an `eas.json` file in your project root. The default config is usually fine.

### 1d. Build the production AAB
```bash
eas build --platform android --profile production
```
- Builds on Expo's cloud servers
- First build takes 10-15 minutes
- EAS generates and manages your keystore automatically
- When complete, you get a download link for the `.aab` file
- **Download and save the `.aab` file**

---

## Step 2: Create App in Play Console

1. Go to https://play.google.com/console
2. Click **"Create app"**
3. Fill in:
   - App name: `GeoVault`
   - Default language: English (United States)
   - App or Game: **App**
   - Free or Paid: **Free**
4. Accept the declarations
5. Click **Create app**

---

## Step 3: Store Listing

Go to **Grow → Store presence → Main store listing**

### Text Content

**App name:**
```
GeoVault
```

**Short description (max 80 characters):**
```
Save places privately. Notes, tags, search — all on your device.
```

**Full description (max 4000 characters):**
```
GeoVault is your private location notebook. Save restaurants, cafes, viewpoints, stays, and hidden gems with rich context — what to order, what to avoid, the best time to visit.

FEATURES
- Save places with notes, tags, and categories
- 9 categories: Dining, Cafe, Tourist Attraction, Stay, Viewpoint, Shopping, Fuel/EV, W.C, Other
- Category-specific fields like entry fee, trek time, price range
- Full-text search across names, locations, notes, and tags
- Open any place directly in your preferred maps app
- Dark and light themes

BACKUP
- Google Drive backup (manual or automatic)
- Auto-backup on a schedule: Daily, Weekly, or Monthly
- Restore with append or overwrite options
- JSON export and import for offline archiving

PRIVACY FIRST
- All data stored locally on your device
- No server, no analytics, no tracking
- Google Drive backup is optional and uses a hidden app-specific folder
- We never see your coordinates or sell your history

Built for travelers, foodies, and explorers who want to save places their way.
```

### Graphics
- **App icon:** Upload `assets/icon.png` (512x512)
- **Feature graphic:** Upload `assets/feature-graphic.png` (1024x500)
- **Phone screenshots:** Upload your 6 screenshots

Click **Save**

---

## Step 4: Content Rating

Go to **Policy → App content → Content rating**

1. Click **Start questionnaire**
2. Email: your email
3. Category: **Utility, Productivity, Communication, or Other**
4. Answer **No** to all content questions (violence, sexual content, drugs, gambling, etc.)
5. Click **Save** → **Next** → **Submit**
6. You'll receive an **Everyone** rating

---

## Step 5: Target Audience and Content

Go to **Policy → App content → Target audience and content**

1. Target age group: Select **18 and over**
   - This is the safest choice — avoids Teacher Approved program requirements and COPPA compliance
2. Click **Next** → **Save**

---

## Step 6: Privacy Policy

Go to **Policy → App content → Privacy policy**

1. Paste your hosted privacy policy URL
2. Click **Save**

---

## Step 7: Data Safety

Go to **Policy → App content → Data safety**

Fill the questionnaire:

### Overview
- Does your app collect or share any of the required user data types? **Yes**

### Data Collection

| Data type | Collected | Shared | Purpose | Optional |
|-----------|-----------|--------|---------|----------|
| Approximate location | No | — | — | — |
| Precise location | Yes | No | App functionality (saving current GPS position) | Yes (user can enter manually) |
| Email address | Yes | No | Account management (Google Drive backup) | Yes (backup is optional) |

### Data handling
- Is all collected data encrypted in transit? **Yes** (HTTPS)
- Do you provide a way for users to request data deletion? **Yes** (delete places in app, sign out of Google, uninstall)

### No advertising, no analytics, no third-party sharing

Click **Save** → **Submit**

---

## Step 8: App Access

Go to **Policy → App content → App access**

- Select **"All functionality is available without special access"**
- (The app works fully without sign-in. Google Drive backup is optional.)
- Click **Save**

---

## Step 9: Ads Declaration

Go to **Policy → App content → Ads**

- Does your app contain ads? **No**
- Click **Save**

---

## Step 10: Upload AAB and Create Release

### 10a. Enable Play App Signing
Go to **Release → Setup → App signing**
- Accept Play App Signing (Google manages your signing key)
- This is required for AAB uploads

### 10b. Create Release
Go to **Release → Production**

1. Click **"Create new release"**
2. Upload the `.aab` file you downloaded from EAS
3. Release name: `1.0.0`
4. Release notes:
   ```
   Initial release
   - Save places with rich notes, tags, and categories
   - Full-text search across all your data
   - Google Drive backup with auto-backup support
   - 9 place categories with custom fields
   - Dark and light theme support
   ```
5. Click **"Review release"**
6. Review any warnings (some are informational, not blocking)
7. Click **"Start rollout to Production"**

---

## Step 11: Post-Upload — Fix Google Sign-In for Production

**This is critical.** Without this step, Google Sign-In will NOT work for users who install from the Play Store.

### 11a. Get the Play Store signing SHA-1
1. In Play Console, go to **Setup → App signing**
2. Find **"App signing key certificate"**
3. Copy the **SHA-1 certificate fingerprint**

### 11b. Update Google Cloud Console
1. Go to https://console.cloud.google.com
2. Navigate to **APIs & Services → Credentials**
3. You have two options:
   - **Option A:** Edit your existing Android OAuth Client ID and replace the debug SHA-1 with the Play Store SHA-1
   - **Option B (Recommended):** Create a **new** Android OAuth Client ID with:
     - Package name: `com.geovault.app`
     - SHA-1: the Play Store signing SHA-1 from step 11a
   - Keep the debug one for development
4. Click **Save**

### 11c. Verify
- Install the app from Play Store (or Internal Testing track)
- Go to Settings → Backup to Google Drive
- Tap to sign in — it should work

---

## Step 12: Publish OAuth Consent Screen for Production

Your Google OAuth is currently in **"Testing" mode** which limits sign-in to 100 manually added test users.

### 12a. Prepare
1. Go to https://console.cloud.google.com
2. Navigate to **Google Auth Platform → Overview** (or APIs & Services → OAuth consent screen)

### 12b. Publish
1. Click **"Publish App"** (moves from Testing to In Production)
2. Google will review your consent screen
3. Since `drive.appdata` is a **non-sensitive scope**, the review process is simpler:
   - No security audit required
   - No letter of justification needed
   - Usually approved in a few days

### 12c. Required Information
Google may ask for:
- **App homepage URL:** Your GitHub repo URL or a landing page
- **Privacy policy URL:** The one you already hosted
- **App description:** Brief explanation of why Drive access is needed
  ```
  GeoVault uses Google Drive's app data folder to backup and restore 
  the user's saved places. The app only accesses a hidden, app-specific 
  folder and cannot see the user's other Drive files.
  ```
- **Authorized domains:** Your privacy policy domain (e.g., github.io)

### 12d. Timeline
- Non-sensitive scope verification: **2-5 business days**
- Until verified, only your test users can sign in
- After verification, any Google user can sign in

---

## Summary Checklist

### Before Upload
- [ ] AAB built with `eas build --platform android --profile production`
- [ ] Store listing filled (title, descriptions, icon, feature graphic, screenshots)
- [ ] Content rating completed
- [ ] Target audience set (18+)
- [ ] Privacy policy URL added
- [ ] Data safety questionnaire completed
- [ ] App access declared
- [ ] Ads declaration (no ads)

### Upload
- [ ] Play App Signing enabled
- [ ] AAB uploaded
- [ ] Release notes written
- [ ] Release submitted for review

### After Upload (Critical)
- [ ] Play Store signing SHA-1 copied from Play Console
- [ ] New Android OAuth Client ID created with Play Store SHA-1
- [ ] OAuth consent screen published for production
- [ ] Tested Google Sign-In from Play Store build

### Timeline
| Task | Duration |
|------|----------|
| Developer account verification | Done (verified) |
| App review (after upload) | 1-3 days |
| OAuth consent screen verification | 2-5 days |
| **Total from upload to live** | **~3-7 days** |

---

## Troubleshooting

### Google Sign-In returns error in production
- Verify the Play Store signing SHA-1 matches the Android OAuth Client ID
- Check that the package name is exactly `com.geovault.app`
- Verify OAuth consent screen is published (not in Testing mode)

### App rejected by Play Store
- Check email for specific rejection reasons
- Common issues: missing privacy policy, incomplete data safety, metadata policy violations
- Fix and resubmit — re-review is usually faster

### Backup fails in production but works in dev
- The debug keystore SHA-1 is different from Play Store signing SHA-1
- You need BOTH OAuth Client IDs: one for debug, one for production
