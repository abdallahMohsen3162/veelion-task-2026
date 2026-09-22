// Server-side base URL for the backend API.
// Prefers non-public BACKEND_API_URL; falls back to the legacy
// NEXT_PUBLIC_BACKEND_API_URL for existing environments.
export const BACKEND_BASE_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  "http://localhost:4000";
