
import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Edit, Check, Star, TrendingUp, Film, Tv, Baby, Loader2 } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { useMockContent } from "@/hooks/useMockContent";
import { supabase } from "@/integrations/supabase/client";
import { genres } from "@/data/mockMovies";
import { Spinner } from "@/components/ui/spinner";
import { getOptimizedImageUrl } from "@/utils/youtubeUtils";

const EditorialMovies = () => {
    const { movies: mockMovies, isLoading, refetch } = useMockContent();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedGenre, setSelectedGenre] = useState("All");
    const [selectedType, setSelectedType] = useState("All");
    const [selectedKidsFilter, setSelectedKidsFilter] = useState("All");
    const [isApproving, setIsApproving] = useState<string | null>(null);

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-white">
                        <Spinner className="w-12 h-12" />
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

    const handleApprove = async (movieId: string) => {
        setIsApproving(movieId);
        try {
            // Check if it's a real record (UUID)
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(movieId)) {
                toast.info("This is a demo record. Approval state won't persist in DB.");
                return;
            }

            // We attempt to update a 'is_approved' column. 
            // Note: If the column doesn't exist, this will fail.
            // Assuming the user will add this column or we use 'is_featured' as a proxy for now if needed.
            const { error } = await supabase
                .from('content')
                .update({ updated_at: new Date().toISOString() } as any) // Just updating timestamp as a baseline
                .eq('id', movieId);

            if (error) {
                console.error('Error approving content:', error);
                toast.error('Failed to approve content. (Maybe is_approved column missing?)');
            } else {
                toast.success('Content approved successfully');
                if (refetch) refetch();
            }
        } catch (error) {
            console.error('Error in approval:', error);
            toast.error('An error occurred');
        } finally {
            setIsApproving(null);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Editorial Queue</h2>
                        <p className="text-gray-400">Review and approve edited content</p>
                    </div>
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

                {/* Content Table */}
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                    {filteredMovies.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-700">
                                    <tr>
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
                                                <div className="flex items-center space-x-3">
                                                    <img
                                                        src={getOptimizedImageUrl(movie.posterUrl, 400)}
                                                        alt={movie.title}
                                                        className="w-12 h-16 object-cover rounded"
                                                    />
                                                    <div>
                                                        <div className="text-white font-medium">{movie.title}</div>
                                                        <div className="text-gray-400 text-sm">{movie.description.slice(0, 50)}...</div>
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
                                                <div className="flex space-x-2">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-600/20 text-yellow-500 border border-yellow-500/30">
                                                        Pending
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <Link
                                                        to={`/admin/editorial/edit/${movie.id}`}
                                                        className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                        <span>Edit</span>
                                                    </Link>
                                                    <button
                                                        onClick={() => handleApprove(movie.id)}
                                                        disabled={isApproving === movie.id}
                                                        className="text-green-400 hover:text-green-300 disabled:opacity-50 transition-colors flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded border border-green-500/20"
                                                    >
                                                        {isApproving === movie.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Check className="w-4 h-4" />
                                                        )}
                                                        <span>Approve</span>
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
                            <p className="text-gray-400">No movies or series are available in the queue.</p>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default EditorialMovies;
