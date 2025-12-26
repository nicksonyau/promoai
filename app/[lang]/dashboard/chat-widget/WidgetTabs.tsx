export default function WidgetTabs({ value, onChange }: any) {
  const tabs = [
    { id: "home", label: "Home" },
    { id: "chat", label: "Chat" },
    { id: "minimized", label: "Minimized" },
  ];

  return (
    <div className="flex gap-2 border-b">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`px-4 py-2 text-sm border-b-2 ${
            value === t.id
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-gray-500"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
