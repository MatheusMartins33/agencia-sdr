import { useState, useEffect, useCallback } from "react";
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
  saveAgentPrompts,
  getChannelSettings,
  getTenantSettings,
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
} from "lucide-react";
import type { Tenant, ChannelSettings } from "@/types";
import { Textarea } from "@/components/ui/textarea";

// --- TYPES AND INTERFACES ---
type ChannelState = "INITIAL" | "CREATING_INSTANCE" | "PENDING_QR" | "CONNECTING" | "CONNECTED" | "ERROR";

// --- CHILD COMPONENTS FOR EACH STEP ---

const Step1Tenant = ({ tenant, onTenantCreated }: { tenant: Tenant | null, onTenantCreated: (newTenant: Tenant) => void }) => {
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
      setError("Falha ao criar a loja. Verifique se o nome já não está em uso.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>1. Crie sua Loja</CardTitle>
        <CardDescription>
          Comece dando um nome para sua loja ou empresa. Este nome será usado para identificar seu ambiente.
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
          <Alert variant="default" className="border border-green-100 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-500"/>
            <AlertTitle>Loja Criada!</AlertTitle>
            <AlertDescription>Sua loja "{tenant.name}" está pronta. Você pode avançar para o próximo passo.</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleCreate} disabled={!tenantName.trim() || isLoading || !!tenant}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {tenant ? "Salvo" : "Salvar e Avançar"}
        </Button>
      </CardFooter>
    </Card>
  );
};

