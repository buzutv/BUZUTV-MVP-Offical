import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ResetPassword = () => {
  const navigate = useNavigate();
  const query = useQuery();

  const email = query.get('email');
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
        console.error('❌ OTP verification failed:', error);
        setError(error.message || 'Invalid or expired reset link.');
      } else {
        console.log('✅ OTP verified');
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
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-4">
          <Card className="w-full max-w-md bg-gray-800 border-gray-700">
            <CardContent className="py-8 text-center">
              <p>Verifying your reset link...</p>
            </CardContent>
          </Card>
        </div>
    );
  }

  if (error || !verified) {
    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-4">
          <Card className="w-full max-w-md bg-gray-800 border-gray-700">
            <CardContent className="py-8 text-center space-y-4">
              <p className="text-red-400">{error}</p>
              <Button onClick={() => navigate('/auth')} className="bg-purple-600 hover:bg-purple-700">
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </div>
    );
  }

  if (isSuccess) {
    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-4">
          <Card className="w-full max-w-md bg-gray-800 border-gray-700">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="bg-green-600 rounded-full p-3">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold">Password Reset Successful!</h2>
                <p className="text-gray-300 text-sm">
                  You'll be redirected to login shortly.
                </p>
                <Button
                    onClick={() => navigate('/auth')}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  Go to Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-center text-white">Set New Password</CardTitle>
            <CardDescription className="text-center">
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              {error && (
                  <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
              )}

              <div className="space-y-2 text-white">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white pr-10"
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

              <div className="space-y-2 text-white">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white pr-10"
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

              <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isLoading ? 'Updating Password...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
  );
};

export default ResetPassword;
