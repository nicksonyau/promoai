// src/routes/chatbot/create.ts

export async function chatbotBusinessCreateHandler(req: Request, env: Env): Promise<Response> {
  try {
    const { businessId, welcomeMessage, tone, aiModel } = await req.json();

    if (!businessId) {
      return Response.json({ success: false, error: "businessId required" }, { status: 400 });
    }

    const data = {
      businessId,
      welcomeMessage: welcomeMessage || "👋 Hi! How can I help you?",
      tone: tone || "friendly",
      aiModel: aiModel || "gpt-4.1-mini",
      updatedAt: new Date().toISOString(),
    };

    await env.chatbotconfig.put(`business:${businessId}`, JSON.stringify(data));

    return Response.json({ success: true, data });
  } catch (err) {
    console.error("❌ chatbotBusinessCreateHandler error:", err);
    return Response.json({ success: false, error: String(err) }, { status: 500 });
  }
}
