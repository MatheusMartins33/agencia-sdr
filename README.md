# SDR Performance & Gestão

Dashboard web para análise de performance de SDR, integrado com Google Sheets.

## 🚀 Tecnologias

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts
- **Data**: Google Sheets API (com fallback para Demo Mode)
- **State**: TanStack Query

## 📊 Funcionalidades

### Páginas Implementadas

1. **Overview**: Métricas gerais (leads contatados, taxa de resposta, conversão, score médio)
2. **Agente Ativo**: Performance de disparos (trend, top produtos, engajamento)
3. **Agente Reativo**: Análise de respostas (intenções, tempo de resposta, conversão por segmento)
4. **Produtos**: Ranking de vendas, conversão por produto, receita estimada
5. **Leads**: Funil, distribuição de scores/status, leads quentes com histórico
6. **Histórico**: Lista completa de interações com filtros

### Arquitetura de Dados

O app suporta duas fontes de dados:

- **Demo Mode** (padrão): Usa fixtures locais em `src/lib/fixtures.ts`
- **Google Sheets API**: Leitura em tempo real das 3 planilhas configuradas
- **API REST** (preparado): Basta alterar `DATA_SOURCE` para migrar

## 🛠️ Configuração

### 1. Instalação

```bash
npm install
```

### 2. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Fonte de dados: "demo", "sheets" ou "api"
VITE_DATA_SOURCE=demo

# Configuração Google Sheets (quando DATA_SOURCE="sheets")
VITE_SHEETS_API_KEY=your_api_key_here
VITE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here
VITE_SHEETS_TAB_PRODUTOS=PRODUTOS
VITE_SHEETS_TAB_CONTATOS=CONTATOS
VITE_SHEETS_TAB_HISTORICO=HISTORICO

# Configuração API REST (quando DATA_SOURCE="api")
VITE_API_BASE_URL=https://your-api.com
```

### 3. Google Sheets Setup

#### Obter Spreadsheet ID
1. Abra sua planilha do Google Sheets
2. Copie o ID da URL: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`

#### Obter API Key
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um projeto novo ou selecione existente
3. Vá em "APIs & Services" > "Credentials"
4. Clique em "Create Credentials" > "API Key"
5. Ative a "Google Sheets API" em "Enabled APIs & services"

#### Estrutura das Planilhas

**PRODUTOS** (aba 1):
```
id_produto | nome_produto | descricao | quantidade | preco_normal | preco_promo | link_foto | validade_promo
P001       | Plano Básico | ...       | 100        | 299.00       | 249.00      | ...       | 2025-12-31T23:59:59Z
```

**CONTATOS** (aba 2):
```
id_lead | nome        | telefone      | email              | empresa  | segmento   | score | status     | ultima_interacao
L001    | João Silva  | +5511999...   | joao@empresa.com   | TechCorp | Tecnologia | 85    | respondeu  | 2025-10-15T14:30:00Z
```

**HISTORICO** (aba 3):
```
id_historico | id_lead | timestamp            | tipo_agente | mensagem_enviada | resposta_cliente | produto_relacionado | acao_tomada
H001         | L001    | 2025-10-15T14:30:00Z | ativo       | Olá João!        | Interessante!    | P002                | enviou_proposta
```

### 4. Rodar o Projeto

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## 🎯 Modos de Operação

### Demo Mode (Padrão)
```env
VITE_DATA_SOURCE=demo
```
Usa dados de exemplo em `src/lib/fixtures.ts`. Ideal para testes e desenvolvimento.

### Google Sheets Mode
```env
VITE_DATA_SOURCE=sheets
VITE_SHEETS_API_KEY=...
VITE_SHEETS_SPREADSHEET_ID=...
```
Lê dados diretamente das planilhas configuradas.

### API Mode (Futuro)
```env
VITE_DATA_SOURCE=api
VITE_API_BASE_URL=https://...
```
Consome endpoints REST:
- `GET /api/produtos`
- `GET /api/contatos`
- `GET /api/historico`
- `GET /api/metrics/*` (para métricas pré-calculadas)

## 📁 Estrutura do Projeto

