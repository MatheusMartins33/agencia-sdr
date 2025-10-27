CREATE OR REPLACE FUNCTION public.create_new_tenant(tenant_name text)
RETURNS tenants
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  existing_tenant tenants;
  new_tenant tenants;
  generated_slug TEXT;
  slug_suffix INTEGER := 0;
  current_user_id UUID;
BEGIN
  -- Pega o ID do usuário autenticado
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Verifica se o usuário já é membro de algum tenant
  SELECT t.* INTO existing_tenant
  FROM tenants t
  JOIN tenant_members tm ON t.id = tm.tenant_id
  WHERE tm.user_id = current_user_id
  LIMIT 1;

  -- Se o tenant existe, retorna seus dados
  IF existing_tenant IS NOT NULL THEN
    RETURN existing_tenant;
  END IF;

  -- Validação do nome
  IF tenant_name IS NULL OR trim(tenant_name) = '' THEN
    RAISE EXCEPTION 'O nome da loja não pode estar vazio';
  END IF;

  -- Gera slug a partir do nome
  generated_slug := lower(regexp_replace(tenant_name, '[^a-zA-Z0-9]', '-', 'g'));
  generated_slug := regexp_replace(generated_slug, '-+', '-', 'g');
  generated_slug := trim(both '-' from generated_slug);
  
  -- Garante que o slug não está vazio
  IF generated_slug = '' THEN
    generated_slug := 'tenant';
  END IF;
  
  -- Se slug já existir, adiciona sufixo numérico
  WHILE EXISTS (SELECT 1 FROM tenants WHERE slug = generated_slug) LOOP
    slug_suffix := slug_suffix + 1;
    generated_slug := lower(regexp_replace(tenant_name, '[^a-zA-Z0-9]', '-', 'g'));
    generated_slug := regexp_replace(generated_slug, '-+', '-', 'g');
    generated_slug := trim(both '-' from generated_slug) || '-' || slug_suffix;
  END LOOP;
  
  -- Insere o tenant
  INSERT INTO tenants (name, slug, owner_user_id, created_at, updated_at)
  VALUES (
    trim(tenant_name), 
    generated_slug, 
    current_user_id,
    now(),
    now()
  )
  RETURNING * INTO new_tenant;
  
  -- Adiciona o usuário como owner na tabela tenant_members
  INSERT INTO tenant_members (tenant_id, user_id, role, created_at)
  VALUES (new_tenant.id, current_user_id, 'owner', now());
  
  -- Cria limites padrão para o tenant
  INSERT INTO tenant_limits (
    tenant_id,
    daily_cap_messages,
    per_lead_per_day,
    per_lead_per_week,
    quiet_hours_start,
    quiet_hours_end,
    rate_per_minute,
    created_at,
    updated_at
  ) VALUES (
    new_tenant.id,
    300,  -- 300 mensagens por dia
    1,    -- 1 mensagem por lead por dia
    2,    -- 2 mensagens por lead por semana
    '21:00:00'::time,  -- Início do horário de silêncio
    '08:00:00'::time,  -- Fim do horário de silêncio
    10,   -- 10 mensagens por minuto
    now(),
    now()
  );
  
  RETURN new_tenant;
END;
$function$;