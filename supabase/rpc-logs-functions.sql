-- ============================================================
-- StockPulse — RPC + Audit bundle
-- ============================================================

create extension if not exists "uuid-ossp";

-- 1) Audit table
create table if not exists public.logs (
                                              id uuid primary key default uuid_generate_v4(),
  actor_userID uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  correlation_id uuid not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
  );

create index if not exists idx_logs_actor_userID
  on public.logs (actor_userID);

create index if not exists idx_logs_entity
  on public.logs (entity_type, entity_id);

create index if not exists idx_logs_correlation_id
  on public.logs (correlation_id);

create index if not exists idx_logs_created_at
  on public.logs (created_at desc);

-- 2) Common audit helper
create or replace function public.logs_audit_event(
  p_actorUserID uuid,
  p_action text,
  p_entityType text,
  p_entityID uuid,
  p_correlationID uuid,
  p_payload jsonb default '{}'::jsonb
)
returns void
language plpgsql
as $$
begin
insert into public.logs (
  actor_userID,
  action,
  entity_type,
  entity_id,
  correlation_id,
  payload
)
values (
         p_actorUserID,
         p_action,
         p_entityType,
         p_entityID,
         p_correlationID,
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
  p_lowStockThreshold integer,
  p_description text,
  p_actorUserID uuid,
  p_correlationID uuid
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
  lowStockThreshold,
  description
)
values (
         p_name,
         p_sku,
         p_category,
         p_quantity,
         p_price,
         p_lowStockThreshold,
         p_description
       )
  returning * into v_product;

perform public.logs_audit_event(
    p_actorUserID,
    'create',
    'product',
    v_product.id,
    p_correlationID,
    jsonb_build_object(
      'name', v_product.name,
      'sku', v_product.sku,
      'category', v_product.category,
      'quantity', v_product.quantity,
      'price', v_product.price,
      'lowStockThreshold', v_product.lowStockThreshold,
      'description', v_product.description
    )
  );

return v_product;
end;
$$;

