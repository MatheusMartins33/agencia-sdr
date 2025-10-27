import { useState } from "react";
import { DateRange } from "@/types";
import { Header } from "@/components/Header";
import { MetricCard } from "@/components/MetricCard";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { useMetricsOverview } from "@/hooks/useMetrics";
import { Users, MessageCircle, TrendingUp, Award } from "lucide-react";
import { formatPercent } from "@/lib/format";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Overview() {
  const [dateRange, setDateRange] = useState<DateRange>("7d");
  const metrics = useMetricsOverview(dateRange);

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
          <h1 className="text-3xl font-bold text-foreground">Overview</h1>
          <p className="text-muted-foreground">
            Visão geral do desempenho dos SDRs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Leads Contatados"
            value={metrics.totalLeadsContatados}
            icon={Users}
            subtitle="Total no período"
          />
          <MetricCard
            title="Taxa de Resposta"
            value={formatPercent(metrics.taxaResposta)}
            icon={MessageCircle}
            subtitle="Média de engajamento"
            trend={metrics.taxaResposta > 50 ? "up" : "neutral"}
          />
          <MetricCard
            title="Taxa de Conversão"
            value={formatPercent(metrics.taxaConversao)}
            icon={TrendingUp}
            subtitle="Leads convertidos"
            trend={metrics.taxaConversao > 20 ? "up" : "neutral"}
          />
          <MetricCard
            title="Score Médio"
            value={metrics.scoreMedia.toFixed(1)}
            icon={Award}
            subtitle="Qualidade da base"
            trend={metrics.scoreMedia > 60 ? "up" : "neutral"}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Taxa de Resposta por Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.taxaRespostaPorDia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="data"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }}
                />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="taxa"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
