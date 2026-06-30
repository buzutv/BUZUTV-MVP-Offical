# BuzuTV Task List

## Active
_(nothing in progress)_

## Quick Wins
_(all completed — see Completed section)_

## UX/UI
- Loading skeleton for ContentRow (avoid layout shift)
- Smooth scroll restoration between page navigations

## Performance
- Lazy-load ContentModal (dynamic import) to shrink initial bundle (currently 1,286 KB)
- Add `fetchpriority="high"` to hero poster images (LCP 12.1s, target <2.5s)
- Debounce SearchOverlay input
- Prefetch top-N content posters on idle

## Features Planned
- User profile page with avatar upload
- Continue Watching row (persist watch progress to Supabase)
- Push notifications for new content
- Multi-language subtitle support
- Kids PIN lock

## Completed
- [x] Created CLAUDE.md with full project context
- [x] Created TASKS.md (this file)
- [x] Deleted checking.txt and testing.txt from repo root
- [x] Fixed Tailwind typo: `hslchnge` → `hsl` in sidebar-border (tailwind.config.ts)
- [x] Updated footer copyright 2024 → 2025 (src/pages/Index.tsx)
- [x] Replaced inline `style={{ aspectRatio: '16/9' }}` with `aspect-[2/3] sm:aspect-video` Tailwind classes (src/components/ContentCard.tsx)
- [x] Created vercel.json with SPA redirect rules
- [x] Set up Vercel deployment — live at https://buzutv-mvp-offical.vercel.app/
- [x] Fixed mobile hero background-size: contain → cover (src/components/FullViewportHero.tsx)
- [x] Pass 2 Polish Fixes (2026-06-29) — 7 surgical fixes, build passes, zero TS errors:
  - Index.tsx: `pr-6 pl-0` → `px-4` for consistent mobile padding on content wrapper
  - Index.tsx: footer `py-8` → `pt-8 pb-[max(2rem,env(safe-area-inset-bottom))]` for iPhone safe area
  - FullViewportHero.tsx: hero content `pb-48` → `pb-40 sm:pb-48` to prevent overlap on short screens
  - Kids.tsx: extracted kids gradient into `fixed inset-0 -z-10` div so it covers full scroll height
  - Settings.tsx: `pt-24` → `pt-16 sm:pt-24` to bring content above fold on mobile
  - Navbar.tsx: added left-border active state indicator (`border-brand-500`) to mobile menu nav links
  - Navbar.tsx: removed non-functional search input from hamburger menu; desktop search unchanged
- [x] Accessibility fixes (2026-06-29) — 2 fixes:
  - FullViewportHero.tsx: `aria-label` on both channel strip arrow buttons + `aria-hidden` on icons
  - index.css: `background-color: #000` on body to fix `#9ca3af on white` Lighthouse contrast failure
- [x] Pass 1 Mobile Fixes (2026-06-29) — 8 surgical fixes, build passes, zero TS errors:
  - Fixed 3× `text-2xlold` → `text-2xl` in Kids.tsx (invalid Tailwind class)
  - Removed `aspect-[16/9]` outer wrapper and `absolute inset-0` inner div from ContentGrid.tsx
  - Badge `-left-6` → `-left-4` and parent `pl-6` → `pl-4` in Movies.tsx, Series.tsx, Kids.tsx
  - Removed all console.log debug blocks from Movies.tsx and Series.tsx
  - Replaced hardcoded `w-[170px]`, `w-[190px]`, `w-[195px]` → `w-full sm:w-auto` in Settings.tsx
  - Replaced 3 raw `<button>` CTAs with BrandButton in Auth.tsx
  - Replaced raw `<Link>` CTA with BrandButton + useNavigate in MyList.tsx
  - Added `hidden sm:flex` to both channel strip arrow buttons in FullViewportHero.tsx
