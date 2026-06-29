import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import BrandButton from '@/components/ui/BrandButton';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ResetPassword = () => {
  const navigate = useNavigate();
  const query = useQuery();

  const email = query.get('email') ? decodeURIComponent(query.get('email')!) : null;
  const otp = query.get('otp');

  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const verify = async () => {
      if (!email || !otp) {
        setError('Invalid or incomplete reset link.');
        setVerifying(false);
        return;
      }

      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'recovery',
      });

      if (error) {
        setError(error.message || 'Invalid or expired reset link.');
      } else {
        setVerified(true);
      }
      setVerifying(false);
    };

    verify();
  }, [email, otp]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      return setError('Please fill out both password fields.');
    }

    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters long.');
    }

    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      console.error('❌ Failed to update password:', error);
      setError(error.message || 'Something went wrong.');
    } else {
      setIsSuccess(true);
      toast.success('Password updated! Redirecting...');
      setTimeout(() => navigate('/auth'), 3000);
    }

    setIsLoading(false);
  };

  if (verifying) {
    return (
      <div className="min-h-screen text-white relative">
        {/* Brand Background Gradient */}
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
              )`,
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
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Verifying Reset Link</h1>
                <p className="text-gray-400">Please wait while we verify your reset link...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !verified) {
    return (
      <div className="min-h-screen text-white relative">
        {/* Brand Background Gradient */}
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
              )`,
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
              <div className="text-center space-y-6">
                <div>
                  <h1 className="text-2xl font-bold mb-2">Reset Link Invalid</h1>
                  <p className="text-red-400">{error}</p>
                </div>
                
                <BrandButton 
                  onClick={() => navigate('/auth')} 
                  variant="primary"
                  className="w-full"
                >
                  Back to Login
                </BrandButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen text-white relative">
        {/* Brand Background Gradient */}
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
              )`,
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
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="bg-green-600 rounded-full p-3">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                <div>
                  <h1 className="text-3xl font-bold flex items-center justify-center gap-3 mb-2">
                    Password Reset Successful!
                  </h1>
                  <p className="text-gray-400">
                    You'll be redirected to login shortly.
                  </p>
                </div>
                
                <BrandButton
                  onClick={() => navigate('/auth')}
                  variant="primary"
                  className="w-full"
                >
                  Go to Login
                </BrandButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white relative">
      {/* Brand Background Gradient */}
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
            )`,
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
                  Set New Password for{" "}
                  <img src="/logo.png" alt="BUZUTV" className="h-8 w-auto" />
                </h1>
                <p className="text-gray-400 mt-2 text-sm">
                  Enter your new password below
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handlePasswordReset} className="space-y-6">
                {error && (
                  <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="new-password"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-black/30 border border-white/30 rounded-lg text-white backdrop-blur-sm placeholder:text-white/50 focus:outline-none focus:border-brand-500 transition-colors pr-10"
                      placeholder="Enter your new password"
                      autoFocus
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-black/30 border border-white/30 rounded-lg text-white backdrop-blur-sm placeholder:text-white/50 focus:outline-none focus:border-brand-500 transition-colors pr-10"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 text-white rounded-full font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50 will-change-transform transform-gpu px-6 py-3 text-sm bg-brand-500 hover:bg-brand-600 whitespace-nowrap"
                >
                  {isLoading ? 'Updating Password...' : 'Update Password'}
                </button>
              </form>

              {/* Back to Login Link */}
              <div className="text-center mt-6">
                <button
                  onClick={() => navigate('/auth')}
                  className="text-gray-400 hover:text-brand-500 transition-colors text-sm"
                >
                  Back to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
};

export default ResetPassword;