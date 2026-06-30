import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import BrandButton from "@/components/ui/BrandButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: user?.email || "",
    phone: "",
    currentPassword: "",
    password: "",
    rePassword: "",
  });
  const [fieldStates, setFieldStates] = useState({
    fullName: false,
    email: false,
    phone: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [savingStates, setSavingStates] = useState({
    fullName: false,
    email: false,
    phone: false,
  });
  const [error, setError] = useState("");

  // Sync form with user data when user changes
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        fullName: user.name || "",
        email: user.email || "",
        phone: user.phone || user.user_metadata?.phone || "",
      }));
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleFieldToggle = (field: string) => {
    setFieldStates((prev) => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev],
    }));
    setError("");
  };

  const handlePasswordChangeClick = () => {
    setShowPasswordChangeModal(true);
    setError("");
  };

  const handleUpdateFullName = async () => {
    setSavingStates((prev) => ({ ...prev, fullName: true }));
    setError("");

    try {
      const currentFullName = user?.name || "";
      if (form.fullName.trim() !== currentFullName) {
        const { error: nameError } = await supabase.auth.updateUser({
          data: {
            full_name: form.fullName.trim(),
            name: form.fullName.trim(),
          },
        });

        if (nameError) {
          setError(nameError.message);
        } else {
          toast.success("Full name updated successfully!");
          setFieldStates((prev) => ({ ...prev, fullName: false }));
        }
      } else {
        toast.info("No changes were made to your full name.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSavingStates((prev) => ({ ...prev, fullName: false }));
    }
  };

  const handleUpdateEmail = async () => {
    setSavingStates((prev) => ({ ...prev, email: true }));
    setError("");

    try {
      if (form.email !== user?.email) {
        // Add email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.email)) {
          setError("Please enter a valid email address.");
          return;
        }

        const { error: emailError } = await supabase.auth.updateUser({
          email: form.email,
        });

        if (emailError) {
          if (emailError.message.toLowerCase().includes("already registered")) {
            setError("That email is already in use by another account.");
          } else {
            setError(emailError.message);
          }
        } else {
          toast.success(
            "Email update initiated! Check your new email for verification.",
          );
          setFieldStates((prev) => ({ ...prev, email: false }));
        }
      } else {
        toast.info("No changes were made to your email.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSavingStates((prev) => ({ ...prev, email: false }));
    }
  };

  const handleUpdatePhone = async () => {
    setSavingStates((prev) => ({ ...prev, phone: true }));
    setError("");

    try {
      const currentPhone = user?.phone || user?.user_metadata?.phone || "";
      if (form.phone !== currentPhone) {
        // Add phone validation (basic format check)
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (
          form.phone &&
          !phoneRegex.test(form.phone.replace(/[\s\-\(\)]/g, ""))
        ) {
          setError("Please enter a valid phone number.");
          return;
        }

        // Update phone number directly in profiles table (no OTP required)
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ phone: form.phone })
          .eq("id", user?.id);

        if (profileError) {
          setError(profileError.message);
        } else {
          // Also update the user metadata for consistency
          const { error: metadataError } = await supabase.auth.updateUser({
            data: {
              phone: form.phone,
            },
          });

          if (metadataError) {
            console.warn("Failed to update user metadata:", metadataError.message);
          }

          toast.success("Phone number updated successfully!");
          setFieldStates((prev) => ({ ...prev, phone: false }));
        }
      } else {
        toast.info("No changes were made to your phone number.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSavingStates((prev) => ({ ...prev, phone: false }));
    }
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSaving(true);

    if (!validatePasswordForm()) {
      setIsSaving(false);
      return;
    }

    try {
      // First verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: form.currentPassword,
      });

      if (signInError) {
        setError("Current password is incorrect.");
        setIsSaving(false);
        return;
      }

      // If current password is correct, update to new password
      const { error: pwError } = await supabase.auth.updateUser({
        password: form.password,
      });

      if (pwError) {
        setError(pwError.message);
        setIsSaving(false);
        return;
      }

      toast.success("Password updated successfully!");
      setShowPasswordChangeModal(false);
      setForm((f) => ({
        ...f,
        currentPassword: "",
        password: "",
        rePassword: "",
      }));
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const validatePasswordForm = () => {
    if (!form.currentPassword) {
      setError("Please enter your current password.");
      return false;
    }

    if (!form.password) {
      setError("Please enter a new password.");
      return false;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return false;
    }

    if (form.password !== form.rePassword) {
      setError("Passwords do not match.");
      return false;
    }

    return true;
  };

  return (
    <ProtectedRoute>
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
`,
          }}
        ></div>

        {/* Header */}
        <nav className="fixed top-0 w-full z-50 bg-black/20 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4">
            {/* Desktop Layout */}
            <div className="hidden sm:flex items-center justify-between h-20">
              <div className="flex items-center space-x-4">
                <BrandButton
                  onClick={() => navigate("/")}
                  variant="secondary"
                  size="sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Home
                </BrandButton>
              </div>

              <span className="text-2xl font-bold text-white">Settings</span>

              <BrandButton onClick={handleLogout} variant="secondary" size="sm">
                <LogOut className="w-4 h-4" />
                Sign Out
              </BrandButton>
            </div>

            {/* Mobile Layout - Stacked Vertically */}
            <div className="block sm:hidden py-4">
              <div className="flex flex-col items-center space-y-3">
                {/* Title */}
                <span className="text-xl font-bold text-white">Settings</span>

                {/* Buttons Row */}
                <div className="flex items-center space-x-3 w-full justify-center">
                  <BrandButton
                    onClick={() => navigate("/")}
                    variant="secondary"
                    size="sm"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Back to Home
                  </BrandButton>

                  <BrandButton
                    onClick={handleLogout}
                    variant="secondary"
                    size="sm"
                  >
                    <LogOut className="w-3 h-3" />
                    Sign Out
                  </BrandButton>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div className="pt-24 max-w-4xl mx-auto px-4 py-8 relative z-10">
          <Card className="bg-black/40 border-white/20 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center space-x-4 text-white">
                <Avatar className="h-16 w-16 ring-2 ring-white/10">
                  <AvatarImage
                    src={
                      user?.user_metadata?.avatar_url ||
                      user?.user_metadata?.picture
                    }
                    alt={user?.name || "Profile"}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-brand-400 to-brand-600 text-white antialiased">
                    <User className="w-8 h-8" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-xl">Profile Settings</span>
                  <span className="text-sm text-white/70">
                    {user?.name || "User"}
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <div className="bg-red-900/30 border border-red-400/50 rounded-lg p-3 backdrop-blur-sm">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Full Name Field */}
              <div className="flex flex-col md:flex-row md:items-end gap-4">
                <div className="w-full md:flex-[0_0_50%]">
                  <Label
                    htmlFor="fullName"
                    className="flex items-center space-x-2 text-white mb-2"
                  >
                    <User className="w-4 h-4" />
                    <span>Full Name</span>
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleInputChange}
                    disabled={!fieldStates.fullName}
                    className="bg-black/30 border-white/30 text-white disabled:opacity-50 backdrop-blur-sm placeholder:text-white/50"
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="flex gap-2 transition-all duration-300 ease-in-out">
                  <BrandButton
                    onClick={() => handleFieldToggle("fullName")}
                    variant={fieldStates.fullName ? "secondary" : "primary"}
                    size="sm"
                    className="w-full sm:w-auto transition-all duration-300 ease-in-out text-xs sm:text-sm"
                  >
                    {fieldStates.fullName ? "Cancel" : "Change Full Name"}
                  </BrandButton>
                  <div className={`transition-all duration-500 ease-in-out ${
                    fieldStates.fullName 
                      ? "opacity-100 scale-100 translate-x-0" 
                      : "opacity-0 scale-95 translate-x-2 pointer-events-none"
                  }`}>
                    <BrandButton
                      onClick={handleUpdateFullName}
                      disabled={savingStates.fullName}
                      variant="primary"
                      size="sm"
                      className="whitespace-nowrap"
                    >
                      {savingStates.fullName ? "Saving..." : "Save changes"}
                    </BrandButton>
                  </div>
                </div>
              </div>

              {/* Email Field */}
              <div className="flex flex-col md:flex-row md:items-end gap-4">
                <div className="w-full md:flex-[0_0_50%]">
                  <Label
                    htmlFor="email"
                    className="flex items-center space-x-2 text-white mb-2"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Email Address</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleInputChange}
                    disabled={!fieldStates.email}
                    className="bg-black/30 border-white/30 text-white disabled:opacity-50 backdrop-blur-sm placeholder:text-white/50"
                    placeholder="Enter your email"
                  />
                </div>
                <div className="flex gap-2 transition-all duration-300 ease-in-out">
                  <BrandButton
                    onClick={() => handleFieldToggle("email")}
                    variant={fieldStates.email ? "secondary" : "primary"}
                    size="sm"
                    className="w-full sm:w-auto transition-all duration-300 ease-in-out text-xs sm:text-sm"
                  >
                    {fieldStates.email ? "Cancel" : "Change Email Address"}
                  </BrandButton>
                  <div className={`transition-all duration-500 ease-in-out ${
                    fieldStates.email 
                      ? "opacity-100 scale-100 translate-x-0" 
                      : "opacity-0 scale-95 translate-x-2 pointer-events-none"
                  }`}>
                    <BrandButton
                      onClick={handleUpdateEmail}
                      disabled={savingStates.email}
                      variant="primary"
                      size="sm"
                      className="whitespace-nowrap"
                    >
                      {savingStates.email ? "Saving..." : "Save changes"}
                    </BrandButton>
                  </div>
                </div>
              </div>

              {/* Phone Number Field */}
              <div className="flex flex-col md:flex-row md:items-end gap-4">
                <div className="w-full md:flex-[0_0_50%]">
                  <Label
                    htmlFor="phone"
                    className="flex items-center space-x-2 text-white mb-2"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Phone Number</span>
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleInputChange}
                    disabled={!fieldStates.phone}
                    className="bg-black/30 border-white/30 text-white disabled:opacity-50 backdrop-blur-sm placeholder:text-white/50"
                    placeholder="Enter your phone number"
                  />
                </div>
                <div className="flex gap-2 transition-all duration-300 ease-in-out">
                  <BrandButton
                    onClick={() => handleFieldToggle("phone")}
                    variant={fieldStates.phone ? "secondary" : "primary"}
                    size="sm"
                    className="w-full sm:w-auto transition-all duration-300 ease-in-out text-xs sm:text-sm"
                  >
                    {fieldStates.phone ? "Cancel" : "Change Phone Number"}
                  </BrandButton>
                  <div className={`transition-all duration-500 ease-in-out ${
                    fieldStates.phone 
                      ? "opacity-100 scale-100 translate-x-0" 
                      : "opacity-0 scale-95 translate-x-2 pointer-events-none"
                  }`}>
                    <BrandButton
                      onClick={handleUpdatePhone}
                      disabled={savingStates.phone}
                      variant="primary"
                      size="sm"
                      className="whitespace-nowrap"
                    >
                      {savingStates.phone ? "Saving..." : "Save changes"}
                    </BrandButton>
                  </div>
                </div>
              </div>

              {/* Password Field */}
              <div className="flex flex-col md:flex-row md:items-end gap-4">
                <div className="w-full md:flex-[0_0_50%]">
                  <Label className="flex items-center space-x-2 text-white mb-2">
                    <Lock className="w-4 h-4" />
                    <span>Password</span>
                  </Label>
                  <Input
                    type="password"
                    value="••••••••••••"
                    disabled
                    className="bg-black/30 border-white/30 text-white disabled:opacity-50 backdrop-blur-sm placeholder:text-white/50"
                    placeholder="Current password"
                  />
                </div>
                <BrandButton
                  onClick={handlePasswordChangeClick}
                  variant="primary"
                  size="sm"
                  className="w-[150px] text-xs sm:text-sm"
                >
                  Change Password
                </BrandButton>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Password Change Modal */}
        <Dialog
          open={showPasswordChangeModal}
          onOpenChange={setShowPasswordChangeModal}
        >
          <DialogContent className="sm:max-w-md bg-black/80 text-white border-brand-500 backdrop-blur-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-brand-400" />
                <span>Change Password</span>
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
              {/* Current Password Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="currentPassword"
                  className="flex items-center space-x-2"
                >
                  <span>Current Password</span>
                </Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={form.currentPassword}
                    onChange={handleInputChange}
                    className="bg-black/30 border-white/30 text-white pr-10 backdrop-blur-sm placeholder:text-white/50"
                    placeholder="Enter current password"
                    autoFocus
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="newPassword"
                  className="flex items-center space-x-2"
                >
                  <span>New Password</span>
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleInputChange}
                    className="bg-black/30 border-white/30 text-white pr-10 backdrop-blur-sm placeholder:text-white/50"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm New Password Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="confirmNewPassword"
                  className="flex items-center space-x-2"
                >
                  <span>Confirm New Password</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirmNewPassword"
                    name="rePassword"
                    type={showRePassword ? "text" : "password"}
                    value={form.rePassword}
                    onChange={handleInputChange}
                    className="bg-black/30 border-white/30 text-white pr-10 backdrop-blur-sm placeholder:text-white/50"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                    onClick={() => setShowRePassword(!showRePassword)}
                  >
                    {showRePassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password rules */}
              <div className="text-xs text-white/70 bg-black/30 rounded-lg p-3 backdrop-blur-sm">
                <p className="mb-1">Password requirements:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Current password must be correct</li>
                  <li>New password must be at least 6 characters long</li>
                  <li>Both new password fields must match</li>
                </ul>
              </div>

              {error && (
                <div className="text-red-400 text-sm bg-red-900/30 border border-red-400/50 rounded p-2 backdrop-blur-sm">
                  {error}
                </div>
              )}

              <div className="flex space-x-2">
                <BrandButton
                  type="button"
                  onClick={() => {
                    setShowPasswordChangeModal(false);
                    setForm((f) => ({
                      ...f,
                      currentPassword: "",
                      password: "",
                      rePassword: "",
                    }));
                    setError("");
                  }}
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                >
                  Cancel
                </BrandButton>
                <BrandButton
                  type="submit"
                  disabled={isSaving}
                  variant="primary"
                  size="sm"
                  className="flex-1"
                >
                  {isSaving ? "Updating..." : "Update Password"}
                </BrandButton>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
};

export default Settings;
