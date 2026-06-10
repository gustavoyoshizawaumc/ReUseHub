import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  Heart,
  LifeBuoy,
  MessageCircle,
  Search,
  ShieldAlert,
  Star,
  Store,
  UserRound,
} from "lucide-react";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";

const passos = [
  {
    titulo: "Cadastro e acesso",
    icon: UserRound,
    itens: [
      "Crie sua conta com nome, e-mail, CPF, telefone e senha forte.",
      "Confirme o consentimento LGPD para utilizar a plataforma.",
      "Use a recuperação de senha por e-mail caso esqueça o acesso.",
    ],
  },
  {
    titulo: "Publicar anúncios",
    icon: Store,
    itens: [
      "Cadastre o título, descrição, categoria, tipo, condição e CEP do item.",
      "Adicione imagens reais do produto para facilitar a análise e a negociação.",
      "Após criar ou editar um anúncio, ele volta para análise da moderação antes de ficar público.",
    ],
  },
  {
    titulo: "Buscar e filtrar",
    icon: Search,
    itens: [
      "Pesquise por palavra-chave, categoria, tipo, condição e ordenação.",
      "Use o CEP no cabeçalho para filtrar anúncios por proximidade durante a navegação.",
      "A listagem mostra localização, anunciante, reputação, categoria e visualizações.",
    ],
  },
  {
    titulo: "Favoritos e interesses",
    icon: Heart,
    itens: [
      "Salve anúncios favoritos para consultar depois.",
      "Em anúncios de troca, envie uma proposta escolhendo um dos seus itens publicados para troca.",
      "Em anúncios de doação, inicie a conversa diretamente com o anunciante.",
    ],
  },
  {
    titulo: "Chat e negociação",
    icon: MessageCircle,
    itens: [
      "Quando uma proposta é aceita, o chat da negociação é aberto automaticamente.",
      "O histórico de conversa permanece disponível, mesmo após encerramento da negociação.",
      "As partes podem cancelar, combinar entrega e confirmar conclusão do processo.",
    ],
  },
  {
    titulo: "Avaliações",
    icon: Star,
    itens: [
      "A avaliação é liberada apenas após a conclusão da negociação.",
      "Cada participante avalia o outro com nota e comentário.",
      "A reputação aparece nos cards, no anúncio e no perfil público do usuário.",
    ],
  },
  {
    titulo: "Denúncias e segurança",
    icon: ShieldAlert,
    itens: [
      "Anúncios inadequados podem ser denunciados por usuários autenticados.",
      "Denúncias são analisadas pela moderação, que pode descartar, suspender ou reprovar anúncios.",
      "Avaliações ofensivas podem ser removidas pela equipe de moderação.",
    ],
  },
  {
    titulo: "Notificações",
    icon: Bell,
    itens: [
      "O cabeçalho indica novas mensagens e solicitações de troca.",
      "A área de interesses mostra propostas recebidas, enviadas e o andamento das negociações.",
      "O usuário pode acompanhar seus anúncios pela página Meus anúncios.",
    ],
  },
];

export const ManualUsuarioPage = () => {
  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc] font-plus-jakarta-sans text-slate-900">
      <Header />

      <main className="flex-1">
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6 lg:py-14">
            <Link
              to="/"
              className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-blue-600"
            >
              <ArrowLeft size={17} />
              Voltar para a página inicial
            </Link>

            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-orange-100 bg-orange-50 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-orange-700">
                <LifeBuoy size={15} />
                Manual do sistema
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Manual do Usuário
              </h1>
              <p className="mt-4 text-base leading-8 text-slate-600">
                Guia rápido das principais funcionalidades disponíveis para usuários do ReUseHub,
                desde o cadastro até a conclusão de trocas e doações.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6 lg:py-12">
          <div className="grid gap-4 md:grid-cols-2">
            {passos.map((passo) => {
              const Icon = passo.icon;
              return (
                <article key={passo.titulo} className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                    <Icon size={21} />
                  </div>
                  <h2 className="text-lg font-black text-slate-950">{passo.titulo}</h2>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                    {passo.itens.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
