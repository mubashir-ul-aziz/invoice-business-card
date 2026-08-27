# Invora

Offline-first invoicing + digital business card app for small businesses (1–20 employees) in the USA, UK, and Europe. React Native (Expo, TypeScript) end to end.

**Before writing any code or docs for this project, read [MVP_BUILD_PLAN.md](./MVP_BUILD_PLAN.md).** It is the master implementation contract — product scope, tech stack, folder/database architecture, every screen's spec, and the phase-by-phase build order. Any change to architecture, scope, or the data model requires updating that file first.

## Getting started

```bash
npm install
npm start        # Expo dev server — press a / i / w, or scan the QR code
npm run android
npm run ios
npm run web
```

Requires the Expo Go app (or an emulator/simulator) for on-device testing. Consult the versioned [Expo v57 docs](https://docs.expo.dev/versions/v57.0.0/) for any Expo-API usage, per `AGENTS.md`.

## Project state

Phase 0 (project foundation) is complete: navigation shell, theme tokens, shared `core/` components/utils, and empty per-feature `domain/data/presentation` scaffolding under `src/features/*`, all built against **mock data** per the plan. Real persistence (SQLite via `expo-sqlite` + Drizzle ORM) is introduced later, in Phase 20 — see `MVP_BUILD_PLAN.md` for the full phase list and each phase's acceptance criteria.