```
src/
├── components/        # Componentes reutilizáveis
│   ├── ui/           # shadcn/ui components
│   ├── ErrorState.tsx
│   ├── Header.tsx
│   ├── LoadingState.tsx
│   ├── MetricCard.tsx
│   └── Sidebar.tsx
├── hooks/            # Custom hooks
│   ├── useContatos.ts
│   ├── useHistorico.ts
│   ├── useMetrics.ts
│   └── useProdutos.ts
├── lib/              # Utilitários
│   ├── dates.ts
│   ├── fixtures.ts   # Dados de exemplo
│   ├── format.ts
│   └── utils.ts
├── pages/            # Páginas da aplicação
│   ├── AgenteAtivo.tsx
│   ├── AgenteReativo.tsx
│   ├── Historico.tsx
│   ├── Leads.tsx
│   ├── Overview.tsx
│   └── Produtos.tsx
├── services/         # Camada de dados
│   ├── api.ts       # Future API integration
│   └── sheets.ts    # Google Sheets integration
├── types/            # TypeScript types
│   └── index.ts
└── App.tsx           # Router principal
```

## 🔄 Migração de Dados

O código está preparado para migrar de Google Sheets → API REST sem alterar componentes:

1. Implemente endpoints REST conforme `src/services/api.ts`
2. Altere `VITE_DATA_SOURCE=api` no `.env`
3. Configure `VITE_API_BASE_URL`

Os hooks (`useProdutos`, `useContatos`, etc.) consomem a mesma interface, independente da fonte.

## 📈 Métricas Implementadas

### Overview
- Total de leads contatados
- Taxa de resposta (%)
- Taxa de conversão (%)
- Score médio da base
- Gráfico: Taxa de resposta por dia

### Agente Ativo
- Disparos por dia (trend)
- Top 5 produtos disparados
- Score médio dos leads disparados
- Engajamento pós-disparo (%)

### Agente Reativo
- Respostas por intenção (classificação por keywords)
- Tempo médio de resposta
- Conversão por intenção
- Segmentos com melhor conversão

### Produtos
- Produtos mais vendidos (proxy: conversões)
- Taxa de conversão por produto
- Receita estimada (usa preco_promo quando disponível)

### Leads
- Distribuição de scores (histograma)
- Distribuição por status
- Leads quentes (score > 70)
- Detalhamento com histórico de interações

## 🚢 Deploy

### Vercel (Recomendado)

1. Faça push do código para GitHub
2. Conecte o repositório no Vercel
3. Configure as variáveis de ambiente no dashboard
4. Deploy automático a cada push

### Variáveis necessárias no Vercel:
```
VITE_DATA_SOURCE=sheets
VITE_SHEETS_API_KEY=...
VITE_SHEETS_SPREADSHEET_ID=...
VITE_SHEETS_TAB_PRODUTOS=PRODUTOS
VITE_SHEETS_TAB_CONTATOS=CONTATOS
VITE_SHEETS_TAB_HISTORICO=HISTORICO
```

## 📝 Notas Importantes

- **Somente Leitura (MVP)**: O app não escreve nas planilhas. Atualizações devem ser feitas manualmente ou via sistemas externos.
- **Cache**: Os dados são cacheados por 5 minutos (configurável em cada hook).
- **Responsivo**: Design otimizado para desktop e mobile.
- **Filtros de Data**: Overview e métricas de agentes suportam filtros (Hoje, 7d, 30d).

## 🛡️ Segurança

- **API Key**: Nunca commite API keys no código. Use apenas variáveis de ambiente.
- **CORS**: Configure permissões adequadas no Google Sheets (compartilhar com "Qualquer pessoa com o link").
- **Rate Limits**: O Google Sheets API tem limites de requisições. Considere cache no backend para produção.

## 🤝 Contribuindo

Este é um MVP. Futuras melhorias podem incluir:
- Escrita em Google Sheets via API intermediária
- Autenticação e permissões por usuário
- Filtros avançados e exportação de relatórios
- Integração com WhatsApp/n8n
- Métricas de IA real (classificação de intenções com LLM)

## 📄 Licença

MIT
