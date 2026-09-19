import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getDishes, resolveImageUrl } from "../lib/api";

function toMenuItem(dish) {
  const id = dish._id;
  return {
    id,
    name: dish.title,
    price: typeof dish.price === "number" ? dish.price : "",
    desc: dish.description,
    tag: dish.category,
    image: resolveImageUrl(dish.image),
  };
}

export default function MenuSection() {
  const navigate = useNavigate();
  // DB-only: no static fallback, no localStorage. Empty until API responds.
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // All dishes come from MongoDB `dishes` collection (GET /dishes).
    getDishes()
      .then((dishes) => {
        setItems(dishes.map(toMenuItem));
      })
      .catch((e) => {
        setError(e?.message || "Could not load menu.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <section
      id="menu"
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
          THE MENU
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
        {loading ? (
          <p className="font-body text-body-md text-on-surface-variant col-span-full py-10 text-center">
            Loading menu from database…
          </p>
        ) : error ? (
          <p className="font-body text-body-md text-error col-span-full py-10 text-center">
            {error}
          </p>
        ) : items.length === 0 ? (
          <p className="font-body text-body-md text-on-surface-variant col-span-full py-10 text-center">
            No dishes yet — add them from the Admin panel.
          </p>
        ) : (
          items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: 0.05 * i }}
              onClick={() => navigate(`/dish/${item.id}`)}
              className="group flex gap-4 bg-surface/60 backdrop-blur-[8px] border border-outline-variant/20 rounded-xl overflow-hidden hover:border-primary/30 hover:glow-sm transition-all duration-500 cursor-pointer"
            >
              <div className="w-24 h-24 md:w-28 md:h-28 flex-shrink-0 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="flex-1 flex flex-col justify-center py-3 pr-4 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-headline text-headline-md text-primary group-hover:glow-text transition-all truncate">
                    {item.name}
                  </h3>
                  <span className="bg-surface-container text-on-surface-variant px-2 py-0.5 rounded font-label text-[10px] tracking-wider border border-outline-variant/30 flex-shrink-0">
                    {item.tag}
                  </span>
                </div>
                <p className="font-body text-body-md text-on-surface-variant line-clamp-2">
                  {item.desc}
                </p>
                <span className="font-headline text-headline-md text-primary mt-1">
                  {item.price} $
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </section>
  );
}
