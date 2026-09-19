import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function ReservationConfirmation() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state?.name) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="font-headline text-headline-lg text-primary mb-4">No Reservation Found</h1>
          <button onClick={() => navigate("/#reservations")} className="bg-primary-container text-black px-6 py-3 rounded font-label text-label-caps glow-sm">
            Book a Table
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_0_20px_rgba(255,181,153,0.2)]">
        <div className="max-w-container-max mx-auto flex items-center justify-between px-margin-mobile md:px-margin-desktop py-4">
          <div className="font-headline text-headline-md text-primary tracking-tighter">NEON BISTRO</div>
        </div>
      </nav>

      <main className="flex-grow pt-[100px] flex items-center justify-center px-margin-mobile md:px-margin-desktop">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-lg w-full bg-surface/80 backdrop-blur-[12px] border border-outline-variant/30 rounded-xl p-8 md:p-12 glow-sm text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-16 h-16 bg-primary-container/20 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ff5f00" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </motion.div>

          <h1 className="font-headline text-headline-lg text-primary mb-2 glow-text">BOOKING CONFIRMED</h1>
          <p className="font-body text-body-lg text-on-surface-variant mb-8">
            Your table is reserved. See you soon.
          </p>

          <div className="bg-surface-container/50 rounded-xl p-6 mb-8 space-y-4 text-left">
            {[
              { label: "NAME", value: state.name },
              { label: "EMAIL", value: state.email },
              { label: "DATE", value: new Date(state.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) },
              { label: "TIME", value: state.time },
              { label: "GUESTS", value: `${state.guests} ${state.guests === 1 ? "Guest" : "Guests"}` },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center border-b border-outline-variant/20 pb-3 last:border-0 last:pb-0">
                <span className="font-label text-label-caps text-primary">{item.label}</span>
                <span className="font-body text-body-md text-on-surface">{item.value}</span>
              </div>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.03, boxShadow: "0 0 25px rgba(255,95,0,0.5)" }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/")}
            className="w-full bg-primary-container text-black py-4 rounded font-label text-label-caps glow-sm"
          >
            BACK TO HOME
          </motion.button>
        </motion.div>
      </main>
    </div>
  );
}
