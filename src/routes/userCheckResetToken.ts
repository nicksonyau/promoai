import { Env } from "../index";

export async function userCheckResetTokenHandler(req: Request, env: Env) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return json({ valid: false, error: "Missing token" }, 400);

  const email = await env.KV.get(`reset:${token}`);
  if (!email) return json({ valid: false, error: "Invalid or expired token" }, 404);

  return json({ valid: true });
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
