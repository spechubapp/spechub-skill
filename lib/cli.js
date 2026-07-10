/**
 * Shared CLI helpers for the SpecHub skill scripts.
 *
 * This module centralises the boilerplate every script needs — loading .env,
 * parsing flags, printing usage, wrapping the async entrypoint with a uniform
 * error handler, and rendering markdown context endpoints. Scripts still make
 * their own explicit, direct API calls; only the repetitive plumbing lives here.
 *
 * A typical script looks like:
 *
 *   const cli = require('../lib/cli');
 *   const args = process.argv.slice(2);
 *   const [slug, name] = args;
 *   if (!slug || !name) cli.usage('./create-x.js <project-slug> <name> [description]');
 *
 *   cli.run(async () => {
 *     const client = await cli.createClient();
 *     const project = await cli.resolveProjectSlug(client, slug);
 *     const res = await client.post('/api/v1/x', { projectId: project.id, name });
 *     console.log('Created', res.data.data.id);
 *   });
 */

const path = require("path");
const fs = require("fs");

// Load .env once, for every script that requires this module.
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const api = require("./api-client");

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

/**
 * Parse `--flag value` and boolean `--flag` options out of an argv slice.
 * A flag is treated as boolean (value `true`) when it is the last argument or
 * is immediately followed by another `--flag`.
 *
 * @param {string[]} args    argv slice (already stripped of --instance)
 * @param {number} [start=0] index to start scanning from (skip positionals)
 * @returns {Object<string, string|true>}
 */
function parseFlags(args, start = 0) {
  const flags = {};
  for (let i = start; i < args.length; i++) {
    const arg = args[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = args[i + 1];
    if (next === undefined || next.startsWith("--")) {
      flags[key] = true;
    } else {
      flags[key] = next;
      i++;
    }
  }
  return flags;
}

/** Positional (non-flag) arguments, in order. */
function positionals(args) {
  return args.filter((a) => !a.startsWith("--"));
}

/** Interpret a flag value as a boolean (`true` string or bare boolean flag). */
function bool(value) {
  return value === true || value === "true";
}

// ---------------------------------------------------------------------------
// Body building
// ---------------------------------------------------------------------------

/**
 * Build a JSON request body from parsed flags using a declarative spec.
 *
 * The spec maps a flag name to either:
 *   - a string   → body key (value copied verbatim)
 *   - an object  → { key, transform? } where transform(value) => bodyValue
 *
 * Only flags that were actually provided are included, so this is safe for
 * partial PATCH bodies. Example:
 *
 *   buildBody(flags, {
 *     name: 'name',
 *     'business-critical': { key: 'businessCritical', transform: cli.bool },
 *   });
 *
 * @param {Object} flags
 * @param {Object<string, string|{key:string, transform?:Function}>} spec
 */
function buildBody(flags, spec) {
  const body = {};
  for (const [flag, def] of Object.entries(spec)) {
    if (flags[flag] === undefined) continue;
    const key = typeof def === "string" ? def : def.key;
    const raw = flags[flag];
    body[key] =
      typeof def === "object" && def.transform ? def.transform(raw) : raw;
  }
  return body;
}

// ---------------------------------------------------------------------------
// Output / control flow
// ---------------------------------------------------------------------------

/** Print usage lines to stderr and exit with status 1. */
function usage(...lines) {
  for (const line of lines) console.error(line);
  process.exit(1);
}

/** Print an error message and exit with status 1. */
function abort(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

/**
 * Run an async entrypoint with the uniform SpecHub error handler
 * (surfaces RFC 9457 `detail`, falling back to the raw message).
 */
function run(main) {
  main().catch((err) => {
    console.error("Error:", err.response?.data?.detail || err.message);
    process.exit(1);
  });
}

/**
 * Fetch a `text/markdown` context endpoint, optionally save it to a file, and
 * print it. Used by the get-*-context scripts.
 *
 * @param {import('axios').AxiosInstance} client
 * @param {string} path    e.g. '/api/v1/feature/context'
 * @param {Object} params  query params e.g. { featureId }
 * @param {{ title: string, outputFile?: string }} opts
 * @returns {Promise<string>} the markdown
 */
async function printContext(client, path, params, { title, outputFile }) {
  const res = await client.get(path, {
    params,
    headers: { Accept: "text/markdown" },
    responseType: "text",
  });
  const markdown = res.data;
  if (outputFile) {
    fs.writeFileSync(outputFile, markdown);
    console.log(`✓ Saved to ${outputFile}\n`);
  }
  console.log(`=== ${title} ===\n`);
  console.log(markdown);
  return markdown;
}

module.exports = {
  // re-exported API helpers so scripts require a single module
  createClient: api.createClient,
  getAccessToken: api.getAccessToken,
  fetchAll: api.fetchAll,
  resolveProjectSlug: api.resolveProjectSlug,
  // CLI helpers
  parseFlags,
  positionals,
  bool,
  buildBody,
  usage,
  abort,
  run,
  printContext,
  fs,
};
