import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Global cache for user subscriptions
const subscriptionsCache = new Map<
  string,
  { data: string[]; timestamp: number }
>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useUserSubscriptions = () => {
  console.log("📺 [useUserSubscriptions] Hook called");
  const [subscriptionIds, setSubscriptionIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const mountedRef = useRef(true);

  const fetchSubscriptions = async () => {
    if (!user || !mountedRef.current) {
      if (mountedRef.current) {
        setSubscriptionIds([]);
        setIsLoading(false);
      }
      return;
    }

    try {
      const cacheKey = user.id || user.email || "anonymous";

      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("channel_id")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching subscriptions:", error);
        return;
      }

      const result = data?.map((sub) => sub.channel_id).filter(Boolean) || [];

      // Update cache
      subscriptionsCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      if (mountedRef.current) {
        setSubscriptionIds(result);
        setIsLoading(false);
      }

      console.log(
        "📺 [useUserSubscriptions] Subscriptions loaded:",
        result.length,
      );
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    if (user) {
      // Check cache first
      const cacheKey = user.id || user.email || "anonymous";
      const cached = subscriptionsCache.get(cacheKey);
      const now = Date.now();

      if (cached && now - cached.timestamp < CACHE_DURATION) {
        console.log("📺 [useUserSubscriptions] ✅ Cache hit");
        setSubscriptionIds(cached.data);
        setIsLoading(false);
        return;
      }

      fetchSubscriptions();
    } else {
      setSubscriptionIds([]);
      setIsLoading(false);
    }

    return () => {
      mountedRef.current = false;
    };
  }, [user]);

  const toggleSubscription = async (channelId: string) => {
    if (!user) {
      toast.error("Please log in to subscribe to channels");
      return;
    }

    try {
      const isSubscribed = subscriptionIds.includes(channelId);

      if (isSubscribed) {
        // Unsubscribe
        const { error } = await supabase
          .from("user_subscriptions")
          .delete()
          .eq("user_id", user.id)
          .eq("channel_id", channelId);

        if (error) {
          console.error("Error unsubscribing:", error);
          toast.error("Failed to unsubscribe");
          return;
        }

        setSubscriptionIds((prev) => prev.filter((id) => id !== channelId));
        toast.success("Unsubscribed successfully");
      } else {
        // Subscribe
        const { error } = await supabase.from("user_subscriptions").insert({
          user_id: user.id,
          channel_id: channelId,
        });

        if (error) {
          console.error("Error subscribing:", error);
          toast.error("Failed to subscribe");
          return;
        }

        setSubscriptionIds((prev) => [...prev, channelId]);
        toast.success("Subscribed successfully");
      }
    } catch (error) {
      console.error("Error toggling subscription:", error);
      toast.error("An error occurred");
    }
  };

  return {
    subscriptionIds,
    isLoading,
    toggleSubscription,
    refetch: fetchSubscriptions,
  };
};
