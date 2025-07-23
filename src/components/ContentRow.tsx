import React, { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Movie } from "@/data/mockMovies";
import MovieCard from "@/components/MovieCard";
import MovieHoverRow from "@/components/MovieHoverRow";

interface ContentRowProps {
  title: string;
  movies: Movie[];
}

const ContentRow = React.memo(({ title, movies }: ContentRowProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -320,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 320,
        behavior: 'smooth'
      });
    }
  };

  if (movies.length === 0) return null;

  return (
      <section className="mb-12">
        <div className="px-4 mb-4">
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>

        <div className="relative">
          {/* Left Arrow */}
          <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-all duration-200 backdrop-blur-sm"
              style={{ marginLeft: '-10px' }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Right Arrow */}
          <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-all duration-200 backdrop-blur-sm"
              style={{ marginRight: '-22px' }}
          >
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* Scrollable Movie Row */}
          <div
              ref={scrollContainerRef}
              className="flex space-x-2 overflow-x-auto scrollbar-hide px-4"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', overflowY: 'hidden' }}
          >
            <MovieHoverRow className="flex space-x-2">
              {movies.map((movie) => (
                  <div key={movie.id} className="flex-shrink-0 w-64">
                    <MovieCard movie={movie} />
                  </div>
              ))}
            </MovieHoverRow>
          </div>
        </div>
      </section>
  );
});

ContentRow.displayName = "ContentRow";

export default ContentRow;
