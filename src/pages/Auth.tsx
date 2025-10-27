import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthForm } from '@/components/AuthForm';

export default function Auth() {
  const { user, member } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (!member) {
        // Se o usuário não tem tenant, redireciona para onboarding
        navigate('/onboarding', { replace: true });
      } else {
        // Se já tem tenant, redireciona para ingestão
        navigate('/ingestao', { replace: true });
      }
    }
  }, [user, member, navigate]);

  return <AuthForm />;
}
