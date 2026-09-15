const API_URL = "https://api.github.com";

type Repository = {
  name: string;
  full_name: string;
  archived: boolean;
};

async function request(token: string, url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "x-github-api-version": "2026-03-10",
    },
  });

  if (!response.ok) {
    throw new Error(
      `${init?.method ?? "GET"} ${url} failed with ${response.status}: ${await response.text()}`,
    );
  }

  return response;
}

function nextPageUrl(linkHeader: string | null) {
  return linkHeader?.match(/<(?<url>[^>]+)>;\s*rel="next"/u)?.groups?.["url"];
}

async function listAllPages(token: string, initialUrl: string) {
  const repositories: Repository[] = [];
  let url: string | undefined = initialUrl;

  while (url) {
    const response = await request(token, url);

    repositories.push(...((await response.json()) as Repository[]));
    url = nextPageUrl(response.headers.get("link"));
  }

  return repositories;
}

export function listOwnedRepositories(token: string) {
  return listAllPages(
    token,
    `${API_URL}/user/repos?affiliation=owner&per_page=100`,
  );
}

export async function listWatchedRepositories(token: string) {
  const repositories = await listAllPages(
    token,
    `${API_URL}/user/subscriptions?per_page=100`,
  );

  return new Set(repositories.map((repository) => repository.full_name));
}

export async function watch(token: string, fullName: string) {
  await request(token, `${API_URL}/repos/${fullName}/subscription`, {
    method: "PUT",
    body: JSON.stringify({ subscribed: true, ignored: false }),
  });
}
