import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Tenant } from '@/types';

// Tipos locais de credenciais e membership
interface Credentials {
  email: string;
  password: string;
}

export interface TenantMember {
  tenant_id: string;
  role: 'owner' | 'admin' | 'member';
}

interface AuthContextType {
  user: User | null;
  member: TenantMember | null;
  tenant: Tenant | null;
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
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  // Busca membership + tenant coerentemente
  const fetchUserContext = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setMember(null);
      setTenant(null);
      return;
    }

    // 1) Membership mais recente
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

    if (!memberData) {
      // Sem membership
      setMember(null);
      setTenant(null);
      return;
    }

    setMember(memberData as TenantMember);

    // 2) Buscar tenant
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', memberData.tenant_id)
      .single();

    if (tenantError) {
      console.error('Error fetching tenant details:', tenantError.message);
      // Estado consistente: sem tenant => também zera member
      setMember(null);
      setTenant(null);
      return;
    }

    setTenant(tenantData as Tenant);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        if (!isMounted) return;
        setUser(currentUser);
        await fetchUserContext(currentUser);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (event === 'SIGNED_OUT') {
          setMember(null);
          setTenant(null);
        } else if (event === 'SIGNED_IN') {
          await fetchUserContext(currentUser);
        }
      }
    );

    return () => {
      isMounted = false;
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
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      await fetchUserContext(currentUser);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
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

  // Evita recriar o objeto value a cada render
  const value: AuthContextType = useMemo(
    () => ({
      user,
      member,
      tenant,
      loading,
      login,
      logout,
      refreshTenant,
      signIn,
      signUp,
    }),
    [user, member, tenant, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
