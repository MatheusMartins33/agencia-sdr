import { useState } from "react";
import { DateRange } from "@/types";
import { Header } from "@/components/Header";
import { MetricCard } from "@/components/MetricCard";
import { LoadingState } from "@/components/LoadingState";
import { useMetricsAgenteAtivo } from "@/hooks/useMetrics";
import { Send, Award, Zap } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent } from "@/lib/format";

export default function AgenteAtivo() {
  const [dateRange, setDateRange] = useState<DateRange>("7d");
  const metrics = useMetricsAgenteAtivo(dateRange);

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
          <h1 className="text-3xl font-bold text-foreground">Agente Ativo</h1>
          <p className="text-muted-foreground">
            Performance de disparos e engajamento
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Disparos Totais"
            value={metrics.disparosPorDia.reduce((sum, d) => sum + d.disparos, 0)}
            icon={Send}
            subtitle="Total no período"
          />
          <MetricCard
            title="Score Médio Disparados"
            value={metrics.scoreMedia.toFixed(1)}
            icon={Award}
            subtitle="Qualidade dos leads"
            trend={metrics.scoreMedia > 60 ? "up" : "neutral"}
          />
          <MetricCard
            title="Engajamento Pós-Disparo"
            value={formatPercent(metrics.engajamentoPos)}
            icon={Zap}
            subtitle="Taxa de resposta"
            trend={metrics.engajamentoPos > 30 ? "up" : "neutral"}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Disparos por Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.disparosPorDia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="data"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }}
                />
                <YAxis />
                <Tooltip labelFormatter={(label) => `Data: ${label}`} />
                <Line
                  type="monotone"
                  dataKey="disparos"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 Produtos Disparados</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.topProdutosDisparados} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="produto" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--chart-2))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
