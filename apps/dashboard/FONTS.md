# LME Admin Dashboard — Fonts

## PRD typography

| Use | Font |
|-----|------|
| Page titles (`h1`, `h2`), “LME Admin” brand | **Cormorant Garamond** (italic on main titles) |
| Body, tables, labels, **all buttons** (including Dismiss) | **DM Sans** (500 weight on controls) |
| Card section titles (`h3`) | **DM Sans 600** (clearer at small sizes) |

## Why “Dismiss” looked wrong before

Browsers use a **system font on `<button>`** by default and often **ignore** the page body font.  
Green toast actions used `className="btn"`, which still didn’t set `font-family` on the element.

**Fix:** `globals.css` now sets `font-family: var(--font-body)` on `button`, `.btn`, `.btn-ghost`, inputs, and selects.  
Toasts use **`btn-ghost`** (outline) instead of the solid green `.btn`, with explicit DM Sans sizing.

## Where to edit

1. **`src/app/layout.tsx`** — load fonts from Google via `next/font/google`  
   - Change `DM_Sans` / `Cormorant_Garamond` weights or families here  

2. **`src/app/globals.css`** — how fonts apply  
   - `--font-body` / `--font-heading`  
   - `.btn`, `.btn-ghost`, `.toast`, `h1`–`h3`, tables, labels  

3. **`src/components/Toast.tsx`** — toast layout; uses classes from `globals.css`  

## After changes

Restart: `npm.cmd run dev:dashboard`  
Hard refresh: **Ctrl+Shift+R**
