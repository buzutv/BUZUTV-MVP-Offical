import { supabase } from "@/integrations/supabase/client"
import { useEffect, useState } from "react";
import { useContentCache } from "./useContentCache";
import { set } from "date-fns";

interface PlaylistHookProps {
  id?: string;
}

const usePlaylists = ({ id }: PlaylistHookProps = {}) => {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [content, setContent] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);

  const fetchPlaylists = async () => {
    // 1. Fetch all playlists
    setIsFetching(true);
    setIsLoading(true);
    setError(null);
    const { data, error } = await supabase.from('playlists').select('*');
    const playlistWithItems = [];

    // We remove contentDataforItems declaration from here.

    if (error) {
      console.log("Error fetching playlists:", error);
      setError(error);
      setIsFetching(false);
      setIsLoading(false);
      return { data, error };
    }

    // 2. Loop through each playlist
    for (const pl of data || []) {
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
        setError(itemsError);
        setIsFetching(false);
        setIsLoading(false);
        continue;
      }

      // 5. Fetch content details for each item
      for (const item of items) {
        const { data: contentData, error: contentError } = await supabase
          .from('content')
          .select('*')
          .eq('id', item.content_id)
          .single();

        if (contentError) {
          console.log("Error fetching content:", contentError);
          setError(contentError);
          setIsFetching(false);
          setIsLoading(false);
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
    setIsFetching(false);
    setIsLoading(false);

    return { data, error };
  }

  const run = async (fn: () => Promise<any>) => {
    setIsFetching(true);
    if (!playlists.length) setIsLoading(true);
    setError(null);

    try {
      return await fn();
    } catch (err: any) {
      setError(err);
      return null;
    } finally {
      setIsFetching(false);
      setIsLoading(false);
    }
  };


  const fetchSinglePlaylist = async (id: string) =>
    run(async () => {
      const { data: playlist, error: playlistError } = await supabase
        .from("playlists")
        .select("*")
        .eq("id", id)
        .single();

      if (playlistError) throw playlistError;

      const { data: items, error: itemsError } = await supabase
        .from("playlist_items")
        .select("*")
        .eq("playlist_id", id);

      if (itemsError) throw itemsError;

      const contents = await Promise.all(
        items.map(async (movie) => {
          const { data, error } = await supabase
            .from("content")
            .select("*")
            .eq("id", movie.content_id)
            .single();

          if (error) return null;

          return {
            ...data,
            title: playlist.title,
            content_title: data.title,
            description: playlist.description,
          };
        })
      );

      const filtered = contents.filter(Boolean);

      setContent(filtered);
      setPlaylists([{ ...playlist, items: filtered }]);

      return { playlist, items, contents: filtered };
    });



  const refetch = async (id?: string) => {
    if (id) return fetchSinglePlaylist(id);
    return fetchPlaylists();
  };



  // const {
  //     data: playlistContent,
  //     isLoading,
  //     error,
  //     refetch,
  //   } = useContentCache("playlists", fetchPlaylists, []);


  useEffect(() => {
    async function loadPlaylists() {
      if (id) {
        await fetchSinglePlaylist(id);
        return;
      }
      await fetchPlaylists();
    }
    loadPlaylists();
  }, [])

  console.log("Playlists in usePlaylists hook:", playlists);

  return {
    fetchPlaylists,
    fetchSinglePlaylist,
    playlists: playlists,
    content: content,
    isLoading,
    isFetching,
    error,
    refetch
  }
}


export default usePlaylists;