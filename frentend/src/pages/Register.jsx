import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AuthShell,
  FieldError,
  authInputCls,
  authLabelCls,
} from "../components/AuthShell";
import { useAuth } from "../lib/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    setLoading(true);
    try {
      await signup({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      navigate("/", { replace: true });
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create account"
      subtitle="Join Neon Bistro for faster reservations and member-only drops."
      footer={
        <p className="mt-6 text-center font-body text-body-md text-on-surface-variant">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-primary hover:text-primary-container font-semibold transition-colors"
          >
            Log in
          </Link>
        </p>
      }
    >
      {serverError && (
        <div className="mb-5 bg-error-container/20 border border-error/40 text-on-error-container px-4 py-3 rounded font-body text-body-md">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label htmlFor="name" className={authLabelCls}>
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Your full name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, [e.target.name]: e.target.value })
            }
            className={authInputCls}
          />
          <FieldError message={errors.name} />
        </div>

        <div>
          <label htmlFor="email" className={authLabelCls}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="your@email.com"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, [e.target.name]: e.target.value })
            }
            className={authInputCls}
          />
          <FieldError message={errors.email} />
        </div>

        <div>
          <div>
            <label htmlFor="password" className={authLabelCls}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, [e.target.name]: e.target.value })
              }
              className={authInputCls}
            />
            <FieldError message={errors.password} />
          </div>
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
          {loading ? "CREATING…" : "CREATE ACCOUNT"}
        </motion.button>

        <p className="font-body text-[13px] text-on-surface-variant/70 text-center">
          By registering you agree to our Terms & Privacy Policy.
        </p>
      </form>
    </AuthShell>
  );
}
