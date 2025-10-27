import { Produto, Contato, Historico } from "@/types";
import { produtosFixture, contatosFixture, historicoFixture } from "@/lib/fixtures";

const DATA_SOURCE = import.meta.env.VITE_DATA_SOURCE || "demo";
const SHEETS_API_KEY = import.meta.env.VITE_SHEETS_API_KEY || "";
const SHEETS_SPREADSHEET_ID = import.meta.env.VITE_SHEETS_SPREADSHEET_ID || "";
const SHEETS_TAB_PRODUTOS = import.meta.env.VITE_SHEETS_TAB_PRODUTOS || "PRODUTOS";
const SHEETS_TAB_CONTATOS = import.meta.env.VITE_SHEETS_TAB_CONTATOS || "CONTATOS";
const SHEETS_TAB_HISTORICO = import.meta.env.VITE_SHEETS_TAB_HISTORICO || "HISTORICO";

// Google Sheets API integration
async function fetchSheetData(tabName: string): Promise<any[]> {
  if (DATA_SOURCE === "demo") {
    // Return fixtures for demo mode
    if (tabName === SHEETS_TAB_PRODUTOS) return produtosFixture;
    if (tabName === SHEETS_TAB_CONTATOS) return contatosFixture;
    if (tabName === SHEETS_TAB_HISTORICO) return historicoFixture;
    return [];
  }

  if (!SHEETS_API_KEY || !SHEETS_SPREADSHEET_ID) {
    throw new Error("Google Sheets API não configurada. Configure VITE_SHEETS_API_KEY e VITE_SHEETS_SPREADSHEET_ID no .env");
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_SPREADSHEET_ID}/values/${tabName}?key=${SHEETS_API_KEY}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erro ao buscar dados: ${response.statusText}`);
    }
    
    const data = await response.json();
    const rows = data.values || [];
    
    if (rows.length === 0) return [];
    
    // First row is header
    const headers = rows[0];
    const items = rows.slice(1).map((row: any[]) => {
      const item: any = {};
      headers.forEach((header: string, index: number) => {
        item[header] = row[index] !== undefined ? row[index] : null;
      });
      return item;
    });
    
    return items;
  } catch (error) {
    console.error("Erro ao buscar dados do Google Sheets:", error);
    throw error;
  }
}

// Mappers: raw sheet data → typed models
function mapProduto(raw: any): Produto {
  return {
    tenant_id: raw.tenant_id || "",
    id_produto: raw.id_produto || "",
    nome_produto: raw.nome_produto || "",
    descricao: raw.descricao || "",
    quantidade: parseInt(raw.quantidade) || 0,
    preco_normal: parseFloat(raw.preco_normal) || 0,
    preco_promo: raw.preco_promo ? parseFloat(raw.preco_promo) : null,
    link_foto: raw.link_foto || null,
    validade_promo: raw.validade_promo || null,
  };
}
function mapContato(raw: any): Contato {
  return {
    tenant_id: raw.tenant_id || "",
    id_lead: raw.id_lead || "",
    nome: raw.nome || "",
    telefone: raw.telefone || null,
    email: raw.email || null,
    empresa: raw.empresa || null,
    segmento: raw.segmento || null,
    score: parseInt(raw.score) || 0,
    status: (raw.status || "novo") as any,
    ultima_interacao: raw.ultima_interacao || null,
  };
}
function mapHistorico(raw: any): Historico {
  return {
    tenant_id: raw.tenant_id || "",
    id_historico: raw.id_historico || "",
    id_lead: raw.id_lead || "",
    timestamp: raw.timestamp || "",
    tipo_agente: raw.tipo_agente || "ativo",
    mensagem_enviada: raw.mensagem_enviada || null,
    resposta_cliente: raw.resposta_cliente || null,
    produto_relacionado: raw.produto_relacionado || null,
    acao_tomada: raw.acao_tomada || null,
  };
}
  ;

// Public API
export async function getProdutos(): Promise<Produto[]> {
  const data = await fetchSheetData(SHEETS_TAB_PRODUTOS);
  return data.map(mapProduto);
}

export async function getContatos(): Promise<Contato[]> {
  const data = await fetchSheetData(SHEETS_TAB_CONTATOS);
  return data.map(mapContato);
}

export async function getHistorico(): Promise<Historico[]> {
  const data = await fetchSheetData(SHEETS_TAB_HISTORICO);
  return data.map(mapHistorico);
}
