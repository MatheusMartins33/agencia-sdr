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

# agencia-sdr

Aplicação frontend (Vite + React + TypeScript) para dashboard de performance de SDR — métricas, visualizações e integração com fontes de dados (demo, Google Sheets ou API).

Este repositório contém a versão atualmente em desenvolvimento do projeto. O README anterior estava desatualizado; este arquivo resume como rodar, configurar e contribuir com o projeto.

## Principais tecnologias

- React + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- TanStack Query
- Supabase (cliente presente em `src/integrations/supabase`)
- Recharts para visualizações

## Scripts úteis

Disponíveis em `package.json`:

- `npm run dev` — roda o ambiente de desenvolvimento (Vite)
- `npm run build` — build para produção
- `npm run build:dev` — build em modo development
- `npm run preview` — preview do build
- `npm run lint` — lint com ESLint

Instalação:

```powershell
npm install
```

Rodar em desenvolvimento:

```powershell
npm run dev
```

## Variáveis de ambiente

Crie um arquivo `.env` na raiz (este arquivo NÃO deve ser comitado). Principais chaves usadas pelo projeto:

- `VITE_DATA_SOURCE` — `demo` (padrão), `sheets` ou `api`
- `VITE_SHEETS_API_KEY` — (quando `sheets`)
- `VITE_SHEETS_SPREADSHEET_ID` — (quando `sheets`)
- `VITE_SHEETS_TAB_PRODUTOS`, `VITE_SHEETS_TAB_CONTATOS`, `VITE_SHEETS_TAB_HISTORICO` — nomes das abas no Sheets
- `VITE_API_BASE_URL` — quando `VITE_DATA_SOURCE=api`

Exemplo mínimo:

```env
VITE_DATA_SOURCE=demo
# VITE_SHEETS_API_KEY=...
# VITE_SHEETS_SPREADSHEET_ID=...
```

Observação: já existe um arquivo `.env.example` com chaves de exemplo — copie-o para `.env` e preencha as chaves necessárias.

## Estrutura do projeto (resumo)

- `src/` — código fonte
	- `components/` — componentes reutilizáveis (inclui `ui/` com os componentes shadcn)
	- `pages/` — páginas da aplicação (Overview, AgenteAtivo, AgenteReativo, Produtos, Leads, Histórico, etc.)
	- `hooks/` — hooks de dados (useProdutos, useContatos, useHistorico, ...)
	- `services/` — integração com fontes de dados (`sheets.ts`, `api.ts`, `supabaseService.ts`)
	- `lib/` — utilitários e fixtures (`fixtures.ts` fornece dados de exemplo para `demo` mode)

Além disso há uma pasta `supabase/` com migrations e `tailwind.config.ts`, `vite.config.ts` e configurações de TypeScript/ESLint.

## Deployment

Recomendado: Vercel (deploy contínuo conectado ao GitHub). Configure variáveis de ambiente no dashboard do provedor.

## Segurança e boas práticas

- Nunca comitar `.env` ou chaves sensíveis. O projeto já possui `.gitignore` atualizado para ignorar `.env`.
- Revise a pasta `supabase/` se ela contiver segredos antes de tornar o repositório público.

## Contribuição

Se quiser contribuir:

1. Fork este repositório
2. Crie uma branch com a feature ou correção: `git checkout -b feature/nome-da-feature`
3. Faça commits pequenos e com mensagens claras
4. Abra um Pull Request descrevendo as mudanças

## Próximos passos sugeridos

- Adicionar CI (GitHub Actions) para lint/build
- Configurar proteções de branch (branch protection) no GitHub
- Escrever um guia de deploy para Vercel/Netlify

## Licença

MIT

---

Se quiser, posso:

- adicionar badges (build / license) ao topo do README
- gerar um `CONTRIBUTING.md` e um `SECURITY.md`
- configurar um workflow básico de GitHub Actions para lint/build

Diga qual opção prefere que eu faça a seguir.
