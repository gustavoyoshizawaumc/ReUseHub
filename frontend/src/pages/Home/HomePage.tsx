import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../../services/authService";
import type { User } from "../../types/auth.types";
import { Header } from "../../components/Header";
import { HeroBanner } from "../../components/HeroBanner";
import { ProductSection } from "../../components/ProductSection";
import { mockFurniture, mockBooks } from "../../data/mocks";
import { Footer } from "../../components/Footer";

const ReUseHubLogo: React.FC = () => (
  <div className="flex items-center">
    <span className="text-2xl font-bold text-blue-600">ReUse</span>
    <span className="text-2xl font-bold text-orange-500">Hub</span>
  </div>
);

const categories = [
  { name: "Eletrônicos", icon: "📱", count: 120 },
  { name: "Móveis", icon: "🛋️", count: 85 },
  { name: "Roupas", icon: "👕", count: 210 },
  { name: "Livros", icon: "📚", count: 150 },
  { name: "Infantil", icon: "🧸", count: 90 },
  { name: "Esportes", icon: "⚽", count: 60 },
  { name: "Games", icon: "🎮", count: 45 },
  { name: "Ferramentas", icon: "🛠️", count: 70 },
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentUser(authService.getUser());
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    return parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name[0].toUpperCase();
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-3.5 h-3.5 ${i < Math.floor(rating) ? "text-yellow-400" : "text-gray-300"}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <HeroBanner />
        <ProductSection
          title="Mais procurados em Móveis"
          products={mockFurniture}
        />
        <ProductSection
          title="Mais procurados em Livros e Educação"
          products={mockBooks}
        />
      </main>
      <Footer />
    </div>
  );
};
