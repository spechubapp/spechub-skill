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

const axios = require('axios');
const instances = require('./instances');

// User-Agent expected by the SpecHub API.
const USER_AGENT = 'spechub-skill (curl)';

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
  const response = await axios.post(`${url}/api/v1/auth/token/refresh`, {
    personalAccessToken: pat,
  }, {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
    },
  });
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
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
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
 * Resolve a project slug to its full project object.
 * Exits with a helpful error if the slug is not found.
 *
 * @param {import('axios').AxiosInstance} client
 * @param {string} slug
 */
async function resolveProjectSlug(client, slug) {
  const projects = await fetchAll(client, '/api/v1/project');
  const project = projects.find(p => p.slug === slug);
  if (!project) {
    const names = projects.map(p => `  ${p.slug} — ${p.name}`).join('\n');
    console.error(`Project with slug "${slug}" not found.\n\nAvailable projects:\n${names}`);
    process.exit(1);
  }
  return project;
}

/**
 * Resolve a requirement ref (e.g. "1.23") or UUID to a requirement object.
 * Accepts either a fullyQualifiedRef or a UUID.
 *
 * @param {import('axios').AxiosInstance} client
 * @param {string} projectId - UUID of the project
 * @param {string} refOrId - fullyQualifiedRef (e.g. "1.23") or UUID
 * @returns {Promise<object>} The requirement object
 */
async function resolveRequirement(client, projectId, refOrId) {
  // If it looks like a UUID, fetch directly
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(refOrId)) {
    try {
      const res = await client.get(`/api/v1/requirement/${refOrId}`);
      return res.data.data;
    } catch (err) {
      if (err.response?.status === 404) {
        console.error(`Requirement with ID "${refOrId}" not found.`);
        process.exit(1);
      }
      throw err;
    }
  }

  // Otherwise treat as a ref and search
  const requirements = await fetchAll(client, '/api/v1/requirement', { projectId });
  const requirement = requirements.find(r => r.fullyQualifiedRef === refOrId);
  if (!requirement) {
    console.error(`Requirement with ref "${refOrId}" not found in project.`);
    process.exit(1);
  }
  return requirement;
}

/**
 * Resolve an entity ref (e.g. "1.1") or UUID to an entity object.
 * Accepts either a fullyQualifiedRef or a UUID.
 *
 * @param {import('axios').AxiosInstance} client
 * @param {string} projectId - UUID of the project
 * @param {string} refOrId - fullyQualifiedRef (e.g. "1.1") or UUID
 * @returns {Promise<object>} The entity object
 */
async function resolveEntity(client, projectId, refOrId) {
  // If it looks like a UUID, fetch directly
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(refOrId)) {
    try {
      const res = await client.get(`/api/v1/entity/${refOrId}`);
      return res.data.data;
    } catch (err) {
      if (err.response?.status === 404) {
        console.error(`Entity with ID "${refOrId}" not found.`);
        process.exit(1);
      }
      throw err;
    }
  }

  // Otherwise treat as a ref and search
  const entities = await fetchAll(client, '/api/v1/entity', { projectId });
  const entity = entities.find(e => e.fullyQualifiedRef === refOrId);
  if (!entity) {
    console.error(`Entity with ref "${refOrId}" not found in project.`);
    process.exit(1);
  }
  return entity;
}

// For backward compat: expose BASE_URL from the resolved instance at call time.
// Scripts that reference BASE_URL directly should use instances.getConfig().url instead.
Object.defineProperty(module.exports, 'BASE_URL', {
  get: () => instances.getConfig().url,
  enumerable: true,
});

module.exports = Object.assign(module.exports, {
  createClient,
  getAccessToken,
  fetchAll,
  resolveProjectSlug,
  resolveRequirement,
  resolveEntity,
});
