# Roadmap do Fluxo

Este documento define a direção de evolução do **Fluxo** como web app público de fluxogramas.

O roadmap atual substitui a direção antiga de app desktop/local empacotado. O foco agora é validar o produto no navegador, com uso gratuito, experiência simples e possibilidade futura de crescimento em conteúdo, templates, compartilhamento e monetização responsável.

---

## 1. Visão do produto

O Fluxo é um editor web gratuito para criar, organizar, apresentar, importar e exportar fluxogramas diretamente no navegador.

Princípios do produto:

- começar rápido, sem cadastro no MVP;
- manter o editor visual como centro da experiência;
- preservar portabilidade com arquivos `.flow`;
- permitir exportação PNG para apresentação e compartilhamento;
- manter UI limpa e produtiva;
- evoluir com base em uso real;
- evitar complexidade desnecessária antes de validar demanda.

---

## 2. Estado atual do MVP

O MVP já está publicado como web app e possui:

- home pública;
- rotas institucionais;
- editor visual com canvas, grid, snap, minimapa e zoom amplo;
- blocos com formas SVG;
- edição rápida de título, forma e cor;
- linhas, setas e setas bidirecionais;
- handles geométricos nas bordas reais das formas;
- distribuição visual de anchors e corredores;
- blocos tratados como obstáculos sólidos no roteamento automático;
- prevenção de sobreposição entre blocos ao soltar, criar, duplicar ou redimensionar;
- autoexpansão de blocos quando há muitas conexões;
- atalhos contextuais;
- modo apresentação;
- importação/exportação `.flow`;
- exportação PNG;
- persistência local no navegador;
- documentação de deploy e checklist de produção.

---

## 3. O que está fora do escopo imediato

Não implementar agora:

- Electron ou app desktop;
- backend;
- login;
- colaboração em tempo real;
- sincronização em nuvem;
- billing ou planos pagos;
- IA interna no editor;
- Google AdSense dentro do canvas;
- marketplace ou galeria pública complexa.

Esses itens podem ser avaliados depois que o uso do MVP justificar a complexidade.

---

## 4. Fase 0 — Base pública estável

**Status:** concluída para MVP inicial.

Entregas:

- build e lint passando;
- home pública;
- páginas `/exemplos`, `/sobre`, `/privacidade`, `/termos` e `/contato`;
- deploy Vercel funcional;
- README profissional;
- documentação de deploy e produção.

Critério de manutenção:

- toda alteração deve preservar build limpo;
- rotas públicas devem continuar abrindo por link direto;
- editor deve continuar criando, conectando, importando e exportando.

---

## 5. Fase 1 — Estabilidade do editor

Objetivo: reduzir regressões no núcleo do produto.

Prioridades:

- criar testes manuais versionados para o editor;
- adicionar testes unitários para funções puras em `src/lib/flow`;
- validar import/export com arquivos reais;
- monitorar performance em fluxos grandes;
- revisar exportação PNG em diferentes navegadores;
- melhorar mensagens de erro de importação;
- documentar limitações de roteamento manual.

Critério de saída:

- alterações em canvas, schema ou roteamento têm checklist específico;
- pelo menos funções críticas de normalização, serialização, layout e geometria possuem testes.

---

## 6. Fase 2 — Templates e exemplos públicos

Objetivo: tornar o site mais útil e mais compreensível para novos usuários.

Prioridades:

- criar exemplos reais de fluxos;
- permitir abrir templates no editor;
- adicionar exemplos de onboarding, vendas, atendimento, estudo e automação;
- criar textos explicativos curtos para cada template;
- evoluir `/exemplos` de página estática para biblioteca simples de modelos.

Critério de saída:

- usuário consegue abrir um template e começar a editar em poucos cliques;
- exemplos ajudam na adoção sem exigir tutorial longo.

---

## 7. Fase 3 — Conteúdo, SEO e aquisição orgânica

Objetivo: gerar descoberta orgânica com páginas úteis.

Prioridades:

