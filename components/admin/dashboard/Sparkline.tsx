/**
 * Tek serili sparkline.
 *
 * Tek seri olduğu için açıklama kutusu yoktur — kartın başlığı seriyi
 * adlandırır. Eksen ve ızgara yoktur: sparkline mutlak değer okumak için
 * değil, eğilimi göstermek için vardır. Çizgi 2px, son nokta işaretli.
 */
export function Sparkline({
  values,
  labels,
  width = 132,
  height = 36,
}: {
  values: number[];
  labels?: string[];
  width?: number;
  height?: number;
}) {
  if (values.length < 2) {
    return <div className="tastat__spark" style={{ width, height }} aria-hidden />;
  }

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const pad = 3;
  const innerH = height - pad * 2;

  const x = (i: number) => (i / (values.length - 1)) * width;
  const y = (v: number) => pad + innerH - ((v - min) / span) * innerH;

  const line = values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const lastX = x(values.length - 1);
  const lastY = y(values[values.length - 1]);

  const total = values.reduce((a, b) => a + b, 0);

  return (
    <svg
      className="tastat__spark"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Eğilim grafiği, ${values.length} gün, toplam ${total}`}
    >
      <path d={area} className="tastat__spark-area" />
      <path
        d={line}
        className="tastat__spark-line"
        fill="none"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r={3} className="tastat__spark-dot" />
      {/* Fare üzerine gelince günlük değer — grafiğin kendisi etkileşimlidir */}
      {values.map((v, i) => (
        <rect
          key={i}
          x={i === 0 ? 0 : x(i) - width / (values.length - 1) / 2}
          y={0}
          width={width / (values.length - 1)}
          height={height}
          fill="transparent"
        >
          <title>{`${labels?.[i] ?? `${i + 1}. gün`}: ${v}`}</title>
        </rect>
      ))}
    </svg>
  );
}
