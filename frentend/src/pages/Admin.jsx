import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../lib/AuthContext";
import {
  getDishes,
  createDish,
  updateDish,
  deleteDish,
  getReservations,
  updateReservationStatus,
  deleteReservation,
  resolveImageUrl,
  ApiError,
} from "../lib/api";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: GridIcon },
  { id: "menu", label: "Food Menu", icon: MenuIcon },
  { id: "bookings", label: "Bookings", icon: CalendarIcon },
  { id: "settings", label: "Settings", icon: CogIcon },
];

const CATEGORIES = ["RAW", "SIGNATURE", "HOT", "SWEET", "PASTA", "APPETIZER", "COCKTAIL", "DRINKS", "MAIN", "DESSERT"];
const STATUSES = ["Pending", "Confirmed", "Cancelled"];

const emptyFoodForm = { title: "", description: "", price: "", category: "" };

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function statusBadge(status) {
  const base = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label text-[11px] tracking-widest border";
  if (status === "Confirmed")
    return `${base} bg-emerald-500/10 text-emerald-300 border-emerald-500/30`;
  if (status === "Cancelled")
    return `${base} bg-error-container/20 text-error border-error/30`;
  return `${base} bg-amber-500/10 text-amber-300 border-amber-500/30`;
}

export default function Admin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [dishes, setDishes] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null); // { kind: "dish"|"booking", title, message, data }

  // Food UI state
  const [foodSearch, setFoodSearch] = useState("");
  const [foodCategory, setFoodCategory] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // dish object or null
  const [foodForm, setFoodForm] = useState(emptyFoodForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [savingFood, setSavingFood] = useState(false);
  const [foodFormError, setFoodFormError] = useState("");
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    // Allow picking the same file twice in a row
    e.target.value = "";
    if (!file) return;
    if (file.type && !file.type.startsWith("image/")) {
      setFoodFormError("Only image files are allowed (JPG/PNG/WebP).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFoodFormError("Image too large (max 2MB). Please pick a smaller file.");
      return;
    }
    setFoodFormError("");
    setImageFile(file);
  };

  // Booking UI state
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingStatus, setBookingStatus] = useState("All");
  const [actingId, setActingId] = useState(null);

  const pushToast = (message, type = "success") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev.slice(-2), { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const dismissToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const flash = (msg, type = "success") => pushToast(msg, type);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [dishData, bookingData] = await Promise.all([
        getDishes().catch(() => []),
        getReservations().catch((e) => {
          // Surface auth problems but don't break the dishes table
          if (e instanceof ApiError && (e.status === 401 || e.status === 403)) throw e;
          return [];
        }),
      ]);
      setDishes(Array.isArray(dishData) ? dishData : []);
      setReservations(Array.isArray(bookingData) ? bookingData : []);
    } catch (e) {
      pushToast(e.message || "Could not load dashboard data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // Real database only: wipe any leftover browser food keys (e.g. "nb_foods").
    // Nothing is read from or written to localStorage — dishes come from MongoDB.
    try {
      for (const k of ["nb_foods", "nbFoods", "neon_foods", "foods", "dishes", "menuItems"]) {
        localStorage.removeItem(k);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Object URL for the picked upload, cleaned up on change/unmount
  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const stats = useMemo(() => {
    const pending = reservations.filter((r) => (r.status || "Pending") === "Pending").length;
    const confirmed = reservations.filter((r) => r.status === "Confirmed").length;
    const cancelled = reservations.filter((r) => r.status === "Cancelled").length;
    const guests = reservations.reduce((sum, r) => sum + (Number(r.guests) || 0), 0);
    const revenue = dishes.reduce((sum, d) => sum + (Number(d.price) || 0), 0);
    return [
      { label: "Food Items", value: dishes.length, hint: `${new Set(dishes.map((d) => d.category).filter(Boolean)).size} categories` },
      { label: "Total Bookings", value: reservations.length, hint: `${guests} guests expected` },
      { label: "Pending", value: pending, hint: "awaiting confirmation", accent: pending > 0 },
      { label: "Confirmed", value: confirmed, hint: `${cancelled} cancelled` },
      { label: "Menu Value", value: `$${revenue.toFixed(0)}`, hint: "sum of dish prices", hideMobile: true },
    ];
  }, [dishes, reservations]);

  const filteredDishes = useMemo(() => {
    const q = foodSearch.trim().toLowerCase();
    return dishes.filter((d) => {
      const okCat = foodCategory === "All" || (d.category || "") === foodCategory;
      if (!okCat) return false;
      if (!q) return true;
      return [d.title || d.name, d.description, d.category, String(d.price)]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [dishes, foodSearch, foodCategory]);

  const filteredBookings = useMemo(() => {
    const q = bookingSearch.trim().toLowerCase();
    return reservations.filter((r) => {
      const status = r.status || "Pending";
      if (bookingStatus !== "All" && status !== bookingStatus) return false;
      if (!q) return true;
      return [r.name, r.email, r.phone, String(r.guests), r.time]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [reservations, bookingSearch, bookingStatus]);

  const dishCategories = useMemo(() => {
    const fromData = [...new Set(dishes.map((d) => d.category).filter(Boolean))];
    return ["All", ...[...new Set([...fromData])]];
  }, [dishes]);

  // ---- Food CRUD ----
  const openAddModal = () => {
    setEditing(null);
    setFoodForm(emptyFoodForm);
    setImageFile(null);
    setImagePreview("");
    setFoodFormError("");
    setModalOpen(true);
  };

  const openEditModal = (dish) => {
    setEditing(dish);
    setFoodForm({
      title: dish.title || dish.name || "",
      description: dish.description || dish.desc || "",
      price: dish.price ?? "",
      category: dish.category || dish.tag || "",
    });
    setImageFile(null);
    setImagePreview(resolveImageUrl(dish.image) || "");
    setFoodFormError("");
    setModalOpen(true);
  };

  const handleFoodSubmit = async (e) => {
    e.preventDefault();
    setFoodFormError("");
    const title = foodForm.title.trim();
    const price = Number(foodForm.price);
    if (!title) return setFoodFormError("Please enter a title.");
    if (foodForm.price === "" || !Number.isFinite(price) || price < 0)
      return setFoodFormError("Please enter a valid non-negative price.");
    if (!foodForm.category.trim()) return setFoodFormError("Please enter a category.");

    setSavingFood(true);
    try {
      let payload;
      if (imageFile) {
        payload = new FormData();
        payload.append("title", title);
        payload.append("description", foodForm.description.trim());
        payload.append("price", String(price));
        payload.append("category", foodForm.category.trim().toUpperCase());
        payload.append("image", imageFile);
      } else {
        payload = {
          title,
          description: foodForm.description.trim(),
          price,
          category: foodForm.category.trim().toUpperCase(),
        };
        // Keep the existing image on edit when no new file is picked
        if (editing?.image && resolveImageUrl(editing.image) === imagePreview) {
          payload.image = editing.image;
        }
      }
      if (editing) {
        const id = editing._id || editing.id;
        const updated = await updateDish(id, payload);
        setDishes((prev) => prev.map((d) => ((d._id || d.id) === id ? { ...d, ...updated } : d)));
        flash(`“${title}” updated.`);
      } else {
        const created = await createDish(payload);
        const doc = Array.isArray(created) ? created[0] : created;
        if (doc) setDishes((prev) => [doc, ...prev]);
        else await loadAll();
        flash(`“${title}” added to the menu.`);
      }
      setModalOpen(false);
    } catch (err) {
      setFoodFormError(err.message || "Could not save the dish.");
    } finally {
      setSavingFood(false);
    }
  };

  const requestDeleteDish = (dish) => {
    const name = dish.title || dish.name || "this dish";
    setConfirmDialog({
      kind: "dish",
      title: `Delete “${name}”?`,
      message: "This will permanently remove it from the live menu. This action cannot be undone.",
      confirmLabel: "DELETE DISH",
      data: dish,
    });
  };

  const requestDeleteBooking = (booking) => {
    setConfirmDialog({
      kind: "booking",
      title: `Delete booking for “${booking.name}”?`,
      message: `${formatDate(booking.date)} · ${booking.time} · ${booking.guests} guests${booking.email ? ` · ${booking.email}` : ""}. This cannot be undone.`,
      confirmLabel: "DELETE BOOKING",
      data: booking,
    });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDialog) return;
    const { kind, data } = confirmDialog;
    const id = data._id || data.id;
    setActingId(id);
    try {
      if (kind === "dish") {
        const name = data.title || data.name || "Dish";
        await deleteDish(id);
        setDishes((prev) => prev.filter((d) => (d._id || d.id) !== id));
        pushToast(`“${name}” deleted.`, "success");
      } else {
        await deleteReservation(id);
        setReservations((prev) => prev.filter((r) => String(r._id || r.id) !== String(id)));
        pushToast(`Booking for “${data.name}” deleted.`, "success");
      }
      setConfirmDialog(null);
    } catch (err) {
      pushToast(err.message || "Could not delete.", "error");
    } finally {
      setActingId(null);
    }
  };

  // ---- Booking admin ----
  const handleStatusChange = async (id, status) => {
    setActingId(id);
    try {
      const updated = await updateReservationStatus(id, status);
      setReservations((prev) => prev.map((r) => (String(r._id || r.id) === String(id) ? { ...r, ...updated } : r)));
      pushToast(`Booking marked as ${status}.`, "success");
    } catch (err) {
      pushToast(err.message || "Could not update booking status.", "error");
    } finally {
      setActingId(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-surface-container-low border-r border-outline-variant/30 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/20">
          <Link to="/" className="font-headline text-headline-md text-primary tracking-tighter">
            NEON BISTRO
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-on-surface-variant hover:text-primary"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        <p className="px-6 pt-5 pb-2 font-label text-label-caps text-on-surface-variant/60 tracking-widest">
          ADMIN PANEL
        </p>
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-label text-interactive transition-all ${
                  active
                    ? "bg-primary-container/15 text-primary border border-primary/25 glow-sm"
                    : "text-on-surface-variant hover:text-primary hover:bg-surface-container"
                }`}
              >
                <Icon active={active} />
                {tab.label}
                {tab.id === "bookings" &&
                  reservations.filter((r) => (r.status || "Pending") === "Pending").length > 0 && (
                    <span className="ml-auto bg-primary-container text-black text-[11px] font-bold rounded-full min-w-[22px] h-[22px] flex items-center justify-center px-1">
                      {reservations.filter((r) => (r.status || "Pending") === "Pending").length}
                    </span>
                  )}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-outline-variant/20">
          <div className="bg-surface-container rounded-lg p-4 border border-outline-variant/20">
            <p className="font-label text-label-caps text-on-surface-variant/70">NEED HELP?</p>
            <p className="mt-1 font-body text-body-md text-on-surface-variant">
              Dishes update live on the public menu.
            </p>
            <Link
              to="/"
              className="mt-3 inline-block font-label text-interactive text-primary hover:underline"
            >
              View website →
            </Link>
          </div>
        </div>
      </aside>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Top navbar */}
        <header className="sticky top-0 z-20 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30">
          <div className="flex items-center gap-3 px-4 md:px-8 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-primary p-2 -ml-2"
              aria-label="Open menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
            <div className="min-w-0">
              <h1 className="font-headline text-headline-md text-primary truncate">
                {TABS.find((t) => t.id === activeTab)?.label}
              </h1>
              <p className="font-body text-body-md text-on-surface-variant truncate hidden sm:block">
                {activeTab === "dashboard" && "Overview of your menu and reservations."}
                {activeTab === "menu" && `${dishes.length} food items live on the menu.`}
                {activeTab === "bookings" && `${reservations.length} customer reservations.`}
                {activeTab === "settings" && "Workspace preferences and admin profile."}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={loadAll}
                className="hidden sm:inline-flex border border-outline-variant/40 text-on-surface-variant hover:text-primary hover:border-primary/50 px-4 py-2 rounded font-label text-label-caps transition-colors"
              >
                REFRESH
              </button>
              <div className="flex items-center gap-3 bg-surface-container border border-outline-variant/30 rounded-full pl-1 pr-4 py-1">
                <span
                  title={user?.email}
                  className="w-9 h-9 rounded-full bg-primary-container text-black font-headline text-[14px] flex items-center justify-center flex-shrink-0"
                >
                  {(user?.name || "A").charAt(0).toUpperCase()}
                </span>
                <div className="leading-tight hidden xs:block sm:block">
                  <p className="font-label text-interactive text-on-surface truncate max-w-[120px]">
                    {user?.name || "Admin"}
                  </p>
                  <p className="font-body text-[12px] text-on-surface-variant truncate max-w-[140px]">
                    {user?.email || "admin"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-primary-container text-black px-4 md:px-5 py-2.5 rounded font-label text-label-caps glow-sm hover:brightness-110 transition-all"
              >
                LOGOUT
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-8 py-6 md:py-8 max-w-[1200px] w-full mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-outline-variant border-t-primary animate-spin" />
              <p className="font-label text-label-caps text-on-surface-variant tracking-widest">LOADING DASHBOARD…</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === "dashboard" && (
                <motion.section
                  key="dashboard"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.filter((s) => !s.hideMobile).map((s) => (
                      <div
                        key={s.label}
                        className="bg-surface/60 backdrop-blur-[8px] border border-outline-variant/20 rounded-xl p-5 hover:border-primary/30 transition-colors"
                      >
                        <p className="font-label text-label-caps text-on-surface-variant/70">{s.label.toUpperCase()}</p>
                        <p className={`mt-2 font-headline text-headline-lg ${s.accent ? "text-amber-300" : "text-primary"}`}>
                          {s.value}
                        </p>
                        <p className="mt-1 font-body text-body-md text-on-surface-variant">{s.hint}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-surface/60 border border-outline-variant/20 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="font-headline text-headline-md text-primary">Recent bookings</h2>
                        <button onClick={() => setActiveTab("bookings")} className="font-label text-interactive text-primary hover:underline">
                          View all →
                        </button>
                      </div>
                      {reservations.length === 0 ? (
                        <EmptyState title="No bookings yet" hint="New reservations from the website will appear here." />
                      ) : (
                        <ul className="space-y-3">
                          {reservations.slice(0, 5).map((r) => (
                            <li key={r._id || r.id} className="flex items-center gap-3 bg-surface-container/60 border border-outline-variant/20 rounded-lg px-4 py-3">
                              <span className="w-10 h-10 rounded-full bg-primary-container/15 text-primary font-headline flex items-center justify-center shrink-0">
                                {(r.name || "?").charAt(0).toUpperCase()}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="font-label text-interactive text-on-surface truncate">{r.name}</p>
                                <p className="font-body text-[13px] text-on-surface-variant truncate">
                                  {formatDate(r.date)} · {r.time} · {r.guests} guests
                                </p>
                              </div>
                              <span className={statusBadge(r.status || "Pending")}>{(r.status || "Pending").toUpperCase()}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="bg-surface/60 border border-outline-variant/20 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="font-headline text-headline-md text-primary">Menu snapshot</h2>
                        <button onClick={() => setActiveTab("menu")} className="font-label text-interactive text-primary hover:underline">
                          Manage →
                        </button>
                      </div>
                      {dishes.length === 0 ? (
                        <EmptyState title="Menu is empty" hint="Add your first dish to go live." actionLabel="ADD FOOD ITEM" onAction={openAddModal} />
                      ) : (
                        <ul className="space-y-3">
                          {dishes.slice(0, 5).map((d) => (
                            <li key={d._id || d.id} className="flex items-center gap-3 bg-surface-container/60 border border-outline-variant/20 rounded-lg px-3 py-2.5">
                              {resolveImageUrl(d.image) ? (
                                <img src={resolveImageUrl(d.image)} alt={d.title} className="w-11 h-11 rounded-lg object-cover shrink-0" />
                              ) : (
                                <span className="w-11 h-11 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant shrink-0">🍽</span>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="font-label text-interactive text-on-surface truncate">{d.title || d.name}</p>
                                <p className="font-body text-[13px] text-on-surface-variant truncate">{d.category} · ${d.price}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </motion.section>
              )}

              {activeTab === "menu" && (
                <motion.section
                  key="menu"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <div className="flex flex-1 gap-3">
                      <input
                        value={foodSearch}
                        onChange={(e) => setFoodSearch(e.target.value)}
                        placeholder="Search dishes…"
                        className="flex-1 bg-surface-container text-on-surface px-4 py-2.5 rounded border-b-2 border-outline-variant focus:border-primary focus:outline-none font-body text-body-md placeholder:text-on-surface-variant/40"
                      />
                      <select
                        value={foodCategory}
                        onChange={(e) => setFoodCategory(e.target.value)}
                        className="bg-surface-container text-on-surface px-4 py-2.5 rounded border-b-2 border-outline-variant focus:border-primary focus:outline-none font-body text-body-md"
                      >
                        {dishCategories.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={openAddModal}
                      className="bg-primary-container text-black px-6 py-3 rounded font-label text-label-caps glow-sm hover:brightness-110 transition-all whitespace-nowrap"
                    >
                      + ADD NEW FOOD ITEM
                    </button>
                  </div>

                  <div className="mt-4 bg-surface/60 border border-outline-variant/20 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[760px] text-left">
                        <thead>
                          <tr className="border-b border-outline-variant/20 font-label text-label-caps text-on-surface-variant/70">
                            <th className="px-5 py-4">IMAGE</th>
                            <th className="px-5 py-4">NAME</th>
                            <th className="px-5 py-4">DESCRIPTION</th>
                            <th className="px-5 py-4">PRICE</th>
                            <th className="px-5 py-4">CATEGORY</th>
                            <th className="px-5 py-4 text-right">ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredDishes.map((d) => (
                            <tr key={d._id || d.id} className="border-b border-outline-variant/10 hover:bg-surface-container/40 transition-colors">
                              <td className="px-5 py-3">
                                {resolveImageUrl(d.image) ? (
                                  <img src={resolveImageUrl(d.image)} alt={d.title || d.name} className="w-12 h-12 rounded-lg object-cover" />
                                ) : (
                                  <span className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center text-lg">🍽</span>
                                )}
                              </td>
                              <td className="px-5 py-3 font-label text-interactive text-on-surface max-w-[160px] truncate">
                                {d.title || d.name}
                              </td>
                              <td className="px-5 py-3 font-body text-body-md text-on-surface-variant max-w-[280px] truncate" title={d.description}>
                                {d.description || "—"}
                              </td>
                              <td className="px-5 py-3 font-headline text-primary whitespace-nowrap">${d.price}</td>
                              <td className="px-5 py-3">
                                <span className="bg-surface-container text-on-surface-variant px-2.5 py-1 rounded font-label text-[11px] tracking-widest border border-outline-variant/30 whitespace-nowrap">
                                  {d.category || "—"}
                                </span>
                              </td>
                              <td className="px-5 py-3">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => openEditModal(d)}
                                    className="border border-primary/40 text-primary hover:bg-primary-container hover:text-black hover:border-primary-container px-4 py-1.5 rounded font-label text-[12px] tracking-widest transition-all"
                                  >
                                    EDIT
                                  </button>
                                  <button
                                    onClick={() => requestDeleteDish(d)}
                                    className="border border-error/40 text-error hover:bg-error-container hover:text-on-error-container px-4 py-1.5 rounded font-label text-[12px] tracking-widest transition-all"
                                  >
                                    DELETE
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {filteredDishes.length === 0 && (
                      <div className="p-10">
                        <EmptyState title="No dishes found" hint="Try a different search or add a new item." actionLabel="ADD FOOD ITEM" onAction={openAddModal} />
                      </div>
                    )}
                  </div>
                </motion.section>
              )}

              {activeTab === "bookings" && (
                <motion.section
                  key="bookings"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="flex flex-col md:flex-row gap-3">
                    <input
                      value={bookingSearch}
                      onChange={(e) => setBookingSearch(e.target.value)}
                      placeholder="Search name, email, phone…"
                      className="flex-1 bg-surface-container text-on-surface px-4 py-2.5 rounded border-b-2 border-outline-variant focus:border-primary focus:outline-none font-body text-body-md placeholder:text-on-surface-variant/40"
                    />
                    <select
                      value={bookingStatus}
                      onChange={(e) => setBookingStatus(e.target.value)}
                      className="bg-surface-container text-on-surface px-4 py-2.5 rounded border-b-2 border-outline-variant focus:border-primary focus:outline-none font-body text-body-md"
                    >
                      {["All", ...STATUSES].map((s) => (
                        <option key={s} value={s}>{s === "All" ? "All statuses" : s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-4 bg-surface/60 border border-outline-variant/20 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[900px] text-left">
                        <thead>
                          <tr className="border-b border-outline-variant/20 font-label text-label-caps text-on-surface-variant/70">
                            <th className="px-5 py-4">CUSTOMER</th>
                            <th className="px-5 py-4">EMAIL</th>
                            <th className="px-5 py-4">PHONE</th>
                            <th className="px-5 py-4">DATE / TIME</th>
                            <th className="px-5 py-4">GUESTS</th>
                            <th className="px-5 py-4">STATUS</th>
                            <th className="px-5 py-4 text-right">ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredBookings.map((b) => {
                            const id = b._id || b.id;
                            const busy = actingId === id;
                            return (
                              <tr key={id} className="border-b border-outline-variant/10 hover:bg-surface-container/40 transition-colors">
                                <td className="px-5 py-3 font-label text-interactive text-on-surface whitespace-nowrap">{b.name}</td>
                                <td className="px-5 py-3 font-body text-body-md text-on-surface-variant max-w-[200px] truncate" title={b.email}>{b.email}</td>
                                <td className="px-5 py-3 font-body text-body-md text-on-surface-variant whitespace-nowrap">{b.phone || "—"}</td>
                                <td className="px-5 py-3 font-body text-body-md text-on-surface whitespace-nowrap">
                                  {formatDate(b.date)} · {b.time}
                                </td>
                                <td className="px-5 py-3 font-body text-body-md text-on-surface text-center">{b.guests}</td>
                                <td className="px-5 py-3">
                                  <span className={statusBadge(b.status || "Pending")}>{(b.status || "Pending").toUpperCase()}</span>
                                </td>
                                <td className="px-5 py-3">
                                  <div className="flex justify-end items-center gap-2">
                                    <select
                                      value={b.status || "Pending"}
                                      disabled={busy}
                                      onChange={(e) => handleStatusChange(id, e.target.value)}
                                      className="bg-surface-container text-on-surface px-3 py-1.5 rounded border border-outline-variant/40 focus:border-primary focus:outline-none font-label text-[12px] tracking-widest disabled:opacity-50"
                                      aria-label={`Update status for ${b.name}`}
                                    >
                                      {STATUSES.map((s) => (
                                        <option key={s} value={s}>{s.toUpperCase()}</option>
                                      ))}
                                    </select>
                                    <button
                                      disabled={busy}
                                      onClick={() => requestDeleteBooking(b)}
                                      className="border border-error/40 text-error hover:bg-error-container hover:text-on-error-container px-3 py-1.5 rounded font-label text-[12px] tracking-widest transition-all disabled:opacity-50"
                                    >
                                      {busy ? "…" : "DELETE"}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {filteredBookings.length === 0 && (
                      <div className="p-10">
                        <EmptyState title="No bookings found" hint="Reservations made on the website will show up here." />
                      </div>
                    )}
                  </div>
                </motion.section>
              )}

              {activeTab === "settings" && (
                <motion.section
                  key="settings"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-4"
                >
                  <div className="bg-surface/60 border border-outline-variant/20 rounded-xl p-6">
                    <h2 className="font-headline text-headline-md text-primary">Admin profile</h2>
                    <div className="mt-5 flex items-center gap-4">
                      <span className="w-14 h-14 rounded-full bg-primary-container text-black font-headline text-[20px] flex items-center justify-center">
                        {(user?.name || "A").charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <p className="font-label text-interactive text-on-surface text-[16px]">{user?.name}</p>
                        <p className="font-body text-body-md text-on-surface-variant">{user?.email}</p>
                        <span className="mt-1 inline-block bg-primary-container/15 text-primary border border-primary/25 px-2.5 py-0.5 rounded-full font-label text-[11px] tracking-widest">
                          {(user?.role || "admin").toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="mt-6 w-full border border-error/40 text-error hover:bg-error-container hover:text-on-error-container py-3 rounded font-label text-label-caps transition-all"
                    >
                      LOG OUT
                    </button>
                  </div>
                  <div className="bg-surface/60 border border-outline-variant/20 rounded-xl p-6">
                    <h2 className="font-headline text-headline-md text-primary">Workspace</h2>
                    <dl className="mt-5 space-y-4 font-body text-body-md">
                      <div className="flex justify-between gap-4 border-b border-outline-variant/15 pb-3">
                        <dt className="text-on-surface-variant">Menu items</dt>
                        <dd className="text-on-surface font-semibold">{dishes.length}</dd>
                      </div>
                      <div className="flex justify-between gap-4 border-b border-outline-variant/15 pb-3">
                        <dt className="text-on-surface-variant">Bookings</dt>
                        <dd className="text-on-surface font-semibold">{reservations.length}</dd>
                      </div>
                      <div className="flex justify-between gap-4 border-b border-outline-variant/15 pb-3">
                        <dt className="text-on-surface-variant">Pending confirmations</dt>
                        <dd className="text-amber-300 font-semibold">
                          {reservations.filter((r) => (r.status || "Pending") === "Pending").length}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-on-surface-variant">Image uploads</dt>
                        <dd className="text-on-surface-variant text-right">Max 2MB, stored in /uploads</dd>
                      </div>
                    </dl>
                    <Link
                      to="/"
                      className="mt-6 block text-center bg-primary-container text-black py-3 rounded font-label text-label-caps glow-sm hover:brightness-110 transition-all"
                    >
                      VIEW PUBLIC SITE
                    </Link>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* Add / Edit food modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !savingFood && setModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-surface border border-outline-variant/30 rounded-xl p-6 md:p-8 glow-md max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-label text-label-caps text-on-surface-variant/70 tracking-widest">
                    {editing ? "EDIT FOOD ITEM" : "NEW FOOD ITEM"}
                  </p>
                  <h2 className="mt-1 font-headline text-headline-md text-primary">
                    {editing ? `Edit “${editing.title || editing.name}”` : "Add to the menu"}
                  </h2>
                </div>
                <button
                  onClick={() => !savingFood && setModalOpen(false)}
                  className="text-on-surface-variant hover:text-primary text-xl leading-none"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {foodFormError && (
                <div className="mt-4 bg-error-container/20 border border-error/40 text-on-error-container px-4 py-3 rounded font-body text-body-md">
                  {foodFormError}
                </div>
              )}

              <form onSubmit={handleFoodSubmit} className="mt-5 flex flex-col gap-4">
                <div>
                  <label className="block font-label text-label-caps text-primary mb-2" htmlFor="food-title">TITLE</label>
                  <input
                    id="food-title"
                    value={foodForm.title}
                    onChange={(e) => setFoodForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Neon Tuna Tartare"
                    className="w-full bg-surface-container text-on-surface px-4 py-3 rounded border-b-2 border-outline-variant focus:border-primary focus:outline-none font-body text-body-md placeholder:text-on-surface-variant/40"
                  />
                </div>
                <div>
                  <label className="block font-label text-label-caps text-primary mb-2" htmlFor="food-desc">DESCRIPTION</label>
                  <textarea
                    id="food-desc"
                    value={foodForm.description}
                    onChange={(e) => setFoodForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Short tasty description…"
                    rows={3}
                    className="w-full bg-surface-container text-on-surface px-4 py-3 rounded border-b-2 border-outline-variant focus:border-primary focus:outline-none font-body text-body-md placeholder:text-on-surface-variant/40 resize-y"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-label text-label-caps text-primary mb-2" htmlFor="food-price">PRICE ($)</label>
                    <input
                      id="food-price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={foodForm.price}
                      onChange={(e) => setFoodForm((f) => ({ ...f, price: e.target.value }))}
                      placeholder="24"
                      className="w-full bg-surface-container text-on-surface px-4 py-3 rounded border-b-2 border-outline-variant focus:border-primary focus:outline-none font-body text-body-md placeholder:text-on-surface-variant/40"
                    />
                  </div>
                  <div>
                    <label className="block font-label text-label-caps text-primary mb-2" htmlFor="food-cat">CATEGORY</label>
                    <input
                      id="food-cat"
                      value={foodForm.category}
                      onChange={(e) => setFoodForm((f) => ({ ...f, category: e.target.value }))}
                      placeholder="e.g. SIGNATURE"
                      list="admin-categories"
                      className="w-full bg-surface-container text-on-surface px-4 py-3 rounded border-b-2 border-outline-variant focus:border-primary focus:outline-none font-body text-body-md placeholder:text-on-surface-variant/40 uppercase"
                    />
                    <datalist id="admin-categories">
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>
                </div>
                <div>
                  <span className="block font-label text-label-caps text-primary mb-2" id="food-image-label">IMAGE UPLOAD</span>
                  {/* Native <label> activation is more reliable than a
                      programmatic ref.click() for opening the file dialog
                      (works inside animated containers, all browsers). The
                      input is visually hidden but NOT display:none, so the
                      label can still activate it. */}
                  <label
                    htmlFor="food-image"
                    className="flex items-center gap-4 bg-surface-container border border-dashed border-outline-variant/50 hover:border-primary/60 rounded-lg p-4 cursor-pointer transition-colors"
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                    ) : (
                      <span className="w-16 h-16 rounded-lg bg-surface-container-high flex items-center justify-center text-2xl shrink-0">🖼</span>
                    )}
                    <span className="font-body text-body-md text-on-surface-variant">
                      {imageFile ? imageFile.name : editing ? "Pick a new image (optional — keeps current)" : "Pick an image — JPG/PNG up to 2MB"}
                      <span className="block text-[13px] opacity-70">Click to browse files</span>
                    </span>
                  </label>
                  <input
                    ref={fileInputRef}
                    id="food-image"
                    type="file"
                    accept="image/*"
                    style={{
                      position: "absolute",
                      width: "1px",
                      height: "1px",
                      opacity: 0,
                      overflow: "hidden",
                    }}
                    onChange={handleImageChange}
                  />
                </div>
                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    disabled={savingFood}
                    onClick={() => setModalOpen(false)}
                    className="flex-1 border border-outline-variant/40 text-on-surface-variant hover:text-primary hover:border-primary/50 py-3 rounded font-label text-label-caps transition-colors disabled:opacity-50"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={savingFood}
                    className="flex-1 bg-primary-container text-black py-3 rounded font-label text-label-caps glow-sm hover:brightness-110 transition-all disabled:opacity-60"
                  >
                    {savingFood ? "SAVING…" : editing ? "SAVE CHANGES" : "ADD ITEM"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation — replaces window.confirm */}
      <AnimatePresence>
        {confirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setConfirmDialog(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-delete-title"
              className="w-full max-w-md bg-surface border border-outline-variant/30 rounded-xl p-6 glow-md"
            >
              <div className="w-12 h-12 rounded-full bg-error-container/20 border border-error/30 flex items-center justify-center text-error text-xl">
                !
              </div>
              <h2 id="confirm-delete-title" className="mt-4 font-headline text-headline-md text-on-surface">
                {confirmDialog.title}
              </h2>
              <p className="mt-2 font-body text-body-md text-on-surface-variant">
                {confirmDialog.message}
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="flex-1 border border-outline-variant/40 text-on-surface-variant hover:text-primary hover:border-primary/50 py-3 rounded font-label text-label-caps transition-colors"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={actingId !== null}
                  className="flex-1 bg-error-container text-on-error-container py-3 rounded font-label text-label-caps hover:brightness-110 transition-all disabled:opacity-60"
                >
                  {actingId !== null ? "DELETING…" : confirmDialog.confirmLabel || "DELETE"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toasts — replaces alert() */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

function ToastStack({ toasts, onDismiss }) {
  return (
    <div className="fixed bottom-5 right-5 z-[70] flex flex-col gap-3 w-[min(92vw,360px)]">
      <AnimatePresence>
        {toasts.map((t) => {
          const isError = t.type === "error";
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ duration: 0.22 }}
              className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border backdrop-blur-xl shadow-2xl ${
                isError
                  ? "bg-[#2a1215]/95 border-error/40"
                  : "bg-surface-container-high/95 border-primary/30 shadow-[0_0_25px_rgba(255,95,0,0.25)]"
              }`}
            >
              <span
                className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold text-[14px] ${
                  isError ? "bg-error-container text-on-error-container" : "bg-primary-container text-black"
                }`}
              >
                {isError ? "✕" : "✓"}
              </span>
              <p className="flex-1 font-body text-body-md text-on-surface leading-snug">{t.message}</p>
              <button
                onClick={() => onDismiss(t.id)}
                className="text-on-surface-variant hover:text-primary transition-colors shrink-0"
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function EmptyState({ title, hint, actionLabel, onAction }) {
  return (
    <div className="text-center py-6">
      <p className="font-headline text-headline-md text-on-surface">{title}</p>
      <p className="mt-1 font-body text-body-md text-on-surface-variant">{hint}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 bg-primary-container text-black px-6 py-2.5 rounded font-label text-label-caps glow-sm hover:brightness-110 transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function GridIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 2} className="shrink-0">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function MenuIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 2} className="shrink-0">
      <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
    </svg>
  );
}

function CalendarIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 2} className="shrink-0">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" strokeLinecap="round" />
    </svg>
  );
}

function CogIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 2} className="shrink-0">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.05a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z" />
    </svg>
  );
}
