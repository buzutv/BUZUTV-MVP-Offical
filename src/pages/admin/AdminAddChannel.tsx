
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout';
import ChannelForm from '@/components/forms/ChannelForm';
import { supabase } from '@/integrations/supabase/client';

const AdminAddChannel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('channels')
        .insert({
          name: data.name,
          description: data.description || null,
          logo_url: data.logoUrl || null,
          banner_url: data.bannerUrl || null,
          is_active: data.isActive
        });

      if (error) {
        console.error('Error adding channel:', error);
        toast.error('Failed to add channel');
        return;
      }

      toast.success('Channel added successfully');
      navigate('/admin/channels');
    } catch (error) {
      console.error('Error adding channel:', error);
      toast.error('Failed to add channel');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Add New Channel</h2>
          <p className="text-gray-400">Create a new channel for your platform</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <ChannelForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            submitLabel="Add Channel"
          />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAddChannel;
