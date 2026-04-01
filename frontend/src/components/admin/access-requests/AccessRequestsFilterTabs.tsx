import type { AccessRequest, AccessRequestFilterTab } from "@/types/admin";

type AccessRequestsFilterTabsProps = {
  activeTab: AccessRequestFilterTab;
  onChange: (tab: AccessRequestFilterTab) => void;
  requests: AccessRequest[];
};

const FILTER_TABS: AccessRequestFilterTab[] = [
  "Pending",
  "Approved",
  "Rejected",
  "All",
];

export function AccessRequestsFilterTabs({
  activeTab,
  onChange,
  requests,
}: AccessRequestsFilterTabsProps) {
  return (
    <div className="rounded-[14px] border border-neutral-200 bg-white p-2 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]">
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => {
          const count =
            tab === "All"
              ? requests.length
              : requests.filter((request) => request.status === tab).length;
          const isActive = activeTab === tab;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => onChange(tab)}
              className={`inline-flex items-center gap-2 rounded-[10px] px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-blue-600 text-white shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.1)]"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              <span>{tab}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
