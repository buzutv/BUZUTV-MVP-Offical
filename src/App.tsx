
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Movies from "./pages/Movies";
import Series from "./pages/Series";
import Kids from "./pages/Kids";
import MyList from "./pages/MyList";
import Settings from "./pages/Settings";
import MovieDetail from "./pages/MovieDetail";
import ResetPassword from "./pages/ResetPassword";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminMovies from "./pages/admin/AdminMovies";
import AdminChannels from "./pages/admin/AdminChannels";
import AdminAddMovie from "./pages/admin/AdminAddMovie";
import AdminEditMovie from "./pages/admin/AdminEditMovie";
import AdminAddChannel from "./pages/admin/AdminAddChannel";
import AdminEditChannel from "./pages/admin/AdminEditChannel";
import NotFound from "./pages/NotFound";
import LoginModal from "./components/auth/LoginModal";
import { useAuth } from "@/contexts/AuthContext";
import SearchOverlay from "@/components/SearchOverlay";
import { useAppContent } from "@/hooks/useAppContent";
import { useState } from "react";
import Navbar from "./components/Navbar";

const queryClient = new QueryClient();

// RequireAuth wrapper
function RequireAuth({ children }: { children: JSX.Element }) {
  const { isLoggedIn, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return null;
  if (!isLoggedIn) return <Navigate to="/" state={{ from: location }} replace />;
  return children;
}

// RequireAdmin wrapper
function RequireAdmin({ children }: { children: JSX.Element }) {
  const { isLoggedIn, user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return null;
  if (!isLoggedIn || !user?.isAdmin) return <Navigate to="/" state={{ from: location }} replace />;
  return children;
}

// Route change monitor component
const RouteChangeMonitor = () => {
  const location = useLocation();
  
  useEffect(() => {
    const start = performance.now();
    
    // Monitor when the route change completes
    const timer = setTimeout(() => {
      // Navigation completed
    }, 0);
    
    return () => clearTimeout(timer);
  }, [location]);
  
  return null;
};

const App = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { content, channels, isLoading } = useAppContent();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  const handleClearSearch = () => {
    setSearchQuery("");
  };
  const showSearchOverlay = searchQuery.trim().length > 0;
  const lowerQuery = searchQuery.trim().toLowerCase();
  const movieResults = lowerQuery
    ? content.movies.all.filter(
        (item) =>
          item.title.toLowerCase().includes(lowerQuery) ||
          (item.genre && item.genre.toLowerCase().includes(lowerQuery))
      )
    : [];
  const seriesResults = lowerQuery
    ? content.series.all.filter(
        (item) =>
          item.title.toLowerCase().includes(lowerQuery) ||
          (item.genre && item.genre.toLowerCase().includes(lowerQuery))
      )
    : [];
  const channelResults = lowerQuery
    ? channels.filter(
        (ch) =>
          ch.name.toLowerCase().includes(lowerQuery) ||
          (ch.description && ch.description.toLowerCase().includes(lowerQuery))
      )
    : [];

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <RouteChangeMonitor />
            <LoginModal />
            {/* Global Search Overlay */}
            {showSearchOverlay && (
              <SearchOverlay
                isOpen={true}
                onClose={handleClearSearch}
                searchQuery={searchQuery}
                movieResults={movieResults}
                seriesResults={seriesResults}
                channelResults={channelResults}
              />
            )}
            <Navbar
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              onSearchClear={handleClearSearch}
            />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/movies" element={<RequireAuth><Movies /></RequireAuth>} />
              <Route path="/series" element={<RequireAuth><Series /></RequireAuth>} />
              <Route path="/kids" element={<RequireAuth><Kids /></RequireAuth>} />
              <Route path="/my-list" element={<RequireAuth><MyList /></RequireAuth>} />
              <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
              <Route path="/movie/:id" element={<RequireAuth><MovieDetail /></RequireAuth>} />
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
              <Route path="/admin/movies" element={<RequireAdmin><AdminMovies /></RequireAdmin>} />
              <Route path="/admin/channels" element={<RequireAdmin><AdminChannels /></RequireAdmin>} />
              <Route path="/admin/add-movie" element={<RequireAdmin><AdminAddMovie /></RequireAdmin>} />
              <Route path="/admin/add-channel" element={<RequireAdmin><AdminAddChannel /></RequireAdmin>} />
              <Route path="/admin/edit-movie/:id" element={<RequireAdmin><AdminEditMovie /></RequireAdmin>} />
              <Route path="/admin/edit-channel/:id" element={<RequireAdmin><AdminEditChannel /></RequireAdmin>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
