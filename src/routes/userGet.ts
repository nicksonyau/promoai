import { Env } from "../index";

export async function userGetHandler(req: Request, env: Env) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email");
  if (!email) return json({ error: "Missing email" }, 400);

  const data = await env.KV.get(`user:${email}`);
  if (!data) return json({ error: "User not found" }, 404);

  const user = JSON.parse(data);
  delete user.passwordHash;
  return json({ user });
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
