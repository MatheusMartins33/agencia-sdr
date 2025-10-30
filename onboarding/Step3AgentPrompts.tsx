import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import type { Step3AgentPromptsProps } from "@/types";
import {
  createWorkflow,
  updateWorkflow,
} from "@/services/n8nService";
import { parseAndModifyWorkflow, type WorkflowConfig } from "@/lib/workflowUtils";
import { synthesizeCompanyContext } from "@/services/openAIService";
import { upsertAgentConfig } from "@/services/supabaseService";

/**
 * Step 3 of the onboarding flow: configure and save an "ativo" agent.
 * Allows the user to set a name, schedule, timezone and system prompt,
 * optionally synthesising context with an AI helper. On save the
 * workflow template is patched and pushed to n8n then the config
 * persisted to Supabase.
 */
export function Step3AgentPrompts({
  tenant,
  channelSettings,
  onAgentConfigSaved,
  existingConfig,
}: Step3AgentPromptsProps) {
  const isUpdateMode = Boolean(existingConfig);
  // Form fields state
  const [name, setName] = useState("");
  const [scheduleHour, setScheduleHour] = useState("8");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [rawCompanyContext, setRawCompanyContext] = useState("");
  const [synthesizedContext, setSynthesizedContext] = useState("");
  const [isActive, setIsActive] = useState(true);
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form fields when updating existing config
  useEffect(() => {
    if (isUpdateMode && existingConfig) {
      setName(existingConfig.name || `Agente Ativo de ${tenant.name}`);
      setSynthesizedContext(existingConfig.system_prompt || "");
      setIsActive(existingConfig.active);
      const trigger = existingConfig.trigger_config;
      if (trigger && trigger.type === "schedule") {
        setScheduleHour(String(trigger.hour || 8));
        setTimezone(trigger.timezone || "America/Sao_Paulo");
      }
    }
  }, [isUpdateMode, existingConfig, tenant.name]);

  /**
   * Call the AI service to synthesise a company context into a system prompt.
   */
  const handleSynthesize = async () => {
    if (!rawCompanyContext.trim()) {
      setError("Por favor, descreva sua empresa antes de otimizar.");
      return;
    }
    setIsSynthesizing(true);
    setError(null);
    try {
      const result = await synthesizeCompanyContext(rawCompanyContext);
      setSynthesizedContext(result);
    } catch (err: any) {
      setError(err.message || "Falha ao comunicar com a IA.");
    } finally {
      setIsSynthesizing(false);
    }
  };

  /**
   * Save or update the agent configuration. Loads the workflow template, patches
   * it with config values, pushes to n8n and persists the final config. Calls
   * back with the saved configuration on success.
   */
  const handleSave = async () => {
    if (!channelSettings) {
      setError(
        "Configurações do canal WhatsApp não encontradas. Retorne ao passo 2."
      );
      return;
    }
    if (!synthesizedContext) {
      setError(
        "O contexto gerado pela IA não pode estar vazio. Use o otimizador."
      );
      return;
    }
    if (!name) {
      setError("O nome do agente é obrigatório.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Fetch workflow template from the public folder
      const response = await fetch('/templates/workflow-ativo-base.json');
      if (!response.ok) {
        throw new Error('Não foi possível carregar o template do workflow.');
      }
      const templateString = await response.text();
      // Build workflow configuration from form fields
      const config: WorkflowConfig = {
        name,
        scheduleHour: parseInt(scheduleHour, 10),
        timezone,
        systemPrompt: synthesizedContext,
        instanceApiUrl: channelSettings.evo_base_url,
        instanceName: channelSettings.instance_name,
        instanceApiKey: channelSettings.instance_token,
        isActive,
      };
      // Patch the template
      const modifiedWorkflow = parseAndModifyWorkflow(templateString, config);
      // Create or update the workflow on n8n
      let n8nWorkflowId: string;
      if (isUpdateMode && existingConfig?.n8n_workflow_id) {
        await updateWorkflow(existingConfig.n8n_workflow_id, modifiedWorkflow);
        n8nWorkflowId = existingConfig.n8n_workflow_id;
      } else {
        const newN8nWorkflow = await createWorkflow(modifiedWorkflow);
        if (!newN8nWorkflow || !newN8nWorkflow.id) {
          throw new Error('Falha ao criar workflow no n8n.');
        }
        n8nWorkflowId = newN8nWorkflow.id;
      }
      // Persist the final agent configuration to Supabase
      const fullConfig = {
        tenantId: tenant.id,
        agentType: 'ativo' as const,
        name,
        systemPrompt: synthesizedContext,
        scheduleHour: parseInt(scheduleHour, 10),
        timezone,
        isActive,
        n8nWorkflowId,
      };
      await upsertAgentConfig(fullConfig);
      onAgentConfigSaved(fullConfig as any);
    } catch (err: any) {
      console.error('Falha ao salvar e configurar o agente:', err);
      setError(err.message || 'Ocorreu um erro desconhecido.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>3. Configure o Agente Ativo</CardTitle>
        <CardDescription>
          {isUpdateMode
            ? 'Atualize as configurações do seu agente de prospecção.'
            : 'Defina o nome, horário e personalidade do seu agente de IA.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Agent Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-2">
            <Label htmlFor="agent-name">Nome do Agente</Label>
            <Input
              id="agent-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Agente de Vendas B2B"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2 pt-2 flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="agent-active"
                checked={isActive}
                onCheckedChange={setIsActive}
                disabled={isLoading}
              />
              <Label htmlFor="agent-active">
                {isActive ? 'Agente Ativo' : 'Agente Inativo'}
              </Label>
            </div>
          </div>
        </div>
        {/* Schedule Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="schedule-hour">⏰ Horário de Disparo</Label>
            <Select
              value={scheduleHour}
              onValueChange={setScheduleHour}
              disabled={isLoading}
            >
              <SelectTrigger id="schedule-hour">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {String(i).padStart(2, '0')}:00
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">🌍 Fuso Horário</Label>
            <Select
              value={timezone}
              onValueChange={setTimezone}
              disabled={isLoading}
            >
              <SelectTrigger id="timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/Sao_Paulo">
                  Brasília (São Paulo)
                </SelectItem>
                <SelectItem value="America/New_York">
                  Nova Iorque
                </SelectItem>
                <SelectItem value="Europe/Lisbon">
                  Lisboa
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {/* AI Context Generation */}
        <div className="space-y-2">
          <Label htmlFor="raw-context">
            Descreva sua Empresa (Missão, Tom de Voz, Diferenciais)
          </Label>
          <Textarea
            id="raw-context"
            value={rawCompanyContext}
            onChange={(e) => setRawCompanyContext(e.target.value)}
            rows={5}
            disabled={isLoading || isSynthesizing}
            placeholder="Ex: Somos uma fintech que ajuda PMEs a automatizar o fluxo de caixa com IA. Nosso tom é direto e confiável. Nosso diferencial é a integração com qualquer sistema contábil em 5 minutos."
          />
        </div>
        <div className="flex flex-col items-center">
          <Button
            onClick={handleSynthesize}
            disabled={isLoading || isSynthesizing || !rawCompanyContext}
          >
            {isSynthesizing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <span className="mr-2">🪄</span>
            )}
            Otimizar com IA
          </Button>
        </div>
        <div className="space-y-2">
          <Label htmlFor="prompt-ativo">
            🤖 Contexto Gerado pela IA (System Prompt)
          </Label>
          <Textarea
            id="prompt-ativo"
            value={synthesizedContext}
            onChange={(e) => setSynthesizedContext(e.target.value)}
            rows={8}
            disabled={isLoading}
            placeholder="O contexto otimizado para o agente de vendas aparecerá aqui..."
            readOnly
          />
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading || isSynthesizing}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {isUpdateMode ? 'Atualizar Agente' : 'Criar Agente e Avançar'}
        </Button>
      </CardFooter>
    </Card>
  );
}