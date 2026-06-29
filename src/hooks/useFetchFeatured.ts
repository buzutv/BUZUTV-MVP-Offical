import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { featuredContentIds } from '@/data/featuredContentIds';
import { HeroCarouselItem } from '@/components/HeroCarousel';

export function useFetchFeatured() {
  const [featured, setFeatured] = useState<HeroCarouselItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | string>(null);

  useEffect(() => {
    async function fetchFeatured() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('content')
        .select('id, title, description, poster_url, video_url, type')
        .in('id', featuredContentIds);
      if (error) {
        setFeatured([]);
        setError(error.message);
        setLoading(false);
        return;
      }
      // Order and typecast the results
      const ordered = featuredContentIds.map(id => {
        const item = data.find((item: any) => item.id === id);
        if (!item) return null;
        return {
          ...item,
          type: item.type as 'movie' | 'series',
        };
      }).filter(Boolean) as HeroCarouselItem[];
      setFeatured(ordered);
      setLoading(false);
    }
    fetchFeatured();
  }, []);

  return { featured, loading, error };
} 