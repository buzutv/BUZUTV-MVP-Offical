import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, Search, User, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import BrandButton from "@/components/ui/BrandButton";

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchClear: () => void;
}

const Navbar = React.memo(({
  searchQuery,
  onSearchChange,
  onSearchClear,
}: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { isLoggedIn, user, logout, setShowLoginModal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActivePath = useCallback((path: string) => {
    if (path === "/" && !hasNavigated) return false;
    return location.pathname === path;
  }, [location.pathname, hasNavigated]);

  const handleLoginClick = useCallback(() => navigate("/auth"), [navigate]);
  const handleSignUpClick = useCallback(() => navigate("/auth?mode=signup"), [navigate]);
  const handleLogout = useCallback(() => logout(), [logout]);

  const handleNavClick = useCallback((e: React.MouseEvent, path: string) => {
    if (!isLoggedIn && path !== "/") {
      e.preventDefault();
      setShowLoginModal(true);
      setIsMenuOpen(false);
      return;
    }
    setHasNavigated(true);
    setIsMenuOpen(false);
    navigate(path);
  }, [isLoggedIn, setShowLoginModal, navigate]);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleSearchBlur = useCallback(() => {
    if (!searchQuery) setIsSearchOpen(false);
  }, [searchQuery]);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape" && !searchQuery) setIsSearchOpen(false);
  }, [searchQuery]);

  const navItems = useMemo(() => [
    { to: "/", label: "Home" },
    { to: "/movies", label: "Movies" },
    { to: "/series", label: "TV Shows" },
    { to: "/kids", label: "Kids" },
    { to: "/my-list", label: "Favorites" },
  ], []);

  const shouldShowNav = useMemo(() => 
    !location.pathname.startsWith("/auth") && location.pathname !== "/settings",
    [location.pathname]
  );

  return (
    <nav
      className={`fixed top-3 left-0 right-0 z-50 px-4 md:px-6 h-14 transition-all duration-500 ${
        shouldShowNav ? "flex" : "hidden"
      } md:flex items-center`}
    >
      <div
        className="max-w-full px-4 md:px-8 w-full flex items-center justify-between h-14 relative bg-black/20 backdrop-blur-lg border border-white/10"
        style={{
          borderRadius: isMenuOpen ? "30px 30px 0 0" : "30px",
          borderBottom: isMenuOpen ? "none" : "1px solid rgba(255,255,255,0.1)",

          transition:
            "border-radius 300ms ease, border-bottom-color 300ms ease",
        }}
      >
        <div className="flex-shrink-0">
          <Link to="/" className="flex items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 bg-clip-text text-transparent">
              BUZUTV
            </h1>
          </Link>
        </div>

        {isLoggedIn && (
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="hidden md:flex items-center gap-4 whitespace-nowrap">
              {navItems.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`group text-white px-4 py-2 rounded-full text-base font-medium whitespace-nowrap leading-5 align-middle transition-all duration-300 hover:scale-105 will-change-transform transform-gpu ${
                    isActivePath(to)
                      ? `${to === "/kids" ? "bg-blue-500 shadow-[2px_19px_31px_rgba(59,130,246,0.35)] hover:bg-blue-600" : "bg-brand-500 shadow-[2px_19px_31px_rgba(30,27,95,0.35)] hover:bg-brand-600"}`
                      : `${to === "/kids" ? "hover:text-white hover:bg-blue-500/20" : "hover:text-white hover:bg-brand-500/20"}`
                  }`}
                  style={
                    isActivePath(to)
                      ? {
                          backgroundImage: `
                            radial-gradient(93% 87% at 87% 89%, rgba(0, 0, 0, 0.23) 0%, transparent 86.18%),
                            radial-gradient(66% 87% at 26% 20%, rgba(255, 255, 255, 0.41) 0%, rgba(255, 255, 255, 0) 70%)
                          `,
                        }
                      : {}
                  }
                  onClick={(e) => handleNavClick(e, to)}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {isLoggedIn && (
            <div
              className={`relative rounded-full px-2 py-1 ${
                isSearchOpen || searchQuery
                  ? "border border-white/10 bg-black/10"
                  : ""
              }`}
            >
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
                  onClick={() => setIsSearchOpen(true)}
                  aria-label="Open search"
                >
                  <Search className="text-white w-6 h-6" />
                </button>
              )}
            </div>
          )}

          {isLoggedIn ? (
            <>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger className="flex items-center text-white hover:text-gray-300 transition-colors px-2 py-2">
                  <User className="w-6 h-6" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-black/20 backdrop-blur-lg border border-white/10 text-white">
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
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden text-white hover:text-gray-300 transition-colors"
                aria-label="Toggle Menu"
              >
                <div className="relative w-6 h-6">
                  <Menu
                    className={`absolute inset-0 transition-all duration-300 ease-in-out transform ${
                      isMenuOpen
                        ? "opacity-0 scale-90 rotate-45"
                        : "opacity-100 scale-100 rotate-0"
                    }`}
                  />
                  <X
                    className={`absolute inset-0 transition-all duration-300 ease-in-out transform ${
                      isMenuOpen
                        ? "opacity-100 scale-100 rotate-0"
                        : "opacity-0 scale-90 -rotate-45"
                    }`}
                  />
                </div>
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <BrandButton
                variant="no-border"
                size="sm"
                onClick={handleLoginClick}
                className="text-xs sm:text-sm font-medium px-3 sm:px-4"
              >
                Log In
              </BrandButton>
              <BrandButton
                variant="primary"
                size="sm"
                onClick={handleSignUpClick}
                className="text-xs sm:text-sm font-medium px-3 sm:px-4"
              >
                Sign Up
              </BrandButton>
            </div>
          )}
        </div>
      </div>

      <div
        className={`absolute top-14 left-4 right-4 z-40 bg-black/20 backdrop-blur-lg border border-white/10 border-t-transparent rounded-b-[30px] px-6 py-4 space-y-3 md:hidden transition-all duration-300 ease-in-out transform ${
          isMenuOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        {navItems.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className="block text-white text-base font-medium hover:text-brand-400 transition"
            onClick={(e) => handleNavClick(e, to)}
          >
            {label}
          </Link>
        ))}

        {!isLoggedIn && (
          <div className="pt-4 border-t border-white/10 space-y-3">
            <button
              onClick={() => {
                handleLoginClick();
                setIsMenuOpen(false);
              }}
              className="block w-full text-left text-white text-base font-medium hover:text-brand-400 transition"
            >
              Log In
            </button>
            <button
              onClick={() => {
                handleSignUpClick();
                setIsMenuOpen(false);
              }}
              className="block w-full text-left text-white text-base font-medium hover:text-brand-400 transition"
            >
              Sign Up
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}, (prevProps, nextProps) => {
  return prevProps.searchQuery === nextProps.searchQuery;
});

Navbar.displayName = "Navbar";

export default Navbar;
