import { supabase } from "@/integrations/supabase/client"
import { useEffect, useState } from "react";
import { useContentCache } from "./useContentCache";
import { set } from "date-fns";
import { useGetPlaylistsByUserQuery, useGetPlaylistsWithItemsQuery, useLazyGetPlaylistByIdQuery, useLazyGetPlaylistsWithItemsByIdQuery } from "@/store/playlistSlice";
import { useSupabaseAuth } from "./useSupabaseAuth";
import { useGetContentQuery, useGetContentWithWatchHistoryQuery } from "@/store/contentSlice";
import { useAuth } from "@/contexts/AuthContext";

interface PlaylistHookProps {
  id?: string;
}

const usePlaylists = ({ id }: PlaylistHookProps = {}) => {
  const [_playlists, setPlaylists] = useState<any[]>([]);
  const [content, setContent] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { data: contentData, isLoading: contentLoading } = useGetContentWithWatchHistoryQuery(user?.id, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
    refetchOnMountOrArgChange: true,
  })

  const { data: playlists, isLoading: playlistLoading, refetch } = useGetPlaylistsByUserQuery(user?.id, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
    refetchOnMountOrArgChange: true,
  })


  const { data: playlistWithItems, isLoading: playlistWithItemsLoading, refetch: refetchPlaylistWithItems } = useGetPlaylistsWithItemsQuery(user?.id, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
    refetchOnMountOrArgChange: true,
  })
  const [triggerPlaylistById] = useLazyGetPlaylistByIdQuery();
  const [triggerPlaylistWithItemsById, triggerResult] = useLazyGetPlaylistsWithItemsByIdQuery();

  console.log("Playlist from RTK Query:", playlistWithItems, "Loading:", playlistLoading);

  return {
    playlistWithItems,
    playlists,
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