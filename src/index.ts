import { listOwnedRepositories, watch } from "./github.ts";
import { parseIgnore } from "./parseIgnore.ts";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required input: ${name}`);
  }

  return value;
}

const token = requireEnv("INPUT_TOKEN");
const isIgnored = parseIgnore(process.env["INPUT_IGNORE"]);
const includeArchived = process.env["INPUT_INCLUDE_ARCHIVED"] === "true";

const repositories = await listOwnedRepositories(token);
let watched = 0;

for (const repository of repositories) {
  const skipReason = isIgnored({
    name: repository.name,
    fullName: repository.full_name,
  })
    ? "ignored"
    : !includeArchived && repository.archived
      ? "archived"
      : undefined;

  if (skipReason) {
    console.log(`Skipping ${repository.full_name} (${skipReason})`);
    continue;
  }

  await watch(token, repository.full_name);
  watched += 1;
  console.log(`Watching ${repository.full_name}`);
}

console.log(
  `Done. Watching ${watched} of ${repositories.length} repositories.`,
);
