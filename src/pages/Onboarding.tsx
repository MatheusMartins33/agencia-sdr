import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  createTenant,
  createChannelSettings,
  updateChannelStatus,
  getChannelSettings,
  getTenantSettings,
  updateTenantOnboardingStatus,
  resetTenantOnboarding,
  getAgentConfig,
  upsertAgentConfig, // Added
} from "@/services/supabaseService";
import {
  createInstance,
  getInstanceQrCode,
  getInstanceStatus,
} from "@/services/evolutionService";
import { useAuth } from "@/contexts/AuthContext";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Rocket,
  HelpCircle,
  RefreshCw,
} from "lucide-react";
import type { Tenant, ChannelSettings, AgentConfig } from "@/types";
import type { User } from "@supabase/supabase-js";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createWorkflow, updateWorkflow } from "@/services/n8nService";
import { parseAndModifyWorkflow, type WorkflowConfig } from "@/lib/workflowUtils";
import { synthesizeCompanyContext } from "@/services/openAIService";

// --- TYPES AND INTERFACES ---
type ChannelState =
  | "INITIAL"
  | "CREATING_INSTANCE"
  | "PENDING_QR"
  | "CONNECTING"
  | "CONNECTED"
  | "ERROR";

// --- CHILD COMPONENTS ---

const OnboardingStatus = ({
  tenant,
  channelSettings,
  agentConfig, // Changed from promptsSaved
  onReset,
  isLoading,
}: {
  tenant: Tenant | null;
  channelSettings: ChannelSettings | null;
  agentConfig: AgentConfig | null; // Changed from promptsSaved
  onReset: () => void;
  isLoading: boolean;
}) => {
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
          <Button variant="outline" onClick={onReset} disabled={isLoading || !tenant}>
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
};

