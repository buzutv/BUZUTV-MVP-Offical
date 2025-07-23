
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useContent } from '@/hooks/useContent';
import { useChannels } from '@/hooks/useChannels';
import { genres } from '@/data/mockMovies';

// Transform database content to match Movie interface
const transformDatabaseContent = (dbContent: any[]) => {
  return dbContent.map(item => ({
    id: item.id,
    title: item.title,
    description: item.description || '',
    type: item.type,
    genre: item.genre || 'Drama',
    year: item.year || new Date().getFullYear(),
    rating: item.rating || 0,
    posterUrl: item.poster_url || '/placeholder.svg',
    backdropUrl: item.backdrop_url || '/placeholder.svg',
    videoUrl: item.video_url || '',
    youtubeId: '', // Required for Movie type compatibility
    duration: item.duration_minutes || 120,
    seasons: item.seasons,
    episodes: item.episodes,
    isFeatured: item.is_featured || false,
    isTrending: item.is_trending || false,
    channelId: item.channel_id,
    seasons_data: item.seasons_data, // <-- add this line
  }));
};

// Transform database channels to match Channel interface
const transformDatabaseChannels = (dbChannels: any[]) => {
  return dbChannels.map(channel => ({
    id: channel.id,
    name: channel.name,
    description: channel.description || '',
    logoUrl: channel.logo_url || '/placeholder.svg',
    bannerUrl: channel.banner_url || '/placeholder.svg',
    isActive: channel.is_active !== false,
    contentCount: 0
  }));
};

export const useAppContent = () => {
  const { content: dbContent, isLoading: dbContentLoading } = useContent();
  const { channels: dbChannels, isLoading: dbChannelsLoading } = useChannels();

  // Transform data when available
  const transformedContent = useMemo(() => {
    if (dbContentLoading || !dbContent.length) return [];
    return transformDatabaseContent(dbContent);
  }, [dbContent, dbContentLoading]);

  const transformedChannels = useMemo(() => {
    if (dbChannelsLoading || !dbChannels.length) return [];
    return transformDatabaseChannels(dbChannels);
  }, [dbChannels, dbChannelsLoading]);

  // Pre-compute all categories and filters
  const content = useMemo(() => {
    const movies = transformedContent.filter(item => item.type === "movie");
    const series = transformedContent.filter(item => item.type === "series");
    const kids = transformedContent.filter(item => item.type === "kids");


    return {
      movies: {
        all: movies,
        featured: movies.filter(movie => movie.isFeatured),
        trending: movies.filter(movie => movie.isTrending),
        topRanked: [...movies].sort((a, b) => b.rating - a.rating).slice(0, 5),
        recommended: movies.slice(0, 6),
        new: movies.slice(2, 8),
        byGenre: genres.reduce((acc, genre) => {
          acc[genre] = movies.filter(movie => movie.genre === genre);
          return acc;
        }, {} as Record<string, typeof movies>)
      },
      series: {
        all: series,
        featured: series.filter(show => show.isFeatured),
        trending: series.filter(show => show.isTrending),
        topRanked: [...series].sort((a, b) => b.rating - a.rating).slice(0, 5),
        recommended: series.slice(0, 6),
        new: series.slice(2, 8),
        byGenre: genres.reduce((acc, genre) => {
          acc[genre] = series.filter(show => show.genre === genre);
          return acc;
        }, {} as Record<string, typeof series>)
      },
      kids: {
        all: kids,
        movies: kids.filter(item => item.type === "movie"),
        series: kids.filter(item => item.type === "series"),
        featured: kids.filter(item => item.isFeatured),
        trending: kids.filter(item => item.isTrending),
        new: kids.slice(0, 8)
      },
      home: {
        trending: transformedContent.filter(item => item.isTrending),
        action: transformedContent.filter(item => item.genre === "Action"),
        drama: transformedContent.filter(item => item.genre === "Drama"),
        romance: transformedContent.filter(item => item.genre === "Romance"),
        comedy: transformedContent.filter(item => item.genre === "Comedy"),
        documentary: transformedContent.filter(item => item.genre === "Documentary"),
        informational: transformedContent.filter(item => item.genre === "Informational"),
      },
      allContent: transformedContent
    };
  }, [transformedContent]);

  return {
    // Legacy support - return all movies for components that still need it
    movies: transformedContent,
    channels: transformedChannels,
    isLoading: dbContentLoading || dbChannelsLoading,
    // New optimized data structure
    content,
    // Quick access to specific categories
    movieContent: content.movies,
    seriesContent: content.series,
    kidsContent: content.kids,
    homeContent: content.home
  };
};
