-- 0020 revoked EXECUTE from `anon` directly, but every role also inherits
-- whatever PUBLIC still holds — and PUBLIC's default "grant on create" was
-- never revoked, so anon kept access through that back door. Revoke from
-- PUBLIC (closing it for anon) and grant back to `authenticated` explicitly,
-- since RLS policies evaluate these functions as that role.
revoke execute on function is_admin() from public;
revoke execute on function org_unit_descendants(uuid) from public;
revoke execute on function is_current_holder(uuid) from public;
revoke execute on function profile_ever_held_position(uuid) from public;
revoke execute on function is_originator(uuid) from public;
revoke execute on function is_senior_originator(uuid) from public;
revoke execute on function is_movement_participant(uuid) from public;
revoke execute on function is_minute_author(uuid) from public;
revoke execute on function has_active_audit_grant(uuid) from public;
revoke execute on function is_active_delegate_for_document(uuid) from public;
revoke execute on function has_document_chain_access(uuid) from public;
revoke execute on function has_minute_chain_access(uuid) from public;
revoke execute on function has_write_access_digital(uuid) from public;
revoke execute on function has_write_access_physical(uuid) from public;
revoke execute on function has_decision_authority(uuid) from public;
revoke execute on function requester_tier_for_role(position_role) from public;
revoke execute on function decode_unique_code_origin(text, timestamptz) from public;
revoke execute on function current_prefix_for_org_unit(uuid, timestamptz) from public;
revoke execute on function oversees_org_unit(uuid) from public;
revoke execute on function oversees_profile(uuid) from public;
revoke execute on function grant_auto_extend(uuid) from public;
revoke execute on function supersede_circular(uuid, text) from public;
revoke execute on function reporting_line_summary(uuid) from public;
revoke execute on function reporting_line_drilldown(uuid) from public;

grant execute on function is_admin() to authenticated;
grant execute on function org_unit_descendants(uuid) to authenticated;
grant execute on function is_current_holder(uuid) to authenticated;
grant execute on function profile_ever_held_position(uuid) to authenticated;
grant execute on function is_originator(uuid) to authenticated;
grant execute on function is_senior_originator(uuid) to authenticated;
grant execute on function is_movement_participant(uuid) to authenticated;
grant execute on function is_minute_author(uuid) to authenticated;
grant execute on function has_active_audit_grant(uuid) to authenticated;
grant execute on function is_active_delegate_for_document(uuid) to authenticated;
grant execute on function has_document_chain_access(uuid) to authenticated;
grant execute on function has_minute_chain_access(uuid) to authenticated;
grant execute on function has_write_access_digital(uuid) to authenticated;
grant execute on function has_write_access_physical(uuid) to authenticated;
grant execute on function has_decision_authority(uuid) to authenticated;
grant execute on function requester_tier_for_role(position_role) to authenticated;
grant execute on function decode_unique_code_origin(text, timestamptz) to authenticated;
grant execute on function current_prefix_for_org_unit(uuid, timestamptz) to authenticated;
grant execute on function oversees_org_unit(uuid) to authenticated;
grant execute on function oversees_profile(uuid) to authenticated;
grant execute on function grant_auto_extend(uuid) to authenticated;
grant execute on function supersede_circular(uuid, text) to authenticated;
grant execute on function reporting_line_summary(uuid) to authenticated;
grant execute on function reporting_line_drilldown(uuid) to authenticated;
