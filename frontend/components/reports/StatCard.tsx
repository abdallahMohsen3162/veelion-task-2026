type StatCardProps = {
  label: string;
  value: number;
  hint?: string;
};

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <section className="card" style={{ padding: "1rem" }} aria-label={label}>
      <small style={{ color: "var(--muted)", fontWeight: 600 }}>{label}</small>
      <p style={{ margin: "0.25rem 0", fontSize: "1.8rem", fontWeight: 700 }}>{value}</p>
      {hint ? (
        <small style={{ color: "var(--muted)" }}>{hint}</small>
      ) : null}
    </section>
  );
}
