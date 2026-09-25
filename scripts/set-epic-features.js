#!/usr/bin/env node
/**
 * Replace the complete set of features associated with an epic.
 * Usage: ./set-epic-features.js <epic-uuid> <feature-uuid> [<feature-uuid> ...] [--instance <name>]
 *
 * Any existing associations not in the list are removed. Duplicate IDs are ignored.
 */
const cli = require("../lib/cli");

const [epicId, ...featureIds] = cli.positionals(process.argv.slice(2));

if (!epicId || featureIds.length === 0) {
  cli.usage(
    "Usage: ./set-epic-features.js <epic-uuid> <feature-uuid> [<feature-uuid> ...]",
    "Example: ./set-epic-features.js abc-123 def-456 ghi-789",
  );
}

cli.run(async () => {
  const client = await cli.createClient();
  const res = await client.put(`/api/v1/epic/${epicId}/feature`, {
    featureIds,
  });
  const features = res.data.data;

  console.log(`\nEpic features updated successfully!\n`);
  console.log(`Total associated features: ${features.length}`);
  features.forEach((f, i) => {
    console.log(`  ${i + 1}. ${f.name} (ref: ${f.ref}, id: ${f.id})`);
    cli.printWebUrl(f);
  });

  if (res.data.pagination?.hasNext) {
    console.log("\n(There are more features; use pagination to see all.)");
  }
});
