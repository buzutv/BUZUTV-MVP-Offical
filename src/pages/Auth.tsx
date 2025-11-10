import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { ArrowLeft } from "lucide-react";
import BrandButton from "@/components/ui/BrandButton";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import ForgotPassword from "@/components/auth/ForgotPassword";

const Auth = () => {
  const { login, signup, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "signup") setIsSignUp(true);
  }, [searchParams]);

  
  console.log("Erros", errors)

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const newErrors: { [key: string]: string } = {};

  const trimmedFullName = fullName.trim();

  // ----------------------------
  // VALIDATION
  // ----------------------------
  if (isSignUp) {
    if (!trimmedFullName) newErrors.fullName = "Full Name is required";
    if (!email.trim()) newErrors.email = "Email is required";
    if (!phone.trim()) newErrors.phone = "Phone number is required";
    if (!password.trim()) newErrors.password = "Password is required";
    if (!confirmPassword.trim())
      newErrors.confirmPassword = "Confirm Password is required";

    if (password && password.length < 6)
      newErrors.password = "Password must be at least 6 characters long";

    if (password && confirmPassword && password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
  } else {
    if (!email.trim()) newErrors.email = "Email is required";
    if (!password.trim()) newErrors.password = "Password is required";
  }

  // Apply all errors at once
  setErrors(newErrors);

  // Stop execution if any validation failed
  if (Object.keys(newErrors).length > 0) {
    toast.error("Please fix the highlighted fields");
    return;
  }

  // ----------------------------
  // SUBMIT LOGIC
  // ----------------------------
  setIsLoading(true);
  try {
    if (isSignUp) {
      const result = await signup(email, password, trimmedFullName, phone);
      if (result.success) {
        toast.success("Account created successfully!");
        navigate("/");
        resetForm();
      } else {
        toast.error(result.error || "User already exists");
      }
    } else {
      const result = await login(email, password);
      if (result.success) {
        toast.success("Logged in successfully!");
        navigate("/");
        resetForm();
      } else {
        toast.error("Invalid credentials");
      }
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
        navigate("/");
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
  };

  return (
    <div className="min-h-screen text-white relative">
      {/* Brand Background Gradient */}
      {/* Fixed background gradient */}
      <div
        className="fixed inset-0"
        style={{
          background: `
  linear-gradient(
    200deg,
    #311066 0%,   /* very dark violet */
    #1D0833 20%,  /* deep blackish purple */
    #120222 45%,  /* near-black violet */
    black 100%    /* pure black */
`,
        }}
      ></div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center">
              <img src="/logo.png" alt="BUZUTV" className="h-10 w-auto" />
            </Link>

            <BrandButton
              onClick={() => navigate("/")}
              variant="secondary"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </BrandButton>
          </div>
        </div>
      </nav>

      <div className="pt-20 min-h-screen flex items-center justify-center px-4 relative z-10">
        <div className="max-w-md w-full">
          <div className="bg-black/40 border-white/20 backdrop-blur-md rounded-lg shadow-xl p-4 ">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
                {isSignUp ? "Sign Up" : "Log In"} to{" "}
                <img src="/logo.png" alt="BUZUTV" className="h-8 w-auto" />
              </h1>
              <p className="text-gray-400 mt-2 text-sm">
                {isSignUp ? "Create your account" : "Welcome back"}
              </p>
            </div>

            {/* Toggle to Sign Up (above login form) */}
            {!isSignUp && (
              <div className="text-center mb-6 flex items-center">
                <p className="text-gray-400">Don't have an account?</p>
                <button
                  onClick={() => setIsSignUp(true)}
                  className="flex items-center justify-center gap-2 text-white rounded-full font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50 will-change-transform transform-gpu px-4 py-1 text-xs bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 hover:from-brand-700 hover:via-brand-800 hover:to-brand-900 ml-2 mt-1"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Form */}

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
                  {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName}</p>}                    
                  <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="text-sm w-full px-3 py-1 bg-black/30 border border-white/30 rounded-lg text-white backdrop-blur-sm placeholder:text-white/50 focus:outline-none focus:border-brand-500 transition-colors"
                      placeholder="Enter your full name"
                      // required
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
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-sm w-full px-3 py-1 bg-black/30 border border-white/30 rounded-lg text-white backdrop-blur-sm placeholder:text-white/50 focus:outline-none focus:border-brand-500 transition-colors"
                  placeholder="Enter your password"
                />
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
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="text-sm w-full px-3 py-1 bg-black/30 border border-white/30 rounded-lg text-white backdrop-blur-sm placeholder:text-white/50 focus:outline-none focus:border-brand-500 transition-colors"
                    placeholder="Confirm your password"
                  />
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

            {/* Toggle between log in and sign up */}
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
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPassword
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onBackToLogin={() => setShowForgotPassword(false)}
      />
    </div>
  );
};

export default Auth;
