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
        const playlistWithItems = [];
        const contentDataforItems = []
        // const historyDatawithContent = []
      


        // console.log("Fetched History Data:", history);


        if (error) {
            console.log("Error fetching playlists:", error);
            return { data, error };
        }
        for(const pl of data || []) {
            const { data: items, error: itemsError } = await supabase
                .from('playlist_items')
                .select('*')
                .eq('playlist_id', pl.id);
            if (itemsError) {
                console.log("Error fetching playlist items:", itemsError);
                continue;
            }

            for(const item of items) {
                const { data: contentData, error: contentError } = await supabase
                    .from('content')
                    .select('*')
                    .eq('id', item.content_id)
                    .single();
                if (contentError) {
                    console.log("Error fetching content:", contentError);
                    continue;
                }             
                contentDataforItems.push(contentData);
            }

            playlistWithItems.push({
                ...pl,
                items: contentDataforItems
            });
          
        }

        setPlaylists(playlistWithItems);
        return { data, error };
    }

const fetchSinglePlaylist = async (id: string) => {
  console.log("Fetching single playlist with id:", id);

  // Fetch playlist info
  const { data: playlist, error: playlistError } =
    await supabase.from("playlists").select("*").eq("id", id).single();

  console.log("Fetched playlist data:", playlist);
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
        console.log("Fetched content data:", data);

        return {
          ...data,
          title: playlist?.title || "Untitled",
          content_title: data?.title || "Untitled",
          description: playlist?.description || "No description available",
        };
      })
    );

  const filteredContents = contents.filter(Boolean);

  setContent(filteredContents);

  setPlaylists([{ ...playlist, items }]);

  return { playlist, items, contents: filteredContents };
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
        content:content
    }


}


export default usePlaylists;