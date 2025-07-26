import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useContentCache } from "@/hooks/useContentCache";

export interface Content {
  id: string;
  title: string;
  description: string | null;
  type: "movie" | "series";
  is_kids: boolean | null;
  genre: string | null;
  year: number | null;
  rating: number | null;
  poster_url: string | null;
  backdrop_url: string | null;
  video_url: string | null;
  duration_minutes: number | null;
  seasons: number | null;
  episodes: number | null;
  is_featured: boolean | null;
  is_trending: boolean | null;
  channel_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  seasons_data?: any;
}

const fetchContentData = async (): Promise<Content[]> => {
  console.log("🔍 [useContent] Fetching content from database...");

  const { data, error } = await supabase
    .from("content")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ [useContent] Error fetching content:", error);
    toast.error("Failed to load content");
    throw error;
  }

  console.log("📊 [useContent] Raw database data:", {
    totalItems: data?.length || 0,
    rawData: data?.slice(0, 3),
    allTypes: [...new Set(data?.map((item) => item.type))],
    allGenres: [...new Set(data?.map((item) => item.genre).filter(Boolean))],
  });

  // Transform the data to ensure type compatibility
  const transformedData = (data || []).map((item) => ({
    ...item,
    type: item.type as "movie" | "series", // Type assertion for database data
    is_kids: (item as any).is_kids ?? false, // Ensure is_kids is always a boolean
  }));

  console.log("🔄 [useContent] Transformed data:", {
    totalTransformed: transformedData.length,
    contentTypes: transformedData.reduce(
      (acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
    genreBreakdown: transformedData.reduce(
      (acc, item) => {
        const genre = item.genre || "No Genre";
        acc[genre] = (acc[genre] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
    sampleItems: transformedData.slice(0, 2).map((item) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      genre: item.genre,
      isFeatured: item.is_featured,
      isTrending: item.is_trending,
    })),
  });

  return transformedData;
};

export const useContent = () => {
  const {
    data: content,
    isLoading,
    error,
    refetch,
  } = useContentCache("content", fetchContentData, []);

  return {
    content: content || [],
    isLoading,
    error,
    refetch,
  };
};
