// app/[lang]/dashboard/inbox/_components/ThreadPanel.tsx
"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  Check,
  CheckCheck,
  Loader2,
  MessageCircle,
  Send,
} from "lucide-react";
import type {
  InboxConversation,
  InboxMessage,
  MessageStatus,
} from "../_lib/inboxTypes";
import { fmtDayLabel, fmtTime } from "../_lib/inboxApi";

export default function ThreadPanel({
  activeKey,
  activeConv,
  loading,
  draft,
  onDraft,
  sending,
  onSend,
}: {
  activeKey: string | null;
  activeConv: InboxConversation | null;
  loading: boolean;
  draft: string;
  onDraft: (v: string) => void;
  sending: boolean;
  onSend: () => void | Promise<void>;
}) {
  const threadRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const grouped = useMemo(() => {
    const msgs = activeConv?.messages || [];
    const groups: Array<
      | { kind: "divider"; key: string; label: string }
      | { kind: "msg"; key: string; msg: InboxMessage }
    > = [];

    let lastDay = "";
    for (const m of msgs) {
      const day = fmtDayLabel(m.ts);
      if (day && day !== lastDay) {
        groups.push({ kind: "divider", key: `d_${day}_${m.id}`, label: day });
        lastDay = day;
      }
      groups.push({ kind: "msg", key: `m_${m.id}`, msg: m });
    }
    return groups;
  }, [activeConv?.messages]);

  // Auto-scroll when switching conversations
  useEffect(() => {
    if (!activeKey) return;
    queueMicrotask(() => {
      bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
    });
  }, [activeKey]);

  const title = activeConv
    ? activeConv.contactName || activeConv.contactPhone || "Conversation"
    : "Select a conversation";

  const subtitle = activeConv ? activeConv.contactPhone || "—" : "—";

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 flex items-start justify-between">
        <div className="min-w-0">
          <div className="font-semibold text-gray-900 truncate">{title}</div>
          <div className="text-xs text-gray-500 mt-0.5 truncate">
            {subtitle}
          </div>
        </div>

        {loading && (
          <div className="text-xs text-gray-500 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading…
          </div>
        )}
      </div>

      {/* Thread */}
      <div
        ref={threadRef}
        className="flex-1 overflow-auto bg-slate-50 px-6 py-4"
      >
        {!activeKey && (
          <div className="text-center text-sm text-gray-500 py-16">
            <MessageCircle className="w-12 h-12 mx-auto text-gray-200 mb-3" />
            Select a conversation to start messaging.
          </div>
        )}

        {activeKey && activeConv && (activeConv.messages || []).length === 0 && (
          <div className="text-center text-sm text-gray-500 py-16">
            No messages yet.
          </div>
        )}

        {activeKey &&
          activeConv &&
          grouped.map((g) => {
            if (g.kind === "divider") {
              return (
                <div key={g.key} className="flex justify-center my-4">
                  <span className="text-[11px] px-3 py-1 rounded-full bg-white border border-slate-200/70 text-gray-500">
                    {g.label}
                  </span>
                </div>
              );
            }

            const m = g.msg;
            const isOut = m.direction === "out";

            return (
              <div
                key={g.key}
                className={[
                  "flex mb-2",
                  isOut ? "justify-end" : "justify-start",
                ].join(" ")}
              >
                <div
                  className={[
                    "max-w-[82%] rounded-2xl px-4 py-2 text-sm",
                    "shadow-sm",
                    isOut
                      ? "bg-purple-600 text-white"
                      : "bg-white text-gray-900",
                  ].join(" ")}
                >
                  <div className="whitespace-pre-wrap break-words">
                    {m.text || <span className="opacity-70">(empty)</span>}
                  </div>

                  <div
                    className={[
                      "mt-1 flex items-center justify-end gap-1 text-[11px]",
                      isOut ? "text-purple-100" : "text-gray-400",
                    ].join(" ")}
                  >
                    <span>{fmtTime(m.ts)}</span>
                    {isOut && <StatusIcon status={m.status} />}
                  </div>
                </div>
              </div>
            );
          })}

        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="p-4 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => onDraft(e.target.value)}
            placeholder={
              activeKey ? "Type a message…" : "Select a conversation to reply…"
            }
            disabled={!activeKey || sending}
            className="flex-1 resize-none min-h-[44px] max-h-[140px] px-3 py-2 rounded-xl border border-slate-200/70 outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 text-sm disabled:bg-slate-50"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void onSend();
              }
            }}
          />
          <button
            onClick={() => onSend()}
            disabled={!activeKey || sending || !draft.trim()}
            className="inline-flex items-center justify-center gap-2 px-4 h-[44px] rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-40 text-sm font-medium"
            type="button"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send
              </>
            )}
          </button>
        </div>

        <div className="mt-2 text-[11px] text-gray-400 flex items-center justify-between">
          <div>Enter to send • Shift+Enter for new line</div>
          {activeConv?.status === "closed" && (
            <div className="text-gray-500">Conversation is closed</div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status?: MessageStatus }) {
  if (!status || status === "queued") return <span className="opacity-80">•</span>;
  if (status === "failed") return <span className="opacity-90">!</span>;
  if (status === "sent") return <Check className="w-3.5 h-3.5" />;
  if (status === "delivered") return <CheckCheck className="w-3.5 h-3.5" />;
  if (status === "read") return <CheckCheck className="w-3.5 h-3.5" />;
  return <span className="opacity-80">•</span>;
}
