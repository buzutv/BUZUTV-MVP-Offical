import { EllipsisVertical, UserCheck, UserPlus } from "lucide-react";
import { Channel } from "@/data/mockMovies";
import React from "react";
import { useUserChannelFavorites } from "@/hooks/useUserChannelFavorites";
import { Button } from "./ui/button";
import { getOptimizedImageUrl } from '../utils/youtubeUtils';
interface ChannelCardProps {
  channel: Channel;
}

const ChannelCard = ({ channel }: ChannelCardProps) => {
  const {
    favoriteChannelIds,
    addChannelToFavorites,
    removeChannelFromFavorites,
  } = useUserChannelFavorites();

  const isFavorite = favoriteChannelIds.includes(channel.id);


  console.log("Rendering ChannelCard for:", channel.name, "Is Favorite:", isFavorite);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isFavorite
      ? removeChannelFromFavorites(channel.id)
      : addChannelToFavorites(channel.id);
  };

  return (
    <div className="group w-full max-w-[420px] h-[260px] cursor-pointer">
      <div className="relative h-full w-full overflow-hidden rounded-xl">

        {/* Background image */}
        <div
          style={{ backgroundImage: `url(${channel.logoUrl})` }}
          className="absolute inset-0 h-full w-full bg-cover bg-center rounded-xl transition-transform duration-500 ease-in-out group-hover:scale-110"
        />

        {/* Top-right ellipsis button */}
        {/* <Button
          size="icon"
          variant="ghost"
          className="absolute top-3 right-3 z-20 h-8 w-8 text-white bg-black/40 hover:bg-black/60 rounded-full"
          onClick={(e) => {
            e.stopPropagation();
            console.log("Menu clicked");
          }}
        >
          <EllipsisVertical size={18} />
        </Button> */}

        {/* Gradient overlay */}
        <div className="absolute inset-0 z-0 rounded-xl pointer-events-none">
          <div className="absolute bottom-[-2px] left-0 right-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative flex h-full w-full flex-col justify-between p-4 text-white">
          <div></div>

          <div>
            {/* Bottom always-visible row */}
            <div className="flex items-center gap-3 transition-opacity duration-300 group-hover:opacity-0">
              <img
                src={getOptimizedImageUrl(channel.logoUrl, 400)}
                alt={`${channel.name} logo`}
                className="h-10 w-10 flex-shrink-0 rounded-lg border-2 border-white/20 bg-black/50 object-contain p-1 shadow-md"
              />
              <h3 className="font-bold">{channel.name}</h3>
            </div>

            {/* Hover Details */}
            <div className="absolute bottom-0 left-0 w-full transform p-4 transition-all duration-300 ease-in-out translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
              <h3 className="mb-2 text-lg font-bold">{channel.name}</h3>

              <p className="mb-3 text-sm text-white/80 line-clamp-2">
                {channel.description}
              </p>

              <button
                onClick={handleToggleFavorite}
                className={`flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold shadow-md transition-all duration-200 ${isFavorite
                  ? "bg-green-600 text-white hover:bg-green-500"
                  : "bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
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
