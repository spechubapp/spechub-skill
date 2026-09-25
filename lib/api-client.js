/**
 * SpecHub API client
 *
 * Authentication flow:
 *   1. Resolve the active instance config (url + PAT) via lib/instances.js.
 *      Instance selection order: --instance flag → SPECHUB_INSTANCE env var →
 *      default in instances.json → SPECHUB_PAT / SPECHUB_API_URL env vars.
 *   2. Exchange the PAT for a short-lived JWT bearer token via
 *      POST /api/v1/auth/token/refresh.
 *   3. Use the bearer token in Authorization: Bearer <token> on all requests.
 *   4. Tokens are cached per instance URL and refreshed automatically when
 *      within 60 seconds of expiry.
 *
 * NOTE: lib/instances.js strips --instance <name> from process.argv at module
 * load time, so positional argument parsing in calling scripts is unaffected.
 */

const axios = require("axios");
const instances = require("./instances");

// User-Agent expected by the SpecHub API.
const USER_AGENT = "spechub-skill (curl)";

// Token cache: Map<`${url}::${pat}`, { token: string, expires: number (unix seconds) }>
// Keyed on both URL and PAT so switching PATs on the same instance within a
// process does not serve a stale token.
const _tokenCache = new Map();

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/**
 * Exchange the personal access token for a short-lived bearer token.
 * Returns { token, expires }.
 */
async function refreshAccessToken(url, pat) {
  const response = await axios.post(
    `${url}/api/v1/auth/token/refresh`,
    {
      personalAccessToken: pat,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
      },
    },
  );
  return response.data; // { token, expires }
}

/**
 * Return a valid bearer token for the given instance config, refreshing if necessary.
 *
 * @param {{ url: string, pat: string }|undefined} [instanceConfig]
 *   Explicit config; defaults to the auto-resolved instance.
 */
async function getAccessToken(instanceConfig) {
  const cfg = instanceConfig || instances.getConfig();
  const cacheKey = `${cfg.url}::${cfg.pat}`;
  const cached = _tokenCache.get(cacheKey);
  const nowSecs = Math.floor(Date.now() / 1000);

  if (!cached || cached.expires - nowSecs < 60) {
    const refreshed = await refreshAccessToken(cfg.url, cfg.pat);
    _tokenCache.set(cacheKey, refreshed);
    return refreshed.token;
  }

  return cached.token;
}

// ---------------------------------------------------------------------------
// Client factory
// ---------------------------------------------------------------------------

/**
 * Create an authenticated axios instance for the resolved (or given) instance.
 *
 * @param {{ url: string, pat: string }|undefined} [instanceConfig]
 *   Explicit config; defaults to the auto-resolved instance.
 */
async function createClient(instanceConfig) {
  const cfg = instanceConfig || instances.getConfig();
  const token = await getAccessToken(cfg);
  return axios.create({
    baseURL: cfg.url,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
    },
    timeout: 30000,
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Fetch all pages of a paginated list endpoint.
 *
 * @param {import('axios').AxiosInstance} client
 * @param {string} path   e.g. '/api/v1/project'
 * @param {object} params query params (without cursor/limit)
 * @returns {Promise<Array>}
 */
async function fetchAll(client, path, params = {}) {
  const items = [];
  let cursor = null;

  do {
    const query = { limit: 500, ...params };
    if (cursor) query.cursor = cursor;

    const response = await client.get(path, { params: query });
    const { data, pagination } = response.data;
    items.push(...data);

    cursor = pagination.hasNext ? pagination.nextCursor : null;
  } while (cursor);

  return items;
}

/**
 * Fetch a `text/markdown` context endpoint and return the markdown string.
 *
 * Context endpoints (`/api/v1/{project,epic,feature,release}/context`) return a
 * pre-assembled Markdown digest in ONE request. Prefer them over walking the
 * list/detail endpoints whenever you need an overview rather than specific
 * field values or UUIDs.
 *
 * @param {import('axios').AxiosInstance} client
 * @param {string} path   e.g. '/api/v1/project/context'
 * @param {object} params e.g. { projectId }
 * @returns {Promise<string>} markdown
 */
async function getContext(client, path, params) {
  const res = await client.get(path, {
    params,
    headers: { Accept: "text/markdown" },
    responseType: "text",
  });
  return res.data;
}

// Per-process cache of the project list so repeated slug lookups inside one
// script do not re-page /api/v1/project.
let _projectsCache = null;

/**
 * List every project the caller can see, cached for the lifetime of the process.
 *
 * @param {import('axios').AxiosInstance} client
 */
async function listProjects(client) {
  if (!_projectsCache) {
    _projectsCache = await fetchAll(client, "/api/v1/project");
  }
  return _projectsCache;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True when the value looks like a UUID (vs. a slug or a ref like "1.23"). */
function isUuid(value) {
  return UUID_RE.test(String(value));
}

/**
 * Resolve a project slug (or UUID) to its full project object.
 * Exits with a helpful error if the slug is not found.
 *
 * @param {import('axios').AxiosInstance} client
 * @param {string} slug
 */
async function resolveProjectSlug(client, slug) {
  const projects = await listProjects(client);
  const project = projects.find((p) => p.slug === slug || p.id === slug);
  if (!project) {
    const names = projects.map((p) => `  ${p.slug} — ${p.name}`).join("\n");
    console.error(
      `Project with slug "${slug}" not found.\n\nAvailable projects:\n${names}`,
    );
    process.exit(1);
  }
  return project;
}

/**
 * Resolve a requirement or entity by UUID or fullyQualifiedRef (e.g. "1.23").
 * A UUID returns the detail response. A ref is filtered server-side via ?refs=
 * and returns the lighter list item unless `detail` is set.
 *
 * @param {import('axios').AxiosInstance} client
 * @param {'requirement'|'entity'} resource
 * @param {string} projectId - UUID of the project
 * @param {string} refOrId - fullyQualifiedRef or UUID
 * @param {{ detail?: boolean }} [opts]
 */
async function resolveItem(client, resource, projectId, refOrId, opts = {}) {
  const label = resource[0].toUpperCase() + resource.slice(1);
  let id = refOrId;

  if (!isUuid(refOrId)) {
    const res = await client.get(`/api/v1/${resource}`, {
      params: { projectId, refs: refOrId, includeDeprecated: true },
    });
    const item = (res.data.data || []).find(
      (i) => i.fullyQualifiedRef === refOrId,
    );
    if (!item) {
      console.error(`${label} with ref "${refOrId}" not found in project.`);
      process.exit(1);
    }
    if (!opts.detail) return item;
    id = item.id;
  }

  try {
    const res = await client.get(`/api/v1/${resource}/${id}`);
    return res.data.data;
  } catch (err) {
    if (err.response?.status === 404) {
      console.error(`${label} with ID "${id}" not found.`);
      process.exit(1);
    }
    throw err;
  }
}

const resolveRequirement = (client, projectId, refOrId, opts) =>
  resolveItem(client, "requirement", projectId, refOrId, opts);
const resolveEntity = (client, projectId, refOrId, opts) =>
  resolveItem(client, "entity", projectId, refOrId, opts);

module.exports = {
  createClient,
  getAccessToken,
  fetchAll,
  getContext,
  isUuid,
  listProjects,
  resolveProjectSlug,
  resolveRequirement,
  resolveEntity,
};
