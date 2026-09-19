import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import FeaturedDishes from "../components/FeaturedDishes";
import MenuSection from "../components/MenuSection";
import Reservations from "../components/Reservations";
import ContactSection from "../components/ContactSection";
import Footer from "../components/Footer";

export default function Home() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow pt-[80px]">
        <Hero />
        <FeaturedDishes />
        <MenuSection />
        <Reservations />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
