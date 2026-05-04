# Complete Project Technical Documentation

## Scope

This documentation covers the entire workspace at `LMCP/` including:

- Root Flutter app (`LMCP`)
- Full-stack system (`LMCP/local_market_price_checker`): backend, frontend, and mobile

This file is the structured guide. Deep inventories are linked at the end.

## Workspace Systems

### A) Root Flutter App (`LMCP`)

Purpose: standalone Flutter app for local market workflows.

Core source paths:

- `lib/main.dart`
- `lib/models/`
- `lib/providers/`
- `lib/screens/`
- `lib/services/`

Platform targets present:

- Android: `android/`
- iOS: `ios/`
- Web: `web/`
- Windows: `windows/`
- Linux: `linux/`
- macOS: `macos/`

### B) Full-stack SMPMPS (`LMCP/local_market_price_checker`)

Purpose: Smart Market Price Monitoring and Prediction System.

Main parts:

- Backend API: `backend/`
- React frontend: `frontend/`
- Flutter mobile client: `mobile/`
- Auxiliary Flutter app folder: `flutter_app/`

## Technology Stack (from code manifests)

### Root Flutter app

From `LMCP/pubspec.yaml`:

- Dart SDK `^3.11.0`
- Flutter
- `provider`, `http`, `shared_preferences`, `fl_chart`, `intl`, `web_socket_channel`

### Backend (`local_market_price_checker/backend`)

From `backend/package.json`:

- Node.js + Express
- `pg`, `better-sqlite3`
- `jsonwebtoken`, `bcryptjs`
- `socket.io`
- `nodemailer`, `twilio`
- `pdfkit`
- Test stack: `jest`, `supertest`

### Frontend (`local_market_price_checker/frontend`)

From `frontend/package.json`:

- React 18 + TypeScript + Vite
- Tailwind CSS
- Radix UI component libraries
- Recharts
- `socket.io-client`

### Mobile (`local_market_price_checker/mobile`)

From `mobile/pubspec.yaml`:

- Flutter + localization
- `provider`, `go_router`
- `http`, `dio`
- `shared_preferences`, `flutter_secure_storage`, `hive`
- `fl_chart`, `image_picker`, `connectivity_plus`, `flutter_animate`

## Module Inventory

### Backend modules (`local_market_price_checker/backend/src`)

- `index.js`
- `database.js`
- `securityMiddleware.js`
- `validation.js`
- `websocket.js`
- `aiPrediction.js`
- `auditLog.js`
- `communityVerification.js`
- `dataExport.js`
- `errorTracking.js`
- `gamification.js`
- `notifications.js`
- `officialDataSources.js`
- `pagination.js`
- `paymentIntegration.js`
- `priceHistory.js`
- `priceSimulator.js`
- `priceVerification.js`
- `reports.js`
- `savedSearches.js`
- `socialFeatures.js`
- `twoFactorAuth.js`
- `vendorManagement.js`

### Frontend modules (`local_market_price_checker/frontend/src`)

- Entrypoints: `main.tsx`, `App.tsx`
- Domains: `components/`, `contexts/`, `hooks/`, `state/`, `utils/`, `styles/`, `assets/`
- Also present: `types.ts`, `index.css`

### Mobile modules (`local_market_price_checker/mobile/lib`)

- Entrypoint: `main.dart`
- Core: `config/`, `models/`, `providers/`, `services/`, `screens/`
- Screen domains include: `admin`, `alerts`, `analytics`, `auth`, `community`, `consumer`, `markets`, `notifications`, `payments`, `prices`, `profile`, `search`, `security`, `vendor`, and others.

## API Inventory Status

Backend endpoints discovered from source declarations (`app.get/post/put/delete/patch`) in `backend/src/*.js`:

- Total endpoints indexed: **139**
- Full endpoint list with file + line references: `docs/BACKEND_ENDPOINTS_INVENTORY.txt`

The list includes major groups:

- Auth and account: `/auth/*`, `/verify/*`, `/profile*`
- Market data: `/products`, `/markets`, `/prices*`, `/forecast/*`, `/trends/*`
- User tools: `/favorites*`, `/alerts*`, `/notifications*`, `/search*`, `/history*`
- Community and ratings: `/community/*`, `/ratings/*`
- Official data and validation: `/official/*`
- Security: `/security/*`
- Admin operations: `/admin/*`
- Payments and vendor APIs: `/api/payments/*`, `/api/vendor/*`, `/api/gamification/*`, `/api/reports/*`

