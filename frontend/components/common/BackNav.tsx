import Link from "next/link";

export function BackNav() {
  return (
    <nav aria-label="Back navigation">
      <Link href="/" className="button">
        Back
      </Link>
    </nav>
  );
}
