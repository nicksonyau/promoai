// app/[lang]/dashboard/inbox/_components/ContextPanel.tsx
"use client";

import { Tag, User } from "lucide-react";
import type { InboxConversation } from "../_lib/inboxTypes";
import { fmtDayLabel, fmtTime, normalizeTag } from "../_lib/inboxApi";

export default function ContextPanel({ conv }: { conv: InboxConversation | null }) {
  const tags = (conv?.tags || []).map(normalizeTag).filter(Boolean);

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4">
        <div className="font-semibold text-gray-900">Context</div>
        <div className="text-xs text-gray-500 mt-0.5">Contact + tags</div>
      </div>

      {!conv ? (
        <div className="px-6 py-8 text-sm text-gray-500">
          Select a conversation to view context.
        </div>
      ) : (
        <div className="px-6 pb-6 space-y-6">
          {/* Contact */}
          <div className="space-y-2">
            <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
              Contact
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-700">
                <User className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {conv.contactName || "Unknown"}
                </div>
                <div className="text-sm text-gray-700">
                  {conv.contactPhone || "—"}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {String(conv.channel || "whatsapp").toUpperCase()} •{" "}
                  {(conv.status || "open").toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Tags
            </div>

            {tags.length === 0 ? (
              <div className="text-sm text-gray-500">No tags</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.slice(0, 12).map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-full text-xs bg-slate-50 text-slate-700 border border-slate-200/70"
                  >
                    {t}
                  </span>
                ))}
                {tags.length > 12 && (
                  <span className="text-xs text-gray-400">
                    +{tags.length - 12}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Conversation meta */}
          <div className="space-y-2">
            <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
              Conversation
            </div>

            <div className="text-sm text-gray-700 space-y-1">
              <div>
                <span className="text-gray-500">Unread:</span>{" "}
                {typeof conv.unreadCount === "number" ? conv.unreadCount : 0}
              </div>

              <div>
                <span className="text-gray-500">Last:</span>{" "}
                {conv.lastMessageAt ? fmtDayLabel(conv.lastMessageAt) : "—"}
                {conv.lastMessageAt ? ` @ ${fmtTime(conv.lastMessageAt)}` : ""}
              </div>

              <div className="pt-1">
                <div className="text-xs text-gray-500">Key</div>
                <div className="font-mono text-[12px] text-gray-600 break-all">
                  {conv.convKey}
                </div>
              </div>
            </div>
          </div>

          {/* v1 placeholder */}
          <div className="pt-4">
            <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
              Actions (next)
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Assign / Close / Notes will be enabled after backend update endpoints are ready.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
