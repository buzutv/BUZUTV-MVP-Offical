
import { Content } from '@/hooks/useContent';

// Use the existing Movie interface from mockMovies to avoid conflicts
import { Movie, Channel } from '@/data/mockMovies';

export const contentToMovie = (content: Content): Movie => ({
  id: content.id,
  title: content.title,
  description: content.description || '',
  posterUrl: content.poster_url || 'https://images.unsplash.com/photo-1489599904821-97473bfa5d34?w=400',
  youtubeId: content.video_url || '',
  rating: content.rating ? Number(content.rating) : 0,
  year: content.year || 0,
  genre: content.genre || '',
  isTrending: content.is_trending || false,
  isFeatured: content.is_featured || false,
  type: content.type,
  seasons: content.seasons || undefined,
  episodes: content.episodes || undefined,
});

export const channelToChannelCard = (channel: any): Channel => ({
  id: channel.id,
  name: channel.name,
  description: channel.description || '',
  logoUrl: channel.logo_url || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=200',
  contentCount: 0, // We'll need to fetch this separately if needed
});
