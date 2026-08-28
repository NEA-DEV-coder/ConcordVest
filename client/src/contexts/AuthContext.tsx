/**
 * ConcordVest Authentication Context
 *
 * Provides authentication state and methods using Supabase Auth.
 * Replaces the localStorage-based fake admin authentication.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  supabase,
  isSupabaseConfigured,
  type Profile,
  type UserRole,
} from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

// Auth state type
export interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isStaff: boolean;
  role: UserRole | null;
}

// Auth context type
export interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updateProfile: (
    updates: Partial<Profile>
  ) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

// Create the context
const AuthContext = createContext<AuthContextType | null>(null);

// Provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Default auth state
const defaultAuthState: AuthState = {
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,
  isEditor: false,
  isStaff: false,
  role: null,
};

// Auth provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(defaultAuthState);

  // Fetch user profile
  const fetchProfile = useCallback(
    async (userId: string): Promise<Profile | null> => {
      if (!isSupabaseConfigured()) {
        return null;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          return null;
        }

        return data;
      } catch (error) {
        console.error("Error fetching profile:", error);
        return null;
      }
    },
    []
  );

  // Update auth state
  const updateAuthState = useCallback(
    async (session: Session | null) => {
      if (!session?.user) {
        setState({
          ...defaultAuthState,
          isLoading: false,
        });
        return;
      }

      const profile = await fetchProfile(session.user.id);

      // Check if account is active. If deactivated, block auth and clean up token.
      if (profile && profile.is_active === false) {
        await supabase.auth.signOut();
        setState({
          ...defaultAuthState,
          isLoading: false,
        });
        return;
      }

      const role = profile?.role || "user";

      setState({
        user: session.user,
        profile,
        session,
        isLoading: false,
        isAuthenticated: true,
        isAdmin: role === "admin",
        isEditor: role === "admin" || role === "editor",
        isStaff: role === "admin" || role === "editor" || role === "staff",
        role,
      });
    },
    [fetchProfile]
  );

  // Initialize auth state
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setState({
        ...defaultAuthState,
        isLoading: false,
      });
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      updateAuthState(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      updateAuthState(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [updateAuthState]);

  // Sign in
  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return {
        error: new Error(
          "Supabase is not configured. Please set up your environment variables."
        ),
      };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error
            : new Error("An unknown error occurred"),
      };
    }
  }, []);

  // Sign up
  const signUp = useCallback(
    async (email: string, password: string, fullName?: string) => {
      if (!isSupabaseConfigured()) {
        return {
          error: new Error(
            "Supabase is not configured. Please set up your environment variables."
          ),
        };
      }

      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) {
          return { error: new Error(error.message) };
        }

        // Explicitly sign out right after signup to clear any automatic sessions
        await supabase.auth.signOut();

        return { error: null };
      } catch (error) {
        return {
          error:
            error instanceof Error
              ? error
              : new Error("An unknown error occurred"),
        };
      }
    },
    []
  );

  // Sign out
  const signOut = useCallback(async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error("Supabase signOut error:", err);
      }
    }
    setState(defaultAuthState);
    setState({
      ...defaultAuthState,
      isLoading: false,
    });
  }, []);

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    if (!isSupabaseConfigured()) {
      return {
        error: new Error(
          "Supabase is not configured. Please set up your environment variables."
        ),
      };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error
            : new Error("An unknown error occurred"),
      };
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      if (!isSupabaseConfigured() || !state.user) {
        return { error: new Error("Not authenticated") };
      }

      try {
        const { error } = await supabase
          .from("profiles")
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          } as never)
          .eq("id", state.user.id);

        if (error) {
          return { error: new Error(error.message) };
        }

        // Refresh profile
        await refreshProfile();

        return { error: null };
      } catch (error) {
        return {
          error:
            error instanceof Error
              ? error
              : new Error("An unknown error occurred"),
        };
      }
    },
    [state.user]
  );

  // Refresh profile
  const refreshProfile = useCallback(async () => {
    if (state.user) {
      const profile = await fetchProfile(state.user.id);
      if (profile && profile.is_active === false) {
        await signOut();
        return;
      }
      setState(prev => ({
        ...prev,
        profile,
        role: profile?.role || "user",
        isAdmin: profile?.role === "admin",
        isEditor: profile?.role === "admin" || profile?.role === "editor",
        isStaff:
          profile?.role === "admin" ||
          profile?.role === "editor" ||
          profile?.role === "staff",
      }));
    }
  }, [state.user, fetchProfile, signOut]);

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Role check utilities
export function hasRole(
  role: UserRole | null,
  requiredRole: UserRole
): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    admin: 4,
    editor: 3,
    staff: 2,
    user: 1,
  };

  if (!role) return false;
  return roleHierarchy[role] >= roleHierarchy[requiredRole];
}

export function canManageProperties(role: UserRole | null): boolean {
  return hasRole(role, "editor");
}

export function canManageProjects(role: UserRole | null): boolean {
  return hasRole(role, "editor");
}

export function canManageServices(role: UserRole | null): boolean {
  return hasRole(role, "editor");
}

export function canManageArticles(role: UserRole | null): boolean {
  return hasRole(role, "editor");
}

export function canManageLeads(role: UserRole | null): boolean {
  return hasRole(role, "staff");
}

export function canManageUsers(role: UserRole | null): boolean {
  return hasRole(role, "admin");
}

export function canAccessAdmin(role: UserRole | null): boolean {
  return hasRole(role, "staff");
}
