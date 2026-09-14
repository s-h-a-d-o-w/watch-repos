import {
  listOwnedRepositories,
  listWatchedRepositories,
  watch,
} from "./github.ts";
import { parseIgnore } from "./parseIgnore.ts";

function requireEnv(name: string) {
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
const alreadyWatched = await listWatchedRepositories(token);
let watched = 0;

for (const repository of repositories) {
  const skipReason = isIgnored({
    name: repository.name,
    fullName: repository.full_name,
  })
    ? "ignored"
    : !includeArchived && repository.archived
      ? "archived"
      : alreadyWatched.has(repository.full_name)
        ? "already watched"
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
  `Done. Turned on "watch" for ${watched} of ${repositories.length} repositories.`,
);
