#!/usr/bin/env node
/**
 * Show and verify the SpecHub project linked to a repository: the nearest
 * .spechub.json at or above <repo-path>, the local instance matching its
 * apiUrl, and the project it names.
 * Usage: ./show-link.js <repo-path> [--instance <name>]
 */
const path = require("path");
const cli = require("../lib/cli");
const instances = require("../lib/instances");
const projectLink = require("../lib/project-link");

const [repoPath] = cli.positionals(process.argv.slice(2));

if (!repoPath)
  cli.usage(
    "Usage: ./show-link.js <repo-path> [--instance <name>]",
    "Example: ./show-link.js ~/src/acme-portal",
  );

let found;
try {
  found = projectLink.load(repoPath);
} catch (err) {
  cli.abort(err.message);
}
if (!found) {
  console.log(
    `\nNo ${projectLink.LINK_FILE} at or above ${path.resolve(repoPath)}; the repository is not linked.`,
  );
  console.log(
    "Link it with ./scripts/link-project.js <repo-path> <project>.\n",
  );
  process.exit(0);
}

const { file, link } = found;
const config = instances.getConfigForUrl(link.apiUrl);
if (!config)
  cli.abort(
    `no configured instance uses ${link.apiUrl}; ask the user to add one by running ./scripts/add-instance.js with API URL ${link.apiUrl}`,
  );

cli.run(async () => {
  const client = await cli.createClient(config);
  const projects = await cli.listProjects(client);
  const project = projects.find((p) => p.id === link.projectId);

  console.log(`\nLink file: ${file}`);
  console.log(`Instance:  ${config.name} (${config.url})`);
  if (config.urlMismatch)
    console.log(
      `Warning: the selected instance does not use the linked apiUrl ${link.apiUrl}`,
    );
  if (!project)
    cli.abort(
      `project ${link.projectId} is not visible on ${config.name}; check the PAT's access or the link file`,
    );

  console.log(`Project:   ${project.name} (${project.slug})`);
  console.log(`  ID: ${project.id}`);
  cli.printWebUrl(project);
  console.log(
    `\nPass to scripts: <project> = ${project.id}, --instance ${config.name}\n`,
  );
});
