"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBroadcast } from "../BroadcastContext";
import { apiFetch } from "@/lib/api";

/* ----------------------------------
   Types
----------------------------------- */

type TabKey = "all";

type ChannelRow = {
  id: string;
  label: string;
  type?: string;
  score?: number;
};

type ContactRow = {
  id: string;
  name?: string;
  phone: string;
  tags?: string[];
};

const MAX_RECIPIENTS = 500;
const TABS: { key: TabKey; label: string }[] = [{ key: "all", label: "All" }];

/* ----------------------------------
   Helpers
----------------------------------- */

function normalizePhone(input: any): string {
  const s = String(input ?? "").trim();
  if (!s) return "";
  const hasPlus = s.startsWith("+");
  const digits = s.replace(/[^\d]/g, "");
  if (!digits) return "";
  if (hasPlus) return "+" + digits;
  if (digits.startsWith("0")) return "+6" + digits;
  if (digits.startsWith("60")) return "+" + digits;
  return "+" + digits;
}

function uniqBy<T>(items: T[], getKey: (t: T) => string) {
  const m = new Map<string, T>();
  for (const it of items) {
    const k = getKey(it);
    if (!k) continue;
    if (!m.has(k)) m.set(k, it);
  }
  return Array.from(m.values());
}

/* ----------------------------------
   Component
----------------------------------- */

