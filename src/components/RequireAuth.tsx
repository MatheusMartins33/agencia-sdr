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

  // Não autenticado -> /auth (preserva origem para retorno pós-login)
  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  const isOnboardingRoute = location.pathname === '/onboarding';
  const hasOnboarded = Boolean(member && tenant);

  // Se estou na rota de onboarding:
  if (isOnboardingRoute) {
    // Usuário ainda não concluiu o onboarding -> permanece
    if (!hasOnboarded) return <>{children}</>;
    // Usuário já concluiu -> manda para home
    return <Navigate to="/" replace />;
  }

  // Qualquer outra rota:
  // Usuário não concluiu -> força ir para onboarding
  if (!hasOnboarded) {
    return <Navigate to="/onboarding" replace state={{ from: location }} />;
  }

  // Liberado
  return <>{children}</>;
}
