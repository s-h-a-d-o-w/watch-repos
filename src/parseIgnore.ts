export type IgnoreMatcher = (repo: {
  name: string;
  fullName: string;
}) => boolean;

const REGEX_LITERAL = /^\/(?<source>.*)\/(?<flags>[a-z]*)$/su;

function parseList(raw: string): string[] {
  if (raw.startsWith("[")) {
    const parsed: unknown = JSON.parse(raw);

    if (
      !Array.isArray(parsed) ||
      parsed.some((entry) => typeof entry !== "string")
    ) {
      throw new Error("The ignore list must be an array of strings.");
    }

    return parsed as string[];
  }

  return raw
    .split(/[\n,]/u)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

/**
 * Accepts either a regular expression literal (e.g. `/^dotfiles/i`) or a list of
 * repository names (JSON array, or comma/newline separated).
 */
export function parseIgnore(raw: string | undefined): IgnoreMatcher {
  const value = raw?.trim() ?? "";

  if (value.length === 0) {
    return () => false;
  }

  const regexLiteral = REGEX_LITERAL.exec(value);

  if (regexLiteral?.groups) {
    const { source = "", flags = "" } = regexLiteral.groups;
    const regex = new RegExp(source, flags.replace("g", ""));

    return ({ name, fullName }) => regex.test(name) || regex.test(fullName);
  }

  const names = new Set(parseList(value).map((entry) => entry.toLowerCase()));

  return ({ name, fullName }) =>
    names.has(name.toLowerCase()) || names.has(fullName.toLowerCase());
}
