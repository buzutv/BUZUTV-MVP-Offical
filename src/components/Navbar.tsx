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
  onSearchClick: () => void;
}

const Navbar = React.memo(
  ({ onSearchClick }: NavbarProps) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    // Removed local search state
    const [hasNavigated, setHasNavigated] = useState(false);
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

    // Simple handler to trigger search modal
    const handleSearchClick = () => {
      if (!isLoggedIn) {
        setShowLoginModal(true);
        return;
      }
      onSearchClick();
    };

    return (
      <nav
        ref={navRef}
        className={`fixed top-3 left-0 right-0 z-50 px-4 min-[1100px]:px-6 h-14 transition-all duration-500 ${shouldShowNav ? "flex min-[1100px]:flex" : "hidden"
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
          <div className="flex-shrink-0 min-w-max">
            <Link to="/" className="flex items-center">
              <img src="/logo.png" alt="BUZUTV - Home" className="h-10 w-auto" />
            </Link>
          </div>

          <div className="hidden min-[1100px]:flex flex-1 justify-center px-4 overflow-hidden mx-4">
            <div className="flex items-center gap-2 min-[1200px]:gap-4 whitespace-nowrap pr-4 py-2">
              {navItems.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`
                    flex items-center justify-center gap-3 rounded-full font-medium will-change-transform transform-gpu transition-all whitespace-nowrap
                    px-4 py-1 text-base
                    ${isActivePath(to)
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
                  {label === "Kids" ? (
                    <span className="inline-flex gap-0 font-black">
                      <span className="text-red-500">K</span>
                      <span className="text-yellow-400">I</span>
                      <span className="text-green-500">D</span>
                      <span className="text-yellow-400">S</span>
                    </span>
                  ) : (
                    label
                  )}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Desktop search - Fake Input Trigger */}
            <div className="relative rounded-full px-2 py-1 hidden min-[1100px]:block">
              <div
                onClick={handleSearchClick}
                className="flex items-center px-3 py-1 bg-black/20 border border-white/10 rounded-full cursor-pointer hover:bg-black/40 transition-colors w-32 group"
              >
                <Search className="text-gray-400 group-hover:text-white w-4 h-4 mr-2 transition-colors" />
                <span className="text-sm text-gray-400 group-hover:text-white transition-colors select-none">Search...</span>
              </div>
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
                  className="text-xs sm:text-sm font-medium py-2 px-3 sm:px-4 min-h-0"
                >
                  Log In
                </BrandButton>
                <BrandButton
                  variant="primary"
                  size="sm"
                  onClick={handleSignUpClick}
                  className="text-xs sm:text-sm font-medium py-2 px-3 sm:px-4 min-h-0"
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
                  className={`absolute inset-0 transition-all duration-300 ease-in-out transform ${isMenuOpen
                    ? "opacity-0 scale-90 rotate-45"
                    : "opacity-100 scale-100 rotate-0"
                    }`}
                />
                <X
                  className={`absolute inset-0 transition-all duration-300 ease-in-out transform ${isMenuOpen
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
          className={`absolute top-14 left-4 right-4 z-40 bg-black/20 backdrop-blur-lg border border-white/10 border-t-transparent rounded-b-[30px] px-6 py-4 space-y-3 min-[1100px]:hidden transition-all duration-300 ease-in-out transform ${isMenuOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-4 pointer-events-none"
            }`}
        >
          {/* Mobile search */}
          <div className="pb-3 border-b border-white/10">
            <button
              onClick={() => {
                setIsMenuOpen(false);
                handleSearchClick();
              }}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-black/20 border border-white/10 w-full text-left active:scale-[0.98] transition-transform"
            >
              <Search className="text-gray-300 w-5 h-5 flex-shrink-0" />
              <span className="text-gray-300 text-base">Search...</span>
            </button>
          </div>

          {navItems.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="block text-white text-base font-medium hover:text-brand-400 transition"
              onClick={(e) => handleNavClick(e, to)}
            >
              {label === "Kids" ? (
                <span className="inline-flex gap-0 font-black">
                  <span className="text-red-500">K</span>
                  <span className="text-yellow-400">I</span>
                  <span className="text-green-500">D</span>
                  <span className="text-yellow-400">S</span>
                </span>
              ) : (
                label
              )}
            </Link>
          ))}

        </div>
      </nav>
    );
  },
);

export default Navbar;
