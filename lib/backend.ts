// Base URL of the Python FastAPI backend. Server-side only — the browser talks
// to Next.js API routes, which proxy here.
export const BACKEND_URL =
  process.env.BACKEND_URL || "http://localhost:8000";
