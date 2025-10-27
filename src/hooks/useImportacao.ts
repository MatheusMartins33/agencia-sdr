import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importer, ImportResponse } from "@/services/importer";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// As variáveis da mutação agora são um objeto para maior clareza
type ImportVariables = {
  rows: string[][];
  useQueryToken: boolean;
}

export function useImportacao() {
  const queryClient = useQueryClient();
  const { member } = useAuth();
  const tenantId = member?.tenant_id;

  const dryRunProdutos = useMutation({
    mutationFn: (vars: ImportVariables) => {
      if (!tenantId) throw new Error("O tenant não foi carregado.");
      return importer.dryRunProdutos(vars.rows, tenantId, vars.useQueryToken);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na validação",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const confirmProdutos = useMutation({
    mutationFn: (vars: ImportVariables) => {
      if (!tenantId) throw new Error("O tenant não foi carregado.");
      return importer.confirmProdutos(vars.rows, tenantId, vars.useQueryToken);
    },
    onSuccess: (data: ImportResponse) => {
      // Invalida a query usando a chave correta, que agora inclui o tenantId
      queryClient.invalidateQueries({ queryKey: ["produtos", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["metrics", tenantId] });
      toast({
        title: "Produtos importados!",
        description: data.message || "Dados atualizados com sucesso"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const dryRunContatos = useMutation({
    mutationFn: (vars: ImportVariables) => {
      if (!tenantId) throw new Error("O tenant não foi carregado.");
      return importer.dryRunContatos(vars.rows, tenantId, vars.useQueryToken);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na validação",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const confirmContatos = useMutation({
    mutationFn: (vars: ImportVariables) => {
      if (!tenantId) throw new Error("O tenant não foi carregado.");
      return importer.confirmContatos(vars.rows, tenantId, vars.useQueryToken);
    },
    onSuccess: (data: ImportResponse) => {
      // Invalida a query usando a chave correta, que agora inclui o tenantId
      queryClient.invalidateQueries({ queryKey: ["contatos", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["metrics", tenantId] });
      toast({
        title: "Contatos importados!",
        description: data.message || "Dados atualizados com sucesso"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return {
    dryRunProdutos,
    confirmProdutos,
    dryRunContatos,
    confirmContatos
  };
}
