
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface AdminAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminAccessModal = ({ isOpen, onClose }: AdminAccessModalProps) => {
  const [adminPassword, setAdminPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adminPassword) {
      toast.error('Please enter admin password');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (adminPassword === 'admin123') {
      localStorage.setItem('isAdminLoggedIn', 'true');
      toast.success('Admin access granted!');
      navigate('/admin/dashboard');
      onClose();
      setAdminPassword('');
    } else {
      toast.error('Invalid admin credentials');
    }

    setIsLoading(false);
  };

  const handleClose = () => {
    onClose();
    setAdminPassword('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-gray-800 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            Admin Access Required
          </DialogTitle>
        </DialogHeader>

        <div className="text-center text-gray-300 mb-4">
          <p>You have admin privileges. Please enter the admin password to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-300 mb-1">
              Admin Password
            </label>
            <input
              id="adminPassword"
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Enter admin password"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Verifying...' : 'Access Admin Panel'}
          </Button>
        </form>

        <div className="mt-4 p-3 bg-gray-700 rounded-lg">
          <p className="text-xs text-gray-300 text-center mb-1">Demo Admin Password:</p>
          <p className="text-xs text-gray-400 text-center">admin123</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminAccessModal;
