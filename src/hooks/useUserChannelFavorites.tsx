import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Mock channel favorites for demo users only
const demoUserChannelFavorites: Record<string, string[]> = {
  'user@example.com': ['1', '2'], // Demo user has some channel favorites
  'admin@example.com': ['1', '3'] // Admin has different channel favorites
};

export const useUserChannelFavorites = () => {
  const [favoriteChannelIds, setFavoriteChannelIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchChannelFavorites();
    } else {
      setFavoriteChannelIds([]);
      setIsLoading(false);
    }
  }, [user]);

  const fetchChannelFavorites = async () => {
    if (!user) return;

    try {
      // Check if this is a demo user
      const isDemoUser = user.email && demoUserChannelFavorites[user.email];
      
      if (isDemoUser) {
        // Demo user gets predefined favorites
        setFavoriteChannelIds(demoUserChannelFavorites[user.email]);
        setIsLoading(false);
        return;
      }

      // Real user - for now use localStorage since we don't have a channel favorites table
      const savedChannelFavorites = localStorage.getItem(`channel_favorites_${user.id}`);
      if (savedChannelFavorites) {
        setFavoriteChannelIds(JSON.parse(savedChannelFavorites));
      } else {
        setFavoriteChannelIds([]);
      }
    } catch (error) {
      console.error('Error fetching channel favorites:', error);
      setFavoriteChannelIds([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addChannelToFavorites = async (channelId: string) => {
    if (!user) {
      toast.error('Please log in to add channel favorites');
      return;
    }

    if (favoriteChannelIds.includes(channelId)) {
      toast.error('Channel already in favorites');
      return;
    }

    // Check if this is a demo user
    const isDemoUser = user.email && demoUserChannelFavorites[user.email];
    
    if (isDemoUser) {
      // Demo user - just update local state
      const newFavorites = [...favoriteChannelIds, channelId];
      setFavoriteChannelIds(newFavorites);
      toast.success('Channel added to favorites');
      return;
    }

    try {
      // Real user - save to localStorage for now
      const newFavorites = [...favoriteChannelIds, channelId];
      setFavoriteChannelIds(newFavorites);
      localStorage.setItem(`channel_favorites_${user.id}`, JSON.stringify(newFavorites));
      toast.success('Channel added to favorites');
    } catch (error) {
      console.error('Error adding channel to favorites:', error);
      toast.error('Failed to add channel to favorites');
    }
  };

  const removeChannelFromFavorites = async (channelId: string) => {
    if (!user) return;

    // Check if this is a demo user
    const isDemoUser = user.email && demoUserChannelFavorites[user.email];
    
    if (isDemoUser) {
      // Demo user - just update local state
      const newFavorites = favoriteChannelIds.filter(id => id !== channelId);
      setFavoriteChannelIds(newFavorites);
      toast.success('Channel removed from favorites');
      return;
    }

    try {
      // Real user - update localStorage
      const newFavorites = favoriteChannelIds.filter(id => id !== channelId);
      setFavoriteChannelIds(newFavorites);
      localStorage.setItem(`channel_favorites_${user.id}`, JSON.stringify(newFavorites));
      toast.success('Channel removed from favorites');
    } catch (error) {
      console.error('Error removing channel from favorites:', error);
      toast.error('Failed to remove channel from favorites');
    }
  };

  return {
    favoriteChannelIds,
    isLoading,
    addChannelToFavorites,
    removeChannelFromFavorites,
    refetch: fetchChannelFavorites
  };
};