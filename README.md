# GeoVault

A privacy-first personal location notebook for Android and iOS. Save places, restaurants, viewpoints, and hidden gems — all stored locally on your device.

## Why GeoVault?

Google Maps "Saved Places" is cluttered, hard to search, and forces you into their ecosystem. GeoVault lets you save the *context* around a place — what to order, what to avoid, the best time to visit — and find it again years later with full-text search.

## Features

- **Save Places** — Name, location, coordinates, category, tags, notes, and map links
- **9 Categories** — Dining, Cafe, Tourist Attraction, Stay, Viewpoint, Shopping, Fuel/EV, W.C, Other
- **Category-Specific Fields** — Entry fee, trek time, price range, cleanliness, and more
- **Smart Tags** — Status tags (To Visit, Visited, Legendary, Avoid) + custom tags
- **Rich Notes** — Separate fields for must-try items, warnings, and general notes
- **Full-Text Search** — Search across names, locations, tags, notes, and categories using SQLite FTS5
- **Google Drive Backup** — Manual and auto-backup to a hidden app-specific folder
- **Auto-Backup** — Background backup on a configurable schedule (Daily, Weekly, Monthly)
- **Import/Export** — JSON export to share or archive, import with append or overwrite
- **Map Integration** — Open any saved place directly in your preferred maps app
- **Dark/Light Theme** — Manual toggle with consistent themed UI
- **Offline-First** — Everything works without internet (backup requires connectivity)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native (Expo SDK 54, development builds) |
| Database | expo-sqlite + FTS5 |
| Routing | expo-router |
| Styling | NativeWind v4 (Tailwind CSS) |
| State | Zustand |
| Auth | @react-native-google-signin/google-signin |
| Background | expo-background-fetch + expo-task-manager |
| Language | TypeScript (strict, no `any` types) |

## Getting Started

### Prerequisites

- Node.js 18+
- Android: Android Studio with SDK 34+
- iOS: Xcode 15+ and CocoaPods
- A physical device or emulator

### Install

```bash
git clone <repo-url>
cd GeoVault
npm install
```

### Run

```bash
# Generate native projects
npx expo prebuild

# Android (requires Android Studio)
npx expo run:android

# iOS (requires Xcode)
npx expo run:ios
```

> **Note:** This app uses native modules (Google Sign-In, Background Fetch) and requires development builds. It does **not** work with Expo Go.

### Type Check

```bash
node node_modules/typescript/bin/tsc --noEmit
```

## Project Structure

```
app/                    # Screens (file-based routing)
  (tabs)/               # Tab navigator — Places, Search, Settings
  place/                # Place CRUD — detail, new, edit
src/
  db/                   # SQLite layer — database, migrations, repositories, seed
  services/             # URL parser, export, Google Drive, backup, auto-backup
  stores/               # Zustand state (places, search, settings, backup)
  components/           # Reusable UI components
  constants/            # Categories, tags, theme
  types/                # TypeScript interfaces
  utils/                # UUID, date helpers
```

## Data Model

Each saved place contains:

| Field | Description |
|-------|------------|
| name | Place name |
| location | Location string (city, area, etc.) |
| coordinates | Latitude/longitude |
| category | One of 9 categories |
| tags | Status tags + custom tags |
| notes | Must Order, Avoid, General — three separate fields |
| extraFields | Category-specific fields (entry fee, trek time, etc.) |
| sourceUrl | Original maps link |
| timestamps | Created, updated, last visited |

Data is stored locally in SQLite with a FTS5 virtual table for instant full-text search. Queries are paginated (30 per page) with infinite scroll.

## Google Drive Backup

Backup uses Google Drive's `appDataFolder` — a hidden, app-specific storage area. The user's regular Drive files are never accessed.

- **Manual backup** — tap "Backup Now" in Settings
- **Auto-backup** — enable in Settings with Daily/Weekly/Monthly schedule
- **Restore** — download latest backup with append or overwrite option
- **Scope** — `drive.appdata` (non-sensitive, no full Drive access)

### Setup

Requires a Google Cloud project with OAuth credentials. See [CLAUDE.md](CLAUDE.md) for detailed setup instructions.

## Roadmap

- [x] Google Drive backup/restore
- [x] Auto-backup with background fetch
- [ ] Share intent — receive links from Google/Apple Maps
- [ ] Map cluster view
- [ ] Proximity filter — find places within X km
- [ ] Timeline view — group places by discovery date

## Privacy

GeoVault has no backend server. Zero data leaves your device unless you explicitly export or back up to your own Google Drive. No analytics, no tracking.

## License

All rights reserved.
