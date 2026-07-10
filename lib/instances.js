/**
 * Instance management for the SpecHub skill.
 *
 * Instances are stored in instances.json (sibling of this lib/ directory).
 * Each entry has a name, URL, and PAT. One instance is marked as the default.
 *
 * Instance resolution order for any script invocation:
 *   1. --instance <name> flag in process.argv  (stripped from argv so positional scripts still work)
 *   2. SPECHUB_INSTANCE environment variable
 *   3. The "default" key in instances.json
 *   4. Fallback: SPECHUB_PAT / SPECHUB_API_URL env vars (backward compat with old .env setup)
 */

const fs = require("fs");
const path = require("path");

const INSTANCES_PATH = path.join(__dirname, "..", "instances.json");
const DEFAULT_URL = "https://api.spechub.app";

// ---------------------------------------------------------------------------
// File I/O
// ---------------------------------------------------------------------------

function load() {
  if (!fs.existsSync(INSTANCES_PATH)) {
    return { default: null, instances: {} };
  }
  try {
    return JSON.parse(fs.readFileSync(INSTANCES_PATH, "utf8"));
  } catch (err) {
    console.error(`Failed to parse instances.json: ${err.message}`);
    process.exit(1);
  }
}

function save(data) {
  fs.writeFileSync(INSTANCES_PATH, JSON.stringify(data, null, 2) + "\n");
}

// ---------------------------------------------------------------------------
// argv extraction (runs once at module load)
// ---------------------------------------------------------------------------

/**
 * Remove --instance <name> from process.argv (mutates the array so positional
 * argument parsing in calling scripts is unaffected) and return the name, or
 * null if the flag was not present.
 */
function extractInstanceFlag() {
  const argv = process.argv;
  const idx = argv.indexOf("--instance");
  if (idx !== -1 && idx + 1 < argv.length) {
    const name = argv[idx + 1];
    argv.splice(idx, 2);
    return name;
  }
  return null;
}

// Extracted once when this module is first required.
const _flagInstance = extractInstanceFlag();

// ---------------------------------------------------------------------------
// Config resolution
// ---------------------------------------------------------------------------

/**
 * Resolve and return the instance config { url, pat } to use.
 *
 * @param {string|null} [nameOverride] — explicit instance name (bypasses flag/env/default lookup)
 */
function getConfig(nameOverride) {
  const data = load();
  const name =
    nameOverride ||
    _flagInstance ||
    process.env.SPECHUB_INSTANCE ||
    data.default;

  if (name) {
    const instance = data.instances[name];
    if (!instance) {
      console.error(`SpecHub instance "${name}" not found.`);
      console.error(
        "Run ./scripts/list-instances.js to see configured instances.",
      );
      process.exit(1);
    }
    return { name, url: instance.url, pat: instance.pat };
  }

  // Fallback: legacy env vars / .env file
  const pat = process.env.SPECHUB_PAT;
  if (pat) {
    const url = process.env.SPECHUB_API_URL || DEFAULT_URL;
    return { name: "(env)", url, pat };
  }

  console.error("No SpecHub instance configured.");
  console.error(
    "Run ./scripts/add-instance.js to add one, or set SPECHUB_PAT in your environment.",
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Instance CRUD helpers (used by management scripts)
// ---------------------------------------------------------------------------

function addOrUpdate(name, url, pat, setDefault) {
  const data = load();
  data.instances[name] = { url, pat };
  if (setDefault || !data.default) {
    data.default = name;
  }
  save(data);
}

function remove(name) {
  const data = load();
  if (!data.instances[name]) return false;
  delete data.instances[name];
  if (data.default === name) {
    const remaining = Object.keys(data.instances);
    data.default = remaining.length > 0 ? remaining[0] : null;
  }
  save(data);
  return true;
}

function setDefault(name) {
  const data = load();
  if (!data.instances[name]) return false;
  data.default = name;
  save(data);
  return true;
}

function list() {
  const data = load();
  return { default: data.default, instances: data.instances };
}

module.exports = {
  load,
  save,
  getConfig,
  addOrUpdate,
  remove,
  setDefault,
  list,
};
