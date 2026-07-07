-- Access-control building blocks. All SECURITY DEFINER + STABLE so they can
-- be used freely inside RLS policies without recursive-RLS problems.

create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and is_admin and is_active);
$$;

-- Recursive: root and everything beneath it in the CURRENT organogram.
-- Used for reporting-line scope (the one deliberately-live-query exception).
create or replace function org_unit_descendants(root uuid)
returns table (id uuid) language sql stable security definer set search_path = public as $$
  with recursive tree as (
    select ou.id from org_units ou where ou.id = root
    union all
    select ou.id from org_units ou join tree t on ou.parent_id = t.id where ou.effective_to is null
  )
  select id from tree;
$$;

-- "Currently serving" = today falls within the position's date range.
create or replace function is_current_holder(p_position_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from positions p
    where p.id = p_position_id
      and p.profile_id = auth.uid()
      and p.start_date <= current_date
      and (p.end_date is null or p.end_date >= current_date)
  );
$$;

-- Permanent: has this profile EVER been the person behind this position,
-- regardless of whether that position is still active. Used for chain
-- membership, which never expires once earned.
create or replace function profile_ever_held_position(p_position_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from positions p where p.id = p_position_id and p.profile_id = auth.uid());
$$;

create or replace function is_originator(p_document_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from documents d where d.id = p_document_id and profile_ever_held_position(d.originating_position_id)
  );
$$;

create or replace function is_senior_originator(p_document_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from documents d
    where d.id = p_document_id
      and d.requester_tier = 'senior_originator'
      and profile_ever_held_position(d.originating_position_id)
  );
$$;

create or replace function is_movement_participant(p_document_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from movement_events me
    join positions p on p.id in (me.from_position_id, me.to_position_id)
    where me.document_id = p_document_id and p.profile_id = auth.uid()
  );
$$;

create or replace function is_minute_author(p_document_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from minutes m
    join positions p on p.id = m.author_position_id
    where m.document_id = p_document_id and p.profile_id = auth.uid()
  );
$$;

-- Full unfiltered access within an active, unexpired grant, scoped to the
-- audited historical period. RLS re-evaluates this on every query, so
-- expiry is a hard cutoff with no separate session bookkeeping required.
create or replace function has_active_audit_grant(p_document_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from grants g
    join documents d on d.id = p_document_id
    where g.grantee_profile_id = auth.uid()
      and g.status = 'active'
      and now() between g.issued_at and g.expires_at
      and d.created_at::date between g.audit_period_start and g.audit_period_end
  );
$$;

-- Standing in for whoever currently holds the document (either custody
-- track) via an active Delegation. Without this, a delegate could act on a
-- document (has_write_access_*) but never actually SEE it — the whole point
-- of delegation is that pending work visibly transfers into their queue.
create or replace function is_active_delegate_for_document(p_document_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from documents d
    join delegations dg on dg.original_position_id in (d.current_digital_custodian_id, d.current_physical_custodian_id)
    join positions delegate_pos on delegate_pos.id = dg.delegate_position_id
    where d.id = p_document_id
      and dg.status = 'active'
      and current_date between dg.start_date and dg.end_date
      and delegate_pos.profile_id = auth.uid()
  );
$$;

-- Document metadata: full access if you originated it (either tier), you
-- were ever a movement participant, or you ever wrote a minute on it.
create or replace function has_document_chain_access(p_document_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    is_admin()
    or has_active_audit_grant(p_document_id)
    or is_originator(p_document_id)
    or is_movement_participant(p_document_id)
    or is_minute_author(p_document_id)
    or is_active_delegate_for_document(p_document_id);
$$;

-- Minutes specifically: a junior_originator is excluded (their only
-- entitlement is decision_summary/decision_number on the document itself,
-- not minute content) unless they also independently qualify as a movement
-- participant or minute author.
create or replace function has_minute_chain_access(p_document_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    is_admin()
    or has_active_audit_grant(p_document_id)
    or is_movement_participant(p_document_id)
    or is_minute_author(p_document_id)
    or is_senior_originator(p_document_id)
    or is_active_delegate_for_document(p_document_id);
$$;

create or replace function has_write_access_digital(p_document_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    is_admin()
    or exists (
      select 1 from documents d
      join profiles pr on pr.id = auth.uid()
      where d.id = p_document_id and is_current_holder(d.current_digital_custodian_id) and not pr.on_leave
    )
    or exists (
      select 1 from documents d
      join delegations dg on dg.original_position_id = d.current_digital_custodian_id
      join positions delegate_pos on delegate_pos.id = dg.delegate_position_id
      where d.id = p_document_id
        and dg.status = 'active'
        and current_date between dg.start_date and dg.end_date
        and delegate_pos.profile_id = auth.uid()
    );
$$;

create or replace function has_write_access_physical(p_document_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    is_admin()
    or exists (
      select 1 from documents d
      join profiles pr on pr.id = auth.uid()
      where d.id = p_document_id and is_current_holder(d.current_physical_custodian_id) and not pr.on_leave
    )
    or exists (
      select 1 from documents d
      join delegations dg on dg.original_position_id = d.current_physical_custodian_id
      join positions delegate_pos on delegate_pos.id = dg.delegate_position_id
      where d.id = p_document_id
        and dg.status = 'active'
        and current_date between dg.start_date and dg.end_date
        and delegate_pos.profile_id = auth.uid()
    );
$$;

-- Authority to render a decision on a document: either the generic
-- current-holder rule, or (for types like Circular) one of the specific
-- named executive roles the DocumentType lists — any one of them is
-- independently sufficient (spec section 9: origination/approval by any of
-- the three is final, no peer sign-off required).
create or replace function has_decision_authority(p_document_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    is_admin()
    or (
      exists (
        select 1 from documents d
        join document_types dt on dt.id = d.document_type_id
        where d.id = p_document_id and 'current_custodian' = any(dt.decision_authority_role)
      )
      and has_write_access_digital(p_document_id)
    )
    or exists (
      select 1 from documents d
      join document_types dt on dt.id = d.document_type_id
      join positions p on p.profile_id = auth.uid() and p.end_date is null
      where d.id = p_document_id and p.named_role = any(dt.decision_authority_role)
    );
$$;

create or replace function requester_tier_for_role(p_role position_role)
returns requester_tier language sql immutable set search_path = public as $$
  select case when p_role in ('head', 'office_manager') then 'senior_originator'::requester_tier
              else 'junior_originator'::requester_tier end;
$$;

-- Resolves a prefix to a unit name as of a given moment (default: now), so a
-- visitor's code decodes correctly even years after a rename/merger/split.
create or replace function decode_unique_code_origin(p_unique_code text, p_as_of timestamptz default now())
returns text language sql stable security definer set search_path = public as $$
  select unit_name from prefix_decode_table
  where prefix = split_part(p_unique_code, '-', 1)
    and effective_from <= p_as_of
    and (effective_to is null or effective_to > p_as_of)
  order by effective_from desc
  limit 1;
$$;