const Step1Tenant = ({
  tenant,
  onTenantCreated,
}: {
  tenant: Tenant | null;
  onTenantCreated: (newTenant: Tenant) => void;
}) => {
  const [tenantName, setTenantName] = useState(tenant?.name || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!tenantName.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const newTenant = await createTenant(tenantName.trim());
      onTenantCreated(newTenant);
    } catch (err: any) {
      setError(
        "Falha ao criar a loja. Verifique se o nome já não está em uso."
      );
      console.error(err);
    }
    finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>1. Crie sua Loja</CardTitle>
        <CardDescription>
          Comece dando um nome para sua loja ou empresa. Este nome será usado
          para identificar seu ambiente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="tenantName">Nome da Loja</Label>
          <Input
            id="tenantName"
            placeholder="Ex: Flora Boutique"
            value={tenantName}
            onChange={(e) => setTenantName(e.target.value)}
            disabled={isLoading || !!tenant}
          />
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {tenant && (
          <Alert
            variant="default"
            className="border border-green-100 bg-green-50"
          >
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle>Loja Criada!</AlertTitle>
            <AlertDescription>
              Sua loja "{tenant.name}" está pronta. Você pode avançar para o
              próximo passo.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={handleCreate}
          disabled={!tenantName.trim() || isLoading || !!tenant}
        >
          {isLoading && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {tenant ? "Salvo" : "Salvar e Avançar"}
        </Button>
      </CardFooter>
    </Card>
  );
};

const Step2Whatsapp = ({
  tenant,
  onChannelConnected,
}: {
  tenant: Tenant;
  onChannelConnected: (settings: ChannelSettings) => void;
}) => {
  const [settings, setSettings] = useState<ChannelSettings | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [status, setStatus] = useState<ChannelState>("INITIAL");
  const [waNumber, setWaNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  const validateInstanceAndCheckConnected = useCallback(
    async (channel: ChannelSettings): Promise<boolean> => {
      try {
        try {
          const createResult: any = await createInstance(channel);
          const statusCriacao: string | undefined = createResult?.instance?.status;
          if (
            statusCriacao &&
            !["created", "open", "close"].includes(statusCriacao)
          ) {
            console.warn(
              `[validateInstance] Status inesperado ao criar instância: ${statusCriacao}`
            );
          }
        } catch (createErr: any) {
          const msg = createErr?.message || "";
          const alreadyExists =
            msg.includes("already exists") || msg.includes("already in use") ||
            msg.includes("Falha ao criar instância");
          if (!alreadyExists) {
            throw createErr;
          }
        }

        try {
          const statusResult = await getInstanceStatus(channel);
          return statusResult.status === "open";
        } catch (err) {
          return false;
        }
      } catch (err: any) {
        throw new Error(err?.message || "Erro ao validar a instância.");
      }
    },
    []
  );

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const existing = await getChannelSettings(tenant.id);
        if (existing) {
          setSettings(existing);
          if (existing.wa_number) setWaNumber(existing.wa_number);

          if (existing.status === "CONNECTED") {
            setStatus("CONNECTED");
            setStatusMessage("Canal já conectado!");
            onChannelConnected(existing);
          } else if (existing.status === "PENDING_QR") {
            try {
              const statusResult = await getInstanceStatus(existing);
              if (statusResult.status === "open") {
                await updateChannelStatus(
                  tenant.id,
                  "CONNECTED",
                  existing.wa_number
                );
                setStatus("CONNECTED");
                setStatusMessage("Canal conectado!");
                const updatedSettings = await getChannelSettings(
                  tenant.id
                );
                if (updatedSettings) {
                  onChannelConnected(updatedSettings);
                }
              } else {
                setStatus("INITIAL");
                setStatusMessage(
                  "Conexão anterior não finalizada. Tente novamente."
                );
              }
            } catch (err) {
              console.error("Erro ao verificar status:", err);
              setStatus("INITIAL");
            }
          }
        }
      } catch (err) {
        console.error("Erro ao carregar configs do canal:", err);
        setError("Falha ao carregar configurações do canal.");
        setStatus("ERROR");
      }
    };
    fetchSettings();
  }, [tenant.id, onChannelConnected]);

  const startConnectionProcess = useCallback(
    async (channel: ChannelSettings) => {
      let pollingInterval: number | null = null;
      let socket: WebSocket | null = null;
      let isConnected = false;

      const MAX_POLLING_MS = 2 * 60 * 1000;
      const pollingStart = Date.now();

      const cleanup = () => {
        if (pollingInterval) clearInterval(pollingInterval);
        if (socket) socket.close();
      };

      const handleSuccessfulConnection = async () => {
        if (isConnected) return;
        isConnected = true;
        cleanup();
        setStatus("CONNECTED");
        setStatusMessage("Conectado com sucesso!");

        try {
          await updateChannelStatus(
            tenant.id,
            "CONNECTED",
            channel.wa_number || undefined
          );
          const updatedSettings = await getChannelSettings(tenant.id);
          if (updatedSettings) onChannelConnected(updatedSettings);
        } catch (err) {
          console.error("Erro ao atualizar status:", err);
        }
      };

      const pollStatus = () => {
        pollingInterval = window.setInterval(async () => {
          if (isConnected || Date.now() - pollingStart > MAX_POLLING_MS) {
            cleanup();
            if (!isConnected) {
              setStatus("ERROR");
              setError("Tempo de conexão esgotado. Tente novamente.");
            }
            return;
          }
          try {
            const statusResult = await getInstanceStatus(channel);
            if (statusResult.status === "open") await handleSuccessfulConnection();
          } catch (pollErr) {
            console.error("Erro ao verificar status:", pollErr);
          }
        }, 5000);
      };

      try {
        setStatus("CREATING_INSTANCE");
        setStatusMessage("Criando instância no WhatsApp...");
        try {
          await createInstance(channel);
        } catch (createErr: any) {
          const alreadyExists = createErr.message?.includes("already exists") || createErr.message?.includes("already in use");
          if (!alreadyExists) throw createErr;
        }

        setStatus("PENDING_QR");
        setStatusMessage("Gerando QR Code...");
        const { qrCode: qrData, pairingCode: pairingData } = await getInstanceQrCode(channel);
        setQrCode(qrData);
        setPairingCode(pairingData);
        setStatusMessage("Escaneie o QR Code ou use o código de pareamento");

        setStatus("CONNECTING");
        pollStatus(); // Start polling immediately as a fallback

      } catch (err: any) {
        setError(err.message || "Falha ao iniciar a conexão.");
        setStatus("ERROR");
        cleanup();
      }
    },
    [tenant.id, onChannelConnected]
  );

  const handleConnect = async () => {
    if (!waNumber.trim()) {
      setError("Digite um número de WhatsApp válido (incluindo DDI e DDD).");
      return;
    }
    const cleanNumber = waNumber.replace(/\D/g, "");
    if (cleanNumber.length < 10) {
      setError("Número muito curto. Use o formato: DDI + DDD + número.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setQrCode(null);
    setPairingCode(null);

    try {
      let channel = settings;
      if (!channel) {
        channel = await createChannelSettings(tenant);
      }
      const channelForInstance = { ...channel, wa_number: waNumber };
      setSettings(channelForInstance);

      const alreadyConnected = await validateInstanceAndCheckConnected(channelForInstance);
      if (alreadyConnected) {
        await updateChannelStatus(tenant.id, "CONNECTED", waNumber);
        setStatus("CONNECTED");
        setStatusMessage("Canal conectado!");
        const updatedSettings = await getChannelSettings(tenant.id);
        if (updatedSettings) onChannelConnected(updatedSettings);
        return;
      }

      await updateChannelStatus(tenant.id, "PENDING_QR", waNumber);
      await startConnectionProcess(channelForInstance);
    } catch (err: any) {
      setError(err.message || "Falha ao iniciar a conexão.");
      setStatus("ERROR");
    }
    finally {
      setIsLoading(false);
    }
  };

  const renderStatus = () => {
    const statusConfig = {
      INITIAL: { icon: null, text: "Informe seu número e clique em Conectar.", color: "text-muted-foreground" },
      CREATING_INSTANCE: { icon: <Loader2 className="mr-2 h-4 w-4 animate-spin" />, text: statusMessage, color: "text-blue-600" },
      PENDING_QR: { icon: <Loader2 className="mr-2 h-4 w-4 animate-spin" />, text: statusMessage, color: "text-blue-600" },
      CONNECTING: { icon: <Loader2 className="mr-2 h-4 w-4 animate-spin" />, text: statusMessage, color: "text-blue-600" },
      CONNECTED: { icon: <CheckCircle className="mr-2 h-4 w-4 text-green-500" />, text: statusMessage || "Conectado com sucesso!", color: "text-green-600" },
      ERROR: { icon: <XCircle className="mr-2 h-4 w-4 text-red-500" />, text: error || "Ocorreu um erro.", color: "text-red-600" },
    };
    const config = statusConfig[status];
    return <div className={`flex items-center ${config.color}`}>{config.icon}<span className="text-sm">{config.text}</span></div>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>2. Conecte seu WhatsApp</CardTitle>
        <CardDescription>Informe seu número para criar a instância e escaneie o QR Code para conectar.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="wa-number">Número do WhatsApp (com DDI e DDD)</Label>
          <Input id="wa-number" placeholder="Ex: 5511999999999" value={waNumber} onChange={(e) => setWaNumber(e.target.value)} disabled={isLoading || status === "CONNECTED"} />
          <p className="text-xs text-muted-foreground">Formato: DDI (55) + DDD (11) + Número (999999999)</p>
        </div>
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-64 h-64 bg-muted flex items-center justify-center rounded-lg overflow-hidden border-2 border-border">
            {qrCode && (status === "PENDING_QR" || status === "CONNECTING") ? (
              <img src={`data:image/png;base64,${qrCode}`} alt="QR Code do WhatsApp" className="w-full h-full object-contain" />
            ) : (
              <div className="flex flex-col items-center text-center p-4">{renderStatus()}</div>
            )}
          </div>
          {pairingCode && (status === "PENDING_QR" || status === "CONNECTING") && (
            <div className="text-center p-4 bg-muted rounded-lg w-full">
              <p className="text-sm text-muted-foreground mb-2">Ou use o código de pareamento no WhatsApp:</p>
              <p className="text-2xl font-bold tracking-widest font-mono">{pairingCode}</p>
              <p className="text-xs text-muted-foreground mt-2">WhatsApp → Dispositivos Vinculados → Vincular um dispositivo → Vincular com número</p>
            </div>
          )}
          {status === "ERROR" && error && <Alert variant="destructive" className="w-full"><AlertTitle>Erro na Conexão</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        {status !== "CONNECTED" ? (
          <Button onClick={handleConnect} disabled={isLoading || !waNumber.trim()}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Conectar
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-green-600"><CheckCircle /><span>Canal Conectado</span></div>
        )}
      </CardFooter>
    </Card>
  );
};



const Step3AgentPrompts = ({
  tenant,
  channelSettings,
  onAgentConfigSaved, // Corrected prop name
  existingConfig,
}: {
  tenant: Tenant;
  channelSettings: ChannelSettings | null;
  onAgentConfigSaved: (config: AgentConfig) => void; // Corrected prop name and signature
  existingConfig: AgentConfig | null;
}) => {
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

  // Initialization effect
  useEffect(() => {
    if (isUpdateMode && existingConfig) {
      setName(existingConfig.name || `Agente Ativo de ${tenant.name}`);
      setSynthesizedContext(existingConfig.system_prompt || "");
      // O raw context não é salvo, então o usuário pode adicionar mais detalhes
      // setRawCompanyContext(...);
      setIsActive(existingConfig.active);

      if (existingConfig.trigger_config && existingConfig.trigger_config.type === 'schedule') {
        setScheduleHour(String(existingConfig.trigger_config.hour || 8));
        setTimezone(existingConfig.trigger_config.timezone || "America/Sao_Paulo");
      }
    }
  }, [isUpdateMode, existingConfig, tenant.name]);

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

  const handleSave = async () => {
    if (!channelSettings) {
      setError("Configurações do canal WhatsApp não encontradas. Retorne ao passo 2.");
      return;
    }
    if (!synthesizedContext) {
      setError("O contexto gerado pela IA não pode estar vazio. Use o otimizador.");
      return;
    }
    if (!name) {
      setError("O nome do agente é obrigatório.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch workflow template
      const response = await fetch('/templates/workflow-ativo-base.json');
      if (!response.ok) throw new Error(`Não foi possível carregar o template do workflow.`);
      const templateString = await response.text();

      // 2. Prepare configuration for the workflow
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

      // 3. Modify workflow template in memory
      const modifiedWorkflow = parseAndModifyWorkflow(templateString, config);

      // 4. Create or Update the workflow in n8n
      let n8nWorkflowId: string;
      if (isUpdateMode && existingConfig?.n8n_workflow_id) {
        await updateWorkflow(existingConfig.n8n_workflow_id, modifiedWorkflow);
        n8nWorkflowId = existingConfig.n8n_workflow_id;
      } else {
        const newN8nWorkflow = await createWorkflow(modifiedWorkflow);
        if (!newN8nWorkflow || !newN8nWorkflow.id) throw new Error("Falha ao criar workflow no n8n.");
        n8nWorkflowId = newN8nWorkflow.id;
      }

      // 5. Save the final agent configuration to Supabase
      const fullConfig = {
        tenantId: tenant.id,
        agentType: 'ativo' as const, // Standardized to lowercase to match type 'ativo' | 'reativo'
        name,
        systemPrompt: synthesizedContext,
        scheduleHour: parseInt(scheduleHour, 10),
        timezone,
        isActive,
        n8nWorkflowId,
      };
      await upsertAgentConfig(fullConfig);

      // 6. Proceed
      onAgentConfigSaved(fullConfig as any);

    } catch (err: any) {
      console.error("Falha ao salvar e configurar o agente:", err);
      setError(err.message || "Ocorreu um erro desconhecido.");
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
            ? "Atualize as configurações do seu agente de prospecção."
            : "Defina o nome, horário e personalidade do seu agente de IA."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* --- Basic Agent Settings --- */}
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
              <Switch id="agent-active" checked={isActive} onCheckedChange={setIsActive} disabled={isLoading} />
              <Label htmlFor="agent-active">{isActive ? "Agente Ativo" : "Agente Inativo"}</Label>
            </div>
          </div>
        </div>

        {/* --- Schedule Settings --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="schedule-hour">⏰ Horário de Disparo</Label>
            <Select value={scheduleHour} onValueChange={setScheduleHour} disabled={isLoading}>
              <SelectTrigger id="schedule-hour"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => (
                  <SelectItem key={i} value={String(i)}>{String(i).padStart(2, "0")}:00</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">🌍 Fuso Horário</Label>
            <Select value={timezone} onValueChange={setTimezone} disabled={isLoading}>
              <SelectTrigger id="timezone"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="America/Sao_Paulo">Brasília (São Paulo)</SelectItem>
                <SelectItem value="America/New_York">Nova Iorque</SelectItem>
                <SelectItem value="Europe/Lisbon">Lisboa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* --- AI Context Generation --- */}
        <div className="space-y-2">
          <Label htmlFor="raw-context">Descreva sua Empresa (Missão, Tom de Voz, Diferenciais)</Label>
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
          <Button onClick={handleSynthesize} disabled={isLoading || isSynthesizing || !rawCompanyContext}>
            {isSynthesizing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <span className="mr-2">🪄</span>
            )}
            Otimizar com IA
          </Button>
        </div>
        <div className="space-y-2">
          <Label htmlFor="prompt-ativo">🤖 Contexto Gerado pela IA (System Prompt)</Label>
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
          <Alert variant="destructive"><AlertTitle>Erro</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading || isSynthesizing}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isUpdateMode ? "Atualizar Agente" : "Criar Agente e Avançar"}
        </Button>
      </CardFooter>
    </Card>
  );
};

