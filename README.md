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

Note that uploading a file respect the limit of cloudflare workers (usually 100mb in free tier). Generate the [Presigned upload URL](### Generate presigned upload URL) presigned upload URL instead for bigger size.

### Download a file
```bash
curl -O https://<worker-url>/photo.png
```

### Delete a file
```bash
curl -X DELETE -H "Authorization: Bearer <token>" \
  https://<worker-url>/photo.png
```

### Generate presigned upload URL
Returns a presigned URL for direct browser uploads and the public download URL.
```bash
curl -X POST -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"filename":"photo.png"}' https://<worker-url>/generate-url
```

## Deploy

```bash
wrangler secret put AUTH_TOKEN
wrangler secret put R2_ACCOUNT_ID
wrangler secret put R2_ACCESS_KEY_ID
wrangler secret put R2_SECRET_ACCESS_KEY
bun run deploy
```

Create an R2 bucket named `temp-files` and set a 24h lifecycle rule before deploying.
You also need to create R2 API tokens (Access Key ID and Secret Access Key) for presigned URL generation.
