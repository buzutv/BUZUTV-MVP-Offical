import { supabase } from "@/integrations/supabase/client"
import { useEffect, useState } from "react";
interface PlaylistHookProps {
  id?: string;
}
const usePlaylists = ({ id }: PlaylistHookProps = {}) => {
    const [playlists, setPlaylists] = useState<any[]>([]);

    const fetchPlaylists = async () => {
        const { data, error } = await supabase.from('playlists').select('*');
        setPlaylists(data || []);
        return { data, error };
    }

    const fetchSinglePlaylist = async (id: string) => {
    console.log("Fetching single playlist with id:", id);

    // Fetch playlist info
    const { data: playlist, error: playlistError } =
        await supabase.from("playlists").select("*").eq("id", id).single();

    if (playlistError) {
        console.log("Error fetching playlist:", playlistError);
        return { playlist: null, items: [], error: playlistError };
    }

    // Fetch playlist items
    const { data: items, error: itemsError } =
        await supabase.from("playlist_items").select("*").eq("playlist_id", id);

    console.log("Playlist:", playlist);
    console.log("Playlist items:", items);

    // Update state
    setPlaylists([{ ...playlist, items: items || [] }]);

    return { playlist, items, error: itemsError };
};



    useEffect(() =>{
        async function loadPlaylists() {
            if (id) {
                await fetchSinglePlaylist(id);
                return;
            }
            await fetchPlaylists();
        }
        loadPlaylists();
    },[])
    
    console.log("Playlists in usePlaylists hook:", playlists);
    


    



    return {
        fetchPlaylists,
        fetchSinglePlaylist,
        playlists: playlists,
    }


}


export default usePlaylists;