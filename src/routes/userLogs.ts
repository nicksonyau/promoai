import { Env } from "../index";

export async function userLogsHandler(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");

  if (!userId) {
    return new Response(JSON.stringify({ error: "Missing userId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const logs = await env.KV.get(`userlog:${userId}`, { type: "json" as const });
  return new Response(JSON.stringify({ logs: logs || [] }), {
    headers: { "Content-Type": "application/json" },
  });
}
