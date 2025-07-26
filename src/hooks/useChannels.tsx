import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useContentCache } from "@/hooks/useContentCache";

export interface Channel {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

const fetchChannelsData = async (): Promise<Channel[]> => {
  const start = performance.now();

  const { data, error } = await supabase
    .from("channels")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("❌ [useChannels] Error fetching channels:", error);
    toast.error("Failed to load channels");
    throw error;
  }

  return data || [];
};

export const useChannels = () => {
  const {
    data: channels,
    isLoading,
    error,
    refetch,
  } = useContentCache("channels", fetchChannelsData, []);

  return {
    channels: channels || [],
    isLoading,
    error,
    refetch,
  };
};
