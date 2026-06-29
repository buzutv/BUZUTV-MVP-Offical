
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AdminChannel {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export const useAdminChannels = () => {
  const [channels, setChannels] = useState<AdminChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchChannels = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching channels:', error);
        toast.error('Failed to load channels');
        return;
      }

      setChannels(data || []);
    } catch (error) {
      console.error('Error fetching channels:', error);
      toast.error('Failed to load channels');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  return {
    channels,
    isLoading,
    refetch: fetchChannels
  };
};
