# Contexto Técnico do Projeto (Gemini Pro)

**Visão Geral:** Sistema de gestão interna cobrindo domínios de Acessos, Avarias e Pagamentos.
**Stack Principal:** Node.js, Express, TypeScript.
**Banco de Dados:** SQLite local (planejado para migração futura para PostgreSQL ou Oracle).
**Arquitetura:** Monolito Modular (inspirado em MVC).
**Frontend:** Renderização de páginas HTML (Server-Side Rendering) servidas a partir de `/src/app/*/pages`.

**Diretrizes de Evolução Tecnológica:**
- **Módulos:** Manter o isolamento estrito das pastas em `src/app/` (acessos, avarias, pagamentos, shared).
- **Persistência:** O banco de dados atualmente utiliza scripts SQL manuais em `src/config/Files_Logs/`. O plano de evolução prevê a adoção de um ORM/Query Builder e controle de *migrations*.
- **Rotas e Middlewares:** Rotas devem permanecer centralizadas em `src/routes/`, e a segurança das sessões garantida pelos middlewares em `src/app/shared/middlewares/`.