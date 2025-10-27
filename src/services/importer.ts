type ImportPayload = {
  rows: string[][];
  dry_run?: boolean;
  confirm?: boolean;
};

export type ImportResponse = {
  success: boolean;
  message?: string;
  to_create?: Array<{ id: string; [key: string]: any }>;
  to_update?: Array<{ id: string; [key: string]: any }>;
  sample?: { create_sample?: any[]; update_sample?: any[] };
};

async function postJSON(
  url: string,
  body: ImportPayload,
  useQueryToken = false
): Promise<ImportResponse> {
  const token = import.meta.env.VITE_IMPORT_TOKEN || '';
  const target = useQueryToken
    ? `${url}?token=${encodeURIComponent(token)}`
    : url;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (!useQueryToken && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(target, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`Erro na importação: ${res.status} ${errorText}`);
  }

  return res.json();
}

export const importer = {
  dryRunProdutos: (rows: string[][], tenantId: string, useQueryToken = false) => {
    if (!tenantId) throw new Error("Tenant ID é obrigatório para a importação.");
    const baseUrl = import.meta.env.VITE_IMPORT_URL_PRODUTOS;
    const targetUrl = `${baseUrl}/${tenantId}`;
    return postJSON(targetUrl, { rows, dry_run: true }, useQueryToken);
  },

  confirmProdutos: (rows: string[][], tenantId: string, useQueryToken = false) => {
    if (!tenantId) throw new Error("Tenant ID é obrigatório para a importação.");
    const baseUrl = import.meta.env.VITE_IMPORT_URL_PRODUTOS;
    const targetUrl = `${baseUrl}/${tenantId}`;
    return postJSON(targetUrl, { rows, confirm: true }, useQueryToken);
  },

  dryRunContatos: (rows: string[][], tenantId: string, useQueryToken = false) => {
    if (!tenantId) throw new Error("Tenant ID é obrigatório para a importação.");
    const baseUrl = import.meta.env.VITE_IMPORT_URL_CONTATOS;
    const targetUrl = `${baseUrl}/${tenantId}`;
    return postJSON(targetUrl, { rows, dry_run: true }, useQueryToken);
  },

  confirmContatos: (rows: string[][], tenantId: string, useQueryToken = false) => {
    if (!tenantId) throw new Error("Tenant ID é obrigatório para a importação.");
    const baseUrl = import.meta.env.VITE_IMPORT_URL_CONTATOS;
    const targetUrl = `${baseUrl}/${tenantId}`;
    return postJSON(targetUrl, { rows, confirm: true }, useQueryToken);
  }
};
