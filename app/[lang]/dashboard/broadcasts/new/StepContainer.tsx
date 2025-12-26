"use client";

import React from "react";

export default function StepContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      {children}
    </div>
  );
}
