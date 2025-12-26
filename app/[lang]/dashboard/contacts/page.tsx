"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import {
  Plus,
  Upload,
  Search,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Loader2,
} from "lucide-react";

type Contact = {
  id: string;
  name?: string;
  phone: string;
  tags?: string[];
  lastContactAt?: string;
  sentCount?: number;
  receivedCount?: number;
};

type ImportRow = {
  rowNumber: number; // 2 = first data row if row1 is header
  name: string;
  phone: string;
  tags: string[];
};

type ImportFailure = {
  rowNumber: number;
  phone: string;
  reason: string;
};

/* -----------------------------
   Helpers
----------------------------- */
function normalizeTag(t: string) {
  return String(t || "").trim().toLowerCase();
}

function splitTags(raw: string) {
  const v = String(raw || "").trim();
  if (!v) return [];
  return v
    .split(/[|,;]+/g)
    .map((x) => normalizeTag(x))
    .filter(Boolean);
}

function normalizePhone(raw: string) {
  return String(raw || "").trim();
}

// Minimal CSV parser (supports quoted commas/newlines)
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let i = 0;
  let inQuotes = false;

  while (i < text.length) {
    const ch = text[i];

    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i += 2;
        continue;
      }
      inQuotes = !inQuotes;
      i++;
      continue;
    }

    if (!inQuotes && (ch === "," || ch === "\t")) {
      row.push(cur);
      cur = "";
      i++;
      continue;
    }

    if (!inQuotes && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cur);
      cur = "";
      if (row.some((c) => String(c).trim() !== "")) rows.push(row);
      row = [];
      i++;
      continue;
    }

    cur += ch;
    i++;
  }

  row.push(cur);
  if (row.some((c) => String(c).trim() !== "")) rows.push(row);

  return rows.map((r) => r.map((c) => String(c ?? "").trim()));
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export default function ContactsPage() {
  // -----------------------------
  // Data + UI state
  // -----------------------------
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [pageContacts, setPageContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Paging UI
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // If backend later supports server paging, we’ll detect & use these
  const [serverPaging, setServerPaging] = useState(false);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");

  // Modals
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showImport, setShowImport] = useState(false);

  // Add form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [tagList, setTagList] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Edit form
  const [editing, setEditing] = useState<Contact | null>(null);
  const [editName, setEditName] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editTagInput, setEditTagInput] = useState("");

  // Import UI
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [importProgress, setImportProgress] = useState({
    current: 0,
    total: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
  });
  const [importFailures, setImportFailures] = useState<ImportFailure[]>([]);
  const importFileRef = useRef<HTMLInputElement | null>(null);

  // -----------------------------
  // Tags suggestions (from loaded contacts)
  // -----------------------------
  const allTags = useMemo(() => {
    const set = new Set<string>();
    const src = serverPaging ? pageContacts : allContacts;
    for (const c of src) {
      for (const t of c.tags || []) {
        const v = normalizeTag(t);
        if (v) set.add(v);
      }
    }
    return Array.from(set).sort();
  }, [allContacts, pageContacts, serverPaging]);

  // Map by phone for quick existence check
  const phoneMap = useMemo(() => {
    const m = new Map<string, Contact>();
    const src = allContacts.length ? allContacts : pageContacts;
    for (const c of src) m.set(normalizePhone(c.phone), c);
    return m;
  }, [allContacts, pageContacts]);

  // -----------------------------
  // Load contacts
  // -----------------------------
  async function loadContacts(opts?: { page?: number; q?: string; tag?: string }) {
    const p = opts?.page ?? page;
    const q = (opts?.q ?? search).trim();
    const tag = (opts?.tag ?? tagFilter).trim();

    setLoading(true);
    setErrorMsg(null);

    try {
      const qs = new URLSearchParams();
      qs.set("page", String(p));
      qs.set("pageSize", String(pageSize));
      if (q) qs.set("q", q);
      if (tag) qs.set("tag", tag);

      const res = await apiFetch(`/contacts?${qs.toString()}`);
      const data = await safeJson(res);

      if (!res.ok || !data?.success) {
        setAllContacts([]);
        setPageContacts([]);
        setTotal(0);
        setTotalPages(1);
        setServerPaging(false);
        setErrorMsg(data?.error || `Failed to load contacts (${res.status})`);
        return;
      }

      const hasServerPaging =
        typeof data.total === "number" && Array.isArray(data.contacts);

      if (hasServerPaging) {
        setServerPaging(true);
        setPageContacts(data.contacts || []);
        setTotal(data.total || 0);
        setTotalPages(typeof data.totalPages === "number" ? data.totalPages : 1);
        setAllContacts([]);
      } else {
        setServerPaging(false);
        const list: Contact[] = Array.isArray(data.contacts) ? data.contacts : [];
        setAllContacts(list);
        setTotal(list.length);
        setTotalPages(Math.max(1, Math.ceil(list.length / pageSize)));
        setPageContacts([]);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadContacts({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      loadContacts({ page: 1, q: search, tag: tagFilter });
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, tagFilter]);

  useEffect(() => {
    if (serverPaging) loadContacts({ page });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, serverPaging]);

  // Client paging computed
  const clientFiltered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const t = normalizeTag(tagFilter);

    let list = allContacts;

    if (q) {
      list = list.filter((c) => {
        const tagStr = (c.tags || []).join(" ");
        return `${c.name || ""} ${c.phone} ${tagStr}`.toLowerCase().includes(q);
      });
    }

    if (t) {
      list = list.filter((c) => (c.tags || []).map(normalizeTag).includes(t));
    }

    list = [...list].sort((a, b) => {
      const ta = a.lastContactAt ? new Date(a.lastContactAt).getTime() : 0;
      const tb = b.lastContactAt ? new Date(b.lastContactAt).getTime() : 0;
      return tb - ta;
    });

    return list;
  }, [allContacts, search, tagFilter]);

  const clientTotalPages = useMemo(() => {
    return Math.max(1, Math.ceil(clientFiltered.length / pageSize));
  }, [clientFiltered.length]);

  useEffect(() => {
    if (!serverPaging) {
      setTotal(clientFiltered.length);
      setTotalPages(clientTotalPages);
      setPage((p) => Math.min(p, clientTotalPages));
    }
  }, [clientFiltered.length, clientTotalPages, serverPaging]);

  const clientPaged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return clientFiltered.slice(start, start + pageSize);
  }, [clientFiltered, page]);

  const visibleContacts = serverPaging ? pageContacts : clientPaged;

  // -----------------------------
  // Create
  // -----------------------------
  async function addContact() {
    const p = normalizePhone(phone);
    if (!p) return;

    const res = await apiFetch("/contacts/create", {
      method: "POST",
      body: JSON.stringify({
        name: name.trim(),
        phone: p,
        tags: tagList,
      }),
    });

    const data = await safeJson(res);
    if (!res.ok || !data?.success) {
      alert(data?.error || "Create failed");
      return;
    }

    setName("");
    setPhone("");
    setTagList([]);
    setTagInput("");
    setShowAdd(false);

    setPage(1);
    await loadContacts({ page: 1 });
  }

  // -----------------------------
  // Edit
  // -----------------------------
  function openEdit(c: Contact) {
    setEditing(c);
    setEditName(c.name || "");
    setEditTags(Array.isArray(c.tags) ? c.tags : []);
    setEditTagInput("");
    setShowEdit(true);
  }

  async function saveEdit() {
    if (!editing) return;

    const res = await apiFetch(`/contacts/update/${editing.id}`, {
      method: "PUT",
      body: JSON.stringify({
        name: editName.trim(),
        tags: editTags,
      }),
    });

    const data = await safeJson(res);
    if (!res.ok || !data?.success) {
      alert(data?.error || "Update failed");
      return;
    }

    setShowEdit(false);
    setEditing(null);
    await loadContacts({ page });
  }

  // -----------------------------
  // Delete
  // -----------------------------
  async function deleteContact(contact: Contact) {
    const ok = confirm(`Delete contact ${contact.name || contact.phone}?`);
    if (!ok) return;

    if (serverPaging) {
      setPageContacts((prev) => prev.filter((c) => c.id !== contact.id));
    } else {
      setAllContacts((prev) => prev.filter((c) => c.id !== contact.id));
    }

    try {
      const res = await apiFetch(`/contacts/delete/${contact.id}`, {
        method: "DELETE",
      });

      const data = await safeJson(res);
      if (!res.ok || !data?.success) {
        alert(data?.error || "Delete failed");
        await loadContacts({ page });
        return;
      }

      await loadContacts({ page });
    } catch {
      alert("Delete failed");
      await loadContacts({ page });
    }
  }

  // -----------------------------
  // Import (Skip duplicates default)
  // -----------------------------
  function resetImportState() {
    setImportRows([]);
    setImporting(false);
    setImportDone(false);
    setImportFailures([]);
    setImportProgress({
      current: 0,
      total: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
    });
    if (importFileRef.current) importFileRef.current.value = "";
  }

  function parseImportCSV(text: string) {
    const grid = parseCSV(text);
    if (grid.length < 2) {
      setImportRows([]);
      return;
    }

    const header = grid[0].map((h) => String(h || "").trim().toLowerCase());
    const idxName = header.indexOf("name");
    const idxPhone = header.indexOf("phone");
    const idxTags = header.indexOf("tags");

    if (idxPhone === -1) {
      setImportRows([]);
      throw new Error("CSV must contain a 'phone' column.");
    }

    const rows: ImportRow[] = [];
    for (let r = 1; r < grid.length; r++) {
      const cols = grid[r];
      const nm = idxName >= 0 ? String(cols[idxName] || "").trim() : "";
      const ph = normalizePhone(idxPhone >= 0 ? String(cols[idxPhone] || "") : "");
      const tg = idxTags >= 0 ? splitTags(String(cols[idxTags] || "")) : [];
      if (!ph) continue;

      rows.push({
        rowNumber: r + 1,
        name: nm,
        phone: ph,
        tags: tg,
      });
    }

    setImportRows(rows);
  }

  async function handleImportFile(file: File) {
    resetImportState();
    const text = await file.text();

    try {
      parseImportCSV(text);
    } catch (e: any) {
      setImportFailures([
        { rowNumber: 0, phone: "", reason: e?.message || "Invalid CSV" },
      ]);
    }
  }

  async function runImport() {
    if (importRows.length === 0) return;

    setImporting(true);
    setImportDone(false);
    setImportFailures([]);
    setImportProgress({
      current: 0,
      total: importRows.length,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
    });

    const failures: ImportFailure[] = [];

    // ✅ Skip duplicates: includes existing contacts + duplicates inside the same CSV
    const existingPhones = new Set<string>(
      Array.from(phoneMap.keys()).map((p) => normalizePhone(p))
    );

    for (let i = 0; i < importRows.length; i++) {
      const row = importRows[i];
      const ph = normalizePhone(row.phone);

      // ✅ Already exists (DB or previously processed in this CSV)
      if (existingPhones.has(ph)) {
        setImportProgress((p) => ({
          ...p,
          current: i + 1,
          skipped: p.skipped + 1,
        }));
        continue;
      }

      try {
        const res = await apiFetch("/contacts/create", {
          method: "POST",
          body: JSON.stringify({
            name: row.name,
            phone: ph,
            tags: row.tags,
          }),
        });

        const data = await safeJson(res);

        // ✅ Backend duplicate -> treat as skipped (409 Conflict)
        if (res.status === 409) {
          existingPhones.add(ph);
          setImportProgress((p) => ({
            ...p,
            current: i + 1,
            skipped: p.skipped + 1,
          }));
          continue;
        }

        if (!res.ok || !data?.success) {
          failures.push({
            rowNumber: row.rowNumber,
            phone: ph,
            reason: data?.error || `Create failed (${res.status})`,
          });
          setImportProgress((p) => ({
            ...p,
            current: i + 1,
            failed: p.failed + 1,
          }));
          continue;
        }

        existingPhones.add(ph);

        setImportProgress((p) => ({
          ...p,
          current: i + 1,
          created: p.created + 1,
        }));
      } catch (e: any) {
        failures.push({
          rowNumber: row.rowNumber,
          phone: ph,
          reason: e?.message || "Import failed",
        });
        setImportProgress((p) => ({
          ...p,
          current: i + 1,
          failed: p.failed + 1,
        }));
      }
    }

    setImportFailures(failures);
    setImporting(false);
    setImportDone(true);

    setPage(1);
    await loadContacts({ page: 1 });
  }

  const importPercent = useMemo(() => {
    const t = importProgress.total || 0;
    const c = importProgress.current || 0;
    if (!t) return 0;
    return Math.round((c / t) * 100);
  }, [importProgress.current, importProgress.total]);

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Contacts</h1>
          <p className="text-gray-500 text-sm">
            Broadcast-ready recipients. Imported or manually added.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              resetImportState();
              setShowImport(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>

          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
          >
            <Plus className="w-4 h-4" />
            Add Contact
          </button>
        </div>
      </div>

      {/* ERROR */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          {errorMsg}
        </div>
      )}

      {/* SEARCH + TAG FILTER */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
        <Search className="w-4 h-4 text-gray-400" />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name / phone / tag..."
          className="w-full outline-none text-sm"
        />

        <input
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          placeholder="Tag filter (optional)"
          className="w-[220px] outline-none text-sm border border-gray-200 rounded-lg px-3 py-2"
          list="tag-suggestions"
        />
        <datalist id="tag-suggestions">
          {allTags.slice(0, 50).map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>

        <button
          onClick={() => loadContacts({ page: 1 })}
          className="text-purple-600 text-sm hover:underline"
        >
          Refresh
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left px-6 py-3 font-medium">Name</th>
              <th className="text-left px-6 py-3 font-medium">Phone</th>
              <th className="text-left px-6 py-3 font-medium">Tags</th>
              <th className="text-right px-6 py-3 font-medium">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="px-6 py-6 text-center text-gray-400">
                  Loading contacts…
                </td>
              </tr>
            )}

            {!loading && visibleContacts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-6 text-center text-gray-400">
                  No contacts found
                </td>
              </tr>
            )}

            {!loading &&
              visibleContacts.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-6 py-4 text-gray-900">{c.name || "—"}</td>
                  <td className="px-6 py-4 text-gray-700">{c.phone}</td>

                  <td className="px-6 py-4">
                    {(c.tags || []).length === 0 ? (
                      <span className="text-gray-400">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {(c.tags || []).slice(0, 6).map((t) => (
                          <span
                            key={`${c.id}-${t}`}
                            className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 border border-gray-200"
                          >
                            {t}
                          </span>
                        ))}
                        {(c.tags || []).length > 6 && (
                          <span className="text-xs text-gray-400">
                            +{(c.tags || []).length - 6}
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openEdit(c)}
                      className="text-gray-400 hover:text-gray-700 mr-3"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => deleteContact(c)}
                      className="text-gray-400 hover:text-red-500"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {/* PAGINATION */}
        {!loading && total > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white">
            <div className="text-xs text-gray-500">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of{" "}
              {total}
              {serverPaging ? (
                <span className="ml-2">(server)</span>
              ) : (
                <span className="ml-2">(client)</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>

              <div className="text-sm text-gray-600">
                Page <span className="font-medium">{page}</span> / {totalPages}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ADD CONTACT MODAL */}
      {showAdd && (
        <Modal
          title="Add Contact"
          onClose={() => setShowAdd(false)}
          footer={
            <button
              onClick={addContact}
              className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700"
            >
              Save Contact
            </button>
          }
        >
          <div className="space-y-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name (optional)"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            />

            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone (E.164 e.g. +60123456789)"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            />

            <TagsInput
              label="Tags"
              value={tagList}
              inputValue={tagInput}
              onInputChange={setTagInput}
              onChange={setTagList}
              suggestions={allTags}
              placeholder="Type tag, press Enter (e.g. vip, hotlead)"
            />
          </div>
        </Modal>
      )}

      {/* EDIT CONTACT MODAL */}
      {showEdit && editing && (
        <Modal
          title="Edit Contact"
          onClose={() => {
            setShowEdit(false);
            setEditing(null);
          }}
          footer={
            <button
              onClick={saveEdit}
              className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700"
            >
              Save Changes
            </button>
          }
        >
          <div className="space-y-4">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Name (optional)"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            />

            <input
              value={editing.phone}
              disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
            />

            <TagsInput
              label="Tags"
              value={editTags}
              inputValue={editTagInput}
              onInputChange={setEditTagInput}
              onChange={setEditTags}
              suggestions={allTags}
              placeholder="Type tag, press Enter (e.g. vip, hotlead)"
            />
          </div>
        </Modal>
      )}

      {/* IMPORT MODAL */}
      {showImport && (
        <Modal title="Import Contacts" onClose={() => setShowImport(false)}>
          <div className="space-y-4">
            <div className="text-sm text-gray-700">
              CSV columns supported: <b>name, phone, tags</b>
              <div className="text-xs text-gray-500 mt-1">
                tags example: <code>vip|sales</code> (recommended) or{" "}
                <code>"vip,sales"</code> (must be quoted)
              </div>
            </div>

            {/* Upload box */}
            <label className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center text-sm text-gray-600 cursor-pointer block hover:bg-gray-50">
              Click to upload CSV
              <div className="text-xs text-gray-400 mt-1">
                Parse → Import (with progress) • duplicates auto-skip
              </div>

              <input
                ref={importFileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImportFile(file);
                }}
              />
            </label>

            {/* Progress */}
            {importing && (
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                    Importing…
                  </div>
                  <div className="text-gray-600">{importPercent}%</div>
                </div>

                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-purple-600"
                    style={{ width: `${importPercent}%` }}
                  />
                </div>

                <div className="mt-3 text-xs text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
                  <span>
                    Processed: {importProgress.current}/{importProgress.total}
                  </span>
                  <span>Created: {importProgress.created}</span>
                  <span>Skipped: {importProgress.skipped}</span>
                  <span>Failed: {importProgress.failed}</span>
                </div>
              </div>
            )}

            {/* Done */}
            {importDone && (
              <div className="border border-green-200 bg-green-50 text-green-700 rounded-xl p-4 text-sm">
                Import finished. Created {importProgress.created}, Skipped{" "}
                {importProgress.skipped}, Failed {importProgress.failed}.
              </div>
            )}

            {/* Failures */}
            {importFailures.length > 0 && (
              <div className="border border-red-200 rounded-xl overflow-hidden">
                <div className="bg-red-50 px-4 py-2 text-xs text-red-700 font-medium">
                  Failures (showing first {Math.min(8, importFailures.length)})
                </div>
                <div className="p-4 space-y-2 text-sm">
                  {importFailures.slice(0, 8).map((f, idx) => (
                    <div key={`${f.rowNumber}-${idx}`} className="text-red-700">
                      Row {f.rowNumber || "—"} ({f.phone || "—"}): {f.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                disabled={importRows.length === 0 || importing}
                onClick={runImport}
                className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-40"
              >
                Start Import
              </button>

              <button
                disabled={importing}
                onClick={resetImportState}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                Reset
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ----------------------------------
   TAG INPUT (CHIPS + AUTOCOMPLETE)
---------------------------------- */
function TagsInput({
  label,
  value,
  inputValue,
  onInputChange,
  onChange,
  suggestions,
  placeholder,
}: {
  label: string;
  value: string[];
  inputValue: string;
  onInputChange: (v: string) => void;
  onChange: (next: string[]) => void;
  suggestions: string[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  function addTag(raw: string) {
    const t = normalizeTag(raw);
    if (!t) return;
    if (value.includes(t)) return;
    onChange([...value, t]);
    onInputChange("");
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  const filteredSuggestions = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q) return suggestions.filter((t) => !value.includes(t)).slice(0, 8);
    return suggestions
      .filter((t) => !value.includes(t))
      .filter((t) => t.includes(q))
      .slice(0, 8);
  }, [suggestions, value, inputValue]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div className="space-y-2" ref={boxRef}>
      <div className="text-sm font-medium text-gray-700">{label}</div>

      <div
        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-purple-200 focus-within:border-purple-300 bg-white"
        onClick={() => setOpen(true)}
      >
        <div className="flex flex-wrap gap-2 items-center">
          {value.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800 border border-gray-200"
            >
              {t}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(t);
                }}
                className="text-gray-400 hover:text-gray-700"
                aria-label={`Remove ${t}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          <input
            value={inputValue}
            onChange={(e) => {
              onInputChange(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="flex-1 min-w-[160px] outline-none text-sm py-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag(inputValue);
                setOpen(false);
              }
              if (e.key === "," || e.key === "Tab") {
                if (inputValue.trim()) {
                  e.preventDefault();
                  addTag(inputValue);
                }
              }
              if (e.key === "Backspace" && !inputValue && value.length > 0) {
                removeTag(value[value.length - 1]);
              }
            }}
            onBlur={() => {
              if (inputValue.trim()) addTag(inputValue);
            }}
          />
        </div>
      </div>

      {open && filteredSuggestions.length > 0 && (
        <div className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
          {filteredSuggestions.map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => {
                addTag(t);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
            >
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ----------------------------------
   MODAL (REUSABLE)
---------------------------------- */
function Modal({
  title,
  children,
  onClose,
  footer,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        {children}

        {footer && <div className="mt-5">{footer}</div>}
      </div>
    </div>
  );
}
