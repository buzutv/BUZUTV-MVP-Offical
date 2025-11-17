import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface AuthUser extends User {
  isAdmin?: boolean;
  name?: string;
  role?: string;
  phone?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signup: (
    email: string,
    password: string,
    name: string,
    phone?: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users who should see mock content
const demoUsers = ["user@example.com", "admin@example.com"];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        return null;
      }

      return profile;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Check if this is a demo admin user (legacy support)
        const isDemoAdmin = session.user.email === "admin@example.com";
        const userName =
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          session.user.email?.split("@")[0] ||
          "User";

        // Fetch user profile to get actual role and phone
        setTimeout(async () => {
          const profile = await fetchUserProfile(session.user.id);
          const actualRole = profile?.role || "user";
          const isActualAdmin = actualRole === "admin" || isDemoAdmin;

          setUser({
            ...session.user,
            isAdmin: isActualAdmin,
            name: userName,
            role: actualRole,
            phone: profile?.phone || null,
          });
        }, 0);

        // Set user immediately with demo admin check for faster UI response
        setUser({
          ...session.user,
          isAdmin: isDemoAdmin,
          name: userName,
          role: isDemoAdmin ? "admin" : "user",
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const isDemoAdmin = session.user.email === "admin@example.com";
        const userName =
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          session.user.email?.split("@")[0] ||
          "User";

        // Fetch user profile to get actual role and phone
        const profile = await fetchUserProfile(session.user.id);
        const actualRole = profile?.role || "user";
        const isActualAdmin = actualRole === "admin" || isDemoAdmin;

        setUser({
          ...session.user,
          isAdmin: isActualAdmin,
          name: userName,
          role: actualRole,
          phone: profile?.phone || null,
        });
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  };


  const signup = async (
    email: string,
    password: string,
    name: string,
    phone?: string,
  ) => {
    setIsLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: name,
          name: name,
          ...(phone ? { phone } : {}),
        },
      },
    });

    if (error) {
      setIsLoading(false);
      return { success: false, error: error.message };
    }

    // If signup successful and phone is provided, update the profile with phone
    if (data.user && phone) {
      try {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ phone })
          .eq("id", data.user.id);

        if (profileError) {
          console.error("Error updating profile with phone:", profileError);
        }
      } catch (error) {
        console.error("Error updating profile with phone:", error);
      }
    }

    setIsLoading(false);
    return { success: true };
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    setIsLoading(false);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const value: AuthContextType = {
    user,
    isLoggedIn: !!user,
    isLoading,
    showLoginModal,
    setShowLoginModal,
    login,
    signup,
    signInWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
