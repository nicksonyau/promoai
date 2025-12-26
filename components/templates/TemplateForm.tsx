"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

export function TemplateForm({
  initial,
  onSubmit,
  saving,
}: {
  initial: WATemplateForm;
  onSubmit: (data: WATemplateForm) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<WATemplateForm>(initial);

  function insertVariable() {
    const index = (form.body.match(/{{\d+}}/g)?.length || 0) + 1;
    setForm({ ...form, body: form.body + ` {{${index}}}` });
  }

  function addButton(type: any) {
    setForm({
      ...form,
      buttons: [...form.buttons, { type, text: "" }],
    });
  }

  function updateButton(i: number, field: string, value: string) {
    const buttons = [...form.buttons];
    (buttons[i] as any)[field] = value;
    setForm({ ...form, buttons });
  }

  function removeButton(i: number) {
    setForm({
      ...form,
      buttons: form.buttons.filter((_, idx) => idx !== i),
    });
  }

  return (
    <div className="space-y-8">
      {/* BASIC INFO */}
      <div className="bg-white border rounded-xl p-6 space-y-4">
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="snake_case_only"
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {/* BODY */}
      <div className="bg-white border rounded-xl p-6">
        <div className="flex justify-between">
          <label>Message Body</label>
          <button onClick={insertVariable} className="text-xs text-purple-600">
            + Insert Variable
          </button>
        </div>
        <textarea
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {/* FOOTER */}
      <div className="bg-white border rounded-xl p-6">
        <input
          value={form.footer || ""}
          onChange={(e) => setForm({ ...form, footer: e.target.value })}
          placeholder="Footer"
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {/* BUTTONS */}
      <div className="bg-white border rounded-xl p-6 space-y-3">
        {form.buttons.map((b, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={b.text}
              onChange={(e) => updateButton(i, "text", e.target.value)}
              className="border rounded px-2 py-1"
            />
            <button onClick={() => removeButton(i)}>
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          disabled={saving}
          onClick={() => onSubmit(form)}
          className="bg-purple-600 text-white px-6 py-2 rounded"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
