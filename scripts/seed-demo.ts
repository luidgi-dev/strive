/**
 * Demo account seeder (LUI-43).
 *
 * Creates the shared demo user (demo@striveapp.cc) plus two static co-members,
 * then seeds rituals, ~10 weeks of engineered log history, and a "Sport team"
 * circle. The demo user's current week, credits and insights are owned by the
 * nightly cron; the co-members are never reset.
 *
 * Idempotent: re-running clears these three accounts' rituals/logs/circle and
 * rebuilds them. It NEVER touches any other account.
 *
 * Run against prod with the service-role key from .env.local:
 *   npx tsx --env-file=.env.local scripts/seed-demo.ts
 *
 * Required env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 * DEMO_USER_PASSWORD. Optional: DEMO_COMEMBER1_EMAIL, DEMO_COMEMBER2_EMAIL
 * (default to +alias addresses on the maintainer mailbox).
 *
 * After this, run scripts/generate-demo-insights.ts to produce the frozen cards,
 * paste them into lib/demo-data.ts (DEMO_INSIGHTS), then trigger the demo-reset
 * cron once (or redeploy) so the current week + insights land.
 */
import { createClient } from "@supabase/supabase-js";

import { startOfWeek, todayInTimeZone } from "@/lib/date";
import {
  DEMO_CIRCLE_NAME,
  DEMO_HISTORY_WEEKS,
  DEMO_RITUALS,
  DEMO_SHARED_RITUAL_NAMES,
  DEMO_TIMEZONE,
  DEMO_USERNAME,
  addDaysIso,
  type DemoRitualDef,
} from "@/lib/demo-data";
import type { Database } from "@/lib/supabase/database.types";

const DEMO_EMAIL = "demo@striveapp.cc";

const url = required("NEXT_PUBLIC_SUPABASE_URL");
const serviceKey = required("SUPABASE_SERVICE_ROLE_KEY");
const demoPassword = required("DEMO_USER_PASSWORD");

// Co-members never log in; a random password is fine. Emails default to +alias
// addresses so they share one real mailbox.
const COMEMBER_EMAILS = [
  process.env.DEMO_COMEMBER1_EMAIL ?? "luidgi.dev+demo-maya@gmail.com",
  process.env.DEMO_COMEMBER2_EMAIL ?? "luidgi.dev+demo-tom@gmail.com",
];

const admin = createClient<Database>(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type Person = {
  email: string;
  password: string;
  username: string;
  timezone: string;
  avatarUrl: string;
  rituals: DemoRitualDef[];
  // Weeks of recent history to seed for this person.
  historyWeeks: number;
};

// Two co-members with their own movement rituals, shared into "Sport team" so the
// circle feed and momentum look lived-in. Static: the cron never touches them.
const COMEMBER_RITUALS: Record<string, DemoRitualDef[]> = {
  maya: [
    { name: "Morning run", categorySlug: "movement", frequencyUnit: "week", frequencyValue: 3, days: [1, 3, 6], icon: "🏃" },
    { name: "Cycling", categorySlug: "movement", frequencyUnit: "week", frequencyValue: 2, days: [2, 6], icon: "🚴" },
  ],
  tom: [
    { name: "Strength training", categorySlug: "movement", frequencyUnit: "week", frequencyValue: 3, days: [1, 3, 5], icon: "🏋️" },
    { name: "Morning run", categorySlug: "movement", frequencyUnit: "week", frequencyValue: 2, days: [2, 4], icon: "🏃" },
  ],
};

const PEOPLE: Record<"demo" | "maya" | "tom", Person> = {
  demo: {
    email: DEMO_EMAIL,
    password: demoPassword,
    username: DEMO_USERNAME,
    timezone: DEMO_TIMEZONE,
    // On-brand mark for the showcase account (its name is "Strive Demo", not a
    // person). Co-members below use real faces so the circle feels social.
    avatarUrl: "https://striveapp.cc/apple-touch-icon.png",
    rituals: DEMO_RITUALS,
    historyWeeks: DEMO_HISTORY_WEEKS,
  },
  maya: {
    email: COMEMBER_EMAILS[0],
    password: randomPassword(),
    username: "Maya",
    timezone: "Europe/Paris",
    avatarUrl: "https://i.pravatar.cc/300?img=49",
    rituals: COMEMBER_RITUALS.maya,
    historyWeeks: 4,
  },
  tom: {
    email: COMEMBER_EMAILS[1],
    password: randomPassword(),
    username: "Tom",
    timezone: "Europe/Paris",
    avatarUrl: "https://i.pravatar.cc/300?img=33",
    rituals: COMEMBER_RITUALS.tom,
    historyWeeks: 4,
  },
};

async function main() {
  const today = todayInTimeZone(DEMO_TIMEZONE);

  console.log("→ Resolving / creating auth users");
  const ids = {
    demo: await getOrCreateUser(PEOPLE.demo),
    maya: await getOrCreateUser(PEOPLE.maya),
    tom: await getOrCreateUser(PEOPLE.tom),
  };
  console.log("  ids:", ids);

  console.log("→ Clearing previous seed data for these accounts");
  await clearSeed(Object.values(ids));

  console.log("→ Seeding profiles");
  await Promise.all(
    (Object.keys(ids) as (keyof typeof ids)[]).map((k) =>
      upsertProfile(ids[k], PEOPLE[k]),
    ),
  );

  console.log("→ Seeding rituals + history logs");
  const ritualIds: Record<string, Record<string, string>> = {};
  for (const k of Object.keys(ids) as (keyof typeof ids)[]) {
    ritualIds[k] = await seedRitualsAndLogs(ids[k], PEOPLE[k], today);
  }

  console.log("→ Seeding 'Sport team' circle");
  await seedCircle(ids, ritualIds);

  console.log("✓ Demo seed complete.");
  console.log(
    "Next: set DEMO_USER_ID =",
    ids.demo,
    "in Vercel + .env.local, then run scripts/generate-demo-insights.ts",
  );
}

// --- Auth users -------------------------------------------------------------

async function getOrCreateUser(person: Person): Promise<string> {
  const existing = await findUserByEmail(person.email);
  if (existing) {
    await admin.auth.admin.updateUserById(existing, {
      password: person.password,
      email_confirm: true,
      user_metadata: {
        username: person.username,
        timezone: person.timezone,
        avatar_url: person.avatarUrl,
      },
    });
    return existing;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email: person.email,
    password: person.password,
    email_confirm: true,
    user_metadata: {
      username: person.username,
      timezone: person.timezone,
      avatar_url: person.avatarUrl,
    },
  });
  if (error || !data.user) throw error ?? new Error("createUser returned no user");
  return data.user.id;
}

