"use client";

import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { TemplateForm } from "../_components/TemplateForm";

export default function CreateTemplatePage() {
  const { lang } = useParams<{ lang: string }>();
  const router = useRouter();

  return (
    <TemplateForm
      lang={lang}
      mode="create"
      status="draft"
      backHref={`/${lang}/dashboard/templates`}
      initial={{
        name: "",
        category: "UTILITY",
        language: "en",
        body: "",
        footer: "",
        buttons: [],
      }}
      onSave={async ({ name, category, language, components }) => {
        const res = await apiFetch("/watemplates/create", {
          method: "POST",
          body: JSON.stringify({ name, category, language, components }),
        });

        const data = await res.json();
        if (!res.ok || !data?.success) {
          throw new Error(data?.error || "Failed to create template");
        }

        router.push(`/${lang}/dashboard/templates`);
      }}
    />
  );
}
