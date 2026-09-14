export type IgnoreMatcher = (repo: {
  name: string;
  fullName: string;
}) => boolean;

const REGEX_LITERAL = /^\/(?<source>.*)\/(?<flags>[a-z]*)$/su;

function parseList(raw: string) {
  return raw
    .split(/[\n,]/u)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

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
