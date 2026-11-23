# Diretrizes de Operação para Agentes de IA

Este projeto utiliza desenvolvimento assistido por IA. Agentes autônomos ou conversacionais (como o Gemini) devem aderir estritamente às seguintes regras operacionais:

1. **Restrição de Modificação:** Não realizar reescritas, refatorações amplas ou mudanças arquiteturais sem aprovação prévia explícita. O foco é evolução incremental.
2. **Segurança de Credenciais:** É terminantemente proibido ler, processar, exibir ou tentar modificar arquivos `.env`, chaves de API, senhas ou tokens.
3. **Critérios de Conclusão:** O código gerado não é considerado final até passar por validação de tipagem do TypeScript, linting e testes.
4. **Banco de Dados:** Nenhuma operação de deleção (`DROP`, `DELETE` em massa) ou execução de migrations deve ser feita sem autorização.
5. **Integrações:** O sistema prepara-se para integração com SAP S/4HANA. Manter os módulos de negócio altamente desacoplados.