export type ChannelType = "unofficial" | "official";

export type ChannelRef = {
  channelId: string;
  type: ChannelType;
  label: string;
  score?: number; // 0-100
};

export type AudienceRuleOp = "eq" | "neq" | "in" | "contains" | "gte" | "lte";

export type AudienceRule = {
  field: string; // e.g. "country", "lastSeenAt", "tags"
  op: AudienceRuleOp;
  value: string | number | string[];
};

export type AudienceQuery =
  | { mode: "all" }
  | { mode: "groups"; groupIds: string[] }
  | { mode: "tags"; tags: string[] }
  | { mode: "filter"; rules: AudienceRule[] };

export type TemplatePick = {
  templateId: string;
  name?: string;
  weight?: number; // optional rotation weight
};

export type AttachmentKind = "image" | "video" | "document";

export type Attachment = {
  id: string;
  kind: AttachmentKind;
  url?: string; // present if uploaded
  name: string;
  sizeBytes?: number;
  mime?: string;
  localFile?: File; // safe client-only fallback
};

export type BroadcastSpeed = "slow" | "normal" | "fast";

export type BroadcastHours =
  | "24_7"
  | { startHHmm: string; endHHmm: string };

export type BroadcastSettings = {
  speed: BroadcastSpeed;
  broadcastHours: BroadcastHours;
  simulateHuman: boolean;
  stopIfReply: boolean;

  dailyLimit: number; // derived from channel score (server must enforce)
};

export type BroadcastDraft = {
  name: string;

  channel?: ChannelRef;

  audience: AudienceQuery;
  audienceCount?: number;

  // templates are optional; you can also use custom message only
  templates: TemplatePick[];

  message: string;
  attachments: Attachment[];

  scheduleAt: string | null;

  settings: BroadcastSettings;
};

export type BroadcastStep = 1 | 2 | 3 | 4;
