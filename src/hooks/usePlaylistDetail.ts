import { useAuth } from "@/contexts/AuthContext";
import { useGetContentByIdQuery, useGetPlaylistContentWithWatchHistoryQuery } from "@/store/contentSlice"
// import { useState } from "node_modules/react-resizable-panels/dist/declarations/src/vendor/react"

export const usePlaylistDetail = (contentIds?: string[]) => {
    //   const USER_ID = "03fa9a91-4281-4bd4-9e60-4da2ba72b0f3"; 
    const { user } = useAuth();
    const { data, error, refetch } = useGetPlaylistContentWithWatchHistoryQuery({
        userId: user?.id,
        contentIds
    }, {
        // skip:!contentIds || contentIds.length===0,
        refetchOnFocus: true,
        refetchOnMountOrArgChange: true,
        refetchOnReconnect: true
    })
    // const content = data?.content || []
    // const {refetch} = useGetContentByIdQuery(id,{
    //     skip:true
    // })
    // const [historyUpdateKey, setHistoryUpdateKey] = useState(0)


    return {
        refetch
    }
}