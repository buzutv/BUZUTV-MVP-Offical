import React from "react";

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
    console.log("🎭 [FilterBar] Genre button clicked:", {
      clickedGenre: genre,
      previousGenre: activeGenre,
      normalizedClicked: genre.toLowerCase(),
      normalizedPrevious: activeGenre.toLowerCase(),
    });
    onGenreChange(genre.toLowerCase());
  };

  const isKidsVariant = variant === "kids";
  const activeButtonClass = isKidsVariant
    ? "bg-blue-500 text-white shadow-[2px_19px_31px_rgba(59,130,246,0.35)] hover:bg-blue-600"
    : "bg-brand-500 text-white shadow-[2px_19px_31px_rgba(30,27,95,0.35)] hover:bg-brand-600";
  const hoverButtonClass = isKidsVariant
    ? "text-white hover:text-white hover:bg-blue-500/20"
    : "text-white hover:text-white hover:bg-brand-500/20";

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Genre Filters */}
      <div className="flex justify-center">
        {/* Desktop: Horizontal scroll container */}
        <div className="hidden sm:block">
          <div className="bg-black/20 backdrop-blur-sm rounded-full p-1 inline-flex gap-2">
            {availableGenres.map((genre) => (
              <button
                key={genre}
                onClick={() => handleGenreClick(genre)}
                className={`
                px-4 py-1.5 rounded-full text-sm font-medium leading-5 transition-all duration-300 hover:scale-105 will-change-transform transform-gpu
                ${
                  activeGenre.toLowerCase() === genre.toLowerCase()
                    ? activeButtonClass
                    : hoverButtonClass
                }
              `}
                style={
                  activeGenre.toLowerCase() === genre.toLowerCase()
                    ? {
                        backgroundImage: `
                    radial-gradient(93% 87% at 87% 89%, rgba(0, 0, 0, 0.23) 0%, transparent 86.18%),
                    radial-gradient(66% 87% at 26% 20%, rgba(255, 255, 255, 0.41) 0%, rgba(255, 255, 255, 0) 70%)
                  `,
                      }
                    : {}
                }
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile: Scrollable horizontal container */}
        <div className="block sm:hidden w-full">
          <div className="bg-black/20 backdrop-blur-sm rounded-full p-1 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 min-w-max px-2">
              {availableGenres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => handleGenreClick(genre)}
                  className={`
                  px-3 py-1.5 rounded-full text-xs font-medium leading-5 transition-all duration-300 whitespace-nowrap flex-shrink-0
                  ${
                    activeGenre.toLowerCase() === genre.toLowerCase()
                      ? activeButtonClass
                      : hoverButtonClass
                  }
                `}
                  style={
                    activeGenre.toLowerCase() === genre.toLowerCase()
                      ? {
                          backgroundImage: `
                      radial-gradient(93% 87% at 87% 89%, rgba(0, 0, 0, 0.23) 0%, transparent 86.18%),
                      radial-gradient(66% 87% at 26% 20%, rgba(255, 255, 255, 0.41) 0%, rgba(255, 255, 255, 0) 70%)
                    `,
                        }
                      : {}
                  }
                >
                  {genre}
                </button>
              ))}
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
