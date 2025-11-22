// src/routes/chatbot/get.ts

export async function chatbotBusinessGetHandler(req: Request, env: Env): Promise<Response> {
  try {
    const businessId = req.url.split("/").pop();

    if (!businessId) {
      return Response.json({ success: false, error: "businessId missing" }, { status: 400 });
    }

    const result = await env.chatbotconfig.get(`business:${businessId}`);

    if (!result) {
      return Response.json({ success: false, error: "Business not found" }, { status: 404 });
    }

    return Response.json({ success: true, data: JSON.parse(result) });
  } catch (err) {
    console.error("❌ chatbotBusinessGetHandler error:", err);
    return Response.json({ success: false, error: String(err) }, { status: 500 });
  }
}
