import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

/**
 * Protected route — only authenticated admins may render children.
 * - Guests -> /login (with `from: /admin` so login can bounce back)
 * - Logged-in non-admins -> / (access denied)
 */
export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-outline-variant border-t-primary animate-spin" />
          <p className="font-label text-label-caps text-on-surface-variant tracking-widest">
            VERIFYING ACCESS…
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full bg-surface/80 border border-outline-variant/30 rounded-xl p-10 text-center glow-sm">
          <p className="font-label text-label-caps text-error tracking-widest">
            ACCESS DENIED
          </p>
          <h1 className="mt-3 font-headline text-headline-md text-primary">
            Admins only
          </h1>
          <p className="mt-3 font-body text-body-md text-on-surface-variant">
            Hi {user.name || "there"} — this dashboard requires an admin
            account. Please sign in with an admin email or return home.
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <a
              href="/"
              className="bg-primary-container text-black px-6 py-3 rounded font-label text-label-caps glow-sm"
            >
              GO HOME
            </a>
            <a
              href="/login"
              className="border border-outline-variant/40 text-on-surface px-6 py-3 rounded font-label text-label-caps hover:border-primary hover:text-primary transition-colors"
            >
              SWITCH ACCOUNT
            </a>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
