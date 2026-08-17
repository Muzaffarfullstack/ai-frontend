export function Metric({ label, value, meta }: { label: string; value: string; meta?: string }) {
  return <article className="metric-card"><span>{label}</span><strong>{value}</strong>{meta && <small>{meta}</small>}</article>;
}
