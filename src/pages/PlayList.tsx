import { Skeleton } from "@/components/ui/skeleton"
import { useGetPlaylistsWithItemsQuery } from "../store/playlistSlice" // your RTK Query hook
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger, 
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Circle, Plus, RefreshCcw, Trash2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { getOptimizedImageUrl } from "@/utils/youtubeUtils"

type PlaylistToDelete = {
    id: string;
    title: string;
} | null;

const USER_ID = "03fa9a91-4281-4bd4-9e60-4da2ba72b0f3" // replace with actual session user

const PlayList = () => {
    const { data: playlists = [], refetch, isFetching } = useGetPlaylistsWithItemsQuery(USER_ID)
    const navigate = useNavigate()

    const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false)
    const [playlistToDelete, setPlaylistToDelete] = useState<PlaylistToDelete>(null)
    const isDeleteDialogOpen = !!playlistToDelete

    const [playlistForm, setPlaylistForm] = useState({
        title: '',
        description: ''
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setPlaylistForm({ ...playlistForm, [name]: value })
    }

    const handleDeleteClick = (e: React.MouseEvent, playlistId: string, playlistTitle: string) => {
        e.stopPropagation()
        setPlaylistToDelete({ id: playlistId, title: playlistTitle })
    }

    const handleConfirmDelete = async () => {
        if (!playlistToDelete) return
        const playlistId = playlistToDelete.id

        const { error } = await supabase
            .from('playlists')
            .delete()
            .eq('id', playlistId)

        if (error) {
            console.error('Error deleting playlist:', error)
            alert(`Failed to delete playlist: ${error.message}`)
        } else {
            refetch()
        }

        setPlaylistToDelete(null)
    }

    const handleSubmitPlaylist = async (e: React.FormEvent) => {
        e.preventDefault()

        const payload = {
            id: crypto.randomUUID(),
            title: playlistForm.title,
            description: playlistForm.description,
            created_by: USER_ID
        }

        const { error } = await supabase.from('playlists').insert([payload])

        if (!error) {
            setIsCreatePlaylistOpen(false)
            setPlaylistForm({ title: '', description: '' })
            refetch()
        }
    }

    return (
        <div className="p-10 mt-24 min-h-screen relative">
            {/* Background */}
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

            {/* DELETE DIALOG */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={() => setPlaylistToDelete(null)}>
                <DialogContent className="sm:max-w-[425px] bg-white text-black">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-red-600 flex items-center gap-2">
                            <Trash2 className="w-5 h-5"/>
                            Confirm Deletion
                        </DialogTitle>
                        <DialogDescription>
                            Delete playlist:
                            <span className="font-bold"> "{playlistToDelete?.title}"</span>?  
                            This action is permanent.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => setPlaylistToDelete(null)}
                            className="text-gray-600 border-gray-300 hover:bg-gray-100"
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleConfirmDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Delete Permanently
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* HEADER */}
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-white">Your Playlists</h2>
                <div className="flex items-center gap-4">
                    <Button className="bg-slate-800 hover:bg-slate-700 text-white gap-2 px-6 py-3 animate" onClick={() => refetch()}>
                        <RefreshCcw className="w-4 h-4" />
                        Refresh Playlists
                    </Button>
                    <Dialog open={isCreatePlaylistOpen} onOpenChange={setIsCreatePlaylistOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-slate-800 hover:bg-slate-700 text-white gap-2 px-6 py-3">
                                <Plus className="w-4 h-4" />
                                Create New Playlist
                            </Button>
                        </DialogTrigger>

                        <DialogContent className="max-w-md bg-white text-black">
                            <DialogHeader>
                                <DialogTitle className="text-xl text-white">Create New Playlist</DialogTitle>
                            </DialogHeader>

                            <form className="grid gap-4 py-4" onSubmit={handleSubmitPlaylist}>
                                <div className="grid gap-2">
                                    <label className="text-sm text-white font-medium">
                                        Playlist Title
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={playlistForm.title}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 rounded-md"
                                        required
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <label className="text-sm text-white font-medium">
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        value={playlistForm.description}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    />
                                </div>

                                <Button type="submit" className="w-full bg-slate-800 hover:bg-slate-700 text-white">
                                    Create Playlist
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* LOADING SKELETON */}
            {isFetching && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 w-full">
                    {Array.from({ length: 10 }).map((_, idx) => (
                        <div
                            key={idx}
                            className="rounded-xl overflow-hidden bg-white/5 backdrop-blur-md border border-white/10 shadow-md"
                        >
                            <Skeleton className="w-full h-48" />
                            <div className="p-3 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* PLAYLIST GRID */}
            {playlists.length > 0 && (
                <div className="grid gap-10 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {playlists.map((playlist) => {
                        const items = playlist.playlist_items || []
                        const previews = items.slice(0, 3)

                        return (
                            <div
                                key={playlist.id}
                                className="cursor-pointer transition-transform duration-300 hover:scale-[1.03] relative group"
                                onClick={() => navigate(`/playlists/${playlist.id}`)}
                            >
                                <div className="relative h-[300px] mb-4">
                                    {previews.length > 0 ? (
                                        previews.map((item, i) => (
                                            <img
                                                key={item.id}
                                                src={getOptimizedImageUrl(
                                                    item.content?.poster_url ?? "https://placehold.co/350x300/334155/ffffff?text=Video+Asset",
                                                    400
                                                )}
                                                className={`absolute left-0 w-full h-[300px] rounded-xl shadow-lg object-cover 
                                                    transition-all duration-300
                                                    ${i === 0 ? "z-30 top-0 scale-105" : ""}
                                                    ${i === 1 ? "z-20 top-4 scale-95" : ""}
                                                    ${i === 2 ? "z-10 top-8 scale-90" : ""}`}
                                            />
                                        ))
                                    ) : (
                                        <img
                                            src="https://placehold.co/350x300/1D0833/9CA3AF?text=Empty%20Playlist"
                                            className="w-full h-[300px] rounded-xl shadow-lg object-cover z-30 opacity-70"
                                        />
                                    )}

                                    <button
                                        className="absolute bottom-[-10px] right-0 z-40 bg-red-700/90 hover:bg-red-600 p-2 rounded-lg text-white transition shadow-xl opacity-0 group-hover:opacity-100"
                                        onClick={(e) => handleDeleteClick(e, playlist.id, playlist.title)}
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="mt-3">
                                    <p className="font-semibold text-white">{playlist.title}</p>
                                    <p className="text-sm text-gray-400">{items.length} videos</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* EMPTY STATE */}
            {!isFetching && playlists.length === 0 && (
                <div className="text-center p-20 border border-gray-700 rounded-xl bg-black/50">
                    <p className="text-xl text-gray-400">You haven't created any playlists yet.</p>
                </div>
            )}
        </div>
    )
}

export default PlayList
