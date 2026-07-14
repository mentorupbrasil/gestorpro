import { existsSync, readFileSync } from "node:fs";
import postgres from "postgres";

function loadEnvFile() {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;
      const key = trimmed.slice(0, separator).trim();
      let value = trimmed.slice(separator + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

loadEnvFile();

if (!process.env.PGHOST || !process.env.PGPASSWORD) {
  console.error("Configure PGHOST+PGPASSWORD (ou .env) do Supabase autorizado.");
  process.exit(1);
}

const sql = postgres({
  database: process.env.PGDATABASE ?? "postgres",
  host: process.env.PGHOST,
  idle_timeout: 2,
  max: 1,
  onnotice: () => {},
  password: process.env.PGPASSWORD,
  port: Number(process.env.PGPORT ?? 5432),
  ssl: process.env.PGSSL === "false" ? false : "require",
  user: process.env.PGUSER ?? "postgres",
});

try {
  const encounterRows = await sql`
    select id, tenant_id
    from public.encounters
    order by created_at desc
    limit 1
  `;
  if (!encounterRows[0]) {
    console.error("Nenhum encounter fictício encontrado para o negativo.");
    process.exit(1);
  }

  const encounter = encounterRows[0];
  const otherTenantRows = await sql`
    select id
    from public.tenants
    where id <> ${encounter.tenant_id}
    order by created_at asc nulls last, id asc
    limit 1
  `;
  if (!otherTenantRows[0]) {
    console.error("Precisa de um segundo tenant fictício para o negativo cruzado.");
    process.exit(1);
  }

  const otherTenantId = otherTenantRows[0].id;

  try {
    await sql.begin(async (tx) => {
      const [foreignWorker] = await tx`
        insert into public.workers (tenant_id, full_name, status)
        values (${otherTenantId}, 'Worker cruzado fictício P0.4', 'active')
        returning id
      `;

      await tx`
        update public.encounters
        set worker_id = ${foreignWorker.id}
        where id = ${encounter.id}
      `;

      throw new Error("CROSS_TENANT_UPDATE_SHOULD_HAVE_FAILED");
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("CROSS_TENANT_UPDATE_SHOULD_HAVE_FAILED")) {
      console.error("FAIL: update cruzado de tenant foi aceito.");
      process.exit(1);
    }
    if (!/encounters_worker_tenant_fk|foreign key/i.test(message)) {
      console.error("Falha inesperada (não foi a FK composta):", message);
      process.exit(1);
    }
  }

  const constraints = await sql`
    select conname
    from pg_constraint
    where conname in (
      'encounters_worker_tenant_fk',
      'triage_records_encounter_tenant_fk',
      'medical_consultations_encounter_tenant_fk',
      'medical_conclusions_encounter_tenant_fk'
    )
    order by conname
  `;

  console.log("OK negativo: update cruzado bloqueado pela FK composta.");
  console.log(
    `Constraints clínicas presentes: ${constraints.map((row) => row.conname).join(", ")}`,
  );
} finally {
  await sql.end({ timeout: 5 });
}
