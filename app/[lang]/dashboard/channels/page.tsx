"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { MessageCircle, Cloud, Lock } from "lucide-react";

export default function ChannelsPage() {
  const { lang } = useParams<{ lang: string }>();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Channels</h1>
        <p className="text-gray-600">Manage your communication channels.</p>
      </div>

      {/* Channel cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* WhatsApp Sandbox / Personal */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-green-100 text-green-600">
              <MessageCircle className="w-6 h-6" />
            </div>

            <div>
              <h2 className="font-bold text-gray-800">
                WhatsApp (Sandbox / Personal)
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Use your personal or sandbox WhatsApp number for testing and
                small-scale messaging.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href={`/${lang}/dashboard/channels/whatsapp`}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
            >
              Manage
            </Link>
          </div>
        </div>

        {/* WhatsApp Cloud API */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm opacity-60 flex flex-col justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-gray-100 text-gray-500">
              <Cloud className="w-6 h-6" />
            </div>

            <div>
              <h2 className="font-bold text-gray-800">WhatsApp Cloud API</h2>
              <p className="text-sm text-gray-500 mt-1">
                Official WhatsApp Business API for high-volume and production
                use.
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
            <Lock className="w-4 h-4" />
            Coming Soon
          </div>
        </div>
      </div>
    </div>
  );
}
