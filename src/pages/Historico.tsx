import { useState } from "react";
import { Header } from "@/components/Header";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { useHistorico } from "@/hooks/useHistorico";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/dates";
import { Search } from "lucide-react";

export default function Historico() {
  const { data: historico, isLoading, isError } = useHistorico();
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("todos");

  if (isLoading) {
    return (
      <>
        <Header />
        <LoadingState />
      </>
    );
  }

  if (isError || !historico) {
    return (
      <>
        <Header />
        <ErrorState message="Não foi possível carregar o histórico de interações." />
      </>
    );
  }

  const filteredHistorico = historico.filter((h) => {
    const matchesSearch =
      searchTerm === "" ||
      h.id_lead?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.mensagem_enviada?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.resposta_cliente?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTipo =
      tipoFilter === "todos" || h.tipo_agente === tipoFilter;

    return matchesSearch && matchesTipo;
  });

  return (
    <>
      <Header />
      <main className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Histórico</h1>
          <p className="text-muted-foreground">
            Registro completo de interações
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por lead, mensagem ou resposta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="ativo">Agente Ativo</SelectItem>
                  <SelectItem value="reativo">Agente Reativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Interações ({filteredHistorico.length} registros)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Lead ID</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Mensagem Enviada</TableHead>
                  <TableHead>Resposta Cliente</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistorico.map((hist) => (
                  <TableRow key={hist.id_historico}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {formatDate(hist.timestamp)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {hist.id_lead}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          hist.tipo_agente === "ativo" ? "default" : "secondary"
                        }
                      >
                        {hist.tipo_agente}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {hist.mensagem_enviada || "N/A"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {hist.resposta_cliente || "Sem resposta"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {hist.produto_relacionado || "N/A"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {hist.acao_tomada || "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
