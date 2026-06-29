
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import MovieForm from "@/components/forms/MovieForm";

const AdminAddMovie = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    if (!data.title || !data.type) {
      toast.error("Please fill in required fields");
      return;
    }

    setIsLoading(true);

    try {
      const contentData: any = {
        title: data.title,
        description: data.description || null,
        type: data.type,
        is_kids: data.isKids || false,
        genre: data.genre || null,
        year: data.year ? parseInt(data.year) : null,
        rating: data.rating ? parseFloat(data.rating) : null,
        poster_url: data.posterUrl || null,
        backdrop_url: data.backdropUrl || null,
        video_url: data.videoUrl || null,
        duration_minutes: data.type === 'movie' && data.durationMinutes ? parseInt(data.durationMinutes) : null,
        seasons: data.type === 'series' && data.seasons ? parseInt(data.seasons) : null,
        episodes: data.type === 'series' && data.episodes ? parseInt(data.episodes) : null,
        is_featured: data.isFeatured || false,
        is_trending: data.isTrending || false,
        channel_id: data.channelId || null
      };

      // Store detailed seasons data if provided
      if (data.seasonsData && data.seasonsData.length > 0) {
        contentData.seasons_data = JSON.stringify(data.seasonsData);
      }

      const { error } = await supabase
        .from('content')
        .insert([contentData]);

      if (error) {
        console.error('Error adding content:', error);
        toast.error('Failed to add content');
        return;
      }

      toast.success(`${data.type === 'movie' ? 'Movie' : 'Series'} added successfully!`);
      navigate('/admin/movies');
    } catch (error) {
      console.error('Error adding content:', error);
      toast.error('Failed to add content');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Add New Content</h2>
          <p className="text-gray-400">Add a new movie or series to the platform</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <MovieForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            submitLabel="Add Content"
          />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAddMovie;
