import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import Sidebar from "./components/Sidebar";

// Public pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import OnboardingPage from "./pages/OnboardingPage";

// App pages
import OverviewPage from "./pages/OverviewPage";
import RepositoriesPage from "./pages/RepositoriesPage";
import RepoDetailPage from "./pages/RepoDetailPage";
import SummariesPage from "./pages/SummariesPage";
import SummaryDetailPage from "./pages/SummaryDetailPage";
import SettingsPage from "./pages/SettingsPage";

/* ─── Auth gate ──────────────────────────────────────────────────── */
function RequireAuth({ children }) {
  const { user } = useAuth();
  if (user === undefined) {
    return (
      <div className="min-h-screen bg-gh-canvas flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gh-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (user === null) return <Navigate to="/login" replace />;
  return children;
}

/* ─── App shell with sidebar ─────────────────────────────────────── */
function AppLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gh-canvas">
      <Sidebar />
      {/* Offset content for fixed sidebar */}
      <div className="flex-1 flex flex-col pl-56">
        {children}
      </div>
    </div>
  );
}

/* ─── Root ───────────────────────────────────────────────────────── */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Onboarding (auth required, no sidebar) */}
          <Route
            path="/onboarding"
            element={
              <RequireAuth>
                <OnboardingPage />
              </RequireAuth>
            }
          />

          {/* App (auth required, with sidebar) */}
          <Route
            path="/app/overview"
            element={
              <RequireAuth>
                <AppLayout><OverviewPage /></AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/app/repos"
            element={
              <RequireAuth>
                <AppLayout><RepositoriesPage /></AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/app/repos/:repoId"
            element={
              <RequireAuth>
                <AppLayout><RepoDetailPage /></AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/app/summaries"
            element={
              <RequireAuth>
                <AppLayout><SummariesPage /></AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/app/summaries/:id"
            element={
              <RequireAuth>
                <AppLayout><SummaryDetailPage /></AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/app/settings"
            element={
              <RequireAuth>
                <AppLayout><SettingsPage /></AppLayout>
              </RequireAuth>
            }
          />

          {/* Legacy redirects */}
          <Route path="/dashboard" element={<Navigate to="/app/overview" replace />} />
          <Route path="/repos/:id"  element={<Navigate to="/app/repos" replace />} />
          <Route path="/summaries/:id" element={<Navigate to="/app/summaries" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
