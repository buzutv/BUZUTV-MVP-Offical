import React from "react";
import BrandButton from "./ui/BrandButton";

interface FilterBarProps {
  activeGenre: string;
  onGenreChange: (genre: string) => void;
  availableGenres: string[];
  variant?: "default" | "kids";
}

const FilterBar: React.FC<FilterBarProps> = ({
  activeGenre,
  onGenreChange,
  availableGenres,
  variant = "default",
}) => {
  const handleGenreClick = (genre: string) => {
    onGenreChange(genre.toLowerCase());
  };

  const isKidsVariant = variant === "kids";

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Genre Filters */}
      <div className="flex justify-center">
        {/* Desktop: Horizontal scroll container */}
        <div className="hidden sm:block">
          <div className="bg-black/20 backdrop-blur-sm rounded-full p-1 inline-flex gap-2">
            {availableGenres.map((genre) => {
              const isActive =
                activeGenre.toLowerCase() === genre.toLowerCase();
              return (
                <BrandButton
                  key={genre}
                  onClick={() => handleGenreClick(genre)}
                  variant={
                    isActive ? (isKidsVariant ? "kids" : "primary") : "ghost"
                  }
                  size="sm"
                  className="text-sm"
                >
                  {genre}
                </BrandButton>
              );
            })}
          </div>
        </div>

        {/* Mobile: Scrollable horizontal container */}
        <div className="block sm:hidden w-full">
          <div className="bg-black/20 backdrop-blur-sm rounded-full p-1 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 min-w-max px-2">
              {availableGenres.map((genre) => {
                const isActive =
                  activeGenre.toLowerCase() === genre.toLowerCase();
                return (
                  <BrandButton
                    key={genre}
                    onClick={() => handleGenreClick(genre)}
                    variant={
                      isActive ? (isKidsVariant ? "kids" : "primary") : "ghost"
                    }
                    size="sm"
                    className="text-xs whitespace-nowrap"
                  >
                    {genre}
                  </BrandButton>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile scrollbar hide styles */}
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default FilterBar;
