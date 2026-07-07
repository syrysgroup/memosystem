-- Pin search_path (flagged by the security linter as "mutable"); this one
-- was missed when 0013 was first written since it doesn't touch any table.
create or replace function requester_tier_for_role(p_role position_role)
returns requester_tier language sql immutable set search_path = public as $$
  select case when p_role in ('head', 'office_manager') then 'senior_originator'::requester_tier
              else 'junior_originator'::requester_tier end;
$$;
