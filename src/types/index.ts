// ==========================================
// TIPOS DO SISTEMA - Alinhado com Schema Supabase
// ==========================================

/**
 * Range de datas para filtros
 */
export type DateRange = '7d' | '30d' | '90d' | 'all';

/**
 * Tenant (Loja/Empresa)
 */
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  owner_user_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Status de conexão do canal (WhatsApp)
 * Alinhado com ENUM evo_status do Supabase
 */
export type ChannelStatus = 
  | 'CREATED'         // Criado, mas não inicializado
  | 'PENDING_QR'      // Aguardando leitura do QR Code
  | 'CONNECTED'       // Conectado e funcionando
  | 'DISCONNECTED'    // Desconectado
  | 'ERROR';          // Erro na conexão

/**
 * Configurações do canal de comunicação (Evolution API)
 */
export interface ChannelSettings {
  id: string;
  tenant_id: string;
  evo_base_url: string;
  instance_name: string;
  instance_token: string;
  webhook_url_inbound: string;
  webhook_events: string[];
  status: ChannelStatus;
  wa_number?: string | null;
  last_error?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Tipo de agente
 */
export type AgentType = 'ativo' | 'reativo';

/**
 * Configuração de um agente (ativo ou reativo)
 */
export interface AgentConfig {
  id: string;
  tenant_id: string;
  agent: AgentType;
  system_prompt: string;
  version: number;
  active: boolean;
  trigger_config?: {
    type: 'schedule';
    hour: number;
  } | null;
  created_at: string;
  updated_at: string;
}

/**
 * Status do lead/contato
 */
export type StatusLead = 'novo' | 'contatado' | 'qualificado' | 'convertido' | 'perdido';

/**
 * Produto
 */
export interface Produto {
  id_produto: string;
  tenant_id: string;
  nome_produto: string;
  descricao?: string | null;
  quantidade?: number;
  preco_normal?: number | null;
  preco_promo?: number | null;
  link_foto?: string | null;
  validade_promo?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Contato/Lead
 */
export interface Contato {
  id_lead: string;
  tenant_id: string;
  nome: string;
  telefone?: string | null;
  email?: string | null;
  empresa?: string | null;
  segmento?: string | null;
  score?: number | null;
  status?: StatusLead;
  ultima_interacao?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Tipo de agente no histórico
 */
export type TipoAgente = 'ativo' | 'reativo';

/**
 * Histórico de interações
 */
export interface Historico {
  id_historico: string;
  tenant_id: string;
  id_lead?: string | null;
  timestamp: string;
  tipo_agente: TipoAgente;
  mensagem_enviada?: string | null;
  resposta_cliente?: string | null;
  produto_relacionado?: string | null;
  acao_tomada?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Membro do tenant
 */
export interface TenantMember {
  tenant_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
}

/**
 * Limites do tenant
 */
export interface TenantLimits {
  tenant_id: string;
  daily_cap_messages: number;
  per_lead_per_day: number;
  per_lead_per_week: number;
  quiet_hours_start: string;
  quiet_hours_end: string;
  rate_per_minute: number;
  created_at: string;
  updated_at: string;
}

/**
 * Tipo de upload
 */
export type UploadKind = 'produtos' | 'contatos';

/**
 * Upload de dados
 */
export interface Upload {
  id: string;
  tenant_id: string;
  kind: UploadKind;
  filename: string;
  total_rows: number;
  inserted: number;
  updated: number;
  failed: number;
  report?: any;
  created_at: string;
}

/**
 * Execução de agente
 */
export interface AgentRun {
  id: string;
  tenant_id: string;
  agent: AgentType;
  direction: 'inbound' | 'outbound';
  status: 'pending' | 'running' | 'success' | 'failed';
  correlation_id?: string | null;
  lead_id?: string | null;
  product_id?: string | null;
  intent?: string | null;
  confidence?: number | null;
  latency_ms?: number | null;
  payload_in?: any;
  payload_out?: any;
  error_message?: string | null;
  created_at: string;
}

/**
 * Arquivo CSV parseado
 */
export interface ParsedFile {
  data: any[];
  fileName: string;
  headers: string[];
}

/**
 * Resposta da Evolution API - QR Code
 */
export interface EvolutionQRResponse {
  base64?: string;
  code?: string;
}

/**
 * Resposta da Evolution API - Status da Instância
 */
export interface EvolutionInstanceStatus {
  instance: {
    instanceName: string;
    status: string;
  };
  state: 'open' | 'close' | 'connecting';
}

/**
 * Configuração de workflow do n8n
 */
export interface N8nWorkflow {
  id?: string;
  name: string;
  nodes: N8nNode[];
  connections: Record<string, any>;
  settings?: Record<string, any>;
  active?: boolean;
}

/**
 * Nó do workflow n8n
 */
export interface N8nNode {
  id: string;
  name: string;
  type: string;
  position: [number, number];
  parameters: Record<string, any>;
}

/**
 * Contexto de autenticação
 */
export interface AuthContextType {
  user: any | null;
  tenant: Tenant | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshTenant: () => Promise<void>;
}

/**
 * Props comuns de componentes
 */
export interface StepProps {
  onNext: () => void;
  onBack: () => void;
}

export interface TenantStepProps {
  tenant: Tenant;
  onNext: () => void;
  onBack: () => void;
}