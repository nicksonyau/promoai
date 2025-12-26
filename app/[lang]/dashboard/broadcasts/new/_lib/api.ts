type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; status: number; message: string };

export type ApiResult<T> = ApiOk<T> | ApiErr;

async function safeParseBody(res: Response): Promise<{ json: any | null; text: string | null }> {
  // Clone so reading body here doesn't block other readers (future-proof)
  const clone = res.clone();

  // Try JSON first
  try {
    const json = await clone.json();
    return { json, text: null };
  } catch {
    // Fallback to text (may contain useful error message)
    try {
      const text = await clone.text();
      return { json: null, text: text || null };
    } catch {
      return { json: null, text: null };
    }
  }
}

function pickErrorMessage(res: Response, parsed: { json: any | null; text: string | null }) {
  const j = parsed.json;
  if (j && typeof j === "object") {
    const m =
      (j as any).error ||
      (j as any).message ||
      (j as any).detail ||
      (j as any).msg;
    if (typeof m === "string" && m.trim()) return m.trim();
  }

  if (parsed.text && parsed.text.trim()) return parsed.text.trim();
  return res.statusText || "Request failed";
}

export async function postJSON<T>(url: string, body: any): Promise<ApiResult<T>> {
  let payload: string;

  try {
    payload = JSON.stringify(body ?? {});
  } catch (e: any) {
    return {
      ok: false,
      status: 0,
      message: e?.message || "Invalid request body",
    };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      credentials: "include", // ✅ important for auth/session
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: payload,
    });

    // 204 No Content
    if (res.status === 204) {
      return { ok: true, data: {} as T };
    }

    const parsed = await safeParseBody(res);

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        message: pickErrorMessage(res, parsed),
      };
    }

    return { ok: true, data: (parsed.json ?? {}) as T };
  } catch (e: any) {
    return {
      ok: false,
      status: 0,
      message: e?.message || "Network error",
    };
  }
}
