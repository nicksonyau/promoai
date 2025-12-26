"use client";

import InboxHeader from "./InboxHeader";
import ConversationList from "./ConversationList";
import ThreadPanel from "./ThreadPanel";
import ContextPanel from "./ContextPanel";
import { useInbox } from "../_lib/useInbox";

export default function InboxClient({ lang }: { lang: string }) {
  const inbox = useInbox();

  return (
    <div className="p-8 space-y-6">
      <InboxHeader lang={lang} onRefresh={inbox.refresh} />

      {(inbox.listError || inbox.convError) && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {inbox.listError && <div>List: {inbox.listError}</div>}
          {inbox.convError && <div>Conversation: {inbox.convError}</div>}
        </div>
      )}

      {/* One seamless container */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/60 overflow-hidden">
        <div className="grid grid-cols-12 min-h-[72vh]">
          <div className="col-span-12 md:col-span-4 lg:col-span-3">
            <ConversationList
              conversations={inbox.conversations}
              loading={inbox.loadingList}
              activeKey={inbox.activeKey}
              onSelect={inbox.setActiveKey}
              search={inbox.search}
              onSearch={inbox.setSearch}
            />
          </div>

          <div className="col-span-12 md:col-span-8 lg:col-span-6 border-t md:border-t-0 md:border-l border-slate-200/60">
            <ThreadPanel
              activeKey={inbox.activeKey}
              activeConv={inbox.activeConv}
              loading={inbox.loadingConv}
              draft={inbox.draft}
              onDraft={inbox.setDraft}
              sending={inbox.sending}
              onSend={inbox.sendMessage}
            />
          </div>

          <div className="col-span-12 lg:col-span-3 border-t lg:border-t-0 lg:border-l border-slate-200/60">
            <ContextPanel conv={inbox.activeConv} />
          </div>
        </div>
      </div>
    </div>
  );
}
