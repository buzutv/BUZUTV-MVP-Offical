import { openScreenPlayer } from '@/store/screenPlayerSlice'
import React from 'react'
import { useDispatch } from 'react-redux'
import ContentGridItem from './ContentGridItem'

const RelatedContent = ({
  setMovieid,
  setVideoEnded,
  setActualVideoUrl,
  setMovies,
  setPlaylists,
  handleRelatedClick,
  relatedContent = [], // New prop
  isLoading = false // New prop
}) => {
  const dispatch = useDispatch();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="aspect-video w-full rounded-lg bg-white/10 animate-pulse" />
            <div className="h-4 w-3/4 bg-white/10 rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-white/5 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (!relatedContent || relatedContent.length === 0) {
    return <div className="text-white/50 text-center py-8">No related content found</div>;
  }

  // console.log("RELATED CONTENT PROPS:", relatedContent)

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
      {relatedContent.map((content) => (
        <ContentGridItem
          key={content.id}
          item={content}
          showWatchProgress={true}
          onClick={(item) => {
            handleRelatedClick(item.id, item)
            setMovieid(item.id)
            setActualVideoUrl(item.video_url);
            setMovies([item]);
            setVideoEnded(false);
            setPlaylists([])
            dispatch(openScreenPlayer({
              selectedVideo: item,
            }))
          }}
        />
      ))}
    </div>
  )
}

export default RelatedContent