// src/routes/r2Proxy.ts

export async function r2ProxyHandler(req: Request, env: Env): Promise<Response> {
  try {
    if (!env.MY_R2_BUCKET) {
      return new Response("R2 not configured", { status: 500 });
    }

    const url = new URL(req.url);
    const key = url.pathname.replace("/r2/", "").trim();

    if (!key) {
      return new Response("Missing R2 key", { status: 400 });
    }

    const object = await env.MY_R2_BUCKET.get(key);

    if (!object) {
      return new Response("Not found", { status: 404 });
    }

    return new Response(object.body, {
      headers: {
        "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err: any) {
    console.error("r2ProxyHandler error:", err);
    return new Response("R2 Proxy Error", { status: 500 });
  }
}
