import { useEffect } from "react";
import { useParams } from "react-router-dom";

const BASE = import.meta.env.VITE_API_URL || "";

export default function InvitePage() {
  const { token } = useParams();

  useEffect(() => {
    if (token) {
      window.location.href = `${BASE}/auth/github/invite/${token}`;
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-gh-canvas flex items-center justify-center">
      <div className="text-center">
        <div className="w-6 h-6 border-2 border-gh-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gh-muted">Accepting team invite…</p>
      </div>
    </div>
  );
}
