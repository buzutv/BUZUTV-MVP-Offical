import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

const Navbar = React.memo(
  ({ searchQuery, onSearchChange, onSearchClear }: NavbarProps) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [hasNavigated, setHasNavigated] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const navRef = useRef<HTMLElement>(null);
    const { isLoggedIn, user, logout, setShowLoginModal } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const isActivePath = useCallback(
      (path: string) => {
        if (path === "/" && !hasNavigated) return false;
        return location.pathname === path;
      },
      [location.pathname, hasNavigated],
    );

    const handleLoginClick = useCallback(() => navigate("/auth"), [navigate]);
    const handleSignUpClick = useCallback(
      () => navigate("/auth?mode=signup"),
      [navigate],
    );
    const handleLogout = useCallback(() => logout(), [logout]);

    const handleNavClick = useCallback(
      (e: React.MouseEvent, path: string) => {
        if (!isLoggedIn && path !== "/") {
          e.preventDefault();
          setShowLoginModal(true);
          setIsMenuOpen(false);
          return;
        }
        setHasNavigated(true);
        setIsMenuOpen(false);
        navigate(path);
      },
      [isLoggedIn, setShowLoginModal, navigate],
    );

    useEffect(() => {
      if (isSearchOpen && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, [isSearchOpen]);

    // Close mobile menu on backdrop click
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          isMenuOpen &&
          navRef.current &&
          !navRef.current.contains(event.target as Node)
        ) {
          setIsMenuOpen(false);
        }
      };

      if (isMenuOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isMenuOpen]);

    useEffect(() => {
      const handleScroll = () => {
        if (isMenuOpen) {
          setIsMenuOpen(false);
        }
      };

      if (isMenuOpen) {
        window.addEventListener("scroll", handleScroll, { passive: true });
      }

      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    }, [isMenuOpen]);

    const handleSearchBlur = useCallback(() => {
      if (!searchQuery) setIsSearchOpen(false);
    }, [searchQuery]);

    const handleSearchKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Escape" && !searchQuery) setIsSearchOpen(false);
      },
      [searchQuery],
    );

    const handleSearchClick = useCallback(() => {
      if (!isLoggedIn) {
        setShowLoginModal(true);
        return;
      }
      setIsSearchOpen(true);
    }, [isLoggedIn, setShowLoginModal]);

    const handleSearchChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isLoggedIn) {
          setShowLoginModal(true);
          return;
        }
        onSearchChange(e);
      },
      [isLoggedIn, setShowLoginModal, onSearchChange],
    );

    const navItems = useMemo(
      () => [
        { to: "/", label: "Home" },
        { to: "/movies", label: "Movies" },
        { to: "/series", label: "TV Shows" },
        { to: "/kids", label: "Kids" },
        { to: "/my-list", label: "Favorites" },
      ],
      [],
    );

    const shouldShowNav = useMemo(
      () =>
        !location.pathname.startsWith("/auth") &&
        location.pathname !== "/settings" &&
        !location.pathname.startsWith("/admin"),
      [location.pathname],
    );

    return (
      <nav
        ref={navRef}
        className={`fixed top-3 left-0 right-0 z-50 px-4 min-[1100px]:px-6 h-14 transition-all duration-500 ${
          shouldShowNav ? "flex min-[1100px]:flex" : "hidden"
        } items-center`}
      >
        <div
          className="max-w-full px-4 min-[1100px]:px-8 w-full flex items-center justify-between h-14 relative bg-black/20 backdrop-blur-lg border border-white/10"
          style={{
            borderRadius: isMenuOpen ? "30px 30px 0 0" : "30px",
            borderBottom: isMenuOpen
              ? "none"
              : "1px solid rgba(255,255,255,0.1)",
            transition:
              "border-radius 300ms ease, border-bottom-color 300ms ease",
          }}
        >
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <img src="/logo.png" alt="BUZUTV" className="h-10 w-auto" />
            </Link>
          </div>

          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="hidden min-[1100px]:flex items-center gap-4 whitespace-nowrap">
              {navItems.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`
                    flex items-center justify-center gap-3 rounded-full font-medium will-change-transform transform-gpu transition-all whitespace-nowrap
                    px-4 py-1 text-base
                    ${
                      isActivePath(to)
                        ? to === "/kids"
                          ? `
                            bg-[linear-gradient(135deg,#1d4ed8,#2563eb,#3b82f6)]
                            text-white
                            border border-[rgba(37,99,235,0.3)]
                            shadow-[0_10px_30px_rgba(37,99,235,0.4)]
                            hover:shadow-[0_20px_50px_rgba(37,99,235,0.6)]
                            hover:brightness-110
                            hover:-translate-y-0.5
                            transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]
                            relative overflow-hidden
                            before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full
                            before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)]
                            before:transition-[left] before:duration-500
                            hover:before:left-full
                          `
                          : `
                            bg-[linear-gradient(135deg,#7c3aed,#8b5cf6,#a855f7)]
                            text-white
                            border-2 border-[rgba(139,92,246,0.3)]
                            shadow-[0_10px_30px_rgba(139,92,246,0.4)]
                            hover:shadow-[0_20px_50px_rgba(139,92,246,0.6)]
                            hover:brightness-110
                            hover:-translate-y-0.5
                            transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]
                            relative overflow-hidden
                            before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full
                            before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)]
                            before:transition-[left] before:duration-500
                            hover:before:left-full
                          `
                        : `
                          text-white border border-transparent
                          hover:bg-brand-500/10 hover:backdrop-blur
                          hover:-translate-y-0.5
                          transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]
                          relative overflow-hidden
                          before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full
                          before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)]
                          before:transition-[left] before:duration-500
                          hover:before:left-full
                        `
                    }
                  `}
                  onClick={(e) => handleNavClick(e, to)}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Desktop search - hidden on mobile */}
            <div
              className={`relative rounded-full px-2 py-1 hidden min-[1100px]:block ${
                isSearchOpen || searchQuery
                  ? "border border-white/10 bg-black/10"
                  : ""
              }`}
            >
              {(isSearchOpen || searchQuery) && isLoggedIn ? (
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
                  onClick={handleSearchClick}
                  aria-label="Open search"
                >
                  <Search className="text-white w-6 h-6" />
                </button>
              )}
            </div>

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
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <BrandButton
                  variant="no-border"
                  size="sm"
                  onClick={handleLoginClick}
                  className="text-xs sm:text-sm font-medium px-3 sm:px-4 min-h-0"
                >
                  Log In
                </BrandButton>
                <BrandButton
                  variant="primary"
                  size="sm"
                  onClick={handleSignUpClick}
                  className="text-xs sm:text-sm font-medium px-3 sm:px-4 min-h-0"
                >
                  Sign Up
                </BrandButton>
              </div>
            )}

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="min-[1100px]:hidden text-white hover:text-gray-300 transition-colors"
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
          </div>
        </div>

        {/* Mobile dropdown */}
        <div
          className={`absolute top-14 left-4 right-4 z-40 bg-black/20 backdrop-blur-lg border border-white/10 border-t-transparent rounded-b-[30px] px-6 py-4 space-y-3 min-[1100px]:hidden transition-all duration-300 ease-in-out transform ${
            isMenuOpen
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 -translate-y-4 pointer-events-none"
          }`}
        >
          {/* Mobile search */}
          <div className="pb-3 border-b border-white/10">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-black/20 border border-white/10">
              <Search className="text-gray-300 w-5 h-5 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={handleSearchChange}
                onClick={handleSearchClick}
                className="bg-transparent text-white placeholder-gray-300 w-full focus:outline-none text-base"
              />
            </div>
          </div>

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
            <div className="pt-4 border-t border-white/10 space-y-3 max-h-6">
              <button
                onClick={() => {
                  handleLoginClick();
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left text-white text-base font-medium hover:text-brand-400 transition min-h-0 "
              >
                Log In
              </button>
              <button
                onClick={() => {
                  handleSignUpClick();
                  setIsMenuOpen(false);
                }}
                className="block w-full  text-left text-white text-base font-medium hover:text-brand-400 transition min-h-0"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </nav>
    );
  },
);

export default Navbar;
