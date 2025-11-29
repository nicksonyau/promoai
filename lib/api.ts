// lib/api.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

export async function apiFetch(input: string, init: RequestInit = {}) {
  const isBrowser = typeof window !== "undefined";
  let token: string | null = null;

  try {
    if (isBrowser) token = localStorage.getItem("sessionToken");
  } catch (err) {
    console.warn("[apiFetch] Cannot read sessionToken", err);
  }

  // ----------------------------
  // Build headers safely
  // ----------------------------
  const headers = new Headers();

  if (init.headers) {
    new Headers(init.headers).forEach((value, key) => {
      headers.set(key, value);
    });
  }

  // ✅ DO NOT SET JSON HEADER IF BODY IS FormData
  if (!(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // ----------------------------
  // Construct URL safely
  // ----------------------------
  const base = API_URL.replace(/\/$/, "");
  const path = input.replace(/^\//, "");
  const url = `${base}/${path}`;

  console.log("[apiFetch] →", {
    url,
    method: init.method || "GET",
    hasBody: !!init.body,
    headers: Object.fromEntries(headers.entries()),
  });

  // ----------------------------
  // Execute request
  // ----------------------------
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers,
    });
  } catch (err) {
    console.error("[apiFetch] Network failure:", err);
    throw new Error("Network request failed");
  }

  console.log("[apiFetch] ←", {
    status: response.status,
    ok: response.ok,
    url: response.url,
  });

  // ----------------------------
  // Auto logout on 401
  // ----------------------------
  if (response.status === 401 && isBrowser) {
    try {
      localStorage.removeItem("sessionToken");
    } catch {}
    if (!window.location.pathname.includes("/login")) {
      window.location.href = "/login";
    }
  }

  // ----------------------------
  // Surface errors for debuggability
  // ----------------------------
  if (!response.ok) {
    let body = "";
    try {
      body = await response.clone().text();
    } catch {}

    console.error("[apiFetch] API Error:", {
      status: response.status,
      body,
    });
  }

  return response;
}
