"use client";

import { useParams } from "next/navigation";
import InboxClient from "./_components/InboxClient";

export default function InboxPage() {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";
  return <InboxClient lang={lang} />;
}
