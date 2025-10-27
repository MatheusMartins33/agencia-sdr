import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, member, tenant, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Case 1: User is authenticated but has no tenant membership yet.
  // They must go to onboarding.
  if (!member && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // Case 2: User has a tenant, but hasn't completed onboarding.
  // They must be on the onboarding page.
  if (member && tenant?.onboarding_status !== 'done' && location.pathname !== '/onboarding') {
      return <Navigate to="/onboarding" replace />;
  }

  // Case 3: User has a tenant and has completed onboarding.
  // They should not be on the onboarding page. Redirect to dashboard.
  if (member && tenant?.onboarding_status === 'done' && location.pathname === '/onboarding') {
      return <Navigate to="/" replace />;
  }

  // Otherwise, render the requested page.
  return <>{children}</>;
}
