"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { API_URL } from "../../../api/config";

type LogItem = {
  timestamp: string;
  action: string;
  userId?: string | null;
  email?: string | null;
  ip?: string | null;
};

export default function AdminLogsPage() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId"); // <-- filter if provided

  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // ui state
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    let endpoint = `${API_URL}/logs`;
    if (userId) endpoint += `?userId=${encodeURIComponent(userId)}`;

    fetch(endpoint)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const items: LogItem[] = Array.isArray(data.logs) ? data.logs : [];
        items.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
        setLogs(items);
        setErr(null);
      })
      .catch((e) => setErr(e?.message || "Failed to load logs"))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // filter by query (email, action, ip, userId)
  const filtered = useMemo(() => {
    if (!query.trim()) return logs;
    const q = query.toLowerCase();
    return logs.filter((l) =>
      [
        l.email ?? "",
        l.action ?? "",
        l.ip ?? "",
        l.userId ?? "",
        l.timestamp ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [logs, query]);

  // paging
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  // reset to first page when filters/pageSize change
  useEffect(() => {
    setPage(1);
  }, [query, pageSize]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          {userId ? `Logs for User ${userId}` : "System Logs"}
        </h1>
        <div className="flex items-center gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search email, action, IP…"
            className="px-3 py-2 border rounded-lg text-sm w-[280px] bg-white"
          />
          <select
            className="px-3 py-2 border rounded-lg text-sm bg-white"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl shadow border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Time
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Action
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Email
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                User ID
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                IP
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            )}

            {!loading && err && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-red-500">
                  {err}
                </td>
              </tr>
            )}

            {!loading && !err && pageItems.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  No logs found.
                </td>
              </tr>
            )}

            {!loading &&
              !err &&
              pageItems.map((log, i) => (
                <tr key={`${log.timestamp}-${i}`} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-800">
                    {formatTime(log.timestamp)}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        log.action === "login_success"
                          ? "bg-green-50 text-green-700"
                          : log.action === "login_failed"
                          ? "bg-red-50 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-800">
                    {log.email || "-"}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-800">
                    <code className="text-[12px]">{log.userId || "-"}</code>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-800">
                    {log.ip || "-"}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing{" "}
          <span className="font-medium">
            {filtered.length === 0 ? 0 : start + 1}
          </span>{" "}
          to{" "}
          <span className="font-medium">
            {Math.min(start + pageSize, filtered.length)}
          </span>{" "}
          of <span className="font-medium">{filtered.length}</span> results
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className={`px-4 py-2 rounded-lg border ${
              safePage === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Previous
          </button>
          <span className="self-center text-sm text-gray-600">
            Page {safePage} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className={`px-4 py-2 rounded-lg border ${
              safePage === totalPages
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTime(ts?: string) {
  if (!ts) return "-";
  try {
    const d = new Date(ts);
    return d.toLocaleString();
  } catch {
    return ts;
  }
}
