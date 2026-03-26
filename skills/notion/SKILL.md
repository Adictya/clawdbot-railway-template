---
name: notion
description: Notion API for creating and managing pages, databases, and blocks.
homepage: https://developers.notion.com
metadata: {"openclaw":{"requires":{"bins":["curl"]}}}
---

# notion

Use the Notion API to create, read, and update pages, data sources, and blocks.

## Setup

1. Create an integration at https://notion.so/my-integrations.
2. Copy the API key (starts with `ntn_` or `secret_`).
3. Prefer an environment variable:

```bash
export NOTION_API_KEY="ntn_your_key_here"
```

4. File fallback if needed:

```bash
mkdir -p "${XDG_CONFIG_HOME:-$HOME/.config}/notion"
printf '%s\n' "$NOTION_API_KEY" > "${XDG_CONFIG_HOME:-$HOME/.config}/notion/api_key"
```

5. Share target pages and databases with your integration.

In this Railway image, `XDG_CONFIG_HOME` points to `/data/.config`, so the fallback file persists across restarts.

## API Basics

All requests need:

```bash
NOTION_KEY="${NOTION_API_KEY:-$(cat "${XDG_CONFIG_HOME:-$HOME/.config}/notion/api_key")}"
curl -X GET "https://api.notion.com/v1/..." \
  -H "Authorization: Bearer $NOTION_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -H "Content-Type: application/json"
```

The `Notion-Version` header is required. This skill uses `2025-09-03`.

## Common Operations

Search for pages and data sources:

```bash
curl -X POST "https://api.notion.com/v1/search" \
  -H "Authorization: Bearer $NOTION_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -H "Content-Type: application/json" \
  -d '{"query": "page title"}'
```

Get a page:

```bash
curl "https://api.notion.com/v1/pages/{page_id}" \
  -H "Authorization: Bearer $NOTION_KEY" \
  -H "Notion-Version: 2025-09-03"
```

Get page content:

```bash
curl "https://api.notion.com/v1/blocks/{page_id}/children" \
  -H "Authorization: Bearer $NOTION_KEY" \
  -H "Notion-Version: 2025-09-03"
```

Create a page in a data source:

```bash
curl -X POST "https://api.notion.com/v1/pages" \
  -H "Authorization: Bearer $NOTION_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -H "Content-Type: application/json" \
  -d '{
    "parent": {"database_id": "xxx"},
    "properties": {
      "Name": {"title": [{"text": {"content": "New Item"}}]},
      "Status": {"select": {"name": "Todo"}}
    }
  }'
```

Query a data source:

```bash
curl -X POST "https://api.notion.com/v1/data_sources/{data_source_id}/query" \
  -H "Authorization: Bearer $NOTION_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {"property": "Status", "select": {"equals": "Active"}},
    "sorts": [{"property": "Date", "direction": "descending"}]
  }'
```

Update page properties:

```bash
curl -X PATCH "https://api.notion.com/v1/pages/{page_id}" \
  -H "Authorization: Bearer $NOTION_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -H "Content-Type: application/json" \
  -d '{"properties": {"Status": {"select": {"name": "Done"}}}}'
```

Add blocks to a page:

```bash
curl -X PATCH "https://api.notion.com/v1/blocks/{page_id}/children" \
  -H "Authorization: Bearer $NOTION_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -H "Content-Type: application/json" \
  -d '{
    "children": [
      {"object": "block", "type": "paragraph", "paragraph": {"rich_text": [{"text": {"content": "Hello"}}]}}
    ]
  }'
```

## Property Types

- Title: `{"title": [{"text": {"content": "..."}}]}`
- Rich text: `{"rich_text": [{"text": {"content": "..."}}]}`
- Select: `{"select": {"name": "Option"}}`
- Multi-select: `{"multi_select": [{"name": "A"}, {"name": "B"}]}`
- Date: `{"date": {"start": "2024-01-15", "end": "2024-01-16"}}`
- Checkbox: `{"checkbox": true}`
- Number: `{"number": 42}`
- URL: `{"url": "https://..."}`
- Email: `{"email": "a@b.com"}`
- Relation: `{"relation": [{"id": "page_id"}]}`

## Notes

- Data sources are the 2025 API term for databases.
- Use `database_id` when creating pages and `data_source_id` when querying.
- Page and database IDs are UUIDs, with or without dashes.
- The API cannot set database view filters; that remains UI-only.
- Keep secrets out of page content, comments, and logs.
