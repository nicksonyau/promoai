// src/routes/r2PublicGet.ts
// Public GET endpoint for serving R2 images

export interface Env {
  MY_R2_BUCKET: R2Bucket;
}

export async function r2PublicGetHandler(req: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(req.url);

    // /r2/stores/store_123/logo.png → stores/store_123/logo.png
    const key = url.pathname.replace("/r2/", "");

    if (!key) {
      return new Response("Missing R2 key", { status: 400 });
    }

    const object = await env.MY_R2_BUCKET.get(key);

    if (!object) {
      return new Response("File not found", { status: 404 });
    }

    return new Response(object.body, {
      headers: {
        "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
        "Cache-Control": "public, max-age=86400", // 1 day
      },
    });

  } catch (err: any) {
    console.error("❌ r2PublicGetHandler error:", err);
    return new Response("Server Error", { status: 500 });
  }
}
