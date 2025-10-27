import { useState } from "react";
import { Header } from "@/components/Header";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { useMetricsLeads } from "@/hooks/useMetrics";
import { useContatos } from "@/hooks/useContatos";
import { useHistorico } from "@/hooks/useHistorico";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Contato } from "@/types";
import { formatDate } from "@/lib/dates";
import { Button } from "@/components/ui/button";

export default function Leads() {
  const { data: contatos, isLoading: isContatosLoading, isError: isContatosError } = useContatos();
  const { data: historico, isLoading: isHistoricoLoading, isError: isHistoricoError } = useHistorico();
  
  // Este hook é síncrono e depende dos dados acima, então não tem seu próprio estado de loading.
  const metrics = useMetricsLeads();

  const [selectedLead, setSelectedLead] = useState<Contato | null>(null);

  const isLoading = isContatosLoading || isHistoricoLoading;
  const isError = isContatosError || isHistoricoError;

  if (isLoading) {
    return (
      <>
        <Header />
        <LoadingState />
      </>
    );
  }

  if (isError || !contatos || !historico || !metrics) {
    return (
      <>
        <Header />
        <ErrorState message="Não foi possível carregar os dados dos leads." />
      </>
    );
  }

  const leadHistorico = selectedLead
    ? historico.filter((h) => h.id_lead === selectedLead.id_lead)
    : [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      novo: "outline",
      contatado: "secondary",
      respondeu: "default",
      convertido: "default",
      perdido: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <>
      <Header />
      <main className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground">Funil e gestão de leads</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.distribuicaoScores}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--chart-1))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.distribuicaoStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--chart-2))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Leads Quentes (Score &gt; 70)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Segmento</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Última Interação</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.leadsQuentes.map((lead) => (
                  <TableRow key={lead.id_lead}>
                    <TableCell className="font-medium">{lead.nome}</TableCell>
                    <TableCell>{lead.empresa || "N/A"}</TableCell>
                    <TableCell>{lead.segmento || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant="default">{lead.score}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(lead.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(lead.ultima_interacao)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedLead(lead)}
                      >
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog
          open={!!selectedLead}
          onOpenChange={() => setSelectedLead(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedLead?.nome}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedLead?.email || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{selectedLead?.telefone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Empresa</p>
                  <p className="font-medium">{selectedLead?.empresa || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Segmento</p>
                  <p className="font-medium">{selectedLead?.segmento || "N/A"}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Histórico de Interações</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {leadHistorico.map((hist) => (
                    <div
                      key={hist.id_historico}
                      className="border-l-2 border-primary pl-4 py-2"
                    >
                      <p className="text-xs text-muted-foreground">
                        {formatDate(hist.timestamp)} • {hist.tipo_agente}
                      </p>
                      <p className="text-sm mt-1">
                        <strong>Mensagem:</strong> {hist.mensagem_enviada}
                      </p>
                      {hist.resposta_cliente && (
                        <p className="text-sm mt-1 text-muted-foreground">
                          <strong>Resposta:</strong> {hist.resposta_cliente}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}
