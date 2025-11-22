import { Env } from "../../index";
import { jsonResponse } from "../../_lib/utils";

export async function listChatbots(req: Request, env: Env) {
  try {
    // IMPORTANT: search in chatbotconfig, not KV
    const list = await env.chatbotconfig.list({ prefix: "config:" });

    const items = [];
    for (const key of list.keys) {
      const raw = await env.chatbotconfig.get(key.name);
      if (!raw) continue;

      const record = JSON.parse(raw);

      items.push({
        id: record.chatbotId,
        businessName: record.businessName || "",
        updatedAt: record.updatedAt,
        createdAt: record.createdAt,
      });
    }

    return jsonResponse({ success: true, list: items }, 200);
  } catch (err: any) {
    console.error("[CHATBOT LIST ERROR]", err);
    return jsonResponse({ success: false, error: "List failed" }, 500);
  }
}
