// app/[lang]/dashboard/inbox/_components/InboxHeader.tsx
"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";

export default function InboxHeader({
  lang,
  onRefresh,
}: {
  lang: string;
  onRefresh: () => void | Promise<void>;
}) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Inbox</h1>
        <p className="text-sm text-gray-500">WhatsApp-first conversations</p>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href={`/${lang}/dashboard/channels`}
          className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium"
        >
          Channels
        </Link>

        <button
          onClick={() => onRefresh()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>
    </div>
  );
}
