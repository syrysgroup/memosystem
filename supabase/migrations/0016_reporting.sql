-- security_invoker so ordinary querying is still subject to the caller's RLS
-- (has_document_chain_access) — this view does NOT bypass access control.
-- The reporting-line functions below are the deliberate, self-authorizing
-- exception (aggregate/limited data only, never full rows).
create view documents_with_status
  with (security_invoker = true)
  as
select
  d.*,
  dt.name as document_type_name,
  dt.code as document_type_code,
  cust_ou.id as current_org_unit_id,
  cust_ou.name as current_org_unit_name,
  phys_ou.id as current_physical_org_unit_id,
  phys_ou.name as current_physical_org_unit_name,
  arrival.occurred_at as arrived_at_current_office,
  extract(day from now() - arrival.occurred_at)::int as days_in_office,
  extract(day from coalesce(d.decided_at, now()) - d.created_at)::int as days_in_system
from documents d
join document_types dt on dt.id = d.document_type_id
left join positions cust_pos on cust_pos.id = d.current_digital_custodian_id
left join org_units cust_ou on cust_ou.id = cust_pos.org_unit_id
left join positions phys_pos on phys_pos.id = d.current_physical_custodian_id
left join org_units phys_ou on phys_ou.id = phys_pos.org_unit_id
left join lateral (
  select me.occurred_at
  from movement_events me
  where me.document_id = d.id
    and me.channel = 'digital'
    and me.from_position_id is distinct from me.to_position_id
  order by me.occurred_at desc
  limit 1
) arrival on true;

-- Aggregate-only reporting-line view (Section 7/10.1 "ReportingRole"): no
-- subject line, no document identity — just bucketed, tagged counts. Callers
-- must actually oversee root_org_unit_id (head/office_manager/admin); the
-- function raises otherwise rather than silently returning nothing.
create or replace function reporting_line_summary(root_org_unit_id uuid)
returns table (
  bucket text,
  tag text,
  newly_inherited boolean,
  doc_count int
) language plpgsql stable security definer set search_path = public as $$
begin
  if not oversees_org_unit(root_org_unit_id) then
    raise exception 'Not authorized to view reporting-line data for this org unit';
  end if;

  -- Note: the SQL aliases below are deliberately NOT named the same as this
  -- function's OUT parameters (bucket/tag/newly_inherited/doc_count) — a
  -- plpgsql table function's OUT parameters become variables in scope, and a
  -- same-named query column is otherwise ambiguous against that variable.
  return query
  with scope as (
    select dws.*,
      (cust_ou.effective_from > dws.arrived_at_current_office) as is_newly_inherited
    from documents_with_status dws
    join org_units cust_ou on cust_ou.id = dws.current_org_unit_id
    where dws.current_org_unit_id in (select id from org_unit_descendants(root_org_unit_id))
      and not dws.is_closed
  ),
  bucketed as (
    select
      case
        when coalesce(days_in_office, 0) <= 3 then '0-3'
        when coalesce(days_in_office, 0) <= 7 then '4-7'
        else '8+'
      end as day_bucket,
      is_newly_inherited,
      (decision_status not in ('approved', 'rejected', 'withdrawn')) as decision_pending,
      (physical_status <> 'delivered') as delivery_outstanding
    from scope
  )
  select day_bucket, 'decision_pending', is_newly_inherited, count(*)::int
  from bucketed where decision_pending
  group by day_bucket, is_newly_inherited
  union all
  select day_bucket, 'delivery_outstanding', is_newly_inherited, count(*)::int
  from bucketed where delivery_outstanding
  group by day_bucket, is_newly_inherited;
end;
$$;

-- Deliberately broader than chain access (Section 7.1): subject line +
-- originating/pending office, still nothing else (no minutes, no decision
-- detail beyond the pending tags).
create or replace function reporting_line_drilldown(root_org_unit_id uuid)
returns table (
  document_id uuid,
  unique_code text,
  subject text,
  originating_office_name text,
  pending_office_name text,
  decision_pending boolean,
  delivery_outstanding boolean,
  days_in_office int
) language plpgsql stable security definer set search_path = public as $$
begin
  if not oversees_org_unit(root_org_unit_id) then
    raise exception 'Not authorized to view reporting-line data for this org unit';
  end if;

  return query
  select
    dws.id,
    dws.unique_code,
    dws.subject,
    origin_ou.name,
    dws.current_org_unit_name,
    (dws.decision_status not in ('approved', 'rejected', 'withdrawn')),
    (dws.physical_status <> 'delivered'),
    dws.days_in_office
  from documents_with_status dws
  join positions origin_pos on origin_pos.id = dws.originating_position_id
  join org_units origin_ou on origin_ou.id = origin_pos.org_unit_id
  where dws.current_org_unit_id in (select id from org_unit_descendants(root_org_unit_id))
    and not dws.is_closed;
end;
$$;
