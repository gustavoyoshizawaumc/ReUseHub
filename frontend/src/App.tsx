import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { RegisterPage } from "./pages/Register/RegisterPage";
import { LoginPage } from "./pages/Login/LoginPage";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Se o login estiver vazio, talvez a rota padrão esteja errada */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Rota temporária para o Dashboard */}
        <Route path="/dashboard" element={<div>Bem-vindo ao ReUseHub!</div>} />
      </Routes>
    </Router>
  );
}

export default App;
