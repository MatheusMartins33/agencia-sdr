import { useQuery } from "@tanstack/react-query";
import { getContatos } from "@/services/supabaseService";
import { useAuth } from "@/contexts/AuthContext";

export function useContatos() {
  const { member } = useAuth();
  const tenantId = member?.tenant_id;

  return useQuery({
    // Inclui o tenantId na chave da query para garantir que os dados 
    // sejam recarregados e cacheados por tenant.
    queryKey: ["contatos", tenantId],
    
    // A função da query agora passa o tenantId para o serviço
    queryFn: () => getContatos(tenantId!),
    
    // A query só será executada quando o tenantId estiver disponível.
    enabled: !!tenantId,
    
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
