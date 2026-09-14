const API_URL = "https://api.github.com";

export type Repository = {
  name: string;
  full_name: string;
  archived: boolean;
};

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

export async function listOwnedRepositories(
  token: string,
): Promise<Repository[]> {
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

export async function watch(token: string, fullName: string): Promise<void> {
  await request(token, `${API_URL}/repos/${fullName}/subscription`, {
    method: "PUT",
    body: JSON.stringify({ subscribed: true, ignored: false }),
  });
}
