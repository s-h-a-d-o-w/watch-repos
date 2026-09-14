# watch-repos

GitHub Action that turns on "watch" (all activity) for every repository owned by the user the
supplied token belongs to.

## Usage

```yaml
- uses: s-h-a-d-o-w/watch-repos@v1
  with:
    token: ${{ secrets.WATCH_REPOS_TOKEN }}
    ignore: |
      some-owner/some-repo
      another-repo
```

`GITHUB_TOKEN` cannot manage watching, so a personal access token is required - classic with the
`repo` scope, or fine-grained with read/write access to "Repository metadata" and "Watching".

## Inputs

| Input              | Required | Default | Description                                          |
| ------------------ | -------- | ------- | ---------------------------------------------------- |
| `token`            | yes      |         | Personal access token (see above).                   |
| `ignore`           | no       | `""`    | Repositories to skip (see below).                    |
| `include-archived` | no       | `false` | Whether archived repositories should be watched too. |

### `ignore`

Either a regular expression literal or a list of repository names. Both are matched against `repo`
as well as `owner/repo`, list entries are compared case-insensitively.

```yaml
ignore: /^fork-/i # regular expression
ignore: dotfiles, owner/secrets # comma separated
ignore: | # newline separated
  dotfiles
  owner/secrets
```
