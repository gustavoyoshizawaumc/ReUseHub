import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/Home/HomePage";
import { RegisterPage } from "./pages/Register/RegisterPage";
import { LoginPage } from "./pages/Login/LoginPage";

import { CreateListingPage } from "./pages/Listings/CreateListingPage";
import { MyListingsPage } from "./pages/Listings/ListingsPage";
import { ListingDetailsPage } from "./pages/Listings/ListingDetailsPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* 1️⃣ Criar Anúncio (Priority 1) */}
        <Route path="/create-listing" element={<CreateListingPage />} />
        <Route path="/listings" element={<MyListingsPage />} />

        <Route path="/listings/:id" element={<ListingDetailsPage />} />

        <Route
          path="*"
          element={
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
              <p className="text-lg text-gray-600">Página não encontrada.</p>
              <button
                onClick={() => window.history.back()}
                className="mt-6 bg-reusehub-blue text-white px-6 py-2 rounded-full font-bold transition-transform active:scale-95"
              >
                Voltar
              </button>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
