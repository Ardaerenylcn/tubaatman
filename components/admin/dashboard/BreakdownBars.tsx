/**
 * Sıralı dağılım çubukları.
 *
 * Tek bir ölçü (oturum sayısı) gösterildiği için renk hiçbir şey kodlamaz;
 * bu yüzden kategorik palet değil TEK renk kullanılır. Çubuk uçları 4px
 * yuvarlatılmış ve taban çizgisine sabitlenmiştir. Değerler metin
 * belirteçleriyle yazılır, çubuk rengiyle değil.
 */
export function BreakdownBars({
  title,
  rows,
  emptyText = "Henüz veri yok.",
}: {
  title: string;
  rows: { label: string; count: number }[];
  emptyText?: string;
}) {
  const max = Math.max(...rows.map((r) => r.count), 1);
  const total = rows.reduce((a, r) => a + r.count, 0);

  return (
    <section className="tapanel">
      <h3 className="tapanel__title">{title}</h3>
      {rows.length === 0 ? (
        <p className="tapanel__empty">{emptyText}</p>
      ) : (
        <ul className="tabars">
          {rows.map((r) => {
            const share = total > 0 ? Math.round((r.count / total) * 100) : 0;
            return (
              <li key={r.label} className="tabars__row">
                <span className="tabars__label" title={r.label}>
                  {r.label}
                </span>
                <span className="tabars__track">
                  <span
                    className="tabars__fill"
                    style={{ width: `${(r.count / max) * 100}%` }}
                  />
                </span>
                <span className="tabars__value">
                  {r.count}
                  <em>%{share}</em>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
