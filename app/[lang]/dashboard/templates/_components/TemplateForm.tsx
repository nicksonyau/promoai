"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Trash2, Send } from "lucide-react";

export type TemplateStatus = "draft" | "submitted" | "approved" | "rejected";

export type TemplateButton = {
  type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER";
  text: string;
  url?: string;
  phone?: string;
};

type FormValues = {
  name: string;
  category: "UTILITY" | "MARKETING" | "AUTHENTICATION";
  language: string;
  body: string;
  footer: string;
  buttons: TemplateButton[];
};

type Props = {
  lang: string;
  mode: "create" | "edit";
  initial?: Partial<FormValues>;
  status?: TemplateStatus;
  loading?: boolean;

  // lock edits when submitted/approved (official template behavior)
  locked?: boolean;

  onSave: (payload: {
    name: string;
    category: FormValues["category"];
    language: string;
    components: any[];
  }) => Promise<void>;

  // optional submit-for-approval (official)
  onSubmitForApproval?: () => Promise<void>;

  backHref: string;
};

function cn(...a: Array<string | false | undefined | null>) {
  return a.filter(Boolean).join(" ");
}

function isSnakeCase(v: string) {
  return /^[a-z0-9_]+$/.test(v);
}

function extractVars(text: string) {
  return [...text.matchAll(/{{(\d+)}}/g)].map((m) => Number(m[1]));
}

function varsSequential(nums: number[]) {
  if (nums.length === 0) return true;
  const max = Math.max(...nums);
  for (let i = 1; i <= max; i++) if (!nums.includes(i)) return false;
  return true;
}

function buildComponents(body: string, footer: string, buttons: TemplateButton[]) {
  const comps: any[] = [{ type: "BODY", text: body }];

  if (footer.trim()) comps.push({ type: "FOOTER", text: footer.trim() });

  if (buttons.length) {
    comps.push({
      type: "BUTTONS",
      buttons: buttons.map((b) => ({
        type: b.type,
        text: b.text,
        url: b.type === "URL" ? b.url : undefined,
        phone: b.type === "PHONE_NUMBER" ? b.phone : undefined,
      })),
    });
  }

  return comps;
}

function StatusPill({ status }: { status?: TemplateStatus }) {
  const base =
    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border";
  if (status === "approved")
    return (
      <span className={cn(base, "bg-green-50 text-green-700 border-green-200")}>
        Approved
      </span>
    );
  if (status === "submitted")
    return (
      <span className={cn(base, "bg-yellow-50 text-yellow-800 border-yellow-200")}>
        Submitted
      </span>
    );
  if (status === "rejected")
    return (
      <span className={cn(base, "bg-red-50 text-red-700 border-red-200")}>
        Rejected
      </span>
    );
  return (
    <span className={cn(base, "bg-gray-50 text-gray-700 border-gray-200")}>
      Draft
    </span>
  );
}

