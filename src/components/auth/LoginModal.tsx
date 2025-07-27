import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowUpRight, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ForgotPassword from "./ForgotPassword";
import { supabase } from "@/integrations/supabase/client";
import BrandButton from "@/components/ui/BrandButton";
import { ScrollArea } from "@/components/ui/scroll-area";

const LoginModal = () => {
  const {
    showLoginModal,
    setShowLoginModal,
    login,
    loginWithPhone,
    signup,
    signInWithGoogle,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loginWithPhoneMode, setLoginWithPhoneMode] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Shared validations
    const isPhoneOnly = phone && !email;
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

    if (isSignUp) {
      if (!email && !phone)
        return toast.error("Email or phone number is required");
      if (!password || !confirmPassword || !firstName || !lastName)
        return toast.error("Please fill in all fields");
      if (password !== confirmPassword)
        return toast.error("Passwords do not match");
      if (password.length < 6)
        return toast.error("Password must be at least 6 characters long");
    }

    if (!isSignUp && loginWithPhoneMode && (!phone || !password))
      return toast.error("Please fill in all fields");

    if (!isSignUp && !loginWithPhoneMode && (!email || !password))
      return toast.error("Please fill in all fields");

    setIsLoading(true);

    try {
      if (isSignUp) {
        if (isPhoneOnly) {
          // Phone OTP sign-up (step 1)
          const { error } = await supabase.auth.signInWithOtp({ phone });
          if (error) return toast.error(error.message);

          toast.success("OTP sent to your phone");
          setShowOtpForm(true);
          return;
        }

        // Email sign-up
        const result = await signup(email, password, fullName, { phone });
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
      let result;
      if (loginWithPhoneMode) {
        const { error } = await supabase.auth.signInWithOtp({ phone });
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Verification code sent to your phone");
        setShowOtpForm(true);
        return;
      } else {
        result = await login(email, password);
      }

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
    setFirstName("");
    setLastName("");
    setIsSignUp(false);
    setLoginWithPhoneMode(false);
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
      <DialogContent
        className="sm:max-w-md bg-black/80 text-white border-brand-500 backdrop-blur-md overflow-hidden"
        hideCloseButton
      >
        <ScrollArea className="max-h-[90vh] overflow-visible p-0">
          <div className="p-6 flex flex-col gap-4 pb-4">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  {isSignUp ? "Sign Up" : "Log In"} to{" "}
                  <img 
                    src="/logo.png" 
                    alt="BUZUTV" 
                    className="h-6 w-auto"
                  />
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

              {!isSignUp && (
                <div className="flex space-x-3 mb-6">
                  <BrandButton
                    type="button"
                    onClick={() => setLoginWithPhoneMode(false)}
                    className="flex-1"
                    variant={!loginWithPhoneMode ? "primary" : "secondary"}
                    size="sm"
                  >
                    Email
                  </BrandButton>
                  <BrandButton
                    type="button"
                    onClick={() => setLoginWithPhoneMode(true)}
                    className="flex-1"
                    variant={loginWithPhoneMode ? "primary" : "secondary"}
                    size="sm"
                  >
                    Phone
                  </BrandButton>
                </div>
              )}

              <div>
                <label
                  htmlFor={loginWithPhoneMode && !isSignUp ? "phone" : "email"}
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  {loginWithPhoneMode && !isSignUp ? "Phone Number" : "Email"}
                </label>
                {loginWithPhoneMode && !isSignUp ? (
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-black/30 border border-white/30 rounded-lg text-white backdrop-blur-sm placeholder:text-white/50 focus:outline-none focus:border-brand-500 transition-colors"
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-black/30 border border-white/30 rounded-lg text-white backdrop-blur-sm placeholder:text-white/50 focus:outline-none focus:border-brand-500 transition-colors"
                    placeholder="Enter your email"
                  />
                )}
              </div>

              {!(loginWithPhoneMode && !isSignUp) && (
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
                </div>
              )}

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
                className="w-full flex items-center justify-center gap-3 text-white rounded-full font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50 will-change-transform transform-gpu px-6 py-3 text-sm bg-brand-500 hover:bg-brand-600 whitespace-nowrap"
              >
                {isLoading ? "Please wait..." : isSignUp ? "Sign Up" : "Log In"}
              </button>
            </form>

            {showOtpForm && (
              <div className="mt-6">
                <label
                  htmlFor="otp"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Enter OTP
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full px-3 py-2 bg-black/30 border border-white/30 rounded-lg text-white backdrop-blur-sm placeholder:text-white/50 focus:outline-none focus:border-brand-500 transition-colors"
                  placeholder="123456"
                />
                <button
                  onClick={async () => {
                    const { data, error } = await supabase.auth.verifyOtp({
                      phone,
                      token: otpCode,
                      type: "sms",
                    });
                    if (error) {
                      toast.error(error.message);
                    } else {
                      toast.success("Phone number verified!");
                      setShowLoginModal(false);
                      resetForm();
                    }
                  }}
                  className="mt-4 w-full flex items-center justify-center gap-3 text-white rounded-full font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50 will-change-transform transform-gpu px-6 py-3 text-sm bg-brand-500 hover:bg-brand-600 whitespace-nowrap"
                >
                  Verify OTP
                </button>
              </div>
            )}

            <div className="text-center mt-6 space-y-4">
              {isSignUp ? (
                <div className="space-y-3">
                  <p className="text-gray-400">Already have an account?</p>
                  <button
                    onClick={() => setIsSignUp(false)}
                    className="flex items-center justify-center w-full gap-3 text-white rounded-full font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50 will-change-transform transform-gpu px-6 py-3 text-sm bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 hover:from-brand-700 hover:via-brand-800 hover:to-brand-900"
                  >
                    Log In
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-400">Don't have an account?</p>
                  <button
                    onClick={() => setIsSignUp(true)}
                    className="w-full flex items-center justify-center gap-3 text-white rounded-full font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50 will-change-transform transform-gpu px-6 py-3 text-sm bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 hover:from-brand-700 hover:via-brand-800 hover:to-brand-900"
                  >
                    Sign Up
                  </button>
                  <button
                    onClick={() => setShowForgotPassword(true)}
                    className="text-gray-400 hover:text-brand-500 transition-colors text-sm"
                  >
                    Forgot Password?
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
