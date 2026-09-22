type CompletionDonutProps = {
  done: number;
  total: number;
};

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CompletionDonut({ done, total }: CompletionDonutProps) {
  const fraction = total > 0 ? Math.min(1, Math.max(0, done / total)) : 0;
  const percent = Math.round(fraction * 100);

  return (
    <div className="donut-wrap">
      <svg
        width="180"
        height="180"
        viewBox="0 0 140 140"
        role="img"
        aria-label={`${done} of ${total} tasks done (${percent} percent)`}
      >
        <circle
          className="donut-track"
          cx="70"
          cy="70"
          r={RADIUS}
          fill="none"
          strokeWidth="16"
        />
        <circle
          className="donut-progress"
          cx="70"
          cy="70"
          r={RADIUS}
          fill="none"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
          transform="rotate(-90 70 70)"
        />
        <text x="70" y="70" textAnchor="middle" dominantBaseline="central" className="donut-center">
          {percent}%
        </text>
        <text x="70" y="90" textAnchor="middle" className="donut-caption">
          done
        </text>
      </svg>
    </div>
  );
}
