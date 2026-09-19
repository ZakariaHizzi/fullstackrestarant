import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export const authInputCls =
  "w-full bg-surface-container text-on-surface px-4 py-3 rounded border-b-2 border-outline-variant focus:border-primary focus:outline-none font-body text-body-md placeholder:text-on-surface-variant/40 transition-colors";

export const authLabelCls =
  "block font-label text-label-caps text-primary mb-2";

export function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-error text-[13px] mt-1.5 font-body">{message}</p>;
}

export function AuthShell({ title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_0_20px_rgba(255,181,153,0.2)]">
        <div className="max-w-container-max mx-auto flex items-center justify-between px-margin-mobile md:px-margin-desktop py-4">
          <Link
            to="/"
            className="font-headline text-headline-md text-primary tracking-tighter hover:scale-105 transition-transform"
          >
            NEON BISTRO
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="font-label text-interactive text-on-surface-variant hover:text-primary transition-colors px-4 py-2"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="bg-primary-container text-black px-5 py-2.5 rounded font-label text-label-caps glow-sm hover:brightness-110 transition-all"
            >
              SIGN UP
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-grow flex items-center justify-center px-margin-mobile md:px-margin-desktop pt-[110px] pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-surface/80 backdrop-blur-[12px] border border-outline-variant/30 rounded-xl p-8 md:p-10 glow-sm"
        >
          <h1 className="font-headline text-headline-lg text-primary tracking-tighter">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 font-body text-body-md text-on-surface-variant">
              {subtitle}
            </p>
          )}
          <div className="mt-8">{children}</div>
          {footer}
        </motion.div>
      </main>
    </div>
  );
}
