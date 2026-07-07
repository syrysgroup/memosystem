-- Postgres grants EXECUTE on new functions to PUBLIC by default, which
-- Supabase's PostgREST layer turns into a callable RPC endpoint for both
-- `anon` and `authenticated`. Two classes of function need tightening:
--
-- 1. Trigger functions (return trigger) and internal-only helpers are never
--    meant to be invoked directly at all — trigger firing doesn't require
--    the DML-issuing role to hold EXECUTE, so revoking from everyone is safe
--    and just closes off a pointless RPC surface.
-- 2. Everything else is used inside RLS policies for the `authenticated`
--    role (or is an intentional app-facing RPC like supersede_circular),
--    so `authenticated` must keep EXECUTE — but `anon` has no legitimate
--    use for any of it in this system (there is no public/unauthenticated
--    surface here at all), so it loses access to all of it.

revoke execute on function prepare_new_document() from public;
revoke execute on function log_document_origination() from public;
revoke execute on function enforce_document_update_rules() from public;
revoke execute on function log_document_update() from public;
revoke execute on function on_minute_inserted() from public;
revoke execute on function audit_row_change() from public;
revoke execute on function enforce_named_role_admin_only() from public;
revoke execute on function enforce_named_role_admin_only_insert() from public;
revoke execute on function next_unique_code(text, text) from public;

revoke execute on function is_admin() from anon;
revoke execute on function org_unit_descendants(uuid) from anon;
revoke execute on function is_current_holder(uuid) from anon;
revoke execute on function profile_ever_held_position(uuid) from anon;
revoke execute on function is_originator(uuid) from anon;
revoke execute on function is_senior_originator(uuid) from anon;
revoke execute on function is_movement_participant(uuid) from anon;
revoke execute on function is_minute_author(uuid) from anon;
revoke execute on function has_active_audit_grant(uuid) from anon;
revoke execute on function is_active_delegate_for_document(uuid) from anon;
revoke execute on function has_document_chain_access(uuid) from anon;
revoke execute on function has_minute_chain_access(uuid) from anon;
revoke execute on function has_write_access_digital(uuid) from anon;
revoke execute on function has_write_access_physical(uuid) from anon;
revoke execute on function has_decision_authority(uuid) from anon;
revoke execute on function requester_tier_for_role(position_role) from anon;
revoke execute on function decode_unique_code_origin(text, timestamptz) from anon;
revoke execute on function current_prefix_for_org_unit(uuid, timestamptz) from anon;
revoke execute on function oversees_org_unit(uuid) from anon;
revoke execute on function oversees_profile(uuid) from anon;
revoke execute on function grant_auto_extend(uuid) from anon;
revoke execute on function supersede_circular(uuid, text) from anon;
revoke execute on function reporting_line_summary(uuid) from anon;
revoke execute on function reporting_line_drilldown(uuid) from anon;
