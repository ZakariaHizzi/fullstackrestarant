import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../lib/AuthContext";
const sections = [
  { label: "Home", id: "hero" },
  { label: "Menu", id: "menu" },
  { label: "Book a Table", id: "Book a Table" },
  { label: "Contact", id: "contact" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const navRef = useRef(null);
  const linkRefs = useRef({});
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const isHome = location.pathname === "/";

  useEffect(() => {
    if (!isHome) return;
    const ids = sections
      .map((s) => document.getElementById(s.id))
      .filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 },
    );
    ids.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [isHome]);

  useEffect(() => {
    const link = linkRefs.current[activeSection];
    if (link && navRef.current) {
      const navRect = navRef.current.getBoundingClientRect();
      const linkRect = link.getBoundingClientRect();
      setIndicatorStyle({
        left: linkRect.left - navRect.left,
        width: linkRect.width,
      });
    }
  }, [activeSection]);

  const handleNav = (id) => {
    setMobileOpen(false);
    if (!isHome) {
      navigate(id === "hero" ? "/" : `/#${id}`);
      return;
    }
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.nav
      ref={navRef}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_0_20px_rgba(255,181,153,0.2)]"
    >
      <div className="max-w-container-max mx-auto flex items-center justify-between px-margin-mobile md:px-margin-desktop py-4">
        <Link
          to="/"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="font-headline text-headline-md text-primary tracking-tighter hover:scale-105 transition-transform"
        >
          NEON BISTRO
        </Link>

        <div className="hidden md:flex items-center gap-gutter relative">
          {sections.map((section, i) => (
            <motion.button
              key={section.label}
              ref={(el) => (linkRefs.current[section.id] = el)}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.4 }}
              onClick={() => handleNav(section.id)}
              className={`font-label text-interactive transition-colors duration-300 pb-1 ${
                activeSection === section.id && isHome
                  ? "text-primary"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              {section.label}
            </motion.button>
          ))}
          <motion.div
            layout
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="absolute bottom-0 h-[2px] bg-primary rounded-full"
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
              opacity: isHome ? 1 : 0,
              boxShadow: "0 0 10px rgba(255,181,153,0.5)",
            }}
          />

          {user ? (
            <div className="flex items-center gap-3 ml-2">
              <span
                title={user.email}
                className="w-9 h-9 rounded-full bg-primary-container text-black font-headline text-[14px] flex items-center justify-center flex-shrink-0"
              >
                {(user.name || "U").charAt(0).toUpperCase()}
              </span>
              {user.role === "admin" && (
                <button
                  onClick={() => navigate("/admin")}
                  className="font-label text-interactive text-primary hover:underline px-2 py-2"
                >
                  Dashboard
                </button>
              )}
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="font-label text-interactive text-on-surface-variant hover:text-primary transition-colors px-2 py-2"
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className="font-label text-interactive text-on-surface-variant hover:text-primary transition-colors px-3 py-3 ml-2"
              >
                Log in
              </button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/register")}
                className="border border-primary/50 text-primary hover:bg-primary-container hover:text-black hover:border-primary-container px-5 py-2.5 rounded font-label text-label-caps transition-all"
              >
                Sign Up
              </motion.button>
            </>
          )}
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-primary"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d={
                mobileOpen ? "M18 6L6 18M6 6l12 12" : "M3 12h18M3 6h18M3 18h18"
              }
            />
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-surface/95 backdrop-blur-xl border-t border-outline-variant/30"
          >
            <div className="flex flex-col items-center gap-4 px-margin-mobile py-6">
              {sections.map((section) => (
                <button
                  key={section.label}
                  onClick={() => handleNav(section.id)}
                  className={`font-label text-interactive transition-all ${
                    activeSection === section.id
                      ? "text-primary"
                      : "text-on-surface-variant hover:text-primary"
                  }`}
                >
                  {section.label}
                </button>
              ))}

              {user ? (
                <div className="flex flex-col items-center gap-3 mt-2 w-full">
                  <p className="font-body text-body-md text-on-surface">
                    Hi, {user.name}
                  </p>
                  {user.role === "admin" && (
                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        navigate("/admin");
                      }}
                      className="w-full max-w-[240px] bg-primary-container text-black px-8 py-3 rounded font-label text-label-caps glow-sm"
                    >
                      DASHBOARD
                    </button>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                      navigate("/");
                    }}
                    className="w-full max-w-[240px] border border-outline-variant/40 text-on-surface-variant px-8 py-3 rounded font-label text-label-caps"
                  >
                    LOGOUT
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 mt-2 w-full">
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      navigate("/login");
                    }}
                    className="w-full max-w-[240px] border border-outline-variant/40 text-on-surface px-8 py-3 rounded font-label text-label-caps hover:border-primary hover:text-primary transition-colors"
                  >
                    LOG IN
                  </button>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      navigate("/register");
                    }}
                    className="w-full max-w-[240px] bg-primary-container text-black px-8 py-3 rounded font-label text-label-caps glow-sm"
                  >
                    SIGN UP
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
