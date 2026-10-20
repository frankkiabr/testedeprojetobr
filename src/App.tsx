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
import Mercado from "@/app/pages/Mercado";
import AgendaPage from "@/app/pages/AgendaPage";
import AgendaAdmin from "@/app/admin/AgendaAdmin";
import Convite from "@/pages/Convite";
import RedefinirSenha from "@/pages/RedefinirSenha";
import Apresentacao from "@/pages/Apresentacao";
import Demo from "@/pages/Demo";
import { Privacidade, Termos } from "@/pages/Legal";
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
              <Route path="/apresentacao" element={<Apresentacao />} />
              <Route path="/demo/:token" element={<Demo />} />
              <Route path="/termos" element={<Termos />} />
              <Route path="/privacidade" element={<Privacidade />} />
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
