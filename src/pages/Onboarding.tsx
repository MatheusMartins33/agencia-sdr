import { useState, useEffect } from "react";
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
import { Progress } from "@/components/ui/progress";
import {
  createTenant,
  createChannelSettings,
  updateChannelStatus,
  saveAgentPrompts,
  getChannelSettings,
} from "@/services/supabaseService";
import {
  createInstance,
  getInstanceQrCode,
  getInstanceStatus,
} from "@/services/evolutionService";
import { createWorkflow } from "@/services/n8nService";
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
  Upload,
  FileSpreadsheet,
  Users,
} from "lucide-react";
import type { Tenant, ChannelSettings } from "@/types";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Papa from "papaparse";

/*
 * This file contains the implementation for the four‑step onboarding wizard used
 * to configure a new SDR environment. It has been refactored for clarity
 * and robustness:
 *
 *  • The WhatsApp connection step no longer auto‑advances when the instance
 *    becomes connected; instead, the user explicitly advances when ready.
 *  • Polling timers are cleaned up whenever the component is unmounted or
 *    when a new polling cycle begins, preventing orphaned timers.
 *  • Minor typing improvements make it easier to reason about state.
 *  • Error messages provide clearer guidance on what went wrong.
 */

/**
 * Types used in the onboarding flow. UploadType differentiates the kind of
 * optional CSV file being imported. ChannelState defines the lifecycle of the
 * WhatsApp integration step – we separate internal statuses (INITIAL,
 * CREATED, PENDING_QR, CONNECTED, ERROR) from backend statuses defined by
 * ChannelSettings.status for clarity.
 */
type UploadType = "produtos" | "contatos";

// Finite state machine states for the WhatsApp step
type ChannelState =
  | "INITIAL"
  | "CREATED"
  | "PENDING_QR"
  | "CONNECTED"
  | "ERROR";

const TOTAL_STEPS = 4;

// Interface for a parsed CSV file returned by the FileUploader
interface ParsedFile {
  data: any[];
  fileName: string;
  headers: string[];
}

