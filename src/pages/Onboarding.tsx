import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { HelpCircle } from "lucide-react";
import {
  updateTenantOnboardingStatus,
  resetTenantOnboarding,
  getTenantSettings,
  getChannelSettings,
  getAgentConfig,
} from "@/services/supabaseService";
import type { User } from "@supabase/supabase-js";
import type { Tenant, ChannelSettings, AgentConfig } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { OnboardingStatus } from "../../onboarding/OnboardingStatus";
import { Step1Tenant } from "../../onboarding/Step1Tenant";
import { Step2Whatsapp } from "../../onboarding/Step2Whatsapp";
import { Step3AgentPrompts } from "../../onboarding/Step3AgentPrompts";
import { Step4Finalize } from "../../onboarding/Step4Finalize";

/**
 * Main component orchestrating the onboarding flow. Handles state transitions
 * between steps, data loading and saving, and displays a contextual help dialog.
 */
export default function Onboarding() {
  const [activeTab, setActiveTab] = useState('step1');
  const [showHelp, setShowHelp] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [channelSettings, setChannelSettings] = useState<ChannelSettings | null>(null);
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);
  const { user, refreshTenant } = useAuth();
  const navigate = useNavigate();

  /**
   * Load any existing onboarding state from the backend when the user logs in.
   */
  const loadInitialData = useCallback(
    async (currentUser: User | null) => {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        const existingTenant = await getTenantSettings(currentUser.id);
        if (existingTenant) {
          setTenant(existingTenant);
          setActiveTab('step2');
          const existingChannel = await getChannelSettings(existingTenant.id);
          if (existingChannel && existingChannel.status === 'CONNECTED') {
            setChannelSettings(existingChannel);
            setActiveTab('step3');
            const existingAgentConfig = await getAgentConfig(existingTenant.id, 'ativo');
            if (existingAgentConfig) {
              setAgentConfig(existingAgentConfig);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Kick off initial data load when the user becomes available
  useEffect(() => {
    if (user) {
      loadInitialData(user);
    }
  }, [user, loadInitialData]);

  /**
   * Callback executed when a tenant has been created.
   */
  const handleTenantCreated = useCallback((newTenant: Tenant) => {
    setTenant(newTenant);
    setActiveTab('step2');
  }, []);

  /**
   * Callback executed when the WhatsApp channel has been connected.
   */
  const handleChannelConnected = useCallback((settings: ChannelSettings) => {
    setChannelSettings(settings);
    setActiveTab('step3');
  }, []);

  /**
   * Callback executed when the agent configuration has been saved.
   */
  const handleAgentConfigSaved = useCallback((newConfig: AgentConfig) => {
    setAgentConfig(newConfig);
    setActiveTab('step4');
  }, []);

  /**
   * Finalize the onboarding process: update DB flag, refresh tenant and redirect.
   */
  const handleFinalize = async (tenantId: string) => {
    try {
      await updateTenantOnboardingStatus(tenantId);
      await refreshTenant();
      alert('Onboarding Concluído! Redirecionando...');
      navigate('/');
    } catch (error) {
      console.error('Erro ao finalizar o onboarding:', error);
      alert('Ocorreu um erro ao finalizar. Tente novamente.');
    }
  };

  /**
   * Reset the onboarding state both locally and on the backend.
   */
  const handleReset = async () => {
    if (!tenant) return;
    const confirmed = window.confirm(
      'Tem certeza que deseja reiniciar o onboarding? Todas as configurações de canal e agentes serão perdidas.'
    );
    if (confirmed) {
      setIsLoading(true);
      try {
        await resetTenantOnboarding(tenant.id);
        await refreshTenant();
        setActiveTab('step1');
        setTenant(null);
        setChannelSettings(null);
        setAgentConfig(null);
        await loadInitialData(user);
      } catch (error) {
        console.error('Failed to reset onboarding:', error);
        alert('Falha ao reiniciar o onboarding.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <>
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bem-vindo à Configuração!</DialogTitle>
            <DialogDescription>
              Vamos configurar seu ambiente em 4 passos simples.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 text-sm text-muted-foreground">
            <p>
              <strong>1. Crie sua Loja:</strong> Dê um nome à sua empresa.
            </p>
            <p>
              <strong>2. Conecte seu WhatsApp:</strong> Vincule seu número de WhatsApp.
            </p>
            <p>
              <strong>3. Personalize seus Agentes:</strong> Defina a "personalidade" dos seus robôs.
            </p>
            <p>
              <strong>4. Finalizar:</strong> Complete o processo para salvar tudo.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowHelp(false)}>Entendi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative">
        <div className="w-full max-w-3xl space-y-6">
          {/* Overall status header */}
          <OnboardingStatus
            tenant={tenant}
            channelSettings={channelSettings}
            agentConfig={agentConfig}
            onReset={handleReset}
            isLoading={isLoading}
          />
          {/* Tabbed stepper */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="step1">1. Loja</TabsTrigger>
              <TabsTrigger value="step2" disabled={!tenant}>2. WhatsApp</TabsTrigger>
              <TabsTrigger value="step3" disabled={!channelSettings}>3. Agentes</TabsTrigger>
              <TabsTrigger value="step4" disabled={!agentConfig || !tenant}>4. Finalizar</TabsTrigger>
            </TabsList>
            <TabsContent value="step1">
              <Step1Tenant tenant={tenant} onTenantCreated={handleTenantCreated} />
            </TabsContent>
            <TabsContent value="step2">
              {tenant && (
                <Step2Whatsapp tenant={tenant} onChannelConnected={handleChannelConnected} />
              )}
            </TabsContent>
            <TabsContent value="step3">
              {tenant && channelSettings && (
                <Step3AgentPrompts
                  tenant={tenant}
                  channelSettings={channelSettings}
                  onAgentConfigSaved={handleAgentConfigSaved}
                  existingConfig={agentConfig}
                />
              )}
            </TabsContent>
            <TabsContent value="step4">
              {tenant && (
                <Step4Finalize tenant={tenant} onFinalize={handleFinalize} />
              )}
            </TabsContent>
          </Tabs>
        </div>
        {/* Floating help button */}
        <div className="fixed bottom-6 right-6">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-14 w-14 shadow-lg"
            onClick={() => setShowHelp(true)}
          >
            <HelpCircle className="h-7 w-7" />
          </Button>
        </div>
      </div>
    </>
  );
}