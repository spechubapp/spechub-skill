/**
 * Repository links for the SpecHub skill.
 *
 * A repository declares its SpecHub project in a committed `.spechub.json`:
 *
 *   {
 *     "version": 1,
 *     "apiUrl": "https://api.spechub.app",
 *     "projectId": "<uuid>"
 *   }
 *
 * `projectId` identifies the project; its name and slug come from the API, so
 * renames never make the file stale. `apiUrl` selects the local instance,
 * since instance names are per-user.
 * The file never holds credentials.
 *
 * The nearest `.spechub.json` at or above a directory wins, so packages in a
 * monorepo can link different projects.
 */

const fs = require("fs");
const path = require("path");
const { isUuid } = require("./api-client");

const LINK_FILE = ".spechub.json";
const VERSION = 1;

/**
 * Find the nearest link file at or above `startDir`.
 *
 * @param {string} startDir
 * @returns {string|null} absolute path of the link file
 */
function find(startDir) {
  let dir = path.resolve(startDir);
  for (;;) {
    const candidate = path.join(dir, LINK_FILE);
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/** Return a list of problems with a parsed link (empty when valid). */
function validate(link) {
  const problems = [];
  if (!link || typeof link !== "object" || Array.isArray(link)) {
    return ["must be a JSON object"];
  }
  if (link.version !== VERSION) problems.push(`"version" must be ${VERSION}`);
  if (typeof link.apiUrl !== "string" || !/^https?:\/\//.test(link.apiUrl)) {
    problems.push('"apiUrl" must be an http(s) URL');
  }
  if (!isUuid(link.projectId)) problems.push('"projectId" must be a UUID');
  return problems;
}

/**
 * Read and validate the link file at `file`.
 *
 * @param {string} file
 * @returns {{ file: string, dir: string, link: object }}
 */
function read(file) {
  let link;
  try {
    link = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    throw new Error(`cannot read ${file}: ${err.message}`);
  }
  const problems = validate(link);
  if (problems.length > 0) {
    throw new Error(`invalid ${file}: ${problems.join("; ")}`);
  }
  return { file, dir: path.dirname(file), link };
}

/**
 * Find and read the nearest link at or above `startDir`.
 *
 * @param {string} startDir
 * @returns {{ file: string, dir: string, link: object }|null}
 */
function load(startDir) {
  const file = find(startDir);
  return file ? read(file) : null;
}

/**
 * Write a link file into `dir`, returning its path.
 *
 * @param {string} dir
 * @param {{ apiUrl: string, projectId: string }} fields
 */
function write(dir, { apiUrl, projectId }) {
  const link = { version: VERSION, apiUrl, projectId };
  const problems = validate(link);
  if (problems.length > 0) throw new Error(problems.join("; "));
  const file = path.join(path.resolve(dir), LINK_FILE);
  fs.writeFileSync(file, JSON.stringify(link, null, 2) + "\n");
  return file;
}

module.exports = { LINK_FILE, find, validate, read, load, write };
