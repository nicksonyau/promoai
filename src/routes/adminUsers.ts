import { Env } from "../index";

export async function adminUsersHandler(_req: Request, env: Env): Promise<Response> {
  const list = await env.KV.list({ prefix: "user:" });
  const users: any[] = [];
  for (const k of list.keys) {
    const v = await env.KV.get(k.name);
    if (v) users.push(JSON.parse(v));
  }
  return new Response(JSON.stringify({ users }), {
    headers: { "Content-Type": "application/json" },
  });
}
