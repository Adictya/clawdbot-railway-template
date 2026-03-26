---
name: github
description: Interact with GitHub using the `gh` CLI for issues, pull requests, runs, and advanced API queries.
homepage: https://cli.github.com
metadata: {"openclaw":{"requires":{"bins":["gh"]}}}
---

# GitHub Skill

Use the `gh` CLI to interact with GitHub. Always specify `--repo owner/repo` when not in a git directory, or use URLs directly.

## Authentication

- Prefer `GH_TOKEN` or `GITHUB_TOKEN` in non-interactive environments.
- Alternatively, use `gh auth login` when shell access is available.
- Use least-privilege scopes for tokens.

## Pull Requests

Check CI status on a PR:

```bash
gh pr checks 55 --repo owner/repo
```

List recent workflow runs:

```bash
gh run list --repo owner/repo --limit 10
```

View a run and see which steps failed:

```bash
gh run view <run-id> --repo owner/repo
```

View logs for failed steps only:

```bash
gh run view <run-id> --repo owner/repo --log-failed
```

## API for Advanced Queries

The `gh api` command is useful for accessing data not available through other subcommands.

Get a PR with specific fields:

```bash
gh api repos/owner/repo/pulls/55 --jq '.title, .state, .user.login'
```

## JSON Output

Most commands support `--json` for structured output. You can use `--jq` to filter:

```bash
gh issue list --repo owner/repo --json number,title --jq '.[] | "\(.number): \(.title)"'
```

## Safety

- Read first before mutating issues, PRs, or releases.
- Confirm before writes like commenting, closing, merging, or editing.
- Prefer `--json` for machine-readable output.
- When operating outside the current repo, always pass `--repo owner/repo` explicitly.
