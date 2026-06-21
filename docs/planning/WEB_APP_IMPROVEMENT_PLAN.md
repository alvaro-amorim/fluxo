# Plano de evolução do Fluxo como web app público

Este documento consolida a visão de evolução do **Fluxo** após a publicação do MVP web.

Ele substitui planos antigos que tratavam o produto como app desktop ou que listavam como pendentes melhorias visuais já implementadas.

---

## 1. Visão de produto

O Fluxo deve evoluir como um editor web gratuito, visual e rápido para criar fluxogramas diretamente no navegador.

Direção atual:

- editor sem cadastro no MVP;
- persistência local no navegador;
- importação/exportação `.flow`;
- exportação PNG;
- páginas públicas para apresentação, exemplos e conteúdo;
- templates úteis para aquisição orgânica;
- backend, login e nuvem apenas quando houver demanda real.

---

## 2. Estado atual

O MVP já possui:

- home pública;
- editor visual;
- páginas `/exemplos`, `/sobre`, `/privacidade`, `/termos` e `/contato`;
- deploy em Vercel;
- SEO básico;
- formas SVG;
- handles geométricos;
- setas normais e bidirecionais;
- linhas e setas com conversão rápida;
- atalhos contextuais;
- roteamento com obstáculos sólidos;
- prevenção de sobreposição entre blocos;
- autoexpansão de blocos;
- import/export `.flow`;
- exportação PNG;
- modo apresentação.

---

## 3. Decisões estratégicas

### Web app antes de desktop

O produto deve continuar priorizando o navegador.

Não priorizar no curto prazo:

- Electron;
- Tauri;
- instalador desktop;
- APIs nativas de sistema;
- modo offline avançado fora do navegador.

### Conteúdo antes de anúncios

AdSense ou monetização por anúncios só deve ser avaliada depois de o site ter conteúdo público suficiente, navegação estável e privacidade revisada.

Não colocar anúncios dentro do canvas/editor nesta fase.

### Simplicidade antes de plataforma

Evitar transformar o Fluxo em uma plataforma complexa antes de validar uso real.

Não adicionar login, backend, colaboração ou IA interna sem necessidade clara.

---

## 4. Próximas prioridades

### Prioridade 1 — Exemplos e templates

Objetivo: ajudar o usuário a entender rapidamente como usar o Fluxo.

Tarefas:

- criar templates reais de fluxos;
- adicionar botão "usar este modelo" em `/exemplos`;
- criar exemplos de onboarding, atendimento, vendas, estudo, automação e produto;
- permitir abrir modelo no editor como novo fluxo;
- manter templates simples e leves.

### Prioridade 2 — Conteúdo público

Objetivo: aumentar valor e descoberta orgânica.

Tarefas:

- criar tutorial "Como criar um fluxograma";
- criar página de casos de uso;
- criar conteúdo sobre processos, onboarding e automações;
- melhorar títulos e descrições por página;
- gerar sitemap quando URL/domínio estiver estável.

### Prioridade 3 — Qualidade e testes

Objetivo: reduzir regressões no editor.

Tarefas:

- criar testes unitários para normalização e serialização;
- testar geometria de shapes;
- testar resolução de colisão entre blocos;
- testar import/export;
- criar checklist visual versionado com fluxos de exemplo.

### Prioridade 4 — Persistência local robusta

Objetivo: reduzir risco de perda de dados.

Tarefas:

- avaliar IndexedDB;
- manter `.flow` como backup principal;
- melhorar mensagens educativas sobre armazenamento local;
- criar exportação em lote, se fizer sentido.

### Prioridade 5 — Acessibilidade e performance

Objetivo: manter o app rápido e inclusivo.

Tarefas:

- revisar labels e `aria-labels`;
- revisar foco de modais;
- validar contraste;
- medir performance em fluxos grandes;
- otimizar renderização se houver gargalos.

---

## 5. Arquitetura recomendada

Manter separação clara entre:

```txt
src/components/flow/   editor, nodes, edges e toolbar
src/components/site/   páginas públicas e layout de marketing
src/hooks/             atalhos e hooks reutilizáveis
src/lib/flow/          schema, normalização, geometria, layout e roteamento
src/lib/export/        exportação PNG e futuras exportações
src/routes/            rotas TanStack Start
```

Recomendações:

- extrair gradualmente responsabilidades de `FlowEditor.tsx`;
- evitar lógica de site público dentro do editor;
- manter metadados temporários fora do schema `.flow`;
- preferir funções puras em `src/lib/flow` para facilitar testes;
- documentar qualquer mudança de schema antes de implementar.

---

## 6. Plano técnico para o editor

Melhorias futuras, em ordem sugerida:

1. testes de domínio para `src/lib/flow`;
2. revisão de export PNG em fluxos grandes;
3. melhoria de mensagens de erro de importação;
4. opção de abrir templates como novo fluxo;
5. revisão de acessibilidade da toolbar e modais;
6. medição de performance em fluxos com 100+ blocos;
7. avaliação de IndexedDB;
8. documentação de rotas manuais que cruzam blocos;
9. melhoria de onboarding dentro do editor;
10. possível modo leitura/foco mais robusto.

---

## 7. Plano para SEO e AdSense futuro

Antes de qualquer AdSense:

- criar conteúdo público útil;
- revisar políticas oficiais atualizadas;
- revisar privacidade/cookies;
- definir analytics e retenção de dados;
- garantir que o editor continue limpo;
- não colocar anúncios em áreas de ação crítica.

Locais possíveis no futuro:

- home;
- páginas de exemplos;
- tutoriais;
- páginas de conteúdo.

Locais proibidos nesta fase:

- canvas/editor;
- perto de botões de exportar/importar;
- perto de comandos principais;
- em elementos que pareçam controles do app.

---

## 8. Roadmap resumido

| Fase | Foco | Status |
| --- | --- | --- |
| 0 | Editor funcional e schema `.flow` | Concluído no MVP |
| 1 | Qualidade visual, formas e roteamento | Concluído no MVP |
| 2 | Web app público e deploy | Concluído no MVP |
| 3 | Templates e exemplos reais | Próximo passo |
| 4 | Conteúdo público e SEO | Próximo passo |
| 5 | Testes e qualidade técnica | Próximo passo |
| 6 | Persistência local robusta | Futuro |
| 7 | Backend/compartilhamento | Futuro opcional |
| 8 | Monetização | Futuro, após validação |

---

## 9. O que não fazer agora

- Não adicionar Electron.
- Não adicionar backend obrigatório.
- Não adicionar login obrigatório.
- Não integrar IA interna no editor.
- Não inserir AdSense no canvas.
- Não refatorar o editor inteiro em uma única branch.
- Não alterar o schema `.flow` sem migração.
- Não remover import/export local.

---

## 10. Próxima missão recomendada

A próxima missão de produto mais útil é:

```txt
Criar templates reais e permitir abrir um exemplo como novo fluxo.
```

Essa missão melhora onboarding, demonstra valor do app e prepara terreno para conteúdo público/SEO.