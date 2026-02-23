import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useContentCache } from "@/hooks/useContentCache";
import {
  useGetContentQuery,
  useGetContentWithWatchHistoryQuery,
} from "@/store/contentSlice";
import { useAuth } from "@/contexts/AuthContext";

import { Content } from "@/types";
export type { Content };

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
  return (data as any) || [];
};
export const useContent = () => {
  const { user } = useAuth();

  // Fetch public content (fallback)
  const { data: content, isLoading: isContentLoading } = useGetContentQuery();

  // Fetch content with watch history only if user is logged in
  const {
    data: contentWithWatchHistory,
    isLoading: isContentWithWatchHistoryLoading,
    error: ContentWithWatchHistoryError,
    refetch: refetchContentWithWatchHistory,
  } = useGetContentWithWatchHistoryQuery(user?.id ?? "", {
    refetchOnFocus: true,
    refetchOnReconnect: true,
    refetchOnMountOrArgChange: false,
    skip: !user?.id, // Skip if no user
  });

  // Determine which content to return
  const finalContent = user?.id
    ? (contentWithWatchHistory ?? [])
    : (content ?? []);
  const isLoading = user?.id
    ? isContentWithWatchHistoryLoading
    : isContentLoading;

  return {
    content: finalContent.length > 0 ? finalContent : (content ?? []),
    contentWithWatchHistory,
    isLoading,
    error: ContentWithWatchHistoryError,
    refetch: refetchContentWithWatchHistory,
    searchContentData,
  };
};