async function findUserByEmail(email: string): Promise<string | null> {
  // Small project: a single large page is enough to find by email.
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  return data.users.find((u) => u.email === email)?.id ?? null;
}

// --- Profiles ---------------------------------------------------------------

async function upsertProfile(userId: string, person: Person) {
  const { error } = await admin
    .from("profiles")
    .update({
      username: person.username,
      avatar_url: person.avatarUrl,
      timezone: person.timezone,
      tier: "lite",
      is_active: true,
      smart_reminders_enabled: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (error) throw error;
}

// --- Rituals + logs ---------------------------------------------------------

async function seedRitualsAndLogs(
  userId: string,
  person: Person,
  today: string,
): Promise<Record<string, string>> {
  const categoryIdBySlug = await loadSystemCategories();
  const startedAt = addDaysIso(startOfWeek(today), -person.historyWeeks * 7);

  const ritualIdByName: Record<string, string> = {};
  for (const def of person.rituals) {
    const { data, error } = await admin
      .from("rituals")
      .insert({
        user_id: userId,
        category_id: categoryIdBySlug.get(def.categorySlug) ?? null,
        ritual_type: "recurring",
        name: def.name,
        icon: def.icon,
        frequency_unit: def.frequencyUnit,
        frequency_value: def.frequencyValue,
        scheduled_days: def.days,
        started_at: startedAt,
        is_active: true,
      })
      .select("id")
      .single();
    if (error || !data) throw error ?? new Error(`ritual insert failed: ${def.name}`);
    ritualIdByName[def.name] = data.id;
  }

  const logRows = buildHistoryLogs(userId, person, today, ritualIdByName);
  for (const batch of chunk(logRows, 500)) {
    const { error } = await admin.from("ritual_logs").insert(batch);
    if (error) throw error;
  }
  console.log(`  ${person.username}: ${person.rituals.length} rituals, ${logRows.length} logs`);
  return ritualIdByName;
}

/**
 * Engineered, deterministic history. The demo's daily rituals vary week to week
 * with Meditate and Read tracking each other (anchor pair) and Journaling rising
 * in Meditate-heavy weeks (correlation), while Meditate never lands on Sunday
 * (adjustment). Excludes the current in-progress week (the cron owns it).
 */
function buildHistoryLogs(
  userId: string,
  person: Person,
  today: string,
  ritualIdByName: Record<string, string>,
): Database["public"]["Tables"]["ritual_logs"]["Insert"][] {
  const monday = startOfWeek(today);
  const rows: Database["public"]["Tables"]["ritual_logs"]["Insert"][] = [];
  const isDemo = person.email === DEMO_EMAIL;

  for (let weeksAgo = person.historyWeeks; weeksAgo >= 1; weeksAgo--) {
    const weekMonday = addDaysIso(monday, -weeksAgo * 7);
    const highWeek = weeksAgo % 3 !== 0; // ~2 of every 3 weeks are "intense"

    for (const def of person.rituals) {
      const ritualId = ritualIdByName[def.name];
      const days = weekdaysForWeek(isDemo, def, highWeek);
      for (const weekday of days) {
        rows.push({
          ritual_id: ritualId,
          user_id: userId,
          status_id: "completed",
          logged_at: addDaysIso(weekMonday, weekday - 1),
          logged_via: "auto",
        });
      }
    }
  }
  return rows;
}

/**
 * The weekdays a ritual is logged in a given week. Each target day is kept with a
 * probability, so the history reads like real life (mostly on track, the odd
 * miss) rather than a perfect grid. Demo daily rituals carry the engineered
 * signals: Meditate is weak on Sundays (a gentle weekend adjustment), Journaling
 * swings at the WEEK level with Meditate intensity (a correlation), and the daily
 * trio overlaps day to day (an anchor pair).
 */
function weekdaysForWeek(
  isDemo: boolean,
  def: DemoRitualDef,
  highWeek: boolean,
): number[] {
  if (!isDemo) return sample(def.days, 0.85);

  switch (def.name) {
    case "Meditate":
      return [
        ...sample([1, 2, 3, 4, 5, 6], highWeek ? 0.92 : 0.5),
        ...sample([7], 0.25), // Sunday: occasional, so the weekend drop is real but not absolute
      ];
    case "Read 30 min":
      return sample([1, 2, 3, 4, 5, 6, 7], 0.85);
    case "Journaling":
      return sample([1, 2, 3, 4, 5, 6, 7], highWeek ? 0.85 : 0.2);
    default:
      // Weekly movement rituals: mostly hit their schedule, sometimes miss one.
      return sample(def.days, highWeek ? 0.9 : 0.7);
  }
}

/** Keep each day with probability `prob` (the source of the natural variation). */
function sample(days: number[], prob: number): number[] {
  return days.filter(() => Math.random() < prob);
}

// --- Circle -----------------------------------------------------------------

async function seedCircle(
  ids: Record<"demo" | "maya" | "tom", string>,
  ritualIds: Record<string, Record<string, string>>,
) {
  const { data: circle, error } = await admin
    .from("circles")
    .insert({
      name: DEMO_CIRCLE_NAME,
      description: "Friends keeping each other moving.",
      owner_id: ids.demo,
    })
    .select("id")
    .single();
  if (error || !circle) throw error ?? new Error("circle insert failed");

  const { error: membersError } = await admin.from("circle_members").insert([
    { circle_id: circle.id, user_id: ids.demo, role: "admin" },
    { circle_id: circle.id, user_id: ids.maya, role: "member" },
    { circle_id: circle.id, user_id: ids.tom, role: "member" },
  ]);
  if (membersError) throw membersError;

  // Each member shares their movement rituals into the circle.
  const shares: Database["public"]["Tables"]["circle_rituals"]["Insert"][] = [];
  for (const name of DEMO_SHARED_RITUAL_NAMES) {
    const rid = ritualIds.demo[name];
    if (rid) shares.push({ circle_id: circle.id, user_id: ids.demo, ritual_id: rid });
  }
  for (const member of ["maya", "tom"] as const) {
    for (const rid of Object.values(ritualIds[member])) {
      shares.push({ circle_id: circle.id, user_id: ids[member], ritual_id: rid });
    }
  }
  const { error: sharesError } = await admin.from("circle_rituals").insert(shares);
  if (sharesError) throw sharesError;
}

// --- Idempotency ------------------------------------------------------------

async function clearSeed(userIds: string[]) {
  // circles owned by these users cascade members + shared rituals.
  await admin.from("circles").delete().in("owner_id", userIds);
  // rituals cascade their logs; insights + nudges are cleared explicitly.
  await admin.from("insights").delete().in("user_id", userIds);
  await admin.from("nudges").delete().in("sender_id", userIds);
  await admin.from("rituals").delete().in("user_id", userIds);
}

// --- Helpers ----------------------------------------------------------------

async function loadSystemCategories(): Promise<Map<string, string>> {
  const { data, error } = await admin
    .from("ritual_categories")
    .select("id, slug")
    .is("user_id", null);
  if (error) throw error;
  return new Map((data ?? []).map((c) => [c.slug as string, c.id]));
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function randomPassword(): string {
  return `Demo-${crypto.randomUUID()}`;
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exitCode = 1;
});
