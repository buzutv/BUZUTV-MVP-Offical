
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout';
import ChannelForm from '@/components/forms/ChannelForm';
import { supabase } from '@/integrations/supabase/client';

const AdminEditChannel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [channel, setChannel] = useState<any>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      fetchChannel();
    }
  }, [id]);

  const fetchChannel = async () => {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching channel:', error);
        toast.error('Failed to load channel');
        navigate('/admin/channels');
        return;
      }

      setChannel(data);
    } catch (error) {
      console.error('Error fetching channel:', error);
      toast.error('Failed to load channel');
      navigate('/admin/channels');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('channels')
        .update({
          name: data.name,
          description: data.description || null,
          logo_url: data.logoUrl || null,
          banner_url: data.bannerUrl || null,
          is_active: data.isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating channel:', error);
        toast.error('Failed to update channel');
        return;
      }

      toast.success('Channel updated successfully');
      navigate('/admin/channels');
    } catch (error) {
      console.error('Error updating channel:', error);
      toast.error('Failed to update channel');
    } finally {
      setIsLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading channel...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!channel) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Channel not found</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Edit Channel</h2>
          <p className="text-gray-400">Update channel information</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <ChannelForm
            onSubmit={handleSubmit}
            initialData={{
              name: channel.name,
              description: channel.description || '',
              logoUrl: channel.logo_url || '',
              bannerUrl: channel.banner_url || '',
              isActive: channel.is_active
            }}
            isLoading={isLoading}
            submitLabel="Update Channel"
          />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminEditChannel;
