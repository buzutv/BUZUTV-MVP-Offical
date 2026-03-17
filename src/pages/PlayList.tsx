import { Skeleton } from "@/components/ui/skeleton"
import { useGetPlaylistsWithItemsQuery, useLazyGetPlaylistsWithItemsByIdQuery } from "../store/playlistSlice" // your RTK Query hook
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
import { setPlaylistInfo } from "@/store/screenPlayerSlice"
import { useDispatch } from "react-redux"
import { useAuth } from "@/contexts/AuthContext"

type PlaylistToDelete = {
    id: string;
    title: string;
} | null;



const PlayList = () => {
    const { user, isLoggedIn, setShowLoginModal } = useAuth()
    const { data: playlists = [], refetch, isFetching } = useGetPlaylistsWithItemsQuery(user?.id)
    const [triggerPlaylists] = useLazyGetPlaylistsWithItemsByIdQuery()
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false)
    const [playlistToDelete, setPlaylistToDelete] = useState<PlaylistToDelete>(null)
    const isDeleteDialogOpen = !!playlistToDelete
    const [playlistForm, setPlaylistForm] = useState({
        title: '',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setPlaylistForm({ ...playlistForm, [name]: value })
    }

    const handleDeleteClick = (e: React.MouseEvent, playlistId: string, playlistTitle: string) => {
        e.stopPropagation()
        setPlaylistToDelete({ id: playlistId, title: playlistTitle })
    }

    const handleRoutetoPlaylistDetail = async (playlistId: string) => {
        navigate(`/playlists/${playlistId}`)
        const fetchedPlaylists = await triggerPlaylists({ userId: user?.id, playlist_id: playlistId }).unwrap()
        dispatch(setPlaylistInfo({
            playlistInfo: fetchedPlaylists
        }))
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
            created_by: user?.id
        }

        const { error } = await supabase.from('playlists').insert([payload])

        if (!error) {
            setIsCreatePlaylistOpen(false)
            setPlaylistForm({ title: '' })
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
                <DialogContent className="sm:max-w-[425px] bg-[#120222] border-white/10 text-white backdrop-blur-xl" onPointerDownCapture={(e) => e.stopPropagation()} onKeyDownCapture={(e) => e.stopPropagation()}>
                    <DialogHeader>
                        <DialogTitle className="text-xl text-red-500 flex items-center gap-2">
                            <Trash2 className="w-5 h-5" />
                            Confirm Deletion
                        </DialogTitle>
                        <DialogDescription className="text-gray-300">
                            Delete playlist:
                            <span className="font-bold text-white"> "{playlistToDelete?.title}"</span>?
                            This action is permanent.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setPlaylistToDelete(null)}
                            className="bg-white/5 border-white/10 hover:bg-white/10 text-white"
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
            <div className="grid grid-cols-1 gap-10 mb-14 sm:grid-cols-2">
                <h2 className="text-3xl font-bold text-white">Your Playlists</h2>
                <div className="flex justify-end gap-4">

                    <Button
                        variant="outline"
                        className="bg-white/5 border-white/10 hover:bg-white/10 text-white gap-2 px-6 py-3 transition-all duration-300"
                        onClick={() => refetch()}
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Refresh
                    </Button>
                    <Dialog open={isCreatePlaylistOpen} onOpenChange={setIsCreatePlaylistOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-brand-600/80 hover:bg-brand-600 text-white gap-2 px-6 py-3 shadow-lg shadow-brand-500/10 transition-all duration-300">
                                <Plus className="w-4 h-4" />
                                Create Playlist
                            </Button>
                        </DialogTrigger>

                        <DialogContent className="max-w-md bg-[#120222] border-white/10 text-white backdrop-blur-xl" onPointerDownCapture={(e) => e.stopPropagation()} onKeyDownCapture={(e) => e.stopPropagation()}>
                            <DialogHeader>
                                <DialogTitle className="text-xl text-white">Create New Playlist</DialogTitle>
                            </DialogHeader>

                            <form className="grid gap-4 py-4" onSubmit={handleSubmitPlaylist}>
                                <div className="grid gap-2">
                                    <label className="text-sm text-white/70 font-medium">
                                        Playlist Name
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={playlistForm.title}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-brand-500 placeholder:text-gray-500"
                                        placeholder="My Awesome Playlist"
                                        required
                                        onKeyDown={(e) => e.stopPropagation()}
                                    />
                                </div>

                                <Button type="submit" className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold mt-2">
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

                    {/* <div> */}
                    {playlists.map((playlist) => {
                        const items = playlist.playlist_items || []
                        const previews = items.slice(0, 3)

                        return (
                            <div
                                key={playlist.id}
                                className="cursor-pointer transition-transform duration-300 hover:scale-[1.03] relative group"
                                onClick={() => {
                                    if (!isLoggedIn) {
                                        setShowLoginModal(true);
                                        return;
                                    }
                                    handleRoutetoPlaylistDetail(playlist.id);
                                }}
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

                    {/* </div> */}
                </div>
            )}

            {/* EMPTY STATE */}
            {!isFetching && playlists.length === 0 && (
                <div className="text-center p-20 border border-white/10 rounded-3xl bg-white/5 backdrop-blur-xl animate-in fade-in zoom-in duration-500 max-w-2xl mx-auto shadow-2xl">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                        <Plus className="w-10 h-10 text-white/20" />
                    </div>
                    <p className="text-2xl font-bold text-white mb-3">No Playlists Yet</p>
                    <p className="text-gray-400 mb-8 max-w-sm mx-auto">Start organizing your favorite content by creating your first playlist.</p>
                    <Button
                        onClick={() => setIsCreatePlaylistOpen(true)}
                        className="bg-brand-600 hover:bg-brand-500 text-white px-8 py-6 rounded-2xl text-lg font-bold transition-all active:scale-95"
                    >
                        Create Your First Playlist
                    </Button>
                </div>
            )}
        </div>
    )
}

export default PlayList
