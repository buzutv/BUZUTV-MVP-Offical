Content;
import React, { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Channel } from "@/data/mockMovies";
import ChannelCard from "@/components/ChannelCard";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

interface ChannelRowProps {
  channels: Channel[];
  onChannelClick: (channel: any) => void;
  subscriptionIds: string[];
  onSubscribe: (channelId: string) => void;
}

const ChannelRow = React.memo(
  ({
    channels,
    onChannelClick,
    subscriptionIds,
    onSubscribe,
  }: ChannelRowProps) => {
    const carouselRef = useRef<CarouselApi>();

    const scrollPrev = () => {
      carouselRef.current?.scrollPrev();
    };

    const scrollNext = () => {
      carouselRef.current?.scrollNext();
    };

    if (channels.length === 0) return null;

    return (
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4 px-4">
          <h2 className="text-2xl font-bold">Top Channels</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={scrollPrev}
              className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={scrollNext}
              className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <Carousel
          setApi={(api) => {
            carouselRef.current = api;
          }}
          opts={{
            align: "start",
            skipSnaps: false,
          }}
          className="w-full px-4"
        >
          <CarouselContent className="-ml-1">
            {channels.map((channel) => (
              <CarouselItem key={channel.id} className="pl-1 basis-auto">
                <div className="w-48">
                  <div onClick={() => onChannelClick(channel)}>
                    <ChannelCard
                      channel={channel}
                      isSubscribed={subscriptionIds.includes(channel.id)}
                      onSubscribe={onSubscribe}
                    />
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </section>
    );
  },
);

ChannelRow.displayName = "ChannelRow";

export default ChannelRow;
