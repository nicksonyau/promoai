import type { Env } from "../index";

export async function logEvent(
  env: Env,
  action: "register" | "login_success" | "login_failed" | string,
  userId: string | null,
  email: string | null,
  ip: string | null
) {
  const logId = crypto.randomUUID();
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const entry = {
    timestamp: new Date().toISOString(),
    action,
    userId,
    email,
    ip,
  };

  await env.KV.put(`log:${date}:${logId}`, JSON.stringify(entry));

  // 🔹 Per-user log list (only if we have a userId)
  if (userId) {
    const key = `userlog:${userId}`;
    let logs: any[] = [];
    try {
      const current = await env.KV.get(key, { type: "json" as const });
      if (Array.isArray(current)) logs = current;
    } catch {
      // ignore
    }
    logs.push(entry);

    // cap at last 500
    if (logs.length > 500) logs = logs.slice(logs.length - 500);
    await env.KV.put(key, JSON.stringify(logs));
  }
  
}
