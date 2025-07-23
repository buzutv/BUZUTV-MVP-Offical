import React, { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import MovieCard from "@/components/MovieCard";
import SeriesCard from "@/components/SeriesCard";
import MovieHoverRow from "@/components/MovieHoverRow";
import MoreLikeThisCard from "./MoreLikeThisCard";

interface HomeRowProps {
  title: string;
  items: any[]; // mixed array
  onCardClick?: () => boolean;
  isMoreLikeThis?: boolean;
}

const HomeRow = ({ title, items, onCardClick, isMoreLikeThis = false }: HomeRowProps) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -320, behavior: "smooth" });
        }
    };
    const scrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 320, behavior: "smooth" });
        }
    };

    if (items.length === 0) return null;

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

                {/* Scrollable Content */}
                <div
                    ref={scrollContainerRef}
                    className="flex space-x-2 overflow-x-auto px-4 scrollbar-hide"
                    style={{
                        scrollbarWidth: 'none', // Firefox
                        msOverflowStyle: 'none', // IE and Edge
                        overflowY: 'hidden',
                    }}
                >
                    <MovieHoverRow className="flex space-x-2">
                        {items.map((item) => (
                            <div key={item.id} className="flex-shrink-0 w-64">
                                {isMoreLikeThis ? (
                                    <MoreLikeThisCard item={item} />
                                ) : item.type === "series" ? (
                                    <SeriesCard series={item} onOpen={onCardClick} />
                                ) : (
                                    <MovieCard movie={item} onOpen={onCardClick} />
                                )}
                            </div>
                        ))}
                    </MovieHoverRow>
                </div>
            </div>
        </section>
    );
};

export default HomeRow;