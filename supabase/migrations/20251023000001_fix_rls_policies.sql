-- Drop existing problematic policies
drop policy if exists "Users can view tenant_members of their tenants" on tenant_members;
drop policy if exists "Users can view channel_settings of their tenants" on channel_settings;
drop policy if exists "Users can view agent_configs of their tenants" on agent_configs;

-- Create new non-recursive policies
create policy "Users can view their own tenant_members"
  on tenant_members for select
  using (user_id = auth.uid());

create policy "Users can view channel_settings for tenants they belong to"
  on channel_settings for select
  using (tenant_id in (
    select tenant_id from tenant_members
    where user_id = auth.uid()
  ));

create policy "Users can view agent_configs for tenants they belong to"
  on agent_configs for select
  using (tenant_id in (
    select tenant_id from tenant_members
    where user_id = auth.uid()
  ));

-- Add insert policies
create policy "Users can insert channel_settings for tenants they own"
  on channel_settings for insert
  with check (tenant_id in (
    select tenant_id from tenant_members
    where user_id = auth.uid()
    and role = 'owner'
  ));

create policy "Users can insert agent_configs for tenants they own"
  on agent_configs for insert
  with check (tenant_id in (
    select tenant_id from tenant_members
    where user_id = auth.uid()
    and role = 'owner'
  ));

-- Add update policies
create policy "Users can update channel_settings for tenants they own"
  on channel_settings for update
  using (tenant_id in (
    select tenant_id from tenant_members
    where user_id = auth.uid()
    and role = 'owner'
  ));

create policy "Users can update agent_configs for tenants they own"
  on agent_configs for update
  using (tenant_id in (
    select tenant_id from tenant_members
    where user_id = auth.uid()
    and role = 'owner'
  ));