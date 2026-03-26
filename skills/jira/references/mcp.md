# MCP Reference

Complete reference for Atlassian Jira operations via MCP.

## MCP Tool Reference

### Search Operations

#### `mcp__atlassian__searchJiraIssuesUsingJql`

Search Jira using JQL.

Parameters:

- `jql` (required): JQL query string
- `maxResults`: Maximum results
- `startAt`: Pagination offset
- `fields`: Comma-separated fields to return

Example:

```
mcp__atlassian__searchJiraIssuesUsingJql(jql: "project = PROJ AND status = 'In Progress'")
```

### Issue Operations

#### `mcp__atlassian__getJiraIssue`

Retrieve full issue details by key.

Parameters:

- `issueKey` (required): Issue key such as `PROJ-123`
- `expand`: Additional data

#### `mcp__atlassian__createJiraIssue`

Create a new issue.

Parameters:

- `projectKey` (required)
- `issueType` (required)
- `summary` (required)
- `description`
- `assignee`
- `priority`
- `labels`
- `components`
- custom fields as needed

Example:

```
mcp__atlassian__createJiraIssue(
  projectKey: "PROJ",
  issueType: "Story",
  summary: "Implement user authentication",
  description: "Add OAuth2 authentication flow...",
  labels: ["backend", "security"]
)
```

#### `mcp__atlassian__editJiraIssue`

Update an existing issue.

Parameters:

- `issueKey` (required)
- Any field to update

### Transition Operations

#### `mcp__atlassian__getTransitionsForJiraIssue`

Get available status transitions for an issue.

#### `mcp__atlassian__transitionJiraIssue`

Change issue status.

Workflow:

1. Get transitions.
2. Find the desired transition ID.
3. Execute the transition.

### Comment Operations

#### `mcp__atlassian__addCommentToJiraIssue`

Add a comment to an issue.

### User Operations

#### `mcp__atlassian__lookupJiraAccountId`

Find a user account ID for assignments.

### Project Operations

#### `mcp__atlassian__getVisibleJiraProjects`

List available Jira projects.

#### `mcp__atlassian__getJiraProjectIssueTypesMetadata`

Get issue types and required fields for a project.

#### `mcp__atlassian__getJiraIssueTypeMetaWithFields`

Get detailed field metadata for an issue type.

## JQL Reference

Basic syntax:

```
field operator value [AND|OR field operator value]
```

Common fields:

| Field | Description | Example |
|-------|-------------|---------|
| `project` | Project key | `project = "PROJ"` |
| `issuetype` | Issue type | `issuetype = Bug` |
| `status` | Issue status | `status = "In Progress"` |
| `assignee` | Assigned user | `assignee = currentUser()` |
| `reporter` | Issue creator | `reporter = "jobarksdale"` |
| `priority` | Priority level | `priority = High` |
| `labels` | Issue labels | `labels = "backend"` |
| `component` | Components | `component = "API"` |
| `created` | Creation date | `created >= -30d` |
| `updated` | Last update | `updated >= -7d` |
| `resolved` | Resolution date | `resolved >= startOfMonth()` |
| `sprint` | Sprint name or ID | `sprint in openSprints()` |
| `epic` | Parent epic | `"Epic Link" = PROJ-100` |
| `parent` | Parent issue | `parent = PROJ-50` |
| `text` | Full-text search | `text ~ "authentication"` |
| `summary` | Title search | `summary ~ "login"` |
| `description` | Description search | `description ~ "OAuth"` |

Operators:

| Operator | Meaning | Example |
|----------|---------|---------|
| `=` | Exact match | `status = Done` |
| `!=` | Not equal | `status != Closed` |
| `~` | Contains | `summary ~ "auth*"` |
| `!~` | Does not contain | `summary !~ "test"` |
| `>` `>=` `<` `<=` | Comparisons | `priority >= High` |
| `IN` | Multiple values | `status IN (Open, "In Progress")` |
| `NOT IN` | Exclude values | `status NOT IN (Done, Closed)` |
| `IS` | Null check | `assignee IS EMPTY` |
| `IS NOT` | Not null | `assignee IS NOT EMPTY` |

