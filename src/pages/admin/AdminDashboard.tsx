
import AdminLayout from "@/components/admin/AdminLayout";
import { useMockContent } from "@/hooks/useMockContent";
import { genres } from "@/data/mockMovies";
import { Film, Tv, Users, TrendingUp, PlayCircle, Calendar } from "lucide-react";
import BulkImportUpload from "@/components/admin/BulkImportUpload";

const AdminDashboard = () => {
  const { movies: mockMovies, channels, isLoading } = useMockContent();

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  const totalMovies = mockMovies.filter(item => item.type === 'movie').length;
  const totalSeries = mockMovies.filter(item => item.type === 'series').length;
  const totalChannels = channels.length;
  const trendingCount = mockMovies.filter(movie => movie.isTrending).length;
  const totalContent = mockMovies.length;
  const avgRating = totalContent > 0 ? (mockMovies.reduce((sum, movie) => sum + movie.rating, 0) / mockMovies.length).toFixed(1) : '0.0';

  const stats = [
    {
      title: "Total Movies",
      value: totalMovies,
      icon: Film,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      title: "Total Series",
      value: totalSeries,
      icon: Tv,
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    {
      title: "Total Channels",
      value: totalChannels,
      icon: PlayCircle,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    {
      title: "Total Content",
      value: totalContent,
      icon: Users,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    },
    {
      title: "Trending Content",
      value: trendingCount,
      icon: TrendingUp,
      color: "text-red-500",
      bgColor: "bg-red-500/10"
    },
    {
      title: "Average Rating",
      value: avgRating,
      icon: Calendar,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10"
    }
  ];

  const genreStats = genres.slice(1).map(genre => ({
    genre,
    count: mockMovies.filter(movie => movie.genre === genre).length
  }));

  const contentTypeStats = [
    { type: "Movies", count: totalMovies, color: "bg-blue-500" },
    { type: "Series", count: totalSeries, color: "bg-green-500" }
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Dashboard Overview</h2>
            <p className="text-gray-400">Welcome to BuzuTV Admin Panel</p>
          </div>
          <BulkImportUpload />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.title} className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">{stat.title}</p>
                    <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Content Type Distribution */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Content Type Distribution</h3>
          {totalContent > 0 ? (
            <div className="space-y-3">
              {contentTypeStats.map((stat) => (
                <div key={stat.type} className="flex items-center justify-between">
                  <span className="text-gray-300">{stat.type}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-700 rounded-full h-2">
                      <div
                        className={`${stat.color} h-2 rounded-full`}
                        style={{
                          width: `${(stat.count / totalContent) * 100}%`
                        }}
                      />
                    </div>
                    <span className="text-white font-medium w-8 text-right">{stat.count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No content available</p>
          )}
        </div>

        {/* Genre Distribution */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Content by Genre</h3>
          {totalContent > 0 ? (
            <div className="space-y-3">
              {genreStats.map((stat) => (
                <div key={stat.genre} className="flex items-center justify-between">
                  <span className="text-gray-300">{stat.genre}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${totalContent > 0 ? (stat.count / totalContent) * 100 : 0}%`
                        }}
                      />
                    </div>
                    <span className="text-white font-medium w-8 text-right">{stat.count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No content available</p>
          )}
        </div>

        {/* Channel Overview */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Channel Overview</h3>
          {channels.length > 0 ? (
            <div className="space-y-3">
              {channels.slice(0, 6).map((channel) => (
                <div key={channel.id} className="flex items-center space-x-4 p-3 bg-gray-700 rounded-lg">
                  <img
                    src={channel.logoUrl}
                    alt={channel.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="text-white font-medium">{channel.name}</h4>
                    <p className="text-gray-400 text-sm">{channel.description.slice(0, 50)}...</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">{Math.floor(Math.random() * 20) + 5}</p>
                    <p className="text-gray-400 text-sm">Content</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No channels available</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
