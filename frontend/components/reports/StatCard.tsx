type StatCardProps = {
  label: string;
  value: number;
  hint?: string;
};

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <section className="card card-pad" aria-label={label}>
      <small className="muted" style={{ fontWeight: 600 }}>{label}</small>
      <p style={{ margin: "0.25rem 0", fontSize: "1.8rem", fontWeight: 700 }}>{value}</p>
      {hint ? (
        <small className="muted">{hint}</small>
      ) : null}
    </section>
  );
}
