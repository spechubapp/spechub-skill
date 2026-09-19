#!/usr/bin/env node
/**
 * Create, update or delete fields on an entity.
 *
 * Fields are upserted via PATCH /api/v1/entity/{entityId}/fields: a field given
 * with an id is updated in place (including renames), one without an id is
 * created. Deletion is a separate DELETE on the same path.
 *
 * Usage:
 *   ./set-entity-fields.js <project-slug> <entity-ref-or-uuid> --fields <file.json>
 *   ./set-entity-fields.js <project-slug> <entity-ref-or-uuid> --delete <field-uuid>[,<field-uuid>...]
 *
 * The --fields file holds the PATCH body, for example:
 *   { "fields": [
 *       { "name": "rate_id", "type": "Reference/One", "required": false,
 *         "referencedEntityId": "<entity-uuid>", "notes": "References Contract Rate" },
 *       { "id": "<field-uuid>", "name": "default_hourly_rate", "type": "Number/Decimal" }
 *   ] }
 *
 * Field types are the EntityTypeProperty enum, e.g. Text/Short, Text/UUID,
 * Text/Long (Plain), Number/Integer, Number/Decimal, Choice/One, Reference/One,
 * Date and time, Boolean. Reference types take referencedEntityId.
 *
 * Examples:
 *   ./set-entity-fields.js spechub 3.1 --fields /tmp/contract-fields.json
 *   ./set-entity-fields.js spechub 9.1 --delete bb024966-e143-4c22-84bb-e20a20209599
 */
const fs = require("fs");
const cli = require("../lib/cli");

const args = process.argv.slice(2);
const flags = cli.parseFlags(args);
const [projectSlug, refOrId] = cli.positionals(args);

if (!projectSlug || !refOrId || (!flags.fields && !flags.delete)) {
  cli.usage(
    "Usage: ./set-entity-fields.js <project-slug> <entity-ref-or-uuid> --fields <file.json>",
    "       ./set-entity-fields.js <project-slug> <entity-ref-or-uuid> --delete <field-uuid>[,<field-uuid>...]",
    "",
    "Examples:",
    "  ./set-entity-fields.js spechub 3.1 --fields /tmp/contract-fields.json",
    "  ./set-entity-fields.js spechub 9.1 --delete bb024966-e143-4c22-84bb-e20a20209599",
  );
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Read and validate the --fields payload, exiting with a clear message. */
function readFieldsBody(file) {
  if (file === true) {
    cli.usage("--fields requires a path to a JSON file.");
  }
  let raw;
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch (err) {
    cli.usage(`Cannot read --fields file '${file}': ${err.message}`);
  }
  let body;
  try {
    body = JSON.parse(raw);
  } catch (err) {
    cli.usage(`--fields file '${file}' is not valid JSON: ${err.message}`);
  }
  // Accept either the full PATCH body or a bare array of fields.
  if (Array.isArray(body)) body = { fields: body };
  if (!body || !Array.isArray(body.fields) || body.fields.length === 0) {
    cli.usage(
      `--fields file '${file}' must contain a non-empty "fields" array`,
      '(or be a bare JSON array of field objects), e.g. { "fields": [ { "name": "rate_id", "type": "Reference/One" } ] }',
    );
  }
  const bad = body.fields.findIndex((f) => !f || !f.name || !f.type);
  if (bad !== -1) {
    cli.usage(`Field at index ${bad} is missing a required "name" or "type".`);
  }
  return body;
}

/** Parse and validate the comma-separated --delete field UUID list. */
function parseDeleteIds(value) {
  if (value === true) {
    cli.usage("--delete requires one or more comma-separated field UUIDs.");
  }
  const ids = String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (ids.length === 0) {
    cli.usage("--delete requires one or more comma-separated field UUIDs.");
  }
  const invalid = ids.filter((id) => !UUID_RE.test(id));
  if (invalid.length > 0) {
    cli.usage(
      `Not a valid field UUID: ${invalid.join(", ")}`,
      "Field IDs are shown by ./get-entity.js under each field.",
    );
  }
  return ids;
}

function printFields(fields) {
  console.log(`\nFields now on entity (${fields.length}):`);
  for (const f of fields) {
    const ref = f.referencedEntityId ? ` -> ${f.referencedEntityId}` : "";
    console.log(
      `  • ${f.name}: ${f.type}${f.required ? " [required]" : ""}${ref}`,
    );
    console.log(`      id: ${f.id}`);
    if (f.notes) console.log(`      notes: ${f.notes}`);
  }
}

// Validate inputs up front, before any network calls, so bad arguments produce
// usage errors rather than auth/API failures.
const deleteIds = flags.delete ? parseDeleteIds(flags.delete) : null;
const body = deleteIds ? null : readFieldsBody(flags.fields);

cli.run(async () => {
  const client = await cli.createClient();
  const project = await cli.resolveProjectSlug(client, projectSlug);
  const { resolveEntity } = require("../lib/api-client");
  const entity = await resolveEntity(client, project.id, refOrId);
  const path = `/api/v1/entity/${entity.id}/fields`;

  if (deleteIds) {
    const ids = deleteIds;
    // The API expects repeated scalars (fieldIds=a&fieldIds=b), not axios's
    // default bracketed form (fieldIds[]=a), which it rejects as missing.
    const query = ids
      .map((id) => `fieldIds=${encodeURIComponent(id)}`)
      .join("&");
    await client.delete(`${path}?${query}`);
    console.log(
      `\nDeleted ${ids.length} field(s) from ${entity.entityName} (${entity.id}).`,
    );
    const after = await client.get(`/api/v1/entity/${entity.id}`);
    printFields(after.data.data.fields || []);
    return;
  }

  const res = await client.patch(path, body);
  console.log(
    `\nUpserted ${body.fields.length} field(s) on ${entity.entityName} (${entity.id}).`,
  );
  printFields(res.data.data.fields || []);
});