Useful functions:

| Function | Description | Example |
|----------|-------------|---------|
| `currentUser()` | Logged-in user | `assignee = currentUser()` |
| `now()` | Current timestamp | `created <= now()` |
| `startOfDay()` | Midnight today | `updated >= startOfDay()` |
| `startOfWeek()` | Start of week | `created >= startOfWeek()` |
| `startOfMonth()` | Start of month | `created >= startOfMonth()` |
| `openSprints()` | Active sprints | `sprint in openSprints()` |
| `closedSprints()` | Completed sprints | `sprint in closedSprints()` |
| `linkedIssues()` | Linked issues | `issue in linkedIssues("PROJ-123")` |

Relative dates:

```jql
created >= -7d
updated >= -30d
created >= -2w
created >= -1M
created >= "2024-01-01"
```

Ordering:

```jql
project = PROJ ORDER BY priority DESC
project = PROJ ORDER BY status ASC, created DESC
```

Complex query examples:

```jql
assignee = currentUser() AND status NOT IN (Done, Closed) AND priority >= High
issuetype = Bug AND created >= startOfWeek() ORDER BY priority DESC
status = Blocked OR "Flagged" = "Impediment"
sprint in openSprints() AND status = "To Do" ORDER BY rank ASC
watcher = currentUser()
```

## Issue Linking

The Atlassian MCP does not currently support creating issue links directly. Use the Jira CLI or REST fallback.

```bash
jira issue link PROJ-123 PROJ-456 "Depends On"
jira issue link PROJ-100 PROJ-200 "Blocks"
jira issue link PROJ-50 PROJ-75 "Relates To"
```

Find link types with the REST API:

```bash
curl -s -u "$JIRA_USER:$JIRA_API_TOKEN" \
  "$JIRA_BASE_URL/rest/api/3/issueLinkType"
```

Required env vars for REST fallback:

- `JIRA_BASE_URL`
- `JIRA_USER`
- `JIRA_API_TOKEN`

## Description Formatting

Jira wiki markup examples:

```
h1. Heading 1
h2. Heading 2

*bold text*
_italic text_
-strikethrough-

* Bullet list
# Numbered list

[Link text|https://example.com]
[Issue link|PROJ-123]
```

ADF example:

```json
{
  "type": "doc",
  "version": 1,
  "content": [
    {
      "type": "paragraph",
      "content": [{ "type": "text", "text": "Description text" }]
    }
  ]
}
```

## Error Handling

| HTTP Code | Error | Cause | Resolution |
|-----------|-------|-------|------------|
| 400 | Bad Request | Invalid field values | Check required fields |
| 401 | Unauthorized | Invalid credentials | Reconnect or rebootstrap |
| 403 | Forbidden | Insufficient permissions | Check project permissions |
| 404 | Not Found | Issue or project missing | Verify key |
| 422 | Unprocessable | Validation failed | Check field constraints |

Authentication issues:

1. Run `/mcp` to check Atlassian MCP connection if using MCP.
2. For this Railway deployment, update the Jira env secrets and run `jira.bootstrap` from `/setup` if the CLI backend is failing.
3. Verify project access and token scopes.

## Common Workflows

Move ticket to done:

```
1. Get available transitions.
2. Find the Done transition ID.
3. Execute the transition.
4. Add a comment if needed.
```

Create and assign issue:

```
1. Look up the assignee account ID.
2. Create the issue with project, type, summary, and description.
3. Verify the created issue.
```

List my in-progress issues:

```
mcp__atlassian__searchJiraIssuesUsingJql(
  jql: "assignee = currentUser() AND status = 'In Progress' ORDER BY updated DESC"
)
```
