# BuzuTV — Project Context

## Overview
BuzuTV is a streaming platform for Ethiopian movies and TV shows. Built as a React SPA, deployed on Vercel, with Supabase for auth and data. Users browse content, watch videos, manage favorites, and subscribe to channels.

**Live URL:** https://buzutv-mvp-offical.vercel.app/

## Tech Stack
- **Framework:** React 18 + TypeScript
- **Build:** Vite 5 (dev server on port 8080)
- **Styling:** Tailwind CSS v3 + shadcn/ui
- **Routing:** React Router v6
- **Data fetching:** TanStack Query v5
- **Backend:** Supabase (auth + PostgreSQL)
- **Hero carousel:** Swiper
- **Icons:** Lucide React
- **Toasts:** Sonner

## src/ Structure
```
src/
├── App.tsx                        # Root routes
├── index.css                      # Global styles + CSS variables
├── main.tsx
├── components/
│   ├── ChannelCard.tsx
│   ├── ChannelModal.tsx
│   ├── ChannelRow.tsx
│   ├── ContentCard.tsx            # Reusable card; aspect-[2/3] sm:aspect-video
│   ├── ContentGrid.tsx
│   ├── ContentModal.tsx           # Full detail modal with play, episodes, favorites
│   ├── ContentRow.tsx             # Horizontal scroll row
│   ├── FilterBar.tsx              # Genre filter chips
│   ├── FullViewportHero.tsx       # Full-screen Swiper carousel + channel strip
│   ├── FullscreenPlayer.tsx
│   ├── HeroBanner.tsx
│   ├── HeroCarousel.tsx / .css
│   ├── HomeHeroBanner.tsx
│   ├── Navbar.tsx
│   ├── SearchOverlay.tsx
│   ├── SeriesPlayer.tsx
│   ├── admin/
│   │   ├── AdminLayout.tsx
│   │   └── BulkImportUpload.tsx
│   ├── auth/
│   │   ├── AdminAccessModal.tsx
│   │   ├── ForgotPassword.tsx
│   │   ├── LoginModal.tsx
│   │   └── ProtectedRoute.tsx
│   ├── forms/
│   │   ├── ChannelForm.tsx
│   │   ├── ChannelSearchSelect.tsx
│   │   ├── ImageUpload.tsx
│   │   └── MovieForm.tsx
│   └── ui/
│       ├── BrandButton.tsx        # Primary CTA button — use for ALL CTAs
│       └── [shadcn components]
├── contexts/
│   └── AuthContext.tsx
├── data/
│   ├── featuredContentIds.ts      # Array of content IDs shown in hero carousel
│   └── mockMovies.ts
├── hooks/
│   ├── useAppContent.tsx          # Aggregates all content for home page
│   ├── useContent.tsx
│   ├── useChannels.tsx
│   ├── useUserFavorites.tsx
│   ├── useUserSubscriptions.tsx
│   └── [other hooks]
├── integrations/supabase/
│   ├── client.ts
│   └── types.ts
├── pages/
│   ├── Index.tsx                  # Home page
│   ├── Movies.tsx
│   ├── Series.tsx
│   ├── Kids.tsx
│   ├── MyList.tsx
│   ├── Settings.tsx
│   ├── Auth.tsx
│   ├── MovieDetail.tsx
│   ├── ResetPassword.tsx
│   ├── NotFound.tsx
│   └── admin/
│       ├── AdminDashboard.tsx
│       ├── AdminMovies.tsx
│       ├── AdminAddMovie.tsx
│       ├── AdminEditMovie.tsx
│       ├── AdminChannels.tsx
│       ├── AdminAddChannel.tsx
│       ├── AdminEditChannel.tsx
│       └── AdminLogin.tsx
└── utils/
    ├── contentMapper.ts
    ├── moreLikeThis.ts
    └── youtubeUtils.ts
```

## Home Page Flow
`Index.tsx` → `FullViewportHero.tsx` (full-screen Swiper controlled by `featuredContentIds.ts`) → `ContentRow` components → `FilterBar` → `ContentGrid`

