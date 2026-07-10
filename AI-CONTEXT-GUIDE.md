# AI Context Endpoints - Understanding and Usage

## Overview

SpecHub provides AI context endpoints that return comprehensive, structured **plain text** data optimized for AI analysis. These are the **primary way** to access project and feature data.

## Why Use AI Context Endpoints?

1. **Complete Data**: Returns entire project/feature information in one call
2. **Structured Text**: Organized plain text optimized for AI understanding
3. **No Multiple Requests**: Everything in a single response
4. **Comprehensive**: All metadata, descriptions, and requirements together

## Endpoint Structure

### Project Context
```
GET https://go.spechub.app/<org-slug>/<project-slug>/_/debug/ai-context
Cookie: session=YOUR_SESSION_TOKEN
User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36
```

**Example**: `https://go.spechub.app/my-org/my-project/_/debug/ai-context`

Returns plain text including:
- Project name and description
- User roles and permissions
- Data model with entity definitions and fields
- Complete context for AI analysis

### Feature Context
```
GET https://go.spechub.app/<org-slug>/<project-slug>/<feature-ref>/_/debug/ai-context
Cookie: session=YOUR_SESSION_TOKEN
User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36
```

**Example**: `https://go.spechub.app/my-org/my-project/124/_/debug/ai-context`

Returns plain text including:
- Feature name and description
- All requirements for the feature
- Complete context for feature analysis

## Usage in Scripts

### Get Project Context
```bash
./scripts/get-project-context.js my-org my-project
./scripts/get-project-context.js my-org my-project output.txt   # Save to file
```

### Get Feature Context
```bash
./scripts/get-feature-context.js my-org my-project 124
./scripts/get-feature-context.js my-org my-project 124 output.txt   # Save to file
```

## When to Use Each Endpoint

### Use Project Context When:
- Analyzing the entire project
- Getting an overview of all features
- Understanding the data model
- Generating project reports
- Answering project-level questions

### Use Feature Context When:
- Diving into a specific feature
- Analyzing feature requirements
- Answering feature-specific questions

## Authentication

Both endpoints require cookie-based authentication:
```
Cookie: session=YOUR_SESSION_TOKEN
```

Get a session via:
```bash
./scripts/login.js
```

## Error Handling

- **303 redirect to /login**: Session expired — run `./scripts/login.js`
- **404**: Invalid org/project/feature — check slugs and refs

## Real Examples

Organization: `my-org`, Project: `my-project`, Feature: `124`

- **Project Context**: `https://go.spechub.app/my-org/my-project/_/debug/ai-context`
- **Feature Context**: `https://go.spechub.app/my-org/my-project/124/_/debug/ai-context`
