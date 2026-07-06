-- security_invoker so the view is subject to the querying user's RLS, not the
-- view owner's — otherwise this would leak every document regardless of policy.
create view documents_with_status
  with (security_invoker = true)
  as
select
  d.*,
  ou_current.name as current_org_unit_name,
  ou_current.code as current_org_unit_code,
  ou_origin.name as origin_org_unit_name,
  dt.name as document_type_name,
  dt.code_prefix,
  lm.sent_at as last_moved_at,
  extract(day from now() - lm.sent_at)::int as days_in_current_office
from documents d
join org_units ou_current on ou_current.id = d.current_org_unit_id
join org_units ou_origin on ou_origin.id = d.origin_org_unit_id
join document_types dt on dt.id = d.document_type_id
left join lateral (
  select dm.sent_at
  from document_movements dm
  where dm.document_id = d.id
  order by dm.sent_at desc
  limit 1
) lm on true;
