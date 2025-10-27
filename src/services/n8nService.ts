/**
 * Cria um novo workflow no n8n enviando a estrutura JSON completa.
 * 
 * @param workflowJson O objeto JSON completo que define o workflow.
 * @returns A resposta da API do n8n, geralmente um objeto com o ID do novo workflow.
 */
export async function createWorkflow(workflowJson: object): Promise<any> {
  const n8nUrl = import.meta.env.VITE_N8N_URL;
  const n8nApiKey = import.meta.env.VITE_N8N_API_KEY;

  if (!n8nUrl || !n8nApiKey) {
    throw new Error("As variáveis de ambiente VITE_N8N_URL ou VITE_N8N_API_KEY não estão definidas.");
  }

  const fullUrl = `${n8nUrl}/api/v1/workflows`;

  const response = await fetch(fullUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': n8nApiKey,
    },
    body: JSON.stringify(workflowJson),
  });

  if (!response.ok) {
    const errorResponse = await response.json().catch(() => ({ message: response.statusText }));
    console.error("Erro ao criar workflow no n8n:", errorResponse);
    throw new Error(errorResponse.message || "Falha ao se comunicar com a API do n8n.");
  }

  return response.json();
}