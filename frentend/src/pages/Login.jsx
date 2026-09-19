import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AuthShell,
  FieldError,
  authInputCls,
  authLabelCls,
} from "../components/AuthShell";
import { useAuth } from "../lib/AuthContext";
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const from = location.state?.from || "/";

  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setServerError("");
    setLoading(true);
    try {
      const logged = await login({
        email: form.email.trim(),
        password: form.password,
      });
      // Admins land on the dashboard, everyone else returns to where they came from
      if (logged?.role === "admin") navigate("/admin", { replace: true });
      else
        navigate(from === "/login" || from === "/register" ? "/" : from, {
          replace: true,
        });
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to book tables faster and manage your Neon Bistro experience."
      footer={
        <p className="mt-6 text-center font-body text-body-md text-on-surface-variant">
          New here?{" "}
          <Link
            to="/register"
            className="text-primary hover:text-primary-container font-semibold transition-colors"
          >
            Create an account
          </Link>
        </p>
      }
    >
      {serverError && (
        <div className="mb-5 bg-error-container/20 border border-error/40 text-on-error-container px-4 py-3 rounded font-body text-body-md">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <div>
          <label htmlFor="email" className={authLabelCls}>
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="your@email.com"
            value={form.email}
            required
            onChange={(e) => set("email", e.target.value)}
            className={authInputCls}
          />
          <FieldError message={errors.email} />
        </div>

        <div>
          <label htmlFor="password" className={authLabelCls}>
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              className={`${authInputCls} pr-12`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary font-label text-[11px] tracking-widest"
            >
              {showPassword ? "HIDE" : "SHOW"}
            </button>
          </div>
          <FieldError message={errors.password} />
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={
            loading
              ? {}
              : { scale: 1.02, boxShadow: "0 0 30px rgba(255,95,0,0.5)" }
          }
          whileTap={loading ? {} : { scale: 0.98 }}
          className="w-full bg-primary-container text-black py-4 rounded font-label text-label-caps glow-sm disabled:opacity-60"
        >
          {loading ? "LOGGING IN…" : "LOG IN"}
        </motion.button>
      </form>
    </AuthShell>
  );
}
