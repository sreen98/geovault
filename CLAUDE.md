# GeoVault — Development Guide

## Project Overview
GeoVault is a privacy-first, zero-backend personal location notebook built with React Native (Expo). All data lives on the user's device. Google Drive backup is optional and uses the REST API directly from the client — no server involved.

## Tech Stack
- **Framework:** React Native with Expo SDK 54 (development builds, not Expo Go)
- **Database:** expo-sqlite with FTS5 full-text search
- **Routing:** expo-router (file-based)
- **Styling:** NativeWind v4 (Tailwind CSS for React Native)
- **State:** Zustand
- **Auth:** @react-native-google-signin/google-signin (Google Drive backup)
- **Background Tasks:** expo-background-fetch + expo-task-manager (auto-backup)
- **Language:** TypeScript (strict mode, no `any` types)

## Architecture

### Zero-Backend Constraint
All features must work client-side only. Never suggest server-side components, hosted databases, or third-party APIs with usage fees. Google Drive backup uses the REST API directly from the client with OAuth tokens managed by the native SDK.

### Directory Structure
```
app/                    # expo-router screens (file-based routing)
  (tabs)/               # Bottom tab navigator (Places, Search, Settings)
  place/                # Place CRUD screens ([id], new, edit/[id])
src/
  db/                   # SQLite database layer (database, migrations, repositories, seed)
  services/             # Business logic
    url-parser.service.ts       # Google/Apple Maps URL parsing
    export.service.ts           # JSON export/import
    google-auth.service.ts      # Google Sign-In wrapper
    google-drive.service.ts     # Drive REST API (list, upload, download, delete)
    backup.service.ts           # Backup orchestration (performBackup, performRestore)
    auto-backup.service.ts      # Background fetch task registration
  stores/               # Zustand state stores
    places.store.ts             # Places with pagination (PAGE_SIZE=30)
    search.store.ts             # Search with pagination
    settings.store.ts           # Theme, auto-backup preferences
    backup.store.ts             # Google Drive backup state
  components/           # Reusable UI components
  constants/            # Categories, tags, theme colors
  types/                # TypeScript interfaces (place.types, backup.types)
  utils/                # Helpers (uuid, date formatting)
```

### Database
- SQLite with WAL mode and FTS5 virtual table for search
- Migrations are version-based using `PRAGMA user_version` (currently v3)
- Tags stored as JSON arrays in a TEXT column, indexed by FTS5
- Three separate note columns (must_order, avoid, general) for direct queryability
- FTS5 indexes: name, location, tags, notes, category
- Paginated queries via `getPaginated(limit, offset, filters)`

### State Management
Zustand stores are thin caches over SQLite. Places and search use pagination (30 items per page) with infinite scroll. Backup store is the exception — it handles async Google API calls with loading states.

### Google Drive Backup
- Uses `appDataFolder` (hidden, app-specific, non-sensitive scope)
- Single backup file `geovault-backup.json` — updated on each backup, old versions pruned (keep 3)
- Auto-backup via `expo-background-fetch` with user-configurable intervals (Daily/Weekly/Monthly)
- Tokens managed by native Google Sign-In SDK (auto-refresh via OS keychain)

### Icons
- Use `@expo/vector-icons` (Ionicons, MaterialCommunityIcons, etc.) for all icons.
- **Never use emojis or smileys in code** — not in UI text, comments, placeholders, or icon substitutes.

### Dialogs
- **Never use `Alert.alert()`** — use custom themed modals instead:
  - `StatusDialog` for success/error feedback
  - `ConfirmDialog` for destructive confirmations
  - `ImportDialog` for import mode selection
  - `BackupRestoreDialog` for restore mode selection

## Code Standards

### Type Safety
- **No `any` types.** Use `unknown` for catch blocks, proper interfaces for all data.
- **No unsafe `as` assertions.** Use type guards (e.g., `isValidCategory()`) instead.
- All function parameters and return types should be explicitly typed.
- JSON parsing must be wrapped in try-catch with safe fallbacks.

