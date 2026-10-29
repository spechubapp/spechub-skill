#!/usr/bin/env node
/**
 * List SpecHub's agent guides, or print one as Markdown. REQ 18.1, REQ 18.2
 * Usage: ./get-guide.js [guide-name] [output-file] [--instance <name>]
 *
 * Examples:
 *   ./get-guide.js                          # every guide, with when to read it
 *   ./get-guide.js requirement-authoring
 */
const fs = require("fs");
const cli = require("../lib/cli");

const [name, outputFile] = cli.positionals(process.argv.slice(2));

cli.run(async () => {
  const client = await cli.createClient();
  try {
    if (!name) {
      const { data } = await client.get("/api/v1/agentguide");
      for (const g of data.data) console.log(`${g.name}\n  ${g.description}\n`);
      return;
    }
    const markdown = await cli.getContext(
      client,
      `/api/v1/agentguide/${encodeURIComponent(name)}`,
    );
    if (outputFile) {
      fs.writeFileSync(outputFile, markdown);
      console.error(`✓ Saved to ${outputFile}`);
    }
    console.log(markdown);
  } catch (err) {
    if (err.response?.status !== 404) throw err;
    cli.abort(
      name
        ? `Guide "${name}" not found; run ./scripts/get-guide.js to list the guides.`
        : "This instance does not serve agent guides.",
    );
  }
});
