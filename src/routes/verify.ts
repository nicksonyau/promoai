/**
 * verify.ts — Final correct version (with user.status = "active")
 * - Includes full debug logs
 * - Every error returns: success, code, error, details
 * - 404 triggers proper structured output
 */

import { Env } from "../index";

export async function verifyHandler(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const now = new Date().toISOString();
  const attemptId = crypto.randomUUID();

  console.log("[VERIFY] Incoming", {
    attemptId,
    token,
    path: req.url,
    ts: now,
  });

  async function writeLog(entry: Record<string, any>) {
    try {
      const key = `log:verify:${Date.now()}:${attemptId}`;
      await env.KV.put(key, JSON.stringify(entry), {
        expirationTtl: 60 * 60 * 24 * 7, // 7 days
      });
    } catch (e) {
      console.error("[VERIFY][LOG] Failed to write KV log:", e);
    }
  }

  try {
    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for") ||
      req.headers.get("remote_addr") ||
      null;

    console.log("[VERIFY] Client IP:", ip);

    const baseLog = {
      attemptId,
      ts: now,
      ip,
      token,
      tokenPresent: !!token,
    };

    // -------------------------------------------------------------
    // ❌ Missing token
    // -------------------------------------------------------------
    if (!token) {
      console.log("[VERIFY] Missing token in URL");

      const entry = { ...baseLog, success: false, reason: "missing_token" };
      await writeLog(entry);

      return jsonResponse(
        {
          success: false,
          code: "MISSING_TOKEN",
          error: "Invalid verification link (missing token).",
          details: { tokenPresent: false },
        },
        400
      );
    }

    // -------------------------------------------------------------
    // 🔍 Lookup token → email
    // -------------------------------------------------------------
    console.log("[VERIFY] Looking up token:", token);

    const email = await env.KV.get(`verify:${token}`);
    if (!email) {
      console.log("[VERIFY] Token expired or invalid:", token);

      const entry = { ...baseLog, success: false, reason: "token_not_found" };
      await writeLog(entry);

      return jsonResponse(
        {
          success: false,
          code: "TOKEN_EXPIRED",
          error: "Verification link invalid or expired.",
          details: { token },
        },
        400
      );
    }

    console.log("[VERIFY] Token resolved to email:", email);

    // -------------------------------------------------------------
    // 🔍 Load user
    // -------------------------------------------------------------
    const userKey = `user:${email}`;
    const userRaw = await env.KV.get(userKey);

    if (!userRaw) {
      console.log("[VERIFY] User not found:", email);

      const entry = { ...baseLog, success: false, reason: "user_not_found", email };
      await writeLog(entry);

      return jsonResponse(
        {
          success: false,
          code: "USER_NOT_FOUND",
          error: "Account not found for this verification link.",
          details: { email },
        },
        404
      );
    }

    console.log("[VERIFY] Raw user KV:", userRaw);

    // -------------------------------------------------------------
    // 🔍 Parse user JSON
    // -------------------------------------------------------------
    let user;
    try {
      user = JSON.parse(userRaw);
    } catch (err) {
      console.log("[VERIFY] Failed to parse user JSON:", err);

      const entry = { ...baseLog, success: false, reason: "corrupted_user_record", email };
      await writeLog(entry);

      return jsonResponse(
        {
          success: false,
          code: "CORRUPTED_USER_RECORD",
          error: "Corrupted user record.",
          details: { email },
        },
        500
      );
    }

    console.log("[VERIFY] User object:", user);

    // -------------------------------------------------------------
    // ✔ Already verified
    // -------------------------------------------------------------
    if (user.verified) {
      console.log("[VERIFY] Already verified:", {
        email,
        verifiedAt: user.verifiedAt,
      });

      const entry = {
        ...baseLog,
        success: true,
        reason: "already_verified",
        email,
        userId: user.id,
      };
      await writeLog(entry);

      return jsonResponse(
        {
          success: true,
          code: "ALREADY_VERIFIED",
          message: "Email already verified.",
          details: { email, verifiedAt: user.verifiedAt },
        },
        200
      );
    }

    // -------------------------------------------------------------
    // 🎉 Verify Now — UPDATE USER STATUS HERE
    // -------------------------------------------------------------
    console.log("[VERIFY] Marking user verified:", email);

    user.verified = true;
    user.verifiedAt = now;
    user.status = "active"; // <-- IMPORTANT: activate account after verification

    await env.KV.put(userKey, JSON.stringify(user));
    await env.KV.delete(`verify:${token}`);

    const entry = {
      ...baseLog,
      success: true,
      reason: "verified",
      email,
      userId: user.id,
    };
    await writeLog(entry);

    console.log("[VERIFY] Verification complete:", user.id);

    return jsonResponse(
      {
        success: true,
        code: "VERIFIED",
        message: "Email verified successfully.",
        details: { email, userId: user.id },
      },
      200
    );
  } catch (err: any) {
    console.error("[VERIFY][EXCEPTION]", err);

    await writeLog({
      ts: now,
      success: false,
      reason: "exception",
      error: err?.message || String(err),
    });

    return jsonResponse(
      {
        success: false,
        code: "SERVER_EXCEPTION",
        error: "Server error during verification.",
        details: { message: err?.message },
      },
      500
    );
  }
}

function jsonResponse(obj: any, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
