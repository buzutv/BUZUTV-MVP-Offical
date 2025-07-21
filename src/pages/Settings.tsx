import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, User, Mail, Lock, Shield, LogOut, ArrowLeft } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordPrompt, setPasswordPrompt] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    rePassword: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleUpdateInfo = () => {
    setShowPasswordModal(true);
    setError("");
  };

  const handlePasswordConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!passwordPrompt) {
      setError("Please enter your current password.");
      return;
    }

    try {
      const { error: pwError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: passwordPrompt,
      });
      
      if (pwError) {
        setError("Incorrect password. Please try again.");
        return;
      }
      
      setShowPasswordModal(false);
      setPasswordPrompt("");
      
      // Now actually save the changes after successful authentication
      await handleSave();
      
    } catch (error) {
      setError("An error occurred during authentication.");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (form.password && form.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return false;
    }
    
    if (form.password && form.password !== form.rePassword) {
      setError("Passwords do not match.");
      return false;
    }
    
    if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    
    if (!validateForm()) {
      setIsSaving(false);
      return;
    }

    try {
      let updatedItems = [];

      // Update email if changed
      if (form.email !== user?.email) {
        const { error: emailError } = await supabase.auth.updateUser({ 
          email: form.email 
        });
        
        if (emailError) {
          if (emailError.message.toLowerCase().includes("already registered")) {
            setError("That email is already in use by another account.");
          } else {
            setError(emailError.message);
          }
          setIsSaving(false);
          return;
        }
        
        updatedItems.push("email");
        toast.success("Email update initiated! Check your new email for verification.");
      }

      // Update password if provided
      if (form.password) {
        const { error: pwError } = await supabase.auth.updateUser({ 
          password: form.password 
        });
        
        if (pwError) {
          setError(pwError.message);
          setIsSaving(false);
          return;
        }
        
        updatedItems.push("password");
        toast.success("Password updated successfully!");
      }

      // Update name/profile data
      if (form.name !== user?.name) {
        const { error: nameError } = await supabase.auth.updateUser({ 
          data: { 
            full_name: form.name, 
            name: form.name 
          } 
        });
        
        if (nameError) {
          console.warn("Name update error:", nameError);
        } else {
          updatedItems.push("name");
          toast.success("Profile name updated successfully!");
        }
      }

      // Reset password fields after successful update
      setForm(f => ({ ...f, password: "", rePassword: "" }));
      
      if (updatedItems.length === 0) {
        toast.info("No changes were made to your profile.");
      } else {
        toast.success(`Successfully updated: ${updatedItems.join(", ")}`);
      }
      
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Password', icon: Shield },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Header */}
        <nav className="fixed top-0 w-full z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate("/")}
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to Home</span>
                </button>
              </div>
              
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 bg-clip-text text-transparent">
                Settings
              </span>
              
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </nav>

        <div className="pt-20 max-w-4xl mx-auto px-4 py-8">
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-8 bg-gray-800 rounded-lg p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all flex-1 justify-center ${
                    activeTab === tab.id
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <User className="w-5 h-5" />
                  <span>Profile Information</span>
                </CardTitle>
                <CardDescription>
                  Update your personal information and email address.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 text-white">
                    <Label htmlFor="name" className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>Full Name</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="space-y-2 text-white">
                    <Label htmlFor="email" className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>Email Address</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <Button
                    onClick={handleUpdateInfo}
                    disabled={isSaving}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isSaving ? "Saving..." : "Update Profile"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <Card className="bg-gray-800 border-gray-700 text-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Password</span>
                </CardTitle>
                <CardDescription>
                  Change your password.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="flex items-center space-x-2">
                      <Lock className="w-4 h-4" />
                      <span>New Password</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={handleInputChange}
                        className="bg-gray-700 border-gray-600 text-white pr-10"
                        placeholder="Enter new password (optional)"
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

                  {form.password && (
                    <div className="space-y-2">
                      <Label htmlFor="rePassword">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="rePassword"
                          name="rePassword"
                          type={showRePassword ? "text" : "password"}
                          value={form.rePassword}
                          onChange={handleInputChange}
                          className="bg-gray-700 border-gray-600 text-white pr-10"
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                          onClick={() => setShowRePassword(!showRePassword)}
                        >
                          {showRePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-400 bg-gray-700/50 rounded-lg p-3">
                    <p className="mb-1">Password requirements:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>At least 6 characters long</li>
                      <li>Leave empty to keep current password</li>
                    </ul>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <Button
                    onClick={handleUpdateInfo}
                    disabled={isSaving}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isSaving ? "Updating..." : "Confirm & Update Settings"}
                  </Button>
                  <p className="text-xs text-gray-400 mt-2">
                    You'll be asked to confirm your current password before changes are applied.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Password Confirmation Modal */}
        <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
          <DialogContent className="sm:max-w-md bg-gray-800 text-white border-gray-700">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Confirm Your Identity</span>
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handlePasswordConfirm} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordPrompt}
                  onChange={(e) => setPasswordPrompt(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Enter your current password"
                  autoFocus
                />
              </div>
              
              {error && (
                <div className="text-red-400 text-sm bg-red-900/20 border border-red-700 rounded p-2">
                  {error}
                </div>
              )}
              
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  Confirm
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
};

export default Settings;