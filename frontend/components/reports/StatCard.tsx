type StatTone = "default" | "todo" | "done" | "info";

type StatCardProps = {
  label: string;
  value: number;
  hint?: string;
  tone?: StatTone;
};

export function StatCard({ label, value, hint, tone = "default" }: StatCardProps) {
  const toneClass = tone === "default" ? "" : ` stat-tone-${tone}`;
  return (
    <section className={`card card-pad${toneClass}`} aria-label={label}>
      <small className="muted" style={{ fontWeight: 600 }}>{label}</small>
      <p style={{ margin: "0.25rem 0", fontSize: "1.8rem", fontWeight: 700 }}>{value}</p>
      {hint ? (
        <small className="muted">{hint}</small>
      ) : null}
    </section>
  );
}
