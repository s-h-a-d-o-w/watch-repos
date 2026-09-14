import { parseIgnore } from "./parseIgnore.ts";

const API_URL = "https://api.github.com";

type Repository = {
  name: string;
  full_name: string;
  archived: boolean;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required input: ${name}`);
  }

  return value;
}

async function request(
  token: string,
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(url, {
    ...init,
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "x-github-api-version": "2022-11-28",
    },
  });

  if (!response.ok) {
    throw new Error(
      `${init?.method ?? "GET"} ${url} failed with ${response.status}: ${await response.text()}`,
    );
  }

  return response;
}

function nextPageUrl(linkHeader: string | null): string | undefined {
  return linkHeader?.match(/<(?<url>[^>]+)>;\s*rel="next"/u)?.groups?.["url"];
}

async function listOwnedRepositories(token: string): Promise<Repository[]> {
  const repositories: Repository[] = [];
  let url: string | undefined =
    `${API_URL}/user/repos?affiliation=owner&per_page=100`;

  while (url) {
    const response = await request(token, url);

    repositories.push(...((await response.json()) as Repository[]));
    url = nextPageUrl(response.headers.get("link"));
  }

  return repositories;
}

async function watch(token: string, fullName: string): Promise<void> {
  await request(token, `${API_URL}/repos/${fullName}/subscription`, {
    method: "PUT",
    body: JSON.stringify({ subscribed: true, ignored: false }),
  });
}

async function main(): Promise<void> {
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
}

await main();
