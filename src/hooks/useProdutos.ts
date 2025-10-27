import { useQuery } from "@tanstack/react-query";
import { getProdutos } from "@/services/supabaseService";
import { useAuth } from "@/contexts/AuthContext";

export function useProdutos() {
  const { member } = useAuth();
  const tenantId = member?.tenant_id;

  return useQuery({
    // Inclui o tenantId na chave da query para garantir que os dados 
    // sejam recarregados e cacheados por tenant.
    queryKey: ["produtos", tenantId],
    
    // A função da query agora passa o tenantId para o serviço
    queryFn: () => getProdutos(tenantId!),
    
    // A query só será executada quando o tenantId estiver disponível.
    enabled: !!tenantId,
    
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
