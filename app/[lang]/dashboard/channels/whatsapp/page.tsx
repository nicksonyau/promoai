"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";

import Card from "@/app/components/ui/Card";
import Button from "@/app/components/ui/Button";
import useTranslations from "@/app/hooks/useTranslations";
import { toast } from "react-hot-toast";
import { apiFetch } from "@/lib/api";

import { Smartphone, Plus, Trash2, CheckCircle, XCircle } from "lucide-react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";

function WhatsAppDevicesPage() {
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const { t } = useTranslations(lang);

  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // ----------------------------------------
  // LOAD DEVICES
  // ----------------------------------------
  async function loadDevices() {
    try {
      setLoading(true);
      setError(null);

      const res = await apiFetch("/devices");
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load devices");
      }

      setDevices(data.devices || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }

  // ----------------------------------------
  // CREATE DEVICE
  // ----------------------------------------
  async function handleAddDevice() {
    try {
      setCreating(true);
      setError(null);

      const res = await apiFetch("/devices/create", { method: "POST" });
      const data = await res.json();

      if (!res.ok || !data.sessionId) {
        throw new Error(data.error || "Create failed");
      }

      toast.success("Device created! Redirecting...");
      window.location.href = `/en/dashboard/channels/whatsapp/${data.sessionId}`;
    } catch (err: any) {
      console.error(err);
      toast.error(err.message);
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  // ----------------------------------------
  // DELETE DEVICE
  // ----------------------------------------
  async function handleDeleteDevice(sessionId: string) {
    if (!confirm("Delete this device?")) return;

    try {
      setDeleting(sessionId);

      const res = await apiFetch(`/devices/delete/${sessionId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Delete failed");

      toast.success("Device deleted");
      setDevices(prev => prev.filter(d => d.sessionId !== sessionId));
    } catch (err: any) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setDeleting(null);
    }
  }

  useEffect(() => {
    loadDevices();
  }, []);

  return (
    <div className="page-container">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-2">
          {t("whatsapp.devices_title") || "WhatsApp Devices"}
        </h2>

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-center gap-2 bg-red-100 text-red-700 border border-red-300 p-3 rounded-lg text-sm">
            <ExclamationTriangleIcon className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Add Device */}
        <Button
          onClick={handleAddDevice}
          disabled={creating}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {creating ? "Creating..." : "Add WhatsApp Device"}
        </Button>

        {loading && <p className="mt-4 text-muted">Loading devices...</p>}

        {!loading && devices.length === 0 && (
          <p className="mt-4 text-muted">No devices yet. Add one to get started.</p>
        )}

        {/* Device List */}
        <div className="mt-6 space-y-3">
          {devices.map(d => {
            const connected = d.ready && d.number;

            return (
              <div
                key={d.sessionId}
                className="border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition"
              >
                {/* Left Block */}
                <Link
                  href={`/en/dashboard/channels/whatsapp/${d.sessionId}`}
                  className="flex items-center gap-3 flex-1"
                >
                  <Smartphone className="w-6 h-6 text-purple-600" />

                  <div>
                    <p className="font-semibold">
                      {connected ? d.number : "Unlinked Device"}
                    </p>

                    {/* Status */}
                    <div className="flex items-center gap-1 text-sm">
                      {connected ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-green-600">Connected</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-red-500">Not Connected</span>
                        </>
                      )}
                    </div>

                    {/* Extra info only if connected */}
                    {connected && (
                      <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                        <p>JID: {d.jid}</p>
                        <p>Session ID: {d.sessionId}</p>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Delete only when unlinked */}
                {!connected && (
                  <button
                    onClick={() => handleDeleteDevice(d.sessionId)}
                    disabled={deleting === d.sessionId}
                    className="p-2 rounded hover:bg-red-50"
                  >
                    <Trash2
                      className={`w-5 h-5 ${
                        deleting === d.sessionId
                          ? "text-gray-400 animate-pulse"
                          : "text-red-600"
                      }`}
                    />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

export default dynamic(() => Promise.resolve(WhatsAppDevicesPage), { ssr: false });
