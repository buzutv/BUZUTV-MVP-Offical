import { UserCheck, UserPlus } from "lucide-react";
import { Channel } from "@/data/mockMovies";
import React from "react";
import { useUserChannelFavorites } from "@/hooks/useUserChannelFavorites";

interface ChannelCardProps {
  channel: Channel;
}

const ChannelCard = ({ channel }: ChannelCardProps) => {
  const {
    favoriteChannelIds,
    addChannelToFavorites,
    removeChannelFromFavorites,
  } = useUserChannelFavorites();

  // Check if channel is in favorites
  const isFavorite = favoriteChannelIds.includes(channel.id);

  // Handle toggle favorite
  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isFavorite) {
      removeChannelFromFavorites(channel.id);
    } else {
      addChannelToFavorites(channel.id);
    }
  };

  return (
    <div className="group aspect-video w-full cursor-pointer">
      <div className="relative h-full w-full overflow-hidden rounded-xl">
        {/* 1. Cinematic background image with a parallax zoom effect on hover */}
        <div
          style={{ backgroundImage: `url(${channel.logoUrl})` }}
          className="absolute inset-0 h-full w-full bg-cover bg-center transition-transform duration-500 ease-in-out group-hover:scale-110"
        />

        {/* 2. Static gradient overlay to ensure text is always readable */}
        <div className="absolute inset-0 z-0 rounded-xl pointer-events-none">
          <div className="absolute bottom-[-2px] left-0 right-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>

        {/* 3. Content container */}
        <div className="relative flex h-full w-full flex-col justify-between p-4 text-white">
          {/* This top section is empty, content is at the bottom */}
          <div></div>

          {/* Bottom section with always-visible content and the hover overlay */}
          <div>
            {/* Always-visible channel name and small logo */}
            <div className="flex items-center gap-3 transition-opacity duration-300 group-hover:opacity-0">
              <img
                src={channel.logoUrl}
                alt={`${channel.name} logo`}
                className="h-10 w-10 flex-shrink-0 rounded-lg border-2 border-white/20 bg-black/50 object-contain p-1 shadow-md"
              />
              <div>
                <h3 className="font-bold">{channel.name}</h3>
              </div>
            </div>

            {/* 4. Sliding overlay that appears on hover */}
            <div className="absolute bottom-0 left-0 w-full transform p-4 transition-all duration-300 ease-in-out translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
              <h3 className="mb-2 text-lg font-bold">{channel.name}</h3>
              <p className="mb-3 text-sm text-white/80 line-clamp-2">
                {channel.description}
              </p>

              {/* Add to favorites button */}
              <button
                onClick={handleToggleFavorite}
                className={`flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black ${
                  isFavorite
                    ? "bg-green-600 text-white hover:bg-green-500 focus:ring-green-500"
                    : "bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 focus:ring-white"
                }`}
              >
                {isFavorite ? <UserCheck size={16} /> : <UserPlus size={16} />}
                {isFavorite ? "Added" : "Add to Favorites"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChannelCard;
