import { supabase } from "@/integrations/supabase/client"
import { useEffect, useState } from "react";
interface PlaylistHookProps {
  id?: string;
}
const usePlaylists = ({ id }: PlaylistHookProps = {}) => {
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [content, setContent] = useState<any[]>([]);
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

  if (itemsError) {
    return { playlist, items: [], error: itemsError };
  }

  // Fetch all content items in parallel
  const contents = await Promise.all(
    items.map(async (movie) => {
      const { data, error } = await supabase
        .from("content")
        .select("*")
        .eq("id", movie.content_id)
        .single();

      if (error) {
        console.log("Error fetching content:", error);
        return null;
      }

      return data;
    })
  );

  const filteredContents = contents.filter(Boolean);

  setContent(filteredContents);

  setPlaylists([{ ...playlist, items }]);

  return { playlist, items, contents: filteredContents };
};


console.log("Movie found", content)



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
        content:content
    }


}


export default usePlaylists;