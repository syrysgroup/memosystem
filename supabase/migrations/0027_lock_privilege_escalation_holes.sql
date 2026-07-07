-- Security audit fixes: two RLS/function-level authorization gaps that let a
-- direct API/RPC call bypass what the UI hides.
--
-- 1. profiles_update's with_check is `id = auth.uid() OR oversees_profile(id)`
--    with no column restriction. Any authenticated user could PATCH their own
--    profile row and set is_admin / is_org_admin / is_security_admin (or
--    is_active) to true directly via PostgREST, bypassing every RLS policy
--    gated on those flags. Verified live before this fix: a plain staff
--    account with no admin flags successfully set all three to true on its
--    own row. Fixed with a BEFORE UPDATE trigger requiring the true bootstrap
--    admin (is_admin()) to touch any of these four columns, regardless of who
--    else the row-level policy would otherwise let update that row.
--
-- 2. grant_auto_extend() is SECURITY DEFINER and callable by any authenticated
--    user, but never checked that the caller is the grant's own grantee or a
--    security admin. Verified live before this fix: an unrelated staff
--    account (not the grantee, not security_admin) successfully extended a
--    stranger's audit grant by 30 days just by knowing its id. Fixed by
--    adding the missing authorization check inside the function.

create or replace function enforce_profile_privileged_columns_admin_only()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.is_admin is distinct from old.is_admin)
     or (new.is_org_admin is distinct from old.is_org_admin)
     or (new.is_security_admin is distinct from old.is_security_admin)
     or (new.is_active is distinct from old.is_active)
  then
    if not is_admin() then
      raise exception 'Only a bootstrap administrator may change is_admin, is_org_admin, is_security_admin, or is_active';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_enforce_privileged_columns on profiles;
create trigger profiles_enforce_privileged_columns
  before update on profiles
  for each row execute function enforce_profile_privileged_columns_admin_only();

-- Postgres grants EXECUTE to PUBLIC on newly created functions by default,
-- so without this the trigger function above would be exposed as a callable
-- RPC (/rest/v1/rpc/enforce_profile_privileged_columns_admin_only) to anon
-- and authenticated alike, even though it's trigger-only (references NEW/OLD,
-- meaningless outside trigger context) and has no business being callable
-- directly at all.
revoke all on function enforce_profile_privileged_columns_admin_only() from public;
revoke all on function enforce_profile_privileged_columns_admin_only() from anon;
revoke all on function enforce_profile_privileged_columns_admin_only() from authenticated;

create or replace function grant_auto_extend(p_grant_id uuid)
returns grants
language plpgsql
security definer
set search_path = public
as $$
declare
  v_grant grants;
  v_remaining int;
  v_add int;
begin
  select * into v_grant from grants where id = p_grant_id for update;
  if v_grant is null then
    raise exception 'Grant % not found', p_grant_id;
  end if;

  if not (is_security_admin() or v_grant.grantee_profile_id = auth.uid()) then
    raise exception 'Only the grantee or a security admin may extend this grant';
  end if;

  if v_grant.status <> 'active' or v_grant.expires_at <= now() then
    raise exception 'Grant is not active; a fresh grant must be issued instead of extending this one';
  end if;

  v_remaining := 90 - v_grant.original_length_days - v_grant.total_extension_days;
  if v_remaining <= 0 then
    raise exception 'Grant has reached its 90-day cumulative cap; issue a new grant instead';
  end if;

  v_add := least(30, v_remaining);
  update grants
  set expires_at = expires_at + make_interval(days => v_add),
      total_extension_days = total_extension_days + v_add
  where id = p_grant_id
  returning * into v_grant;

  return v_grant;
end;
$$;

revoke all on function grant_auto_extend(uuid) from public;
grant execute on function grant_auto_extend(uuid) to authenticated;
