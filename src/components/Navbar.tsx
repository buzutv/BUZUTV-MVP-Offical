import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Search, User, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Restore NavbarProps interface
interface NavbarProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchClear: () => void;
}

// Restore Navbar to accept props
const Navbar = ({
  searchQuery,
  onSearchChange,
  onSearchClear,
}: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { isLoggedIn, user, logout, setShowLoginModal } = useAuth();
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate("/auth");
  };

  const handleSignUpClick = () => {
    navigate("/auth?mode=signup");
  };

  const handleLogout = () => {
    logout();
  };

  // New: Intercept nav for unauth users
  const handleNavClick = (e: React.MouseEvent, path: string) => {
    if (!isLoggedIn && path !== "/") {
      e.preventDefault();
      setShowLoginModal(true);
      setIsMenuOpen(false);
      return;
    }
    setIsMenuOpen(false);
    navigate(path);
  };

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Collapse search if input loses focus and query is empty
  const handleSearchBlur = () => {
    if (!searchQuery) {
      setIsSearchOpen(false);
    }
  };

  // Collapse on Escape if query is empty
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape" && !searchQuery) {
      setIsSearchOpen(false);
    }
  };

  return (
    <nav className="fixed top-6 left-0 right-0 z-50 flex items-center h-14 transition-all duration-500">
      <div className="max-w-full px-6 w-full flex items-center justify-between h-14 relative">
        {/* Logo */}
        <div className="flex-shrink-0">
          <Link to="/" className="flex items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 bg-clip-text text-transparent">
              BUZUTV
            </h1>
          </Link>
        </div>

        {/* Center Navigation Bar with blurred background */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="flex items-center bg-black/20 backdrop-blur-md rounded-full px-2 py-2 border border-white/10">
            {/* Navigation Links */}
            <Link
              to="/"
              className="group text-white px-4 py-2 rounded-full text-base font-medium leading-none align-middle transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:bg-purple-600 hover:shadow-[0_4px_10px_rgba(128,0,255,0.6)] will-change-transform"
              onClick={(e) => handleNavClick(e, "/")}
            >
              Home
            </Link>
            <Link
              to="/movies"
              className="group text-white px-4 py-2 rounded-full text-base font-medium leading-none align-middle transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:bg-purple-600 hover:shadow-[0_4px_10px_rgba(128,0,255,0.6)] will-change-transform"
              onClick={(e) => handleNavClick(e, "/movies")}
            >
              Movies
            </Link>

            <Link
              to="/series"
              className="group text-white px-4 py-2 rounded-full text-base font-medium leading-none align-middle transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:bg-purple-600 hover:shadow-[0_4px_10px_rgba(128,0,255,0.6)] will-change-transform"
              onClick={(e) => handleNavClick(e, "/series")}
            >
              TV Shows
            </Link>
            <Link
              to="/my-list"
              className="group text-white px-4 py-2 rounded-full text-base font-medium leading-none align-middle transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:bg-purple-600 hover:shadow-[0_4px_10px_rgba(128,0,255,0.6)] will-change-transform"
              onClick={(e) => handleNavClick(e, "/my-list")}
            >
              Favorites
            </Link>
          </div>
        </div>

        {/* Right Side - User */}
        <div className="flex items-center gap-4 ">
          {/* Search */}
          <div className="relative bg-black/20 backdrop-blur-md rounded-full px-2 py-1 border border-white/10">
            {isSearchOpen || searchQuery ? (
              <div className="flex items-center px-3 py-1 rounded-full transition-all">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={onSearchChange}
                  onBlur={handleSearchBlur}
                  onKeyDown={handleSearchKeyDown}
                  className="bg-transparent text-white placeholder-gray-300 w-32 focus:outline-none"
                />
                <Search className="text-gray-300 w-4 h-4 ml-2" />
              </div>
            ) : (
              <button
                className="flex items-center px-3 py-2 rounded-full transition-all"
                onClick={() => {
                  if (!isLoggedIn) {
                    setShowLoginModal(true);
                    return;
                  }
                  setIsSearchOpen(true);
                }}
                aria-label="Open search"
              >
                <Search className="text-white w-4 h-4" />
              </button>
            )}
          </div>

          {/* User Authentication */}
          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center text-white hover:text-gray-300 transition-colors  bg-black/20 backdrop-blur-md rounded-full px-2 py-2 border border-white/10">
                <User className="w-6 h-6" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-800 border-gray-700 text-white">
                <DropdownMenuItem asChild>
                  <Link
                    to="/settings"
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                {user?.isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link
                      to="/admin/dashboard"
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <span>Admin Panel</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-3">
              <button
                onClick={handleLoginClick}
                className="text-white px-4 py-2.5 rounded-full text-sm font-medium bg-black/20 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-colors"
              >
                Log In
              </button>
              <button
                onClick={handleSignUpClick}
                className="bg-purple-600 text-white px-4 py-2.5 rounded-full text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                Sign Up
              </button>
              <button
                onClick={handleLoginClick}
                className="flex items-center text-white hover:text-gray-300 transition-colors h-10 bg-black/20 backdrop-blur-md rounded-full p-2 border border-white/10"
              >
                <User className="w-6 h-6" />
              </button>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white hover:text-gray-300 transition-colors"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden py-4 space-y-2 border-t border-gray-800 bg-black/20 backdrop-blur-md">
          <Link
            to="/"
            className="block text-white hover:text-gray-300 transition-colors py-2 px-6"
            onClick={(e) => handleNavClick(e, "/")}
          >
            Home
          </Link>
          <Link
            to="/movies"
            className="block text-white hover:text-gray-300 transition-colors py-2 px-6"
            onClick={(e) => handleNavClick(e, "/movies")}
          >
            Movies
          </Link>
          <Link
            to="/series"
            className="block text-white hover:text-gray-300 transition-colors py-2 px-6"
            onClick={(e) => handleNavClick(e, "/series")}
          >
            TV Shows
          </Link>
          <Link
            to="/my-list"
            className="block text-white hover:text-gray-300 transition-colors py-2 px-6"
            onClick={(e) => handleNavClick(e, "/my-list")}
          >
            Favorites
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
