# LME Admin Dashboard — Fonts

## Typography

| Use | Font |
|-----|------|
| Italic display titles (`h1`, `h2`, **LME Admin** in nav) | **Times New Roman** (system serif) |
| Body, tables, labels, all buttons, card `h3` | **DM Sans** |

## Where to edit

1. **`src/app/layout.tsx`** — loads **DM Sans** via `next/font/google`  
2. **`src/app/globals.css`** — `--font-display` for Times New Roman; `--font-body` for DM Sans  
3. **`src/components/Toast.tsx`** — toast + Dismiss button classes  

To change Times New Roman, edit `--font-display` in `globals.css`:

```css
--font-display: "Times New Roman", Times, serif;
```

Restart: `npm.cmd run dev:dashboard` · Hard refresh: **Ctrl+Shift+R**
