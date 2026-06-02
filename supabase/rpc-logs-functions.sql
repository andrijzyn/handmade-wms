-- ============================================================
-- StockPulse — RPC + Audit bundle
-- ============================================================

create extension if not exists "uuid-ossp";

-- 1) Audit table
create table if not exists public.logs (
                                              id uuid primary key default uuid_generate_v4(),
  actor_user_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  correlation_id uuid not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
  );

create index if not exists idx_logs_actor_user_id
  on public.logs (actor_user_id);

create index if not exists idx_logs_entity
  on public.logs (entity_type, entity_id);

create index if not exists idx_logs_correlation_id
  on public.logs (correlation_id);

create index if not exists idx_logs_created_at
  on public.logs (created_at desc);

-- 2) Common audit helper
create or replace function public.logs_audit_event(
  p_actor_user_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_correlation_id uuid,
  p_payload jsonb default '{}'::jsonb
)
returns void
language plpgsql
as $$
begin
insert into public.logs (
  actor_user_id,
  action,
  entity_type,
  entity_id,
  correlation_id,
  payload
)
values (
         p_actor_user_id,
         p_action,
         p_entity_type,
         p_entity_id,
         p_correlation_id,
         coalesce(p_payload, '{}'::jsonb)
       );
end;
$$;

-- ============================================================
-- PRODUCTS
-- ============================================================

create or replace function public.create_product_with_audit(
  p_name text,
  p_sku text,
  p_category text,
  p_quantity integer,
  p_price numeric,
  p_low_stock_threshold integer,
  p_description text,
  p_actor_user_id uuid,
  p_correlation_id uuid
)
returns public.products
language plpgsql
as $$
declare
v_product public.products;
begin
insert into public.products (
  name,
  sku,
  category,
  quantity,
  price,
  low_stock_threshold,
  description
)
values (
         p_name,
         p_sku,
         p_category,
         p_quantity,
         p_price,
         p_low_stock_threshold,
         p_description
       )
  returning * into v_product;

perform public.logs_audit_event(
    p_actor_user_id,
    'create',
    'product',
    v_product.id,
    p_correlation_id,
    jsonb_build_object(
      'name', v_product.name,
      'sku', v_product.sku,
      'category', v_product.category,
      'quantity', v_product.quantity,
      'price', v_product.price,
      'low_stock_threshold', v_product.low_stock_threshold,
      'description', v_product.description
    )
  );

return v_product;
end;
$$;

create or replace function public.update_product_with_audit(
  p_product_id uuid,
  p_updates jsonb,
  p_actor_user_id uuid,
  p_correlation_id uuid
)
returns public.products
language plpgsql
as $$
declare
v_product public.products;
begin
update public.products
set
  name = case
           when p_updates ? 'name' then p_updates->>'name'
           else name
    end,
  sku = case
          when p_updates ? 'sku' then p_updates->>'sku'
          else sku
    end,
  category = case
               when p_updates ? 'category' then p_updates->>'category'
               else category
    end,
  quantity = case
               when p_updates ? 'quantity' then (p_updates->>'quantity')::integer
      else quantity
end,
    price = case
      when p_updates ? 'price' then (p_updates->>'price')::numeric
      else price
end,
    low_stock_threshold = case
      when p_updates ? 'low_stock_threshold'
        then (p_updates->>'low_stock_threshold')::integer
      else low_stock_threshold
end,
    description = case
      when p_updates ? 'description' then p_updates->>'description'
      else description
end
where id = p_product_id
  returning * into v_product;

  if v_product is null then
    return null;
end if;

  perform public.logs_audit_event(
    p_actor_user_id,
    'update',
    'product',
    v_product.id,
    p_correlation_id,
    coalesce(p_updates, '{}'::jsonb)
  );

return v_product;
end;
$$;

create or replace function public.delete_product_with_audit(
  p_product_id uuid,
  p_actor_user_id uuid,
  p_correlation_id uuid
)
returns boolean
language plpgsql
as $$
declare
v_product public.products;
begin
delete from public.products
where id = p_product_id
  returning * into v_product;

if v_product is null then
    return false;
end if;

  perform public.logs_audit_event(
    p_actor_user_id,
    'delete',
    'product',
    p_product_id,
    p_correlation_id,
    jsonb_build_object(
      'name', v_product.name,
      'sku', v_product.sku,
      'category', v_product.category,
      'quantity', v_product.quantity,
      'price', v_product.price,
      'low_stock_threshold', v_product.low_stock_threshold,
      'description', v_product.description
    )
  );

return true;
end;
$$;

-- ============================================================
-- USERS
-- ============================================================

create or replace function public.create_user_with_audit(
  p_username text,
  p_password text,
  p_full_name text,
  p_rank text,
  p_unit text,
  p_callsign text,
  p_clearance_level text,
  p_is_active boolean,
  p_actor_user_id uuid,
  p_correlation_id uuid
)
returns uuid
language plpgsql
as $$
declare
v_user_id uuid;
begin
insert into public.users (
  username,
  password,
  full_name,
  rank,
  unit,
  callsign,
  clearance_level,
  is_active
)
values (
         p_username,
         p_password,
         p_full_name,
         p_rank,
         p_unit,
         p_callsign,
         p_clearance_level,
         p_is_active
       )
  returning id into v_user_id;

perform public.logs_audit_event(
    p_actor_user_id,
    'create',
    'user',
    v_user_id,
    p_correlation_id,
    jsonb_build_object(
      'username', p_username,
      'full_name', p_full_name,
      'rank', p_rank,
      'unit', p_unit,
      'callsign', p_callsign,
      'clearance_level', p_clearance_level,
      'is_active', p_is_active
    )
  );

