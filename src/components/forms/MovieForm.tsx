import React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";
import { genres } from "@/data/mockMovies";
import ChannelSearchSelect from "./ChannelSearchSelect";
import ImageUpload from "./ImageUpload";

const episodeSchema = z.object({
  title: z.string().min(1, "Episode title is required"),
  description: z.string().optional(),
  episodeNumber: z.number().min(1),
  videoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  posterUrl: z.string().optional(),
  durationMinutes: z.string().optional(),
  airDate: z.string().optional(),
  rating: z.string().optional(),
  completionThresholdSeconds: z.coerce.number().optional(),
});

const seasonSchema = z.object({
  seasonNumber: z.number().min(1),
  episodes: z.array(episodeSchema),
});

const movieSchema = z.object({
  isKids: z.boolean().default(false),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["movie", "series"]),
  genre: z.string().optional(),
  year: z.string().optional(),
  rating: z.string().optional(),
  posterUrl: z.string().optional(),
  backdropUrl: z.string().optional(),
  videoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  durationMinutes: z.string().optional(),
  seasons: z.array(seasonSchema).optional(),
  isFeatured: z.boolean().default(false),
  isTrending: z.boolean().default(false),
  channelId: z.string().optional(),
  completionThresholdSeconds: z.coerce.number().optional(),
});

type MovieFormData = z.infer<typeof movieSchema>;

interface MovieFormProps {
  onSubmit: (data: any) => void;
  initialData?: Partial<MovieFormData>;
  isLoading?: boolean;
  submitLabel?: string;
}

