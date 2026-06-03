# LME Mobile (Rider — Sprint 2 start)

Rider dev app: login → open job board → accept → update delivery status.

## Run

1. API must be running: `npm.cmd run dev:api` (from repo root).
2. Create a **rider** in Admin → Riders (or dev-login as rider).
3. From repo root:

```bash
cd apps/mobile
npm install
npm run start
```

4. Press `a` for Android emulator or scan QR with Expo Go on your phone.
5. If using a real device, set `EXPO_PUBLIC_API_URL` to your PC IP, e.g. `http://192.168.1.10:4000/api/v1`.

## Fonts

Loaded in `App.tsx` via `@expo-google-fonts/dm-sans` and `cormorant-garamond`.  
Family names used in styles: `src/theme.ts` → `fonts` object.
