# LME Admin Dashboard — Fonts

## PRD typography

| Use | Font |
|-----|------|
| Headings | **Cormorant Garamond** (italic on main titles) |
| Body, UI, tables | **DM Sans** (weights 300–600) |

## Where to edit

1. **`src/app/layout.tsx`** — primary place  
   - Imports `Cormorant_Garamond` and `DM_Sans` from `next/font/google`  
   - Change family names, weights, or subsets here  
   - Example: swap `DM_Sans` for another Google font by changing the import and config object  

2. **`src/app/globals.css`** — how fonts are applied  
   - `--font-body` and `--font-heading` CSS variables  
   - `h1` / `h2` / `h3` sizes and italic heading style  
   - `.nav strong` for the “LME Admin” brand line  

3. **One-off overrides** — avoid inline `fontFamily` on pages; prefer a class in `globals.css`  

## How it works

Next.js **self-hosts** the font files at build time (`next/font/google`), so the browser does not depend on Segoe UI or other system fonts. That is why the UI looked “local” before: only the name `DM Sans` was in CSS without loading the actual font files.

After changing `layout.tsx`, restart the dev server: `npm.cmd run dev:dashboard`.
