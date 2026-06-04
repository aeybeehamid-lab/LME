# LME Mobile (Customer + Rider)

Dev app with role at login:

- **Customer** — book delivery, pay (dev), view orders & status  
- **Rider** — open job board → accept → update delivery status  

## Run

1. API must be running: `npm.cmd run dev:api` (from repo root).
2. For rider flow, create a rider in Admin → Riders. Customer can use any new phone at login.
3. From repo root:

```bash
cd apps/mobile
npm install
npm run start
```

4. Press `a` for Android emulator or scan QR with Expo Go on your phone.
5. If using a real device, set `EXPO_PUBLIC_API_URL` to your PC IP, e.g. `http://192.168.1.10:4000/api/v1`.

## Fonts

- **Cormorant Garamond** — brand line “Life Made Easy” (`src/theme.ts` → `fonts.display`)  
- **DM Sans** — everything else (`@expo-google-fonts/dm-sans`)
