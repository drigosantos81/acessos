export interface Acesso {
    ticket?: string | null;

    nome: string;
    doc_nacional: "CPF" | "PASSAPORTE" | "RG";
    numero_doc: string;

    empresa?: string | null;
    data_do_acesso: string;
    qtd_dias: number;
    visita_a: string;

    com_veiculo: boolean;
    placa?: string | null;
    tipo_veiculo?: string | null;

    justificativa: string;
    portoes: string;
    autorizado?: string | null;

    empresa_id?: number | null;
    centro_custo_id?: number | null;

    data_solicitacao: string;
    data_encerramento?: string | null;
    updated_at: string;

    data_limite?: string | null;

    telefone?: string | null;
    tel_interno?: string | null;

    user_id?: number | null;
}