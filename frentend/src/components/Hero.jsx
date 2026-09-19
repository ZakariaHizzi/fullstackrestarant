import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative w-full min-h-[519px] flex items-center justify-center px-margin-mobile md:px-margin-desktop overflow-hidden"
    >
      <div
        className="absolute inset-0 z-0 opacity-40 mix-blend-screen bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop')",
        }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-background/60 via-background/20 to-background" />
      <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-background to-transparent z-0" />

      <div className="relative z-10 max-w-container-max w-full flex flex-col items-center text-center gap-6">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="font-headline text-headline-xl md:text-[80px] text-primary glow-text uppercase"
        >
          THE FUTURE OF FLAVOR
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="font-body text-body-lg text-on-surface-variant max-w-2xl"
        >
          Experience culinary innovation where premium ingredients meet
          high-energy urban aesthetics. Taste the neon.
        </motion.p>
      </div>
    </section>
  );
}
