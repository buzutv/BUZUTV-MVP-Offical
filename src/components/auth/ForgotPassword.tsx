import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ForgotPasswordProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToLogin: () => void;
}

const ForgotPassword = ({ isOpen, onClose, onBackToLogin }: ForgotPasswordProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      // Use the correct port for your dev server
      const redirectUrl = window.location.hostname === 'localhost' 
        ? `http://localhost:8080/reset-password`
        : `${window.location.origin}/reset-password`;
        
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        toast.error('Failed to send reset email. Please try again.');
        console.error('Reset password error:', error);
      } else {
        setEmailSent(true);
        toast.success('Password reset email sent!');
        console.log('Reset email sent to:', email, 'with redirect:', redirectUrl);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setEmailSent(false);
    onClose();
  };

  const handleBackToLogin = () => {
    setEmail('');
    setEmailSent(false);
    onBackToLogin();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-gray-800 text-white border-gray-700">
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-2">
            <button
              onClick={handleBackToLogin}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <DialogTitle className="text-xl font-bold">
              Reset Password
            </DialogTitle>
          </div>
        </DialogHeader>

        {!emailSent ? (
          <div className="space-y-4">
            <p className="text-gray-300 text-sm">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Enter your email"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full disabled:opacity-50"
                style={{ backgroundColor: '#601EF9' }}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="bg-green-600 rounded-full p-3">
                <Mail className="w-6 h-6 text-white" />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Check your email</h3>
              <p className="text-gray-300 text-sm">
                We've sent a password reset link to <span className="font-medium">{email}</span>
              </p>
            </div>

            <div className="space-y-2">
              <Button
                onClick={handleBackToLogin}
                variant="outline"
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Back to Sign In
              </Button>
              
              <button
                onClick={() => setEmailSent(false)}
                className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
              >
                Try a different email
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPassword;