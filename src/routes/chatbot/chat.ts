import { Env } from "../../index";

export const chatHandler = async (req: Request, env: Env): Promise<Response> => {
  try {
    const { chatbotId, sessionId, message } = await req.json();

    console.log("============== CHAT REQUEST ==============");
    console.log("chatbotId:", chatbotId);
    console.log("sessionId:", sessionId);
    console.log("userMessage:", message);

    if (!chatbotId || !message) {
      return Response.json(
        { success: false, error: "chatbotId and message required" },
        { status: 400 }
      );
    }

    // -------------------------------------------------------
    // 1. LOAD CHATBOT CONFIG
    // -------------------------------------------------------
    const raw = await env.chatbotconfig.get(`config:${chatbotId}`);
    console.log("📦 Loaded config raw:", raw);

    if (!raw) {
      return Response.json(
        { success: false, error: "Chatbot config not found" },
        { status: 404 }
      );
    }

    const config = JSON.parse(raw);
    console.log("📦 Parsed Config:", config);

    // Parse menu safely
    const menuLines = (config.quickMenu || "")
      .split("\n")
      .map((x: string) => x.replace(/^\d+\.\s*/, "").trim())
      .filter((x: string) => x.length > 0);

    console.log("📋 Parsed Menu Array:", menuLines);

    // -------------------------------------------------------
    // 2. LOAD CHAT HISTORY
    // -------------------------------------------------------
    const historyKey = `chat:${chatbotId}:${sessionId}`;
    const historyRaw = await env.CHAT_HISTORY_KV.get(historyKey);
    const history = historyRaw ? JSON.parse(historyRaw) : [];

    // -------------------------------------------------------
    // 3. CLOUDFLARE PROMPT
    // -------------------------------------------------------
    const prompt = `
You are an intent classifier. 
You MUST match the user's message to one of these EXACT admin menu items:

${menuLines.map((m) => "- " + m).join("\n")}

RULES:
- NEVER invent content.
- ONLY classify intent.
- If unclear → intent = "unknown".
- reply = "You selected: <intent>".

If unknown:
- reply = "${config.fallbackMessage || "Can you clarify?"}"

OUTPUT JSON ONLY:
{
  "intent": string,
  "reply": string,
  "confidence": "high" | "medium" | "low"
}

USER MESSAGE:
"${message}"

Respond ONLY JSON.
`.trim();

    console.log("🧠 CF PROMPT:", prompt);

    let result;

    try {
      result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", { prompt });
    } catch (err) {
      console.error("❌ Cloudflare AI Error:", err);
      return Response.json({ success: false, error: "AI model error" }, { status: 500 });
    }

    console.log("🤖 CLOUDFLARE RAW:", result);

    // -------------------------------------------------------
    // 4. PARSE AI JSON
    // -------------------------------------------------------
    let parsed = {
      intent: "unknown",
      reply: config.fallbackMessage || "Can you clarify?",
      confidence: "low",
    };

    try {
      parsed = JSON.parse(result.response.trim());
    } catch (err) {
      console.log("⚠ JSON Parse Fail → fallback");
    }

    console.log("✅ PARSED JSON:", parsed);

    // -------------------------------------------------------
    // 5. INTERNAL INTENT ROUTER (Enhanced with Voucher, Signup, Login)
    // -------------------------------------------------------
    const routeIntent = (intent: string, userMsg: string) => {
      const text = (intent + " " + userMsg).toLowerCase();

      const rules = [
        { category: "info", keywords: ["info", "business", "about", "介绍", "información"] },
        { category: "promotions", keywords: ["promo", "promotion", "discount", "优惠"] },
        { category: "products", keywords: ["product", "service", "menu", "卖什么"] },
        { category: "best_sellers", keywords: ["best seller", "bestseller", "畅销"] },
        { category: "location", keywords: ["location", "address", "哪里", "地點"] },
        { category: "opening_hours", keywords: ["opening", "hour", "营业"] },
        { category: "contact", keywords: ["whatsapp", "contact", "call", "联络"] },
        { category: "question", keywords: ["ask", "enquiry", "question", "query"] },

        // 🎫 NEW — Voucher
        { category: "voucher", keywords: ["voucher", "redeem", "claim", "优惠券", "兑换", "代金券"] },

        // 🧑‍💻 NEW — Signup
        { category: "signup", keywords: ["signup", "register", "sign up", "create account", "注册"] },

        // 🔐 NEW — Login
        { category: "login", keywords: ["login", "log in", "signin", "sign in", "登入", "登录"] },
      ];

      for (const rule of rules) {
        if (rule.keywords.some((k) => text.includes(k))) {
          return rule.category;
        }
      }
      return "unknown";
    };

    const category = routeIntent(parsed.intent, message);
    console.log("🔀 MAPPED CATEGORY:", category);

    // -------------------------------------------------------
    // 6. LOAD REPLY
    // -------------------------------------------------------
    let finalReply = config.fallbackMessage || "Can you clarify?";

    switch (category) {
      case "info":
        finalReply = `
${config.businessName || ""}
${config.brandTagline || ""}
${config.businessDescription || ""}
`.trim();
        break;

      case "promotions":
        finalReply = config.sellingPoints || "No promotions available.";
        break;

      case "products":
        finalReply = config.products || "We offer various products and services.";
        break;

      case "best_sellers":
        finalReply = config.bestSellers || "Here are our best sellers!";
        break;

      case "location":
        finalReply = config.location || "Location not provided.";
        break;

      case "opening_hours":
        finalReply = config.operatingHours || "Operating hours not set.";
        break;

      case "contact":
        finalReply = config.socialLinks || "No contact info provided.";
        break;

      case "question":
        finalReply = "Sure, what would you like to ask?";
        break;

      // 🎫 NEW — Voucher
      case "voucher":
        finalReply = config.voucherInfo || "We offer vouchers! Please check the promotions page.";
        break;

      // 🧑‍💻 NEW — Signup
      case "signup":
        finalReply = config.signupGuide || "To sign up, please follow our registration steps on the website.";
        break;

      // 🔐 NEW — Login
      case "login":
        finalReply = config.loginGuide || "You can log in from the main login page.";
        break;

      default:
        finalReply = config.fallbackMessage || "Can you clarify?";
    }

    // -------------------------------------------------------
    // 7. SAVE HISTORY
    // -------------------------------------------------------
    const newHistory = [
      ...history,
      { role: "user", content: message },
      { role: "assistant", content: finalReply },
    ].slice(-20);

    await env.CHAT_HISTORY_KV.put(historyKey, JSON.stringify(newHistory), {
      expirationTtl: 60 * 60 * 24 * 3,
    });

    console.log("💾 Saved history");

    // -------------------------------------------------------
    // 8. RETURN
    // -------------------------------------------------------
    return Response.json(
      {
        success: true,
        intent: parsed.intent,
        category,
        reply: finalReply,
        confidence: parsed.confidence,
      },
      { status: 200 }
    );

  } catch (err: any) {
    console.error("❌ CHAT HANDLER ERROR:", err);
    return Response.json(
      { success: false, error: err.message || "Internal error" },
      { status: 500 }
    );
  }
};
