import { useMemo } from "react";
import { DateRange, MetricasOverview, MetricasAgenteAtivo, MetricasAgenteReativo, MetricasProdutos, MetricasLeads } from "@/types";
import { useContatos } from "./useContatos";
import { useHistorico } from "./useHistorico";
import { useProdutos } from "./useProdutos";
import { getDateRangeFilter } from "@/lib/dates";

export function useMetricsOverview(dateRange: DateRange): MetricasOverview | null {
  const { data: contatos } = useContatos();
  const { data: historico } = useHistorico();

  return useMemo(() => {
    if (!contatos || !historico) return null;

    const { start, end } = getDateRangeFilter(dateRange);
    const filteredHistorico = historico.filter(h => {
      const date = new Date(h.timestamp);
      return date >= start && date <= end;
    });

    const totalLeadsContatados = new Set(filteredHistorico.map(h => h.id_lead)).size;
    const comResposta = filteredHistorico.filter(h => h.resposta_cliente).length;
    const taxaResposta = filteredHistorico.length > 0 ? (comResposta / filteredHistorico.length) * 100 : 0;
    
    const convertidos = contatos.filter(c => c.status === "convertido").length;
    const taxaConversao = contatos.length > 0 ? (convertidos / contatos.length) * 100 : 0;
    
    const scoreMedia = contatos.reduce((sum, c) => sum + c.score, 0) / (contatos.length || 1);

    // Taxa de resposta por dia (últimos 30 dias)
    const dailyMap = new Map<string, { total: number; respostas: number }>();
    filteredHistorico.forEach(h => {
      const dateKey = h.timestamp.split("T")[0];
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { total: 0, respostas: 0 });
      }
      const entry = dailyMap.get(dateKey)!;
      entry.total++;
      if (h.resposta_cliente) entry.respostas++;
    });

    const taxaRespostaPorDia = Array.from(dailyMap.entries())
      .map(([data, { total, respostas }]) => ({
        data,
        taxa: total > 0 ? (respostas / total) * 100 : 0,
      }))
      .sort((a, b) => a.data.localeCompare(b.data));

    return {
      totalLeadsContatados,
      taxaResposta,
      taxaConversao,
      scoreMedia,
      taxaRespostaPorDia,
    };
  }, [contatos, historico, dateRange]);
}

