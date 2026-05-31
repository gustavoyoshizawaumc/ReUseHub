import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/Home/HomePage";
import { RegisterPage } from "./pages/Register/RegisterPage";
import { LoginPage } from "./pages/Login/LoginPage";
import { ForgotPasswordPage } from "./pages/ForgotPassword/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPassword/ResetPasswordPage";
import { CriarAnuncioPage } from "./pages/Anuncios/CriarAnuncioPage";
import { EditarAnuncioPage } from "./pages/Anuncios/EditarAnuncioPage";
import { ExplorarAnunciosPage } from "./pages/Anuncios/ExplorarAnunciosPage";
import { MeusAnunciosPage } from "./pages/Anuncios/MeusAnunciosPage";
import { DetalhesAnuncioPage } from "./pages/Anuncios/DetalhesAnuncioPage";
import { FavoritosPage } from "./pages/Anuncios/FavoritosPage";
import { ProfilePage } from "./pages/Profile/ProfilePage";
import { EditProfilePage } from "./pages/Profile/EditProfilePage";
import { DeleteAccountPage } from "./pages/Profile/DeleteAccountPage";
import { PublicProfilePage } from "./pages/Profile/PublicProfilePage";
import { ChatPage } from "./pages/Chat/ChatPage";
import { InteressesRecebidosPage } from "./pages/Interesse/InteressesRecebidosPage";
import { ModeracaoPage } from './pages/Moderacao/ModeracaoPage';
import { ModeratorRoute } from './components/ModeratorRoute';
import { UserOnlyRoute } from "./components/UserOnlyRoute";
import { MarketplaceOnlyRoute } from "./components/MarketplaceOnlyRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <MarketplaceOnlyRoute>
              <HomePage />
            </MarketplaceOnlyRoute>
          }
        />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
        <Route path="/redefinir-senha" element={<ResetPasswordPage />} />

        <Route
          path="/anuncios"
          element={
            <MarketplaceOnlyRoute>
              <ExplorarAnunciosPage />
            </MarketplaceOnlyRoute>
          }
        />
        <Route
          path="/anuncios/:id"
          element={
            <MarketplaceOnlyRoute>
              <DetalhesAnuncioPage />
            </MarketplaceOnlyRoute>
          }
        />

        <Route
          path="/create-listing"
          element={
            <UserOnlyRoute>
              <CriarAnuncioPage />
            </UserOnlyRoute>
          }
        />

        <Route
          path="/anuncios/:id/editar"
          element={
            <UserOnlyRoute>
              <EditarAnuncioPage />
            </UserOnlyRoute>
          }
        />

        <Route
          path="/meus-anuncios"
          element={
            <UserOnlyRoute>
              <MeusAnunciosPage />
            </UserOnlyRoute>
          }
        />

        <Route
          path="/favoritos"
          element={
            <UserOnlyRoute>
              <FavoritosPage />
            </UserOnlyRoute>
          }
        />

        <Route
          path="/favorites"
          element={
            <UserOnlyRoute>
              <FavoritosPage />
            </UserOnlyRoute>
          }
        />

        <Route
          path="/chat"
          element={
            <UserOnlyRoute>
              <ChatPage />
            </UserOnlyRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <UserOnlyRoute>
              <ProfilePage />
            </UserOnlyRoute>
          }
        />

        <Route
          path="/profile/edit"
          element={
            <UserOnlyRoute>
              <EditProfilePage />
            </UserOnlyRoute>
          }
        />

        <Route
          path="/profile/delete"
          element={
            <UserOnlyRoute>
              <DeleteAccountPage />
            </UserOnlyRoute>
          }
        />

        <Route
          path="/interesses"
          element={
            <UserOnlyRoute>
              <InteressesRecebidosPage />
            </UserOnlyRoute>
          }
        />

        <Route
          path="/interesses/recebidos"
          element={
            <UserOnlyRoute>
              <InteressesRecebidosPage />
            </UserOnlyRoute>
          }
        />

        <Route
          path="/perfil/:id"
          element={
            <MarketplaceOnlyRoute>
              <PublicProfilePage />
            </MarketplaceOnlyRoute>
          }
        />
        <Route
          path="/moderacao/*"
          element={
            <ModeratorRoute>
              <ModeracaoPage />
            </ModeratorRoute>
          }
        />

        <Route
          path="*"
          element={
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] px-4 font-plus-jakarta-sans">
              <h1 className="text-7xl font-black text-slate-200 sm:text-9xl">404</h1>
              <div className="-mt-7 max-w-lg text-center sm:-mt-12">
                <h2 className="mb-2 text-xl font-bold text-slate-900 sm:text-2xl">
                  Ops! Página não encontrada.
                </h2>
                <p className="text-slate-500 mb-8">
                  O link que você acessou pode estar quebrado ou a página foi
                  removida.
                </p>
                <button
                  onClick={() => window.history.back()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold transition-all shadow-sm active:scale-95"
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
