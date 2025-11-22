import { Env } from "../../index";
import { jsonResponse } from "../../_lib/utils";

export async function configGetHandler(req: Request, env: Env) {
  try {
    const url = new URL(req.url);
    const chatbotId = url.pathname.replace("/chatbot/configGet/", "");

    const raw = await env.chatbotconfig.get(`config:${chatbotId}`);
    if (!raw)
      return jsonResponse({ success: false, error: "Not found" }, 404);

    return jsonResponse({ success: true, data: JSON.parse(raw) }, 200);
  } catch (err: any) {
    return jsonResponse(
      { success: false, error: "Failed to get" },
      500
    );
  }
}
