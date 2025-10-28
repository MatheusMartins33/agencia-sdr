import { ChannelSettings } from "@/types";

const getHeaders = (apiKey: string) => ({
  'Content-Type': 'application/json',
  'apikey': apiKey,
});

/**
 * Cria uma nova instância na Evolution API.
 */
export async function createInstance(settings: ChannelSettings) {
  const { evo_base_url, instance_name, instance_token } = settings;
  const apiKey = import.meta.env.VITE_EVOLUTION_API_KEY;

  console.debug('[Evolution API] Criando instância:', {
    url: `${evo_base_url}/instance/create`,
    instance_name,
    hasToken: !!instance_token,
    hasApiKey: !!apiKey
  });

  if (!apiKey) {
    throw new Error("Variável de ambiente VITE_EVOLUTION_API_KEY não está definida.");
  }

  try {
    const response = await fetch(`${evo_base_url}/instance/create`, {
      method: 'POST',
      headers: getHeaders(apiKey),
      body: JSON.stringify({
        instanceName: instance_name,
        token: instance_token,
        // Solicita o QR code na criação
        qrcode: true,
        // Define a integração padrão ou usa a definição nas settings
        integration: (settings as any).integration || 'WHATSAPP-BAILEYS',
        // Define o número de WhatsApp se estiver disponível nos settings
        ...(settings.wa_number ? { number: settings.wa_number } : {}),
      }),
    });

    // Log da resposta para debug
    const responseText = await response.text();
    console.debug('[Evolution API] Resposta:', {
      status: response.status,
      ok: response.ok,
      response: responseText
    });

    let responseData;
    try {
        responseData = JSON.parse(responseText);
    } catch (e) {
        responseData = {};
    }

    // Caso a instância já exista (status 409 ou 403), tratamos como sucesso parcial
    // A documentação indica que um 403 também pode ser devolvido quando a instância
    // já foi criada anteriormente. Não analisamos o corpo da mensagem aqui para
    // simplificar o fluxo.
    const alreadyExists = response.status === 409 || response.status === 403;
    if (alreadyExists) {
      console.warn('A instância da Evolution API já existe:', instance_name);
      // retornamos um objeto mínimo com o nome da instância para indicar sucesso
      return { instance: { instanceName: instance_name } };
    }

    if (!response.ok) {
      throw new Error(`Falha ao criar instância: ${responseText}`);
    }

    return responseData;
  } catch (error) {
    console.error('[Evolution API] Erro ao criar instância:', error);
    throw error;
  }
}

/**
 * Busca o QR code de uma instância como uma string base64.
 */
export async function getInstanceQrCode(settings: ChannelSettings): Promise<{ qrCode: string; pairingCode: string }> {
  const { evo_base_url, instance_name } = settings;
  const apiKey = import.meta.env.VITE_EVOLUTION_API_KEY;

  if (!apiKey) {
    throw new Error("Variável de ambiente VITE_EVOLUTION_API_KEY não está definida.");
  }

  let response = await fetch(`${evo_base_url}/instance/connect/${instance_name}`, {
    headers: getHeaders(apiKey),
  });

  // Se a instância não for encontrada (404), tenta recriá-la e busca o QR novamente.
  if (response.status === 404) {
    console.warn(`Instância ${instance_name} não encontrada (404). Tentando recriar...`);
    try {
      await createInstance(settings);
      // Tenta novamente buscar o QR code após a recriação
      response = await fetch(`${evo_base_url}/instance/connect/${instance_name}`, {
        headers: getHeaders(apiKey),
      });
    } catch (creationError: any) {
      console.error(`Falha ao recriar a instância ${instance_name}:`, creationError);
      // Propaga um erro claro se a recriação falhar
      throw new Error(`A instância não foi encontrada e a tentativa de recriação falhou: ${creationError.message}`);
    }
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'sem corpo de resposta');
    throw new Error(`Falha ao buscar QR code da instância. Status: ${response.status}, Resposta: ${errorText}`);
  }

  const data = await response.json();
  
  // O campo 'base64' contém a data URL completa do QR code.
  // Extraímos apenas a parte base64.
  const qrCode = data.base64.startsWith('data:image/png;base64,')
    ? data.base64.substring('data:image/png;base64,'.length)
    : data.base64;

  return { qrCode: qrCode, pairingCode: data.pairingCode };
}

/**
 * Busca o status de uma instância.
 */
export async function getInstanceStatus(settings: ChannelSettings): Promise<{ status: string, qrcode?: string }> {
    const { evo_base_url, instance_name } = settings;
    const apiKey = import.meta.env.VITE_EVOLUTION_API_KEY;

    if (!apiKey) {
        throw new Error("Variável de ambiente VITE_EVOLUTION_API_KEY não está definida.");
    }

    const response = await fetch(`${evo_base_url}/instance/connectionState/${instance_name}`, {
        headers: getHeaders(apiKey),
    });

    if (!response.ok) {
        throw new Error('Falha ao buscar status da instância.');
    }

    const data = await response.json();
    /*
     * A API de ConnectionState pode retornar diferentes formatos:
     * 1) { "instance": { "instanceName": "teste", "state": "open" } }
     * 2) { "state": "open" }
     * 3) { "status": "open" }
     * Para garantir compatibilidade, tentamos obter a propriedade de todas as formas.
     */
    const state = data?.instance?.state || data?.state || data?.status;
    return { status: state };
}

/**
 * Registra ou atualiza o webhook de uma instância na Evolution API.
 * Consulte a documentação oficial: a chamada deve ser feita após a criação do workflow,
 * quando o n8n gera a URL definitiva do webhook.
 * @param evoBaseUrl URL base da Evolution API.
 * @param instanceName Nome da instância criada.
 * @param webhookUrl URL do webhook que deve ser notificado.
 * @param events Lista de eventos a serem enviados (por exemplo: ["MESSAGES_UPSERT"]).
 */
export async function setWebhook(
  evoBaseUrl: string,
  instanceName: string,
  webhookUrl: string,
  events: string[] = ['MESSAGES_UPSERT']
) {
  const apiKey = import.meta.env.VITE_EVOLUTION_API_KEY;
  if (!apiKey) {
    throw new Error('Variável de ambiente VITE_EVOLUTION_API_KEY não está definida.');
  }
  const response = await fetch(`${evoBaseUrl}/webhook/set/${instanceName}`, {
    method: 'POST',
    headers: getHeaders(apiKey),
    body: JSON.stringify({
      url: webhookUrl,
      webhook_by_events: true,
      webhook_base64: true,
      events,
    }),
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Falha ao configurar webhook: ${errorText || response.statusText}`);
  }
  return response.json().catch(() => null);
}