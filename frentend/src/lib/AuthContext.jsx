// Auth state: database + HttpOnly cookie only. No localStorage.

import { createContext, useContext, useEffect, useState } from "react";
import { signIn, signOut, register, getMe } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on reload via GET /users/me (cookie auth, DB-backed)
  useEffect(() => {
    (async () => {
      try {
        const profile = await getMe();
        setUser(profile || null);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(credentials) {
    const profile = await signIn(credentials);
    setUser(profile || null);
    return profile;
  }

  async function signup(fields) {
    const profile = await register(fields);
    setUser(profile || null);
    return profile;
  }

  async function logout() {
    try {
      await signOut();
    } finally {
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
