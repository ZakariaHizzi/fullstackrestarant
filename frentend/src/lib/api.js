/**
 * Secure backend client for Neon Bistro.
 *
 * Security model:
 * - Auth uses an HttpOnly JWT cookie set by the backend (never localStorage,
 *   so client-side JS / XSS cannot steal the token).
 * - Every request sends `credentials: "include"` so the cookie is attached,
 *   and the backend CORS policy must explicitly allow our origin.
 * - Base URL comes from `VITE_API_URL` (HTTPS in production). No hardcoded
 *   secrets or tokens live here — only a public origin hostname.
 */

const API_BASE_URL = "https://fullstackrestarant-dj45.vercel.app";

/** Normalized base URL without a trailing slash, e.g. https://api.example.com */

const DEFAULT_TIMEOUT_MS = 10000;

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Core fetch wrapper. Always sends cookies, enforces a timeout, never sends
 * `Content-Type: application/json` for FormData (the browser must set the
 * multipart boundary itself), and unwraps the backend envelope
 * `{ success, data }` so callers get the payload directly.
 */
async function apiFetch(path, options = {}) {
  const { timeout = DEFAULT_TIMEOUT_MS, ...init } = options;

  if (!path.startsWith("/")) {
    throw new ApiError("API path must start with '/'", 0);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const isFormData =
    typeof FormData !== "undefined" && init.body instanceof FormData;

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: "include", // send the HttpOnly auth cookie
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        // Only force JSON when the body is not FormData.
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...init.headers,
      },
    });

    if (res.status === 204) return null;

    const text = await res.text();
    let payload = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        throw new ApiError(
          res.ok ? "Unexpected server response" : text.slice(0, 300),
          res.status,
        );
      }
    }

    if (!res.ok) {
      const message =
        (payload && (payload.message || payload.error)) ||
        `Request failed with status ${res.status}`;
      throw new ApiError(message, res.status);
    }

    // Backend envelope is { success, data, ... } — return the inner data.
    if (payload && typeof payload === "object" && "data" in payload) {
      return payload.data;
    }
    return payload;
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new ApiError("Request timed out. Please try again.", 0);
    }
    if (err instanceof ApiError) throw err;
    throw new ApiError("Network error. Is the backend running?", 0);
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Auth — session lives in an HttpOnly cookie, nothing is stored in JS.
// ---------------------------------------------------------------------------

export async function signIn({ email, password } = {}) {
  return apiFetch("/users/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

export async function register({ name, email, password } = {}) {
  const cleanName = String(name || "").trim();
  if (!cleanName) throw new ApiError("Please enter your name.", 400);
  return apiFetch("/users/register", {
    method: "POST",
    body: JSON.stringify({
      name: cleanName,
      email,
      password,
    }),
  });
}

export async function signOut() {
  return apiFetch("/users/logout", { method: "POST" });
}

/** Restore the current session (used on app load / navbar). 401 = guest. */
export async function getMe() {
  return apiFetch("/users/me");
}

// ---------------------------------------------------------------------------
// Dishes (public reads, admin writes)
// ---------------------------------------------------------------------------

export async function getDishes() {
  return apiFetch("/dishes");
}

export async function getDish(id) {
  if (!id) throw new ApiError("Dish id is required.", 400);
  return apiFetch(`/dishes/${encodeURIComponent(String(id))}`);
}

/** Admin: accepts a plain object (JSON) or FormData (image upload). */
export async function createDish(payload) {
  const isForm = typeof FormData !== "undefined" && payload instanceof FormData;
  return apiFetch("/dishes", {
    method: "POST",
    body: isForm ? payload : JSON.stringify(payload),
  });
}

/** Admin: accepts a plain object (JSON) or FormData (image upload). */
export async function updateDish(id, payload) {
  if (!id) throw new ApiError("Dish id is required.", 400);
  const isForm = typeof FormData !== "undefined" && payload instanceof FormData;
  return apiFetch(`/dishes/${encodeURIComponent(String(id))}`, {
    method: "PUT",
    body: isForm ? payload : JSON.stringify(payload),
  });
}

/** Admin only. */
export async function deleteDish(id) {
  if (!id) throw new ApiError("Dish id is required.", 400);
  return apiFetch(`/dishes/${encodeURIComponent(String(id))}`, {
    method: "DELETE",
  });
}

// ---------------------------------------------------------------------------
// Reservations (login required; list is admin only)
// ---------------------------------------------------------------------------

export async function createReservation({
  date,
  time,
  guests,
  name,
  email,
  phone,
} = {}) {
  if (!date || !time || !guests) {
    throw new ApiError("Please provide date, time and number of guests.", 400);
  }
  return apiFetch("/reservations/addReservation", {
    method: "POST",
    body: JSON.stringify({ date, time, guests, name, email, phone }),
  });
}

export async function getReservations() {
  return apiFetch("/reservations");
}

/** Admin: update a booking's status (Pending | Confirmed | Cancelled). */
export async function updateReservationStatus(id, status) {
  if (!id) throw new ApiError("Reservation id is required.", 400);
  const allowed = ["Pending", "Confirmed", "Cancelled"];
  if (!allowed.includes(status)) {
    throw new ApiError("Status must be Pending, Confirmed or Cancelled.", 400);
  }
  return apiFetch(`/reservations/${encodeURIComponent(String(id))}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

/** Admin: delete a booking. */
export async function deleteReservation(id) {
  if (!id) throw new ApiError("Reservation id is required.", 400);
  return apiFetch(`/reservations/${encodeURIComponent(String(id))}`, {
    method: "DELETE",
  });
}

/**
 * Resolve a backend image reference to a usable URL.
 * - Absolute URLs (https://...) pass through.
 * - `/uploads/<file>` paths are served by the backend, so prefix API origin.
 */
export function resolveImageUrl(image) {
  if (!image) return "";
  if (/^https?:\/\//i.test(image)) return image;
  return `${API_BASE_URL}${image.startsWith("/") ? image : `/${image}`}`;
}

// ---------------------------------------------------------------------------
// Backwards-compatible aliases (old misnamed exports). Prefer the names
// above in new code.
// ---------------------------------------------------------------------------

/** @deprecated Use `getDish(id)` instead. */
export const getDishe = getDish;
/** @deprecated Use `deleteDish(id)` instead. */
export const deleteDishes = deleteDish;
/**
 * @deprecated Old name pointed at dishes; use `updateDish(id, payload)`.
 * Kept so existing admin code keeps working.
 */
export async function updateAppointmentStatus(id, status) {
  return updateDish(id, { status });
}
