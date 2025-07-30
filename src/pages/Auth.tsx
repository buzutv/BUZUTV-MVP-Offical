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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "signup") setIsSignUp(true);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

    if (isSignUp) {
      if (!email) return toast.error("Email is required");
      if (!password || !confirmPassword || !firstName || !lastName)
        return toast.error("Please fill in all fields");
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
        const result = await signup(email, password, fullName, phone);
        if (result.success) {
          toast.success("Account created successfully!");
          navigate("/");
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
        navigate("/");
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
    setFirstName("");
    setLastName("");
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

      <div className="pt-24 min-h-screen flex items-center justify-center px-4 relative z-10">
        <div className="max-w-md w-full">
          <div className="bg-black/40 border-white/20 backdrop-blur-md rounded-lg shadow-xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
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
              <div className="text-center mb-6 space-y-3">
                <p className="text-gray-400">Don't have an account?</p>
                <button
                  onClick={() => setIsSignUp(true)}
                  className="flex items-center justify-center gap-2 text-white rounded-full font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50 will-change-transform transform-gpu px-4 py-2 text-xs bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 hover:from-brand-700 hover:via-brand-800 hover:to-brand-900 mx-auto"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Form */}

            <form onSubmit={handleSubmit} className="space-y-6">
              {isSignUp && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="firstName"
                        className="block text-sm font-medium text-gray-300 mb-2"
                      >
                        First Name
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-3 py-2 bg-black/30 border border-white/30 rounded-lg text-white backdrop-blur-sm placeholder:text-white/50 focus:outline-none focus:border-brand-500 transition-colors"
                        placeholder="First name"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="lastName"
                        className="block text-sm font-medium text-gray-300 mb-2"
                      >
                        Last Name
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-3 py-2 bg-black/30 border border-white/30 rounded-lg text-white backdrop-blur-sm placeholder:text-white/50 focus:outline-none focus:border-brand-500 transition-colors"
                        placeholder="Last name"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-black/30 border border-white/30 rounded-lg text-white backdrop-blur-sm placeholder:text-white/50 focus:outline-none focus:border-brand-500 transition-colors"
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

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-black/30 border border-white/30 rounded-lg text-white backdrop-blur-sm placeholder:text-white/50 focus:outline-none focus:border-brand-500 transition-colors"
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
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-black/30 border border-white/30 rounded-lg text-white backdrop-blur-sm placeholder:text-white/50 focus:outline-none focus:border-brand-500 transition-colors"
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
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-black/30 border border-white/30 rounded-lg text-white backdrop-blur-sm placeholder:text-white/50 focus:outline-none focus:border-brand-500 transition-colors"
                    placeholder="Confirm your password"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 text-white rounded-full font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50 will-change-transform transform-gpu px-6 py-3 text-sm bg-brand-500 hover:bg-brand-600 whitespace-nowrap"
              >
                {isLoading ? "Please wait..." : isSignUp ? "Sign Up" : "Log In"}
              </button>
            </form>

            {/* Toggle between log in and sign up */}
            <div className="text-center mt-6 space-y-4">
              {isSignUp && (
                <div className="space-y-3">
                  <p className="text-gray-400">Already have an account?</p>
                  <button
                    onClick={() => setIsSignUp(false)}
                    className="flex items-center justify-center gap-2 text-white rounded-full font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50 will-change-transform transform-gpu px-4 py-2 text-xs bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 hover:from-brand-700 hover:via-brand-800 hover:to-brand-900 mx-auto"
                  >
                    Log In
                  </button>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-gray-600"></div>
              <span className="px-3 text-gray-400 text-sm">or</span>
              <div className="flex-1 border-t border-gray-600"></div>
            </div>

            {/* Google Sign In Button */}
            <BrandButton
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full disabled:opacity-50 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300"
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

            {/* Demo Credentials */}
            {!isSignUp && (
              <div className="mt-6 p-4 bg-black rounded-lg">
                <p className="text-sm text-gray-300 text-center mb-2">
                  Demo Credentials:
                </p>
                <p className="text-xs text-gray-400 text-center">
                  User: user@example.com / password123
                  <br />
                  Admin: admin@example.com / admin123
                </p>
              </div>
            )}
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
