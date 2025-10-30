import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, Loader2, RefreshCw } from "lucide-react";
import type { Tenant, ChannelSettings, AgentConfig } from "@/types";

/**
 * Display the current progress of the onboarding flow.
 *
 * A simple status card that shows whether the tenant is created,
 * the WhatsApp channel is connected and the agent configuration has
 * been saved. Exposes a reset button to restart the onboarding process.
 */
export interface OnboardingStatusProps {
  tenant: Tenant | null;
  channelSettings: ChannelSettings | null;
  agentConfig: AgentConfig | null;
  onReset: () => void;
  isLoading: boolean;
}

export function OnboardingStatus({
  tenant,
  channelSettings,
  agentConfig,
  onReset,
  isLoading,
}: OnboardingStatusProps) {
  const getStatus = (condition: boolean) =>
    condition ? (
      <span className="flex items-center text-green-600 font-medium">
        <CheckCircle className="h-4 w-4 mr-2" /> Concluído
      </span>
    ) : (
      <span className="flex items-center text-muted-foreground">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Pendente
      </span>
    );

  return (
    <Card className="mb-8 bg-card/50 border-border/50">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Status da Configuração</CardTitle>
            <CardDescription>
              Acompanhe e gerencie o progresso do seu ambiente.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={onReset}
            disabled={isLoading || !tenant}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reiniciar Onboarding
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 text-sm">
          <li className="flex justify-between items-center p-2 rounded-md bg-background">
            <span>1. Criação da Loja</span>
            {getStatus(!!tenant)}
          </li>
          <li className="flex justify-between items-center p-2 rounded-md bg-background">
            <span>2. Conexão com WhatsApp</span>
            {getStatus(!!channelSettings)}
          </li>
          <li className="flex justify-between items-center p-2 rounded-md bg-background">
            <span>3. Personalização dos Agentes</span>
            {getStatus(!!agentConfig)}
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}