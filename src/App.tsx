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
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

// Load these immediately - users see them first
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Navbar from "./components/Navbar";
import LoginModal from "./components/auth/LoginModal";
import SearchModal from "@/components/SearchModal";

// Lazy load everything else - only downloads when user navigates there
const Movies = lazy(() => import("./pages/Movies"));
const Series = lazy(() => import("./pages/Series"));
const Kids = lazy(() => import("./pages/Kids"));
const MyList = lazy(() => import("./pages/MyList"));
const Settings = lazy(() => import("./pages/Settings"));
const MovieDetail = lazy(() => import("./pages/MovieDetail"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PlayList = lazy(() => import("./pages/PlayList"));
const PlaylistDetail = lazy(() => import("./pages/PlaylistDetail"));

// Admin pages - lazily loaded, most users never need these
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminMovies = lazy(() => import("./pages/admin/AdminMovies"));
const AdminChannels = lazy(() => import("./pages/admin/AdminChannels"));
const AdminAddMovie = lazy(() => import("./pages/admin/AdminAddMovie"));
const AdminEditMovie = lazy(() => import("./pages/admin/AdminEditMovie"));
const AdminAddChannel = lazy(() => import("./pages/admin/AdminAddChannel"));
const AdminEditChannel = lazy(() => import("./pages/admin/AdminEditChannel"));

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
            <Navbar onSearchClick={() => setIsSearchOpen(true)} />
            <Suspense fallback={null}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route
                  path="/movies"
                  element={
                    <RequireAuth>
                      <Movies />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/series"
                  element={
                    <RequireAuth>
                      <Series />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/kids"
                  element={
                    <RequireAuth>
                      <Kids />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/my-list"
                  element={
                    <RequireAuth>
                      <MyList />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <RequireAuth>
                      <Settings />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/movie/:id"
                  element={
                    <RequireAuth>
                      <MovieDetail />
                    </RequireAuth>
                  }
                />
                <Route path="/admin" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/movies" element={<AdminMovies />} />
                <Route path="/admin/channels" element={<AdminChannels />} />
                <Route path="/admin/add-movie" element={<AdminAddMovie />} />
                <Route
                  path="/admin/add-channel"
                  element={<AdminAddChannel />}
                />
                <Route
                  path="/admin/edit-movie/:id"
                  element={<AdminEditMovie />}
                />
                <Route
                  path="/admin/edit-channel/:id"
                  element={<AdminEditChannel />}
                />
                <Route path="/playlists" element={<PlayList />} />
                <Route path="/playlists/:id" element={<PlaylistDetail />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
