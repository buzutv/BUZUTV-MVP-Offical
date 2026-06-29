# BuzuTV — Project Context

## Overview
BuzuTV is a streaming platform for Ethiopian movies and TV shows. Built as a React SPA, deployed on Vercel, with Supabase for auth and data. Users browse content, watch videos, manage favorites, and subscribe to channels.

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
