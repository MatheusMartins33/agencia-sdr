import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { RequireAuth } from "./components/RequireAuth";
import { Sidebar } from "./components/Sidebar";
import Overview from "./pages/Overview";
import AgenteAtivo from "./pages/AgenteAtivo";
import AgenteReativo from "./pages/AgenteReativo";
import Produtos from "./pages/Produtos";
import Leads from "./pages/Leads";
import Historico from "./pages/Historico";
import Configuracao from "./pages/Configuracao";
import Ingestao from "./pages/Ingestao";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";

const queryClient = new QueryClient();

// SDR Performance & Gestão Dashboard
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/*"
              element={
                <RequireAuth>
                  <div className="flex min-h-screen w-full bg-background">
                    <Sidebar />
                    <div className="flex-1 flex flex-col">
                      <Routes>
                        <Route path="/" element={<Overview />} />
                        <Route path="/ingestao" element={<Ingestao />} />
                        <Route path="/agente-ativo" element={<AgenteAtivo />} />
                        <Route
                          path="/agente-reativo"
                          element={<AgenteReativo />}
                        />
                        <Route path="/produtos" element={<Produtos />} />
                        <Route path="/leads" element={<Leads />} />
                        <Route path="/historico" element={<Historico />} />
                        <Route
                          path="/configuracao"
                          element={<Configuracao />}
                        />
                        <Route path="/onboarding" element={<Onboarding />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </div>
                  </div>
                </RequireAuth>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
