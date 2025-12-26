"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Lead {
  id: string;
  chatbotId: string;
  companyId: string;
  name?: string;
  email?: string;
  phone?: string;
  source?: string;
  stage?: string;
  createdAt?: number;
  updatedAt?: number;
}

export default function LeadsPage() {
  const pathname = usePathname();
  const lang = (pathname?.split("/")[1] as string) || "en";

  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ------------------------
  // LOAD LEADS
  // ------------------------
  const loadLeads = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/lead/list");
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load leads");
      }

      setLeads(data.leads || []);
      setError(null);
    } catch (err: any) {
      console.error("Lead load error:", err);
      setError(err.message);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLeads();
  }, []);

  // ------------------------
  // UI STATES
  // ------------------------
  if (loading)
    return <div className="p-12 text-center text-gray-500">Loading leads...</div>;

  if (error)
    return (
      <div className="p-12 text-center text-red-500">
        Failed to load leads: {error}
      </div>
    );

  if (leads.length === 0) {
    return (
      <div className="p-12 max-w-6xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-4">Leads</h1>
        <div className="text-gray-500">
          No leads captured yet.
        </div>
      </div>
    );
  }

  // ------------------------
  // MAIN VIEW
  // ------------------------
  return (
    <div className="p-10 max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Leads</h1>

        <button
          onClick={loadLeads}
          className="px-4 py-2 text-sm rounded border hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {/* TABLE */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-xs uppercase">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Source</th>
              <th className="p-3">Stage</th>
              <th className="p-3">Date</th>
              <th className="p-3 w-40">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-t hover:bg-gray-50">
                <td className="p-3">
                  {lead.name || <span className="text-gray-400">Unknown</span>}
                </td>
                <td className="p-3">
                  {lead.email || <span className="text-gray-400">–</span>}
                </td>
                <td className="p-3">
                  {lead.phone || <span className="text-gray-400">–</span>}
                </td>
                <td className="p-3 text-center">
                  {lead.source || "Chatbot"}
                </td>
                <td className="p-3 text-center">
                  <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-xs">
                    {lead.stage || "new"}
                  </span>
                </td>
                <td className="p-3 text-gray-500 text-xs text-center">
                  {lead.createdAt
                    ? new Date(lead.createdAt).toLocaleString()
                    : "-"}
                </td>
                <td className="p-3 text-center">
                  <Link
                    href={`/${lang}/dashboard/leads/${lead.id}`}
                    className="text-indigo-600 hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
