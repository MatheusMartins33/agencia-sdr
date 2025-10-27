import { Produto, Contato, Historico } from "@/types";

// Seed data for Demo Mode
export const produtosFixture: Produto[] = [
  {
    id_produto: "P001",
    nome_produto: "Plano Básico CRM",
    descricao: "Sistema básico de gestão de clientes",
    quantidade: 100,
    preco_normal: 299.00,
    preco_promo: 249.00,
    link_foto: null,
    validade_promo: "2025-12-31T23:59:59Z"
  },
  {
    id_produto: "P002",
    nome_produto: "Plano Pro CRM",
    descricao: "Sistema avançado com automação",
    quantidade: 50,
    preco_normal: 599.00,
    preco_promo: 499.00,
    link_foto: null,
    validade_promo: "2025-12-31T23:59:59Z"
  },
  {
    id_produto: "P003",
    nome_produto: "Consultoria de Vendas",
    descricao: "Sessões de consultoria personalizadas",
    quantidade: 20,
    preco_normal: 1500.00,
    preco_promo: null,
    link_foto: null,
    validade_promo: null
  },
  {
    id_produto: "P004",
    nome_produto: "Treinamento SDR",
    descricao: "Curso completo para SDRs",
    quantidade: 30,
    preco_normal: 899.00,
    preco_promo: 699.00,
    link_foto: null,
    validade_promo: "2025-11-30T23:59:59Z"
  },
  {
    id_produto: "P005",
    nome_produto: "Integração API",
    descricao: "Pacote de integrações customizadas",
    quantidade: 15,
    preco_normal: 2500.00,
    preco_promo: null,
    link_foto: null,
    validade_promo: null
  }
];

export const contatosFixture: Contato[] = [
  {
    id_lead: "L001",
    nome: "João Silva",
    telefone: "+5511999998888",
    email: "joao@empresa.com",
    empresa: "TechCorp",
    segmento: "Tecnologia",
    score: 85,
    status: "respondeu",
    ultima_interacao: "2025-10-15T14:30:00Z"
  },
  {
    id_lead: "L002",
    nome: "Maria Santos",
    telefone: "+5511988887777",
    email: "maria@consultoria.com",
    empresa: "ConsultX",
    segmento: "Consultoria",
    score: 92,
    status: "convertido",
    ultima_interacao: "2025-10-14T10:15:00Z"
  },
  {
    id_lead: "L003",
    nome: "Pedro Costa",
    telefone: "+5511977776666",
    email: "pedro@startup.io",
    empresa: "StartupXYZ",
    segmento: "Tecnologia",
    score: 65,
    status: "contatado",
    ultima_interacao: "2025-10-16T09:00:00Z"
  },
  {
    id_lead: "L004",
    nome: "Ana Oliveira",
    telefone: "+5511966665555",
    email: "ana@retail.com",
    empresa: "RetailPlus",
    segmento: "Varejo",
    score: 78,
    status: "respondeu",
    ultima_interacao: "2025-10-15T16:45:00Z"
  },
  {
    id_lead: "L005",
    nome: "Carlos Ferreira",
    telefone: "+5511955554444",
    email: "carlos@industria.com",
    empresa: "IndústriaBR",
    segmento: "Indústria",
    score: 45,
    status: "novo",
    ultima_interacao: "2025-10-16T08:00:00Z"
  },
  {
    id_lead: "L006",
    nome: "Juliana Alves",
    telefone: "+5511944443333",
    email: "juliana@saude.com",
    empresa: "HealthCare+",
    segmento: "Saúde",
    score: 88,
    status: "convertido",
    ultima_interacao: "2025-10-13T11:20:00Z"
  },
  {
    id_lead: "L007",
    nome: "Roberto Lima",
    telefone: "+5511933332222",
    email: "roberto@financeira.com",
    empresa: "FinançasXP",
    segmento: "Financeiro",
    score: 72,
    status: "respondeu",
    ultima_interacao: "2025-10-15T13:10:00Z"
  },
  {
    id_lead: "L008",
    nome: "Fernanda Souza",
    telefone: "+5511922221111",
    email: "fernanda@educacao.com",
    empresa: "EduTech",
    segmento: "Educação",
    score: 55,
    status: "contatado",
    ultima_interacao: "2025-10-16T07:30:00Z"
  },
  {
    id_lead: "L009",
    nome: "Ricardo Melo",
    telefone: "+5511911110000",
    email: "ricardo@logistica.com",
    empresa: "LogFast",
    segmento: "Logística",
    score: 38,
    status: "perdido",
    ultima_interacao: "2025-10-10T15:00:00Z"
  },
  {
    id_lead: "L010",
    nome: "Beatriz Rocha",
    telefone: "+5511900009999",
    email: "beatriz@marketing.com",
    empresa: "MarketingPro",
    segmento: "Marketing",
    score: 95,
    status: "convertido",
    ultima_interacao: "2025-10-12T14:00:00Z"
  }
];

