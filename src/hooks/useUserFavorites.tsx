import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Mock favorites for demo users only
const demoUserFavorites: Record<string, string[]> = {
  "user@example.com": ["1", "2", "8"], // Demo user has some favorites
  "admin@example.com": ["1", "3", "4", "6"], // Admin has different favorites
};

// Global cache for user favorites to prevent duplicate fetches
const favoritesCache = new Map<string, { data: string[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useUserFavorites = () => {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    if (user) {
      // Check cache first
      const cacheKey = user.id || user.email || "anonymous";
      const cached = favoritesCache.get(cacheKey);
      const now = Date.now();

      if (cached && now - cached.timestamp < CACHE_DURATION) {
        setFavoriteIds(cached.data);
        setIsLoading(false);
        return;
      }

      fetchFavorites();
    } else {
      setFavoriteIds([]);
      setIsLoading(false);
    }

    return () => {
      mountedRef.current = false;
    };
  }, [user]);

  const fetchFavorites = async () => {
    if (!user || !mountedRef.current) return;

    try {
      const cacheKey = user.id || user.email || "anonymous";
      const isDemoUser = user.email && demoUserFavorites[user.email];

      let result: string[] = [];

      if (isDemoUser) {
        result = demoUserFavorites[user.email];
      } else {
        // Real user - fetch from Supabase
        const { data, error } = await supabase
          .from("user_favorites")
          .select("content_id")
          .eq("user_id", user.id);

        if (error) {
          console.error("Error fetching favorites:", error);
          // Fallback to localStorage for non-demo users
          const savedFavorites = localStorage.getItem(`favorites_${user.id}`);
          result = savedFavorites ? JSON.parse(savedFavorites) : [];
        } else {
          result = data.map((fav) => fav.content_id);
        }
      }

      // Update cache
      favoritesCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      if (mountedRef.current) {
        setFavoriteIds(result);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
      if (mountedRef.current) {
        setFavoriteIds([]);
        setIsLoading(false);
      }
    }
  };

  const addToFavorites = async (contentId: string) => {
    if (!user) {
      toast.error("Please log in to add favorites");
      return;
    }

    if (favoriteIds.includes(contentId)) {
      toast.error("Already in favorites");
      return;
    }

    const cacheKey = user.id || user.email || "anonymous";
    const newFavorites = [...favoriteIds, contentId];

    // Check if this is a demo user
    const isDemoUser = user.email && demoUserFavorites[user.email];

    if (isDemoUser) {
      // Demo user - just update local state and cache
      setFavoriteIds(newFavorites);
      // Update cache immediately
      favoritesCache.set(cacheKey, {
        data: newFavorites,
        timestamp: Date.now(),
      });
      toast.success("Added to favorites");
      return;
    }

    try {
      // Real user - save to Supabase
      const { error } = await supabase.from("user_favorites").insert([
        {
          user_id: user.id,
          content_id: contentId,
        },
      ]);

      if (error) {
        console.error("Error adding to favorites:", error);
        // Fallback to localStorage
        setFavoriteIds(newFavorites);
        localStorage.setItem(
          `favorites_${user.id}`,
          JSON.stringify(newFavorites),
        );
        toast.success("Added to favorites");
      } else {
        setFavoriteIds(newFavorites);
        toast.success("Added to favorites");
      }
      
      // Update cache immediately regardless of success/error
      favoritesCache.set(cacheKey, {
        data: newFavorites,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Error adding to favorites:", error);
      toast.error("Failed to add to favorites");
    }
  };

  const removeFromFavorites = async (contentId: string) => {
    if (!user) return;

    const cacheKey = user.id || user.email || "anonymous";
    const newFavorites = favoriteIds.filter((id) => id !== contentId);

    // Check if this is a demo user
    const isDemoUser = user.email && demoUserFavorites[user.email];

    if (isDemoUser) {
      // Demo user - just update local state and cache
      setFavoriteIds(newFavorites);
      // Update cache immediately
      favoritesCache.set(cacheKey, {
        data: newFavorites,
        timestamp: Date.now(),
      });
      toast.success("Removed from favorites");
      return;
    }

    try {
      // Real user - remove from Supabase
      const { error } = await supabase
        .from("user_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("content_id", contentId);

      if (error) {
        console.error("Error removing from favorites:", error);
        // Fallback to localStorage
        setFavoriteIds(newFavorites);
        localStorage.setItem(
          `favorites_${user.id}`,
          JSON.stringify(newFavorites),
        );
        toast.success("Removed from favorites");
      } else {
        setFavoriteIds(newFavorites);
        toast.success("Removed from favorites");
      }
      
      // Update cache immediately regardless of success/error
      favoritesCache.set(cacheKey, {
        data: newFavorites,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Error removing from favorites:", error);
      toast.error("Failed to remove from favorites");
    }
  };

  return {
    favoriteIds,
    isLoading,
    addToFavorites,
    removeFromFavorites,
    refetch: fetchFavorites,
  };
};
