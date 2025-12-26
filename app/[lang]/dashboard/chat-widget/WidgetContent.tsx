export default function WidgetContent({ settings, update }: any) {
  return (
    <div className="bg-white border rounded-xl p-5 space-y-4">
      <h3 className="font-medium">Home screen</h3>

      <input
        className="w-full border rounded px-3 py-2 text-sm"
        value={settings.home.title}
        onChange={(e) =>
          update("home", { ...settings.home, title: e.target.value })
        }
        placeholder="Title"
      />

      <textarea
        className="w-full border rounded px-3 py-2 text-sm"
        value={settings.home.subtitle}
        onChange={(e) =>
          update("home", { ...settings.home, subtitle: e.target.value })
        }
        placeholder="Subtitle"
      />
    </div>
  );
}
