"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Loader2, Search, X } from "lucide-react";

// -----------------------------
// Small helpers
// -----------------------------
export function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export function errMsg(e: any) {
  return String(e?.message || e || "Request failed");
}

export function fmtDate(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export function safeJsonParse<T = any>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function prettyJson(v: any) {
  try {
    return JSON.stringify(v ?? null, null, 2);
  } catch {
    return String(v);
  }
}

// -----------------------------
// Layout
// -----------------------------
export function PageShell({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="p-8 max-w-7xl">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          {subtitle ? <p className="text-sm text-gray-500 mt-1">{subtitle}</p> : null}
        </div>
        {right ? <div className="flex items-center gap-3">{right}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function Card({
  title,
  right,
  children,
}: {
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
      {title ? (
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-gray-800">{title}</div>
          {right}
        </div>
      ) : null}
      <div className={title ? "mt-4" : ""}>{children}</div>
    </div>
  );
}

export function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="py-10 text-center text-gray-500">
      <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" />
      {label}
    </div>
  );
}

export function Pill({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "gray" | "green" | "red" | "yellow" | "purple" | "blue";
}) {
  const cls =
    tone === "green"
      ? "bg-green-50 text-green-700"
      : tone === "red"
      ? "bg-red-50 text-red-700"
      : tone === "yellow"
      ? "bg-yellow-50 text-yellow-700"
      : tone === "purple"
      ? "bg-purple-50 text-purple-700"
      : tone === "blue"
      ? "bg-blue-50 text-blue-700"
      : "bg-gray-100 text-gray-700";

  return <span className={cn("inline-flex items-center rounded-full px-2 py-1 text-xs", cls)}>{children}</span>;
}

export function Divider() {
  return <div className="h-px bg-gray-100 my-4" />;
}

// -----------------------------
// Inputs
// -----------------------------
export function TextInput({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block text-sm space-y-1">
      <span className="text-gray-600">{label}</span>
      <input
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 px-3 py-2 bg-white disabled:bg-gray-50 disabled:text-gray-500 outline-none"
      />
    </label>
  );
}

export function SelectInput({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  disabled?: boolean;
}) {
  return (
    <label className="block text-sm space-y-1">
      <span className="text-gray-600">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-gray-200 px-3 py-2 bg-white disabled:bg-gray-50 disabled:text-gray-500 outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ToggleRow({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-900">{label}</div>
        {hint ? <div className="text-xs text-gray-500 mt-0.5">{hint}</div> : null}
      </div>
      <input
        type="checkbox"
        disabled={disabled}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4"
      />
    </div>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative w-full max-w-sm">
      <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-sm outline-none"
      />
    </div>
  );
}

// -----------------------------
// Copy / code viewer
// -----------------------------
export function CopyButton({ text, size = "sm" }: { text: string; size?: "sm" | "xs" }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white font-medium text-gray-900",
        size === "sm" ? "px-3 py-2 text-xs" : "px-2 py-1 text-[11px]"
      )}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function CodeBlock({
  title,
  value,
  right,
}: {
  title?: string;
  value: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden">
      {title ? (
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="text-xs font-semibold text-gray-700">{title}</div>
          {right}
        </div>
      ) : null}
      <pre className="p-4 text-xs overflow-auto leading-relaxed">{value}</pre>
    </div>
  );
}

// -----------------------------
// Drawer / Modal
// -----------------------------
export function Drawer({
  open,
  title,
  subtitle,
  children,
  onClose,
  width = "md",
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
  width?: "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        className={cn(
          "absolute right-0 top-0 h-full bg-white shadow-2xl border-l border-gray-100 overflow-y-auto",
          width === "lg" ? "w-full max-w-3xl" : "w-full max-w-xl"
        )}
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-lg font-semibold text-gray-900">{title}</div>
            {subtitle ? <div className="text-sm text-gray-500 mt-1">{subtitle}</div> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white p-2 text-gray-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  const t = useRef<any>(null);

  useEffect(() => {
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => setV(value), ms);
    return () => {
      if (t.current) clearTimeout(t.current);
    };
  }, [value, ms]);

  return v;
}
