/**
 * Populated after seeding demo Positions + Supabase Auth users (see
 * supabase/migrations for the demo org, and README "Demo accounts" for
 * how these were created). Shown on the login page's "Show demo accounts"
 * toggle so a reviewer can try each role without their own data.
 */
const DEMO_PASSWORD = "EcowasDemo#2026";

export const DEMO_ACCOUNTS: { role: string; email: string; password: string }[] = [
  { role: "Admin", email: "demo.admin@ecowas-demo.org", password: DEMO_PASSWORD },
  { role: "Secretary-General", email: "demo.sg@ecowas-demo.org", password: DEMO_PASSWORD },
  { role: "Director, Admin & Finance", email: "demo.finance@ecowas-demo.org", password: DEMO_PASSWORD },
  { role: "Head of HR", email: "demo.hr@ecowas-demo.org", password: DEMO_PASSWORD },
  { role: "Office Manager", email: "demo.commsmanager@ecowas-demo.org", password: DEMO_PASSWORD },
  { role: "Staff (on leave)", email: "demo.staff@ecowas-demo.org", password: DEMO_PASSWORD },
  { role: "Registry", email: "demo.registry@ecowas-demo.org", password: DEMO_PASSWORD },
];
