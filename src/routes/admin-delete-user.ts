import { Env } from "../index";

export async function adminDeleteUserHandler(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const email = url.searchParams.get("email");

  if (!email) return json({ error: "Email required" }, 400);

  await env.KV.delete(`user:${email}`);

  return json({ success: true, message: `User deleted: ${email}` });
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
