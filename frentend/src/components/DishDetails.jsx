import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getDish, getDishes, resolveImageUrl } from "../lib/api";

function toViewModel(backend) {
  if (!backend) return null;
  return {
    id: backend._id,
    title: backend.title,
    price: typeof backend.price === "number" ? backend.price : "",
    description: backend.description,
    image: resolveImageUrl(backend.image),
    badges: [{ label: backend.category || backend.tag, color: "#f59e0b" }],
  };
}

export default function DishDetails() {
  const { id } = useParams();
  console.log(id);
  const navigate = useNavigate();
  // DB-only: dish comes from MongoDB `dishes`. No static data, no localStorage.
  const [dish, setDish] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        if (id) {
          const Dish = await getDish(id);
          setDish(toViewModel(Dish));
        }
      } catch {
        setDish(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-outline-variant border-t-primary animate-spin" />
          <p className="font-label text-label-caps text-on-surface-variant tracking-widest">
            LOADING DISH…
          </p>
        </div>
      </div>
    );
  }

  if (!dish) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="font-headline text-headline-lg text-primary mb-4">
            Dish Not Found
          </h1>
          <button
            onClick={() => navigate("/")}
            className="bg-primary-container text-black px-6 py-3 rounded font-label text-label-caps glow-sm"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  const StarIcon = ({ filled }) => (
    <svg
      className={`w-4 h-4 ${filled ? "text-primary" : "text-outline-variant"}`}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );

  const renderStars = (rating) => {
    const stars = [];
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    for (let i = 0; i < 5; i++) {
      if (i < full) stars.push(<StarIcon key={i} filled />);
      else if (i === full && half)
        stars.push(
          <svg
            key={i}
            className="w-4 h-4 text-primary"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <defs>
              <linearGradient id="half">
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="#5b4137" />
              </linearGradient>
            </defs>
            <path
              fill="url(#half)"
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            />
          </svg>,
        );
      else stars.push(<StarIcon key={i} filled={false} />);
    }
    return stars;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_0_20px_rgba(255,181,153,0.2)]">
        <div className="max-w-container-max mx-auto flex items-center justify-between px-margin-mobile md:px-margin-desktop py-4">
          <div className="font-headline text-headline-md text-primary tracking-tighter">
            NEON BISTRO
          </div>
          <div className="hidden md:flex items-center gap-gutter">
            {["Home", "Menu", "Reservations", "Contact"].map((link) => (
              <a
                key={link}
                href="/"
                className="font-label text-interactive text-on-surface-variant hover:text-primary transition-all"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </nav>

      <main className="flex-grow pt-[100px] pb-margin-desktop px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-label text-interactive"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Menu
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter lg:gap-16 items-start">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 relative h-[400px] md:h-[500px] lg:h-[600px] rounded-xl overflow-hidden bg-surface/80 backdrop-blur-[20px] border-t border-l border-outline-variant/50 border-r border-b border-outline-variant/10 flex items-center justify-center p-8 group"
          >
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary via-surface to-surface z-0 pointer-events-none" />
            <div className="relative z-10 w-full h-full flex items-center justify-center transition-transform duration-700 group-hover:scale-105">
              <img
                src={dish.image}
                alt={dish.title}
                className="object-cover w-full h-full rounded-lg"
                style={{
                  WebkitMaskImage:
                    "radial-gradient(circle, black 60%, transparent 100%)",
                  maskImage:
                    "radial-gradient(circle, black 60%, transparent 100%)",
                }}
              />
            </div>
            {dish.badges && dish.badges.length > 0 && (
              <div className="absolute top-4 left-4 flex gap-2 z-20">
                {dish.badges.map((b, i) => (
                  <div
                    key={i}
                    className="bg-surface-container-high px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-outline-variant/50 shadow-lg"
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: b.color,
                        boxShadow: `0 0 8px ${b.color}`,
                      }}
                    />
                    <span className="font-label text-[10px] tracking-wider text-on-surface">
                      {b.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-5 flex flex-col pt-4 lg:pt-8"
          >
            <h1 className="font-headline text-headline-lg text-primary mb-2 tracking-tighter drop-shadow-[0_0_10px_rgba(255,181,153,0.3)]">
              {dish.title}
            </h1>

            <div className="flex items-center gap-4 mb-6">
              <span className="font-headline text-headline-md text-primary-container drop-shadow-[0_0_15px_rgba(255,95,0,0.5)]">
                {dish.price} $
              </span>
              {dish.rating && (
                <div className="flex items-center text-primary/80">
                  <div className="flex">
                    {renderStars(parseFloat(dish.rating))}
                  </div>
                  <span className="font-label text-interactive ml-2 text-on-surface-variant">
                    ({dish.reviews} Reviews)
                  </span>
                </div>
              )}
            </div>

            <p className="font-body text-body-lg text-on-surface-variant mb-8 leading-relaxed opacity-90">
              {dish.fullDescription || dish.description}
            </p>

            {dish.ingredients && dish.ingredients.length > 0 && (
              <div className="mb-10">
                <h3 className="font-label text-interactive text-on-surface mb-4 border-b border-outline-variant/30 pb-2">
                  Key Ingredients
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {dish.ingredients.map((ingredient) => (
                    <div
                      key={ingredient}
                      className="flex items-center gap-3 bg-surface/80 backdrop-blur-[12px] border-t border-l border-outline-variant/50 border-r border-b border-outline-variant/10 px-4 py-3 rounded-lg"
                    >
                      <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_6px_rgba(255,181,153,0.5)]" />
                      <span className="font-body text-body-md text-on-surface">
                        {ingredient}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-auto" />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
