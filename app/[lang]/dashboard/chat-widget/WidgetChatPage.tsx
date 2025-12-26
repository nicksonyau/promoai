export default function WidgetChatPage({ settings, update }: any) {
  return (
    <div className="bg-white border rounded-xl p-5 space-y-4">
      <h3 className="font-medium">Chat page</h3>

      <input
        className="w-full border rounded px-3 py-2 text-sm"
        value={settings.chat.placeholder}
        onChange={(e) =>
          update("chat", { ...settings.chat, placeholder: e.target.value })
        }
        placeholder="Input placeholder"
      />

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={settings.chat.showAgent}
          onChange={(e) =>
            update("chat", { ...settings.chat, showAgent: e.target.checked })
          }
        />
        Show agent avatar
      </label>
    </div>
  );
}
