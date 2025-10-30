import { Env } from "../index";

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function logsHandler(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId"); // 🔹 optional
  const date = url.searchParams.get("date");     // optional
  const limitParam = parseInt(url.searchParams.get("limit") || "50", 10);
  const limit = Math.min(Math.max(limitParam, 1), 500);
  const cursor = url.searchParams.get("cursor") || undefined;

  // 🔹 Case 1: Filter by userId (fast lookup in userlog:{userId})
  if (userId) {
    const logs = await env.KV.get(`userlog:${userId}`, { type: "json" as const });
    return json({ userId, logs: logs || [] });
  }

  // 🔹 Case 2: Filter by date (system logs that day)
  if (date) {
    const prefix = `log:${date}:`;
    const list = await env.KV.list({ prefix, limit, cursor });
    const logs = await Promise.all(
      list.keys.map(async (k) => env.KV.get(k.name, { type: "json" as const }))
    );
    return json({
      date,
      logs: logs.filter(Boolean),
      nextCursor: list.list_complete ? null : list.cursor || null,
    });
  }

  // 🔹 Case 3: No filter → return recent global logs
  const list = await env.KV.list({ prefix: "log:", limit, cursor });
  let logs = await Promise.all(
    list.keys.map(async (k) => env.KV.get(k.name, { type: "json" as const }))
  );
  logs = logs.filter(Boolean).sort((a: any, b: any) =>
    a.timestamp < b.timestamp ? 1 : -1
  );

  return json({
    logs,
    nextCursor: list.list_complete ? null : list.cursor || null,
  });
}
