import type { InboxConversation, InboxMessage } from "./inboxTypes";

function toISO(v: any): string | undefined {
  if (!v) return undefined;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function newId(prefix = "tmp") {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function normalizeTag(t: any) {
  return String(t || "").trim().toLowerCase();
}

export function coerceMessage(raw: any): InboxMessage | null {
  if (!raw || typeof raw !== "object") return null;

  const id = String(raw.id ?? raw.msgId ?? raw.messageId ?? raw.ts ?? "").trim() || newId("msg");
  const text = String(raw.text ?? raw.body ?? raw.message ?? "").trim();
  const dirRaw = String(raw.direction ?? raw.dir ?? raw.from ?? "").toLowerCase();

  const direction = dirRaw === "out" || dirRaw === "operator" || dirRaw === "bot" ? "out" : "in";
  const ts = toISO(raw.ts ?? raw.createdAt ?? raw.time ?? Date.now()) || new Date().toISOString();

  const statusRaw = String(raw.status ?? "").toLowerCase();
  const status =
    statusRaw === "queued" ||
    statusRaw === "sent" ||
    statusRaw === "delivered" ||
    statusRaw === "read" ||
    statusRaw === "failed"
      ? (statusRaw as any)
      : undefined;

  return { id, direction, text, ts, status, meta: raw.meta ?? undefined };
}

export function coerceConversation(raw: any): InboxConversation | null {
  if (!raw || typeof raw !== "object") return null;

  const convKey = String(raw.convKey ?? raw.key ?? raw.id ?? raw.conversationId ?? "").trim();
  if (!convKey) return null;

  const contactPhone = String(raw.contactPhone ?? raw.phone ?? raw.msisdn ?? "").trim() || undefined;
  const contactName = String(raw.contactName ?? raw.name ?? raw.displayName ?? "").trim() || undefined;

  const tags = Array.isArray(raw.tags) ? raw.tags.map(normalizeTag).filter(Boolean) : [];
  const status = String(raw.status ?? "open").toLowerCase() === "closed" ? "closed" : "open";

  const unreadCount =
    typeof raw.unreadCount === "number" ? raw.unreadCount : typeof raw.unread === "number" ? raw.unread : 0;

  const lastMessageText = String(raw.lastMessageText ?? raw.lastText ?? raw.preview ?? "").trim() || undefined;
  const lastMessageAt =
    toISO(raw.lastMessageAt) || toISO(raw.lastAt) || toISO(raw.updatedAt) || toISO(raw.createdAt) || undefined;

  const channel = String(raw.channel ?? raw.platform ?? "whatsapp").toLowerCase();

  const assignedTo = raw.assignedTo === undefined || raw.assignedTo === null ? null : String(raw.assignedTo);

  let messages: InboxMessage[] | undefined;
  if (Array.isArray(raw.messages)) {
    messages = raw.messages.map(coerceMessage).filter(Boolean) as InboxMessage[];
  }

  return {
    convKey,
    channel,
    contactName,
    contactPhone,
    tags,
    assignedTo,
    status,
    unreadCount,
    lastMessageText,
    lastMessageAt,
    messages,
    meta: raw.meta ?? undefined,
  };
}

export function mergeMessages(existing: InboxMessage[], incoming: InboxMessage[]) {
  const map = new Map<string, InboxMessage>();
  for (const m of existing) map.set(m.id, m);
  for (const m of incoming) map.set(m.id, m);
  const out = Array.from(map.values());
  out.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
  return out;
}

export function fmtTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function fmtDayLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const same =
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  if (same) return "Today";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
