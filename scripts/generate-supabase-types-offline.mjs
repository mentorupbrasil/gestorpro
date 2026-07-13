import fs from "node:fs/promises";
import path from "node:path";
import { getSupabaseSchemaFingerprint } from "./supabase-schema-fingerprint.mjs";

const migrationDirectory = path.resolve("supabase/migrations");
const outputDirectory = path.resolve("src/lib/supabase");
const typePath = path.join(outputDirectory, "database.generated.ts");
const fingerprintPath = path.join(outputDirectory, "database.generated.sha256");

function mapPgType(rawType) {
  const type = rawType.toLowerCase();

  if (type.includes("[]")) {
    if (type.includes("uuid")) return "string[]";
    if (type.includes("int") || type.includes("numeric")) return "number[]";
    return "string[]";
  }

  if (type.includes("json")) return "Json";
  if (type.includes("bool")) return "boolean";
  if (
    type.includes("int") ||
    type.includes("numeric") ||
    type.includes("decimal") ||
    type.includes("real") ||
    type.includes("double")
  ) {
    return "number";
  }

  return "string";
}

function parseTables(migrationSql) {
  const tables = new Map();
  const tablePattern = /create table public\.(\w+)\s*\(([\s\S]*?)\);/gi;

  for (const match of migrationSql.matchAll(tablePattern)) {
    const tableName = match[1];
    const body = match[2];
    const columns = new Map();

    for (const line of body.split("\n")) {
      const trimmed = line.trim();
      if (
        !trimmed ||
        trimmed.startsWith("constraint ") ||
        trimmed.startsWith("primary key") ||
        trimmed.startsWith("unique ") ||
        trimmed.startsWith("check ") ||
        trimmed.startsWith("foreign key")
      ) {
        continue;
      }

      const columnMatch = /^(\w+)\s+([a-z][\w\[\]()]*)/i.exec(trimmed);
      if (!columnMatch) continue;

      const [, columnName, columnType] = columnMatch;
      columns.set(columnName, {
        nullable: !/not null/i.test(trimmed),
        type: mapPgType(columnType),
      });
    }

    if (columns.size > 0) {
      tables.set(tableName, columns);
    }
  }

  return tables;
}

function parseFunctions(migrationSql) {
  const functions = new Map();
  const functionPattern =
    /create or replace function public\.(\w+)\s*\(([\s\S]*?)\)\s*returns\s+([\s\S]*?)\s+language/gi;

  for (const match of migrationSql.matchAll(functionPattern)) {
    const functionName = match[1];
    const argsBlock = match[2];
    const returnsBlock = match[3];

    const args = {};
    for (const argLine of argsBlock.split(",")) {
      const argMatch = /(\w+)\s+([a-z][\w\[\]()]*)/i.exec(argLine.trim());
      if (!argMatch) continue;
      args[argMatch[1]] = mapPgType(argMatch[2]);
    }

    const returns = /jsonb?/i.test(returnsBlock)
      ? "Json"
      : /uuid/i.test(returnsBlock)
        ? "string"
        : /boolean/i.test(returnsBlock)
          ? "boolean"
          : /void/i.test(returnsBlock)
            ? "undefined"
            : "Json";

    functions.set(functionName, { args, returns });
  }

  return functions;
}

function renderTableType(columns) {
  const entries = [...columns.entries()].sort(([left], [right]) => left.localeCompare(right));
  const rowFields = entries
    .map(
      ([name, column]) =>
        `          ${name}: ${column.nullable ? `${column.type} | null` : column.type}`,
    )
    .join("\n");
  const insertFields = entries
    .map(([name, column]) => `          ${name}${column.nullable ? "?" : ""}: ${column.type}`)
    .join("\n");
  const updateFields = entries
    .map(([name, column]) => `          ${name}?: ${column.type}`)
    .join("\n");

  return `{
        Row: {
${rowFields}
        }
        Insert: {
${insertFields}
        }
        Update: {
${updateFields}
        }
        Relationships: []
      }`;
}

function renderDatabaseType(tables, functions) {
  const tableBlocks = [...tables.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([tableName, columns]) => `      ${tableName}: ${renderTableType(columns)}`)
    .join("\n");

  const functionBlocks = [...functions.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([functionName, definition]) => {
      const argFields = Object.entries(definition.args)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([name, type]) => `          ${name}: ${type}`)
        .join("\n");

      return `      ${functionName}: {
        Args: {
${argFields || "          [_: string]: never"}
        }
        Returns: ${definition.returns}
      }`;
    })
    .join("\n");

  return `// Generated offline from supabase/migrations. Replace with official typegen when authorized.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
${tableBlocks}
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
${functionBlocks}
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
`;
}

const migrationNames = (await fs.readdir(migrationDirectory))
  .filter((name) => name.endsWith(".sql"))
  .sort();
const migrationSql = await Promise.all(
  migrationNames.map((name) => fs.readFile(path.join(migrationDirectory, name), "utf8")),
);
const combinedSql = migrationSql.join("\n");

const tables = parseTables(combinedSql);
const functions = parseFunctions(combinedSql);
const source = renderDatabaseType(tables, functions);
const fingerprint = await getSupabaseSchemaFingerprint();

await fs.mkdir(outputDirectory, { recursive: true });
await fs.writeFile(typePath, source, { encoding: "utf8", mode: 0o600 });
await fs.writeFile(fingerprintPath, `${fingerprint}\n`, { encoding: "utf8", mode: 0o600 });

console.log(
  `Offline Supabase types generated for ${tables.size} tables and ${functions.size} functions.`,
);