- criar tutoriais públicos sobre fluxogramas;
- criar páginas explicando casos de uso;
- criar conteúdo sobre processos, onboarding, automações e planejamento visual;
- publicar sitemap quando domínio/URL definitiva estiver estável;
- revisar metadados Open Graph e descriptions por página;
- monitorar Core Web Vitals e performance.

Critério de saída:

- site tem conteúdo próprio suficiente além do editor;
- páginas públicas têm valor mesmo para quem ainda não abriu o canvas.

---

## 8. Fase 4 — Persistência local mais robusta

Objetivo: reduzir risco de perda de dados locais.

Prioridades:

- avaliar migração de `localStorage` para IndexedDB;
- criar rotina de backup/exportação mais visível;
- melhorar recuperação de projetos locais;
- adicionar aviso educativo sobre armazenamento local;
- manter `.flow` como formato portátil principal.

Critério de saída:

- usuário entende onde seus dados ficam;
- risco de perda acidental é reduzido;
- import/export continuam simples.

---

## 9. Fase 5 — Compartilhamento futuro

Objetivo: avaliar compartilhamento sem transformar o MVP em produto pesado cedo demais.

Possíveis caminhos:

- exportar imagem com link do app;
- gerar fluxo compactado em URL, se viável;
- criar backend simples para links públicos;
- permitir duplicar templates públicos;
- adicionar contas apenas se houver demanda real.

Critério de entrada:

- usuários pedem compartilhamento com frequência;
- o modelo local-first começa a limitar adoção.

---

## 10. Fase 6 — Monetização responsável

Objetivo: avaliar monetização sem prejudicar o editor.

Possibilidades futuras:

- AdSense em páginas públicas de conteúdo;
- patrocínio discreto em páginas de exemplos;
- plano pago para nuvem, se backend existir;
- templates premium, se houver demanda;
- serviços associados, como criação de fluxos ou consultoria.

Regras:

- não colocar anúncios dentro do canvas/editor nesta fase;
- não posicionar anúncios próximos de botões críticos;
- não incentivar clique;
- validar políticas oficiais atualizadas antes de integrar AdSense;
- revisar privacidade, cookies e consentimento.

---

## 11. Fase 7 — Refatoração técnica gradual

Objetivo: manter o código sustentável sem parar o produto.

Prioridades:

- reduzir responsabilidade de `FlowEditor.tsx` com extrações incrementais;
- consolidar hooks de editor;
- documentar contratos entre React Flow e schema `.flow`;
- separar melhor app/editor e site público;
- revisar bundle e dependências;
- melhorar testes de regressão visual;
- evitar reescritas grandes sem necessidade.

Critério de saída:

- novas features entram em módulos menores;
- riscos de regressão no editor diminuem.

---

## 12. Critérios para qualquer nova branch

Antes de abrir uma branch:

- definir objetivo único;
- definir arquivos prováveis;
- definir o que está fora do escopo;
- evitar mudanças grandes e difusas.

Antes de mergear:

```bash
npm run format
npm run lint
npm run build
git diff --check
```

Também validar manualmente:

- editor abre;
- cria bloco;
- cria seta;
- exporta `.flow`;
- importa `.flow`;
- exporta PNG;
- rotas públicas abrem;
- não há alterações locais pendentes.

---

## 13. Próximas missões recomendadas

1. Criar templates reais em `/exemplos`.
2. Adicionar testes unitários para `src/lib/flow`.
3. Revisar export PNG em fluxos grandes.
4. Criar tutorial público: "Como criar um fluxograma no Fluxo".
5. Adicionar `sitemap.xml` quando a URL pública estiver estabilizada.
6. Avaliar IndexedDB para persistência local.
7. Revisar acessibilidade do editor.
8. Melhorar performance em fluxos muito grandes.

---

## 14. Nota histórica

O projeto começou como uma base visual gerada e validada em ciclos curtos. A direção inicial considerava um app desktop/local-first, mas a estratégia atual prioriza web app público, deploy simples e validação com usuários reais.

Documentos antigos devem ser interpretados como histórico quando divergirem deste roadmap.