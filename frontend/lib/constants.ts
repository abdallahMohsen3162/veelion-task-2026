// Base URL of the Express backend. The frontend calls it directly from the
// browser (no Next.js API proxies), so the public env var takes precedence.
// Server-only BACKEND_API_URL remains as a fallback for local setups.
export const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  process.env.BACKEND_API_URL ||
  "http://localhost:4000";
