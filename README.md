## Sistema de Controle de Estoque - Betel

Aplicação web para gerenciamento de estoque, chips corporativos e ativos (notebooks, celulares etc.), com autenticação via Supabase, filtros por departamento, histórico e análises.

### 🚀 Funcionalidades

- **Dashboard**
  - Visão geral com cartões e gráficos
  - Distribuição por departamento
  - Indicadores e alertas

- **Chips**
  - Cadastro/edição de chips (Claro, Vivo, etc.)
  - Filtro por empresa e departamento
  - Controle de usuário atual, plano e custo mensal
  - Histórico de ações
  - Paleta visual padronizada com “Ativos”

- **Ativos**
  - Cadastro/edição de equipamentos (notebook, celular, tablet, outros)
  - Filtros por tipo, status e departamento
  - “Valor Total” formatado (ex.: 14k)
  - Status: ativo, inativo, manutenção, fora de uso
  - Data de Entrega (em vez de compra)
  - Garantia opcional: exibe “Desconhecida” quando não informada
  - Alertas para garantias próximas do vencimento (quando houver data)
  - Histórico de ações

- **Devoluções (quando habilitado)**
  - Histórico detalhado de movimentações

### 🛠️ Tecnologias

- React + TypeScript + Vite
- Tailwind CSS
- Supabase (Banco + Auth)
- Lucide React (ícones)
- Recharts (gráficos)
- React Router

### ⚙️ Requisitos

- Node.js 18+
- npm ou yarn
- Conta no Supabase (projeto e chaves)

### 🔧 Instalação

1) Clonar o repositório:
```bash
git clone https://github.com/JuniorFerreiraJ/ESTOQUE_BETEL.git
cd ESTOQUE_BETEL
```

2) Instalar dependências:
```bash
npm install
# ou
yarn install
```

3) Variáveis de ambiente:
Crie um arquivo `.env.local` na raiz com:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

4) Rodar em desenvolvimento:
```bash
npm run dev
# ou
yarn dev
```

### 🗄️ Banco de Dados (Supabase)

Tabelas principais utilizadas:
- `assets` (ativos)
  - Campos importantes: `asset_type`, `brand`, `model`, `serial_number`, `department`, `current_user_name`, `status`, `delivery_date`, `purchase_value`, `warranty_expiry` (pode ser NULL)
- `asset_history` (histórico de ativos)
- `chips` (chips corporativos)
  - Campos importantes: `phone_number`, `company`, `department`, `current_user_name`, `status`, `plan`, `monthly_cost`
- `chip_history` (histórico de chips)

Observações:
- “Data de Entrega” substitui “Data de Compra” nos ativos.
- `status` de ativos inclui `fora_uso` (substitui “perdido”).
- `warranty_expiry` nos ativos é opcional (NULL permitido). Caso esteja NOT NULL no seu banco, rode:
```sql
alter table public.assets
  alter column warranty_expiry drop not null;
```

### ▶️ Scripts úteis

- Iniciar dev: `npm run dev`
- Build: `npm run build`
- Preview do build: `npm run preview`
- Lint (se configurado): `npm run lint`

### 📦 Deploy

- Build de produção:
```bash
npm run build
```

- Saída em `dist/`. Faça o deploy na sua plataforma (Netlify, Vercel, etc.).
- Para Netlify: o projeto já possui `netlify.toml`. Configure as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no painel da plataforma.

### 🔐 Autenticação

- Autenticação via Supabase (e-mail/senha).
- Rotas protegidas usando React Router + contexto de auth.
- Sessão preservada sem recarregar a página (uso correto de `navigate`).

### 🧭 Navegação

- Sidebar com acesso a Dashboard, Chips e Ativos.
- Navegação 100% via React Router (sem `window.location.href`), evitando logout.

### 👥 Autor

- Junior Ferreira — Desenvolvedor Principal

### 📄 Licença

- MIT — veja `LICENSE`.
