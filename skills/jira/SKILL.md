---
name: jira
description: Use when the user mentions Jira issues (e.g., PROJ-123), asks about tickets, wants to create or update issues, check sprint status, or manage Jira workflow.
homepage: https://github.com/ankitpokhrel/jira-cli
repository: https://github.com/PSPDFKit-labs/agent-skills
metadata: {"openclaw":{"emoji":"🎫","requires":{"bins":["jira"]}},"envVars":[{"name":"JIRA_API_TOKEN","required":false,"description":"Needed for Jira CLI bootstrap and REST fallback"},{"name":"JIRA_LOGIN","required":false,"description":"Needed for Jira CLI bootstrap"},{"name":"JIRA_SERVER","required":false,"description":"Needed for Jira CLI bootstrap"},{"name":"JIRA_PROJECT","required":false,"description":"Needed for Jira CLI bootstrap"},{"name":"JIRA_USER","required":false,"description":"Needed for REST/curl fallback only"},{"name":"JIRA_BASE_URL","required":false,"description":"Needed for REST/curl fallback only"}]}
---

# Jira

Natural language interaction with Jira. Supports multiple backends.

## Backend Detection

Run this check first to determine which backend to use:

```
1. Check if jira CLI is available:
   -> Run: which jira
   -> If found: USE CLI BACKEND

2. If no CLI, check for Atlassian MCP:
   -> Look for mcp__atlassian__* tools
   -> If available: USE MCP BACKEND

3. If neither available:
   -> GUIDE USER TO SETUP
```

| Backend | When to Use | Reference |
|---------|-------------|-----------|
| CLI | `jira` command available | `references/commands.md` |
| MCP | Atlassian MCP tools available | `references/mcp.md` |
| None | Neither available | Guide to install CLI |

## Quick Reference (CLI)

Skip this section if using MCP backend.

| Intent | Command |
|--------|---------|
| View issue | `jira issue view ISSUE-KEY --raw` |
| List my issues | `jira issue list -a$(jira me)` |
| My in-progress | `jira issue list -a$(jira me) -s"In Progress"` |
| Create issue | `jira issue create -tType -s"Summary" -b"Description"` |
| Move/transition | `jira issue move ISSUE-KEY "State"` |
| Assign to me | `jira issue assign ISSUE-KEY $(jira me)` |
| Unassign | `jira issue assign ISSUE-KEY x` |
| Add comment | `jira issue comment add ISSUE-KEY -b"Comment text"` |
| Open in browser | `jira open ISSUE-KEY` |
| Current sprint | `jira sprint list --state active` |
| Who am I | `jira me` |

## Quick Reference (MCP)

Skip this section if using MCP backend.

| Intent | MCP Tool |
|--------|----------|
| Search issues | `mcp__atlassian__searchJiraIssuesUsingJql` |
| View issue | `mcp__atlassian__getJiraIssue` |
| Create issue | `mcp__atlassian__createJiraIssue` |
| Update issue | `mcp__atlassian__editJiraIssue` |
| Get transitions | `mcp__atlassian__getTransitionsForJiraIssue` |
| Transition | `mcp__atlassian__transitionJiraIssue` |
| Add comment | `mcp__atlassian__addCommentToJiraIssue` |
| User lookup | `mcp__atlassian__lookupJiraAccountId` |
| List projects | `mcp__atlassian__getVisibleJiraProjects` |

See `references/mcp.md` for full MCP patterns.

## Triggers

- "create a jira ticket"
- "show me PROJ-123"
- "list my tickets"
- "move ticket to done"
- "what's in the current sprint"

## Issue Key Detection

Issue keys follow the pattern `[A-Z]+-[0-9]+` (for example `PROJ-123`, `ABC-1`).

When a user mentions an issue key in conversation:

- CLI: `jira issue view KEY --raw` or `jira open KEY`
- MCP: `mcp__atlassian__getJiraIssue` with the key

## Workflow

Creating tickets:

1. Research context if the user references code, tickets, or PRs.
2. Draft ticket content.
3. Review with the user.
4. Create using the appropriate backend.

Updating tickets:

1. Fetch issue details first.
2. Check status carefully.
3. Show current versus proposed changes.
4. Get approval before updating.
5. Add a comment explaining changes when appropriate.

## Before Any Operation

Ask yourself:

1. What's the current state? Always fetch the issue first.
2. Who else is affected? Check watchers, linked issues, and parent epics.
3. Is this reversible? Transitions may have one-way gates.
4. Do I have the right identifiers? Issue keys, transition IDs, and account IDs matter.

## Never

- Never transition without fetching current status first.
- Never assign using display name with MCP; use account IDs.
- Never edit description without showing the original.
- Never use `--no-input` without all required fields.
- Never assume transition names are universal.
- Never bulk-modify without explicit approval.

## Safety

- Always show the command or tool call before running it.
- Always get approval before modifying tickets.
- Preserve original information when editing.
- Verify updates after applying.
- Surface authentication issues clearly so the user can resolve them.
- In this Railway deployment, if Jira CLI auth is missing or stale, tell the operator to update Railway secrets and run `jira.bootstrap` from `/setup`.

## No Backend Available

If neither CLI nor MCP is available, guide the user:

```
To use Jira, you need one of:

1. jira CLI (recommended):
   https://github.com/ankitpokhrel/jira-cli

   Install: brew install ankitpokhrel/jira-cli/jira-cli
   Setup:   jira init

2. Atlassian MCP:
   Configure it in your MCP settings with Atlassian credentials.
```

## Deep Dive

Load references when:

- Creating issues with complex fields or multi-line content
- Building JQL queries beyond simple filters
- Troubleshooting errors or authentication issues
- Working with transitions, linking, or sprints

Do not load references for:

- Simple view and list operations
- Basic status checks
- Opening issues in browser

| Task | Load Reference? |
|------|-----------------|
| View single issue | No |
| List my tickets | No |
| Create with description | Yes |
| Transition issue | Yes |
| JQL search | Yes |
| Link issues | Yes |

References:

- CLI patterns: `references/commands.md`
- MCP patterns: `references/mcp.md`
