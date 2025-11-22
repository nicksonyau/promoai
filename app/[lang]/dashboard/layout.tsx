import "./globals.css";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col">

        {/* Top Panel */}
        <div className="w-full bg-white border-b border-gray-200 px-6 py-3
                        flex items-center justify-between">
          <h1 className="text-lg font-bold text-purple-600">PromoAI</h1>

          {/* Search */}
          <div className="flex-1 mx-6">
            <input
              type="text"
              placeholder="Search..."
              className="w-full max-w-md border border-gray-300 rounded-md 
                         px-3 py-1.5 text-sm focus:outline-none focus:ring-2 
                         focus:ring-purple-500"
            />
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-5 text-gray-600">
            <button className="hover:text-purple-600">🔔</button>
            <button className="hover:text-purple-600">⚙️</button>
            <div className="w-8 h-8 rounded-full bg-purple-100 flex 
                            items-center justify-center font-bold text-purple-600 cursor-pointer">
              
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
