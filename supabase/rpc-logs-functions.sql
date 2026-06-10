-- ============================================================
-- StockPulse — RPC + Audit bundle (refactored + diff)
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- AUDIT TABLE
-- ============================================================

create table if not exists public.logs (
                                         id uuid primary key default uuid_generate_v4(),
  actor_user_id uuid null,
  action text not null,
  entity_type text not null,
  entity_id uuid null,
  correlation_id uuid not null,
  old_values jsonb null,
  new_values jsonb null,
  table_name text null,
  record_id text null,
  created_at timestamptz not null default now(),
  constraint logs_actor_user_id_fkey
  foreign key (actor_user_id) references public.users (id),
  constraint logs_action_check
  check (action in ('INSERT', 'UPDATE', 'DELETE', 'REPLACE_PERMISSIONS')),
  constraint logs_entity_type_check
  check (entity_type in ('product', 'user', 'product_location'))
  );

create index if not exists idx_logs_actor_user_id
  on public.logs (actor_user_id);

create index if not exists idx_logs_entity
  on public.logs (entity_type, entity_id);

create index if not exists idx_logs_correlation_id
  on public.logs (correlation_id);

create index if not exists idx_logs_created_at
  on public.logs (created_at desc);

create index if not exists idx_logs_table_record
  on public.logs (table_name, record_id);

-- ============================================================
-- AUDIT HELPERS
-- ============================================================

create or replace function public.mask_sensitive_json(p_data jsonb)
returns jsonb
language sql
immutable
as $$
select
  case
    when p_data is null then null
    else
      p_data
        - 'password'
        - 'token'
        - 'access_token'
        - 'refresh_token'
        - 'secret'
        - 'api_key'
        || case when p_data ? 'password' then jsonb_build_object('password', '***') else '{}'::jsonb end
        || case when p_data ? 'token' then jsonb_build_object('token', '***') else '{}'::jsonb end
        || case when p_data ? 'access_token' then jsonb_build_object('access_token', '***') else '{}'::jsonb end
        || case when p_data ? 'refresh_token' then jsonb_build_object('refresh_token', '***') else '{}'::jsonb end
        || case when p_data ? 'secret' then jsonb_build_object('secret', '***') else '{}'::jsonb end
        || case when p_data ? 'api_key' then jsonb_build_object('api_key', '***') else '{}'::jsonb end
    end;
$$;

create or replace function public.jsonb_diff(
    p_old jsonb,
    p_new jsonb
)
returns jsonb
language plpgsql
immutable
as $$
declare
v_key text;
    v_old_val jsonb;
    v_new_val jsonb;
    v_result jsonb := '{}'::jsonb;
begin
    if p_old is null and p_new is null then
        return '{}'::jsonb;
end if;

for v_key in
select key
from (
  select jsonb_object_keys(coalesce(p_old, '{}'::jsonb)) as key
  union
  select jsonb_object_keys(coalesce(p_new, '{}'::jsonb)) as key
  ) s
  loop
  v_old_val := coalesce(p_old -> v_key, 'null'::jsonb);
v_new_val := coalesce(p_new -> v_key, 'null'::jsonb);

        if v_old_val is distinct from v_new_val then
            v_result := v_result || jsonb_build_object(
                v_key,
                jsonb_build_object(
                    'old', v_old_val,
                    'new', v_new_val
                )
            );
end if;
end loop;

return v_result;
end;
$$;

create or replace function public.logs_audit_event(
    p_actor_user_id uuid,
    p_action text,
    p_entity_type text,
    p_entity_id uuid,
    p_correlation_id uuid,
    p_old_values jsonb default null,
    p_new_values jsonb default null,
    p_table_name text default null,
    p_record_id text default null
)
returns void
language plpgsql
as $$
begin
    if p_action is null or btrim(p_action) = '' then
        raise exception 'logs_audit_event: p_action must not be null or empty';
end if;

    if p_entity_type is null or btrim(p_entity_type) = '' then
        raise exception 'logs_audit_event: p_entity_type must not be null or empty';
