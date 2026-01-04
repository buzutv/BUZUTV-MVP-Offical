export interface Content {
  id: string; // uuid
  title: string;
  description?: string | null;
  type: 'movie' | 'series' | 'kids';
  genre?: string | null;
  year?: number | null;
  rating?: number | null; // numeric(2,1)
  poster_url?: string | null;
  backdrop_url?: string | null;
  video_url?: string | null;
  duration_minutes?: number | null;
  seasons?: number | null;
  episodes?: number | null;
  is_featured?: boolean | null;
  is_trending?: boolean | null;
  channel_id?: string | null; // uuid
  created_at?: string | null; // ISO timestamp
  updated_at?: string | null; // ISO timestamp
  seasons_data?: Record<string, any> | null; // jsonb
  is_kids?: boolean | null;
  view_count?: number | null;
  trending_score?: number | null;
}


// features/episodes/episodes.types.ts
export interface Episode {
  id: string; // uuid
  season_id: string; // uuid
  episode_number: number;
  title: string;
  description?: string | null;
  duration_minutes?: number | null;
  video_url?: string | null;
  thumbnail_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}
export interface PlaylistItemWithContent {
  id: string;
  playlist_id: string;
  content_id: string;
  position: number;
  created_at?: string;
  content?: Content; // embedded content object
}


// features/playlistItems/playlistItems.types.ts
export interface PlaylistItem {
  id: string; // uuid
  playlist_id: string; // uuid
  content_id: string; // uuid
  position: number;
  created_at?: string | null;
  playlist_items: PlaylistItemWithContent[];
}


// features/playlists/playlists.types.ts
export interface Playlist {
  id: string; // uuid
  title: string;
  description?: string | null;
  created_by: string;
  created_at?: string | null;
  updated_at?: string | null;
}


// features/recommendations/recommendations.types.ts
export interface Recommendation {
  id: string; // uuid
  user_id: string; // uuid
  content_id: string; // uuid
  recommendation_type: string;
  subgenre?: string | null;
  confidence_score?: number | null;
  reason?: string | null;
  shown_at?: string | null;
  clicked?: boolean | null;
  dismissed?: boolean | null;
  created_at?: string | null;
}

// features/recommendations/recommendations.types.ts
export interface Recommendation {
  id: string; // uuid
  user_id: string; // uuid
  content_id: string; // uuid
  recommendation_type: string;
  subgenre?: string | null;
  confidence_score?: number | null;
  reason?: string | null;
  shown_at?: string | null;
  clicked?: boolean | null;
  dismissed?: boolean | null;
  created_at?: string | null;
}

// features/seasons/seasons.types.ts
export interface Season {
  id: string; // uuid
  content_id: string; // uuid
  season_number: number;
  title?: string | null;
  release_date?: string | null; // date
  created_at?: string | null;
  updated_at?: string | null;
}


// features/userWatchHistory/userWatchHistory.types.ts
export interface UserWatchHistory {
  id: number; // bigserial
  user_id: string; // uuid
  movie_id?: string | null; // uuid
  episode_id?: string | null; // uuid
  watched_at?: string | null; // timestamp
  watch_duration?: number | null;
  total_duration?: number | null;
  watch_percentage?: number | null;
  last_position?: number | null;
  completed?: boolean | null;
  device_info?: Record<string, any> | null; // jsonb
  view_counted?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}


// Episode interface
export interface Episode {
  title: string;
  description?: string | null;
  episodeNumber: number;
  videoUrl: string;
  poster_url?: string;
  airDate?: string;
  rating?: string;
  seasonNumber?: number;
}

export interface FullscreenPlayerProps {
  isOpen: boolean;
  onClose?: () => void;
  videoUrl: string | any; // Can be a string for movies or object for series
  title: string;
  userId: string;
  season?: any[];
  // Playlist props
  type: string;
  onVideoEnd?: () => void;
  setSelectedVideo?: (video: any) => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  poster_url?: string; // Added poster_url prop for the time being until refactor
  // video?: any;
  movieId: string;
  playlistInfo?: {
    current: number;
    setIndex: (index: number) => void;
    total: number;
    autoPlay: boolean;
    totalMovies: number;
  };
}