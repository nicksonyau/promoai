"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import Image from "next/image";

import Card from "@/app/components/ui/Card";
import Button from "@/app/components/ui/Button";
import { apiFetch } from "@/lib/api";

export default dynamic(() => Promise.resolve(DeviceBindingPage), { ssr: false });

function DeviceBindingPage() {
  const params = useParams();
  const sessionId = params?.sessionId as string;

  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState<any>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [ready, setReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ⭐ NEW — required
  async function startSession() {
    try {
      await fetch(`https://wa.thrivosign.uk/start-session?sessionId=${sessionId}`, {
        method: "POST"
      });
      console.log("⚡ start-session triggered");
    } catch (err) {
      console.error("❌ start-session failed", err);
    }
  }

  async function loadDevice() {
    try {
      const res = await apiFetch(`/devices/${sessionId}`);
      const data = await res.json();

      if (!res.ok || !data.device)
        throw new Error(data.error || "Load device failed");

      setDevice(data.device);
      setReady(data.device.ready || false);
      setQr(data.device.qr || null);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    startSession();     // ⭐ required for QR to appear
    loadDevice();

    const interval = setInterval(() => {
      apiFetch(`/devices/${sessionId}`)
        .then(res => res.json())
        .then(data => {
          if (data.device) {
            setDevice(data.device);
            setReady(data.device.ready || false);
            setQr(data.device.qr || null);
          }
        })
        .catch(() => {});
    }, 3000);

    return () => clearInterval(interval);
  }, [sessionId]);

  if (loading) return <div className="p-10 text-center text-gray-500">Loading…</div>;
  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;
  if (!device) return <div className="p-10 text-center text-red-500">Device not found</div>;

  return (
    <div className="page-container">
      <Card className="p-6 max-w-xl mx-auto">
        <h2 className="text-xl font-bold mb-4">WhatsApp Device Binding</h2>

        <div className="mb-6">
          {ready ? (
            <p className="text-green-600 font-semibold">
              ✅ Connected {device.number ? `as ${device.number}` : ""}
            </p>
          ) : (
            <p className="text-yellow-600 font-semibold">Connecting… scan QR to bind</p>
          )}
        </div>

        {!ready && qr && (
          <div className="flex flex-col items-center mb-6">
            <Image
              src={qr}
              alt="QR Code"
              width={250}
              height={250}
              className="border rounded shadow bg-white"
            />
            <p className="text-sm text-gray-500 mt-2">
              Scan this QR code with WhatsApp.
            </p>
          </div>
        )}

        {ready && (
          <>
            <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded mb-6">
              WhatsApp session is active.
            </div>

            <div className="space-y-3 text-gray-700">
              {device.number && (
                <div className="flex items-center justify-between p-3 border rounded bg-gray-50">
                  <span className="font-medium">Phone Number:</span>
                  <span className="text-green-700">{device.number}</span>
                </div>
              )}

              {device.meta?.name && (
                <div className="flex items-center justify-between p-3 border rounded bg-gray-50">
                  <span className="font-medium">WhatsApp Name:</span>
                  <span className="text-purple-700">{device.meta.name}</span>
                </div>
              )}

              {device.jid && (
                <div className="flex items-center justify-between p-3 border rounded bg-gray-50">
                  <span className="font-medium">JID:</span>
                  <span className="text-gray-600 text-sm">{device.jid}</span>
                </div>
              )}
            </div>
          </>
        )}

        <Button className="w-full btn-secondary mt-6" onClick={loadDevice}>
          Refresh Status
        </Button>
      </Card>
    </div>
  );
}