create or replace function public.update_product_with_audit(
  p_productID uuid,
  p_updates jsonb,
  p_actorUserID uuid,
  p_correlationID uuid
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
    lowStockThreshold = case
      when p_updates ? 'lowStockThreshold'
        then (p_updates->>'lowStockThreshold')::integer
      else lowStockThreshold
end,
    description = case
      when p_updates ? 'description' then p_updates->>'description'
      else description
end
where id = p_productID
  returning * into v_product;

  if v_product is null then
    return null;
end if;

  perform public.logs_audit_event(
    p_actorUserID,
    'update',
    'product',
    v_product.id,
    p_correlationID,
    coalesce(p_updates, '{}'::jsonb)
  );

return v_product;
end;
$$;

create or replace function public.delete_product_with_audit(
  p_productID uuid,
  p_actorUserID uuid,
  p_correlationID uuid
)
returns boolean
language plpgsql
as $$
declare
v_product public.products;
begin
delete from public.products
where id = p_productID
  returning * into v_product;

if v_product is null then
    return false;
end if;

  perform public.logs_audit_event(
    p_actorUserID,
    'delete',
    'product',
    p_productID,
    p_correlationID,
    jsonb_build_object(
      'name', v_product.name,
      'sku', v_product.sku,
      'category', v_product.category,
      'quantity', v_product.quantity,
      'price', v_product.price,
      'lowStockThreshold', v_product.lowStockThreshold,
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
  p_fullName text,
  p_rank text,
  p_unit text,
  p_callsign text,
  p_clearanceLevel text,
  p_isActive boolean,
  p_actorUserID uuid,
  p_correlationID uuid
)
returns uuid
language plpgsql
as $$
declare
v_userID uuid;
begin
insert into public.users (
  username,
  password,
  fullName,
  rank,
  unit,
  callsign,
  clearanceLevel,
  isActive
)
values (
         p_username,
         p_password,
         p_fullName,
         p_rank,
         p_unit,
         p_callsign,
         p_clearanceLevel,
         p_isActive
       )
  returning id into v_userID;

perform public.logs_audit_event(
    p_actorUserID,
    'create',
    'user',
    v_userID,
    p_correlationID,
    jsonb_build_object(
      'username', p_username,
      'fullName', p_fullName,
      'rank', p_rank,
      'unit', p_unit,
      'callsign', p_callsign,
      'clearanceLevel', p_clearanceLevel,
      'isActive', p_isActive
    )
  );

return v_userID;
end;
$$;

create or replace function public.update_user_with_audit(
  p_userID uuid,
  p_updates jsonb,
  p_actorUserID uuid,
  p_correlationID uuid
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
  fullName = case
                when p_updates ? 'fullName' then p_updates->>'fullName'
                else fullName
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
  clearanceLevel = case
                      when p_updates ? 'clearanceLevel' then p_updates->>'clearanceLevel'
                      else clearanceLevel
    end,
  isActive = case
                when p_updates ? 'isActive' then (p_updates->>'isActive')::boolean
                else isActive
    end
where id = p_userID;

get diagnostics v_updated = row_count;

if not v_updated then
    return false;
end if;

  perform public.logs_audit_event(
    p_actorUserID,
    'update',
    'user',
    p_userID,
    p_correlationID,
    coalesce(p_updates, '{}'::jsonb)
  );

return true;
end;
$$;

create or replace function public.delete_user_with_audit(
  p_userID uuid,
  p_actorUserID uuid,
  p_correlationID uuid
)
returns boolean
language plpgsql
as $$
declare
v_user public.users;
begin
  -- optional cleanup if FK cascade is not configured
delete from public.user_permissions
where userID = p_userID;

delete from public.users
where id = p_userID
  returning * into v_user;

if v_user is null then
    return false;
end if;

  perform public.logs_audit_event(
    p_actorUserID,
    'delete',
    'user',
    p_userID,
    p_correlationID,
    jsonb_build_object(
      'username', v_user.username,
      'fullName', v_user.fullName,
      'rank', v_user.rank,
      'unit', v_user.unit,
      'callsign', v_user.callsign,
      'clearanceLevel', v_user.clearanceLevel,
      'isActive', v_user.isActive
    )
  );

return true;
end;
$$;

create or replace function public.replace_user_permissions_with_audit(
  p_userID uuid,
  p_permission_keys text[],
  p_actorUserID uuid,
  p_correlationID uuid
)
returns boolean
language plpgsql
as $$
begin
delete from public.user_permissions
where userID = p_userID;

insert into public.user_permissions (userID, permission_id)
select
  p_userID,
  p.id
from public.permissions p
where p.key = any(coalesce(p_permission_keys, array[]::text[]));

perform public.logs_audit_event(
    p_actorUserID,
    'replace_permissions',
    'user',
    p_userID,
    p_correlationID,
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
  p_productID uuid,
  p_location_id uuid,
  p_quantity integer,
  p_actorUserID uuid,
  p_correlationID uuid
)
returns public.product_locations
language plpgsql
as $$
declare
v_row public.product_locations;
begin
insert into public.product_locations (
  productID,
  location_id,
  quantity
)
values (
         p_productID,
         p_location_id,
         p_quantity
       )
  returning * into v_row;

perform public.logs_audit_event(
    p_actorUserID,
    'create',
    'product_location',
    v_row.id,
    p_correlationID,
    jsonb_build_object(
      'productID', v_row.productID,
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
  p_actorUserID uuid,
  p_correlationID uuid
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
    p_actorUserID,
    'update',
    'product_location',
    v_row.id,
    p_correlationID,
    jsonb_build_object(
      'productID', v_row.productID,
      'location_id', v_row.location_id,
      'quantity', v_row.quantity
    )
  );

return v_row;
end;
$$;

create or replace function public.delete_product_location_with_audit(
  p_id uuid,
  p_actorUserID uuid,
  p_correlationID uuid
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
    p_actorUserID,
    'delete',
    'product_location',
    v_row.id,
    p_correlationID,
    jsonb_build_object(
      'productID', v_row.productID,
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