export default function StepChannelAudience() {
  const { draft, update, setChannel, setAudience, setAudienceCount } =
    useBroadcast();

  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";

  /* ---------- Derived State (NO LOCAL SOURCE OF TRUTH) ---------- */

  const selected = useMemo(
    () => new Set(draft.audience?.numbers ?? []),
    [draft.audience?.numbers]
  );

  const selectedCount = selected.size;
  const exceeded = selectedCount > MAX_RECIPIENTS;

  const activeTab: TabKey = "all";
  const selectedChannelLabel = draft.channel?.label ?? "No channel selected";

  /* ---------- Channels ---------- */

  const [channels, setChannels] = useState<ChannelRow[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [channelsErr, setChannelsErr] = useState<string | null>(null);

  async function loadChannels() {
    setChannelsLoading(true);
    setChannelsErr(null);
    try {
      const res = await apiFetch("/devices");
      const json = await res.json();
      const raw = json.devices ?? json.items ?? [];

      const mapped = uniqBy(
        raw.map((x: any) => ({
          id: String(x.id ?? x.sessionId),
          label: String(x.label ?? x.number ?? "Channel"),
          type: x.type ?? "unofficial",
          score: Number(x.score ?? 50),
        })),
        (x) => x.id
      );

      setChannels(mapped);
    } catch (e: any) {
      setChannelsErr(e.message || "Failed to load channels");
    } finally {
      setChannelsLoading(false);
    }
  }

  function handlePickChannel(id: string) {
    const ch = channels.find((x) => x.id === id);
    if (!ch) return;
    setChannel({
      id: ch.id,
      label: ch.label,
      type: ch.type,
      score: ch.score,
    } as any);
  }

  /* ---------- Contacts ---------- */

  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsErr, setContactsErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  async function loadContacts() {
    setContactsLoading(true);
    setContactsErr(null);
    try {
      const res = await apiFetch("/contacts");
      const json = await res.json();
      const raw = json.contacts ?? json.items ?? [];

      const mapped = uniqBy(
        raw
          .map((x: any) => {
            const phone = normalizePhone(x.phone);
            if (!phone) return null;
            return {
              id: String(x.id ?? phone),
              name: x.name ?? undefined,
              phone,
              tags: Array.isArray(x.tags) ? x.tags : [],
            };
          })
          .filter(Boolean),
        (x: ContactRow) => x.phone
      );

      setContacts(mapped);
    } catch (e: any) {
      setContactsErr(e.message || "Failed to load contacts");
    } finally {
      setContactsLoading(false);
    }
  }

  const filteredContacts = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return contacts;
    return contacts.filter((c) =>
      `${c.name ?? ""} ${c.phone} ${(c.tags ?? []).join(" ")}`
        .toLowerCase()
        .includes(query)
    );
  }, [contacts, q]);

  /* ---------- EDIT MODE AUTO-LOAD ---------- */

  const autoLoadedContacts = useRef(false);
  const autoLoadedChannels = useRef(false);

  useEffect(() => {
    // If we already have selected numbers (edit mode), auto-load contacts once
    const hasSelected = (draft.audience?.numbers?.length ?? 0) > 0;

    if (
      hasSelected &&
      !autoLoadedContacts.current &&
      !contactsLoading &&
      contacts.length === 0
    ) {
      autoLoadedContacts.current = true;
      loadContacts();
    }
  }, [draft.audience?.numbers?.length, contactsLoading, contacts.length]);

  useEffect(() => {
    // If we already have a saved channel (edit mode), auto-load channels once
    const hasChannel = !!draft.channel?.id;

    if (
      hasChannel &&
      !autoLoadedChannels.current &&
      !channelsLoading &&
      channels.length === 0
    ) {
      autoLoadedChannels.current = true;
      loadChannels();
    }
  }, [draft.channel?.id, channelsLoading, channels.length]);

  /* ---------- Audience Mutations (SOURCE = CONTEXT) ---------- */

  function setNumbers(nextNumbers: string[]) {
    setAudience({
      ...(draft.audience ?? { mode: "contacts" }),
      mode: "contacts", // ✅ do not fallback to "manual"
      numbers: nextNumbers,
    });
    setAudienceCount(nextNumbers.length);
  }

  function togglePhone(phone: string) {
    const next = new Set(selected);
    next.has(phone) ? next.delete(phone) : next.add(phone);
    setNumbers(Array.from(next));
  }

  function selectAllVisible() {
    const next = new Set(selected);
    filteredContacts.forEach((c) => next.add(c.phone));
    setNumbers(Array.from(next));
  }

  function clearAll() {
    setNumbers([]);
  }

  /* ----------------------------------
     Render
  ----------------------------------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Broadcast name</label>
          <input
            value={draft.name}
            onChange={(e) => update({ name: e.target.value })}
            className="mt-1 w-full rounded-xl bg-gray-50 px-3 py-2 text-sm ring-1 ring-black/5"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Channel</label>
          <div className="mt-1 space-y-2 rounded-xl bg-gray-50 p-3 ring-1 ring-black/5">
            <div className="text-sm">{selectedChannelLabel}</div>
            <div className="flex gap-2">
              <button
                onClick={loadChannels}
                className="rounded-lg bg-white px-3 py-1.5 text-sm ring-1 ring-black/5"
              >
                {channelsLoading ? "Loading…" : "Load channels"}
              </button>
              {channels.length > 0 && (
                <select
                  value={draft.channel?.id ?? ""}
                  onChange={(e) => handlePickChannel(e.target.value)}
                  className="w-full rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-black/5"
                >
                  <option value="">Select channel…</option>
                  {channels.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {channelsErr && (
              <div className="text-xs text-red-600">{channelsErr}</div>
            )}
          </div>
        </div>
      </div>

      {/* Audience */}
      <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
        <div className="mb-3 text-sm font-semibold">Audience</div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search contacts…"
          className="mb-3 w-full rounded-xl bg-gray-50 px-3 py-2 text-sm ring-1 ring-black/5"
        />

        <div className="mb-2 text-sm">
          Selected:{" "}
          <span
            className={
              exceeded ? "text-red-600 font-semibold" : "font-semibold"
            }
          >
            {selectedCount}
          </span>{" "}
          / {MAX_RECIPIENTS}
        </div>

        <div className="flex gap-2 mb-3">
          <button
            onClick={loadContacts}
            className="rounded-lg bg-white px-3 py-1.5 text-sm ring-1 ring-black/5"
          >
            {contactsLoading ? "Loading…" : "Load contacts"}
          </button>
          <button
            onClick={selectAllVisible}
            className="rounded-lg bg-white px-3 py-1.5 text-sm ring-1 ring-black/5"
          >
            Select visible
          </button>
          <button
            onClick={clearAll}
            className="rounded-lg bg-white px-3 py-1.5 text-sm ring-1 ring-black/5"
          >
            Clear
          </button>
        </div>

        {contactsErr && (
          <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {contactsErr}
          </div>
        )}

        <div className="max-h-[360px] overflow-auto rounded-xl border">
          {filteredContacts.map((c) => (
            <label
              key={c.phone}
              className="flex items-center justify-between px-4 py-3 border-b hover:bg-gray-50"
            >
              <div>
                <div className="text-sm font-medium">{c.name || c.phone}</div>
                <div className="text-xs text-gray-500">{c.phone}</div>
              </div>
              <input
                type="checkbox"
                checked={selected.has(c.phone)}
                onChange={() => togglePhone(c.phone)}
                className="h-4 w-4 accent-purple-600"
              />
            </label>
          ))}

          {!contactsLoading && contacts.length === 0 && (
            <div className="p-4 text-sm text-gray-500">
              No contacts loaded yet. Click <b>Load contacts</b>.
            </div>
          )}

          {!contactsLoading && contacts.length > 0 && filteredContacts.length === 0 && (
            <div className="p-4 text-sm text-gray-500">
              No contacts match your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
