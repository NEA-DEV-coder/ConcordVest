/**
 * ConcordVest Staff Profile Management Hook
 *
 * Provides operations to list all profiles, promote/change user roles,
 * and activate/deactivate staff accounts from Supabase.
 */

import { useState, useEffect, useCallback } from "react";
import {
  supabase,
  isSupabaseConfigured,
  type Profile,
  type UserRole,
} from "@/lib/supabase";

export interface StaffProfile {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

// Convert database profile record to client StaffProfile
export function profileDbToStaff(p: any): StaffProfile {
  return {
    id: p.id,
    email: p.email,
    fullName: p.full_name,
    phone: p.phone,
    avatarUrl: p.avatar_url,
    role: p.role || "user",
    isActive: p.is_active !== false, // default true if undefined
    createdAt: p.created_at || new Date().toISOString(),
  };
}

export function useStaff(): {
  staff: StaffProfile[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  updateRole: (id: string, role: UserRole) => Promise<{ error: Error | null }>;
  toggleActive: (
    id: string,
    isActive: boolean
  ) => Promise<{ error: Error | null }>;
} {
  const [data, setData] = useState<StaffProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStaff = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      // Mock profiles in prototype/demo mode
      setData([
        {
          id: "staff-001",
          email: "nadia@concordvest.com",
          fullName: "Nadia Ibrahim",
          phone: "0815 123 4567",
          avatarUrl: null,
          role: "admin",
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "staff-002",
          email: "tobi@concordvest.com",
          fullName: "Tobi Adeyemi",
          phone: "0803 234 5678",
          avatarUrl: null,
          role: "staff",
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "staff-003",
          email: "mariam@concordvest.com",
          fullName: "Mariam Bello",
          phone: "0903 345 6789",
          avatarUrl: null,
          role: "editor",
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "staff-004",
          email: "kelechi@concordvest.com",
          fullName: "Kelechi Okoro",
          phone: "0815 456 7890",
          avatarUrl: null,
          role: "editor",
          isActive: false,
          createdAt: new Date().toISOString(),
        },
      ]);
      setIsLoading(false);
      return;
    }

    try {
      const { data: result, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .order("role", { ascending: true })
        .order("full_name", { ascending: true });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setData((result || []).map(profileDbToStaff));
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch staff profiles")
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateRole = useCallback(
    async (id: string, role: UserRole): Promise<{ error: Error | null }> => {
      if (!isSupabaseConfigured()) {
        setData(prev =>
          prev.map(item => (item.id === id ? { ...item, role } : item))
        );
        return { error: null };
      }

      try {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ role } as never)
          .eq("id", id);

        if (updateError) {
          return { error: new Error(updateError.message) };
        }

        await fetchStaff();
        return { error: null };
      } catch (err) {
        return {
          error:
            err instanceof Error
              ? err
              : new Error("Failed to update staff role"),
        };
      }
    },
    [fetchStaff]
  );

  const toggleActive = useCallback(
    async (id: string, isActive: boolean): Promise<{ error: Error | null }> => {
      if (!isSupabaseConfigured()) {
        setData(prev =>
          prev.map(item => (item.id === id ? { ...item, isActive } : item))
        );
        return { error: null };
      }

      try {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ is_active: isActive } as never)
          .eq("id", id);

        if (updateError) {
          return { error: new Error(updateError.message) };
        }

        await fetchStaff();
        return { error: null };
      } catch (err) {
        return {
          error:
            err instanceof Error
              ? err
              : new Error("Failed to update active status"),
        };
      }
    },
    [fetchStaff]
  );

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  return {
    staff: data,
    isLoading,
    error,
    refetch: fetchStaff,
    updateRole,
    toggleActive,
  };
}
