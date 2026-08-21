import type { SearchPerformance } from "@/lib/search-console";

import { SearchPerformanceCard } from "./SearchPerformanceCard";
import { SortToggle } from "./SortToggle";

export function ActivityFeed({
  sort,
  search,
}: {
  sort: "oncelik" | "tarih";
  search: SearchPerformance;
}) {
  return (
    <section className="tafeed">
      <header className="tafeed__head">
        <div>
          <h2 className="tafeed__title">Hareket Akışı</h2>
          <p className="tafeed__sub">En son güncellemeleriniz.</p>
        </div>
        <SortToggle current={sort} />
      </header>

      <div className="tafeed__divider">
        <span>Performans Güncellemeleri</span>
      </div>

      <SearchPerformanceCard data={search} />
    </section>
  );
}
