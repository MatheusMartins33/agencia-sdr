import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Tenant } from '@/types'; // Import Tenant type

// Local Credentials type for sign-in (ensure it matches your backend auth fields)
interface Credentials {
  email: string;
  password: string;
}

// Represents the user's membership in a tenant
export interface TenantMember {
  tenant_id: string;
  role: 'owner' | 'admin' | 'member';
}

interface AuthContextType {
  user: User | null;
  member: TenantMember | null;
  tenant: Tenant | null; // <-- Add tenant to context
  loading: boolean;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshTenant: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<TenantMember | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null); // <-- Add tenant state
  const [loading, setLoading] = useState(true);

  // Fetches both membership and tenant details
  const fetchUserContext = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setMember(null);
      setTenant(null);
      return;
    }

    // 1. Fetch user's LATEST membership in case they have multiple
    const { data: memberData, error: memberError } = await supabase
      .from('tenant_members')
      .select('tenant_id, role')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (memberError) {
      console.error('Error fetching tenant membership:', memberError.message);
      setMember(null);
      setTenant(null);
      return;
    }

    if (memberData) {
      setMember(memberData as TenantMember);

      // 2. Fetch tenant details using the tenant_id from membership
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', memberData.tenant_id)
        .single(); // .single() is fine here, as a member MUST have a tenant

      if (tenantError) {
        console.error('Error fetching tenant details:', tenantError.message);
        // We have a member but can't get tenant details, a broken state.
        setTenant(null);
      } else {
        setTenant(tenantData as Tenant);
      }
    } else {
      // No membership found
      setMember(null);
      setTenant(null);
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      await fetchUserContext(currentUser); // Use the new function
      setLoading(false);
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (event === 'SIGNED_OUT') {
          setMember(null);
          setTenant(null); // Clear tenant on sign out
        } else if (event === 'SIGNED_IN') {
          await fetchUserContext(currentUser); // Use the new function
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchUserContext]);

  const login = async (credentials: Credentials) => {
    const { error } = await supabase.auth.signInWithPassword(credentials);
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const refreshTenant = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const currentUser = session?.user ?? null;
    setUser(currentUser);
    await fetchUserContext(currentUser); // Use the new function
    setLoading(false);
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + '/auth',
        },
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const value = {
    user,
    member,
    tenant, // <-- Expose tenant
    loading,
    login,
    logout,
    refreshTenant,
    signIn,
    signUp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