const MovieForm: React.FC<MovieFormProps> = ({
  onSubmit,
  initialData,
  isLoading = false,
  submitLabel = "Save Movie",
}) => {
  // Process initial data to convert threshold back to offset for display
  const processedInitialData = initialData;

  const form = useForm<MovieFormData>({
    resolver: zodResolver(movieSchema),
    defaultValues: {
      isKids: processedInitialData?.isKids ?? false,
      title: processedInitialData?.title || "",
      description: processedInitialData?.description || "",
      type: processedInitialData?.type || "movie",
      genre: processedInitialData?.genre || "",
      year: processedInitialData?.year || "",
      rating: processedInitialData?.rating || "",
      posterUrl: processedInitialData?.posterUrl || "",
      backdropUrl: processedInitialData?.backdropUrl || "",
      videoUrl: processedInitialData?.videoUrl || "",
      durationMinutes: processedInitialData?.durationMinutes || "",
      seasons: processedInitialData?.seasons || [],
      isFeatured: processedInitialData?.isFeatured ?? false,
      isTrending: processedInitialData?.isTrending ?? false,
      channelId: processedInitialData?.channelId || "",
      completionThresholdSeconds:
        processedInitialData?.completionThresholdSeconds || 0,
    },
  });

  const {
    fields: seasonFields,
    append: appendSeason,
    remove: removeSeason,
  } = useFieldArray({
    control: form.control,
    name: "seasons",
  });

  const watchType = form.watch("type");

  //const formWatch = form.watch();
  const addSeason = () => {
    appendSeason({
      seasonNumber: seasonFields.length + 1,
      episodes: [],
    });
  };

  const addEpisode = (seasonIndex: number) => {
    const currentSeason = form.getValues(`seasons.${seasonIndex}`);
    const newEpisode = {
      title: "",
      description: "",
      episodeNumber: (currentSeason?.episodes?.length || 0) + 1,
      videoUrl: "",
      posterUrl: "",
      airDate: "",
      rating: "",
    };

    form.setValue(`seasons.${seasonIndex}.episodes`, [
      ...(currentSeason?.episodes || []),
      newEpisode,
    ]);
  };

  const removeEpisode = (seasonIndex: number, episodeIndex: number) => {
    const currentSeason = form.getValues(`seasons.${seasonIndex}`);
    const updatedEpisodes =
      currentSeason?.episodes?.filter((_, index) => index !== episodeIndex) ||
      [];
    form.setValue(`seasons.${seasonIndex}.episodes`, updatedEpisodes);
  };

  const handleSubmit = (data: MovieFormData) => {
    // Calculate totals for series
    let totalSeasons = 0;
    let totalEpisodes = 0;

    const movieThreshold = data.completionThresholdSeconds;

    const processedSeasons = data.seasons;

    if (data.type === "series" && data.seasons) {
      totalSeasons = data.seasons.length;
      totalEpisodes = data.seasons.reduce(
        (sum, season) => sum + (season.episodes?.length || 0),
        0,
      );
    }

    const transformedData = {
      ...data,
      completionThresholdSeconds: movieThreshold,
      seasons: data.type === "series" ? totalSeasons.toString() : undefined,
      episodes: data.type === "series" ? totalEpisodes.toString() : undefined,
      seasonsData: data.type === "series" ? processedSeasons : undefined,
    };
    onSubmit(transformedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="isKids"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-600 p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-white">Kids Content</FormLabel>
                <div className="text-sm text-gray-400">
                  Mark this content as appropriate for kids
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Title</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Enter title"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Enter description"
                  className="bg-gray-700 border-gray-600 text-white"
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="movie">Movie</SelectItem>
                    <SelectItem value="series">Series</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="genre"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Genre</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {genres
                      .filter((genre) => genre !== "All")
                      .map((genre) => (
                        <SelectItem key={genre} value={genre}>
                          {genre}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Year</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="2024"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Rating</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="8.5"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="posterUrl"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <ImageUpload
                    label="Poster Image"
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="backdropUrl"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <ImageUpload
                    label="Backdrop Image"
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {watchType === "movie" && (
          <FormField
            control={form.control}
            name="videoUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Video URL</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="https://example.com/video.mp4"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {watchType === "movie" && (
          <FormField
            control={form.control}
            name="durationMinutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Duration (minutes)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="120"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {watchType === "movie" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="completionThresholdSeconds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">
                    Completion Offset (seconds before end)
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder="e.g. 10"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </FormControl>
                  <div className="text-xs text-gray-400 mt-1">
                    How many seconds before the end to mark as completed.
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {watchType === "series" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Series Management
              </h3>
              <Button
                type="button"
                onClick={addSeason}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Season
              </Button>
            </div>

            {seasonFields.map((season, seasonIndex) => (
              <div
                key={season.id}
                className="bg-gray-700 rounded-lg p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-medium">
                    Season {seasonIndex + 1}
                  </h4>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => addEpisode(seasonIndex)}
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-gray-300 hover:bg-gray-600"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Episode
                    </Button>
                    <Button
                      type="button"
                      onClick={() => removeSeason(seasonIndex)}
                      variant="outline"
                      size="sm"
                      className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {form
                  .watch(`seasons.${seasonIndex}.episodes`)
                  ?.map((episode, episodeIndex) => (
                    <div
                      key={episodeIndex}
                      className="bg-gray-600 rounded-lg p-4 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h5 className="text-white text-sm font-medium">
                          Episode {episodeIndex + 1}
                        </h5>
                        <Button
                          type="button"
                          onClick={() =>
                            removeEpisode(seasonIndex, episodeIndex)
                          }
                          variant="outline"
                          size="sm"
                          className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`seasons.${seasonIndex}.episodes.${episodeIndex}.title`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white text-sm">
                                Episode Title
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Episode title"
                                  className="bg-gray-500 border-gray-400 text-white"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`seasons.${seasonIndex}.episodes.${episodeIndex}.airDate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white text-sm">
                                Air Date
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="date"
                                  className="bg-gray-500 border-gray-400 text-white"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name={`seasons.${seasonIndex}.episodes.${episodeIndex}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white text-sm">
                              Episode Description
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Episode description"
                                className="bg-gray-500 border-gray-400 text-white"
                                rows={2}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`seasons.${seasonIndex}.episodes.${episodeIndex}.videoUrl`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white text-sm">
                                Video URL
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="https://example.com/episode.mp4"
                                  className="bg-gray-500 border-gray-400 text-white"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`seasons.${seasonIndex}.episodes.${episodeIndex}.posterUrl`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white text-sm">
                                Episode Poster URL
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="https://example.com/episode-poster.jpg"
                                  className="bg-gray-500 border-gray-400 text-white"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name={`seasons.${seasonIndex}.episodes.${episodeIndex}.rating`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white text-sm">
                              Episode Rating
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="8.5"
                                className="bg-gray-500 border-gray-400 text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`seasons.${seasonIndex}.episodes.${episodeIndex}.durationMinutes`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">
                              Duration in Minutes
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Duration in Minutes"
                                className="bg-gray-700 border-gray-600 text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`seasons.${seasonIndex}.episodes.${episodeIndex}.completionThresholdSeconds`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">
                              Completion Offset (seconds before end)
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                placeholder="e.g. 10"
                                className="bg-gray-700 border-gray-600 text-white"
                              />
                            </FormControl>
                            <div className="text-xs text-gray-400 mt-1">
                              Seconds before the end to mark as completed.
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
              </div>
            ))}
          </div>
        )}

        <FormField
          control={form.control}
          name="channelId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Channel</FormLabel>
              <FormControl>
                <ChannelSearchSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Search and select channel..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="isFeatured"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-600 p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-white">Featured</FormLabel>
                  <div className="text-sm text-gray-400">
                    Mark as featured content
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isTrending"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-600 p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-white">Trending</FormLabel>
                  <div className="text-sm text-gray-400">
                    Mark as trending content
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? "Saving..." : submitLabel}
        </Button>
      </form>
    </Form>
  );
};

export default MovieForm;
