import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const PlaylistDialog = ({ playlist, items }) => {
  return (
    <Dialog open={true}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{playlist.title}</DialogTitle>
        </DialogHeader>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {items.map((movie) => (
            <Card 
              key={movie.id} 
              className="overflow-hidden rounded-xl shadow border hover:shadow-md transition"
            >
              {/* Thumbnail */}
              <img 
                src={movie.poster_url}
                alt={movie.title}
                className="w-full h-48 object-cover"
              />

              <CardHeader className="pt-4">
                <CardTitle className="text-base">{movie.title}</CardTitle>

                <CardDescription className="text-xs text-muted-foreground">
                  {movie.year ? `${movie.year}` : "Unknown year"} • {movie.type}
                </CardDescription>

                {movie.type === "series" && (
                  <CardDescription className="text-xs text-muted-foreground mt-1">
                    {movie.seasons} season(s) • {movie.episodes} episodes
                  </CardDescription>
                )}
              </CardHeader>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlaylistDialog;
