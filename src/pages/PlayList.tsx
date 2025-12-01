import { Skeleton } from "@/components/ui/skeleton"
import usePlaylists from "@/hooks/usePlaylists"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { supabase } from "@/integrations/supabase/client" // Assuming this is correct path for Supabase client

const PlayList = () => {
    // Assuming usePlaylists provides the list of playlists and refetch functionality
    const { playlists, fetchPlaylists } = usePlaylists() 
    const navigate = useNavigate()

    // --- State for Playlist Creation Dialog ---
    const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
    const [playlistForm, setPlaylistForm] = useState<{
        title: string;
        description: string;
    }>({
        title: '',
        description: ''
    });

    // CONSTANT USER ID (Replace with actual authenticated user ID from Auth context if available)
    // NOTE: This should be retrieved from your authentication context (e.g., useAuth().user.id)
    const USER_ID = "03fa9a91-4281-4bd4-9e60-4da2ba72b0f3"; 

    // --- Handlers for Playlist Creation ---
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setPlaylistForm({ ...playlistForm, [name]: value });
    }

    const handleSubmitPlaylist = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const payload = {
            id: crypto.randomUUID(),
            title: playlistForm.title,
            description: playlistForm.description,
            created_by: USER_ID 
        }

        const { data, error } = await supabase.from('playlists').insert([
            payload
        ]);

        if (error) {
            console.error('Error creating playlist:', error);
        } else {
            console.log('Playlist created:', data);
            
            // 1. Close the dialog and reset form
            setIsCreatePlaylistOpen(false);
            setPlaylistForm({ title: '', description: '' });

            // 2. Refresh the list of playlists to show the new one immediately
            // Ensure your usePlaylists hook has a function like fetchPlaylists
            // If it doesn't, you might need to rely on the hook fetching automatically on mount/dependency change.
            if (typeof fetchPlaylists === 'function') {
                fetchPlaylists(); 
            }
        }
    }

    // You can use a loading state from your usePlaylists hook here for better skeleton control
    const isLoading = !playlists; 
    
    // Fallback if playlists array is null or undefined while loading
    const displayPlaylists = playlists || [];


    return (
        <div className="p-10 mt-24 min-h-screen relative">
           <div
              className="fixed inset-0 -z-10"
              style={{
                background: `
                  linear-gradient(
                    200deg,
                    #311066 0%,
                    #1D0833 20%,
                    #120222 45%,
                    black 100%
                  )
                `,
              }}
            ></div>


            {/* --- HEADER/ACTION SECTION: Create Playlist Button --- */}
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-white">Your Playlists</h2>
                
                <Dialog open={isCreatePlaylistOpen} onOpenChange={setIsCreatePlaylistOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-slate-800 hover:bg-slate-700 text-white gap-2 px-6 py-3">
                            <Plus className="w-4 h-4" />
                            Create New Playlist
                        </Button>
                    </DialogTrigger>

                    <DialogContent className="max-w-md bg-white text-black">
                        <DialogHeader>
                            <DialogTitle>Create New Playlist</DialogTitle>
                        </DialogHeader>
                        <form className="grid gap-4 py-4" onSubmit={handleSubmitPlaylist}>
                            <div className="grid gap-2">
                                <label htmlFor="playlist-title" className="text-sm font-medium">
                                    Playlist Title
                                </label>
                                <input
                                    type="text"
                                    id="playlist-title"
                                    name="title"
                                    value={playlistForm.title}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter playlist title"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <label htmlFor="playlist-description" className="text-sm font-medium">
                                    Description
                                </label>
                                <textarea
                                    id="playlist-description"
                                    name="description"
                                    value={playlistForm.description}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter playlist description (optional)"
                                />
                            </div>
                            <Button type="submit" className="w-full bg-slate-800 hover:bg-slate-700 text-white">
                                Create Playlist
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            {/* ---------------------------------------------------- */}

            <div className='flex items-center gap-8 justify-start w-full'>
                {/* --- SKELETON LOADING STATE --- */}
                {isLoading && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 w-full">
                        {Array.from({ length: 10 }).map((_, idx) => (
                            <div
                                key={idx}
                                className="rounded-xl overflow-hidden bg-white/5 backdrop-blur-md border border-white/10 shadow-md"
                            >
                                {/* Poster skeleton */}
                                <Skeleton className="w-full h-48" />

                                {/* Text skeletons */}
                                <div className="p-3 space-y-2">
                                    <Skeleton className="h-4 w-3/4 bg-muted-foreground" />
                                    <Skeleton className="h-3 w-1/2 bg-muted-foreground" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {/* ------------------------------- */}
            </div>

            {/* --- PLAYLIST CARDS --- */}
            {!isLoading && displayPlaylists.length > 0 && (
                <div className="flex flex-wrap items-start justify-start gap-10">
                    {displayPlaylists.map((playlist) => {
                        const items = playlist.items || []
                        const previews = items.slice(0, 3) // first 3 thumbnails

                        return (
                            <div
                                key={playlist.id}
                                className="w-[350px] cursor-pointer mb-10 transition-transform duration-300 hover:scale-[1.03]"
                                onClick={() => navigate(`/playlists/${playlist.id}`)}
                            >
                                {/* Stacked thumbnails or Placeholder */}
                                <div className="relative h-[300px] mb-4">
                                    {previews.length > 0 ? (
                                        previews.map((item, i) => (
                                            <img
                                                key={item.id}
                                                src={item.poster_url ?? "https://placehold.co/350x300/334155/ffffff?text=Video+Asset"}
                                                className={`absolute left-0 w-full h-[300px] rounded-xl shadow-lg object-cover 
                                                    transition-all duration-300
                                                    ${i === 0 ? "z-30 top-0 scale-105" : ""}
                                                    ${i === 1 ? "z-20 top-4 scale-95" : ""}
                                                    ${i === 2 ? "z-10 top-8 scale-90" : ""}
                                                `}
                                                alt={`Preview ${i + 1} of ${playlist.title}`}
                                            />
                                        ))
                                    ) : (
                                        // --- Placeholder for Empty Playlist ---
                                        <img
                                            src="https://placehold.co/350x300/1D0833/9CA3AF?text=Empty%20Playlist"
                                            alt="Empty Playlist Placeholder"
                                            className="w-full h-[300px] rounded-xl shadow-lg object-cover z-30 opacity-70 border border-indigo-700/50"
                                        />
                                        // --------------------------------------
                                    )}
                                </div>

                                {/* Title & count */}
                                <div className="mt-3">
                                    <p className="font-semibold text-white">{playlist.title}</p>
                                    <p className="text-sm text-gray-400">{items.length} videos</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
            
            {/* --- NO PLAYLISTS MESSAGE --- */}
            {!isLoading && displayPlaylists.length === 0 && (
                <div className="text-center p-20 border border-gray-700 rounded-xl bg-black/50">
                    <p className="text-xl text-gray-400">You haven't created any playlists yet.</p>
                    <p className="text-gray-500 mt-2">Click "Create New Playlist" to get started!</p>
                </div>
            )}
        </div>
    )
}

export default PlayList