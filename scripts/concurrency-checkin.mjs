/**
 * Concurrency smoke for check-in: two parallel RPC calls on the same appointment.
 * Requires PG* env + a real appointment id owned by an AAL2 session (service role not enough
 * for SECURITY DEFINER auth.uid() paths). Prefer running via authenticated pooler session.
 *
 * Usage:
 *   node --env-file=.env scripts/concurrency-checkin.mjs <tenantId> <appointmentId> <idempotencyKey>
 */
import postgres from "postgres";

const [tenantId, appointmentId, idempotencyKey] = process.argv.slice(2);
if (!tenantId || !appointmentId || !idempotencyKey) {
  console.error(
    "Usage: node scripts/concurrency-checkin.mjs <tenantId> <appointmentId> <idempotencyKey>",
  );
  process.exit(1);
}

const sql = postgres({
  database: process.env.PGDATABASE,
  host: process.env.PGHOST,
  idle_timeout: 5,
  max: 4,
  password: process.env.PGPASSWORD,
  port: Number(process.env.PGPORT ?? 5432),
  ssl: "require",
  user: process.env.PGUSER,
});

try {
  const call = (key) =>
    sql`
      select public.check_in_appointment(
        ${tenantId}::uuid,
        ${appointmentId}::uuid,
        ${key},
        ${`concurrency-${key}`}
      ) as encounter_id
    `.then((rows) => rows[0]?.encounter_id ?? null);

  const results = await Promise.allSettled([call(idempotencyKey), call(idempotencyKey)]);

  const fulfilled = results.filter((item) => item.status === "fulfilled").map((item) => item.value);
  const rejected = results.filter((item) => item.status === "rejected");

  console.log(
    JSON.stringify(
      {
        distinctEncounters: [...new Set(fulfilled.filter(Boolean))],
        fulfilledCount: fulfilled.length,
        rejected: rejected.map((item) => String(item.reason?.message ?? item.reason)),
      },
      null,
      2,
    ),
  );

  const encounters = await sql`
    select id from public.encounters
    where tenant_id = ${tenantId}::uuid
      and appointment_id = ${appointmentId}::uuid
  `;

  if (encounters.length > 1) {
    console.error("FAIL: more than one encounter for appointment");
    process.exit(1);
  }
  console.log("OK concurrency check-in: at most one encounter");
} finally {
  await sql.end({ timeout: 5 });
}
