import React from 'react';

interface FilterBarProps {
  activeGenre: string;
  onGenreChange: (genre: string) => void;
  availableGenres: string[];
}

const FilterBar: React.FC<FilterBarProps> = ({
  activeGenre,
  onGenreChange,
  availableGenres
}) => {
  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-6">
      {/* Genre Filters */}
      <div className="flex justify-center">
        <div className="bg-black/20 backdrop-blur-sm rounded-full p-1 inline-flex">
          {availableGenres.map((genre) => (
          <button
            key={genre}
            onClick={() => onGenreChange(genre.toLowerCase())}
            className={`
              px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200
              ${activeGenre.toLowerCase() === genre.toLowerCase() 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-300 hover:text-white hover:bg-purple-600/20'
              }
            `}
          >
            {genre}
          </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;