end if;

    if p_correlation_id is null then
        raise exception 'logs_audit_event: p_correlation_id must not be null';
end if;

insert into public.logs (
  actor_user_id,
  action,
  entity_type,
  entity_id,
  correlation_id,
  old_values,
  new_values,
  table_name,
  record_id
)
values (
         p_actor_user_id,
         upper(trim(p_action)),
         lower(trim(p_entity_type)),
         p_entity_id,
         p_correlation_id,
         public.mask_sensitive_json(p_old_values),
         public.mask_sensitive_json(p_new_values),
         nullif(trim(p_table_name), ''),
         coalesce(nullif(trim(p_record_id), ''), p_entity_id::text)
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
        'INSERT',
        'product',
        v_product.id,
        p_correlation_id,
        null,
        to_jsonb(v_product),
        'products',
        v_product.id::text
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
v_old_product public.products;
    v_product public.products;
    v_old_json jsonb;
    v_new_json jsonb;
    v_diff jsonb;
begin
select *
into v_old_product
from public.products
where id = p_product_id
  for update;

if v_old_product is null then
        return null;
end if;

update public.products
set
  name = case when p_updates ? 'name' then p_updates->>'name' else name end,
  sku = case when p_updates ? 'sku' then p_updates->>'sku' else sku end,
  category = case when p_updates ? 'category' then p_updates->>'category' else category end,
  quantity = case when p_updates ? 'quantity' then (p_updates->>'quantity')::integer else quantity end,
        price = case when p_updates ? 'price' then (p_updates->>'price')::numeric else price end,
        low_stock_threshold = case
            when p_updates ? 'low_stock_threshold' then (p_updates->>'low_stock_threshold')::integer
            else low_stock_threshold
end,
        description = case when p_updates ? 'description' then p_updates->>'description' else description end
    where id = p_product_id
    returning * into v_product;

    if v_product is null then
        return null;
end if;

    v_old_json := to_jsonb(v_old_product);
    v_new_json := to_jsonb(v_product);
    v_diff := public.jsonb_diff(v_old_json, v_new_json);

    if v_diff = '{}'::jsonb then
        return v_product;
end if;

    perform public.logs_audit_event(
        p_actor_user_id,
        'UPDATE',
        'product',
        v_product.id,
        p_correlation_id,
        v_old_json,
        jsonb_build_object('diff', v_diff, 'after', v_new_json),
        'products',
        v_product.id::text
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
        'DELETE',
        'product',
        p_product_id,
        p_correlation_id,
        to_jsonb(v_product),
        null,
        'products',
        p_product_id::text
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
v_user public.users;
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
  returning * into v_user;

perform public.logs_audit_event(
        p_actor_user_id,
        'INSERT',
        'user',
        v_user.id,
        p_correlation_id,
        null,
        public.mask_sensitive_json(to_jsonb(v_user)),
        'users',
        v_user.id::text
    );

return v_user.id;
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
v_old_user public.users;
    v_user public.users;
    v_old_json jsonb;
    v_new_json jsonb;
    v_diff jsonb;
begin
select *
into v_old_user
from public.users
where id = p_user_id
  for update;

if v_old_user is null then
        return false;
end if;

update public.users
set
  username = case when p_updates ? 'username' then p_updates->>'username' else username end,
  password = case when p_updates ? 'password' then p_updates->>'password' else password end,
  full_name = case when p_updates ? 'full_name' then p_updates->>'full_name' else full_name end,
  rank = case when p_updates ? 'rank' then p_updates->>'rank' else rank end,
  unit = case when p_updates ? 'unit' then p_updates->>'unit' else unit end,
  callsign = case when p_updates ? 'callsign' then p_updates->>'callsign' else callsign end,
  clearance_level = case when p_updates ? 'clearance_level' then p_updates->>'clearance_level' else clearance_level end,
  is_active = case when p_updates ? 'is_active' then (p_updates->>'is_active')::boolean else is_active end
where id = p_user_id
  returning * into v_user;

if v_user is null then
        return false;
end if;

    v_old_json := public.mask_sensitive_json(to_jsonb(v_old_user));
    v_new_json := public.mask_sensitive_json(to_jsonb(v_user));
    v_diff := public.jsonb_diff(v_old_json, v_new_json);

    if v_diff = '{}'::jsonb then
        return true;
end if;

    perform public.logs_audit_event(
        p_actor_user_id,
        'UPDATE',
        'user',
        p_user_id,
        p_correlation_id,
        v_old_json,
        jsonb_build_object('diff', v_diff, 'after', v_new_json),
        'users',
        p_user_id::text
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
select *
into v_user
from public.users
where id = p_user_id
  for update;

if v_user is null then
        return false;
end if;

delete from public.user_permissions
where user_id = p_user_id;

delete from public.users
where id = p_user_id;

perform public.logs_audit_event(
        p_actor_user_id,
        'DELETE',
        'user',
        p_user_id,
        p_correlation_id,
        public.mask_sensitive_json(to_jsonb(v_user)),
        null,
        'users',
        p_user_id::text
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
declare
v_old_permissions jsonb;
    v_new_permissions jsonb;
    v_diff jsonb;
begin
select coalesce(jsonb_agg(p.key order by p.key), '[]'::jsonb)
into v_old_permissions
from public.user_permissions up
       join public.permissions p on p.id = up.permission_id
where up.user_id = p_user_id;

delete from public.user_permissions
where user_id = p_user_id;

insert into public.user_permissions (user_id, permission_id)
select
  p_user_id,
  p.id
from public.permissions p
where p.key = any(coalesce(p_permission_keys, array[]::text[]));

v_new_permissions := coalesce(to_jsonb(p_permission_keys), '[]'::jsonb);
    v_diff := public.jsonb_diff(
        jsonb_build_object('permissions', coalesce(v_old_permissions, '[]'::jsonb)),
        jsonb_build_object('permissions', v_new_permissions)
    );

    if v_diff = '{}'::jsonb then
        return true;
end if;

    perform public.logs_audit_event(
        p_actor_user_id,
        'REPLACE_PERMISSIONS',
        'user',
        p_user_id,
        p_correlation_id,
        jsonb_build_object(
            'permissions', coalesce(v_old_permissions, '[]'::jsonb)
        ),
        jsonb_build_object(
            'diff', v_diff,
            'after', jsonb_build_object('permissions', v_new_permissions)
        ),
        'user_permissions',
        p_user_id::text
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
        'INSERT',
        'product_location',
        v_row.id,
        p_correlation_id,
        null,
        to_jsonb(v_row),
        'product_locations',
        v_row.id::text
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
v_old_row public.product_locations;
    v_row public.product_locations;
    v_old_json jsonb;
    v_new_json jsonb;
    v_diff jsonb;
begin
select *
into v_old_row
from public.product_locations
where id = p_id
  for update;

if v_old_row is null then
        return null;
end if;

update public.product_locations
set
  quantity = p_quantity,
  updated_at = now()
where id = p_id
  returning * into v_row;

if v_row is null then
        return null;
end if;

    v_old_json := to_jsonb(v_old_row) - 'updated_at';
    v_new_json := to_jsonb(v_row) - 'updated_at';
    v_diff := public.jsonb_diff(v_old_json, v_new_json);

    if v_diff = '{}'::jsonb then
        return v_row;
end if;

    perform public.logs_audit_event(
        p_actor_user_id,
        'UPDATE',
        'product_location',
        v_row.id,
        p_correlation_id,
        v_old_json,
        jsonb_build_object('diff', v_diff, 'after', v_new_json),
        'product_locations',
        v_row.id::text
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
        'DELETE',
        'product_location',
        v_row.id,
        p_correlation_id,
        to_jsonb(v_row) - 'updated_at',
        null,
        'product_locations',
        v_row.id::text
    );

return true;
end;
$$;

-- ============================================================
-- Refresh PostgREST schema cache
-- ============================================================

notify pgrst, 'reload schema';
