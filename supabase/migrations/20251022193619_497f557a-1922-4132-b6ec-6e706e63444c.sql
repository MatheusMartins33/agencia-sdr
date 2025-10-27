-- Create enums
create type status_lead as enum ('novo','contatado','respondeu','convertido','perdido');
create type tipo_agente as enum ('ativo','reativo');

-- Create produtos table
create table produtos (
  id_produto text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  nome_produto text not null,
  descricao text,
  quantidade integer default 0,
  preco_normal numeric(12,2),
  preco_promo numeric(12,2),
  link_foto text,
  validade_promo date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create contatos table
create table contatos (
  id_lead text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  nome text not null,
  telefone text,
  email text,
  empresa text,
  segmento text,
  score integer check (score between 0 and 100),
  status status_lead default 'novo',
  ultima_interacao timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create historico table
create table historico (
  id_historico text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  id_lead text references contatos(id_lead) on delete cascade,
  timestamp timestamptz not null,
  tipo_agente tipo_agente not null,
  mensagem_enviada text,
  resposta_cliente text,
  produto_relacionado text references produtos(id_produto),
  acao_tomada text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table produtos enable row level security;
alter table contatos enable row level security;
alter table historico enable row level security;

-- RLS Policies for produtos
create policy "Users can view own produtos"
  on produtos for select
  using (auth.uid() = user_id);

create policy "Users can insert own produtos"
  on produtos for insert
  with check (auth.uid() = user_id);

create policy "Users can update own produtos"
  on produtos for update
  using (auth.uid() = user_id);

create policy "Users can delete own produtos"
  on produtos for delete
  using (auth.uid() = user_id);

-- RLS Policies for contatos
create policy "Users can view own contatos"
  on contatos for select
  using (auth.uid() = user_id);

create policy "Users can insert own contatos"
  on contatos for insert
  with check (auth.uid() = user_id);

create policy "Users can update own contatos"
  on contatos for update
  using (auth.uid() = user_id);

create policy "Users can delete own contatos"
  on contatos for delete
  using (auth.uid() = user_id);

-- RLS Policies for historico
create policy "Users can view own historico"
  on historico for select
  using (auth.uid() = user_id);

create policy "Users can insert own historico"
  on historico for insert
  with check (auth.uid() = user_id);

create policy "Users can update own historico"
  on historico for update
  using (auth.uid() = user_id);

create policy "Users can delete own historico"
  on historico for delete
  using (auth.uid() = user_id);

-- Create indexes for better performance
create index idx_produtos_user_id on produtos(user_id);
create index idx_contatos_user_id on contatos(user_id);
create index idx_contatos_status on contatos(status);
create index idx_contatos_score on contatos(score);
create index idx_historico_user_id on historico(user_id);
create index idx_historico_id_lead on historico(id_lead);
create index idx_historico_timestamp on historico(timestamp desc);