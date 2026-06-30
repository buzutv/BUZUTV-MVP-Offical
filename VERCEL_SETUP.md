# Vercel Deployment

## Live URL
https://buzutv-mvp-offical.vercel.app/

## Project Info
- **Framework:** Vite (React)
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Install command:** `npm install`

## Environment Variables
Set these in Vercel → Project Settings → Environment Variables:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://zkufdbuzqdxtiudhaagg.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | *(your anon key from Supabase dashboard)* |

## SPA Routing
`vercel.json` at the repo root rewrites all non-API paths to `index.html` so page refreshes don't 404.

## Branch Strategy
- `main` — production deploys to https://buzutv-mvp-offical.vercel.app/
- `dev` — generates preview URLs on every push
