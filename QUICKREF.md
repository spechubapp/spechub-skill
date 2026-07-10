# SpecHub Quick Reference (Read-Only)

## ⚠️ READ-ONLY ACCESS

This skill provides **read-only** access to SpecHub. It can view and analyze data but **cannot** create, update, or delete anything.

## Installation

```bash
cd ~/.pi/agent/skills/spechub
npm install
```

## Commands

### Authentication
```bash
./scripts/login.js          # Login with OTP (two-step: email → passcode)
./scripts/check-auth.js     # Check session status
./scripts/diagnose.js       # Run full diagnostics
./scripts/setup.js          # Initial configuration
```

### Browse & View
```bash
./scripts/list-projects.js                              # List all projects
./scripts/get-project-context.js <org> <project>        # Full project context
./scripts/get-project-context.js <org> <project> out.txt  # Save to file
./scripts/get-feature-context.js <org> <project> <ref>  # Full feature context
./scripts/get-feature-context.js <org> <project> <ref> out.txt  # Save to file
./scripts/analyze-project.js <org> <project>            # Analyze project
```

### Examples
```bash
./scripts/list-projects.js
./scripts/get-project-context.js my-org my-project
./scripts/get-feature-context.js my-org my-project 124
./scripts/analyze-project.js my-org my-project
```

## Authentication

SpecHub uses cookie-based sessions with email OTP:

1. Run `./scripts/login.js`
2. OTP is sent to your email
3. Enter the 6-digit passcode
4. Session cookie is saved to `.env`

**Login flow details:**
- Step 1: POST `/login` with your email → session cookie set
- Step 2: POST `/login/confirmation` with `login_code_plaintext=XXXXXX` (carrying session cookie from step 1) → new session cookie set

## URL Structure

```
https://go.spechub.app/<org-slug>/<project-slug>
https://go.spechub.app/<org-slug>/<project-slug>/<feature-ref>
```

### AI Context Endpoints (return plain text)
```
https://go.spechub.app/<org-slug>/<project-slug>/_/debug/ai-context
https://go.spechub.app/<org-slug>/<project-slug>/<feature-ref>/_/debug/ai-context
```

## Required Headers

All requests must include:
```
Cookie: session=YOUR_SESSION_TOKEN
User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36
```

## Configuration

`.env` file in skill directory:
```bash
SPECHUB_URL=https://go.spechub.app
SPECHUB_SESSION_TOKEN=your_session_token_here
```

## Troubleshooting

| Problem | Solution |
|---|---|
| Session expired (303 → /login) | Run `./scripts/login.js` |
| OTP invalid/expired | Request a new OTP, enter it quickly |
| Module not found | Run `npm install` in skill directory |
| Can't connect | Check network, verify URL |
| No projects listed | Check auth: `./scripts/check-auth.js` |
| Asked to modify data | This skill is read-only |

## Data Hierarchy

```
Organization (org-slug)
└── Project (project-slug)
    └── Feature (feature-ref, numeric)
```

## Key Facts

- **No public API** — data accessed via HTML parsing and AI context text endpoints
- **Cookie-based auth** — not Bearer tokens
- **AI context returns plain text** — not JSON
- **Read-only** — never creates, updates, or deletes data
