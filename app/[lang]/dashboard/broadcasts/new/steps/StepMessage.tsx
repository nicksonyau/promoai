"use client";

import { useMemo, useState } from "react";
import { useBroadcast } from "../BroadcastContext";
import { Attachment, TemplatePick } from "../types";
import { postJSON } from "../_lib/api";
import { Paperclip, Sparkles, Variable } from "lucide-react";

type UploadResp = {
  url: string;
  mime?: string;
  sizeBytes?: number;
  name?: string;
};

export default function StepMessage() {
  const {
    draft,
    update,
    addTemplate,
    updateTemplate,
    removeTemplate,
    replaceAttachments,
  } = useBroadcast();

  const templates = draft.templates ?? [];
  const attachments = draft.attachments ?? [];
  const message = draft.message ?? "";

  const [tmplId, setTmplId] = useState("");
  const [tmplName, setTmplName] = useState("");
  const [uploading, setUploading] = useState(false);

  const variables = useMemo(
    () => ["{first_name}", "{phone}", "{company}", "{last_order}", "{tag_vip}"],
    []
  );

  function insertText(token: string) {
    update({ message: (message || "") + token });
  }

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const next: Attachment[] = [...attachments];

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const id = crypto.randomUUID();

        // Try upload; if backend missing (404), keep localFile only (no fake).
        const r = await postJSON<UploadResp>("/api/uploads", {
          name: file.name,
          type: file.type,
          size: file.size,
        });

        if (r.ok && r.data?.url) {
          next.push({
            id,
            kind: guessKind(file.type),
            url: r.data.url,
            name: r.data.name || file.name,
            mime: r.data.mime || file.type,
            sizeBytes: r.data.sizeBytes || file.size,
          });
        } else {
          next.push({
            id,
            kind: guessKind(file.type),
            name: file.name,
            mime: file.type,
            sizeBytes: file.size,
            localFile: file,
          });
        }
      }
    } finally {
      setUploading(false);
      replaceAttachments(next);
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="text-lg font-semibold text-gray-900">Message</div>
        <div className="text-sm text-gray-600">
          Use templates (multiple allowed), variables, spintax, and file attachments.
        </div>
      </div>

      {/* Templates */}
      <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5 space-y-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">Templates</div>
          <div className="text-xs text-gray-500">
            Select multiple templates for rotation (like ChatDaddy).
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-3">
          <input
            value={tmplId}
            onChange={(e) => setTmplId(e.target.value)}
            placeholder="templateId"
            className="rounded-xl bg-gray-50 px-3 py-2 text-sm ring-1 ring-black/5 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            value={tmplName}
            onChange={(e) => setTmplName(e.target.value)}
            placeholder="template name (optional)"
            className="rounded-xl bg-gray-50 px-3 py-2 text-sm ring-1 ring-black/5 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="button"
            onClick={() => {
              const id = tmplId.trim();
              if (!id) return;

              const t: TemplatePick = {
                templateId: id,
                name: tmplName.trim() || undefined,
                weight: 1,
              };

              addTemplate(t);
              setTmplId("");
              setTmplName("");
            }}
            className="rounded-xl bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            Add template
          </button>
        </div>

        <div className="space-y-2">
          {templates.map((t) => (
            <div
              key={t.templateId}
              className="rounded-xl bg-gray-50 p-3 ring-1 ring-black/5 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">
                  {t.name || t.templateId}
                </div>
                <div className="text-xs text-gray-500 truncate">{t.templateId}</div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={t.weight ?? 1}
                  onChange={(e) =>
                    updateTemplate(t.templateId, { weight: Number(e.target.value) })
                  }
                  className="w-20 rounded-xl bg-white px-2 py-2 text-sm ring-1 ring-black/5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  title="Weight"
                />
                <button
                  type="button"
                  onClick={() => removeTemplate(t.templateId)}
                  className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-gray-900 ring-1 ring-black/5 hover:bg-gray-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          {!templates.length && (
            <div className="text-xs text-gray-500">No templates selected.</div>
          )}
        </div>
      </div>

      {/* Body message */}
      <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-gray-900">Body message</div>
            <div className="text-xs text-gray-500">
              Supports spintax: {"{Hi|Hello|Hey}"} and variables.
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => insertText("{Hi|Hello|Hey} ")}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-medium text-gray-900 ring-1 ring-black/5 hover:bg-gray-50"
              title="Insert spintax example"
            >
              <Sparkles className="h-4 w-4" /> Spintax
            </button>

            <button
              type="button"
              onClick={() => insertText("{first_name} ")}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-medium text-gray-900 ring-1 ring-black/5 hover:bg-gray-50"
              title="Insert variable example"
            >
              <Variable className="h-4 w-4" /> Variable
            </button>
          </div>
        </div>

        <textarea
          value={message}
          onChange={(e) => update({ message: e.target.value })}
          placeholder="Write your broadcast message..."
          className="min-h-[160px] w-full rounded-2xl bg-gray-50 px-3 py-2 text-sm ring-1 ring-black/5 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />

        <div className="flex flex-wrap gap-2">
          {variables.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => insertText(v)}
              className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
            >
              {v}
            </button>
          ))}
        </div>

        <div className="text-xs text-gray-500">
          WhatsApp formatting: <span className="font-mono">*bold*</span> ·{" "}
          <span className="font-mono">_italic_</span> ·{" "}
          <span className="font-mono">~strike~</span>
        </div>
      </div>

      {/* Attachments */}
      <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-900">Attachments</div>
            <div className="text-xs text-gray-500">
              Upload files (image/pdf/video). Backend optional.
            </div>
          </div>

          <label className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-3 py-2 text-sm font-medium text-white cursor-pointer hover:bg-purple-700">
            <Paperclip className="h-4 w-4" />
            {uploading ? "Uploading..." : "Add file"}
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
            />
          </label>
        </div>

        <div className="space-y-2">
          {attachments.map((a) => (
            <div
              key={a.id}
              className="rounded-xl bg-gray-50 p-3 ring-1 ring-black/5 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">
                  {a.name}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {a.mime || a.kind} ·{" "}
                  {a.sizeBytes ? Math.round(a.sizeBytes / 1024) + " KB" : "—"} ·{" "}
                  {a.url ? "uploaded" : "local only"}
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  replaceAttachments(attachments.filter((x) => x.id !== a.id))
                }
                className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-gray-900 ring-1 ring-black/5 hover:bg-gray-50"
              >
                Remove
              </button>
            </div>
          ))}

          {!attachments.length && <div className="text-xs text-gray-500">No files.</div>}
        </div>
      </div>
    </div>
  );
}

function guessKind(mime: string): Attachment["kind"] {
  const m = (mime || "").toLowerCase();
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("video/")) return "video";
  return "document";
}
