# AGENTS.md - Developer Guide for temp-file-host

## Project Overview
Temporary file hosting service built on Cloudflare Workers + R2 storage.

## Tech Stack
- **Runtime**: Cloudflare Workers (ES Modules)
- **Language**: TypeScript
- **Package Manager**: bun
- **Storage**: Cloudflare R2
- **Config**: wrangler.toml

## Commands

```bash
# Install dependencies
bun install

# Local development
bun run dev              # Start wrangler dev server

# Deploy
bun run deploy           # Deploy to Cloudflare

# Type checking
bunx tsc --noEmit        # Type check without emitting

# Linting (if eslint added)
bun run lint             # Run eslint
bun run lint:fix         # Auto-fix lint issues
```

## Project Structure
```
├── src/
│   └── index.ts         # Worker entrypoint
├── wrangler.toml        # Cloudflare config
├── package.json
├── tsconfig.json
└── AGENTS.md
```

## Code Style

### Imports
- Use ES module imports only (`import`/`export`)
- Group imports: standard library, third-party, local (separated by blank lines)
- Use absolute imports from `src/` root when possible

### TypeScript
- Strict mode enabled in tsconfig
- Always type function parameters and return values
- Use the `Env` interface for worker context: `{ BUCKET: R2Bucket; AUTH_TOKEN: string }`
- Prefer `interface` over `type` for object shapes
- Use `as const` for literal types where appropriate

### Naming Conventions
- `camelCase` for variables, functions, parameters
- `PascalCase` for interfaces, types, classes
- `UPPER_SNAKE_CASE` for constants and env vars
- Route handlers: descriptive verb names (e.g., `handleUpload`, `handleDownload`)

### Formatting
- 2-space indentation
- Single quotes for strings (unless containing single quotes)
- Semicolons required
- Max line length: 120 characters
- Trailing commas in multi-line objects/arrays

### Error Handling
- Return appropriate HTTP status codes (401, 404, 405, 500)
- Never expose internal errors to clients; return generic messages
- Log errors with `console.error()` for debugging
- Use early returns for guard clauses (avoid deep nesting)

### Response Patterns
```typescript
return new Response("OK", { status: 200 });
return new Response("Not Found", { status: 404 });
return new Response("Unauthorized", { status: 401 });
return Response.json({ error: "message" }, { status: 400 });
```

### Authentication
- Check `Authorization: Bearer <token>` header for protected routes
- Compare tokens using constant-time comparison when possible
- Fail fast: reject unauthorized requests before any business logic

## API Endpoints
| Method   | Path        | Auth     | Description         |
|----------|-------------|----------|---------------------|
| GET      | `/`         | No       | Welcome/help page   |
| PUT      | `/<file>`   | Required | Upload file to R2   |
| GET      | `/<file>`   | No       | Download file       |
| DELETE   | `/<file>`   | Required | Delete file from R2 |
| Other    | `/<file>`   | -        | 405 Method Not Allowed |

## R2 Operations
- Upload: `BUCKET.put(key, body, { httpMetadata: { contentType } })`
- Download: `BUCKET.get(key)` — check for null (404 if missing)
- Delete: `BUCKET.delete(key)`
- Files auto-expire after 24h via Object Lifecycle Rule

## Git Guidelines
- Write clear, imperative commit messages (`"add auth middleware"`)
- Keep commits focused on single logical changes
- Do not commit secrets, `.env` files, or `node_modules/`
