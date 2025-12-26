export type MessageDirection = "in" | "out";
export type MessageStatus = "queued" | "sent" | "delivered" | "read" | "failed";

export type InboxMessage = {
  id: string;
  direction: MessageDirection;
  text: string;
  ts: string; // ISO
  status?: MessageStatus;
  meta?: any;
};

export type InboxConversation = {
  convKey: string;
  channel?: string;
  contactName?: string;
  contactPhone?: string;
  tags?: string[];
  assignedTo?: string | null;
  status?: "open" | "closed";
  unreadCount?: number;
  lastMessageText?: string;
  lastMessageAt?: string;
  messages?: InboxMessage[];
  meta?: any;
};

export type ApiOk<T> = { success: true } & T;
export type ApiErr = { success?: false; error?: string; code?: string };
