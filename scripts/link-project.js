#!/usr/bin/env node
/**
 * Link a repository to a SpecHub project by writing <repo-path>/.spechub.json.
 * Usage: ./link-project.js <repo-path> <project> [--force] [--instance <name>]
 */
const fs = require("fs");
const path = require("path");
const cli = require("../lib/cli");
const instances = require("../lib/instances");
const projectLink = require("../lib/project-link");

const args = process.argv.slice(2);
const [repoPath, projectArg] = cli.positionals(args);
const flags = cli.parseFlags(args);

if (!repoPath || !projectArg)
  cli.usage(
    "Usage: ./link-project.js <repo-path> <project> [--force]",
    "Example: ./link-project.js ~/src/acme-portal acme-portal",
  );

const dir = path.resolve(repoPath);
if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory())
  cli.abort(`${dir} is not a directory`);

const target = path.join(dir, projectLink.LINK_FILE);
if (fs.existsSync(target) && !cli.bool(flags.force))
  cli.abort(`${target} already exists; pass --force to replace it`);

cli.run(async () => {
  const config = instances.getConfig();
  const client = await cli.createClient(config);
  const project = await cli.resolveProjectSlug(client, projectArg);
  const file = projectLink.write(dir, {
    apiUrl: config.url,
    projectId: project.id,
  });
  console.log(`\n✓ Linked ${dir} to ${project.name} (${project.slug})`);
  console.log(`  Instance: ${config.name} (${config.url})`);
  cli.printWebUrl(project);
  console.log(`  Wrote ${file}\n`);
  console.log(fs.readFileSync(file, "utf8"));
  console.log("Commit this file; it contains no credentials.\n");
});
