import { Produto, Contato, Historico } from "@/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

// Future API integration placeholder
// When DATA_SOURCE="api", this will be used instead of sheets.ts

async function apiFetch<T>(endpoint: string): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("API_BASE_URL não configurada no .env");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`);
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getProdutos(): Promise<Produto[]> {
  return apiFetch<Produto[]>("/api/produtos");
}

export async function getContatos(): Promise<Contato[]> {
  return apiFetch<Contato[]>("/api/contatos");
}

export async function getHistorico(): Promise<Historico[]> {
  return apiFetch<Historico[]>("/api/historico");
}

// Future: metrics endpoints
// export async function getMetricasOverview(dateRange: string): Promise<MetricasOverview>
// export async function getMetricasAgenteAtivo(dateRange: string): Promise<MetricasAgenteAtivo>
// etc.
