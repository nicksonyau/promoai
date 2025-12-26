"use client";

import { useMemo, useState } from "react";
import { Card, PageShell, CodeBlock, CopyButton, TextInput, Pill } from "../_ui";

export default function WebhookDocsPage() {
  const [baseUrl, setBaseUrl] = useState("https://api.yourdomain.com");
  const [apiKey, setApiKey] = useState("YOUR_API_KEY");

  const curlCreate = useMemo(() => {
    return `curl -X POST "${baseUrl}/webhooks/subscriptions/create" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com/webhook",
    "enabled": true,
    "eventTypeIds": ["evt_123","evt_456"],
    "signing": { "mode": "hmac-sha256" }
  }'`;
  }, [baseUrl, apiKey]);

  const verifySig = useMemo(() => {
    return `// Pseudo: verify signature (HMAC-SHA256)
const crypto = require("crypto");

function verify(rawBody, secret, providedSig) {
  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  // timing-safe compare in production
  return digest === providedSig;
}`;
  }, []);

  return (
    <PageShell
      title="API Documentation"
      subtitle="Copy/paste examples for integrating with your webhook delivery system."
      right={<Pill tone="purple">Hook0-style</Pill>}
    >
      <Card title="Quick config">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextInput label="API Base URL" value={baseUrl} onChange={setBaseUrl} placeholder="https://api.yourdomain.com" />
          <TextInput label="API Key" value={apiKey} onChange={setApiKey} placeholder="YOUR_API_KEY" />
        </div>
      </Card>

      <div className="mt-6" />

      <Card title="Create subscription" right={<CopyButton text={curlCreate} />}>
        <CodeBlock value={curlCreate} />
      </Card>

      <div className="mt-6" />

      <Card title="Verify signature (example)" right={<CopyButton text={verifySig} />}>
        <CodeBlock value={verifySig} />
      </Card>

      <div className="mt-6" />

      <Card title="Delivery payload (recommended shape)">
        <CodeBlock
          value={`{
  "id": "evt_delivery_123",
  "event": {
    "id": "evt_abc",
    "type": "invoice.paid",
    "createdAt": "2026-01-01T10:00:00Z",
    "payload": { "invoiceId": "inv_1", "amount": 1990 }
  },
  "subscriptionId": "sub_123",
  "attempt": 1
}`}
        />
        <div className="text-xs text-gray-500 mt-3">
          Map this to your real backend response. Keep it stable for developers.
        </div>
      </Card>
    </PageShell>
  );
}