## Database Tables (Supabase)
- `profiles` — user profile info
- `content` — movies and series (title, poster_url, video_url, type, genre, duration_minutes, seasons_data, is_kids, is_featured, channel_id, created_at)
- `channels` — streaming channels (name, logo_url, banner_url)
- `user_favorites` — user ↔ content many-to-many
- `user_subscriptions` — user ↔ channel many-to-many

## Brand Colors
| Token | Hex | Use |
|-------|-----|-----|
| brand-500 | `#712AFF` | Primary purple / CTAs |
| brand-800 | `#311066` | Dark purple |
| brand-900 | `#1D0833` | Darkest purple |

Background gradient:
```css
linear-gradient(200deg, #311066 0%, #1D0833 20%, #120222 45%, black 100%)
```

## Glass Effect Pattern
```html
<div class="bg-black/40 backdrop-blur-md border border-white/20">
```

## Rules
1. Always **read a file before editing** it.
2. Use `BrandButton` for all CTAs — never raw `<button>` for primary actions.
3. Never hardcode aspect ratios inline (`style={{ aspectRatio }}`). Use Tailwind: `aspect-[2/3]`, `aspect-video`, etc.
4. **Never touch** files in `supabase/migrations/`.
5. Keep `RequireAdmin` on all `/admin` routes.
6. Mobile-first breakpoints: 375px (base) / 768px (`md`) / 1280px (`xl`).

---

## Active Skills and How to Apply Them

### Frontend Design
- Every UI change must feel intentional and specific to BuzuTV — 
  not generic
- Typography, spacing, and color must follow the brand system
- Take one deliberate design risk per new feature
- Mobile first — design at 375px before desktop
- The hero is a thesis — open with the most characteristic thing
- Motion should be deliberate — one orchestrated moment beats 
  scattered effects
- Critique your own work before marking a task done

### Code Review (apply before every merge to main)
- Check for security issues — no exposed keys, no unprotected routes
- Check for N+1 queries — especially in hooks that fetch Supabase data
- Check for missing error handling on all async operations
- Check for unused imports and dead code
- Check that admin routes are protected with RequireAdmin
- Check that no console.log statements remain in production code

### Accessibility
- All interactive elements need keyboard focus states
- Images need descriptive alt text — not just the title
- Color contrast must pass WCAG AA (4.5:1 for text)
- Touch targets must be at least 44x44px on mobile
- Never rely on color alone to convey information
- Test with reduced motion preference respected

### UX Copy
- Button labels say exactly what happens: "Save changes" not "Submit"
- Error messages explain what went wrong and how to fix it
- Empty states are invitations to act — not dead ends
- Keep labels in sentence case
- Never use "click here" — name the action

### Design Critique (apply before shipping any UI change)
- Does it work at 375px without scrolling horizontally?
- Does every CTA use BrandButton?
- Does the brand gradient appear correctly?
- Does the glass effect (bg-black/40 backdrop-blur-md) apply to 
  all overlays?
- Is the typography consistent with the brand fonts?
- Would a new user understand what to do on this page?

### Testing Strategy
- Every new feature needs at least one happy path test
- Auth flows must be tested — login, logout, Google OAuth, 
  password reset
- Video player must be tested — play, pause, fullscreen, close
- Admin routes must be tested — verify non-admins cannot access
- Mobile breakpoints must be verified at 375px and 768px

### ui-ux-pro-max
- Use this skill's domain search and pre-delivery checklist when building or reviewing any BuzuTV component — especially for glassmorphism overlays, touch target sizes, animation timing, and contrast on the dark brand palette.

### design
- Use this skill when BuzuTV needs brand identity assets — logos, banners, social images, or icons — routing through its logo/CIP/banner sub-skills as appropriate.

### ui-styling
- All BuzuTV UI is built on shadcn/ui + Tailwind; use this skill's component catalog and accessibility patterns as the reference for any new component or layout work.

### brand
- Use this skill to keep BuzuTV's purple brand system (#712AFF / #311066 / #1D0833), voice, and asset naming consistent across every page and marketing touchpoint.

### design-system
- Use this skill's three-layer token architecture (primitive → semantic → component) when extending or auditing BuzuTV's Tailwind theme and CSS variables.

### karpathy-guidelines
- Apply these guidelines on every code task: state assumptions before implementing, make surgical changes only, and define a verifiable success check before marking any fix or feature done.
