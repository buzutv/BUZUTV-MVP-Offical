# BuzuTV Task List

## Active
_(nothing in progress)_

## Quick Wins
_(all completed — see Completed section)_

## UX/UI
- Navbar active-state indicator for current route
- Empty state illustration for MyList page when no favorites
- Loading skeleton for ContentRow (avoid layout shift)
- Smooth scroll restoration between page navigations

## Performance
- Lazy-load ContentModal (dynamic import) to shrink initial bundle
- Add `fetchpriority="high"` to hero poster images
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
- [x] Fixed mobile hero background-size: contain → cover (src/components/FullViewportHero.tsx)
