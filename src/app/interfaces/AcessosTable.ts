export interface Acesso {
    // Chaves Primárias e Identificadores
    id?: number;
    ticket?: string | null;

    // Dados Pessoais
    nome: string;
    doc_nacional: "CPF" | "PASSAPORTE" | "RG";
    numero_doc: string;

    // Dados da Visita/Empresa
    empresa?: string | null;
    data_do_acesso: string;
    qtd_dias: number;
    visita_a: string;

    // Dados de Veículo (Flexível para aceitar 0/1 do SQLite ou sim/nao do form)
    com_veiculo: boolean | string | number; 
    placa?: string | null;
    tipo_veiculo?: string | null;

    // Dados de CNH (Adicionados com base no HTML)
    cnh?: string | null;
    cat_habilitacao?: string | null;
    data_validade_cnh?: string | null;

    // Justificativa e Local
    justificativa: string;
    portoes?: string; // Mantido como opcional caso não seja sempre obrigatório

    // Status do Pedido
    autorizado?: string | null;

    // Relacionamentos Estruturais
    empresa_id?: number | null;
    centro_custo_id?: number | null;

    // Contatos
    telefone?: string | null;
    tel_interno?: string | null;

    // Relacionamento com Usuários e Rastreamento
    user_id?: number | null;
    user_name?: string | null; // Adicionado: Trazido pelo JOIN na busca individual

    // Datas de Controle
    data_solicitacao?: string; // Pode ser mapeado para o created_at
    data_limite?: string | null;
    data_encerramento?: string | null;
    created_at?: string; // Adicionado: Controle padrão do banco
    updated_at?: string; // Alterado para opcional para não travar na hora de criar um novo
}