# Final Project Documentation

## 1) Project Overview

This workspace contains two related systems:

- `LMCP/`: A Flutter application (`local_market`) with cross-platform targets (Android, iOS, Web, Desktop).
- `LMCP/local_market_price_checker/`: A full-stack Smart Market Price Monitoring and Prediction System (SMPMPS) with:
  - Node.js backend API
  - React + Vite frontend
  - Flutter mobile app
  - PostgreSQL support (and Docker compose setup)

The overall domain is market price monitoring, analytics, and prediction for agricultural products.

## 2) Repository Structure

### Root Flutter App (`LMCP`)

- `lib/main.dart`: Main entry point
- `lib/models/`: Domain models
- `lib/providers/`: State management providers
- `lib/screens/`: UI screens
- `lib/services/`: Service layer (API/data)
- `android/`, `ios/`, `web/`, `windows/`, `linux/`, `macos/`: Platform runners
- `test/`: Flutter tests

### Full-Stack System (`LMCP/local_market_price_checker`)

- `backend/`: Node/Express API service
- `frontend/`: React + Vite web client
- `mobile/`: Flutter mobile client
- `docker-compose.yml`: Local containerized services
- `README.md`: Quick start for full-stack app
- `DOCUMENTATION.md`: Existing in-depth SMPMPS documentation

## 3) Tech Stack

### Flutter (Root app)

From `LMCP/pubspec.yaml`:

- Flutter + Dart SDK `^3.11.0`
- `provider`, `http`, `shared_preferences`, `fl_chart`, `intl`, `web_socket_channel`

### Full-stack app

#### Backend (`local_market_price_checker/backend`)

- Node.js + Express
- PostgreSQL (`pg`)
- JWT auth (`jsonwebtoken`)
- Password hashing (`bcryptjs`)
- Email (`nodemailer`)
- Real-time (`socket.io`)
- SMS integration (`twilio`)
- Testing (`jest`, `supertest`)

#### Frontend (`local_market_price_checker/frontend`)

- React 18 + TypeScript + Vite
- Tailwind CSS
- Radix UI components
- Recharts
- `socket.io-client`

#### Mobile (`local_market_price_checker/mobile`)

From `mobile/pubspec.yaml`:

- Flutter + localization
- `provider`, `go_router`
- `http`, `dio`
- `shared_preferences`, `flutter_secure_storage`, `hive`
- `fl_chart`, `image_picker`, `connectivity_plus`, `flutter_animate`

## 4) Module Map

### Backend source modules (`local_market_price_checker/backend/src`)

Key modules currently present include:

- `index.js`, `database.js`, `validation.js`, `securityMiddleware.js`, `websocket.js`
- Feature modules such as `aiPrediction.js`, `priceHistory.js`, `priceVerification.js`, `communityVerification.js`, `vendorManagement.js`, `reports.js`, `notifications.js`, `twoFactorAuth.js`, `paymentIntegration.js`, `officialDataSources.js`, and others.

### Frontend source layout (`local_market_price_checker/frontend/src`)

- `App.tsx`, `main.tsx`
- `components/`, `contexts/`, `hooks/`, `state/`, `utils/`, `styles/`, `assets/`

### Mobile source layout (`local_market_price_checker/mobile/lib`)

- `main.dart`, `config/`, `models/`, `providers/`, `services/`, `screens/`
- Screen areas include: `admin/`, `consumer/`, `vendor/`, `auth/`, `analytics/`, `notifications/`, `prices/`, `markets/`, `search/`, `security/`, and more.

## 5) How To Run

## 5.1 Root Flutter app (`LMCP`)

1. Install dependencies:

```bash
flutter pub get
```

2. Run on your target:

```bash
flutter run
```

3. Run tests:

```bash
flutter test
```

## 5.2 Full-stack app (`LMCP/local_market_price_checker`)

1. Install top-level helpers:

```bash
npm i
```

2. Install app dependencies:

```bash
cd backend && npm i
cd ../frontend && npm i
```

3. Start database (Docker option):

```bash
docker-compose up -d
```

4. Run services:

```bash
# backend
cd backend && npm run dev

# frontend
cd frontend && npm run dev
```

5. Optional combined scripts from top-level package.json:

```bash
npm run install:all
npm run dev
npm run build
```

## 5.3 Full-stack mobile client (`LMCP/local_market_price_checker/mobile`)

```bash
flutter pub get
flutter run
```

## 6) Environment and Configuration

This workspace contains multiple `.env` files (for example under `local_market_price_checker/`, `backend/`, and `frontend/`).

Recommended approach:

- Keep secrets only in `.env` files (not in source).
- Ensure backend API URL and frontend/mobile API base URLs are aligned.
- Keep database credentials consistent with Docker or local PostgreSQL setup.

## 7) API and Domain Documentation

You already have a detailed system document at:

- `local_market_price_checker/DOCUMENTATION.md`

It includes architecture, features, schema, and endpoint references. This `PROJECT_DOCUMENTATION.md` is a workspace-level guide connecting all subprojects.

## 8) Suggested Documentation Maintenance

Update this file whenever you:

- Add or remove major modules
- Change run commands/scripts
- Change environment variable requirements
- Add new deploy targets or services

Recommended command for quick status before documenting:

```bash
git status
```

## 9) Next Improvements (Optional)

If you want complete enterprise-style documentation, add:

- `docs/architecture.md` for sequence/component diagrams
- `docs/api.md` generated from OpenAPI/Swagger
- `docs/deployment.md` for prod/staging setup
- `docs/contributing.md` for team workflow and code standards
