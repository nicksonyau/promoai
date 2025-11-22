"use client";

import { ReactNode } from "react";

export default function DashboardContainer({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col flex-1 px-8 py-10 lg:px-12">
      {title && (
        <h1 className="text-2xl font-bold text-gray-900 mb-8 border-b pb-2">
          {title}
        </h1>
      )}
      <div className="flex justify-center">
        {children}
      </div>
    </div>
  );
}
