export interface PagamentosTable {
    ticket?: number;
    user_id: number;
    empresa?: string;
    setor?: string;
    tipo_documento: string;
    contato_interno?: string;
    contato_fornecedor?: string;
    telefone_fornecedor?: string;
    pedido_compra: string;
    numero_nota_fatura: string;
    cnpj_nota: string;
    razao_social: string;
    mes_prestacao_servico?: string;
    data_emissao_nota: string;
    data_vencimento: string;
    valor?: number;
    servico_material_entregue: string;
    tipo_pagamento?: string;
    status?: string;
    anexo_nota_fatura?: string | null;
    anexo_boleto?: string | null;
    data_abertura?: string;
    updated_at?: string;
    data_atendimento?: string;
    data_encerramento?: string;
}