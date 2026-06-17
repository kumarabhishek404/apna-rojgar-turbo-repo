# Apna Rojgar — Android Manual Test Cases

Manual QA workbook for the **labour-app** (Apna Rojgar) Android client — **one sheet per screen area**.

| Artifact | Description |
|----------|-------------|
| [apna-rojgar-android-test-cases.xlsx](./apna-rojgar-android-test-cases.xlsx) | Full workbook — **665 cases**, **26 screen tabs** |
| [scripts/generate-mobile-test-cases.mjs](../../../scripts/generate-mobile-test-cases.mjs) | Regenerator script |

**Scope:** Android · All roles · Availability + Functionality + UI Design  
**App version:** 1.3.1

---

## Workbook layout

| Sheet | Purpose |
|-------|---------|
| **README** | Overview and column reference |
| **How to Test** | 2-minute quick start for new testers |
| **Test Accounts** | Roles, test data, staging OTP |
| **Screen Index** | All screen tabs + case counts |
| **Summary** | Stats by module, role, test type |
| **Numbered tabs** | e.g. `03 - Login`, `10 - Home Tab`, `20 - Service Detail` |

Each screen tab has a **blue banner** with how to open that screen (read once per tab).

Each test row has:
- **Pre-requisites** — account + setup in one short line
- **Steps** — tap-by-tap actions to show on the phone
- **Expected Result** — what should happen

Navigation is **not repeated** in every row — only in the sheet banner.

---

## Quick start (demo / walkthrough)

1. Read **How to Test** and **Test Accounts**
2. Open a screen tab (start with `03 - Login`)
3. Read the banner → open that screen on the phone
4. Run each row: **Steps** → check **Expected Result** → set **Status**
5. Screenshot + **Found Issues** on Fail

---

## Upload to Google Sheets

1. [Google Sheets](https://sheets.google.com) → Blank spreadsheet
2. **File → Import → Upload** → select the `.xlsx`
3. All screen tabs import as separate sheets

---

## Regenerate

```bash
pnpm generate:mobile-test-cases
```

Edit cases in `scripts/mobile-test-cases/modules/` then regenerate.
