"use client";

import Link from "next/link";
import { Activity, LayoutList, Link2, Settings, FileText, ClipboardList, BookOpen } from "lucide-react";
import { Card, PageShell } from "./_ui";

export default function WebhooksHomePage() {
  const cards = [
    { title: "Event Types", desc: "Define what events your system emits.", href: "./webhooks/event-types", icon: <LayoutList className="h-5 w-5" /> },
    { title: "Subscriptions", desc: "Create endpoints and subscribe to events.", href: "./webhooks/subscriptions", icon: <Link2 className="h-5 w-5" /> },
    { title: "Events", desc: "Browse emitted events and delivery status.", href: "./webhooks/events", icon: <FileText className="h-5 w-5" /> },
    { title: "Request Attempts", desc: "Inspect retries, response codes, and payloads.", href: "./webhooks/attempts", icon: <ClipboardList className="h-5 w-5" /> },
    { title: "Settings", desc: "Configure signing, retries, timeouts.", href: "./webhooks/settings", icon: <Settings className="h-5 w-5" /> },
    { title: "API Documentation", desc: "Copy/paste examples for developers.", href: "./webhooks/docs", icon: <BookOpen className="h-5 w-5" /> },
  ];

  return (
    <PageShell
      title="Webhooks"
      subtitle="Hook0-style event delivery: define events → subscribe endpoints → inspect deliveries → retry safely."
      right={<div className="text-xs text-gray-500 inline-flex items-center gap-2"><Activity className="h-4 w-4" /> Live</div>}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((c) => (
          <Link key={c.title} href={c.href} className="block">
            <Card>
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center">
                  {c.icon}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900">{c.title}</div>
                  <div className="text-sm text-gray-500 mt-1">{c.desc}</div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
