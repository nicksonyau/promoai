"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import {
  TemplateButton,
  TemplateForm,
  TemplateStatus,
} from "../../_components/TemplateForm";

function pickCompText(components: any[], type: string) {
  const c = Array.isArray(components) ? components.find((x) => x?.type === type) : null;
  return c?.text || "";
}

function pickButtons(components: any[]): TemplateButton[] {
  const c = Array.isArray(components) ? components.find((x) => x?.type === "BUTTONS") : null;
  const btns = c?.buttons;
  return Array.isArray(btns) ? btns : [];
}

export default function EditTemplatePage() {
  const { lang, id } = useParams<{ lang: string; id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<TemplateStatus>("draft");

  const [initial, setInitial] = useState<{
    name: string;
    category: "UTILITY" | "MARKETING" | "AUTHENTICATION";
    language: string;
    body: string;
    footer: string;
    buttons: TemplateButton[];
  } | null>(null);

  const locked = useMemo(() => status === "submitted" || status === "approved", [status]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);

        const res = await apiFetch(`/watemplates/${id}`);
        const data = await res.json();

        if (!res.ok || !data?.template) {
          throw new Error(data?.error || "Failed to load template");
        }

        const tpl = data.template;
        const comps = tpl.components || [];

        const next = {
          name: tpl.name || "",
          category: (tpl.category || "UTILITY") as any,
          language: tpl.language || "en",
          body: pickCompText(comps, "BODY"),
          footer: pickCompText(comps, "FOOTER"),
          buttons: pickButtons(comps),
        };

        if (!mounted) return;

        setStatus((tpl.status || "draft") as TemplateStatus);
        setInitial(next);
      } catch (e: any) {
        alert(e?.message || "Unable to load template");
        router.push(`/${lang}/dashboard/templates`);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [id, lang, router]);

  if (loading && !initial) return <div className="p-6">Loading template...</div>;
  if (!initial) return <div className="p-6 text-red-600">Template not found.</div>;

  return (
    <TemplateForm
      lang={lang}
      mode="edit"
      status={status}
      loading={loading}
      locked={locked}
      backHref={`/${lang}/dashboard/templates`}
      initial={initial}
      onSave={async ({ name, category, language, components }) => {
        const res = await apiFetch(`/watemplates/update/${id}`, {
          method: "POST",
          body: JSON.stringify({ name, category, language, components }),
        });

        const data = await res.json();
        if (!res.ok || !data?.success) {
          throw new Error(data?.error || "Failed to update template");
        }

        router.push(`/${lang}/dashboard/templates`);
      }}
      onSubmitForApproval={async () => {
        const res = await apiFetch(`/watemplates/submit`, {
          method: "POST",
          body: JSON.stringify({ id }),
        });

        const data = await res.json();
        if (!res.ok || !data?.success) {
          throw new Error(data?.error || "Failed to submit template");
        }

        setStatus("submitted");
      }}
    />
  );
}
