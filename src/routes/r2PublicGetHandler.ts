// src/routes/r2PublicGetHandler.ts

export async function r2PublicGetHandler(req: Request, env: any): Promise<Response> {
  try {
    // Remove "/r2/" prefix to get R2 key
    const url = new URL(req.url);
    const key = url.pathname.replace("/r2/", "");

    if (!key) {
      return new Response("Missing R2 key", { status: 400 });
    }

    console.log("🔎 R2 GET:", key);

    if (!env.MY_R2_BUCKET) {
      console.error("❌ No R2 bucket bound");
      return new Response("R2 bucket not available", { status: 500 });
    }

    // Fetch from R2
    const object = await env.MY_R2_BUCKET.get(key);

    if (!object) {
      console.error("❌ R2 object not found:", key);
      return new Response("Not found", { status: 404 });
    }

    // Get content type
    const contentType =
      object.httpMetadata?.contentType ||
      "application/octet-stream";

    return new Response(object.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });

  } catch (err: any) {
    console.error("❌ r2PublicGetHandler ERROR:", err);
    return new Response("Server error", { status: 500 });
  }
}
