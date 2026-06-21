# Fluxo

Editor web gratuito de fluxogramas, construído com React, TypeScript, TanStack Start, Vite e `@xyflow/react`.

O MVP permite criar e organizar blocos e conexões, importar e exportar arquivos `.flow`, gerar PNG e apresentar fluxos diretamente no navegador. Os projetos são armazenados localmente, sem cadastro ou backend.

## Requisitos

- Node.js 20 ou superior
- npm 10 ou superior

## Desenvolvimento

```bash
npm install
npm run dev
```

Validações principais:

```bash
npm run format
npm run lint
npm run build
npm run preview
```

## Rotas

- `/`: home pública e biblioteca local
- `/editor`: cria um fluxo e abre o editor
- `/editor/:id`: editor de um projeto local
- `/exemplos`: ideias de uso e templates futuros
- `/sobre`: visão do produto
- `/privacidade`: política de privacidade do MVP
- `/termos`: termos de uso
- `/contato`: canais de feedback

## Persistência

O MVP usa `localStorage`. Não há conta, sincronização em nuvem ou recuperação remota. Para manter cópias portáteis, exporte projetos no formato `.flow`.

## Produção

Consulte [docs/DEPLOY.md](docs/DEPLOY.md) e [docs/PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md).

O projeto ainda não integra Google AdSense, analytics, login ou backend.
