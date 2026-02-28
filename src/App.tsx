import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
// Load these immediately - users see them first
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
import EditorialMovies from "./pages/admin/EditorialMovies";
import EditorialEditMovie from "./pages/admin/EditorialEditMovie";
import NotFound from "./pages/NotFound";
import LoginModal from "./components/auth/LoginModal";
import { useAuth } from "@/contexts/AuthContext";
import SearchModal from "@/components/SearchModal";
import { useAppContent } from "@/hooks/useAppContent";
import { useState } from "react";
import Navbar from "./components/Navbar";
import FullscreenPlayer from "./components/FullscreenPlayer";
import PlayList from "./pages/PlayList";
import PlaylistDetail from "./pages/PlaylistDetail";
import Privacy from "./pages/Privacy";

const queryClient = new QueryClient();

// RequireAuth wrapper
function RequireAuth({ children }: { children: JSX.Element }) {
  const { isLoggedIn, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return null;
  if (!isLoggedIn)
    return <Navigate to="/" state={{ from: location }} replace />;
  return children;
}

// RequireAdmin wrapper
function RequireAdmin({ children }: { children: JSX.Element }) {
  const { isLoggedIn, user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return null;
  if (!isLoggedIn || !user?.isAdmin)
    return <Navigate to="/" state={{ from: location }} replace />;
  return children;
}

const App = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <LoginModal />
            <SearchModal
              isOpen={isSearchOpen}
              onClose={() => setIsSearchOpen(false)}
            />
            <Navbar
              onSearchClick={() => setIsSearchOpen(true)}
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
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/movies" element={<AdminMovies />} />
              <Route path="/admin/channels" element={<AdminChannels />} />
              <Route path="/admin/add-movie" element={<AdminAddMovie />} />
              <Route path="/admin/add-channel" element={<AdminAddChannel />} />
              <Route path="/admin/edit-movie/:id" element={<AdminEditMovie />} />
              <Route path="/admin/edit-channel/:id" element={<AdminEditChannel />} />
              <Route path="/admin/editorial" element={<EditorialMovies />} />
              <Route path="/admin/editorial/edit/:id" element={<EditorialEditMovie />} />
              <Route path="*" element={<NotFound />} />
              {/* <Route path="/test" element={<FullscreenPlayer isOpen={true} onClose={() => { }} videoUrl="https://youtu.be/6y9wgK-26Qg?si=yQ_FNCUzAQB6oiPq" title="Test Video" userId="03fa9a91-4281-4bd4-9e60-4da2ba72b0f3" />} /> */}
              <Route path="/playlists" element={<PlayList />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/playlists/:id" element={<PlaylistDetail />} />
              {/* <Route path="/newadmin" element={<AdminLogin />} /> */}

            </Routes>

          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
