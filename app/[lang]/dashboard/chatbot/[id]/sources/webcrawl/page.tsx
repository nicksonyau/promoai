"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { apiFetch } from "@/lib/api";

interface SiteRecord {
  id: string;
  rootUrl: string;
  status?: "pending" | "indexing" | "indexed" | "failed" | "stopped";
  pagesCrawled?: number;
  maxPages?: number;
  createdAt?: number;
}

interface CrawledPage {
  url: string;
  title?: string;
  text: string;
}

export default function ChatbotSourcesPage() {
  const params = useParams();
  const chatbotId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState<SiteRecord[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [pages, setPages] = useState<CrawledPage[]>([]);
  const [pagesLoading, setPagesLoading] = useState(false);

  const [selectedPage, setSelectedPage] = useState<CrawledPage | null>(null);

  // -------------------------
  // LOAD SITES
  // -------------------------
  const loadSites = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/chatbot/sitecrawler/list/${chatbotId}`);
      const data = await res.json();

      if (!data.success) throw new Error(data.error || "Load failed");
      setSites(data.list || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load websites");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chatbotId) loadSites();
  }, [chatbotId]);

  // -------------------------
  // LOAD SUBPAGES ONLY
  // -------------------------
  const loadPages = async (siteId: string) => {
    setSelectedSite(siteId);
    setSelectedPage(null);
    setPagesLoading(true);

    try {
      const res = await apiFetch(`/chatbot/sitecrawler/pages/${siteId}`);
      const data = await res.json();

      const site = sites.find(s => s.id === siteId);
      const root = site?.rootUrl?.replace(/\/$/, "");

      // ✅ SHOW SUBPAGES ONLY (remove root page)
      const filtered = (data.pages || []).filter(
        (p: CrawledPage) => p.url !== root
      );

      // ✅ Remove duplicates by URL
      const cleaned = Array.from(
        new Map(filtered.map(p => [p.url, p])).values()
      );

      setPages(cleaned);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load crawled pages");
    } finally {
      setPagesLoading(false);
    }
  };

  // -------------------------
  // ADD SITE
  // -------------------------
  const addSite = async () => {
    if (!urlInput.trim()) return toast.error("Enter a valid URL");

    setAdding(true);
    try {
      const res = await apiFetch(`/chatbot/sitecrawler/create`, {
        method: "POST",
        body: JSON.stringify({ chatbotId, rootUrl: urlInput })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast.success("Website added");
      setUrlInput("");
      loadSites();
    } catch (e: any) {
      toast.error(e.message || "Add failed");
    } finally {
      setAdding(false);
    }
  };

  // -------------------------
  // DELETE SITE
  // -------------------------
  const removeSite = async (id: string) => {
    if (!confirm("Remove this site completely?")) return;

    try {
      const res = await apiFetch(`/chatbot/sitecrawler/delete/${id}`, {
        method: "DELETE"
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      if (selectedSite === id) {
        setSelectedSite(null);
        setPages([]);
        setSelectedPage(null);
      }

      toast.success("Site deleted");
      loadSites();
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
    }
  };

  // -------------------------
  // CLEAR KV DATA ONLY
  // -------------------------
  const clearCrawl = async (id: string) => {
    if (!confirm("Clear crawl data and reset this site?")) return;

    try {
      const res = await apiFetch(`/chatbot/sitecrawler/clear/${id}`, {
        method: "DELETE"
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      if (selectedSite === id) {
        setPages([]);
        setSelectedPage(null);
      }

      toast.success("Crawl data cleared");
      loadSites();
    } catch (e: any) {
      toast.error(e.message || "Clear failed");
    }
  };

  // -------------------------
  // START CRAWL
  // -------------------------
  const startCrawl = async (id: string) => {
    setProcessingId(id);

    try {
      const res = await apiFetch(`/chatbot/sitecrawler/start/${id}`, {
        method: "POST"
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast.success("Crawl finished");
      loadSites();
      loadPages(id);
    } catch (e: any) {
      toast.error(e.message || "Crawl failed");
    } finally {
      setProcessingId(null);
    }
  };

  // -------------------------
  // UI
  // -------------------------
  return (
    <div className="p-10 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Website Crawler</h1>

      {/* ADD SITE */}
      <div className="bg-white p-5 rounded-xl border mb-6">
        <h2 className="font-semibold mb-3">Add Website Root</h2>
        <div className="flex gap-2">
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 border px-3 py-2 rounded-md"
          />
          <button
            onClick={addSite}
            disabled={adding}
            className="bg-indigo-600 text-white px-4 rounded-md disabled:opacity-50"
          >
            {adding ? "Adding…" : "Add"}
          </button>
        </div>
      </div>

      {/* SITE TABLE */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="p-4 font-semibold">Websites</div>

        {loading && <div className="p-6 text-center">Loading...</div>}

        {!loading && sites.length === 0 && (
          <div className="p-6 text-center">No sites added</div>
        )}

        {!loading && sites.length > 0 && (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Root</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Pages</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {sites.map(site => (
                <tr key={site.id} className="border-t">
                  <td className="p-3 break-all">{site.rootUrl}</td>
                  <td className="p-3 text-center">
                    <StatusBadge status={site.status} />
                  </td>
                  <td className="p-3 text-center">
                    {site.pagesCrawled ?? 0} / {site.maxPages ?? "-"}
                  </td>
                  <td className="p-3 text-center space-x-2">
                    <button
                      onClick={() => startCrawl(site.id)}
                      disabled={processingId === site.id}
                      className="bg-black text-white px-3 py-1 rounded text-xs"
                    >
                      {processingId === site.id ? "Crawling…" : "Crawl"}
                    </button>

                    <button
                      onClick={() => loadPages(site.id)}
                      className="border px-3 py-1 rounded text-xs"
                    >
                      View
                    </button>

                    <button
                      onClick={() => clearCrawl(site.id)}
                      className="border border-orange-400 text-orange-500 px-3 py-1 rounded text-xs"
                    >
                      Clear
                    </button>

                    <button
                      onClick={() => removeSite(site.id)}
                      className="text-red-500 text-xs hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* SUBPAGE LIST */}
      {selectedSite && (
        <div className="mt-10 bg-white border rounded-xl p-5">
          <h2 className="font-bold mb-3">Subpages Crawled</h2>

          {pagesLoading && <div>Loading...</div>}

          {!pagesLoading && pages.length === 0 && (
            <div>No subpages found</div>
          )}

          {!pagesLoading && pages.length > 0 && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">URL</th>
                  <th className="p-3 text-center">Content</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((p, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-3 break-all">{p.url}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setSelectedPage(p)}
                        className="border px-3 py-1 rounded text-xs"
                      >
                        View Content
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* PAGE CONTENT */}
      {selectedPage && (
        <div className="mt-6 bg-white border rounded-xl p-5">
          <div className="flex justify-between items-center mb-2">
            <div className="font-semibold break-all">{selectedPage.url}</div>
            <button
              onClick={() => setSelectedPage(null)}
              className="text-sm text-red-500"
            >
              Close
            </button>
          </div>
          <pre className="bg-gray-50 p-4 text-sm whitespace-pre-wrap max-h-[400px] overflow-auto">
            {selectedPage.text}
          </pre>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  if (status === "indexed") return <span className="text-green-600">Indexed</span>;
  if (status === "indexing") return <span className="text-blue-600">Indexing</span>;
  if (status === "failed") return <span className="text-red-600">Failed</span>;
  if (status === "stopped") return <span className="text-yellow-600">Stopped</span>;
  return <span className="text-gray-400">Pending</span>;
}
