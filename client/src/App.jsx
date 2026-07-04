import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import RepoDetailPage from "./pages/RepoDetailPage";
import SummaryDetailPage from "./pages/SummaryDetailPage";

function RequireAuth({ children }) {
  const { user } = useAuth();
  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (user === null) return <Navigate to="/login" replace />;
  return children;
}

function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Layout>
                  <DashboardPage />
                </Layout>
              </RequireAuth>
            }
          />
          <Route
            path="/repos/:repoId"
            element={
              <RequireAuth>
                <Layout>
                  <RepoDetailPage />
                </Layout>
              </RequireAuth>
            }
          />
          <Route
            path="/summaries/:id"
            element={
              <RequireAuth>
                <Layout>
                  <SummaryDetailPage />
                </Layout>
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
