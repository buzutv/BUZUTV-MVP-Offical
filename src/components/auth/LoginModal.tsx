
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import ForgotPassword from './ForgotPassword';

const LoginModal = () => {
  const { showLoginModal, setShowLoginModal, login, loginWithPhone, signup, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loginWithPhoneMode, setLoginWithPhoneMode] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp) {
      if (!email || !password || !confirmPassword || !firstName || !lastName) {
        toast.error('Please fill in all fields');
        return;
      }
      if (password !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
      if (password.length < 6) {
        toast.error('Password must be at least 6 characters long');
        return;
      }
    } else {
      if (loginWithPhoneMode) {
        if (!phone || !password) {
          toast.error('Please fill in all fields');
          return;
        }
      } else {
        if (!email || !password) {
          toast.error('Please fill in all fields');
          return;
        }
      }
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
        const result = await signup(email, password, fullName);
        if (result.success) {
          toast.success('Account created successfully!');
          setShowLoginModal(false);
          resetForm();
        } else {
          toast.error('User already exists');
        }
      } else {
        const result = loginWithPhoneMode 
          ? await loginWithPhone(phone, password)
          : await login(email, password);
        if (result.success) {
          toast.success('Logged in successfully!');
          setShowLoginModal(false);
          resetForm();
        } else {
          toast.error('Invalid credentials');
        }
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        toast.success('Redirecting to Google...');
        setShowLoginModal(false);
        resetForm();
      } else {
        toast.error(result.error || 'Google sign-in failed');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
    setIsSignUp(false);
    setLoginWithPhoneMode(false);
  };

  const handleClose = () => {
    // Only allow closing if on home page
    if (location.pathname === '/') {
      setShowLoginModal(false);
      resetForm();
    } else {
      // Redirect to home if trying to close from protected route
      navigate('/');
      setShowLoginModal(false);
      resetForm();
    }
  };

  const handleGoToFullPage = () => {
    setShowLoginModal(false);
    navigate('/auth');
    resetForm();
  };

  return (
    <Dialog open={showLoginModal} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-gray-800 text-white border-gray-700" hideCloseButton>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              {isSignUp ? 'Sign Up' : 'Sign In'} to{' '}
              <span className="bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 bg-clip-text text-transparent">BUZUTV</span>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-1">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-500 transition-colors"
                  placeholder="First name"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-1">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-500 transition-colors"
                  placeholder="Last name"
                />
              </div>
            </div>
          )}

          {!isSignUp && (
            <div className="flex space-x-2 mb-4">
              <button
                type="button"
                onClick={() => setLoginWithPhoneMode(false)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  !loginWithPhoneMode
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => setLoginWithPhoneMode(true)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  loginWithPhoneMode
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Phone
              </button>
            </div>
          )}

          <div>
            <label htmlFor={loginWithPhoneMode && !isSignUp ? "phone" : "email"} className="block text-sm font-medium text-gray-300 mb-1">
              {loginWithPhoneMode && !isSignUp ? "Phone Number" : "Email"}
            </label>
            {loginWithPhoneMode && !isSignUp ? (
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-500 transition-colors"
                placeholder="Enter your phone number"
              />
            ) : (
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-500 transition-colors"
                placeholder="Enter your email"
              />
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-500 transition-colors"
              placeholder="Enter your password"
            />
          </div>

          {isSignUp && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-500 transition-colors"
                placeholder="Confirm your password"
              />
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full disabled:opacity-50 bg-brand-500 hover:bg-brand-600 text-white"
          >
            {isLoading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </Button>
        </form>

        <div className="text-center mt-4 space-y-3">
          {isSignUp ? (
            <div className="space-y-2">
              <p className="text-gray-400 text-sm">Already have an account?</p>
              <button
                onClick={() => setIsSignUp(false)}
                className="text-brand-400 hover:text-brand-300 transition-colors font-medium"
              >
                Sign In
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-400 text-sm">Don't have an account?</p>
              <Button
                onClick={() => setIsSignUp(true)}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white"
              >
                Sign Up
              </Button>
              <button
                onClick={() => setShowForgotPassword(true)}
                className="text-gray-400 hover:text-blue-300 transition-colors text-sm"
              >
                Forgot Password?
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-gray-600"></div>
          <span className="px-3 text-gray-400 text-sm">or</span>
          <div className="flex-1 border-t border-gray-600"></div>
        </div>

        {/* Google Sign In Button */}
        <Button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full disabled:opacity-50 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>Continue with Google</span>
        </Button>
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
