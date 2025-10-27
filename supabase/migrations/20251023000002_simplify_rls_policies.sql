-- Primeiro, remover todas as políticas existentes que podem estar causando recursão
drop policy if exists "Users can view tenant_members of their tenants" on tenant_members;
drop policy if exists "Users can view channel_settings of their tenants" on channel_settings;
drop policy if exists "Users can view agent_configs of their tenants" on agent_configs;
drop policy if exists "Users can view their own tenant_members" on tenant_members;

-- Política simplificada para tenant_members
create policy "tenant_members_policy"
  on tenant_members
  for all -- permite select, insert, update, delete
  using (
    -- Usuário é dono do tenant OU é o próprio usuário do registro
    exists (
      select 1 from tenant_members
      where tenant_members.tenant_id = tenant_members.tenant_id
      and tenant_members.user_id = auth.uid()
      and tenant_members.role = 'owner'
    )
    or
    user_id = auth.uid()
  );

-- Política simplificada para channel_settings
create policy "channel_settings_policy"
  on channel_settings
  for all
  using (
    exists (
      select 1 from tenant_members
      where tenant_members.tenant_id = channel_settings.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );

-- Política simplificada para agent_configs
create policy "agent_configs_policy"
  on agent_configs
  for all
  using (
    exists (
      select 1 from tenant_members
      where tenant_members.tenant_id = agent_configs.tenant_id
      and tenant_members.user_id = auth.uid()
    )
  );

-- Garantir que as tabelas têm RLS habilitado
alter table tenant_members enable row level security;
alter table channel_settings enable row level security;
alter table agent_configs enable row level security;