/** Backend origin. Empty in local Vite so /api and /auth are proxied. */
export const BASE = import.meta.env.VITE_API_URL || "";

export function apiUrl(path) {
  return `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
}
