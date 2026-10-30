import { MotionConfig } from "framer-motion";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { SessionProvider } from "@/app/session";
import { StoreProvider } from "@/data/store";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import { AppLayout } from "@/app/AppLayout";
import Overview from "@/app/pages/Overview";
import Performance from "@/app/pages/Performance";
import NegociosLayout from "@/app/pages/negocios/Layout";
import Leads from "@/app/pages/negocios/Leads";
import Captacoes from "@/app/pages/negocios/Captacoes";

import Proprietarios from "@/app/pages/negocios/Proprietarios";
import Transacoes from "@/app/pages/negocios/Transacoes";
import Parceiros from "@/app/pages/negocios/Parceiros";
import Edificios from "@/app/pages/negocios/Edificios";
import Mercado from "@/app/pages/Mercado";
import NovoEstudo from "@/app/pages/estudos/NovoEstudo";
import Estudo from "@/app/pages/estudos/Estudo";
import AgendaPage from "@/app/pages/AgendaPage";
import AgendaAdmin from "@/app/admin/AgendaAdmin";
import Convite from "@/pages/Convite";
import RedefinirSenha from "@/pages/RedefinirSenha";
import Demo from "@/pages/Demo";
import { Privacidade, Termos } from "@/pages/Legal";
import Sobre from "@/pages/Sobre";
import ParaPublico from "@/pages/ParaPublico";
import { CalculadoraComissao, SimuladorFinanciamento } from "@/pages/Ferramentas";
import ExclusaoDados from "@/pages/ExclusaoDados";
import Confirmar from "@/pages/Confirmar";
import Captura from "@/pages/Captura";
import Cadastro from "@/pages/Cadastro";
import GoogleRetorno from "@/pages/GoogleRetorno";
import Interessados from "@/app/admin/Interessados";
import { Guard } from "@/app/Guard";
import Checkout from "@/pages/Checkout";
import Upgrades from "@/app/admin/Upgrades";
import Academy from "@/app/pages/academy/Academy";
import Trilha from "@/app/pages/academy/Trilha";
import Marketing from "@/app/pages/Marketing";
import Equipe from "@/app/pages/Equipe";
import Configuracoes from "@/app/pages/Configuracoes";
import Ajuda from "@/app/pages/Ajuda";
import { AdminOnly } from "@/app/pages/AdminOnly";
import { AdminLayout } from "@/app/admin/AdminLayout";
import AdminOverview from "@/app/admin/Overview";
import Imobiliarias from "@/app/admin/Imobiliarias";
import CorretoresPainel from "@/app/admin/Corretores";
import CreciPainel from "@/app/admin/Creci";
import Chamados from "@/app/admin/Chamados";
import Erros from "@/app/admin/Erros";

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <SessionProvider>
          <StoreProvider>
            <Routes>
              {/* Site público */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/redefinir-senha" element={<RedefinirSenha />} />
              {/* Links dos e-mails de login (confirmar conta, nova senha, troca de e-mail) */}
              <Route path="/confirmar" element={<Confirmar />} />
              {/* A apresentação agendada saiu: teste grátis ou WhatsApp. Links antigos levam aos planos. */}
              <Route path="/apresentacao" element={<Navigate to="/#planos" replace />} />
              <Route path="/demo/:token" element={<Demo />} />
              <Route path="/termos" element={<Termos />} />
              <Route path="/privacidade" element={<Privacidade />} />
              <Route path="/sobre" element={<Sobre />} />
              {/* Páginas por público e ferramentas grátis (atraem visitas pelo Google) */}
              <Route path="/para-imobiliarias" element={<ParaPublico publico="imobiliarias" />} />
              <Route path="/para-corretores" element={<ParaPublico publico="corretores" />} />
              <Route path="/simulador-de-financiamento" element={<SimuladorFinanciamento />} />
              <Route path="/calculadora-de-comissao" element={<CalculadoraComissao />} />
              <Route path="/exclusao-de-dados" element={<ExclusaoDados />} />
              {/* Cadastro sem falar com ninguém: cria a conta já em teste grátis */}
              <Route path="/cadastro" element={<Cadastro />} />
              {/* Volta da tela do Google (conexão do Google Agenda) */}
              <Route path="/google-agenda/retorno" element={<GoogleRetorno />} />
              {/* Página de captura dos anúncios (Instagram/YouTube) → WhatsApp */}
              <Route path="/conheca-a-frankkia" element={<Captura />} />
              <Route path="/convite/:id" element={<Convite />} />
              <Route path="/checkout/:id" element={<Checkout />} />

              {/* Área logada da imobiliária (administrador e corretor) */}
              <Route
                path="/app"
                element={
                  <Guard area="app">
                    <AppLayout />
                  </Guard>
                }
              >
                <Route index element={<Navigate to="visao-geral" replace />} />
                <Route path="visao-geral" element={<Overview />} />
                <Route path="agenda" element={<AgendaPage />} />
                <Route path="performance" element={<Performance />} />
                <Route path="negocios" element={<NegociosLayout />}>
                  <Route index element={<Navigate to="leads" replace />} />
                  <Route path="leads" element={<Leads />} />
                  <Route path="captacoes" element={<Captacoes />} />
                  {/* Imóveis agora ficam dentro de Captações (cadastro único) */}
                  <Route path="imoveis" element={<Navigate to="/app/negocios/captacoes" replace />} />
                  <Route path="proprietarios" element={<Proprietarios />} />
                  <Route path="transacoes" element={<Transacoes />} />
                  <Route path="edificios" element={<Edificios />} />
                  <Route
                    path="parceiros"
                    element={
                      <AdminOnly>
                        <Parceiros />
                      </AdminOnly>
                    }
                  />
                </Route>
                <Route path="mercado" element={<Mercado />} />
                <Route path="mercado/estudos/novo" element={<NovoEstudo />} />
                <Route path="mercado/estudos/:id" element={<Estudo />} />
                <Route path="academy" element={<Academy />} />
                <Route path="academy/:id" element={<Trilha />} />
                <Route path="marketing" element={<Marketing />} />
                <Route
                  path="equipe"
                  element={
                    <AdminOnly>
                      <Equipe />
                    </AdminOnly>
                  }
                />
                <Route path="configuracoes" element={<Configuracoes />} />
                <Route path="ajuda" element={<Ajuda />} />
              </Route>

              {/* Painel da Frankkia (você) */}
              <Route
                path="/admin"
                element={
                  <Guard area="admin">
                    <AdminLayout />
                  </Guard>
                }
              >
                <Route index element={<AdminOverview />} />
                <Route path="agenda" element={<AgendaAdmin />} />
                <Route path="imobiliarias" element={<Imobiliarias />} />
                <Route path="corretores" element={<CorretoresPainel />} />
                <Route path="creci" element={<CreciPainel />} />
                <Route path="interessados" element={<Interessados />} />
                <Route path="upgrades" element={<Upgrades />} />
                <Route path="chamados" element={<Chamados />} />
                <Route path="erros" element={<Erros />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </StoreProvider>
        </SessionProvider>
      </BrowserRouter>
    </MotionConfig>
  );
}