### Error Handling
- Catch blocks must type the error as `unknown` (e.g., `catch (_error: unknown)`).
- User-facing operations must show `StatusDialog` on failure.
- Location/network failures should gracefully degrade with fallback to manual entry.
- Background tasks (auto-backup) fail silently — no user interruption.
- Never silently swallow errors without at minimum a typed catch variable.

### Accessibility
- All `Pressable` components must have `accessibilityRole` and `accessibilityLabel`.
- Interactive elements should include `accessibilityState` where applicable.
- Tab buttons must have `accessibilityRole="tab"`.
- Form inputs must have `accessibilityLabel`.

### Styling
- Use NativeWind/Tailwind classes, not inline styles (except where RN requires style objects).
- Theme colors are defined in `src/constants/theme.ts` — use `COLORS` constant for any style-object colors.
- Tailwind custom colors (primary, accent, danger, surface, muted) are configured in `tailwind.config.js`.
- Dark and light themes supported via `ThemeContext`.

### Performance
- FlatLists must use: `removeClippedSubviews`, `maxToRenderPerBatch`, `windowSize`, `initialNumToRender`
- List items (`PlaceCard`) must be wrapped with `React.memo`
- Use `useCallback` for `keyExtractor`, `renderItem`, and event handlers passed to lists
- Paginate database queries — never load all records at once

## Commands
```bash
npx expo start              # Start dev server (JS only, no native modules)
npx expo run:ios            # Build and run on iOS (required for native modules)
npx expo run:android        # Build and run on Android (required for native modules)
npx expo prebuild           # Generate native projects
npx expo prebuild --clean   # Regenerate native projects from scratch
node node_modules/typescript/bin/tsc --noEmit   # Type check
npx expo export --platform ios                  # Test production bundle
```

**Important:** Google Sign-In and Background Fetch require development builds (`run:android`/`run:ios`). They do NOT work with Expo Go or `npx expo start`.

## Key Files
- `src/db/database.ts` — SQLite singleton, migrations, all features depend on this
- `src/db/places.repository.ts` — All place CRUD + FTS5 search + pagination
- `src/types/place.types.ts` — Core data interfaces + validation helpers
- `src/types/backup.types.ts` — Backup state and Drive file metadata types
- `src/services/google-auth.service.ts` — Google Sign-In (configure, signIn, getAccessToken)
- `src/services/google-drive.service.ts` — Drive REST API (upload, download, list, delete)
- `src/services/backup.service.ts` — Backup orchestration (performBackup, performRestore)
- `src/services/auto-backup.service.ts` — Background fetch task for auto-backup
- `src/services/export.service.ts` — JSON export/import + file picker
- `src/services/url-parser.service.ts` — Google/Apple Maps URL parsing
- `src/constants/theme.ts` — Centralized colors, spacing, roundness, app version
- `app.config.ts` — Expo configuration (bundle IDs, permissions, plugins)

## Google Cloud Console Setup
The app uses these OAuth client IDs (project: GeoVault):
- Web Client ID: configured in `src/services/google-auth.service.ts`
- Android Client ID: auto-resolved from SHA-1 + package name
- iOS Client ID: configured in `app.config.ts` as reversed URL scheme

OAuth consent screen scope: `https://www.googleapis.com/auth/drive.appdata`

## Adding New Features
1. Add DB migration in `src/db/migrations.ts` and bump version in `database.ts`
2. Add/update repository methods in `src/db/`
3. Update types in `src/types/`
4. Create/update screen in `app/`
5. Use `StatusDialog`/`ConfirmDialog` for user feedback — never `Alert.alert()`
6. Run `tsc --noEmit` to verify zero type errors
7. Test on both iOS and Android via `npx expo run:*`

## Dev Tools
In development (`__DEV__`), Settings shows a "DEV TOOLS" section with:
- **Seed Data** — adds 100 test places across all categories
- **Clear All** — deletes all places (with confirmation)

Seed data is in `src/db/seed.ts` and only runs when manually triggered.
