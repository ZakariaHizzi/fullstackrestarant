import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const contactInfo = [
  { label: "ADDRESS", value: "88 Electric Lane, Cyber District, NYC 10013" },
  { label: "PHONE", value: "+1 (555) 999-0000" },
  { label: "HOURS", value: "Mon-Sat: 6PM - 2AM / Sun: 6PM - 12AM" },
  { label: "EMAIL", value: "hello@neonbistro.com" },
];

function ToastIcon({ type }) {
  if (type === "success") {
    return (
      <>
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </>
    );
  }
  return (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </>
  );
}

function Toast({ type, show, onClose }) {
  const color = type === "success" ? "#ff5f00" : "#ffb4ab";
  const text = type === "success" ? "Message sent successfully!" : "Please fill in all fields before sending.";
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -30, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: -30, x: "-50%" }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed top-24 left-1/2 z-[60] bg-surface-container-high border border-primary/30 rounded-xl px-6 py-4 shadow-[0_0_30px_rgba(255,95,0,0.3)] flex items-center gap-3"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <ToastIcon type={type} />
          </svg>
          <span className="font-body text-body-md text-on-surface">{text}</span>
          <button onClick={onClose} className="text-on-surface-variant hover:text-primary ml-4 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function ContactSection() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState({ show: false, type: "success" });

  const closeToast = () => {
    if (toast.type === "success") {
      setName("");
      setMessage("");
    }
    setToast({ show: false, type: toast.type });
  };

  const handleSend = () => {
    if (!name.trim() || !message.trim()) {
      setToast({ show: true, type: "error" });
      setTimeout(() => setToast({ show: false, type: "error" }), 3000);
      return;
    }
    setToast({ show: true, type: "success" });
    setTimeout(closeToast, 3000);
  };

  return (
    <>
      <Toast type={toast.type} show={toast.show} onClose={closeToast} />
      <section id="contact" className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="border-b border-outline-variant/30 pb-4 mb-12"
        >
          <h2 className="font-headline text-headline-lg text-primary">CONTACT US</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {contactInfo.map((info) => (
              <div key={info.label}>
                <p className="font-label text-label-caps text-primary mb-1">{info.label}</p>
                <p className="font-body text-body-lg text-on-surface">{info.value}</p>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-surface/80 backdrop-blur-[12px] border border-outline-variant/30 rounded-xl p-8"
          >
            <h3 className="font-headline text-headline-md text-primary mb-6 glow-text">SEND US A MESSAGE</h3>
            <div className="space-y-5">
              <div>
                <label className="block font-label text-label-caps text-primary mb-2">NAME</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-container text-on-surface px-4 py-3 rounded border-b-2 border-outline-variant focus:border-primary focus:outline-none transition-colors font-body text-body-md"
                />
              </div>
              <div>
                <label className="block font-label text-label-caps text-primary mb-2">MESSAGE</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-surface-container text-on-surface px-4 py-3 rounded border-b-2 border-outline-variant focus:border-primary focus:outline-none transition-colors font-body text-body-md resize-none"
                />
              </div>
              <motion.button
                onClick={handleSend}
                whileHover={{ scale: 1.03, boxShadow: "0 0 25px rgba(255,95,0,0.5)" }}
                whileTap={{ scale: 0.97 }}
                className="w-full bg-primary-container text-black py-3 rounded font-label text-label-caps glow-sm"
              >
                SEND
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
