# Firebase Phone OTP — Setup

## 1) Firebase Console

1. Create a project at [https://console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** → **Sign-in method** → **Phone**
3. Add a **Web app** and copy the config values

## 2) Service account (API)

1. Project settings → **Service accounts** → **Generate new private key**
2. Add to repo root `.env`:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## 3) Admin dashboard (browser)

Add to `.env`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
```

Restart `npm.cmd run dev:dashboard` and open [http://localhost:3000/login](http://localhost:3000/login).

## 4) Mobile (Expo)

```env
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
```

Use your PC LAN IP for the API when testing on a phone:

```env
EXPO_PUBLIC_API_URL=http://192.168.x.x:4000/api/v1
```

## 5) Executive access

Firebase OTP creates **customer/rider** accounts automatically. **Admin** phones must already exist in the database with role `executive` (create via dev login once, or insert in Postgres).

## Push notifications (FCM)

Uses the same Firebase project and service account as OTP.

1. In Firebase Console → **Project settings** → **Cloud Messaging**, note the sender ID.
2. After login, the mobile app registers its device token via `POST /notifications/register-token`.
3. When order status changes, the API sends pushes (logs `[FCM dev]` in the API terminal if Firebase is not configured).

Run new migration after pull:

```powershell
npm run db:migrate
```

## Local testing without Firebase

Leave Firebase env vars empty — **dev login** remains available on admin and mobile. Push messages are printed in the API server log instead of sent to devices.
