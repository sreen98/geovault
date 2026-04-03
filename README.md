# GeoVault

A private, zero-backend location notebook for travelers. Save places from Google Maps and Apple Maps with rich context — tags, notes, categories — and search them instantly. All data stays on your device.

## Why GeoVault?

Google Maps "Saved Places" is cluttered, hard to search, and forces you into their ecosystem. GeoVault lets you save the *context* around a place — what to order, what to avoid, which credit card to use — and find it again years later with full-text search.

## Features

- **Save Places** — Add locations manually or share directly from Google/Apple Maps
- **Smart Tags** — Built-in status tags (To Visit, Visited, Legendary, Avoid) + custom tags
- **Rich Notes** — Separate fields for must-try items, warnings, and general notes
- **Full-Text Search** — Search across names, notes, tags, and categories using SQLite FTS5
- **Categories** — Cafe, Restaurant, Viewpoint, Stay, Fuel/EV
- **JSON Export** — One-tap export of all your data via the share sheet
- **Privacy First** — No server, no account required. All data on your device.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native (Expo SDK 54) |
| Database | expo-sqlite + FTS5 |
| Routing | expo-router |
| Styling | NativeWind v4 (Tailwind CSS) |
| State | Zustand |
| Language | TypeScript (strict) |

## Getting Started

### Prerequisites

- Node.js 18+
- iOS: Xcode 15+ and CocoaPods
- Android: Android Studio with SDK 34+

### Install

```bash
git clone <repo-url>
cd GeoVault
npm install
```

### Run

```bash
# iOS (requires Xcode)
npx expo run:ios

# Android (requires Android Studio)
npx expo run:android

# Dev server (Expo Go — limited features)
npx expo start
```

> **Note:** Share intent functionality requires a development build (`npx expo run:ios/android`), not Expo Go.

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
  db/                   # SQLite layer — database, migrations, repositories
  services/             # URL parser, export, Google Drive backup
  stores/               # Zustand state management
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
| coordinates | Latitude/longitude |
| category | Cafe, Restaurant, Viewpoint, Stay, Fuel/EV |
| tags | Status tags + custom tags |
| notes | Must Order, Avoid, General — three separate fields |
| sourceUrl | Original Maps link |
| timestamps | Created, updated, last visited |

Data is stored locally in SQLite with a FTS5 virtual table for instant full-text search.

## Roadmap

- [ ] Google Drive backup/restore (client-side, using Drive REST API)
- [ ] Share intent — receive links from Google/Apple Maps
- [ ] Map cluster view with react-native-maps
- [ ] GPS pinning — save current location
- [ ] Proximity filter — find places within X km
- [ ] Geofencing alerts — notifications near saved places
- [ ] Timeline view — group places by discovery date

## Privacy

GeoVault has no backend server. Zero data leaves your device unless you explicitly export or back up to your own Google Drive. No analytics, no tracking, no accounts.

## License

MIT
