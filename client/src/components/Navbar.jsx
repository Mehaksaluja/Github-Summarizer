import { GitBranch, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 font-semibold text-gray-900">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <GitBranch className="w-4 h-4 text-white" />
          </div>
          GitPulse
        </Link>

        {user && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <img
                src={user.avatar_url}
                alt={user.username}
                className="w-7 h-7 rounded-full ring-2 ring-gray-100"
              />
              <span className="text-sm text-gray-700 font-medium hidden sm:block">
                {user.display_name || user.username}
              </span>
            </div>
            <div className="w-px h-5 bg-gray-200" />
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