export const historicoFixture: Historico[] = [
  {
    id_historico: "H001",
    id_lead: "L001",
    timestamp: "2025-10-15T14:30:00Z",
    tipo_agente: "ativo",
    mensagem_enviada: "Olá João! Temos uma oferta especial no Plano Pro CRM.",
    resposta_cliente: "Interessante! Gostaria de saber mais.",
    produto_relacionado: "P002",
    acao_tomada: "enviou_proposta"
  },
  {
    id_historico: "H002",
    id_lead: "L002",
    timestamp: "2025-10-14T10:15:00Z",
    tipo_agente: "reativo",
    mensagem_enviada: "Olá Maria! Como posso ajudar?",
    resposta_cliente: "Quero contratar o Plano Básico CRM",
    produto_relacionado: "P001",
    acao_tomada: "convertido"
  },
  {
    id_historico: "H003",
    id_lead: "L003",
    timestamp: "2025-10-16T09:00:00Z",
    tipo_agente: "ativo",
    mensagem_enviada: "Pedro, temos treinamento SDR com desconto!",
    resposta_cliente: null,
    produto_relacionado: "P004",
    acao_tomada: "aguardando_resposta"
  },
  {
    id_historico: "H004",
    id_lead: "L004",
    timestamp: "2025-10-15T16:45:00Z",
    tipo_agente: "reativo",
    mensagem_enviada: "Oi Ana! Em que posso ajudar hoje?",
    resposta_cliente: "Qual o prazo de implementação do CRM?",
    produto_relacionado: "P001",
    acao_tomada: "respondeu_duvida"
  },
  {
    id_historico: "H005",
    id_lead: "L005",
    timestamp: "2025-10-16T08:00:00Z",
    tipo_agente: "ativo",
    mensagem_enviada: "Carlos, nossa consultoria pode ajudar sua indústria!",
    resposta_cliente: null,
    produto_relacionado: "P003",
    acao_tomada: "aguardando_resposta"
  },
  {
    id_historico: "H006",
    id_lead: "L006",
    timestamp: "2025-10-13T11:20:00Z",
    tipo_agente: "ativo",
    mensagem_enviada: "Juliana, o Plano Pro é perfeito para clínicas!",
    resposta_cliente: "Perfeito! Quero contratar.",
    produto_relacionado: "P002",
    acao_tomada: "convertido"
  },
  {
    id_historico: "H007",
    id_lead: "L007",
    timestamp: "2025-10-15T13:10:00Z",
    tipo_agente: "reativo",
    mensagem_enviada: "Roberto, como vai?",
    resposta_cliente: "Bem! Tenho interesse na integração API",
    produto_relacionado: "P005",
    acao_tomada: "enviou_proposta"
  },
  {
    id_historico: "H008",
    id_lead: "L008",
    timestamp: "2025-10-16T07:30:00Z",
    tipo_agente: "ativo",
    mensagem_enviada: "Fernanda, temos CRM ideal para escolas!",
    resposta_cliente: null,
    produto_relacionado: "P001",
    acao_tomada: "aguardando_resposta"
  },
  {
    id_historico: "H009",
    id_lead: "L009",
    timestamp: "2025-10-10T15:00:00Z",
    tipo_agente: "ativo",
    mensagem_enviada: "Ricardo, sua logística pode melhorar com nosso CRM",
    resposta_cliente: "Não tenho interesse no momento",
    produto_relacionado: "P001",
    acao_tomada: "perdido"
  },
  {
    id_historico: "H010",
    id_lead: "L010",
    timestamp: "2025-10-12T14:00:00Z",
    tipo_agente: "reativo",
    mensagem_enviada: "Beatriz, oi!",
    resposta_cliente: "Quero fechar o treinamento SDR!",
    produto_relacionado: "P004",
    acao_tomada: "convertido"
  },
  {
    id_historico: "H011",
    id_lead: "L001",
    timestamp: "2025-10-14T10:00:00Z",
    tipo_agente: "ativo",
    mensagem_enviada: "João, não perca essa oportunidade!",
    resposta_cliente: "Vou pensar",
    produto_relacionado: "P002",
    acao_tomada: "follow_up"
  },
  {
    id_historico: "H012",
    id_lead: "L002",
    timestamp: "2025-10-13T09:00:00Z",
    tipo_agente: "ativo",
    mensagem_enviada: "Maria, temos desconto especial!",
    resposta_cliente: "Ótimo, vamos conversar",
    produto_relacionado: "P001",
    acao_tomada: "agendou_reuniao"
  }
];
