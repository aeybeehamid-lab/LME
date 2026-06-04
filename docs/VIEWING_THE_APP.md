# How to view the LME interfaces

## Admin web dashboard

**Terminal 1**
```powershell
cd C:\Users\Abdulhamid\Documents\LME
npm.cmd run dev:api
```

**Terminal 2** (you may already have this running)
```powershell
cd C:\Users\Abdulhamid\Documents\LME
npm.cmd run dev:dashboard
```

| Screen | URL |
|--------|-----|
| Login (dev or Firebase OTP) | http://localhost:3000/login |
| Orders | http://localhost:3000/orders |
| Riders | http://localhost:3000/riders |
| Finance | http://localhost:3000/finance |

Hard refresh after updates: **Ctrl+Shift+R**

---

## Mobile app (Customer Paystack + Rider jobs)

This is where the **new Paystack customer UI** lives (`Book & pay with Paystack`, unpaid order pay buttons).

**Terminal 3**
```powershell
cd C:\Users\Abdulhamid\Documents\LME\apps\mobile
npm.cmd install
npm.cmd run start
```

- Android emulator: press **`a`**
- Physical phone: install **Expo Go**, scan QR code (same Wi‑Fi as PC)

Set API URL for a real device in `apps/mobile/.env` or shell:

```env
EXPO_PUBLIC_API_URL=http://YOUR_PC_IP:4000/api/v1
```

### Customer flow to demo Paystack

1. API running with optional `PAYSTACK_SECRET_KEY` in root `.env`
2. Mobile → login → **customer**
3. Tab **book** → fill addresses → **Book & pay with Paystack**
4. Paystack opens in browser → pay → app verifies and posts to job board
5. Tab **orders** → see status; **track** for details

### Rider flow

1. Admin → **Riders** → create rider (or dev-login as rider on mobile)
2. Mobile → **rider** → accept jobs from open board

---

## What changed recently (UI)

| App | What to look for |
|-----|------------------|
| Mobile customer | Green **Book & pay with Paystack**, **Pay with Paystack** on unpaid orders |
| Admin login | **Send verification code** / **Verify & sign in** when Firebase is configured |
| Admin login | Toggle **Use dev login instead** when testing without Firebase |
