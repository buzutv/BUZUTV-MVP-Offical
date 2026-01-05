import { useGetContentWithWatchHistoryQuery, useLazyGetContentWithWatchHistoryFiltersQuery, useLazyGetContentWithWatchHistoryQuery } from '@/store/contentSlice'
import { openScreenPlayer } from '@/store/screenPlayerSlice'
import { Content } from '@/types'
import { getOptimizedImageUrl } from '@/utils/youtubeUtils'
import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'

const RelatedContent = ({
    setMovieid,
    setVideoEnded,
    setActualVideoUrl,
    setMovies,
    setPlaylists,
    handleRelatedClick
}) => {
  const [triggerRelatedContent] = useLazyGetContentWithWatchHistoryQuery()
  const [relatedContent, setRelatedContent] = React.useState<Content[]>([])
  const dispatch = useDispatch();
  useEffect(() =>{
    const fetchRelatedContent = async () => {
      try {
        const response = await triggerRelatedContent("03fa9a91-4281-4bd4-9e60-4da2ba72b0f3")
        if ('data' in response) {
            const normalizedContent = response?.data?.map(item => {
                    const [history] = item.user_watch_history ?? [];

                    return {
                        ...item,
                        watch_percentage: history?.watch_percentage ?? 0,
                        last_position: history?.last_position ?? 0,
                        completed: history?.completed ?? false,
                    };
                    });
          setRelatedContent(normalizedContent)
        } else {
          console.error('Error fetching related content:', response.error)
        }
      } catch (error) {
        console.error('Error fetching related content:', error)
      }
    }

    fetchRelatedContent()
  },[])

  console.log("RELATED CONTENT:", relatedContent)
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 lg:grid-cols-4 xl:grid-cols-5">
            {relatedContent.map((content) => (
              <div
                key={content.id}
                className="cursor-pointer basis-[350px] max-w-[350px]"
                onClick={() => {
                  handleRelatedClick(content.id)
                  setMovieid(content.id)
                  // Now switch to new content
                  setActualVideoUrl(content.video_url);
                  setMovies([content]);
                  setVideoEnded(false);
                  setPlaylists([])
                  dispatch(openScreenPlayer({
                    selectedVideo: content,
                  }))
                }}



              >
                <div className="relative aspect-square rounded-lg overflow-hidden bg-white/5 h-[50%] w-full">
                  <img
                    src={getOptimizedImageUrl(content.poster_url, 400)}
                    alt={content?.content_title || content.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="text-white text-sm font-semibold">
                        {content?.content_title || content.title}
                      </div>
                      {content.year && (
                        <div className="text-white/60 text-xs">{content.year}</div>
                      )}
                    </div>
                  </div>
                </div>
                <div
                  className="h-[0.175rem] bg-red-900"
                  style={{ width: `${content?.watch_percentage}%` }}
                ></div>
                <div className="text-white font-medium truncate">
                  {content?.content_title || content.title}
                </div>
                <div className="flex items-center gap-2 text-sm text-white/60 mt-1">
                  {content?.year && <span>{content?.year}</span>}
                  {content?.genre && (
                    <>
                      <span>•</span>
                      <span>{content?.genre}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
  )
}

export default RelatedContent