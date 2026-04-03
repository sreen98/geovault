# GeoVault — Development Guide

## Project Overview
GeoVault is a privacy-first, zero-backend personal location notebook built with React Native (Expo). All data lives on the user's device. No server, no API keys, no ongoing infra cost.

## Tech Stack
- **Framework:** React Native with Expo SDK 54 (development builds, not Expo Go)
- **Database:** expo-sqlite with FTS5 full-text search
- **Routing:** expo-router (file-based)
- **Styling:** NativeWind v4 (Tailwind CSS for React Native)
- **State:** Zustand
- **Language:** TypeScript (strict mode, no `any` types)

## Architecture

### Zero-Backend Constraint
All features must work client-side only. Never suggest server-side components, hosted databases, or third-party APIs with usage fees. Google Drive backup uses the REST API directly from the client.

### Directory Structure
```
app/                    # expo-router screens (file-based routing)
  (tabs)/               # Bottom tab navigator (Places, Search, Settings)
  place/                # Place CRUD screens ([id], new, edit/[id])
src/
  db/                   # SQLite database layer (database, migrations, repositories)
  services/             # Business logic (url-parser, export, google-drive)
  stores/               # Zustand state stores
  components/           # Reusable UI components
  constants/            # Categories, tags, theme colors
  types/                # TypeScript interfaces
  utils/                # Helpers (uuid, date formatting)
```

### Database
- SQLite with WAL mode and FTS5 virtual table for search
- Migrations are version-based using `PRAGMA user_version`
- Tags stored as JSON arrays in a TEXT column, indexed by FTS5
- Three separate note columns (must_order, avoid, general) for direct queryability

### State Management
Zustand stores are thin caches over SQLite. Each mutation calls the repository, then re-fetches. No complex async flows.

### Icons
- Use `@expo/vector-icons` (Ionicons, MaterialCommunityIcons, etc.) for all icons.
- **Never use emojis or smileys in code** — not in UI text, comments, placeholders, or icon substitutes.

## Code Standards

### Type Safety
- **No `any` types.** Use `unknown` for catch blocks, proper interfaces for all data.
- **No unsafe `as` assertions.** Use type guards (e.g., `isValidCategory()`) instead.
- All function parameters and return types should be explicitly typed.
- JSON parsing must be wrapped in try-catch with safe fallbacks.

### Error Handling
- Catch blocks must type the error as `unknown` (e.g., `catch (_error: unknown)`).
- User-facing operations must show Alert messages on failure.
- Location/network failures should gracefully degrade with fallback to manual entry.
- Never silently swallow errors without at minimum a typed catch variable.

### Accessibility
- All `Pressable` components must have `accessibilityRole` and `accessibilityLabel`.
- Interactive elements should include `accessibilityState` where applicable.
- Form inputs must have `accessibilityLabel`.

### Styling
- Use NativeWind/Tailwind classes, not inline styles (except where RN requires style objects).
- Theme colors are defined in `src/constants/theme.ts` — use `COLORS` constant for any style-object colors.
- Tailwind custom colors (primary, accent, danger, surface, muted) are configured in `tailwind.config.js`.

## Commands
```bash
npx expo start              # Start dev server
npx expo run:ios            # Build and run on iOS
npx expo run:android        # Build and run on Android
npx expo prebuild           # Generate native projects
npx expo prebuild --clean   # Regenerate native projects from scratch
node node_modules/typescript/bin/tsc --noEmit   # Type check
npx expo export --platform ios                  # Test production bundle
```

## Key Files
- `src/db/database.ts` — SQLite singleton, all features depend on this
- `src/db/places.repository.ts` — All place CRUD + FTS5 search
- `src/types/place.types.ts` — Core data interfaces + validation helpers
- `src/services/url-parser.service.ts` — Google/Apple Maps URL parsing
- `src/constants/theme.ts` — Centralized colors and app version
- `app.config.ts` — Expo configuration (bundle IDs, permissions, plugins)

## Adding New Features
1. Add DB migration in `src/db/migrations.ts` and bump version in `database.ts`
2. Add/update repository methods in `src/db/`
3. Update types in `src/types/place.types.ts`
4. Create/update screen in `app/`
5. Run `tsc --noEmit` to verify zero type errors
6. Test on both iOS and Android
