import { SearchIcon } from "@/components/dashboard/icons";

type PlatformCollectionToolbarProps = {
  searchValue: string;
  searchPlaceholder: string;
  onSearchChange: (value: string) => void;
  filters: Array<{
    key: string;
    label: string;
    count?: number;
  }>;
  activeFilter: string;
  onFilterChange: (key: string) => void;
};

export function PlatformCollectionToolbar({
  searchValue,
  searchPlaceholder,
  onSearchChange,
  filters,
  activeFilter,
  onFilterChange,
}: PlatformCollectionToolbarProps) {
  return (
    <section className="mt-6 rounded-[18px] border border-neutral-200 bg-white p-5 shadow-[0_18px_40px_rgba(0,0,0,0.12)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <label className="relative block w-full xl:max-w-[420px]">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-12 w-full rounded-[12px] border border-neutral-300 bg-white pl-11 pr-4 text-sm text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] outline-none transition focus:border-blue-600"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => {
            const isActive = filter.key === activeFilter;
            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => onFilterChange(filter.key)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "border-[#1d4ed8] bg-[#eff6ff] text-[#1d4ed8]"
                    : "border-neutral-200 bg-white text-neutral-600 hover:border-[#bedbff] hover:text-[#1d4ed8]"
                }`}
              >
                <span>{filter.label}</span>
                {typeof filter.count === "number" ? (
                  <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs">
                    {filter.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
