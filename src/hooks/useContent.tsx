import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useContentCache } from "@/hooks/useContentCache";
import { useGetContentWithWatchHistoryQuery } from "@/store/contentSlice";
import { useAuth } from "@/contexts/AuthContext";

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
  const start = performance.now();

  const { data, error } = await supabase
    .from("content")
    .select("*")
    .order("created_at", { ascending: false });




  if (error) {
    console.error("❌ [useContent] Error fetching content:", error);
    toast.error("Failed to load content");
    throw error;
  }

  const transformStart = performance.now();
  const transformedData = (data || []).map((item) => ({
    ...item,
    type: item.type as "movie" | "series",
    is_kids: (item as any).is_kids ?? false,
  }));

  return transformedData;
};



const searchContentData = async (query: string): Promise<Content[]> => {
  const { data, error } = await supabase
    .from("content")
    .select("*")
    .ilike("title", `%${query}%`)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("❌ [useContent] Error searching content:", error);
    toast.error("Failed to search content");
    throw error;
  }
  return data || [];

}
export const useContent = () => {
  // const {
  //   data: content,
  //   isLoading,
  //   error,
  //   refetch,
  // } = useContentCache("content", fetchContentData, []);
  const { user } = useAuth()
  const { data: contentWithWatchHistory, isLoading: isContentWithWatchHistoryLoading, error: ContentWithWatchHistoryError, refetch: refetchContentWithWatchHistory } = useGetContentWithWatchHistoryQuery(user?.id, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
    refetchOnMountOrArgChange: true,
  })
  return {
    content: contentWithWatchHistory || [],
    contentWithWatchHistory,
    isLoading: isContentWithWatchHistoryLoading,
    error: ContentWithWatchHistoryError,
    refetch: refetchContentWithWatchHistory,
    searchContentData
  };
};
