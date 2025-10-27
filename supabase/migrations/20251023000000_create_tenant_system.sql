-- Create tenant tables
create table tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table tenant_members (
  tenant_id uuid references tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (tenant_id, user_id)
);

-- Create channel_settings table for WhatsApp instances
create table channel_settings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade unique,
  evo_base_url text not null,
  instance_name text not null unique,
  instance_token uuid not null unique,
  webhook_url_inbound text not null,
  webhook_events jsonb not null default '["MESSAGES_UPSERT"]',
  wa_number text,
  status text not null check (status in ('CREATED', 'PENDING_QR', 'CONNECTED', 'DISCONNECTED')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create agent_configs table for AI agents
create table agent_configs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,
  agent text not null check (agent in ('ativo', 'reativo')),
  system_prompt text not null,
  version integer not null default 1,
  active boolean not null default true,
  trigger_config jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (tenant_id, agent, active)
);

-- Enable RLS
alter table tenants enable row level security;
alter table tenant_members enable row level security;
alter table channel_settings enable row level security;
alter table agent_configs enable row level security;

-- RLS Policies for tenants
create policy "Users can view tenants they are members of"
  on tenants for select
  using (exists (
    select 1 from tenant_members
    where tenant_members.tenant_id = tenants.id
    and tenant_members.user_id = auth.uid()
  ));

-- RLS Policies for tenant_members
create policy "Users can view tenant_members of their tenants"
  on tenant_members for select
  using (exists (
    select 1 from tenant_members as tm
    where tm.tenant_id = tenant_members.tenant_id
    and tm.user_id = auth.uid()
  ));

-- RLS Policies for channel_settings
create policy "Users can view channel_settings of their tenants"
  on channel_settings for select
  using (exists (
    select 1 from tenant_members
    where tenant_members.tenant_id = channel_settings.tenant_id
    and tenant_members.user_id = auth.uid()
  ));

-- RLS Policies for agent_configs
create policy "Users can view agent_configs of their tenants"
  on agent_configs for select
  using (exists (
    select 1 from tenant_members
    where tenant_members.tenant_id = agent_configs.tenant_id
    and tenant_members.user_id = auth.uid()
  ));

-- Create slugify function
create or replace function slugify(value text)
returns text as $$
  -- Remove accents (diacritic marks)
  with
  unaccented as (
    select translate(lower($1),
      'áàâãäåāăąèéêëēĕėęěìíîïĩīĭḩóôõöōŏőůùúûüũūŭųḩýÿỳ''"-',
      'aaaaaaaaeeeeeeeeeiiiiiiihooooooouuuuuuuuhyyy    '
    ) as value
  ),
  -- Replace anything that's not a letter or number with a space
  spacing as (
    select regexp_replace(value, '[^a-z0-9]', ' ', 'g') as value
    from unaccented
  ),
  -- Replace multiple spaces with a single hyphen
  hyphenated as (
    select regexp_replace(trim(value), '\s+', '-', 'g') as value
    from spacing
  )
  select value from hyphenated;
$$ language sql strict immutable;

-- Create function to create a new tenant
create or replace function create_new_tenant(tenant_name text)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  new_tenant_id uuid;
  new_tenant_slug text;
  tenant_record jsonb;
begin
  -- Generate slug from tenant name
  new_tenant_slug := slugify(tenant_name);
  
  -- Create new tenant
  insert into tenants (name, slug)
  values (tenant_name, new_tenant_slug)
  returning id into new_tenant_id;
  
  -- Add current user as owner
  insert into tenant_members (tenant_id, user_id, role)
  values (new_tenant_id, auth.uid(), 'owner');
  
  -- Get tenant details
  select jsonb_build_object(
    'id', t.id,
    'name', t.name,
    'slug', t.slug,
    'created_at', t.created_at
  )
  from tenants t
  where t.id = new_tenant_id
  into tenant_record;
  
  return tenant_record;
end;
$$;