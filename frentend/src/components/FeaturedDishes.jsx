import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getDishes, resolveImageUrl } from "../lib/api";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

// Signature-grid layout slots (keeps the original design with DB dishes).
const LAYOUT_SLOTS = [
  {
    span: "md:col-span-8",
    height: "h-[500px]",
    featured: true,
    reverse: false,
  },
  {
    span: "md:col-span-4",
    height: "h-[500px]",
    featured: false,
    reverse: false,
  },
  {
    span: "md:col-span-4",
    height: "h-[400px]",
    featured: false,
    reverse: false,
  },
  {
    span: "md:col-span-8",
    height: "h-[400px]",
    featured: false,
    reverse: true,
  },
];

function toFeaturedDish(dish, index) {
  const slot = LAYOUT_SLOTS[index % LAYOUT_SLOTS.length];
  const id = dish._id;
  const title = dish.title;
  return {
    id,
    title,
    description: dish.description,
    image: resolveImageUrl(dish.image),
    tags: dish.category || dish.tag ? [dish.category || dish.tag] : [],
    ...slot,
  };
}

export default function FeaturedDishes() {
  const navigate = useNavigate();
  // DB-only: signature plates come from MongoDB `dishes` (GET /dishes).
  // No static data, no localStorage.
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDishes()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        // Take up to 4 plates for the signature layout.
        setDishes(list.slice(0, 4).map((d, i) => toFeaturedDish(d, i)));
      })
      .catch(() => {
        setDishes([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return null;
  if (dishes.length === 0) return null;

  return (
    <section className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-end border-b border-outline-variant/30 pb-4 mb-12"
      >
        <h2 className="font-headline text-headline-lg text-primary">
          SIGNATURE PLATES
        </h2>
        <a
          href="#menu"
          className="hidden md:block font-label text-interactive text-primary border-b border-transparent hover:border-primary transition-all pb-1"
        >
          View Full Menu
        </a>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 md:grid-cols-12 gap-gutter"
      >
        {dishes.map((dish) => (
          <motion.article
            key={dish.id || dish.title}
            variants={itemVariants}
            onClick={() => navigate(`/dish/${dish.id}`)}
            className={`col-span-1 ${dish.span} relative bg-surface/80 backdrop-blur-[12px] border-t border-l border-outline-variant/50 border-r border-b border-outline-variant/10 rounded-xl overflow-hidden group hover:glow-sm transition-all duration-500 cursor-pointer ${dish.height} ${dish.reverse ? "flex flex-row items-center p-8 gap-8" : ""}`}
          >
            {dish.reverse ? (
              <>
                <div className="w-1/2 relative h-full rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                    src={dish.image}
                    alt={dish.title}
                  />
                </div>
                <div className="w-1/2 flex flex-col justify-center gap-4">
                  {dish.tags.length > 0 && (
                    <div className="flex gap-2">
                      {dish.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-surface-container text-on-surface px-3 py-1 rounded-full font-label text-label-caps flex items-center gap-1 border border-outline-variant/30"
                        >
                          <span className="w-1 h-1 rounded-full bg-primary" />{" "}
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <h3 className="font-headline text-headline-md text-primary">
                    {dish.title}
                  </h3>
                  <p className="font-body text-body-md text-on-surface-variant">
                    {dish.description}
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/dish/${dish.id}`);
                    }}
                    className="mt-2 border border-primary text-primary px-6 py-2 rounded font-label text-label-caps hover:bg-primary/10 transition-colors self-start"
                  >
                    ADD TO ORDER
                  </motion.button>
                </div>
              </>
            ) : (
              <>
                <img
                  className={`absolute inset-0 w-full h-full object-cover ${dish.featured ? "opacity-60 group-hover:opacity-80" : "opacity-70"} group-hover:scale-105 transition-all duration-500`}
                  src={dish.image}
                  alt={dish.title}
                />
                <div
                  className={`absolute inset-0 ${dish.featured ? "bg-gradient-to-t from-surface via-surface/40 to-transparent" : ""}`}
                />
                {!dish.featured && (
                  <div className="relative h-full flex flex-col">
                    <div className="h-1/2 relative overflow-hidden" />
                    <div className="h-1/2 p-6 flex flex-col justify-between bg-gradient-to-b from-transparent to-surface-container-highest">
                      <div>
                        <h3 className="font-headline text-headline-md text-primary mb-2">
                          {dish.title}
                        </h3>
                        <p className="font-body text-body-md text-on-surface-variant line-clamp-3">
                          {dish.description}
                        </p>
                      </div>
                      <div className="text-primary font-label text-label-caps tracking-widest mt-4">
                        VIEW{" "}
                        <span className="inline-block align-middle ml-1">
                          &rarr;
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                {dish.featured && (
                  <div className="absolute bottom-0 left-0 p-8 flex flex-col gap-2">
                    {dish.tags.length > 0 && (
                      <div className="flex gap-2 mb-2">
                        {dish.tags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-surface-container text-on-surface px-3 py-1 rounded-full font-label text-label-caps flex items-center gap-1 border border-outline-variant/30"
                          >
                            <span className="w-1 h-1 rounded-full bg-primary" />{" "}
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <h3 className="font-headline text-headline-md text-primary glow-text">
                      {dish.title}
                    </h3>
                    <p className="font-body text-body-md text-on-surface-variant max-w-md">
                      {dish.description}
                    </p>
                  </div>
                )}
              </>
            )}
          </motion.article>
        ))}
      </motion.div>
    </section>
  );
}
