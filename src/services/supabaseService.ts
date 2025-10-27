import { supabase as supabaseClient } from '@/integrations/supabase/client';
const supabase = supabaseClient as any;
import { Produto, Contato, Historico, Tenant, ChannelStatus, ChannelSettings } from '@/types';

// ==========================================
// TENANT MANAGEMENT
// ==========================================

/**
 * Cria um novo tenant (loja) no sistema
 * Utiliza a função RPC do Supabase
 */
export async function createTenant(tenantName: string): Promise<Tenant> {
  if (!tenantName.trim()) {
    throw new Error("O nome da loja não pode estar vazio");
  }

  const { data, error } = await supabase
    .rpc('create_new_tenant', { tenant_name: tenantName.trim() });

  if (error) {
    console.error("Error creating tenant:", error.message);
    throw error;
  }

  if (!data) {
    throw new Error("Falha ao criar tenant - sem dados retornados");
  }

  // A stored function can return a composite type (single row) or jsonb.
  // Normalize the result: if it's an array, return the first element; if it has a wrapper, try to extract.
  let tenantResult: any = data;

  // Supabase RPC sometimes returns an array when function returns a composite type
  if (Array.isArray(tenantResult)) {
    tenantResult = tenantResult[0];
  }

  // If the RPC returned an object with the function name as key (unlikely but possible), extract it
  if (tenantResult && typeof tenantResult === 'object' && Object.keys(tenantResult).length === 1) {
    const key = Object.keys(tenantResult)[0];
    if (key === 'create_new_tenant' || key === 'create_new_tenant_result') {
      tenantResult = (tenantResult as any)[key];
    }
  }

  return tenantResult as Tenant;
}

/**
 * Busca um tenant pelo ID
 */
export async function getTenant(tenantId: string): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single();

  if (error) {
    console.error("Error fetching tenant:", error.message);
    return null;
  }

  return data;
}

/**
 * Busca todos os tenants do usuário atual
 */
export async function getUserTenants(): Promise<Tenant[]> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  // Busca tenants onde o usuário é owner ou membro
  const { data, error } = await supabase
    .from('tenants')
    .select(`
      *,
      tenant_members!inner(role)
    `)
    .eq('tenant_members.user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching user tenants:", error.message);
    throw error;
  }

  return data || [];
}

/**
 * Busca o primeiro tenant associado ao usuário atual.
 * Ideal para o contexto de onboarding ou quando um usuário tem apenas uma loja.
 */
export async function getTenantSettings(userId: string): Promise<Tenant | null> {
  // A função getUserTenants já usa o ID do usuário logado, então o parâmetro userId é para consistência de chamada.
  if (!userId) return null;

  try {
    const tenants = await getUserTenants();
    // Retorna o primeiro tenant encontrado, que é o mais comum no onboarding.
    if (tenants && tenants.length > 0) {
      return tenants[0];
    }
    return null;
  } catch (error) {
    console.error("Error in getTenantSettings while fetching user tenants:", error);
    return null;
  }
}

// ==========================================
// PRODUTOS
// ==========================================

export async function getProdutos(tenantId: string): Promise<Produto[]> {
  if (!tenantId) {
    console.warn("getProdutos called without tenantId");
    return [];
  }

  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching produtos:", error.message);
    throw error;
  }
  
  return data || [];
}

export async function upsertProdutos(produtos: Produto[], tenantId: string) {
  if (!tenantId) {
    throw new Error("Cannot upsert produtos without a tenantId");
  }

  const rows = produtos.map(p => ({
    id_produto: p.id_produto,
    tenant_id: tenantId,
    nome_produto: p.nome_produto,
    descricao: p.descricao,
    quantidade: p.quantidade || 0,
    preco_normal: p.preco_normal,
    preco_promo: p.preco_promo,
    link_foto: p.link_foto,
    validade_promo: p.validade_promo,
  }));

  const { error } = await supabase
    .from('produtos')
    .upsert(rows, { onConflict: 'id_produto' });

  if (error) {
    console.error("Error upserting produtos:", error.message);
    throw error;
  }
}

// ==========================================
// CONTATOS
// ==========================================

export async function getContatos(tenantId: string): Promise<Contato[]> {
  if (!tenantId) {
    console.warn("getContatos called without tenantId");
    return [];
  }

  const { data, error } = await supabase
    .from('contatos')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching contatos:", error.message);
    throw error;
  }

  return data || [];
}

export async function upsertContatos(contatos: Contato[], tenantId: string) {
  if (!tenantId) {
    throw new Error("Cannot upsert contatos without a tenantId");
  }
    
  const rows = contatos.map(c => ({
    id_lead: c.id_lead,
    tenant_id: tenantId,
    nome: c.nome,
    telefone: c.telefone,
    email: c.email,
    empresa: c.empresa,
    segmento: c.segmento,
    score: c.score,
    status: c.status || 'novo',
  }));

  const { error } = await supabase
    .from('contatos')
    .upsert(rows, { onConflict: 'id_lead' });

  if (error) {
    console.error("Error upserting contatos:", error.message);
    throw error;
  }
}

// ==========================================
// HISTÓRICO
// ==========================================

