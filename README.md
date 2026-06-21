# Fluxo

**Fluxo** é um editor web gratuito de fluxogramas para criar, conectar, organizar, apresentar e exportar processos diretamente no navegador.

O projeto nasceu como uma ferramenta visual simples para estruturar fluxos de produto, onboarding, automações, processos comerciais, estudos, jornadas de usuário e ideias complexas sem depender de softwares pesados ou de cadastro obrigatório.

[![App em produção](https://img.shields.io/badge/app-em%20produção-f97316?style=for-the-badge)](https://fluxo-nine-theta.vercel.app/)
[![React](https://img.shields.io/badge/React-19-20232a?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/deploy-Vercel-000?style=for-the-badge&logo=vercel)](https://vercel.com/)

> Acesse: **https://fluxo-nine-theta.vercel.app/**

---

## Visão geral

O Fluxo é um web app focado em edição visual de fluxogramas com uma experiência limpa, rápida e prática. O MVP roda no navegador, usa armazenamento local e permite que o usuário mantenha seus fluxos de forma portátil por meio de arquivos `.flow`.

A proposta do produto é ser simples o suficiente para começar em segundos, mas robusto o bastante para representar fluxos reais com blocos, formas, setas, conexões bidirecionais, atalhos, modo apresentação e exportação.

---

## Principais funcionalidades

### Editor visual

- Canvas com grid, snap, zoom amplo e minimapa.
- Criação de blocos, formas, linhas e setas.
- Formas SVG: retângulo, retângulo arredondado, círculo, losango, hexágono e cilindro.
- Edição rápida de título, forma e cor.
- Redimensionamento e movimentação de blocos.
- Modo compacto e ajuste de visualização.

### Conexões e roteamento

- Setas normais e bidirecionais.
- Conversão rápida entre linha e seta.
- Handles geométricos que acompanham a borda real das formas.
- Distribuição visual de pontos de entrada e saída.
- Corredores separados para múltiplas conexões.
- Desvio de blocos como obstáculos sólidos.
- Prevenção de sobreposição entre blocos ao soltar, criar ou duplicar.
- Autoexpansão de blocos quando a quantidade de conexões exige mais espaço visual.

### Produtividade

- Atalhos contextuais para forma, cor, linha, seta, seleção, grid, snap, organizar, exportar e importar.
- Undo/redo.
- Duplicação de blocos.
- Organização automática do fluxo.
- Modo apresentação.

### Portabilidade

- Exportação e importação de arquivos `.flow`.
- Exportação do canvas como PNG.
- Projetos salvos localmente no navegador durante o MVP.
- Sem login, backend ou cadastro obrigatório nesta fase.

---

## Rotas públicas

| Rota | Descrição |
| --- | --- |
| `/` | Home pública e biblioteca local de fluxos. |
| `/editor` | Cria um novo fluxo e abre o editor. |
| `/editor/:id` | Editor de um fluxo local. |
| `/exemplos` | Sugestões de uso e modelos futuros. |
| `/sobre` | Visão geral do produto. |
| `/privacidade` | Política de privacidade do MVP. |
| `/termos` | Termos de uso. |
| `/contato` | Canal de contato e feedback. |

---

## Jornada de desenvolvimento

O Fluxo evoluiu em ciclos curtos de validação visual, sempre partindo de testes manuais no navegador e ajustes incrementais no editor.

### 1. Fundação do editor

A primeira etapa consolidou o editor de fluxos com blocos, setas, importação/exportação `.flow`, exportação PNG, modo apresentação, biblioteca local e toolbar de ferramentas.

### 2. Qualidade visual dos blocos

Depois, o foco foi melhorar a representação visual das formas. As formas complexas deixaram de depender de CSS simples e passaram a usar renderização SVG, permitindo bordas completas, losango proporcional, hexágono correto e melhor consistência visual.

### 3. Handles geométricos

Os pontos de conexão passaram a considerar a geometria real da forma. Isso evita que setas pareçam presas a um retângulo invisível e permite que conexões encostem melhor em círculos, losangos, hexágonos e cilindros.

### 4. Setas, corredores e direção

A camada de edges recebeu suporte a setas bidirecionais, separação de múltiplas conexões e corredores exclusivos para evitar linhas sobrepostas entre o mesmo par de blocos.

### 5. Física do canvas

O editor passou a tratar blocos como obstáculos sólidos. As setas recalculam rotas para evitar blocos, e os blocos não devem permanecer sobrepostos depois de drag, criação, duplicação ou resize.

### 6. Performance

Como o roteamento visual ficou mais sofisticado, foi necessária uma etapa de otimização para manter drag, clique e interação responsivos. O editor prioriza fluidez durante interações e recalcula rotas completas em momentos adequados.

### 7. Atalhos contextuais

A experiência foi refinada com atalhos úteis e contextuais. Por exemplo, com um bloco selecionado, `F` alterna formas e `K` alterna cores. Com uma linha ou seta selecionada, `L` transforma em linha e `A` transforma em seta.

### 8. Publicação como web app

Por fim, o projeto foi preparado como app público com home, páginas institucionais, SEO básico, documentação de deploy, checklist de produção e publicação na Vercel.

---

## Stack técnica

- **React 19**
- **TypeScript**
- **Vite 8**
- **TanStack Start / TanStack Router**
- **@xyflow/react**
- **Radix UI**
- **Tailwind CSS**
- **Nitro**
- **Vercel**

---

## Estrutura do projeto

```txt
src/
  components/
    flow/        # Editor, nodes, edges, toolbar e componentes do canvas
    site/        # Componentes das páginas públicas
    ui/          # Componentes base de interface
  hooks/         # Hooks do editor, incluindo atalhos
  lib/
    flow/        # Schema, normalização, layout, roteamento e geometria
    siteMeta.ts  # Metadados públicos/SEO
  routes/        # Rotas TanStack Start

docs/
  DEPLOY.md
  PRODUCTION_CHECKLIST.md
  audits/
  planning/

public/
  favicon.svg
  robots.txt
```

---

## Atalhos principais

| Atalho | Ação |
| --- | --- |
| `V` | Selecionar/mover. |
| `B` | Criar bloco. |
| `F` | Ativar forma ou alternar forma do bloco selecionado. |
| `K` | Alternar cor do bloco, linha ou seta selecionada. |
| `L` | Ativar linha ou converter seta selecionada em linha. |
| `A` | Ativar seta ou converter linha selecionada em seta. |
| `C` | Conectar. |
| `G` | Ligar/desligar grid. |
| `S` | Ligar/desligar snap. |
| `Alt + L` | Organizar fluxo. |
| `Ctrl + Z` | Desfazer. |
| `Ctrl + Y` / `Ctrl + Shift + Z` | Refazer. |
| `Ctrl + 0` | Ajustar à tela. |
| `Shift + P` | Modo apresentação. |
| `Alt + E` | Exportar `.flow`. |
| `Alt + P` | Exportar PNG. |
| `Alt + O` | Importar `.flow`. |

Os atalhos são bloqueados enquanto o usuário digita em campos de texto, modais, inputs ou áreas editáveis.

---

## Como rodar localmente

### Requisitos

- Node.js 20 ou superior
- npm 10 ou superior

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm run dev
```

### Validações

```bash
npm run format
npm run lint
npm run build
npm run preview
```

---

## Deploy

O projeto já está preparado para deploy em provedores como Vercel, Netlify ou ambiente Node compatível com Nitro.

Documentação detalhada:

- [docs/DEPLOY.md](docs/DEPLOY.md)
- [docs/PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md)

Variável recomendada para produção:

```env
VITE_SITE_URL=https://seu-dominio-ou-url.vercel.app
```

---

## Persistência e privacidade

No MVP, os fluxos são armazenados localmente no navegador do usuário. Não há conta, login, backend, sincronização em nuvem ou recuperação remota.

Para manter cópias portáteis, o usuário deve exportar seus projetos no formato `.flow`.

---

## Estado atual do MVP

O Fluxo está publicado como web app gratuito e funcional.

Ainda não há:

- login;
- backend;
- colaboração em tempo real;
- sincronização em nuvem;
- analytics;
- Google AdSense;
- IA interna no editor.

Esses pontos podem ser avaliados em fases futuras, sem comprometer a simplicidade do MVP.

---

## Roadmap sugerido

- Melhorar templates e exemplos prontos.
- Criar tutoriais públicos para SEO.
- Adicionar compartilhamento por link no futuro.
- Avaliar backend opcional para salvar fluxos na nuvem.
- Criar galeria pública de modelos.
- Avaliar Google AdSense apenas depois de consolidar conteúdo público, privacidade e experiência de navegação.

---

## Licença

Ainda não há uma licença pública definida para o projeto. Antes de uso comercial, distribuição ou contribuição externa, defina uma licença no repositório.

---

## Autor

Desenvolvido por **Álvaro Amorim**.

- App: https://fluxo-nine-theta.vercel.app/
- GitHub: https://github.com/alvaro-amorim
- Contato: comerc.ias.prod@gmail.com