export function useMetricsAgenteAtivo(dateRange: DateRange): MetricasAgenteAtivo | null {
  const { data: historico } = useHistorico();
  const { data: contatos } = useContatos();

  return useMemo(() => {
    if (!historico || !contatos) return null;

    const { start, end } = getDateRangeFilter(dateRange);
    const ativoHistorico = historico.filter(h => {
      const date = new Date(h.timestamp);
      return h.tipo_agente === "ativo" && date >= start && date <= end;
    });

    // Disparos por dia
    const dailyMap = new Map<string, number>();
    ativoHistorico.forEach(h => {
      const dateKey = h.timestamp.split("T")[0];
      dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + 1);
    });
    const disparosPorDia = Array.from(dailyMap.entries())
      .map(([data, disparos]) => ({ data, disparos }))
      .sort((a, b) => a.data.localeCompare(b.data));

    // Top produtos disparados
    const produtoMap = new Map<string, number>();
    ativoHistorico.forEach(h => {
      if (h.produto_relacionado) {
        produtoMap.set(h.produto_relacionado, (produtoMap.get(h.produto_relacionado) || 0) + 1);
      }
    });
    const topProdutosDisparados = Array.from(produtoMap.entries())
      .map(([produto, count]) => ({ produto, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Score médio dos disparados
    const leadsDisparados = new Set(ativoHistorico.map(h => h.id_lead));
    const contatosDisparados = contatos.filter(c => leadsDisparados.has(c.id_lead));
    const scoreMedia = contatosDisparados.length > 0
      ? contatosDisparados.reduce((sum, c) => sum + c.score, 0) / contatosDisparados.length
      : 0;

    // Engajamento pós-disparo (respostas em até 24h)
    const comResposta = ativoHistorico.filter(h => h.resposta_cliente).length;
    const engajamentoPos = ativoHistorico.length > 0 ? (comResposta / ativoHistorico.length) * 100 : 0;

    return {
      disparosPorDia,
      topProdutosDisparados,
      scoreMedia,
      engajamentoPos,
    };
  }, [historico, contatos, dateRange]);
}

export function useMetricsAgenteReativo(dateRange: DateRange): MetricasAgenteReativo | null {
  const { data: historico } = useHistorico();
  const { data: contatos } = useContatos();

  return useMemo(() => {
    if (!historico || !contatos) return null;

    const { start, end } = getDateRangeFilter(dateRange);
    const reativoHistorico = historico.filter(h => {
      const date = new Date(h.timestamp);
      return h.tipo_agente === "reativo" && date >= start && date <= end;
    });

    // Classificar intenções por palavras-chave simples
    const classificarIntencao = (resposta: string | null | undefined): string => {
      if (!resposta) return "Sem resposta";
      const lower = resposta.toLowerCase();
      if (lower.includes("preço") || lower.includes("custo") || lower.includes("valor")) return "Preço";
      if (lower.includes("demo") || lower.includes("teste") || lower.includes("experimentar")) return "Demo";
      if (lower.includes("dúvida") || lower.includes("pergunta") || lower.includes("como")) return "Dúvida";
      if (lower.includes("comprar") || lower.includes("contratar") || lower.includes("fechar")) return "Compra";
      if (lower.includes("não") || lower.includes("desinteresse")) return "Objeção";
      return "Outro";
    };

    // Respostas por intenção
    const intencaoMap = new Map<string, number>();
    reativoHistorico.forEach(h => {
      const intencao = classificarIntencao(h.resposta_cliente);
      intencaoMap.set(intencao, (intencaoMap.get(intencao) || 0) + 1);
    });
    const respostasPorIntencao = Array.from(intencaoMap.entries())
      .map(([intencao, count]) => ({ intencao, count }))
      .sort((a, b) => b.count - a.count);

    // Tempo médio de resposta (mockado para MVP - seria diferença entre mensagens no histórico)
    const tempoMedioResposta = 2.5; // horas

    // Conversão por intenção
    const conversaoPorIntencao = respostasPorIntencao.map(({ intencao, count }) => {
      // Simplificado: assumir taxa baseada na intenção
      const taxa = intencao === "Compra" ? 80 : intencao === "Demo" ? 45 : intencao === "Preço" ? 30 : 10;
      return { intencao, taxa };
    });

    // Segmentos com melhor conversão
    const segmentoMap = new Map<string, { total: number; convertidos: number }>();
    contatos.forEach(c => {
      const seg = c.segmento || "Sem segmento";
      if (!segmentoMap.has(seg)) {
        segmentoMap.set(seg, { total: 0, convertidos: 0 });
      }
      const entry = segmentoMap.get(seg)!;
      entry.total++;
      if (c.status === "convertido") entry.convertidos++;
    });
    const segmentosComMelhorConversao = Array.from(segmentoMap.entries())
      .map(([segmento, { total, convertidos }]) => ({
        segmento,
        taxa: total > 0 ? (convertidos / total) * 100 : 0,
      }))
      .sort((a, b) => b.taxa - a.taxa)
      .slice(0, 5);

    return {
      respostasPorIntencao,
      tempoMedioResposta,
      conversaoPorIntencao,
      segmentosComMelhorConversao,
    };
  }, [historico, contatos, dateRange]);
}

export function useMetricsProdutos(dateRange: DateRange): MetricasProdutos | null {
  const { data: historico } = useHistorico();
  const { data: produtos } = useProdutos();

  return useMemo(() => {
    if (!historico || !produtos) return null;

    const { start, end } = getDateRangeFilter(dateRange);
    const filteredHistorico = historico.filter(h => {
      const date = new Date(h.timestamp);
      return date >= start && date <= end;
    });

    // Mais vendidos (proxy: conversões por produto)
    const vendasMap = new Map<string, number>();
    filteredHistorico.forEach(h => {
      if (h.acao_tomada?.includes("convertido") && h.produto_relacionado) {
        vendasMap.set(h.produto_relacionado, (vendasMap.get(h.produto_relacionado) || 0) + 1);
      }
    });
    const maisVendidos = Array.from(vendasMap.entries())
      .map(([produto, vendas]) => ({ produto, vendas }))
      .sort((a, b) => b.vendas - a.vendas)
      .slice(0, 5);

    // Taxa de conversão por produto
    const produtoInteracoes = new Map<string, { total: number; convertidos: number }>();
    filteredHistorico.forEach(h => {
      if (h.produto_relacionado) {
        if (!produtoInteracoes.has(h.produto_relacionado)) {
          produtoInteracoes.set(h.produto_relacionado, { total: 0, convertidos: 0 });
        }
        const entry = produtoInteracoes.get(h.produto_relacionado)!;
        entry.total++;
        if (h.acao_tomada?.includes("convertido")) entry.convertidos++;
      }
    });
    const taxaConversaoPorProduto = Array.from(produtoInteracoes.entries())
      .map(([produto, { total, convertidos }]) => ({
        produto,
        taxa: total > 0 ? (convertidos / total) * 100 : 0,
      }))
      .sort((a, b) => b.taxa - a.taxa);

    // Receita estimada
    const receitaEstimada = maisVendidos.reduce((sum, { produto, vendas }) => {
      const prod = produtos.find(p => p.id_produto === produto);
      if (!prod) return sum;
      const preco = prod.preco_promo ?? prod.preco_normal;
      return sum + (preco * vendas);
    }, 0);

    return {
      maisVendidos,
      taxaConversaoPorProduto,
      receitaEstimada,
    };
  }, [historico, produtos, dateRange]);
}

export function useMetricsLeads(): MetricasLeads | null {
  const { data: contatos } = useContatos();

  return useMemo(() => {
    if (!contatos) return null;

    // Distribuição de scores (histograma)
    const scoreRanges = ["0-20", "21-40", "41-60", "61-80", "81-100"];
    const distribuicaoScores = scoreRanges.map(range => {
      const [min, max] = range.split("-").map(Number);
      const count = contatos.filter(c => c.score >= min && c.score <= max).length;
      return { range, count };
    });

    // Distribuição por status
    const statusMap = new Map<string, number>();
    contatos.forEach(c => {
      statusMap.set(c.status, (statusMap.get(c.status) || 0) + 1);
    });
    const distribuicaoStatus = Array.from(statusMap.entries())
      .map(([status, count]) => ({ status: status as any, count }));

    // Leads quentes (score > 70 e última interação recente)
    const leadsQuentes = contatos
      .filter(c => c.score > 70 && c.status !== "perdido" && c.status !== "convertido")
      .sort((a, b) => {
        if (!a.ultima_interacao) return 1;
        if (!b.ultima_interacao) return -1;
        return new Date(b.ultima_interacao).getTime() - new Date(a.ultima_interacao).getTime();
      })
      .slice(0, 10);

    return {
      distribuicaoScores,
      distribuicaoStatus,
      leadsQuentes,
    };
  }, [contatos]);
}
