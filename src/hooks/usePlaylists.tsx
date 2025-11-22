import { supabase } from "@/integrations/supabase/client"
import { useEffect, useState } from "react";

const usePlaylists = () => {
    const [playlists, setPlaylists] = useState<any[]>([]);

    const fetchPlaylists = async () => {
        const { data, error } = await supabase.from('playlists').select('*');
        setPlaylists(data || []);
        return { data, error };
    }


    useEffect(() =>{
        async function loadPlaylists() {
            await fetchPlaylists();
        }
        loadPlaylists();
    },[])
    const fetchSinglePlaylist = async (id: string) => {
        const { data, error } = await supabase.from('playlists').select('*').eq('id', id).single();
        setPlaylists(data ? [data] : []);
        return { data, error };
    }

    return {
        fetchPlaylists,
        fetchSinglePlaylist,
        playlists
    }


}


export default usePlaylists;