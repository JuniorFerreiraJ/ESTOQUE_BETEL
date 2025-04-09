# Sistema de Controle de Estoque - Betel

Sistema de gerenciamento de estoque desenvolvido para controle de itens, departamentos e categorias, com funcionalidades de análise e histórico de movimentações.

## 🚀 Funcionalidades

- **Dashboard**
  - Visão geral do estoque
  - Estatísticas em tempo real
  - Gráficos de distribuição por departamento
  - Alertas de itens com estoque baixo

- **Inventário**
  - Cadastro e edição de itens
  - Filtros por departamento e categoria
  - Busca por nome do item
  - Controle de quantidade mínima

- **Histórico**
  - Registro de todas as movimentações
  - Entradas e saídas de itens
  - Rastreamento por departamento
  - Histórico detalhado com data e responsável

- **Análise**
  - Gráficos e estatísticas
  - Distribuição por departamento
  - Média de movimentações
  - Status do estoque

- **Gerenciamento**
  - Controle de departamentos
  - Gestão de categorias
  - Estatísticas do sistema

## 🛠️ Tecnologias Utilizadas

- React.js
- TypeScript
- Tailwind CSS
- Supabase (Banco de dados e Autenticação)
- Recharts (Gráficos)
- Lucide React (Ícones)

## ⚙️ Requisitos

- Node.js 16+
- npm ou yarn
- Conta no Supabase

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone [url-do-repositorio]
cd estoque-betel
```

2. Instale as dependências:
```bash
npm install
# ou
yarn install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env.local` na raiz do projeto e adicione:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
# ou
yarn dev
```

## 📦 Deploy

Para fazer o deploy da aplicação:

1. Construa o projeto:
```bash
npm run build
# ou
yarn build
```

2. O diretório `dist` será criado com os arquivos otimizados para produção

3. Faça o deploy para sua plataforma preferida (Vercel, Netlify, etc)

## 🗄️ Estrutura do Banco de Dados

O projeto utiliza as seguintes tabelas no Supabase:

- `inventory_items`: Itens do estoque
- `categories`: Categorias dos itens
- `departments`: Departamentos
- `inventory_history`: Histórico de movimentações

## 👥 Autores

- Junior Ferreira - Desenvolvedor Principal

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes. 