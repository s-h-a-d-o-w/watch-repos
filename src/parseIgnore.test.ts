import { describe, expect, it } from "vitest";

import { parseIgnore } from "./parseIgnore.ts";

const repos = [
  { name: "dotfiles", fullName: "o/dotfiles" },
  { name: "fork-thing", fullName: "o/fork-thing" },
  { name: "secrets", fullName: "other/secrets" },
  { name: "website", fullName: "o/website" },
];

function ignored(raw: string | undefined): string[] {
  const isIgnored = parseIgnore(raw);

  return repos.filter((repo) => isIgnored(repo)).map((repo) => repo.name);
}

describe(parseIgnore, () => {
  it("ignores nothing when empty", () => {
    expect(ignored(undefined)).toStrictEqual([]);
    expect(ignored("  ")).toStrictEqual([]);
  });

  it("matches a regular expression literal", () => {
    expect(ignored("/^FORK-/i")).toStrictEqual(["fork-thing"]);
  });

  it("matches comma or newline separated values", () => {
    expect(ignored("dotfiles,\n other/secrets \n")).toStrictEqual([
      "dotfiles",
      "secrets",
    ]);
  });
});
