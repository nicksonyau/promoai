// ✅ File: src/routes/settingsUpdate.ts
import { Env } from "../index";

export async function settingsUpdateHandler(req: Request, env: Env): Promise<Response> {
  try {
    const body = await req.json();

    // ✅ Validation
    if (!body.userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const key = `user_settings:${body.userId}`;

    // ✅ Fetch existing (optional)
    const existing = (await env.KV.get(key, { type: "json" })) || {};

    // ✅ Merge updates (override only provided fields)
    const updated = {
      ...existing,
      ...body,
      updatedAt: new Date().toISOString(),
    };

    // ✅ Save to KV
    await env.KV.put(key, JSON.stringify(updated));

    return new Response(JSON.stringify({ success: true, settings: updated }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("❌ settingsUpdate error:", err);
    return new Response(
      JSON.stringify({ error: err.message ?? "Failed to update settings" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
