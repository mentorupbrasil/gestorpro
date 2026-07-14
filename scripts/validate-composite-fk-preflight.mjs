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

/** @type {{ name: string, query: string }[]} */
const checks = [
  {
    name: "encounters.worker_id tenant mismatch",
    query: `
      select e.id
      from public.encounters e
      join public.workers w on w.id = e.worker_id
      where w.tenant_id is distinct from e.tenant_id
      limit 20
    `,
  },
  {
    name: "encounters.clinic_unit_id tenant mismatch",
    query: `
      select e.id
      from public.encounters e
      join public.clinic_units u on u.id = e.clinic_unit_id
      where u.tenant_id is distinct from e.tenant_id
      limit 20
    `,
  },
  {
    name: "triage_records.encounter_id tenant mismatch",
    query: `
      select t.id
      from public.triage_records t
      join public.encounters e on e.id = t.encounter_id
      where e.tenant_id is distinct from t.tenant_id
      limit 20
    `,
  },
  {
    name: "triage_records.form_version_id tenant mismatch",
    query: `
      select t.id
      from public.triage_records t
      join public.triage_form_versions v on v.id = t.form_version_id
      where v.tenant_id is distinct from t.tenant_id
      limit 20
    `,
  },
  {
    name: "triage_record_versions.triage_record_id tenant mismatch",
    query: `
      select v.id
      from public.triage_record_versions v
      join public.triage_records t on t.id = v.triage_record_id
      where t.tenant_id is distinct from v.tenant_id
      limit 20
    `,
  },
  {
    name: "medical_consultations.encounter_id tenant mismatch",
    query: `
      select c.id
      from public.medical_consultations c
      join public.encounters e on e.id = c.encounter_id
      where e.tenant_id is distinct from c.tenant_id
      limit 20
    `,
  },
  {
    name: "medical_consultations.physician_credential_id tenant mismatch",
    query: `
      select c.id
      from public.medical_consultations c
      join public.clinical_professional_credentials p on p.id = c.physician_credential_id
      where p.tenant_id is distinct from c.tenant_id
      limit 20
    `,
  },
  {
    name: "medical_consultation_versions.consultation_id tenant mismatch",
    query: `
      select v.id
      from public.medical_consultation_versions v
      join public.medical_consultations c on c.id = v.consultation_id
      where c.tenant_id is distinct from v.tenant_id
      limit 20
    `,
  },
  {
    name: "medical_conclusions.encounter_id tenant mismatch",
    query: `
      select m.id
      from public.medical_conclusions m
      join public.encounters e on e.id = m.encounter_id
      where e.tenant_id is distinct from m.tenant_id
      limit 20
    `,
  },
  {
    name: "medical_conclusions.consultation_id tenant mismatch",
    query: `
      select m.id
      from public.medical_conclusions m
      join public.medical_consultations c on c.id = m.consultation_id
      where c.tenant_id is distinct from m.tenant_id
      limit 20
    `,
  },
  {
    name: "medical_conclusions.physician_credential_id tenant mismatch",
    query: `
      select m.id
      from public.medical_conclusions m
      join public.clinical_professional_credentials p on p.id = m.physician_credential_id
      where p.tenant_id is distinct from m.tenant_id
      limit 20
    `,
  },
  {
    name: "generated_documents.encounter_id tenant mismatch",
    query: `
      select d.id
      from public.generated_documents d
      join public.encounters e on e.id = d.encounter_id
      where d.encounter_id is not null
        and e.tenant_id is distinct from d.tenant_id
      limit 20
    `,
  },
  {
    name: "generated_documents.worker_id tenant mismatch",
    query: `
      select d.id
      from public.generated_documents d
      join public.workers w on w.id = d.worker_id
      where d.worker_id is not null
        and w.tenant_id is distinct from d.tenant_id
      limit 20
    `,
  },
  {
    name: "generated_documents.template_version_id tenant mismatch",
    query: `
      select d.id
      from public.generated_documents d
      join public.document_template_versions v on v.id = d.template_version_id
      where v.tenant_id is distinct from d.tenant_id
      limit 20
    `,
  },
];

try {
  const failures = [];
  for (const check of checks) {
    const rows = await sql.unsafe(check.query);
    const count = rows.length;
    console.log(`${count === 0 ? "OK" : "FAIL"} ${check.name}: ${count}`);
    if (count > 0) {
      failures.push({ ids: rows.map((row) => row.id), name: check.name });
    }
  }

  if (failures.length > 0) {
    console.error("Preflight compostas falhou; não aplique a migration P0.4.");
    console.error(JSON.stringify(failures, null, 2));
    process.exit(1);
  }

  console.log("Preflight compostas OK: nenhum cruzamento de tenant nos vínculos clínicos.");
} finally {
  await sql.end({ timeout: 5 });
}
