import { loginHandler } from "./routes/login";
import { registerHandler } from "./routes/register";
import { adminUsersHandler } from "./routes/adminUsers";
import { logsHandler } from "./routes/logs";
import { userLogsHandler } from "./routes/userLogs";
import { uploadTemplateHandler } from "./routes/fnbTemplateUpload";
import { listTemplatesHandler } from "./routes/fnbTemplatesList";
import { updateTemplateHandler } from "./routes/fnbTemplateUpdate";
import { getTemplateHandler } from "./routes/fnbTemplateGet";
import { deleteTemplateHandler } from "./routes/fnbTemplateDelete";


export interface Env {
  KV: KVNamespace;
}

const CORS_HEADERS: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS,DELETE,PUT",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function withCors(res: Response) {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v as string);
  return new Response(res.body, { status: res.status, headers });
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // ✅ Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(req.url);
    const path = url.pathname;
    console.log(`[API] ${req.method} ${path}`);

    try {
      if (path === "/register" && req.method === "POST") {
        return withCors(await registerHandler(req, env));
      }
      if (path === "/login" && req.method === "POST") {
        return withCors(await loginHandler(req, env));
      }
      if (path === "/admin/users" && req.method === "GET") {
        return withCors(await adminUsersHandler(req, env));
      }
      if (path === "/logs" && req.method === "GET") {
        return withCors(await logsHandler(req, env));
      }
      if (path === "/user/logs" && req.method === "GET") {
        return withCors(await userLogsHandler(req, env));
      }
      if (path === "/template/upload" && req.method === "POST") {
        return withCors(await uploadTemplateHandler(req, env));
      }
      if (path === "/templates" && req.method === "GET") {
        return withCors(await listTemplatesHandler(req, env));
      }
      if (path.startsWith("/template/update/") && req.method === "POST") {
        return withCors(await updateTemplateHandler(req, env));
      }
      if (path.startsWith("/template/") && req.method === "GET" && !path.includes("/update/")) {
      return withCors(await getTemplateHandler(req, env));
      }
      if (path.startsWith("/template/delete/") && req.method === "DELETE") {
        return withCors(await deleteTemplateHandler(req, env));
      } 

      // ❌ FIX: always return JSON for unknown routes
      return withCors(
        new Response(JSON.stringify({ error: "Not Found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        })
      );
    } catch (e: any) {
      return withCors(
        new Response(JSON.stringify({ error: e?.message || "Server error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      );
    }
  },
};
