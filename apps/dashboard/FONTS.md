# LME Admin Dashboard — Fonts

## Typography (PRD)

| Use | Font |
|-----|------|
| Page titles (`h1`, `h2`, **LME Admin** in nav) | **Cormorant Garamond** (normal, not italic) |
| Body, tables, labels, all buttons, card `h3` | **DM Sans** |

## Where to edit

1. **`src/app/layout.tsx`** — loads **DM Sans** and **Cormorant Garamond** via `next/font/google`
2. **`src/app/globals.css`** — `--font-heading` and `--font-body`
3. **`src/components/Toast.tsx`** — toast + Dismiss button classes

To change heading font, edit `Cormorant_Garamond` in `layout.tsx` or `--font-heading` in `globals.css`.

Restart: `npm.cmd run dev:dashboard` · Hard refresh: **Ctrl+Shift+R**
