// ==========================================
// TIPOS DO SISTEMA - Alinhado com Schema Supabase
// Gerado a partir do schema público (análise automática)
// ==========================================

/**
 * Range de datas para filtros
 */
export type DateRange = '7d' | '30d' | '90d' | 'all';

/**
 * Onboarding status — DB tem default 'not_started'. 
 * Verifique se o DB aceita 'in_progress' e 'completed' se necessário.
 */
export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed';

/**
 * Tenant (Loja/Empresa)
 */
export interface Tenant {
  id: string; // uuid
  name: string;
  slug: string;
  owner_user_id: string; // uuid
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
  onboarding_status: OnboardingStatus;
}

/**
 * Channel (Evolution) status — alinhado com enum DB evo_status
 * DB values observed: CREATED, PENDING_QR, CONNECTED, ERROR
 * (Removi DISCONNECTED pois não foi visto no enum do DB)
 */
export type ChannelStatus = 'CREATED' | 'PENDING_QR' | 'CONNECTED' | 'ERROR';

/**
 * Configurações do canal de comunicação (Evolution API)
 */
export interface ChannelSettings {
  id: string; // uuid
  tenant_id: string; // uuid
  evo_base_url: string;
  instance_name: string;
  instance_token: string;
  webhook_url_inbound: string;
  webhook_events: string[]; // jsonb default ['MESSAGES_UPSERT']
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
 * Trigger config — DB armazena jsonb. Supondo padrão 'schedule' mas aceitando outros formatos.
 * Se o json for sempre { type: 'schedule', hour: number, timezone?: string }:
 *  - use ScheduleTriggerConfig
 * Caso haja outros formatos, mantenho Record<string, any>.
 */
export interface ScheduleTriggerConfig {
  type: 'schedule';
  hour: number;
  timezone?: string;
}

export type TriggerConfig = ScheduleTriggerConfig | Record<string, any> | null;

/**
 * Configuração de um agente (ativo ou reativo)
 */
export interface AgentConfig {
  id: string; // uuid
  tenant_id: string; // uuid
  agent: AgentType;
  name?: string | null;
  system_prompt: string;
  version: number;
  active: boolean;
  trigger_config?: TriggerConfig;
  created_at: string;
  updated_at: string;
  n8n_workflow_id?: string | null;
}

/**
 * Agent config version (adicionado — tabela agent_config_versions)
 */
export interface AgentConfigVersion {
  id: string; // uuid
  agent_config_id: string; // uuid
  tenant_id: string; // uuid
  agent: AgentType;
  version: number;
  system_prompt: string;
  changelog?: string | null;
  created_at: string;
}

/**
 * Status de lead/contato — alinhado com enum DB status_lead
 * DB values observed: novo, contatado, respondeu, convertido, perdido
 *
 * Nota: seu TS anterior tinha 'qualificado' em vez de 'respondeu'.
 * Mantive o valor do DB ('respondeu'). Ajuste se preferir 'qualificado'.
 */
export type StatusLead = 'novo' | 'contatado' | 'respondeu' | 'convertido' | 'perdido';

/**
 * Produto
 */
export interface Produto {
  id_produto: string; // texto PK
  tenant_id: string; // uuid
  nome_produto: string;
  descricao?: string | null;
  quantidade?: number; // integer (default 0)
  preco_normal?: number | null; // numeric
  preco_promo?: number | null; // numeric
  link_foto?: string | null;
  validade_promo?: string | null; // date => representado como string
  created_at?: string;
  updated_at?: string;
}

/**
 * Contato/Lead
 */
export interface Contato {
  id_lead: string; // text PK
  tenant_id: string; // uuid
  nome: string;
  telefone?: string | null;
  email?: string | null;
  empresa?: string | null;
  segmento?: string | null;
  score?: number | null; // integer 0..100
  status?: StatusLead;
  ultima_interacao?: string | null; // timestamptz
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
  id_historico: string; // text PK
  tenant_id: string; // uuid
  id_lead?: string | null; // text FK -> contatos.id_lead
  timestamp: string; // timestamptz
  tipo_agente: TipoAgente;
  mensagem_enviada?: string | null;
  resposta_cliente?: string | null;
  produto_relacionado?: string | null; // text FK -> produtos.id_produto
  acao_tomada?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Membro do tenant
 */
export interface TenantMember {
  tenant_id: string; // uuid
  user_id: string; // uuid
  role: 'owner' | 'admin' | 'member';
  created_at: string;
}

/**
 * Limites do tenant
 */
export interface TenantLimits {
  tenant_id: string; // uuid (PK)
  daily_cap_messages: number;
  per_lead_per_day: number;
  per_lead_per_week: number;
  quiet_hours_start: string; // DB type time, representado como 'HH:MM:SS'
  quiet_hours_end: string;   // DB type time
  rate_per_minute: number;
  created_at: string;
  updated_at: string;
}

/**
 * Tipo de upload (enum DB upload_kind)
 */
export type UploadKind = 'contatos' | 'produtos';

/**
 * Upload de dados
 */
export interface Upload {
  id: string; // uuid
  tenant_id: string; // uuid
  kind: UploadKind;
  filename: string;
  total_rows: number;
  inserted: number;
  updated: number;
  failed: number;
  report?: any; // jsonb
  created_at: string;
}

/**
 * Execução de agente (agent_runs)
 *
 * Observação importante:
 * - DB run_status observado: success | error | skipped
 * - Seu TS anterior tinha status lifecycle ('pending'|'running'|'failed'). Aqui adotei os valores do DB.
 * Se preferir mudar a DB para suportar lifecycle, me avise.
 */
export type AgentRunAgent = AgentType;
export type AgentRunDirection = 'inbound' | 'outbound';
export type AgentRunStatus = 'success' | 'error' | 'skipped';

export interface AgentRun {
  id: string; // uuid
  tenant_id: string; // uuid
  agent: AgentRunAgent;
  direction: AgentRunDirection;
  status: AgentRunStatus;
  correlation_id?: string | null;
  lead_id?: string | null; // text
  product_id?: string | null; // text
  intent?: string | null;
  confidence?: number | null; // numeric
  latency_ms?: number | null;
  payload_in?: any | null;  // jsonb
  payload_out?: any | null; // jsonb
  error_message?: string | null;
  created_at: string;
}

/**
 * Agent config versions tipado acima (AgentConfigVersion)
 */

/**
 * Api signing secrets (api_signing_secrets)
 */
export type ApiSigningSecretType = 'hmac' | 'jwt';

export interface ApiSigningSecret {
  id: string; // uuid
  tenant_id: string; // uuid
  secret: string;
  type: ApiSigningSecretType;
  active: boolean;
  last_rotated_at?: string | null;
  created_at: string;
}

/**
 * Failed events (failed_events)
 */
export interface FailedEvent {
  id: string; // uuid
  tenant_id: string; // uuid
  source: string;
  payload: any; // jsonb
  error_message?: string | null;
  retry_after?: string | null; // timestamptz
  created_at: string;
}

/**
 * Arquivo CSV parseado (utilitário client-side)
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

import { User } from '@supabase/supabase-js';

/**
 * Contexto de autenticação (app)
 * Alinhado com a implementação real em AuthContext.tsx
 */
export interface AuthContextType {
  user: User | null;
  member: TenantMember | null;
  tenant: Tenant | null;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshTenant: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
}

/**
 * Props para os componentes do fluxo de Onboarding
 */
export interface Step1TenantProps {
  tenant: Tenant | null;
  onTenantCreated: (newTenant: Tenant) => void;
}

export interface Step2WhatsappProps {
  tenant: Tenant;
  onChannelConnected: (settings: ChannelSettings) => void;
}

export interface Step3AgentPromptsProps {
  tenant: Tenant;
  channelSettings: ChannelSettings;
  onAgentConfigSaved: (newConfig: AgentConfig) => void;
  existingConfig: AgentConfig | null;
}

export interface Step4FinalizeProps {
  tenant: Tenant;
  onFinalize: (tenantId: string) => void;
}

/* ======= Observações finais =======
- Campos/tabelas adicionadas do DB e tipadas aqui:
  - agent_config_versions -> AgentConfigVersion
  - api_signing_secrets -> ApiSigningSecret
  - failed_events -> FailedEvent

- Enum divergentes ajustadas para refletir o DB:
  - StatusLead: inclui 'respondeu' (DB) em vez de 'qualificado' (TS antigo)
  - ChannelStatus: reflete enum DB (sem 'DISCONNECTED')
  - AgentRun.status: usa 'success'|'error'|'skipped' (DB)

- Se quiser que eu:
  1) Troque os enums TS para os valores que você preferir (e gero SQL para atualizar os enums no DB), ou
  2) Gere uma versão com lifecycle status (pending/running/failed) e sugira migração no DB,
  3) Ou adapte trigger_config para um tipo estrito somente schedule,
  diga qual opção prefere e eu atualizo.

*/