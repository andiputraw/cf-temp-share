# Role and Objective
You are an expert full-stack developer specializing in Cloudflare ecosystem services. Your objective is to write the complete code and configuration for a "Temporary File Hosting Service" using Cloudflare Workers and Cloudflare R2. 

# Tech Stack
- Framework: Cloudflare Workers
- Package Manager: bun
- Storage: Cloudflare R2
- Language: TypeScript
- Routing: Native standard Request/Response handling (no external routing libraries needed)

# Project Requirements

## 1. Configuration (`wrangler.toml`)
Generate a `wrangler.toml` file that:
- Sets the name of the worker to `temp-file-host`.
- Sets the main entrypoint to `src/index.ts`.
- Binds an R2 bucket named `temp-files` to the variable `BUCKET`.

## 2. Worker Logic (`src/index.ts`)
Write an ES Module format Cloudflare Worker with the following specifications:

### Interfaces
- Define an `Env` interface containing the `BUCKET: R2Bucket` binding and an `AUTH_TOKEN: string` environment variable.

### Routes & Methods
The worker should parse the URL pathname to use as the file key. 
- `/`: If the root is accessed, return a simple 200 OK text response welcoming the user and explaining how to use the API.
- `/<filename>`: Handle requests to specific file keys based on the HTTP method:

  **PUT (Upload):**
  - Requires Authentication: Check the `Authorization` header for `Bearer <AUTH_TOKEN>`. If it fails, return 401 Unauthorized.
  - Upload the `request.body` to the R2 bucket using the file key.
  - Extract the `Content-Type` from the incoming request and save it in the R2 object's `httpMetadata`.
  - Return a 201 Created response with the full URL to access the uploaded file.

  **GET (Download):**
  - No authentication required (public download).
  - Fetch the object from R2.
  - If the object doesn't exist, return a 404 Not Found.
  - If it exists, return the file body in the response, ensuring the `Content-Type` and `ETag` headers are properly set from the R2 object metadata.

  **DELETE (Manual Deletion):**
  - Requires Authentication: Same check as the PUT method.
  - Delete the object from R2 using the file key.
  - Return a 200 OK response confirming deletion.

  **Other Methods:**
  - Return a 405 Method Not Allowed.

## 3. Deployment & Setup Instructions
After generating the code, provide a brief, bulleted markdown guide for me on:
1. How to initialize the worker project using the CLI.
2. How to create the R2 bucket via the Cloudflare Dashboard.
3. **Crucial:** How to set an "Object Lifecycle Rule" in the Cloudflare Dashboard to automatically delete files in this bucket after 24 hours.
4. How to add the `AUTH_TOKEN` secret via wrangler.
5. How to deploy the worker.

Please write clean, commented, and production-ready code.
