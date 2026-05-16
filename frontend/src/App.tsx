import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/Home/HomePage";
import { RegisterPage } from "./pages/Register/RegisterPage";
import { LoginPage } from "./pages/Login/LoginPage";
import { CriarAnuncioPage } from "./pages/Anuncios/CriarAnuncioPage";
import { EditarAnuncioPage } from "./pages/Anuncios/EditarAnuncioPage";
import { ListaAnunciosPage } from "./pages/Anuncios/ListaAnunciosPage";
import { DetalhesAnuncioPage } from "./pages/Anuncios/DetalhesAnuncioPage";
import { ProfilePage } from "./pages/Profile/ProfilePage";
import { EditProfilePage } from "./pages/Profile/EditProfilePage";
import { DeleteAccountPage } from "./pages/Profile/DeleteAccountPage";
import { ChatPage } from "./pages/Chat/ChatPage";
import { PrivateRoute } from "./components/PrivateRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route path="/anuncios" element={<ListaAnunciosPage />} />
        <Route path="/anuncios/:id" element={<DetalhesAnuncioPage />} />

        <Route
          path="/create-listing"
          element={
            <PrivateRoute>
              <CriarAnuncioPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/anuncios/:id/editar"
          element={
            <PrivateRoute>
              <EditarAnuncioPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/my-listings"
          element={
            <PrivateRoute>
              <ListaAnunciosPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <ChatPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />

        <Route
          path="/profile/edit"
          element={
            <PrivateRoute>
              <EditProfilePage />
            </PrivateRoute>
          }
        />

        <Route
          path="/profile/delete"
          element={
            <PrivateRoute>
              <DeleteAccountPage />
            </PrivateRoute>
          }
        />

        <Route
          path="*"
          element={
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] font-plus-jakarta-sans">
              <h1 className="text-9xl font-black text-slate-200">404</h1>
              <div className="text-center -mt-12">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Ops! Página não encontrada.
                </h2>
                <p className="text-slate-500 mb-8">
                  O link que você acessou pode estar quebrado ou a página foi
                  removida.
                </p>
                <button
                  onClick={() => window.history.back()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-100 active:scale-95"
                >
                  Voltar para onde eu estava
                </button>
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;