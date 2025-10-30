import {
  useState,
  useEffect,
  useCallback,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import type { Step2WhatsappProps } from "@/types";
import type { ChannelSettings } from "@/types";
import {
  createChannelSettings,
  updateChannelStatus,
  getChannelSettings,
} from "@/services/supabaseService";
import {
  createInstance,
  getInstanceQrCode,
  getInstanceStatus,
} from "@/services/evolutionService";

/**
 * Step 2 of the onboarding flow: connect a WhatsApp number to the tenant.
 * Handles creation of the channel settings, instance management and QR code flow.
 */
export function Step2Whatsapp({ tenant, onChannelConnected }: Step2WhatsappProps) {
  type ChannelState =
    | "INITIAL"
    | "CREATING_INSTANCE"
    | "PENDING_QR"
    | "CONNECTING"
    | "CONNECTED"
    | "ERROR";

  const [settings, setSettings] = useState<ChannelSettings | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [status, setStatus] = useState<ChannelState>("INITIAL");
  const [waNumber, setWaNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("Inform your number and click Connect");

  /**
   * Given channel settings, ensure that an instance exists and check
   * if it's already connected. Useful to resume previous onboarding sessions.
   */
  const validateInstanceAndCheckConnected = useCallback(
    async (channel: ChannelSettings): Promise<boolean> => {
      try {
        // Attempt to create instance; ignore "already exists" errors
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
            msg.includes("already exists") ||
            msg.includes("already in use") ||
            msg.includes("Falha ao criar instância");
          if (!alreadyExists) {
            throw createErr;
          }
        }

        // Check instance status
        const statusResult = await getInstanceStatus(channel);
        return statusResult.status === "open";
      } catch (err: any) {
        throw new Error(err?.message || "Erro ao validar a instância.");
      }
    },
    []
  );

  // Load existing channel settings when the component mounts
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
            // Resume pending QR code flows: check instance status
            const statusResult = await getInstanceStatus(existing);
            if (statusResult.status === "open") {
              await updateChannelStatus(
                tenant.id,
                "CONNECTED",
                existing.wa_number || undefined
              );
              const updatedSettings = await getChannelSettings(tenant.id);
              if (updatedSettings) {
                setSettings(updatedSettings);
                setStatus("CONNECTED");
                setStatusMessage("Canal conectado!");
                onChannelConnected(updatedSettings);
              }
            } else {
              setStatus("INITIAL");
              setStatusMessage(
                "Conexão anterior não finalizada. Tente novamente."
              );
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant.id]);

  /**
   * Create or resume an instance, fetch a QR code and start polling for connection.
   */
  const startConnectionProcess = useCallback(
    async (channel: ChannelSettings) => {
      let pollingInterval: number | null = null;
      let isConnected = false;
      const MAX_POLLING_MS = 2 * 60 * 1000;
      const pollingStart = Date.now();

      const cleanup = () => {
        if (pollingInterval) window.clearInterval(pollingInterval);
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
          if (
            isConnected ||
            Date.now() - pollingStart > MAX_POLLING_MS
          ) {
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
        // Attempt to create instance; ignore already exists errors
        try {
          await createInstance(channel);
        } catch (createErr: any) {
          const alreadyExists =
            createErr.message?.includes("already exists") ||
            createErr.message?.includes("already in use");
          if (!alreadyExists) throw createErr;
        }
        setStatus("PENDING_QR");
        setStatusMessage("Gerando QR Code...");
        const { qrCode: qrData, pairingCode: pairingData } = await getInstanceQrCode(channel);
        setQrCode(qrData);
        setPairingCode(pairingData);
        setStatus("CONNECTING");
        setStatusMessage("Aguardando conexão...");
        pollStatus();
      } catch (err: any) {
        setError(err.message || "Falha ao iniciar a conexão.");
        setStatus("ERROR");
      }
    },
    [tenant.id, onChannelConnected]
  );

  /**
   * Initiate the connection process when the user clicks the connect button.
   * Validates the number, creates the channel settings if needed and
   * starts the instance/QR flow.
   */
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
      // Check if there's already an open instance before starting QR flow
      const alreadyConnected = await validateInstanceAndCheckConnected(
        channelForInstance
      );
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
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Returns a renderable object describing the current status. This
   * consolidates the icon, text and color selection in one place.
   */
  const renderStatus = () => {
    const statusConfig = {
      INITIAL: {
        icon: null,
        text: "Informe seu número e clique em Conectar.",
        color: "text-muted-foreground",
      },
      CREATING_INSTANCE: {
        icon: <Loader2 className="mr-2 h-4 w-4 animate-spin" />,
        text: statusMessage,
        color: "text-blue-600",
      },
      PENDING_QR: {
        icon: <Loader2 className="mr-2 h-4 w-4 animate-spin" />,
        text: statusMessage,
        color: "text-blue-600",
      },
      CONNECTING: {
        icon: <Loader2 className="mr-2 h-4 w-4 animate-spin" />,
        text: statusMessage,
        color: "text-blue-600",
      },
      CONNECTED: {
        icon: <CheckCircle className="mr-2 h-4 w-4 text-green-500" />,
        text: statusMessage || "Conectado com sucesso!",
        color: "text-green-600",
      },
      ERROR: {
        icon: <XCircle className="mr-2 h-4 w-4 text-red-500" />,
        text: error || "Ocorreu um erro.",
        color: "text-red-600",
      },
    } as const;
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
        <CardDescription>
          Informe seu número para criar a instância e escaneie o QR Code para
          conectar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="wa-number">
            Número do WhatsApp (com DDI e DDD)
          </Label>
          <Input
            id="wa-number"
            placeholder="Ex: 5511999999999"
            value={waNumber}
            onChange={(e) => setWaNumber(e.target.value)}
            disabled={isLoading || status === "CONNECTED"}
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
              <p className="text-sm text-muted-foreground mb-2">
                Ou use o código de pareamento no WhatsApp:
              </p>
              <p className="text-2xl font-bold tracking-widest font-mono">
                {pairingCode}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                WhatsApp → Dispositivos Vinculados → Vincular um dispositivo →
                Vincular com número
              </p>
            </div>
          )}
          {status === "ERROR" && error && (
            <Alert variant="destructive" className="w-full">
              <AlertTitle>Erro na Conexão</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        {status !== "CONNECTED" ? (
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
}