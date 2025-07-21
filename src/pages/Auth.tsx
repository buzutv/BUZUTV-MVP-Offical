
import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import ForgotPassword from '@/components/auth/ForgotPassword';

const Auth = () => {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Check URL parameters on component mount
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'signup') {
      setIsSignUp(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || (isSignUp && !name)) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        const result = await signup(email, password, name);
        if (result.success) {
          toast.success('Account created successfully!');
          navigate('/');
          resetForm();
        } else {
          toast.error('User already exists');
        }
      } else {
        const result = await login(email, password);
        if (result.success) {
          toast.success('Logged in successfully!');
          navigate('/');
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

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setIsSignUp(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 bg-clip-text text-transparent">
                BUZUTV
              </span>
            </Link>
            
            <Link
              to="/"
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="pt-16 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-gray-800 rounded-lg shadow-xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold">
                {isSignUp ? 'Sign Up' : 'Sign In'} to{' '}
                <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 bg-clip-text text-transparent">BUZUTV</span>
              </h1>
              <p className="text-gray-400 mt-2">
                {isSignUp ? 'Create your account' : 'Welcome back'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {isSignUp && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="Enter your full name"
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Enter your password"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full disabled:opacity-50"
                style={{ backgroundColor: '#601EF9' }}
              >
                {isLoading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
              </Button>
            </form>

            {/* Toggle between sign in and sign up */}
            <div className="text-center mt-6 space-y-2">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
              
              {!isSignUp && (
                <div className="text-center">
                  <button
                    onClick={() => setShowForgotPassword(true)}
                    className="text-gray-400 hover:text-blue-300 transition-colors text-sm"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
            </div>

            {/* Demo Credentials */}
            {!isSignUp && (
              <div className="mt-6 p-4 bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-300 text-center mb-2">Demo Credentials:</p>
                <p className="text-xs text-gray-400 text-center">
                  User: user@example.com / password123<br />
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
