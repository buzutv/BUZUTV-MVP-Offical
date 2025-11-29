import { supabase } from "@/integrations/supabase/client"
import { useEffect, useState } from "react";

interface PlaylistHookProps {
  id?: string;
}

const usePlaylists = ({ id }: PlaylistHookProps = {}) => {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [content, setContent] = useState<any[]>([]);

  const fetchPlaylists = async () => {
    // 1. Fetch all playlists
    const { data, error } = await supabase.from('playlists').select('*');
    const playlistWithItems = [];
    
    // We remove contentDataforItems declaration from here.

    if (error) {
        console.log("Error fetching playlists:", error);
        return { data, error };
    }

    // 2. Loop through each playlist
    for(const pl of data || []) {
      // 3. IMPORTANT FIX: Initialize contentDataforItems *inside* the loop
      // This ensures a fresh array for each playlist.
      const contentDataforItems = [] 

      // 4. Fetch items for the current playlist
      const { data: items, error: itemsError } = await supabase
          .from('playlist_items')
          .select('*')
          .eq('playlist_id', pl.id);
      
      if (itemsError) {
          console.log("Error fetching playlist items:", itemsError);
          continue;
      }

      // 5. Fetch content details for each item
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
          // 6. Push content into the *current* playlist's items array
          contentDataforItems.push(contentData);
      }

      // 7. Push the complete, correctly scoped playlist object
      playlistWithItems.push({
          ...pl,
          items: contentDataforItems // This now contains only the content for 'pl'
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

    setPlaylists([{ ...playlist, items: filteredContents }]); // Also fixed assignment here

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