const Step4Finalize = ({ tenant, onFinalize }: { tenant: Tenant; onFinalize: (tenantId: string) => void }) => {
  const handleFinish = () => onFinalize(tenant.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>4. Finalizar Configuração</CardTitle>
        <CardDescription>Seu ambiente está pronto! Clique em finalizar para acessar o painel de controle.</CardDescription>
      </CardHeader>
      <CardContent className="text-center p-8">
        <Rocket className="h-16 w-16 mx-auto text-green-500" />
        <p className="mt-4 text-lg font-semibold">Tudo pronto para decolar!</p>
        <p className="text-muted-foreground">Você completou todas as etapas necessárias.</p>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleFinish}>Finalizar e ir para o Dashboard</Button>
      </CardFooter>
    </Card>
  );
};

// --- MAIN ONBOARDING COMPONENT ---

export default function Onboarding() {
  const [activeTab, setActiveTab] = useState("step1");
  const [showHelp, setShowHelp] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [channelSettings, setChannelSettings] = useState<ChannelSettings | null>(null);
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);

  const { user, refreshTenant } = useAuth();
  const navigate = useNavigate();

  const loadInitialData = useCallback(async (currentUser: User | null) => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const existingTenant = await getTenantSettings(currentUser.id);
      if (existingTenant) {
        setTenant(existingTenant);
        setActiveTab("step2");
        const existingChannel = await getChannelSettings(existingTenant.id);
        if (existingChannel && existingChannel.status === "CONNECTED") {
          setChannelSettings(existingChannel);
          setActiveTab("step3");
          const existingAgentConfig = await getAgentConfig(existingTenant.id, 'ativo'); // Standardized
          if(existingAgentConfig) {
            setAgentConfig(existingAgentConfig);
          }
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados iniciais:", error);
    }
    finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadInitialData(user);
    }
  }, [user, loadInitialData]);

  const handleTenantCreated = useCallback((newTenant: Tenant) => {
    setTenant(newTenant);
    setActiveTab("step2");
  }, []);

  const handleChannelConnected = useCallback((settings: ChannelSettings) => {
    setChannelSettings(settings);
    setActiveTab("step3");
  }, []);

  const handleAgentConfigSaved = useCallback((newConfig: AgentConfig) => {
    setAgentConfig(newConfig);
    setActiveTab("step4");
  }, []);

  const handleFinalize = async (tenantId: string) => {
    try {
      await updateTenantOnboardingStatus(tenantId);
      await refreshTenant();
      alert("Onboarding Concluído! Redirecionando...");
      navigate("/");
    } catch (error) {
      console.error("Erro ao finalizar o onboarding:", error);
      alert("Ocorreu um erro ao finalizar. Tente novamente.");
    }
  };

  const handleReset = async () => {
    if (!tenant) return;
    const confirmed = window.confirm(
      "Tem certeza que deseja reiniciar o onboarding? Todas as configurações de canal e agentes serão perdidas."
    );
    if (confirmed) {
      setIsLoading(true);
      try {
        await resetTenantOnboarding(tenant.id);
        await refreshTenant();
        // Reset local state
        setActiveTab("step1");
        setTenant(null);
        setChannelSettings(null);
        setAgentConfig(null);
        // Re-fetch initial data to get a clean slate (or lack thereof)
        await loadInitialData(user);
      } catch (error) {
        console.error("Failed to reset onboarding:", error);
        alert("Falha ao reiniciar o onboarding.");
      }
      finally {
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
            <DialogDescription>Vamos configurar seu ambiente em 4 passos simples.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 text-sm text-muted-foreground">
            <p><strong>1. Crie sua Loja:</strong> Dê um nome à sua empresa.</p>
            <p><strong>2. Conecte seu WhatsApp:</strong> Vincule seu número de WhatsApp.</p>
            <p><strong>3. Personalize seus Agentes:</strong> Defina a "personalidade" dos seus robôs.</p>
            <p><strong>4. Finalizar:</strong> Complete o processo para salvar tudo.</p>
          </div>
          <DialogFooter><Button onClick={() => setShowHelp(false)}>Entendi</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative">
        <div className="w-full max-w-3xl space-y-6">
          
          <OnboardingStatus 
            tenant={tenant} 
            channelSettings={channelSettings} 
            agentConfig={agentConfig} 
            onReset={handleReset}
            isLoading={isLoading}
          />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="step1">1. Loja</TabsTrigger>
              <TabsTrigger value="step2" disabled={!tenant}>2. WhatsApp</TabsTrigger>
              <TabsTrigger value="step3" disabled={!channelSettings}>3. Agentes</TabsTrigger>
              <TabsTrigger value="step4" disabled={!agentConfig || !tenant}>4. Finalizar</TabsTrigger>
            </TabsList>

            <TabsContent value="step1"><Step1Tenant tenant={tenant} onTenantCreated={handleTenantCreated} /></TabsContent>
            <TabsContent value="step2">{tenant && <Step2Whatsapp tenant={tenant} onChannelConnected={handleChannelConnected} />}</TabsContent>
            <TabsContent value="step3">{tenant && channelSettings && <Step3AgentPrompts tenant={tenant} channelSettings={channelSettings} onAgentConfigSaved={handleAgentConfigSaved} existingConfig={agentConfig} />}</TabsContent>
            <TabsContent value="step4">{tenant && <Step4Finalize tenant={tenant} onFinalize={handleFinalize} />}</TabsContent>
          </Tabs>
        </div>

        <div className="fixed bottom-6 right-6">
          <Button variant="outline" size="icon" className="rounded-full h-14 w-14 shadow-lg" onClick={() => setShowHelp(true)}>
            <HelpCircle className="h-7 w-7" />
          </Button>
        </div>
      </div>
    </>
  );
}
