// src/routes/chatbot/update.ts

export async function chatbotBusinessUpdateHandler(req: Request, env: Env): Promise<Response> {
  try {
    const businessId = req.url.split("/").pop();
    if (!businessId) {
      return Response.json({ success: false, error: "businessId missing" }, { status: 400 });
    }

    const payload = await req.json();
    const stored = await env.chatbotconfig.get(`business:${businessId}`);

    if (!stored) {
      return Response.json({ success: false, error: "Business not found" }, { status: 404 });
    }

    const data = JSON.parse(stored);

    const merged = {
      ...data,
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    await env.chatbotconfig.put(`business:${businessId}`, JSON.stringify(merged));

    return Response.json({ success: true, data: merged });
  } catch (err) {
    console.error("❌ chatbotBusinessUpdateHandler error:", err);
    return Response.json({ success: false, error: String(err) }, { status: 500 });
  }
}
