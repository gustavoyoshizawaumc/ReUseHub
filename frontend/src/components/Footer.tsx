import React from "react";
import { Link } from "react-router-dom";

const footerLinks = [
  {
    titulo: "Marketplace",
    links: [
      { label: "Anúncios", to: "/anuncios" },
      { label: "Publicar anúncio", to: "/create-listing" },
      { label: "Favoritos", to: "/favoritos" },
    ],
  },
  {
    titulo: "Conta",
    links: [
      { label: "Entrar", to: "/login" },
      { label: "Criar conta", to: "/register" },
      { label: "Meus anúncios", to: "/meus-anuncios" },
      { label: "Trocas", to: "/interesses" },
      { label: "Chat", to: "/chat" },
    ],
  },
  {
    titulo: "Informações",
    links: [
      { label: "Política de privacidade", to: "/privacidade" },
      { label: "Manual do usuário", to: "/manual" },
    ],
  },
];

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/50 bg-[#0f172a] py-8 text-slate-400">
      <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-x-6 gap-y-8 px-4 text-left md:grid-cols-10 md:gap-12">
        <div className="col-span-2 flex flex-col items-start md:col-span-4">
          <div className="mb-1">
            <h2 className="text-2xl font-bold">
              <span className="text-blue-600">Re</span>
              <span className="text-orange-500">Use</span>
              <span className="text-slate-200">Hub</span>
            </h2>
          </div>
          <p className="max-w-xs text-left text-xs leading-relaxed">
            Plataforma gratuita de doação e troca de itens usados, promovendo
            economia circular, consumo consciente e negociação segura entre usuários.
          </p>
        </div>

        {footerLinks.map((grupo) => (
          <div key={grupo.titulo} className="flex flex-col items-start md:col-span-2">
            <h3 className="mb-4 text-sm font-semibold tracking-wider text-slate-100">
              {grupo.titulo}
            </h3>
            <ul className="space-y-4 text-left text-xs">
              {grupo.links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="transition-colors hover:text-blue-500">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto max-w-[1400px] px-4">
        <div className="mt-10 border-t border-slate-800/50 pt-6 text-center text-xs text-slate-500 md:mt-16 md:pt-8">
          &copy; {new Date().getFullYear()} ReUseHub. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
};
