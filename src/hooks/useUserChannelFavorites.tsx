import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Mock channel favorites for demo users only
const demoUserChannelFavorites: Record<string, string[]> = {
  "user@example.com": ["1", "2"], // Demo user has some channel favorites
  "admin@example.com": ["1", "3"], // Admin has different channel favorites
};

// Global cache for user channel favorites
const channelFavoritesCache = new Map<
  string,
  { data: string[]; timestamp: number }
>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useUserChannelFavorites = () => {
  const [favoriteChannelIds, setFavoriteChannelIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    if (user) {
      // Check cache first
      const cacheKey = user.id || user.email || "anonymous";
      const cached = channelFavoritesCache.get(cacheKey);
      const now = Date.now();

      if (cached && now - cached.timestamp < CACHE_DURATION) {
        setFavoriteChannelIds(cached.data);
        setIsLoading(false);
        return;
      }

      fetchChannelFavorites();
    } else {
      setFavoriteChannelIds([]);
      setIsLoading(false);
    }

    return () => {
      mountedRef.current = false;
    };
  }, [user]);

  const fetchChannelFavorites = async () => {
    if (!user || !mountedRef.current) return;

    try {
      const cacheKey = user.id || user.email || "anonymous";
      const isDemoUser = user.email && demoUserChannelFavorites[user.email];

      let result: string[] = [];

      if (isDemoUser) {
        result = demoUserChannelFavorites[user.email];
      } else {
        // Real user - for now use localStorage since we don't have a channel favorites table
        const savedChannelFavorites = localStorage.getItem(
          `channel_favorites_${user.id}`,
        );
        result = savedChannelFavorites ? JSON.parse(savedChannelFavorites) : [];
      }

      // Update cache
      channelFavoritesCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      if (mountedRef.current) {
        setFavoriteChannelIds(result);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error fetching channel favorites:", error);
      if (mountedRef.current) {
        setFavoriteChannelIds([]);
        setIsLoading(false);
      }
    }
  };

  const addChannelToFavorites = async (channelId: string) => {
    if (!user) {
      toast.error("Please log in to add channel favorites");
      return;
    }

    if (favoriteChannelIds.includes(channelId)) {
      toast.error("Channel already in favorites");
      return;
    }

    const cacheKey = user.id || user.email || "anonymous";
    const newFavorites = [...favoriteChannelIds, channelId];

    // Check if this is a demo user
    const isDemoUser = user.email && demoUserChannelFavorites[user.email];

    if (isDemoUser) {
      // Demo user - just update local state and cache
      setFavoriteChannelIds(newFavorites);
      // Update cache immediately
      channelFavoritesCache.set(cacheKey, {
        data: newFavorites,
        timestamp: Date.now(),
      });
      toast.success("Channel added to favorites");
      return;
    }

    try {
      // Real user - save to localStorage for now
      setFavoriteChannelIds(newFavorites);
      localStorage.setItem(
        `channel_favorites_${user.id}`,
        JSON.stringify(newFavorites),
      );
      // Update cache immediately
      channelFavoritesCache.set(cacheKey, {
        data: newFavorites,
        timestamp: Date.now(),
      });
      toast.success("Channel added to favorites");
    } catch (error) {
      console.error("Error adding channel to favorites:", error);
      toast.error("Failed to add channel to favorites");
    }
  };

  const removeChannelFromFavorites = async (channelId: string) => {
    if (!user) return;

    const cacheKey = user.id || user.email || "anonymous";
    const newFavorites = favoriteChannelIds.filter((id) => id !== channelId);

    // Check if this is a demo user
    const isDemoUser = user.email && demoUserChannelFavorites[user.email];

    if (isDemoUser) {
      // Demo user - just update local state and cache
      setFavoriteChannelIds(newFavorites);
      // Update cache immediately
      channelFavoritesCache.set(cacheKey, {
        data: newFavorites,
        timestamp: Date.now(),
      });
      toast.success("Channel removed from favorites");
      return;
    }

    try {
      // Real user - update localStorage
      setFavoriteChannelIds(newFavorites);
      localStorage.setItem(
        `channel_favorites_${user.id}`,
        JSON.stringify(newFavorites),
      );
      // Update cache immediately
      channelFavoritesCache.set(cacheKey, {
        data: newFavorites,
        timestamp: Date.now(),
      });
      toast.success("Channel removed from favorites");
    } catch (error) {
      console.error("Error removing channel from favorites:", error);
      toast.error("Failed to remove channel from favorites");
    }
  };

  return {
    favoriteChannelIds,
    isLoading,
    addChannelToFavorites,
    removeChannelFromFavorites,
    refetch: fetchChannelFavorites,
  };
};
