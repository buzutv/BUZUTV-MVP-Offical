import { supabase } from "@/integrations/supabase/client"
import { useEffect, useState } from "react";
import { useContentCache } from "./useContentCache";
import { set } from "date-fns";
import { useGetPlaylistsByUserQuery, useGetPlaylistsWithItemsQuery, useLazyGetPlaylistByIdQuery, useLazyGetPlaylistsWithItemsByIdQuery } from "@/store/playlistSlice";
import { useSupabaseAuth } from "./useSupabaseAuth";
import { useGetContentQuery } from "@/store/contentSlice";

interface PlaylistHookProps {
  id?: string;
}

const usePlaylists = ({ id }: PlaylistHookProps = {}) => {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [content, setContent] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useSupabaseAuth();
  const { data: contentData, isLoading: contentLoading } = useGetContentQuery()

  const { data: playlist, isLoading: playlistLoading, refetch } = useGetPlaylistsByUserQuery("03fa9a91-4281-4bd4-9e60-4da2ba72b0f3", {
    refetchOnFocus: true,
    refetchOnReconnect: true,
    refetchOnMountOrArgChange: true,
  })


  const { data: playlistWithItems, isLoading: playlistWithItemsLoading, refetch: refetchPlaylistWithItems } = useGetPlaylistsWithItemsQuery("03fa9a91-4281-4bd4-9e60-4da2ba72b0f3", {
    refetchOnFocus: true,
    refetchOnReconnect: true,
    refetchOnMountOrArgChange: true,
  })
  const [triggerPlaylistById] = useLazyGetPlaylistByIdQuery();
  const [triggerPlaylistWithItemsById, triggerResult] = useLazyGetPlaylistsWithItemsByIdQuery();

  console.log("Playlist from RTK Query:", playlistWithItems, "Loading:", playlistLoading);

  return {
    playlistWithItems,
    playlist,
    content: contentData,
    isLoading,
    isFetching,
    error,
    refetch,
    refetchPlaylistWithItems,
    triggerPlaylistById,
    triggerPlaylistWithItemsById,
    triggerResult
  }
}


export default usePlaylists;