return v_user_id;
end;
$$;

create or replace function public.update_user_with_audit(
  p_user_id uuid,
  p_updates jsonb,
  p_actor_user_id uuid,
  p_correlation_id uuid
)
returns boolean
language plpgsql
as $$
declare
v_updated boolean := false;
begin
update public.users
set
  username = case
               when p_updates ? 'username' then p_updates->>'username'
               else username
    end,
  password = case
               when p_updates ? 'password' then p_updates->>'password'
               else password
    end,
  full_name = case
                when p_updates ? 'full_name' then p_updates->>'full_name'
                else full_name
    end,
  rank = case
           when p_updates ? 'rank' then p_updates->>'rank'
           else rank
    end,
  unit = case
           when p_updates ? 'unit' then p_updates->>'unit'
           else unit
    end,
  callsign = case
               when p_updates ? 'callsign' then p_updates->>'callsign'
               else callsign
    end,
  clearance_level = case
                      when p_updates ? 'clearance_level' then p_updates->>'clearance_level'
                      else clearance_level
    end,
  is_active = case
                when p_updates ? 'is_active' then (p_updates->>'is_active')::boolean
                else is_active
    end
where id = p_user_id;

get diagnostics v_updated = row_count;

if not v_updated then
    return false;
end if;

  perform public.logs_audit_event(
    p_actor_user_id,
    'update',
    'user',
    p_user_id,
    p_correlation_id,
    coalesce(p_updates, '{}'::jsonb)
  );

return true;
end;
$$;

create or replace function public.delete_user_with_audit(
  p_user_id uuid,
  p_actor_user_id uuid,
  p_correlation_id uuid
)
returns boolean
language plpgsql
as $$
declare
v_user public.users;
begin
  -- optional cleanup if FK cascade is not configured
delete from public.user_permissions
where user_id = p_user_id;

delete from public.users
where id = p_user_id
  returning * into v_user;

if v_user is null then
    return false;
end if;

  perform public.logs_audit_event(
    p_actor_user_id,
    'delete',
    'user',
    p_user_id,
    p_correlation_id,
    jsonb_build_object(
      'username', v_user.username,
      'full_name', v_user.full_name,
      'rank', v_user.rank,
      'unit', v_user.unit,
      'callsign', v_user.callsign,
      'clearance_level', v_user.clearance_level,
      'is_active', v_user.is_active
    )
  );

return true;
end;
$$;

create or replace function public.replace_user_permissions_with_audit(
  p_user_id uuid,
  p_permission_keys text[],
  p_actor_user_id uuid,
  p_correlation_id uuid
)
returns boolean
language plpgsql
as $$
begin
delete from public.user_permissions
where user_id = p_user_id;

insert into public.user_permissions (user_id, permission_id)
select
  p_user_id,
  p.id
from public.permissions p
where p.key = any(coalesce(p_permission_keys, array[]::text[]));

perform public.logs_audit_event(
    p_actor_user_id,
    'replace_permissions',
    'user',
    p_user_id,
    p_correlation_id,
    jsonb_build_object(
      'permissions', coalesce(to_jsonb(p_permission_keys), '[]'::jsonb)
    )
  );

return true;
end;
$$;

-- ============================================================
-- PRODUCT LOCATIONS
-- ============================================================

create or replace function public.create_product_location_with_audit(
  p_product_id uuid,
  p_location_id uuid,
  p_quantity integer,
  p_actor_user_id uuid,
  p_correlation_id uuid
)
returns public.product_locations
language plpgsql
as $$
declare
v_row public.product_locations;
begin
insert into public.product_locations (
  product_id,
  location_id,
  quantity
)
values (
         p_product_id,
         p_location_id,
         p_quantity
       )
  returning * into v_row;

perform public.logs_audit_event(
    p_actor_user_id,
    'create',
    'product_location',
    v_row.id,
    p_correlation_id,
    jsonb_build_object(
      'product_id', v_row.product_id,
      'location_id', v_row.location_id,
      'quantity', v_row.quantity
    )
  );

return v_row;
end;
$$;

create or replace function public.update_product_location_with_audit(
  p_id uuid,
  p_quantity integer,
  p_actor_user_id uuid,
  p_correlation_id uuid
)
returns public.product_locations
language plpgsql
as $$
declare
v_row public.product_locations;
begin
update public.product_locations
set
  quantity = p_quantity,
  updated_at = now()
where id = p_id
  returning * into v_row;

if v_row is null then
    return null;
end if;

  perform public.logs_audit_event(
    p_actor_user_id,
    'update',
    'product_location',
    v_row.id,
    p_correlation_id,
    jsonb_build_object(
      'product_id', v_row.product_id,
      'location_id', v_row.location_id,
      'quantity', v_row.quantity
    )
  );

return v_row;
end;
$$;

create or replace function public.delete_product_location_with_audit(
  p_id uuid,
  p_actor_user_id uuid,
  p_correlation_id uuid
)
returns boolean
language plpgsql
as $$
declare
v_row public.product_locations;
begin
delete from public.product_locations
where id = p_id
  returning * into v_row;

if v_row is null then
    return false;
end if;

  perform public.logs_audit_event(
    p_actor_user_id,
    'delete',
    'product_location',
    v_row.id,
    p_correlation_id,
    jsonb_build_object(
      'product_id', v_row.product_id,
      'location_id', v_row.location_id,
      'quantity', v_row.quantity
    )
  );

return true;
end;
$$;

-- ============================================================
-- Refresh PostgREST schema cache
-- ============================================================
notify pgrst, 'reload schema';
