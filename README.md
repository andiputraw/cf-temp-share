# cf-temp-file

Private temporary file sharing using Cloudflare Workers and R2. Files expire after 24 hours.

## Quick Start

```bash
bun install
bun run dev
```

## Usage

### Upload a file
```bash
curl -X PUT -H "Authorization: Bearer <token>" -H "Content-Type: image/png" \
  --data-binary @photo.png https://<worker-url>/photo.png
```

### Download a file
```bash
curl -O https://<worker-url>/photo.png
```

### Delete a file
```bash
curl -X DELETE -H "Authorization: Bearer <token>" \
  https://<worker-url>/photo.png
```

## Deploy

```bash
wrangler secret put AUTH_TOKEN
bun run deploy
```

Create an R2 bucket named `temp-files` and set a 24h lifecycle rule before deploying.