const Step2Whatsapp = ({ tenant, onChannelConnected }: { tenant: Tenant, onChannelConnected: (settings: ChannelSettings) => void }) => {
  const [settings, setSettings] = useState<ChannelSettings | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [status, setStatus] = useState<ChannelState>("INITIAL");
  const [waNumber, setWaNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  // Carrega configurações existentes ao montar o componente
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const existing = await getChannelSettings(tenant.id);
        if (existing) {
          setSettings(existing);
          if (existing.wa_number) setWaNumber(existing.wa_number);
          
          // Verifica o status atual da instância
          if (existing.status === 'CONNECTED') {
            setStatus('CONNECTED');
            setStatusMessage('Canal já conectado!');
            onChannelConnected(existing);
          } else if (existing.status === 'PENDING_QR') {
            // Se estava pendente, verifica se já conectou
            try {
              const statusResult = await getInstanceStatus(existing);
              if (statusResult.status === 'open') {
                await updateChannelStatus(tenant.id, "CONNECTED", existing.wa_number);
                setStatus('CONNECTED');
                setStatusMessage('Canal conectado!');
                const updatedSettings = await getChannelSettings(tenant.id);
                if (updatedSettings) {
                  onChannelConnected(updatedSettings);
                }
              } else {
                setStatus('INITIAL');
                setStatusMessage('Conexão anterior não finalizada. Tente novamente.');
              }
            } catch (err) {
              console.error("Erro ao verificar status:", err);
              setStatus('INITIAL');
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

  const startConnectionProcess = useCallback(async (channel: ChannelSettings) => {
    let pollingInterval: NodeJS.Timeout | null = null;
    let socket: WebSocket | null = null;
    let isConnected = false;

    const cleanup = () => {
      console.log('[Cleanup] Limpando recursos...');
      if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
      if (socket) {
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          socket.close();
        }
        socket = null;
      }
    };

    const handleSuccessfulConnection = async () => {
      if (isConnected) {
        console.log('[Connection] Já conectado, ignorando chamada duplicada');
        return;
      }
      isConnected = true;
      console.log('[Connection] Conexão estabelecida com sucesso!');
      
      cleanup();
      setStatus("CONNECTED");
      setStatusMessage("Conectado com sucesso!");
      
      try {
        await updateChannelStatus(tenant.id, "CONNECTED", channel.wa_number || undefined);
        const updatedSettings = await getChannelSettings(tenant.id);
        if (updatedSettings) {
          onChannelConnected(updatedSettings);
        }
      } catch (err) {
        console.error('[Connection] Erro ao atualizar status:', err);
      }
    };

    const pollStatus = () => {
      console.log('[Polling] Iniciando monitoramento de status...');
      pollingInterval = setInterval(async () => {
        if (isConnected) {
          cleanup();
          return;
        }
        
        try {
          console.log('[Polling] Verificando status da instância...');
          const statusResult = await getInstanceStatus(channel);
          console.log('[Polling] Status recebido:', statusResult.status);
          
          if (statusResult.status === 'open') {
            await handleSuccessfulConnection();
          }
        } catch (pollErr) {
          console.error('[Polling] Erro ao verificar status:', pollErr);
        }
      }, 5000);
    };

    try {
      // PASSO 1: Criar a instância (se não existir)
      setStatus("CREATING_INSTANCE");
      setStatusMessage("Criando instância no WhatsApp...");
      console.log('[Instance] Criando instância:', channel.instance_name);
      
      try {
        await createInstance(channel);
        console.log('[Instance] Instância criada com sucesso');
      } catch (createErr: any) {
        // Se já existe (409 ou mensagem específica), continua normalmente
        const alreadyExists = createErr.message?.includes('already exists') || 
                              createErr.message?.includes('already in use');
        if (alreadyExists) {
          console.warn('[Instance] Instância já existe, continuando...');
        } else {
          throw createErr;
        }
      }

      // PASSO 2: Buscar o QR Code
      setStatus("PENDING_QR");
      setStatusMessage("Gerando QR Code...");
      console.log('[QR Code] Buscando QR Code...');
      
      const { qrCode: qrData, pairingCode: pairingData } = await getInstanceQrCode(channel);
      console.log('[QR Code] QR Code recebido, tamanho:', qrData?.length);
      
      setQrCode(qrData);
      setPairingCode(pairingData);
      setStatusMessage("Escaneie o QR Code ou use o código de pareamento");

      // PASSO 3: Configurar monitoramento da conexão
      setStatus("CONNECTING");
      console.log('[WebSocket] Tentando conectar via WebSocket...');
      
      // Tenta WebSocket primeiro
      try {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const baseUrl = channel.evo_base_url.replace(/^https?:\/\//, '');
        const wsUrl = `${wsProtocol}//${baseUrl}/instance/webhook/${channel.instance_name}`;
        
        console.log('[WebSocket] URL:', wsUrl);
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          console.log('[WebSocket] Conexão WebSocket estabelecida');
          setStatusMessage("Aguardando leitura do QR Code...");
        };

        socket.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[WebSocket] Mensagem recebida:', data);
            
            if (data.event === "connection.update" && data.data?.state === "open") {
              console.log('[WebSocket] Conexão confirmada via WebSocket');
              await handleSuccessfulConnection();
            }
          } catch (err) {
            console.error('[WebSocket] Erro ao processar mensagem:', err);
          }
        };

        socket.onerror = (err) => {
          console.error('[WebSocket] Erro na conexão:', err);
          setStatusMessage("Monitorando conexão via polling...");
          // Inicia polling como fallback se WebSocket falhar
          if (!pollingInterval) {
            pollStatus();
          }
        };

        socket.onclose = () => {
          console.log('[WebSocket] Conexão fechada');
          // Se socket fecha antes de conectar, inicia polling
          if (!isConnected && !pollingInterval) {
            console.log('[WebSocket] Iniciando polling como fallback');
            pollStatus();
          }
        };
      } catch (wsErr) {
        console.error('[WebSocket] Falha ao criar WebSocket:', wsErr);
        // Se WebSocket falhar completamente, usa apenas polling
        pollStatus();
      }

      // PASSO 4: Iniciar polling como rede de segurança (se WebSocket não iniciou)
      // Apenas inicia se o WebSocket não conseguiu iniciar polling
      setTimeout(() => {
        if (!pollingInterval && !isConnected) {
          console.log('[Polling] Iniciando polling como rede de segurança');
          pollStatus();
        }
      }, 2000);

      return cleanup;

    } catch (err: any) {
      console.error('[Connection] Erro no processo de conexão:', err);
      setError(err.message || "Falha ao iniciar a conexão.");
      setStatus("ERROR");
      setStatusMessage("");
      cleanup();
      throw err;
    }
  }, [tenant.id, onChannelConnected]);

  const handleConnect = async () => {
    if (!waNumber.trim()) {
      setError("Digite um número de WhatsApp válido (incluindo DDI e DDD).");
      return;
    }
    
    // Valida formato básico do número
    const cleanNumber = waNumber.replace(/\D/g, '');
    if (cleanNumber.length < 10) {
      setError("Número muito curto. Use o formato: DDI + DDD + número (ex: 5511999999999)");
      return;
    }

    setIsLoading(true);
    setError(null);
    setQrCode(null);
    setPairingCode(null);
    setStatusMessage("");

    try {
      console.log('[Connect] Iniciando processo de conexão...');
      
      // Cria ou obtém as configurações do canal
      let channel = settings;
      if (!channel) {
        console.log('[Connect] Criando configurações do canal...');
        channel = await createChannelSettings(tenant);
      }
      
      const channelForInstance = { ...channel, wa_number: waNumber };
      setSettings(channelForInstance);
      
      // Atualiza status no banco antes de iniciar
      await updateChannelStatus(tenant.id, "PENDING_QR", waNumber);
      
      // Inicia o processo de conexão
      await startConnectionProcess(channelForInstance);

    } catch (err: any) {
      console.error('[Connect] Erro:', err);
      setError(err.message || "Falha ao iniciar a conexão. Verifique as configurações da Evolution API.");
      setStatus("ERROR");
      setStatusMessage("");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStatus = () => {
    const statusConfig: Record<ChannelState, { icon: JSX.Element | null; text: string; color: string }> = {
      INITIAL: { 
        icon: null, 
        text: "Informe seu número e clique em Conectar.", 
        color: "text-muted-foreground" 
      },
      CREATING_INSTANCE: { 
        icon: <Loader2 className="mr-2 h-4 w-4 animate-spin" />, 
        text: statusMessage, 
        color: "text-blue-600" 
      },
      PENDING_QR: { 
        icon: <Loader2 className="mr-2 h-4 w-4 animate-spin" />, 
        text: statusMessage, 
        color: "text-blue-600" 
      },
      CONNECTING: { 
        icon: <Loader2 className="mr-2 h-4 w-4 animate-spin" />, 
        text: statusMessage, 
        color: "text-blue-600" 
      },
      CONNECTED: { 
        icon: <CheckCircle className="mr-2 h-4 w-4 text-green-500" />, 
        text: statusMessage || "Conectado com sucesso!", 
        color: "text-green-600" 
      },
      ERROR: { 
        icon: <XCircle className="mr-2 h-4 w-4 text-red-500" />, 
        text: error || 'Ocorreu um erro.', 
        color: "text-red-600" 
      }
    };

    const config = statusConfig[status];
    
    return (
      <div className={`flex items-center ${config.color}`}>
        {config.icon}
        <span className="text-sm">{config.text}</span>
      </div>
    );
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
          <Input 
            id="wa-number" 
            placeholder="Ex: 5511999999999" 
            value={waNumber} 
            onChange={(e) => setWaNumber(e.target.value)} 
            disabled={isLoading || status === 'CONNECTED'} 
          />
          <p className="text-xs text-muted-foreground">
            Formato: DDI (55) + DDD (11) + Número (999999999)
          </p>
        </div>
        
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-64 h-64 bg-muted flex items-center justify-center rounded-lg overflow-hidden border-2 border-border">
            {qrCode && (status === "PENDING_QR" || status === "CONNECTING") ? (
              <img 
                src={`data:image/png;base64,${qrCode}`} 
                alt="QR Code do WhatsApp" 
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center text-center p-4">
                {renderStatus()}
              </div>
            )}
          </div>
          
          {pairingCode && (status === "PENDING_QR" || status === "CONNECTING") && (
            <div className="text-center p-4 bg-muted rounded-lg w-full">
              <p className="text-sm text-muted-foreground mb-2">Ou use o código de pareamento no WhatsApp:</p>
              <p className="text-2xl font-bold tracking-widest font-mono">{pairingCode}</p>
              <p className="text-xs text-muted-foreground mt-2">
                WhatsApp → Dispositivos Vinculados → Vincular um dispositivo → Vincular com número
              </p>
            </div>
          )}
          
          {status === 'ERROR' && error && (
            <Alert variant="destructive" className="w-full">
              <AlertTitle>Erro na Conexão</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        {status !== 'CONNECTED' ? (
          <Button onClick={handleConnect} disabled={isLoading || !waNumber.trim()}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Conectar
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle />
            <span>Canal Conectado</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

const Step3AgentPrompts = ({ tenant, onPromptsSaved }: { tenant: Tenant, onPromptsSaved: () => void }) => {
  const [promptAtivo, setPromptAtivo] = useState("Você é o Agente SDR da [Nome da Loja]. Seja simpático, utilize emojis sutis e destaque promoções.");
  const [promptReativo, setPromptReativo] = useState("Você é a assistente virtual da [Nome da Loja]. Responda com educação, ajude com dúvidas sobre produtos e nunca force a venda.");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await saveAgentPrompts(tenant.id, promptAtivo, promptReativo);
      onPromptsSaved();
    } catch (err: any) {
      setError("Falha ao salvar os prompts. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>3. Personalize seus Agentes de IA</CardTitle>
        <CardDescription>Defina a personalidade dos seus agentes para prospecção e atendimento.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="prompt-ativo">🤖 Agente Ativo (para prospecção)</Label>
          <Textarea 
            id="prompt-ativo" 
            value={promptAtivo} 
            onChange={(e) => setPromptAtivo(e.target.value)} 
            rows={4} 
            disabled={isLoading} 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prompt-reativo">💬 Agente Reativo (para respostas)</Label>
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
      <CardFooter className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Personalização
        </Button>
      </CardFooter>
    </Card>
  );
};

const Step4Finalize = ({ onFinalize }: { onFinalize: () => void }) => {
  const { refreshTenant } = useAuth();

  const handleFinish = async () => {
    await refreshTenant();
    onFinalize();
  };

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
  
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [channelSettings, setChannelSettings] = useState<ChannelSettings | null>(null);
  const [promptsSaved, setPromptsSaved] = useState(false);

  const { user, refreshTenant } = useAuth();

  const handleTenantCreated = useCallback((newTenant: Tenant) => {
    setTenant(newTenant);
    setActiveTab("step2");
  }, []);

  const handleChannelConnected = useCallback((settings: ChannelSettings) => {
    setChannelSettings(settings);
    setActiveTab("step3");
  }, []);

  const handlePromptsSaved = useCallback(() => {
    setPromptsSaved(true);
    setActiveTab("step4");
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      if (!user) return;
      const existingTenant = await getTenantSettings(user.id);
      if (existingTenant) {
        handleTenantCreated(existingTenant);
        const existingChannel = await getChannelSettings(existingTenant.id);
        if (existingChannel && existingChannel.status === 'CONNECTED') {
          handleChannelConnected(existingChannel);
          // Aqui você poderia verificar se os prompts já estão salvos
        }
      }
    };
    loadInitialData();
  }, [user, handleTenantCreated, handleChannelConnected]);

  const handleFinalize = async () => {
    await refreshTenant();
    alert("Onboarding Concluído! Redirecionando...");
    window.location.href = '/';
  };

  return (
    <>
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bem-vindo à Configuração!</DialogTitle>
            <DialogDescription>
              Vamos configurar seu ambiente em 4 passos simples. Complete cada etapa para habilitar a próxima.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 text-sm text-muted-foreground">
            <p><strong>1. Crie sua Loja:</strong> Dê um nome à sua empresa. É o primeiro passo para criar seu ambiente exclusivo.</p>
            <p><strong>2. Conecte seu WhatsApp:</strong> Vincule seu número de WhatsApp para que os agentes de IA possam interagir com seus clientes.</p>
            <p><strong>3. Personalize seus Agentes:</strong> Defina a "personalidade" e as instruções que seus robôs usarão nas conversas.</p>
            <p><strong>4. Finalizar:</strong> Complete o processo para salvar tudo e acessar seu painel de controle principal.</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowHelp(false)}>Entendi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative">
        <div className="w-full max-w-3xl space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">Configuração Inicial</h1>
            <p className="text-muted-foreground">
              Siga as abas para configurar seu ambiente. Etapas concluídas desbloqueiam as seguintes.
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="step1">1. Loja</TabsTrigger>
              <TabsTrigger value="step2" disabled={!tenant}>2. WhatsApp</TabsTrigger>
              <TabsTrigger value="step3" disabled={!channelSettings}>3. Agentes</TabsTrigger>
              <TabsTrigger value="step4" disabled={!promptsSaved}>4. Finalizar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="step1">
              <Step1Tenant tenant={tenant} onTenantCreated={handleTenantCreated} />
            </TabsContent>
            
            <TabsContent value="step2">
              {tenant && <Step2Whatsapp tenant={tenant} onChannelConnected={handleChannelConnected} />}
            </TabsContent>
            
            <TabsContent value="step3">
              {tenant && <Step3AgentPrompts tenant={tenant} onPromptsSaved={handlePromptsSaved} />}
            </TabsContent>
            
            <TabsContent value="step4">
              {<Step4Finalize onFinalize={handleFinalize} />}
            </TabsContent>
          </Tabs>
        </div>
        
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