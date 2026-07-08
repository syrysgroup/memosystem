// Staff onboarding: creates a real Supabase Auth user + matching profile +
// initial position, in one atomic-ish flow, restricted to org admins.
//
// Runs as a Supabase Edge Function (not app code) specifically so it can
// use the service-role key without ever putting that secret in the
// Next.js/Cloudflare Workers environment -- Supabase provisions
// SUPABASE_SERVICE_ROLE_KEY automatically inside every edge function.
//
// Authorization is re-checked here independently of the caller's claims:
// the incoming JWT is used to build a request-scoped client and call the
// same is_org_admin() RPC the rest of the app trusts, before any
// privileged action happens. A client merely being allowed to invoke this
// function (verify_jwt requires a valid session) says nothing about
// whether that session is an org admin -- that check has to happen here,
// server-side, against the database's own claim.
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function generateTempPassword(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  const random = btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, "");
  // Guarantee it satisfies typical password-strength rules regardless of
  // what the random slice happens to contain.
  return `${random.slice(0, 16)}Aa1!`;
}

type RequestBody = {
  email?: string;
  full_name?: string;
  org_unit_id?: string;
  role?: "head" | "office_manager" | "staff";
  named_role?: string | null;
  position_type_id?: string | null;
  grade?: string | null;
};

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "Missing Authorization header" }, 401);
  }

  const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: isOrgAdmin, error: authCheckError } = await callerClient.rpc("is_org_admin");
  if (authCheckError || !isOrgAdmin) {
    return jsonResponse({ error: "Only an org admin may create staff accounts" }, 403);
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const fullName = (body.full_name ?? "").trim();
  const orgUnitId = body.org_unit_id ?? null;
  const role = body.role ?? null;

  if (!email || !fullName || !orgUnitId || !role) {
    return jsonResponse({ error: "email, full_name, org_unit_id, and role are required" }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ error: "Invalid email address" }, 400);
  }
  if (!["head", "office_manager", "staff"].includes(role)) {
    return jsonResponse({ error: "role must be head, office_manager, or staff" }, 400);
  }

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const tempPassword = generateTempPassword();

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });
  if (createError || !created?.user) {
    const alreadyExists = createError?.message?.toLowerCase().includes("already been registered");
    return jsonResponse({ error: createError?.message ?? "Failed to create user" }, alreadyExists ? 409 : 500);
  }

  const newUserId = created.user.id;

  const { error: profileError } = await adminClient.from("profiles").insert({
    id: newUserId,
    full_name: fullName,
    email,
  });
  if (profileError) {
    await adminClient.auth.admin.deleteUser(newUserId);
    return jsonResponse({ error: `Failed to create profile: ${profileError.message}` }, 500);
  }

  const { error: positionError } = await adminClient.from("positions").insert({
    org_unit_id: orgUnitId,
    profile_id: newUserId,
    role,
    named_role: body.named_role ?? null,
    position_type_id: body.position_type_id ?? null,
    grade: body.grade ?? null,
  });
  if (positionError) {
    // The account and profile are real and usable even if the position
    // assignment failed (e.g. an invalid grade for the chosen template) --
    // surface the temp password either way so the account isn't stranded,
    // and let the caller assign a position separately from the Team page.
    return jsonResponse(
      {
        warning: `Account created, but the initial position failed: ${positionError.message}`,
        user_id: newUserId,
        temp_password: tempPassword,
      },
      207,
    );
  }

  return jsonResponse({ user_id: newUserId, temp_password: tempPassword }, 200);
});
