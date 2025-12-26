export default function WidgetPreview({ settings }: any) {
  return (
    <div className="sticky top-24 bg-white border rounded-xl p-4 h-fit">
      <div className="text-sm font-medium mb-2">Live Preview</div>

      <div className="relative h-[420px] bg-gray-50 rounded-lg overflow-hidden">
        {/* Launcher */}
        <div
          className={`absolute bottom-4 ${
            settings.launcher.position === "right" ? "right-4" : "left-4"
          }`}
        >
          <button
            className="text-white px-4 py-3 shadow-xl rounded-full text-sm"
            style={{ background: settings.brand.color }}
          >
            {settings.launcher.text}
          </button>
        </div>

        {/* Widget */}
        <div className="absolute bottom-20 right-4 left-4 bg-white rounded-xl border shadow-lg">
          <div
            className="px-4 py-3 text-white font-medium rounded-t-xl"
            style={{ background: settings.brand.color }}
          >
            {settings.brand.name}
          </div>

          <div className="p-4 text-sm">
            <div className="font-medium">{settings.home.title}</div>
            <div className="text-gray-600">{settings.home.subtitle}</div>

            <input
              className="mt-3 w-full border rounded px-3 py-2 text-sm"
              placeholder={settings.chat.placeholder}
              disabled
            />
          </div>
        </div>
      </div>
    </div>
  );
}