## Database Schema Status

From `local_market_price_checker/backend/setup_database.sql`, the following tables are defined:

- `users`
- `products`
- `markets`
- `prices`
- `price_history`
- `favorites`
- `price_alerts`
- `notifications`
- `verification_codes`
- `sessions`

Also present:

- Table indexes on key lookup fields
- Seed data inserts for products and markets

## Environment Variables (Backend)

Detected from backend source usage:

- `AIRTEL_CLIENT_ID`
- `AIRTEL_CLIENT_SECRET`
- `AIRTEL_MONEY_URL`
- `AMIS_API_KEY`
- `APP_VERSION`
- `DB_HOST`
- `DB_NAME`
- `DB_PASSWORD`
- `DB_PORT`
- `DB_USER`
- `EMAIL_PASS`
- `EMAIL_USER`
- `FRONTEND_URL`
- `JWT_SECRET`
- `MINICOM_API_KEY`
- `MTN_MOMO_API_KEY`
- `MTN_MOMO_API_SECRET`
- `MTN_MOMO_URL`
- `MTN_MOMO_USER_ID`
- `NISR_API_KEY`
- `NODE_ENV`
- `PORT`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

## Build and Run Commands

### Root Flutter app

```bash
cd LMCP
flutter pub get
flutter run
flutter test
```

### Full-stack app

```bash
cd LMCP/local_market_price_checker
npm i
cd backend && npm i && npm run dev
cd ../frontend && npm i && npm run dev
```

Optional top-level scripts (from `local_market_price_checker/package.json`):

- `npm run install:all`
- `npm run backend`
- `npm run frontend`
- `npm run dev`
- `npm run build`

### Mobile app (inside full-stack app)

```bash
cd LMCP/local_market_price_checker/mobile
flutter pub get
flutter run
```

## Full Source Inventory

A generated inventory of source files (excluding generated/dependency dirs such as `node_modules`, `.git`, `build`, `.dart_tool`, `.idea`, `.vite`) is available:

- Total indexed source files: **751**
- File: `PROJECT_SOURCE_INVENTORY.txt`

A focused list of core application source paths is available:

- File: `docs/CORE_SOURCE_PATHS.txt`

## Related Documentation Files

- `README.md` (root Flutter app)
- `PROJECT_DOCUMENTATION.md` (workspace-level guide)
- `local_market_price_checker/README.md` (full-stack quick start)
- `local_market_price_checker/DOCUMENTATION.md` (detailed SMPMPS product/system documentation)
- `local_market_price_checker/README_POSTGRES.md` (database setup details)

## Regeneration Commands

Run these from `LMCP/` to refresh inventories:

```powershell
# 1) Source file inventory (exclude generated/dependency dirs)
$exclude = @('node_modules','.git','build','.dart_tool','.idea','.vite','.next','dist','coverage')
Get-ChildItem -Recurse -File |
  Where-Object {
    $full = $_.FullName
    -not ($exclude | ForEach-Object { $full -match "\\$($_)(\\|$)" } | Where-Object { $_ })
  } |
  ForEach-Object { $_.FullName.Replace((Get-Location).Path + '\\','') } |
  Set-Content PROJECT_SOURCE_INVENTORY.txt

# 2) Endpoint inventory
Set-Location .\local_market_price_checker\backend\src
Select-String -Path *.js -Pattern "app\.(get|post|put|delete|patch)\('\S+" |
  ForEach-Object { $_.Filename + ':' + $_.LineNumber + ' ' + $_.Line.Trim() } |
  Set-Content ..\..\..\docs\BACKEND_ENDPOINTS_INVENTORY.txt

# 3) Backend environment variables
Select-String -Path *.js -Pattern "process\.env\.[A-Z0-9_]+" -AllMatches |
  ForEach-Object { $_.Matches.Value } |
  Sort-Object -Unique |
  Set-Content ..\..\..\docs\BACKEND_ENV_VARS.txt
```

## Notes

- This document is implementation-based and generated from the code currently in the workspace.
- Generated artifacts are intentionally excluded from inventories to keep docs useful and reviewable.
- If needed, a second-pass doc can be generated to include route request/response schemas for every endpoint.
