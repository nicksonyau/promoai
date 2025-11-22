import { Env } from "../../index";
import { jsonResponse } from "../../_lib/utils";

export async function configUpdateHandler(req: Request, env: Env) {
  try {
    const url = new URL(req.url);
    const chatbotId = url.pathname.replace("/chatbot/configUpdate/", "");

    const key = `config:${chatbotId}`; // consistent with create

    // Load existing
    const existingRaw = await env.chatbotconfig.get(key);
    if (!existingRaw) {
      console.error("[CHATBOT_CONFIG_UPDATE] Not found:", key);
      return jsonResponse({ success: false, error: "Not found" }, 404);
    }

    const existing = JSON.parse(existingRaw);
    const updateData = await req.json();

    // Normalize quickMenu (one item per line)
    let quickMenu = updateData.quickMenu ?? existing.quickMenu ?? "";
    quickMenu = quickMenu
      .split("\n")
      .map((x: string) => x.trim())
      .filter((x: string) => x.length > 0)
      .join("\n");

    // Provide fallback if empty
    if (!quickMenu) {
      quickMenu = `View promotions
Check products/services
Opening hours
Location
WhatsApp contact
Make an enquiry
Best sellers
Ask a question`;
    }

    const updated = {
      ...existing,
      ...updateData,
      quickMenu,
      updatedAt: Date.now(),
    };

    await env.chatbotconfig.put(key, JSON.stringify(updated));

    console.log("[CHATBOT_CONFIG_UPDATE] Updated KV:", { key, chatbotId });

    return jsonResponse({ success: true, id: chatbotId }, 200);
  } catch (err: any) {
    console.error("[CHATBOT_CONFIG_UPDATE] Error:", err);
    return jsonResponse({ success: false, error: "Update failed" }, 500);
  }
}
