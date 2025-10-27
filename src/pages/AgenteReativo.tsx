import { useState } from "react";
import { DateRange } from "@/types";
import { Header } from "@/components/Header";
import { MetricCard } from "@/components/MetricCard";
import { LoadingState } from "@/components/LoadingState";
import { useMetricsAgenteReativo } from "@/hooks/useMetrics";
import { MessageSquare, Clock } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
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
import { formatPercent } from "@/lib/format";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function AgenteReativo() {
  const [dateRange, setDateRange] = useState<DateRange>("7d");
  const metrics = useMetricsAgenteReativo(dateRange);

  if (!metrics) {
    return (
      <>
        <Header onDateRangeChange={setDateRange} />
        <LoadingState />
      </>
    );
  }

  return (
    <>
      <Header onDateRangeChange={setDateRange} />
      <main className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agente Reativo</h1>
          <p className="text-muted-foreground">
            Análise de respostas e intenções
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MetricCard
            title="Respostas Totais"
            value={metrics.respostasPorIntencao.reduce((sum, i) => sum + i.count, 0)}
            icon={MessageSquare}
            subtitle="Total no período"
          />
          <MetricCard
            title="Tempo Médio de Resposta"
            value={`${metrics.tempoMedioResposta.toFixed(1)}h`}
            icon={Clock}
            subtitle="Velocidade de atendimento"
            trend="neutral"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Respostas por Intenção</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={metrics.respostasPorIntencao}
                    dataKey="count"
                    nameKey="intencao"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {metrics.respostasPorIntencao.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conversão por Intenção</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.conversaoPorIntencao}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="intencao" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                  <Bar dataKey="taxa" fill="hsl(var(--chart-3))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Segmentos com Melhor Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Segmento</TableHead>
                  <TableHead className="text-right">Taxa de Conversão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.segmentosComMelhorConversao.map((seg, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{seg.segmento}</TableCell>
                    <TableCell className="text-right">
                      {formatPercent(seg.taxa)}
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