export async function getHistorico(tenantId: string): Promise<Historico[]> {
  if (!tenantId) {
    console.warn("getHistorico called without tenantId");
    return [];
  }
    
  const { data, error } = await supabase
    .from('historico')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error("Error fetching historico:", error.message);
    throw error;
  }

  return data || [];
}

// ==========================================
// CHANNEL SETTINGS (WhatsApp)
// ==========================================

export async function createChannelSettings(tenant: Tenant): Promise<ChannelSettings> {
  const evoBaseUrl = import.meta.env.VITE_EVOLUTION_API_URL;
  const n8nWebhookBaseUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;

  if (!evoBaseUrl || !n8nWebhookBaseUrl) {
    throw new Error("Variáveis de ambiente VITE_EVOLUTION_API_URL ou VITE_N8N_WEBHOOK_URL não estão definidas.");
  }

  const channelData = {
    tenant_id: tenant.id,
    evo_base_url: evoBaseUrl,
    instance_name: `tenant-${tenant.slug}`,
    instance_token: crypto.randomUUID(),
    webhook_url_inbound: `${n8nWebhookBaseUrl}/reativo/${tenant.slug}`,
    webhook_events: ['MESSAGES_UPSERT'],
    status: 'CREATED' as ChannelStatus,
  };

  const { data, error } = await supabase
    .from('channel_settings')
    .insert(channelData)
    .select()
    .single();

  if (error) {
    console.error('Error creating channel settings:', error.message);
    
    // Se a instância já existir, busca a existente
    if (error.code === '23505') { // unique_violation
      console.log('Channel settings already exist for this tenant, fetching...');
      const { data: existingData, error: fetchError } = await supabase
        .from('channel_settings')
        .select('*')
        .eq('tenant_id', tenant.id)
        .single();
      
      if (fetchError) {
        console.error('Error fetching existing channel settings:', fetchError.message);
        throw fetchError;
      }
      return existingData;
    }
    throw error;
  }

  return data;
}

export async function getChannelSettings(tenantId: string): Promise<ChannelSettings | null> {
  const { data, error } = await supabase
    .from('channel_settings')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching channel settings:', error.message);
    return null;
  }

  return data;
}

export async function updateChannelStatus(
  tenantId: string, 
  status: ChannelStatus, 
  waNumber?: string
) {
  const updateData: { 
    status: ChannelStatus; 
    wa_number?: string;
    updated_at: string;
  } = { 
    status,
    updated_at: new Date().toISOString()
  };
  
  if (waNumber) {
    updateData.wa_number = waNumber;
  }

  const { error } = await supabase
    .from('channel_settings')
    .update(updateData)
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('Error updating channel status:', error.message);
    throw error;
  }
}

// ==========================================
// AGENT CONFIGS
// ==========================================

/**
 * Salva os prompts dos agentes (ativo e reativo)
 * Função simplificada usada no onboarding
 */
export async function saveAgentPrompts(
  tenantId: string,
  promptAtivo: string,
  promptReativo: string
): Promise<void> {
  if (!tenantId) {
    throw new Error("tenantId é obrigatório");
  }

  // Salva o agente ativo
  await upsertAgentConfig({
    tenantId,
    agentType: 'ativo',
    systemPrompt: promptAtivo,
  });

  // Salva o agente reativo
  await upsertAgentConfig({
    tenantId,
    agentType: 'reativo',
    systemPrompt: promptReativo,
  });
}

/**
 * Insere ou atualiza a configuração de um agente
 */
export async function upsertAgentConfig(config: {
  tenantId: string;
  agentType: 'ativo' | 'reativo';
  systemPrompt: string;
  scheduleHour?: number;
}): Promise<void> {
  const { tenantId, agentType, systemPrompt, scheduleHour } = config;

  // Primeiro, busca se já existe uma configuração
  const { data: existing } = await supabase
    .from('agent_configs')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('agent', agentType)
    .single();

  const row = {
    tenant_id: tenantId,
    agent: agentType,
    system_prompt: systemPrompt,
    version: existing ? existing.version + 1 : 1,
    active: true,
    trigger_config: scheduleHour ? { type: 'schedule', hour: scheduleHour } : null,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    // Atualiza existente
    const { error } = await supabase
      .from('agent_configs')
      .update(row)
      .eq('id', existing.id);

    if (error) {
      console.error(`Error updating ${agentType} agent config:`, error.message);
      throw error;
    }
  } else {
    // Insere novo
    const { error } = await supabase
      .from('agent_configs')
      .insert(row);

    if (error) {
      console.error(`Error inserting ${agentType} agent config:`, error.message);
      throw error;
    }
  }
}

/**
 * Busca a configuração de um agente específico
 */
export async function getAgentConfig(
  tenantId: string,
  agentType: 'ativo' | 'reativo'
) {
  const { data, error } = await supabase
    .from('agent_configs')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('agent', agentType)
    .eq('active', true)
    .single();

  if (error) {
    console.error(`Error fetching ${agentType} agent config:`, error.message);
    return null;
  }

  return data;
}

/**
 * Busca todas as configurações de agentes de um tenant
 */
export async function getAllAgentConfigs(tenantId: string) {
  const { data, error } = await supabase
    .from('agent_configs')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('active', true);

  if (error) {
    console.error('Error fetching agent configs:', error.message);
    throw error;
  }

  return data || [];
}
