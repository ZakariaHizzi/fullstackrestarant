import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { createReservation, ApiError } from "../lib/api";

export default function Reservations() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    guests: 2,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.email || !form.date || !form.time) {
      setError("Please fill in name, email, date and time.");
      return;
    }
    setSaving(true);
    try {
      // Secure call: cookie-authenticated POST to the backend.
      const saved = await createReservation({ ...form });
      navigate("/reservation/confirmation", {
        state: { ...form, id: saved?._id },
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        // Not logged in — backend requires auth for reservations.
        navigate("/login", { state: { from: "/#reservations" } });
        return;
      }
      setError(err.message || "Could not create reservation.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      id="Book a Table"
      className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-24"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5 }}
        className="border-b border-outline-variant/30 pb-4 mb-12"
      >
        <h2 className="font-headline text-headline-lg text-primary">
          BOOK A TABLE
        </h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="max-w-2xl mx-auto"
      >
        <form
          onSubmit={handleSubmit}
          className="bg-surface/80 backdrop-blur-[12px] border border-outline-variant/30 rounded-xl p-8 md:p-12 glow-sm"
        >
          <p className="font-body text-body-lg text-on-surface-variant text-center mb-10">
            Book your table and experience the future of dining.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-label text-label-caps text-primary mb-2">
                NAME
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-surface-container text-on-surface px-4 py-3 rounded border-b-2 border-outline-variant focus:border-primary focus:outline-none transition-colors font-body text-body-md"
                placeholder="Your name"
                required
              />
            </div>
            <div>
              <label className="block font-label text-label-caps text-primary mb-2">
                EMAIL
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-surface-container text-on-surface px-4 py-3 rounded border-b-2 border-outline-variant focus:border-primary focus:outline-none transition-colors font-body text-body-md"
                placeholder="your@email.com"
                required
              />
            </div>
            <div>
              <label className="block font-label text-label-caps text-primary mb-2">
                PHONE
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-surface-container text-on-surface px-4 py-3 rounded border-b-2 border-outline-variant focus:border-primary focus:outline-none transition-colors font-body text-body-md"
                placeholder="+1 555 000 1234"
              />
            </div>
            <div>
              <label className="block font-label text-label-caps text-primary mb-2">
                DATE
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full bg-surface-container text-on-surface px-4 py-3 rounded border-b-2 border-outline-variant focus:border-primary focus:outline-none transition-colors font-body text-body-md"
                required
              />
            </div>
            <div>
              <label className="block font-label text-label-caps text-primary mb-2">
                TIME
              </label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="w-full bg-surface-container text-on-surface px-4 py-3 rounded border-b-2 border-outline-variant focus:border-primary focus:outline-none transition-colors font-body text-body-md"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-label text-label-caps text-primary mb-2">
                GUESTS
              </label>
              <select
                value={form.guests}
                onChange={(e) =>
                  setForm({ ...form, guests: Number(e.target.value) })
                }
                className="w-full bg-surface-container text-on-surface px-4 py-3 rounded border-b-2 border-outline-variant focus:border-primary focus:outline-none transition-colors font-body text-body-md"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "Guest" : "Guests"}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {error && (
            <p className="mt-6 text-center font-body text-body-md text-error">
              {error}
            </p>
          )}
          <motion.button
            type="submit"
            disabled={saving}
            whileHover={
              saving
                ? {}
                : { scale: 1.03, boxShadow: "0 0 30px rgba(255,95,0,0.5)" }
            }
            whileTap={saving ? {} : { scale: 0.97 }}
            className="mt-8 w-full bg-primary-container text-black py-4 rounded font-label text-label-caps glow-sm disabled:opacity-60"
          >
            {saving ? "BOOKING…" : "BOOK NOW"}
          </motion.button>
        </form>
      </motion.div>
    </section>
  );
}
