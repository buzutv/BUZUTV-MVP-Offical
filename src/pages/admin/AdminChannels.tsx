
import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Edit, Trash2, Plus, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminChannels } from "@/hooks/useAdminChannels";
import { supabase } from "@/integrations/supabase/client";

const AdminChannels = () => {
  const { channels, isLoading, refetch } = useAdminChannels();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectChannel = (channelId: string) => {
    setSelectedChannels(prev => 
      prev.includes(channelId) 
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    );
  };

  const handleSelectAll = () => {
    if (selectedChannels.length === filteredChannels.length) {
      setSelectedChannels([]);
    } else {
      setSelectedChannels(filteredChannels.map(channel => channel.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedChannels.length === 0) {
      toast.error("No channels selected");
      return;
    }
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('channels')
        .delete()
        .in('id', selectedChannels);

      if (error) {
        console.error('Error deleting channels:', error);
        toast.error('Failed to delete channels');
        return;
      }

      toast.success(`${selectedChannels.length} channel(s) deleted successfully`);
      setSelectedChannels([]);
      setShowDeleteModal(false);
      
      // Refresh the data
      refetch();
    } catch (error) {
      console.error('Error deleting channels:', error);
      toast.error('Failed to delete channels');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Manage Channels</h2>
            <p className="text-gray-400">Add, edit, or remove channels from your platform</p>
          </div>
          <Link
            to="/admin/add-channel"
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Channel</span>
          </Link>
        </div>

        {/* Search */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedChannels.length > 0 && (
          <div className="bg-purple-600 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">
                {selectedChannels.length} channel(s) selected
              </span>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleBulkDelete}
                  disabled={deleting}
                  className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{deleting ? 'Deleting...' : 'Delete Selected'}</span>
                </button>
                <button
                  onClick={() => setSelectedChannels([])}
                  className="text-purple-100 hover:text-white transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Channels Grid */}
        {filteredChannels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChannels.map((channel) => (
              <div key={channel.id} className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <input
                    type="checkbox"
                    checked={selectedChannels.includes(channel.id)}
                    onChange={() => handleSelectChannel(channel.id)}
                    className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/admin/edit-channel/${channel.id}`}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => {
                        setSelectedChannels([channel.id]);
                        setShowDeleteModal(true);
                      }}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 mb-4">
                  <img
                    src={channel.logo_url || '/placeholder.svg'}
                    alt={channel.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{channel.name}</h3>
                    <div className="flex items-center space-x-1 text-gray-400 text-sm">
                      <PlayCircle className="w-4 h-4" />
                      <span>0 Content</span>
                    </div>
                    {!channel.is_active && (
                      <span className="inline-block px-2 py-1 text-xs bg-red-600 text-white rounded-full mt-1">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
                
                <p className="text-gray-400 text-sm">{channel.description || 'No description'}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <PlayCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Channels Found</h3>
            <p className="text-gray-400">
              {searchQuery ? 'No channels match your search.' : 'No channels are available to manage.'}
            </p>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-white mb-4">Confirm Delete</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete {selectedChannels.length} channel(s)? This action cannot be undone.
              </p>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminChannels;
