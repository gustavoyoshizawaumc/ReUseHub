import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Database,
  FileCheck2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";

const secoes = [
  {
    titulo: "Dados tratados",
    icon: Database,
    conteudo:
      "O ReUseHub utiliza dados de cadastro, como nome, e-mail, telefone, CPF, avatar, senha protegida por hash, consentimento LGPD e informações necessárias para anúncios, interesses, chat, avaliações, denúncias e auditoria.",
  },
  {
    titulo: "Finalidade",
    icon: FileCheck2,
    conteudo:
      "Os dados são usados para autenticar usuários, publicar anúncios, viabilizar trocas e doações, permitir comunicação pelo chat, calcular reputação, prevenir fraudes e apoiar a moderação da plataforma.",
  },
  {
    titulo: "Segurança",
    icon: LockKeyhole,
    conteudo:
      "O sistema aplica controle de acesso por perfil, senhas com hash, proteção de campos sensíveis, logs de auditoria e restrições para ações administrativas, reduzindo riscos de acesso indevido.",
  },
  {
    titulo: "Integrações",
    icon: Mail,
    conteudo:
      "Algumas funcionalidades dependem de serviços externos, como consulta de CEP/geolocalização, envio de e-mail para recuperação de senha e armazenamento de imagens. Essas integrações recebem apenas os dados necessários para executar cada serviço.",
  },
];

export const PoliticaPrivacidadePage = () => {
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
              <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                <ShieldCheck size={15} />
                LGPD e privacidade
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Política de Privacidade
              </h1>
              <p className="mt-4 text-base leading-8 text-slate-600">
                Este aviso explica, de forma objetiva, como o ReUseHub trata os dados pessoais
                necessários para operação do marketplace de doações e trocas.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6 lg:py-12">
          <div className="grid gap-4 md:grid-cols-2">
            {secoes.map((secao) => {
              const Icon = secao.icon;
              return (
                <article key={secao.titulo} className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                    <Icon size={21} />
                  </div>
                  <h2 className="text-lg font-black text-slate-950">{secao.titulo}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{secao.conteudo}</p>
                </article>
              );
            })}
          </div>

          <div className="mt-6 rounded-md border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-orange-50 text-orange-600">
                <UserCheck size={21} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-950">Direitos do usuário</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  O usuário pode visualizar e editar dados do perfil, desativar a conta ou solicitar
                  exclusão/anonymização conforme as regras da plataforma. Dados necessários para
                  histórico de negociações, auditoria, segurança e obrigações legais podem ser
                  preservados pelo período adequado.
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Em caso de dúvidas sobre privacidade, o contato deve ser feito pelos canais
                  oficiais informados pela equipe responsável pelo ReUseHub.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