// Step 1: Tenant Creation
const Step1Tenant = ({ onNext }: { onNext: (tenant: Tenant) => void }) => {
  const [tenantName, setTenantName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = async () => {
    if (!tenantName.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const newTenant = await createTenant(tenantName.trim());
      // Do not refresh context here; we allow the onboarding to complete all steps
      // before syncing membership. See Step4ImportData for refreshTenant.
      onNext(newTenant);
    } catch (err: any) {
      setError(
        "Falha ao criar a loja. Verifique se o nome já não está em uso ou se a função (create_new_tenant) foi criada no Supabase."
      );
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crie sua Loja</CardTitle>
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
            disabled={isLoading}
          />
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <span />
        <Button
          onClick={handleNext}
          disabled={!tenantName.trim() || isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Avançar
        </Button>
      </CardFooter>
    </Card>
  );
};

// Step 2: WhatsApp Configuration
/**
 * Nesta etapa configuramos o canal de comunicação via Evolution (WhatsApp).
 * O usuário informa seu número e seleciona o tipo de integração. Após clicar em
 * "Conectar" criamos as configurações do canal (se não existirem), registramos
 * a instância na Evolution API e exibimos o QR code. O estado de conexão é
 * acompanhado por polling; quando a instância estiver conectada (estado
 * "CONNECTED") o botão "Avançar" é habilitado.
 */
// Step 2: WhatsApp Configuration
/**
 * Nesta etapa configuramos o canal de comunicação via Evolution (WhatsApp).
 * O usuário informa seu número e seleciona o tipo de integração. Após clicar em
 * "Conectar" criamos as configurações do canal (se não existirem), registramos
 * a instância na Evolution API e exibimos o QR code. O estado de conexão é
 * acompanhado por polling; quando a instância estiver conectada (estado
 * "CONNECTED") o botão "Avançar" é habilitado.
 */
const Step2Whatsapp = ({
  tenant,
  onNext,
  onBack,
}: {
  tenant: Tenant;
  onNext: (settings: ChannelSettings) => void;
  onBack: () => void;
}) => {
  const [settings, setSettings] = useState<ChannelSettings | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [status, setStatus] = useState<ChannelState>("INITIAL");
  const [waNumber, setWaNumber] = useState("");
  const [integration, setIntegration] = useState<
    "WHATSAPP-BAILEYS" | "WHATSAPP-BUSINESS"
  >("WHATSAPP-BAILEYS");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep a ref to the current polling timer so we can cancel it when needed
  const [pollTimer, setPollTimer] = useState<NodeJS.Timeout | null>(null);

  // Load existing channel settings on mount. If a configuration already exists
  // we restore its status and, if necessary, begin polling for QR code / connection.
  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      try {
        const existing = await getChannelSettings(tenant.id);
        if (!isMounted) return;
        if (existing) {
          setSettings(existing);
          // Prefill the number if available
          if (existing.wa_number) setWaNumber(existing.wa_number);
          // Map backend status to our local state machine
          switch (existing.status) {
            case "CONNECTED":
              setStatus("CONNECTED");
              break;
            case "PENDING_QR":
              setStatus("PENDING_QR");
              // fetch QR and begin polling for connection
              await startPolling(existing, true);
              break;
            case "CREATED":
              setStatus("CREATED");
              break;
            default:
              setStatus("INITIAL");
              break;
          }
        }
      } catch (err) {
        console.error("Erro ao carregar configurações do canal:", err);
        setError(
          "Falha ao carregar configurações do canal. Verifique as variáveis de ambiente."
        );
      }
    };
    fetchSettings();
    return () => {
      isMounted = false;
      if (pollTimer) clearInterval(pollTimer);
    };
    // Only run on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant.id]);

  /**
   * Starts polling for the WhatsApp instance status and optionally fetches
   * a QR code first. It clears any existing timer before starting a new one.
   */
  const startPolling = async (channel: ChannelSettings, fetchQr = false) => {
    // Cancel any existing polling
    if (pollTimer) clearInterval(pollTimer);
    try {
      if (fetchQr) {
        const { qrCode, pairingCode } = await getInstanceQrCode(channel);
        setQrCode(qrCode);
        setPairingCode(pairingCode);
      }
    } catch (qrErr) {
      console.error("Erro ao obter QR code:", qrErr);
    }
    // Begin polling every 5s
    const timer = setInterval(async () => {
      try {
        const state = await getInstanceStatus(channel);
        const connected = state.status === "open";
        setStatus(connected ? "CONNECTED" : "PENDING_QR");
        if (connected) {
          if (pollTimer) clearInterval(pollTimer);
          await updateChannelStatus(
            tenant.id,
            "CONNECTED",
            channel.wa_number || undefined
          );
        }
      } catch (pollErr) {
        console.error("Polling error:", pollErr);
        setStatus("ERROR");
        if (pollTimer) clearInterval(pollTimer);
      }
    }, 5000);
    setPollTimer(timer);
  };

  /**
   * Handles the user clicking the Connect button. Creates channel settings if
   * they don't exist, writes the WhatsApp number to the DB, and kicks off
   * instance creation followed by polling for a QR code and connection.
   */
  const handleConnect = async () => {
    if (!waNumber.trim()) {
      setError("Digite um número de WhatsApp válido (incluindo DDI e DDD).");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      let channel = settings;
      if (!channel) {
        // Create a new channel settings entry for this tenant
        channel = await createChannelSettings(tenant);
        setSettings(channel);
      }
      // Persist the WhatsApp number and set status to CREATED
      await updateChannelStatus(tenant.id, "CREATED", waNumber);
      // Compose a local copy with our chosen integration (required by createInstance)
      const channelForInstance: any = {
        ...channel,
        wa_number: waNumber,
        integration,
      };
      setSettings(channelForInstance);
      setStatus("CREATED");
      // Provision the Evolution instance
      await createInstance(channelForInstance);
      // Mark as pending QR and persist the number
      await updateChannelStatus(tenant.id, "PENDING_QR", waNumber);
      setStatus("PENDING_QR");
      // Start polling for the QR and connection status
      await startPolling(channelForInstance, true);
    } catch (err: any) {
      console.error("Error connecting WhatsApp:", err);
      setError(
        "Falha ao configurar o canal do WhatsApp. Verifique as variáveis de ambiente e se a Evolution API está acessível."
      );
      setStatus("ERROR");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Render a textual representation of the current state under the QR code
   */
  const renderStatus = () => {
    switch (status) {
      case "INITIAL":
        return (
          <p className="text-sm text-muted-foreground">
            Informe seu número e clique em Conectar.
          </p>
        );
      case "CREATED":
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Inicializando
            configuração...
          </>
        );
      case "PENDING_QR":
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Aguardando leitura
            do QR Code...
          </>
        );
      case "CONNECTED":
        return (
          <>
            <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Conectado
            com sucesso!
          </>
        );
      case "ERROR":
      default:
        return (
          <>
            <XCircle className="mr-2 h-4 w-4 text-red-500" /> Desconectado ou
            com erro.
          </>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conecte seu WhatsApp</CardTitle>
        <CardDescription>
          Vamos criar uma instância para comunicação. Informe seu número e,
          em seguida, escaneie o QR Code com seu app do WhatsApp.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wa-number">
              Número do WhatsApp (com DDI e DDD)
            </Label>
            <Input
              id="wa-number"
              placeholder="Ex: 5511999999999"
              value={waNumber}
              onChange={(e) => setWaNumber(e.target.value)}
              disabled={isLoading || status !== "INITIAL"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="integration">Tipo de Integração</Label>
            <Select
              value={integration}
              onValueChange={(v) =>
                setIntegration(v as "WHATSAPP-BAILEYS" | "WHATSAPP-BUSINESS")
              }
              disabled={isLoading || status !== "INITIAL"}
            >
              <SelectTrigger id="integration">
                <SelectValue placeholder="Selecione o tipo de integração" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WHATSAPP-BAILEYS">
                  WhatsApp Baileys
                </SelectItem>
                <SelectItem value="WHATSAPP-BUSINESS">
                  WhatsApp Business (Beta)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-64 h-64 bg-muted flex items-center justify-center rounded-lg overflow-hidden">
            {qrCode && status !== "CONNECTED" ? (
              <img
                src={`data:image/png;base64,${qrCode}`}
                alt="QR Code do WhatsApp"
              />
            ) : (
              <div className="flex items-center text-muted-foreground">
                {renderStatus()}
              </div>
            )}
          </div>
          {pairingCode && (
            <div className="text-center mt-4">
              <p className="text-sm text-muted-foreground">Se preferir, use o código de pareamento:</p>
              <p className="text-2xl font-bold tracking-widest">{pairingCode}</p>
            </div>
          )}
          {status === "PENDING_QR" && (
            <p className="text-sm text-muted-foreground text-center">
              Aguardando você escanear o QR Code no WhatsApp...
            </p>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>
          Voltar
        </Button>
        {status === "INITIAL" ? (
          <Button
            onClick={handleConnect}
            disabled={isLoading || !waNumber.trim()}
          >
            Conectar
          </Button>
        ) : (
          <Button
            onClick={() => {
              if (settings) onNext(settings);
            }}
            disabled={status !== "CONNECTED"}
          >
            Avançar
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

// Step 3: Agent Prompts Configuration
const Step3AgentPrompts = ({
  tenant,
  onNext,
  onBack,
}: {
  tenant: Tenant;
  onNext: () => void;
  onBack: () => void;
}) => {
  const [promptAtivo, setPromptAtivo] = useState(
    "Você é o Agente SDR da [Nome da Loja]. Seja simpático, utilize emojis sutis e destaque promoções."
  );
  const [promptReativo, setPromptReativo] = useState(
    "Você é a assistente virtual da [Nome da Loja]. Responda com educação, ajude com dúvidas sobre produtos e nunca force a venda."
  );
  const [scheduleHour, setScheduleHour] = useState("8");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = async () => {
    if (!promptAtivo.trim() || !promptReativo.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      await saveAgentPrompts(tenant.id, promptAtivo, promptReativo);
      // Carrega o template base do workflow ativo
      const response = await fetch("/workflows/agente-ativo-base.json");
      if (!response.ok) throw new Error("Template de workflow base não encontrado.");
      const workflowJson: any = await response.json();
      // Busca as configurações do canal para recuperar urls e tokens
      const channelSettings = await getChannelSettings(tenant.id);
      if (!channelSettings) throw new Error("Configurações do canal não encontradas.");
      // Ajusta a hora do disparo no nó Schedule
      const scheduleNode = workflowJson.nodes.find(
        (node: any) => node.id === "879e518c-c149-45bb-a8a5-983b044cd37c"
      );
      if (scheduleNode) {
        scheduleNode.parameters.rule.interval[0].triggerAtHour = parseInt(
          scheduleHour,
          10
        );
      }
      // Ajusta a mensagem do agente ativo
      const agentNode = workflowJson.nodes.find(
        (node: any) => node.id === "fbbbfb14-0e19-4def-b68c-88597b023cf4"
      );
      if (agentNode) {
        const finalPrompt = promptAtivo.replace(/\[Nome da Loja\]/g, tenant.name);
        agentNode.parameters.options.systemMessage = finalPrompt;
      }
      // Ajusta o nó HTTP para enviar mensagens via Evolution
      const httpNode = workflowJson.nodes.find(
        (node: any) => node.id === "85b124db-9431-4d70-83e0-c0d347379f81"
      );
      if (httpNode) {
        httpNode.parameters.url = `${channelSettings.evo_base_url}/message/sendText/${channelSettings.instance_name}`;
        const apiKeyHeader = httpNode.parameters.headerParameters.parameters.find(
          (p: any) => p.name === "apikey"
        );
        if (apiKeyHeader) {
          apiKeyHeader.value = channelSettings.instance_token;
        }
      }
      // Nomeia o workflow de forma amigável
      workflowJson.name = `[ATIVO] - ${tenant.name} (${tenant.slug})`;
      await createWorkflow(workflowJson);
      onNext();
    } catch (err: any) {
      setError("Falha ao salvar os prompts. Tente novamente.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personalize seus Agentes de IA</CardTitle>
        <CardDescription>
          Defina a personalidade dos seus agentes. Eles usarão essas instruções
          para conversar com os clientes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="schedule-hour">⏰ Horário do Disparo Diário</Label>
          <Select
            value={scheduleHour}
            onValueChange={setScheduleHour}
            disabled={isLoading}
          >
            <SelectTrigger id="schedule-hour">
              <SelectValue placeholder="Selecione um horário" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 8).map((hour) => (
                <SelectItem key={hour} value={String(hour)}>
                  {`${hour}:00`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            O agente ativo entrará em contato com novos leads neste horário.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="prompt-ativo">
            🤖 Agente Ativo (para prospecção)
          </Label>
          <Textarea
            id="prompt-ativo"
            value={promptAtivo}
            onChange={(e) => setPromptAtivo(e.target.value)}
            rows={4}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prompt-reativo">
            💬 Agente Reativo (para respostas)
          </Label>
          <Textarea
            id="prompt-reativo"
            value={promptReativo}
            onChange={(e) => setPromptReativo(e.target.value)}
            rows={4}
            disabled={isLoading}
          />
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>
          Voltar
        </Button>
        <Button
          onClick={handleNext}
          disabled={
            isLoading || !promptAtivo.trim() || !promptReativo.trim()
          }
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Avançar
        </Button>
      </CardFooter>
    </Card>
  );
};

// Generic FileUploader component used by Step4
const FileUploader = ({
  type,
  onFileValidated,
}: {
  type: UploadType;
  onFileValidated: (file: ParsedFile | null) => void;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setError("Por favor, envie um arquivo CSV.");
      onFileValidated(null);
      return;
    }
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) {
          setError("Arquivo CSV vazio.");
          onFileValidated(null);
          return;
        }
        const parsedFile: ParsedFile = {
          data: results.data,
          fileName: file.name,
          headers: results.meta.fields || [],
        };
        setError(null);
        onFileValidated(parsedFile);
      },
      error: (err) => {
        setError(`Erro ao processar o arquivo: ${err.message}`);
        onFileValidated(null);
      },
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const icon =
    type === "produtos" ? (
      <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
    ) : (
      <Users className="h-12 w-12 text-muted-foreground" />
    );
  const label = type === "produtos" ? "Produtos" : "Contatos";

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/25"
        }`}
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          className="hidden"
          id={`file-${type}`}
        />
        <label
          htmlFor={`file-${type}`}
          className="cursor-pointer flex flex-col items-center gap-2"
        >
          {icon}
          <p className="text-sm text-muted-foreground">
            Arraste um arquivo CSV ou clique para selecionar
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => e.preventDefault()}
          >
            <Upload className="mr-2 h-4 w-4" /> Escolher arquivo
          </Button>
        </label>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

// Step 4: Import Data
const Step4ImportData = ({
  tenant,
  onNext,
  onBack,
}: {
  tenant: Tenant;
  onNext: () => void;
  onBack: () => void;
}) => {
  const [productsFile, setProductsFile] = useState<ParsedFile | null>(null);
  const [contactsFile, setContactsFile] = useState<ParsedFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { refreshTenant } = useAuth();

  const handleNext = async () => {
    setIsLoading(true);
    // Placeholder for actual import logic – you can integrate Supabase
    // functions here to bulk import products and contacts. The
    // onboarding flow treats this step as optional.
    console.log("Produtos a importar:", productsFile?.data.length);
    console.log("Contatos a importar:", contactsFile?.data.length);
    // Simula delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Ao final do onboarding, sincronize o membership do usuário para
    // refletir a nova associação de tenant. Isso atualizará o contexto
    // AuthContext.member e permitirá a navegação para o dashboard/home.
    await refreshTenant();
    setIsLoading(false);
    onNext();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importar Dados (Opcional)</CardTitle>
        <CardDescription>
          Faça o upload de suas listas de produtos e contatos. Você também pode
          pular esta etapa e fazer isso mais tarde.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative">
          <FileUploader type="produtos" onFileValidated={setProductsFile} />
          {productsFile && (
            <div className="mt-2 flex items-center gap-2 text-sm text-green-600 bg-green-100 p-2 rounded-md">
              <CheckCircle className="h-5 w-5" />
              <span>{productsFile.data.length} produtos validados</span>
            </div>
          )}
        </div>
        <div className="relative">
          <FileUploader type="contatos" onFileValidated={setContactsFile} />
          {contactsFile && (
            <div className="mt-2 flex items-center gap-2 text-sm text-green-600 bg-green-100 p-2 rounded-md">
              <CheckCircle className="h-5 w-5" />
              <span>{contactsFile.data.length} contatos validados</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>
          Voltar
        </Button>
        <Button onClick={handleNext} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Avançar
        </Button>
      </CardFooter>
    </Card>
  );
};

// Main Onboarding Component
export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<{
    tenant: Tenant | null;
    channelSettings: ChannelSettings | null;
  }>({
    tenant: null,
    channelSettings: null,
  });

  const handleStep1Next = (newTenant: Tenant) => {
    setOnboardingData((prev) => ({
      ...prev,
      tenant: newTenant,
      channelSettings: null,
    }));
    setStep(2);
  };

  const handleStep2Next = (settings: ChannelSettings) => {
    setOnboardingData((prev) => ({ ...prev, channelSettings: settings }));
    setStep(3);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1Tenant onNext={handleStep1Next} />;
      case 2:
        return onboardingData.tenant ? (
          <Step2Whatsapp
            tenant={onboardingData.tenant}
            onNext={handleStep2Next}
            onBack={() => setStep(1)}
          />
        ) : null;
      case 3:
        return onboardingData.tenant ? (
          <Step3AgentPrompts
            tenant={onboardingData.tenant}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        ) : null;
      case 4:
        return onboardingData.tenant ? (
          <Step4ImportData
            tenant={onboardingData.tenant}
            onNext={() => alert("Onboarding Concluído!")}
            onBack={() => setStep(3)}
          />
        ) : null;
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Etapa {step}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Onboarding concluído ou etapa em construção.</p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Configuração Inicial</h1>
          <p className="text-muted-foreground">
            Siga os passos para configurar seu ambiente e começar a usar os
            agentes de IA.
          </p>
        </div>
        <Progress value={(step / TOTAL_STEPS) * 100} className="w-full" />
        <div>{renderStep()}</div>
        <div className="text-center text-sm text-muted-foreground">
          Passo {step} de {TOTAL_STEPS}
        </div>
      </div>
    </div>
  );
}