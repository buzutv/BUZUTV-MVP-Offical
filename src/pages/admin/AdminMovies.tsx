
import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Edit, Trash2, Plus, Star, TrendingUp, Film, Tv, Baby } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { useMockContent } from "@/hooks/useMockContent";
import { supabase } from "@/integrations/supabase/client";
import { genres } from "@/data/mockMovies";
import { Spinner } from "@/components/ui/spinner";

const AdminMovies = () => {
  const { movies: mockMovies, isLoading } = useMockContent();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedKidsFilter, setSelectedKidsFilter] = useState("All");
  const [selectedMovies, setSelectedMovies] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [singleDeleteId, setSingleDeleteId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white">
            <Spinner className="w-12 h-12"/>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const filteredMovies = mockMovies.filter(movie => {
    const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === "All" || movie.genre === selectedGenre;
    const matchesType = selectedType === "All" || movie.type === selectedType;
    const matchesKids = selectedKidsFilter === "All" || 
      (selectedKidsFilter === "Kids" && movie.isKids) ||
      (selectedKidsFilter === "Non-Kids" && !movie.isKids);
    return matchesSearch && matchesGenre && matchesType && matchesKids;
  });

  const handleSelectMovie = (movieId: string) => {
    setSelectedMovies(prev => 
      prev.includes(movieId) 
        ? prev.filter(id => id !== movieId)
        : [...prev, movieId]
    );
  };

  const handleSelectAll = () => {
    if (selectedMovies.length === filteredMovies.length) {
      setSelectedMovies([]);
    } else {
      setSelectedMovies(filteredMovies.map(movie => movie.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedMovies.length === 0) {
      toast.error("No movies selected");
      return;
    }
    setSingleDeleteId(null);
    setShowDeleteModal(true);
  };

  const handleSingleDeleteConfirm = (movieId: string) => {
    setSingleDeleteId(movieId);
    setSelectedMovies([movieId]);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    
    try {
      const itemsToDelete = singleDeleteId ? [singleDeleteId] : selectedMovies;
      
      // Filter out mock movies (they don't have UUIDs, so we can't delete them from DB)
      const realMovieIds = itemsToDelete.filter(id => {
        // Check if it's a UUID format (real database content)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(id);
      });

      if (realMovieIds.length > 0) {
        const { error } = await supabase
          .from('content')
          .delete()
          .in('id', realMovieIds);

        if (error) {
          console.error('Error deleting content:', error);
          toast.error('Failed to delete content');
          return;
        }
      }

      toast.success(`${itemsToDelete.length} item(s) deleted successfully`);
      setSelectedMovies([]);
      setSingleDeleteId(null);
      setShowDeleteModal(false);
      
      // Refresh the page to show updated content
      window.location.reload();
    } catch (error) {
      console.error('Error deleting content:', error);
      toast.error('Failed to delete content');
    } finally {
      setIsDeleting(false);
    }
  };

  const getDeleteMessage = () => {
    if (singleDeleteId) {
      const movie = filteredMovies.find(m => m.id === singleDeleteId);
      return `Are you sure you want to delete "${movie?.title}"? This action cannot be undone.`;
    }
    return `Are you sure you want to delete ${selectedMovies.length} item(s)? This action cannot be undone.`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Manage Content</h2>
            <p className="text-gray-400">Add, edit, or remove movies and series from your platform</p>
          </div>
          <Link
            to="/admin/add-movie"
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Content</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              {genres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="All">All Types</option>
              <option value="movie">Movies</option>
              <option value="series">Series</option>
            </select>
            <select
              value={selectedKidsFilter}
              onChange={(e) => setSelectedKidsFilter(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="All">All Content</option>
              <option value="Kids">Kids Only</option>
              <option value="Non-Kids">Non-Kids Only</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedMovies.length > 0 && !singleDeleteId && (
          <div className="bg-blue-600 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">
                {selectedMovies.length} movie(s) selected
              </span>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                  className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeleting ? 'Deleting...' : 'Delete Selected'}</span>
                </button>
                <button
                  onClick={() => setSelectedMovies([])}
                  className="text-blue-100 hover:text-white transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          {filteredMovies.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedMovies.length === filteredMovies.length && filteredMovies.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Content
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Genre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Year
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Kids
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredMovies.map((movie) => (
                    <tr key={movie.id} className="hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedMovies.includes(movie.id)}
                          onChange={() => handleSelectMovie(movie.id)}
                          className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={movie.posterUrl}
                            alt={movie.title}
                            className="w-12 h-16 object-cover rounded"
                          />
                          <div>
                            <div className="text-white font-medium">{movie.title}</div>
                            <div className="text-gray-400 text-sm">{movie.description.slice(0, 50)}...</div>
                            {movie.seasons && movie.episodes && (
                              <div className="text-gray-500 text-xs">
                                {movie.seasons} seasons • {movie.episodes} episodes
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1">
                          {movie.type === 'movie' ? (
                            <Film className="w-4 h-4 text-blue-400" />
                          ) : (
                            <Tv className="w-4 h-4 text-green-400" />
                          )}
                          <span className="text-gray-300 capitalize">{movie.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{movie.genre}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-white">{movie.rating}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{movie.year}</td>
                      <td className="px-6 py-4">
                        {movie.isKids ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-600 text-white">
                            <Baby className="w-3 h-3 mr-1" />
                            Kids
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          {movie.isTrending && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-600 text-white">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              Trending
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/admin/edit-movie/${movie.id}`}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleSingleDeleteConfirm(movie.id)}
                            disabled={isDeleting}
                            className="text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No Content Found</h3>
              <p className="text-gray-400">No movies or series are available to manage.</p>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-white mb-4">Confirm Delete</h3>
              <p className="text-gray-300 mb-6">
                {getDeleteMessage()}
              </p>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSingleDeleteId(null);
                    if (singleDeleteId) setSelectedMovies([]);
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminMovies;
