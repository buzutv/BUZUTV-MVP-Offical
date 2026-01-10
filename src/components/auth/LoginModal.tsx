import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowUpRight, Eye, EyeOff, X, XIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ForgotPassword from "./ForgotPassword";
import BrandButton from "@/components/ui/BrandButton";
import { ScrollArea } from "@/components/ui/scroll-area";

const LoginModal = () => {
  const { showLoginModal, setShowLoginModal, login, signup, signInWithGoogle } =
    useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});


  console.log("LoginModal rendered", errors);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();



    // Shared validations
    const trimmedFullName = fullName.trim();
    if (!trimmedFullName && isSignUp) {
      setErrors((prev) => ({ ...prev, fullName: "Full Name is required" }));
      // toast.error("Full Name is required");
    }

    if (!email) setErrors((prev) => ({ ...prev, email: "Email is required" }))
    if (!password) setErrors((prev) => ({ ...prev, password: "Password is required" }))
    setTimeout(() => {
      setErrors({})
    }, 1000)

    if (isSignUp) {
      if (!email) {
        // setErrors((prev) => ({ ...prev, email: "Email is required" }));
        toast.error("Email is required");
      }
      if (!password || !confirmPassword || !fullName.trim()) {
        // setErrors((prev) => ({ ...prev, password: "All fields are required" }));
        // setErrors((prev) => ({ ...prev, confirmPassword: "All fields are required" }));
        toast.error("All fields are required");
      }
      if (password !== confirmPassword)
        return toast.error("Passwords do not match");
      if (password.length < 6)
        return toast.error("Password must be at least 6 characters long");
    }

    if (!isSignUp && (!email || !password))
      return toast.error("Please fill in all fields");

    setIsLoading(true);

    try {
      if (isSignUp) {
        // Email sign-up
        const result = await signup(email, password, trimmedFullName, phone);
        if (result.success) {
          toast.success("Account created successfully!");
          setShowLoginModal(false);
          resetForm();
        } else {
          toast.error("User already exists");
        }
        return;
      }

      // Login
      const result = await login(email, password);

      if (result.success) {
        toast.success("Logged in successfully!");
        setShowLoginModal(false);
        resetForm();
      } else {
        toast.error("Invalid credentials");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        toast.success("Redirecting to Google...");
        setShowLoginModal(false);
        resetForm();
      } else {
        toast.error(result.error || "Google sign-in failed");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPhone("");
    setPassword("");
    setConfirmPassword("");
    setFullName("");
    setIsSignUp(false);
    setShowOtpForm(false);
    setOtpCode("");
  };

  const handleClose = () => {
    // Only allow closing if on home page
    if (location.pathname === "/") {
      setShowLoginModal(false);
      resetForm();
    } else {
      // Redirect to home if trying to close from protected route
      navigate("/");
      setShowLoginModal(false);
      resetForm();
    }
  };

  const handleGoToFullPage = () => {
    setShowLoginModal(false);
    navigate("/auth");
    resetForm();
  };

  return (
    <Dialog open={showLoginModal} onOpenChange={handleClose}>
      {/* <XIcon className="absolute top-4 right-4 cursor-pointer text-slate-100" onClick={handleClose} /> */}
      <DialogContent
        className="sm:max-w-md bg-black/80 text-white border-brand-500 backdrop-blur-md overflow-hidden"
        hideCloseButton
      >
        <ScrollArea className="max-h-[90vh] overflow-visible p-0">
          <div className="p-4 flex flex-col gap-2 pb-2">
            <DialogHeader>
              <div className="flex items-center justify-between mb-2">
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  {isSignUp ? "Sign Up" : "Log In"} to{" "}
                  <img src="/logo.png" alt="BUZUTV" className="h-6 w-auto" />
                </DialogTitle>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleGoToFullPage}
                    className="text-gray-400 hover:text-white transition-colors p-1"
                    title="Open full page"
                  >
                    <ArrowUpRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-white transition-colors p-1"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </DialogHeader>

            {/* Toggle to Sign Up (above login form) */}
            {!isSignUp && (
              <div className="text-center mb-4 flex items-center">
                <p className="text-gray-400">Don't have an account?</p>
                <button
                  onClick={() => setIsSignUp(true)}
                  className="flex items-center justify-center gap-2 text-white rounded-full font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50 will-change-transform transform-gpu px-4 py-2 text-xs bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 hover:from-brand-700 hover:via-brand-800 hover:to-brand-900 ml-4"
                >
                  Sign Up
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <>
                  <div>
                    <label
                      htmlFor="fullName"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Full Name
                    </label>
                    {errors.fullName && <p className="text-red-500 text-xs mb-2">{errors.fullName}</p>}
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="text-sm w-full px-3 py-1 bg-black/30 border border-white/30 rounded-lg text-white backdrop-blur-sm placeholder:text-white/50 focus:outline-none focus:border-brand-500 transition-colors"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-300 mb-2"

                    >
                      Phone Number
                    </label>
                    {errors.phone && <p className="text-red-500 text-xs">{errors.phone}</p>}
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="text-sm w-full px-3 py-1 bg-black/30 border border-white/30 rounded-lg text-white backdrop-blur-sm placeholder:text-white/50 focus:outline-none focus:border-brand-500 transition-colors"
                      placeholder="Enter your phone number"
                      required
                    />
                  </div>
                </>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Email
                </label>
                {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-sm w-full px-3 py-1 bg-black/30 border border-white/30 rounded-lg text-white backdrop-blur-sm placeholder:text-white/50 focus:outline-none focus:border-brand-500 transition-colors"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Password
                </label>
                {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="text-sm w-full px-3 py-1 bg-black/30 border border-white/30 rounded-lg text-white backdrop-blur-sm placeholder:text-white/50 focus:outline-none focus:border-brand-500 transition-colors pr-10"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {!isSignUp && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-gray-400 hover:text-brand-500 transition-colors text-sm"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}
              </div>

              {isSignUp && (
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Confirm Password
                  </label>
                  {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword}</p>}
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="text-sm w-full px-3 py-1 bg-black/30 border border-white/30 rounded-lg text-white backdrop-blur-sm placeholder:text-white/50 focus:outline-none focus:border-brand-500 transition-colors pr-10"
                      placeholder="Confirm your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 text-white rounded-full font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50 will-change-transform transform-gpu px-6 py-2 text-sm bg-brand-500 hover:bg-brand-600 whitespace-nowrap"
              >
                {isLoading ? "Please wait..." : isSignUp ? "Sign Up" : "Log In"}
              </button>
            </form>

            <div className="text-center mt-4 space-y-3">
              {isSignUp && (
                <div className="flex items-center">
                  <p className="text-gray-400 text-sm">
                    Already have an account?
                  </p>
                  <button
                    onClick={() => setIsSignUp(false)}
                    className="flex items-center justify-center gap-2 text-white rounded-full font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50 will-change-transform transform-gpu px-4 py-1 text-xs bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 hover:from-brand-700 hover:via-brand-800 hover:to-brand-900 ml-2 mt-1"
                  >
                    Log In
                  </button>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center my-3">
              <div className="flex-1 border-t border-gray-600"></div>
              <span className="px-3 text-gray-400 text-sm">or</span>
              <div className="flex-1 border-t border-gray-600"></div>
            </div>

            {/* Google Sign In Button */}
            <BrandButton
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="text-sm w-full disabled:opacity-50 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300"
              variant="no-border"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </BrandButton>
          </div>
        </ScrollArea>
      </DialogContent>

      {/* Forgot Password Modal */}
      <ForgotPassword
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onBackToLogin={() => setShowForgotPassword(false)}
      />
    </Dialog>
  );
};

export default LoginModal;
