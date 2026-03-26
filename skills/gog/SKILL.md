---
name: gog
description: Use gog for Gmail, Calendar, Drive, Contacts, Sheets, and Docs when Google Workspace work is needed.
metadata: {"openclaw":{"requires":{"bins":["gog"]}}}
---

# gog

Use `gog` for Google Workspace tasks such as Gmail, Calendar, Drive, Contacts,
Sheets, and Docs.

Guidelines:

- Prefer `--json` for data the agent needs to parse or transform.
- Prefer read-only commands first when inspecting mail, calendars, files, or
  sheets.
- Confirm before sending mail, creating calendar events, changing files, or
  editing sheets/docs.
- If auth is missing or broken, tell the operator to open `/setup` and run the
  `gog.bootstrap` console command after updating Railway secrets.

Common commands:

- Gmail search: `gog gmail search 'newer_than:7d' --max 10`
- Gmail send: `gog gmail send --to a@b.com --subject "Hi" --body "Hello"`
- Calendar events: `gog calendar events <calendarId> --from <iso> --to <iso>`
- Drive search: `gog drive search "query" --max 10`
- Contacts list: `gog contacts list --max 20`
- Sheets get: `gog sheets get <sheetId> "Tab!A1:D10" --json`
- Sheets update: `gog sheets update <sheetId> "Tab!A1:B2" --values-json '[["A","B"],["1","2"]]'`
- Docs export: `gog docs export <docId> --format txt --out /tmp/doc.txt`

Notes:

- Set `GOG_ACCOUNT` to the default Google account when more than one account is available.
- For scripts and automation, use `--no-input` to avoid interactive prompts.
