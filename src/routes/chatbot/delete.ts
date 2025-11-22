import { Env } from "../../index";
import { jsonResponse } from "../../_lib/utils";

export async function deleteChatbot(req: Request, env: Env) {
  try {
    const url = new URL(req.url);
    const chatbotId = url.pathname.replace("/chatbot/delete/", "");

    const key = `config:${chatbotId}`;

    // Delete from KV
    await env.chatbotconfig.delete(key);

    console.log("[CHATBOT_DELETE] Removed:", key);

    return jsonResponse({ success: true, id: chatbotId }, 200);
  } catch (err: any) {
    console.error("[CHATBOT_DELETE_ERROR]", err);
    return jsonResponse(
      { success: false, error: "Failed to delete chatbot" },
      500
    );
  }
}
