import { Env } from "../../index";
import { jsonResponse } from "../../_lib/utils";

// ==============================
// CREATE CHATBOT
// ==============================
export async function configCreateHandler(req: Request, env: Env) {
  try {
    const body = await req.json();
    const chatbotId = crypto.randomUUID();

    // --- Normalize Quick Menu (one per line)
    let quickMenu = body.quickMenu || "";
    quickMenu = quickMenu
      .split("\n")
      .map((x: string) => x.trim())
      .filter((x: string) => x.length > 0)
      .join("\n");

    // Fallback if user deletes every line
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

    const record = {
      ...body,
      quickMenu, // <— ensure normalized value is saved
      chatbotId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const key = `config:${chatbotId}`;

    // 🎯 Save chatbot config
    await env.chatbotconfig.put(key, JSON.stringify(record));

    // 🎯 DEBUG LOG
    console.log("[CHATBOT_CONFIG_CREATE] Saved chatbot to KV:", {
      key,
      record,
    });

    return jsonResponse({ success: true, id: chatbotId }, 200);
  } catch (err: any) {
    console.error("[CHATBOT_CONFIG_CREATE] Error:", err);
    return jsonResponse(
      { success: false, error: err.message },
      500
    );
  }
}