export function TemplateForm({
  lang,
  mode,
  initial,
  status,
  loading,
  locked,
  onSave,
  onSubmitForApproval,
  backHref,
}: Props) {
  // Local state
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<FormValues["category"]>(
    (initial?.category as any) ?? "UTILITY"
  );
  const [language, setLanguage] = useState(initial?.language ?? "en");
  const [body, setBody] = useState(initial?.body ?? "");
  const [footer, setFooter] = useState(initial?.footer ?? "");
  const [buttons, setButtons] = useState<TemplateButton[]>(initial?.buttons ?? []);

  // Preview hidden by default (single-form feeling)
  const [showPreview, setShowPreview] = useState(false);

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // field-level errors
  const [errTop, setErrTop] = useState<string | null>(null);
  const [errName, setErrName] = useState<string | null>(null);
  const [errBody, setErrBody] = useState<string | null>(null);
  const [errButtons, setErrButtons] = useState<string | null>(null);

  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  // ✅ Hydrate edit form ONCE when initial arrives (do not override user edits)
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (mode !== "edit") return;
    if (!initial) return;
    if (hydratedRef.current) return;

    setName(initial.name ?? "");
    setCategory(((initial.category as any) ?? "UTILITY") as any);
    setLanguage(initial.language ?? "en");
    setBody(initial.body ?? "");
    setFooter(initial.footer ?? "");
    setButtons(initial.buttons ?? []);

    hydratedRef.current = true;
  }, [mode, initial]);

  const varNums = useMemo(() => extractVars(body), [body]);
  const varsOk = useMemo(() => varsSequential(varNums), [varNums]);

  const disabled = !!loading || !!locked || saving || submitting;

  function clearErrors() {
    setErrTop(null);
    setErrName(null);
    setErrBody(null);
    setErrButtons(null);
  }

  function validate(): boolean {
    clearErrors();

    const n = name.trim();
    if (!n) {
      setErrName("Template name is required.");
      setErrTop("Please fix the highlighted fields.");
      return false;
    }
    if (!isSnakeCase(n)) {
      setErrName("Use lowercase snake_case only (a-z, 0-9, _).");
      setErrTop("Please fix the highlighted fields.");
      return false;
    }

    if (!body.trim()) {
      setErrBody("Message body is required.");
      setErrTop("Please fix the highlighted fields.");
      return false;
    }
    if (!varsOk) {
      setErrBody("Variables must be sequential ({{1}}, {{2}}, ...).");
      setErrTop("Please fix the highlighted fields.");
      return false;
    }

    if (buttons.length > 3) {
      setErrButtons("Max 3 buttons allowed.");
      setErrTop("Please fix the highlighted fields.");
      return false;
    }

    for (const b of buttons) {
      if (!b.text?.trim()) {
        setErrButtons("Button text is required.");
        setErrTop("Please fix the highlighted fields.");
        return false;
      }
      if (b.type === "URL" && !b.url?.trim()) {
        setErrButtons("URL button must include a URL.");
        setErrTop("Please fix the highlighted fields.");
        return false;
      }
      if (b.type === "PHONE_NUMBER" && !b.phone?.trim()) {
        setErrButtons("Phone button must include a phone number.");
        setErrTop("Please fix the highlighted fields.");
        return false;
      }
    }

    return true;
  }

  function insertVariableAtCursor() {
    if (disabled) return;

    const next = (body.match(/{{\d+}}/g)?.length || 0) + 1;
    const token = `{{${next}}}`;

    const el = bodyRef.current;
    if (!el) {
      setBody((b) => (b ? b + " " + token : token));
      return;
    }

    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const before = body.slice(0, start);
    const after = body.slice(end);

    const spacerLeft = before.endsWith(" ") || before.length === 0 ? "" : " ";
    const spacerRight = after.startsWith(" ") || after.length === 0 ? "" : " ";

    const nextBody = `${before}${spacerLeft}${token}${spacerRight}${after}`;
    setBody(nextBody);

    requestAnimationFrame(() => {
      const pos = (before + spacerLeft + token).length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  }

  function addButton(type: TemplateButton["type"]) {
    if (disabled) return;
    if (buttons.length >= 3) return;
    setButtons((prev) => [...prev, { type, text: "" }]);
  }

  function updateButton(i: number, patch: Partial<TemplateButton>) {
    if (disabled) return;
    setButtons((prev) => prev.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  }

  function removeButton(i: number) {
    if (disabled) return;
    setButtons((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    if (disabled) return;
    if (!validate()) return;

    setSaving(true);
    try {
      const components = buildComponents(body, footer, buttons);
      await onSave({
        name: name.trim(),
        category,
        language,
        components,
      });
    } catch (e: any) {
      setErrTop(e?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    if (disabled) return;
    if (!onSubmitForApproval) return;

    if (!validate()) return;

    const ok = window.confirm("Submit this template for approval?");
    if (!ok) return;

    setSubmitting(true);
    try {
      await onSubmitForApproval();
    } catch (e: any) {
      setErrTop(e?.message || "Failed to submit.");
    } finally {
      setSubmitting(false);
    }
  }

  const previewText = useMemo(() => {
    const unique = Array.from(new Set(varNums)).sort((a, b) => a - b);
    let t = body;
    for (const n of unique) t = t.replaceAll(`{{${n}}}`, `[${n}]`);
    return t || "Your message preview will appear here…";
  }, [body, varNums]);

  const title = mode === "create" ? "Create WhatsApp Template" : "Edit WhatsApp Template";

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500">
            Build reusable message templates for Broadcast & Automation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <StatusPill status={status} />
          {locked && <span className="text-xs text-gray-500">Locked after submit/approval</span>}
        </div>
      </div>

      {errTop && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errTop}
        </div>
      )}

      <div className="space-y-6">
        {/* Basics */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Basics</h2>
            <p className="text-xs text-gray-500">Name must be unique and snake_case.</p>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-800">Template name</label>
              <input
                value={name}
                disabled={disabled}
                onChange={(e) => setName(e.target.value)}
                placeholder="snake_case_only"
                className={cn(
                  "w-full rounded-xl border px-3 py-2 text-sm outline-none",
                  "focus:ring-2 focus:ring-purple-200 focus:border-purple-300",
                  "disabled:bg-gray-50 disabled:text-gray-500",
                  errName
                    ? "border-red-300 focus:ring-red-100 focus:border-red-300"
                    : "border-gray-200"
                )}
              />
              {errName ? (
                <p className="text-xs text-red-600">{errName}</p>
              ) : (
                <p className="text-xs text-gray-500">
                  Example: order_update, promo_voucher, otp_login
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-800">Category</label>
                <select
                  value={category}
                  disabled={disabled}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className={cn(
                    "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none",
                    "focus:ring-2 focus:ring-purple-200 focus:border-purple-300",
                    "disabled:bg-gray-50 disabled:text-gray-500"
                  )}
                >
                  <option value="UTILITY">Utility</option>
                  <option value="MARKETING">Marketing</option>
                  <option value="AUTHENTICATION">Authentication</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-800">Language</label>
                <select
                  value={language}
                  disabled={disabled}
                  onChange={(e) => setLanguage(e.target.value)}
                  className={cn(
                    "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none",
                    "focus:ring-2 focus:ring-purple-200 focus:border-purple-300",
                    "disabled:bg-gray-50 disabled:text-gray-500"
                  )}
                >
                  <option value="en">English</option>
                  <option value="ms">Malay</option>
                  <option value="zh_CN">Chinese (zh_CN)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Message + Preview inside same card */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Message</h2>
              <p className="text-xs text-gray-500">
                Use {"{{1}}"}, {"{{2}}"} for variables.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowPreview((v) => !v)}
                className={cn(
                  "text-xs font-medium",
                  showPreview ? "text-gray-700" : "text-gray-500",
                  "hover:text-gray-900"
                )}
              >
                {showPreview ? "Hide Preview" : "Show Preview"}
              </button>

              <span className={cn("text-xs font-medium", varsOk ? "text-green-700" : "text-red-600")}>
                {varsOk ? "Variables OK" : "Variables not sequential"}
              </span>

              <button
                type="button"
                onClick={insertVariableAtCursor}
                disabled={disabled}
                className={cn(
                  "text-xs font-medium text-purple-600 hover:text-purple-700",
                  "disabled:text-gray-400"
                )}
              >
                + Insert Variable
              </button>
            </div>
          </div>

          <div className="p-6 space-y-2">
            <textarea
              ref={bodyRef}
              value={body}
              disabled={disabled}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Hi {{1}}, your order {{2}} is confirmed."
              className={cn(
                "w-full min-h-[140px] rounded-xl border px-3 py-2 text-sm outline-none",
                "focus:ring-2 focus:ring-purple-200 focus:border-purple-300",
                "disabled:bg-gray-50 disabled:text-gray-500",
                errBody
                  ? "border-red-300 focus:ring-red-100 focus:border-red-300"
                  : "border-gray-200"
              )}
            />

            {errBody ? (
              <p className="text-xs text-red-600">{errBody}</p>
            ) : (
              <p className="text-xs text-gray-500">
                Detected:{" "}
                {varNums.length
                  ? Array.from(new Set(varNums))
                      .sort((a, b) => a - b)
                      .map((n) => `{{${n}}}`)
                      .join(", ")
                  : "No variables"}
              </p>
            )}

            {showPreview && (
              <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-xs text-gray-500 mb-2">WhatsApp Preview</div>

                <div className="rounded-2xl bg-white border border-gray-200 p-3 text-sm text-gray-800 whitespace-pre-wrap">
                  {previewText}
                </div>

                {footer.trim() && (
                  <div className="mt-2 text-xs text-gray-500 whitespace-pre-wrap">
                    {footer.trim()}
                  </div>
                )}

                {buttons.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {buttons.map((b, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700"
                      >
                        {b.text || "Button"}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 text-xs text-gray-500">
                  Notes:
                  <ul className="list-disc ml-4 mt-1 space-y-1">
                    <li>
                      Official/WABA: broadcast should use <b>approved</b> templates only.
                    </li>
                    <li>Unofficial: templates are reusable message blueprints.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Footer</h2>
            <p className="text-xs text-gray-500">Optional disclaimer or helper text.</p>
          </div>

          <div className="p-6">
            <input
              value={footer}
              disabled={disabled}
              onChange={(e) => setFooter(e.target.value)}
              placeholder="Footer (optional)"
              className={cn(
                "w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none",
                "focus:ring-2 focus:ring-purple-200 focus:border-purple-300",
                "disabled:bg-gray-50 disabled:text-gray-500"
              )}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Buttons</h2>
              <p className="text-xs text-gray-500">Optional. Max 3 buttons.</p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => addButton("QUICK_REPLY")}
                disabled={disabled || buttons.length >= 3}
                className="text-xs rounded-lg border border-gray-200 px-2 py-1 hover:bg-gray-50 disabled:opacity-50"
              >
                + Quick Reply
              </button>
              <button
                type="button"
                onClick={() => addButton("URL")}
                disabled={disabled || buttons.length >= 3}
                className="text-xs rounded-lg border border-gray-200 px-2 py-1 hover:bg-gray-50 disabled:opacity-50"
              >
                + URL
              </button>
              <button
                type="button"
                onClick={() => addButton("PHONE_NUMBER")}
                disabled={disabled || buttons.length >= 3}
                className="text-xs rounded-lg border border-gray-200 px-2 py-1 hover:bg-gray-50 disabled:opacity-50"
              >
                + Phone
              </button>
            </div>
          </div>

          <div className="p-6 space-y-3">
            {errButtons && <p className="text-xs text-red-600">{errButtons}</p>}

            {buttons.length === 0 ? (
              <div className="text-sm text-gray-500">No buttons added.</div>
            ) : (
              buttons.map((b, i) => (
                <div key={i} className="rounded-xl border border-gray-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs font-medium text-gray-700">
                      {b.type === "QUICK_REPLY" && "Quick Reply"}
                      {b.type === "URL" && "URL Button"}
                      {b.type === "PHONE_NUMBER" && "Phone Button"}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeButton(i)}
                      disabled={disabled}
                      className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-700">Text</label>
                      <input
                        value={b.text}
                        disabled={disabled}
                        onChange={(e) => updateButton(i, { text: e.target.value })}
                        placeholder="Button text"
                        className={cn(
                          "w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none",
                          "focus:ring-2 focus:ring-purple-200 focus:border-purple-300",
                          "disabled:bg-gray-50 disabled:text-gray-500"
                        )}
                      />
                    </div>

                    {b.type === "URL" && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-700">URL</label>
                        <input
                          value={b.url || ""}
                          disabled={disabled}
                          onChange={(e) => updateButton(i, { url: e.target.value })}
                          placeholder="https://..."
                          className={cn(
                            "w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none",
                            "focus:ring-2 focus:ring-purple-200 focus:border-purple-300",
                            "disabled:bg-gray-50 disabled:text-gray-500"
                          )}
                        />
                      </div>
                    )}

                    {b.type === "PHONE_NUMBER" && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-700">Phone</label>
                        <input
                          value={b.phone || ""}
                          disabled={disabled}
                          onChange={(e) => updateButton(i, { phone: e.target.value })}
                          placeholder="+60123456789"
                          className={cn(
                            "w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none",
                            "focus:ring-2 focus:ring-purple-200 focus:border-purple-300",
                            "disabled:bg-gray-50 disabled:text-gray-500"
                          )}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sticky action bar */}
        <div className="sticky bottom-4 z-10">
          <div className="rounded-2xl border border-gray-200 bg-white/90 backdrop-blur shadow-sm px-4 py-3 flex items-center justify-between">
            <Link href={backHref} className="text-sm text-gray-600 hover:text-gray-900">
              ← Back
            </Link>

            <div className="flex items-center gap-3">
              {onSubmitForApproval &&
                !locked &&
                (status === "draft" || status === "rejected" || !status) && (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={disabled}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm",
                      "hover:bg-gray-50 disabled:opacity-50"
                    )}
                  >
                    <Send className="w-4 h-4" />
                    {submitting ? "Submitting..." : "Submit"}
                  </button>
                )}

              <button
                type="button"
                onClick={handleSave}
                disabled={disabled}
                className={cn(
                  "rounded-xl bg-purple-600 px-5 py-2 text-sm font-medium text-white",
                  "hover:bg-purple-700 disabled:opacity-50"
                )}
              >
                {saving ? "Saving..." : mode === "create" ? "Create Template" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
