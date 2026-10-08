#!/usr/bin/env node
/**
 * Identify the object behind a SpecHub web URL, or behind a feature,
 * requirement, or entity ref in a project. REQ 8.12, REQ 8.13
 * Usage: ./resolve.js <spechub-web-url> [--instance <name>]
 *        ./resolve.js <project-slug> <ref> [--instance <name>]
 *
 * Examples:
 *   ./resolve.js https://go.spechub.app/acme/checkout/2.45/notes
 *   ./resolve.js /acme/checkout/releases/1.2
 *   ./resolve.js checkout 2.45
 */
const cli = require("../lib/cli");

const [first, ref] = cli.positionals(process.argv.slice(2));

if (!first) {
  cli.usage(
    "Usage: ./resolve.js <spechub-web-url> [--instance <name>]",
    "       ./resolve.js <project-slug> <ref> [--instance <name>]",
    "",
    "Examples:",
    "  ./resolve.js https://go.spechub.app/acme/checkout/2.45/notes",
    "  ./resolve.js checkout 2.45",
  );
}

cli.run(async () => {
  const client = await cli.createClient();
  let params = { url: first };
  if (ref) {
    const project = await cli.resolveProjectSlug(client, first);
    params = { ref, projectId: project.id };
  }

  let object;
  try {
    const res = await client.get("/api/v1/resolve", { params });
    object = res.data.data;
  } catch (err) {
    if (err.response?.status === 404) {
      cli.abort(
        `${ref ? `ref "${ref}"` : `"${first}"`} does not identify an object this instance can see`,
      );
    }
    throw err;
  }

  const projects = await cli.listProjects(client);
  const project = projects.find((p) => p.id === object.projectId);

  console.log(`Type:    ${object.type}`);
  console.log(`ID:      ${object.id}`);
  console.log(
    project
      ? `Project: ${project.name} (${project.slug}), ID ${project.id}`
      : `Project: ${object.projectId}`,
  );
  console.log(`URL:     ${object.webUrl}`);
});
