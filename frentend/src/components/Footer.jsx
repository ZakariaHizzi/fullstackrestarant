import { motion } from "framer-motion";

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="bg-surface-container-highest text-primary font-body text-body-md w-full border-t border-primary/20 shadow-[0_-10px_30px_rgba(255,181,153,0.1)] mt-24"
    >
      <div className="max-w-container-max mx-auto flex flex-col items-center py-margin-desktop px-margin-mobile md:px-margin-desktop gap-gutter">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="font-headline text-headline-md text-primary"
        >
          NEON BISTRO
        </motion.div>
        <div className="flex gap-gutter flex-wrap justify-center">
          {["Privacy Policy", "Terms of Service", "Accessibility"].map((item) => (
            <a
              key={item}
              href="#"
              className="text-on-surface-variant hover:text-primary transition-all font-label text-interactive"
            >
              {item}
            </a>
          ))}
        </div>
        <div className="text-on-surface-variant mt-4 opacity-60 text-sm">
          &copy; 2024 NEON BISTRO. ALL RIGHTS RESERVED.
        </div>
      </div>
    </motion.footer>
  );
}
