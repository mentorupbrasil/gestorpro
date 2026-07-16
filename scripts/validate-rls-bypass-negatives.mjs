import { readFileSync, existsSync } from "node:fs";
import postgres from "postgres";

for (const file of [".env", ".env.local"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    if (!process.env[t.slice(0, i).trim()])
      process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
}

const sql = postgres({
  database: process.env.PGDATABASE ?? "postgres",
  host: process.env.PGHOST,
  max: 1,
  password: process.env.PGPASSWORD,
  port: Number(process.env.PGPORT ?? 5432),
  ssl: "require",
  user: process.env.PGUSER,
});

const tenantA = "c0000000-0000-4000-8000-000000000001";
const tenantB = "f2000000-0000-4000-8000-000000000001";
const userId = "30000000-0000-4000-8000-000000000001";
const outsiderId = "f2200000-0000-4000-8000-000000000001";
const blockedUserId = "f2300000-0000-4000-8000-000000000099";
const encounterId = "e8000000-0000-4000-8000-000000000001";
const appointmentId = "a8000000-0000-4000-8000-000000000001";
const foreignAppointmentId = "a9000000-0000-4000-8000-000000000001";

async function setAuth(tx, uid, aal) {
  await tx`select set_config('request.jwt.claim.sub', ${uid}, true)`;
  await tx`select set_config('request.jwt.claims', ${JSON.stringify({
    sub: uid,
    role: "authenticated",
    aal,
  })}, true)`;
  await tx`set local role authenticated`;
}

async function expectDenied(tx, label, run) {
  await tx`savepoint expect_denied`;
  try {
    await run();
    await tx`rollback to savepoint expect_denied`;
    throw new Error(`${label}: expected denial, but succeeded`);
  } catch (error) {
    await tx`rollback to savepoint expect_denied`.catch(() => undefined);
    if (error?.message?.startsWith(`${label}:`)) throw error;
    if (
      error?.code !== "42501" &&
      error?.code !== "28000" &&
      error?.code !== "22023" &&
      error?.code !== "P0002" &&
      !/denied|aal2 required|permission|authentication|idempotency|not found|missing/i.test(
        error?.message ?? "",
      )
    ) {
      throw error;
    }
    console.log(`OK ${label}: ${error.code || "denied"} ${error.message}`);
  }
}

try {
  await sql
    .begin(async (tx) => {
      await setAuth(tx, userId, "aal1");
      await expectDenied(tx, "save_triage without aal2", async () => {
        await tx`
        select public.save_triage_record(
          ${tenantA}::uuid,
          ${encounterId}::uuid,
          'e8110000-0000-4000-8000-000000000001'::uuid,
          '{"schemaVersion":1}'::jsonb,
          false,
          'neg-aal1',
          'neg-aal1'
        )
      `;
      });

      await expectDenied(tx, "check_in without aal2", async () => {
        await tx`
        select public.check_in_appointment(
          ${tenantA}::uuid,
          ${appointmentId}::uuid,
          ${"checkin:appointment:" + appointmentId},
          'neg-checkin-aal1'
        )
      `;
      });

      await setAuth(tx, outsiderId, "aal2");
      const outsiderPerm = await tx`
      select public.has_encounter_permission(${encounterId}::uuid, 'triage.manage') as ok
    `;
      if (outsiderPerm[0]?.ok) {
        throw new Error("outsider unexpectedly has triage.manage on tenant A encounter");
      }
      console.log("OK outsider has_encounter_permission=false");

      await expectDenied(tx, "check_in other tenant", async () => {
        await tx`
        select public.check_in_appointment(
          ${tenantA}::uuid,
          ${appointmentId}::uuid,
          ${"checkin:appointment:" + appointmentId},
          'neg-checkin-tenant'
        )
      `;
      });

      await setAuth(tx, userId, "aal2");
      await expectDenied(tx, "check_in wrong idempotency key", async () => {
        await tx`
        select public.check_in_appointment(
          ${tenantA}::uuid,
          ${appointmentId}::uuid,
          'bad-key',
          'neg-checkin-key'
        )
      `;
      });

      await expectDenied(tx, "check_in foreign appointment ids", async () => {
        await tx`
        select public.check_in_appointment(
          ${tenantA}::uuid,
          ${foreignAppointmentId}::uuid,
          ${"checkin:appointment:" + foreignAppointmentId},
          'neg-checkin-foreign'
        )
      `;
      });

      const tenantIsolation = await tx`
      select count(*)::int as count
      from public.encounters
      where tenant_id = ${tenantB}::uuid
    `;
      console.log(`OK tenant B encounter visibility under demo user: ${tenantIsolation[0].count}`);

      await expectDenied(tx, "audit append-only update", async () => {
        await tx`update public.audit_logs set action = 'tampered' where true`;
      });

      // append_audit_log NÃO deve estar na allowlist autenticada
      await expectDenied(tx, "direct append_audit_log execute", async () => {
        await tx`
        select public.append_audit_log(
          ${tenantA}::uuid,
          'tamper',
          'encounter',
          ${encounterId}::uuid,
          'neg-audit',
          '{}'::jsonb
        )
      `;
      });

      if (blockedUserId) {
        await setAuth(tx, blockedUserId, "aal2");
        await expectDenied(tx, "blocked user check_in", async () => {
          await tx`
          select public.check_in_appointment(
            ${tenantA}::uuid,
            ${appointmentId}::uuid,
            ${"checkin:appointment:" + appointmentId},
            'neg-blocked'
          )
        `;
        });
      }

      throw new Error("rollback");
    })
    .catch((error) => {
      if (error?.message !== "rollback") throw error;
    });

  console.log("Negative RPC/RLS checks passed.");
} finally {
  await sql.end({ timeout: 5 });
}
