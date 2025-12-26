// app/[lang]/dashboard/inbox/_components/ConversationList.tsx
"use client";

import { useMemo } from "react";
import { Loader2, MessageCircle, Search, X } from "lucide-react";
import type { InboxConversation } from "../_lib/inboxTypes";
import { fmtTime, normalizeTag } from "../_lib/inboxApi";

export default function ConversationList({
  conversations,
  loading,
  activeKey,
  onSelect,
  search,
  onSearch,
}: {
  conversations: InboxConversation[];
  loading: boolean;
  activeKey: string | null;
  onSelect: (key: string) => void;
  search: string;
  onSearch: (v: string) => void;
}) {
  const rows = useMemo(() => {
    return conversations || [];
  }, [conversations]);

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-4">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/70 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search name / phone / text..."
            className="w-full bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400"
          />
          {search && (
            <button
              onClick={() => onSearch("")}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto">
        {loading && (
          <div className="px-4 pb-4 text-sm text-gray-500 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading conversations…
          </div>
        )}

        {!loading && rows.length === 0 && (
          <div className="px-6 py-10 text-center text-sm text-gray-500">
            <MessageCircle className="w-10 h-10 mx-auto text-gray-200 mb-3" />
            No conversations yet.
          </div>
        )}

        {!loading &&
          rows.map((c) => {
            const isActive = c.convKey === activeKey;
            const title = c.contactName || c.contactPhone || c.convKey;
            const preview = c.lastMessageText || "—";
            const ts = c.lastMessageAt ? fmtTime(c.lastMessageAt) : "";
            const unread = typeof c.unreadCount === "number" ? c.unreadCount : 0;

            return (
              <button
                key={c.convKey}
                onClick={() => onSelect(c.convKey)}
                className={[
                  "w-full text-left px-4 py-3",
                  "hover:bg-slate-50",
                  "transition-colors",
                  isActive ? "bg-purple-50/70" : "bg-white",
                ].join(" ")}
                type="button"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {title}
                    </div>
                    <div className="text-xs text-gray-500 truncate mt-0.5">
                      {preview}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="text-[11px] text-gray-400">{ts}</div>
                    {unread > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-purple-600 text-white text-[11px]">
                        {unread}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200/70">
                    {(c.channel || "whatsapp").toUpperCase()}
                  </span>

                  <span
                    className={[
                      "text-[11px] px-2 py-0.5 rounded-full border",
                      (c.status || "open") === "open"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-600",
                    ].join(" ")}
                  >
                    {(c.status || "open").toUpperCase()}
                  </span>

                  {(c.tags || []).slice(0, 2).map((t) => (
                    <span
                      key={`${c.convKey}_${t}`}
                      className="text-[11px] px-2 py-0.5 rounded-full border border-slate-200/70 bg-white text-slate-600"
                    >
                      #{normalizeTag(t)}
                    </span>
                  ))}

                  {(c.tags || []).length > 2 && (
                    <span className="text-[11px] text-gray-400">
                      +{(c.tags || []).length - 2}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
      </div>
    </div>
  );
}
