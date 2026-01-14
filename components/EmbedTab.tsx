"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/api/config";

type EmbedType = "chatwidget" | "chatpage" | "js";

type EmbedData = {
  head?: string;
  body?: string;
  script?: string;
  previewUrl?: string;
  raw?: string;
};

export default function EmbedTab({
  chatbotId,
  buildHeaders,
}: {
  chatbotId: string | null;
  buildHeaders: () => Record<string, string>;
}) {
  const [type, setType] = useState<EmbedType>("chatwidget");
  const [data, setData] = useState<EmbedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);

  const endpointMap: Record<EmbedType, string[]> = {
    chatwidget: [
      `/chatwidget/embed/${chatbotId}`,
      `/chatwidget/${chatbotId}/embed`,
    ],
    chatpage: [
      `/chatpage/embed/${chatbotId}`,
      `/chatpage/${chatbotId}/embed`,
    ],
    js: [
      `/chatwidget/js/${chatbotId}`,
      `/chatpage/js/${chatbotId}`,
      `/embed/js/${chatbotId}`,
    ],
  };

  async function loadEmbed() {
    if (!chatbotId) return;
    setLoading(true);
    setError(null);
    setData(null);

    for (const p of endpointMap[type]) {
      try {
        const res = await fetch(`${API_URL}${p}`, {
          headers: buildHeaders(),
        });
        if (!res.ok) continue;

        const text = await res.text();
        try {
          const json = JSON.parse(text);
          const d = json?.data ?? json;
          setData({
            head: d.head,
            body: d.body,
            script: d.script,
            previewUrl: d.previewUrl,
            raw: JSON.stringify(json, null, 2),
          });
        } catch {
          setData({ body: text, raw: text });
        }
        return;
      } catch {
        continue;
      }
    }

    setError("No valid embed endpoint found for this type.");
    setLoading(false);
  }

  useEffect(() => {
    if (chatbotId) loadEmbed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatbotId, type]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    } catch {
      alert("Copy failed.");
    }
  };

  const reloadPreview = () => setIframeKey((k) => k + 1);

  const resolvedPreview =
    data?.previewUrl && data.previewUrl.startsWith("http")
      ? data.previewUrl
      : undefined;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-sm font-semibold text-gray-900">Embed Type</div>
          <div className="text-xs text-gray-500">
            Select the embed type to generate code.
          </div>
        </div>
        <select
          className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          value={type}
          onChange={(e) => setType(e.target.value as EmbedType)}
        >
          <option value="chatwidget">Chat Widget</option>
          <option value="chatpage">Chat Page</option>
          <option value="js">JS Embed</option>
        </select>
      </div>

      {loading && <div className="text-gray-500 text-sm">Loading...</div>}
      {error && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-md p-3">
          {error}
        </div>
      )}

      {data && (
        <div className="space-y-4">
          {data.head && (
            <CodeBlock
              title="Head Embed"
              code={data.head}
              onCopy={() => copy(data.head!)}
            />
          )}
          {data.body && (
            <CodeBlock
              title="Body Embed"
              code={data.body}
              onCopy={() => copy(data.body!)}
            />
          )}
          {data.script && (
            <CodeBlock
              title="Script Embed"
              code={data.script}
              onCopy={() => copy(data.script!)}
            />
          )}

          {!data.head && !data.body && !data.script && (
            <CodeBlock
              title="Raw Response"
              code={data.raw || ""}
              onCopy={() => copy(data.raw || "")}
            />
          )}
        </div>
      )}

      {resolvedPreview && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="font-semibold text-sm text-gray-700">
              Live Preview
            </div>
            <button
              onClick={reloadPreview}
              className="text-xs text-indigo-600 hover:text-indigo-700"
            >
              Reload
            </button>
          </div>
          <iframe
            key={iframeKey}
            src={resolvedPreview}
            className="w-full h-96 border rounded-xl"
          />
        </div>
      )}
    </div>
  );
}

function CodeBlock({
  title,
  code,
  onCopy,
}: {
  title: string;
  code: string;
  onCopy: () => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm ring-1 ring-gray-200 p-4">
      <div className="flex justify-between items-center mb-2">
        <div className="font-semibold text-gray-800 text-sm">{title}</div>
        <button
          onClick={onCopy}
          className="text-xs text-indigo-600 hover:text-indigo-700"
        >
          Copy
        </button>
      </div>
      <pre className="text-xs bg-gray-50 p-3 rounded-md overflow-auto whitespace-pre-wrap">
        {code}
      </pre>
    </div>
  );
}
