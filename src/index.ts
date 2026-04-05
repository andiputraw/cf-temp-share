interface Env {
  BUCKET: R2Bucket;
  AUTH_TOKEN: string;
}

function buildHelpText(url: string): string {
  const helpText = `
Temporary File Host API
=======================

PUT   /<filename>  - Upload a file (requires auth)
GET   /<filename>  - Download a file (public)
DELETE /<filename> - Delete a file (requires auth)

Examples:
  # Upload a file
  curl -X PUT -H "Authorization: Bearer <token>" -H "Content-Type: image/png" --data-binary @photo.png ${url}photo.png

  # Download a file
  curl -O ${url}photo.png

  # Delete a file
  curl -X DELETE -H "Authorization: Bearer <token>" ${url}photo.png

Authentication: Include header "Authorization: Bearer <token>"
Files expire after 24 hours.
  `.trim();
  return helpText;
}

// Welcome page for root access
function handleRoot(request: Request): Response {
  return new Response(buildHelpText(request.url), {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

// Verify Bearer token authentication
function checkAuth(request: Request, env: Env): boolean {
  const authHeader = request.headers.get("Authorization");
  console.log(authHeader, env.AUTH_TOKEN);
  if (!authHeader || authHeader !== `Bearer ${env.AUTH_TOKEN}`) {
    return false;
  }
  return true;
}

// Handle file upload
async function handleUpload(
  request: Request,
  env: Env,
  key: string,
): Promise<Response> {
  if (!checkAuth(request, env)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const contentType =
    request.headers.get("Content-Type") || "application/octet-stream";

  await env.BUCKET.put(key, request.body, {
    httpMetadata: { contentType },
  });

  const url = new URL(request.url);
  const fileUrl = `${url.origin}/${key}`;

  return new Response(fileUrl, {
    status: 201,
    headers: { "Content-Type": "text/plain" },
  });
}

// Handle file download
async function handleDownload(env: Env, key: string): Promise<Response> {
  const object = await env.BUCKET.get(key);

  if (!object) {
    return new Response("Not Found", { status: 404 });
  }

  // --- Strict 24-Hour Expiry Check ---
  const uploadedAt = object.uploaded.getTime();
  const now = Date.now();
  const ageInHours = (now - uploadedAt) / (1000 * 60 * 60);

  if (ageInHours >= 24) {
    // If it's older than 24 hours, delete it from R2 now and return a 404
    await env.BUCKET.delete(key);
    return new Response("Not Found (Expired)", { status: 404 });
  }
  // -----------------------------------

  const headers = new Headers();
  headers.set(
    "Content-Type",
    object.httpMetadata?.contentType || "application/octet-stream",
  );

  // Note: R2 uses 'httpEtag' for the header-formatted ETag (includes quotes)
  if (object.httpEtag) {
    headers.set("ETag", object.httpEtag);
  }

  return new Response(object.body, { headers });
}
// Handle file deletion
async function handleDelete(
  request: Request,
  env: Env,
  key: string,
): Promise<Response> {
  if (!checkAuth(request, env)) {
    return new Response("Unauthorized", { status: 401 });
  }

  await env.BUCKET.delete(key);

  return new Response("Deleted", { status: 200 });
}

// Main request handler
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;

    // Root path - show help
    if (pathname === "/") {
      if (method === "GET") {
        return handleRoot(request);
      }
      return new Response("Method Not Allowed", { status: 405 });
    }

    // Extract file key from path (remove leading slash)
    const key = pathname.slice(1);

    if (!key) {
      return new Response("Not Found", { status: 404 });
    }

    // Route by HTTP method
    try {
      switch (method) {
        case "PUT":
          return await handleUpload(request, env, key);
        case "GET":
          return await handleDownload(env, key);
        case "DELETE":
          return await handleDelete(request, env, key);
        default:
          return new Response("Method Not Allowed", { status: 405 });
      }
    } catch (error) {
      console.error("Error handling request:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;
