"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { ApiErr, ApiOk, InboxConversation, InboxMessage } from "./inboxTypes";
import { coerceConversation, coerceMessage, mergeMessages } from "./inboxApi";

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

const API = {
  list: () => `/inbox/list`,
  get: (convKey: string) => `/inbox/get?convKey=${encodeURIComponent(convKey)}`,
  send: () => `/inbox/send`,
};

export function useInbox() {
  const [conversations, setConversations] = useState<InboxConversation[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [activeConv, setActiveConv] = useState<InboxConversation | null>(null);
  const [loadingConv, setLoadingConv] = useState(false);
  const [convError, setConvError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const pollRef = useRef<number | null>(null);
  const inflightGetRef = useRef<AbortController | null>(null);

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;

    return conversations.filter((c) => {
      const hay = `${c.contactName || ""} ${c.contactPhone || ""} ${c.lastMessageText || ""} ${(c.tags || []).join(" ")}`;
      return hay.toLowerCase().includes(q);
    });
  }, [conversations, search]);

  const sortedConversations = useMemo(() => {
    const list = [...filteredConversations];
    list.sort((a, b) => {
      const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return tb - ta;
    });
    return list;
  }, [filteredConversations]);

  async function loadList() {
    setLoadingList(true);
    setListError(null);

    try {
      const res = await apiFetch(API.list());
      const data = (await safeJson(res)) as (ApiOk<{ conversations?: any[]; items?: any[] }> & any) | ApiErr | null;

      if (!res.ok || !data || (data as any).success !== true) {
        setConversations([]);
        setListError((data as any)?.error || `Failed to load inbox (${res.status})`);
        return;
      }

      const rawList = Array.isArray((data as any).conversations)
        ? (data as any).conversations
        : Array.isArray((data as any).items)
        ? (data as any).items
        : [];

      const convs = rawList.map(coerceConversation).filter(Boolean) as InboxConversation[];
      setConversations(convs);

      if (!activeKey && convs.length > 0) setActiveKey(convs[0].convKey);
    } catch (e: any) {
      setConversations([]);
      setListError(e?.message || "Failed to load inbox");
    } finally {
      setLoadingList(false);
    }
  }

  async function loadConversation(convKey: string, opts?: { silent?: boolean }) {
    try {
      inflightGetRef.current?.abort();
    } catch {}
    const ac = new AbortController();
    inflightGetRef.current = ac;

    if (!opts?.silent) {
      setLoadingConv(true);
      setConvError(null);
    }

    try {
      const res = await apiFetch(API.get(convKey), { signal: ac.signal as any });
      const data = (await safeJson(res)) as (ApiOk<{ conversation?: any; messages?: any[] }> & any) | ApiErr | null;

      if (!res.ok || !data || (data as any).success !== true) {
        if (!opts?.silent) setConvError((data as any)?.error || `Failed to load conversation (${res.status})`);
        return;
      }

      const rawConv = (data as any).conversation ?? (data as any).conv ?? null;
      const conv = coerceConversation(rawConv) || ({ convKey } as InboxConversation);

      let messages: InboxMessage[] = [];
      if (Array.isArray((data as any).messages)) {
        messages = (data as any).messages.map(coerceMessage).filter(Boolean) as InboxMessage[];
      } else if (Array.isArray((rawConv as any)?.messages)) {
        messages = (rawConv as any).messages.map(coerceMessage).filter(Boolean) as InboxMessage[];
      }

      setActiveConv((prev) => {
        const prevMsgs = prev?.convKey === convKey && Array.isArray(prev.messages) ? prev.messages : [];
        const nextMsgs = messages.length ? mergeMessages(prevMsgs, messages) : prevMsgs;

        return { ...prev, ...conv, convKey, messages: nextMsgs };
      });

      setConversations((prev) => {
        const next = [...prev];
        const idx = next.findIndex((c) => c.convKey === convKey);
        if (idx >= 0) {
          const newest = messages.length ? messages[messages.length - 1] : null;
          next[idx] = {
            ...next[idx],
            ...conv,
            messages: undefined,
            lastMessageText: newest?.text || next[idx].lastMessageText,
            lastMessageAt: newest?.ts || next[idx].lastMessageAt,
          };
        }
        return next;
      });
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      if (!opts?.silent) setConvError(e?.message || "Failed to load conversation");
    } finally {
      if (!opts?.silent) setLoadingConv(false);
    }
  }

  async function sendMessage() {
    const convKey = activeKey;
    const text = draft.trim();
    if (!convKey || !text || sending) return;

    setSending(true);
    setConvError(null);

    const optimistic: InboxMessage = {
      id: `out_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      direction: "out",
      text,
      ts: new Date().toISOString(),
      status: "queued",
    };

    setDraft("");

    setActiveConv((prev) => {
      if (!prev || prev.convKey !== convKey) return prev;
      const prevMsgs = Array.isArray(prev.messages) ? prev.messages : [];
      return {
        ...prev,
        messages: [...prevMsgs, optimistic],
        lastMessageText: text,
        lastMessageAt: optimistic.ts,
      };
    });

    setConversations((prev) => {
      const next = [...prev];
      const idx = next.findIndex((c) => c.convKey === convKey);
      if (idx >= 0) next[idx] = { ...next[idx], lastMessageText: text, lastMessageAt: optimistic.ts };
      return next;
    });

    try {
      const res = await apiFetch(API.send(), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ convKey, text }),
      });

      const data = (await safeJson(res)) as (ApiOk<{ message?: any; conversation?: any }> & any) | ApiErr | null;

      if (!res.ok || !data || (data as any).success !== true) {
        setActiveConv((prev) => {
          if (!prev || prev.convKey !== convKey) return prev;
          const msgs = (prev.messages || []).map((m) => (m.id === optimistic.id ? { ...m, status: "failed" } : m));
          return { ...prev, messages: msgs };
        });
        setConvError((data as any)?.error || `Send failed (${res.status})`);
        return;
      }

      const serverMsg = coerceMessage((data as any).message);
      setActiveConv((prev) => {
        if (!prev || prev.convKey !== convKey) return prev;
        const prevMsgs = Array.isArray(prev.messages) ? prev.messages : [];
        const msgs = serverMsg ? prevMsgs.map((m) => (m.id === optimistic.id ? serverMsg : m)) : prevMsgs;
        return { ...prev, messages: msgs };
      });

      void loadConversation(convKey, { silent: true });
    } catch (e: any) {
      setActiveConv((prev) => {
        if (!prev || prev.convKey !== convKey) return prev;
        const msgs = (prev.messages || []).map((m) => (m.id === optimistic.id ? { ...m, status: "failed" } : m));
        return { ...prev, messages: msgs };
      });
      setConvError(e?.message || "Send failed");
    } finally {
      setSending(false);
    }
  }

  // initial load
  useEffect(() => {
    void loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // activeKey loads
  useEffect(() => {
    if (!activeKey) {
      setActiveConv(null);
      setConvError(null);
      return;
    }
    void loadConversation(activeKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey]);

  // polling
  useEffect(() => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (!activeKey) return;

    pollRef.current = window.setInterval(() => {
      void loadConversation(activeKey, { silent: true });
      void loadList();
    }, 3000);

    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey]);

  return {
    conversations: sortedConversations,
    loadingList,
    listError,

    activeKey,
    setActiveKey,

    activeConv,
    loadingConv,
    convError,

    search,
    setSearch,

    draft,
    setDraft,

    sending,
    sendMessage,

    refresh: loadList,
  };
}
