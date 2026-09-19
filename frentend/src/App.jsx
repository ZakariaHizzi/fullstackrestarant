import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Admin from "./pages/Admin";
import DishDetails from "./components/DishDetails";
import ReservationConfirmation from "./components/ReservationConfirmation";
import AdminRoute from "./components/AdminRoute";
import { AuthProvider } from "./lib/AuthContext";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dish/:id" element={<DishDetails />} />
          <Route
            path="/reservation/confirmation"
            element={<ReservationConfirmation />}
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
