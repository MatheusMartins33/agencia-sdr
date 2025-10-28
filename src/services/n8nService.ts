/**
 * Cria um novo workflow no n8n enviando a estrutura JSON completa.
 * 
 * @param workflowJson O objeto JSON completo que define o workflow.
 * @returns A resposta da API do n8n, geralmente um objeto com o ID do novo workflow.
 */
export async function createWorkflow(workflowJson: object): Promise<any> {
  const n8nUrl = '/api'; // Use the proxy path
  const n8nApiKey = import.meta.env.VITE_N8N_API_KEY;

  if (!n8nApiKey) {
    throw new Error("A variável de ambiente VITE_N8N_API_KEY não está definida.");
  }

  const fullUrl = `${n8nUrl}/v1/workflows`; // Corrected path

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

export async function updateWorkflow(workflowId: string, workflowJson: object): Promise<any> {
  const n8nUrl = '/api'; // Use the proxy path
  const n8nApiKey = import.meta.env.VITE_N8N_API_KEY;

  if (!n8nApiKey) {
    throw new Error("A variável de ambiente VITE_N8N_API_KEY não está definida.");
  }

  const fullUrl = `${n8nUrl}/v1/workflows/${workflowId}`; // Corrected path

  const response = await fetch(fullUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': n8nApiKey,
    },
    body: JSON.stringify(workflowJson),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update n8n workflow: ${errorText}`);
  }

  return response.json();
}