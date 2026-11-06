import db from '../../../config/db.js';
import { PagamentosTable } from '../interfaces/PagamentosTable.js';

class Pagamentos {
    async create(data: PagamentosTable) {
        const now = new Date();
        const dataHoraCriacao = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 19).replace('T', ' ');

        const query = `
            INSERT INTO pagamentos (
                user_id, setor, tipo_documento, contato_interno,
                pedido_compra, numero_nota_fatura, cnpj_nota, razao_social,
                mes_prestacao_servico, data_emissao_nota, data_vencimento,
                valor, servico_material_entregue, tipo_pagamento, status, 
                data_abertura, updated_at, anexo_nota_fatura, anexo_boleto
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const values = [
            data.user_id, data.setor, data.tipo_documento, data.contato_interno,
            data.pedido_compra, data.numero_nota_fatura, data.cnpj_nota, data.razao_social,
            data.mes_prestacao_servico, data.data_emissao_nota, data.data_vencimento,
            data.valor, data.servico_material_entregue, data.tipo_pagamento, data.status,
            dataHoraCriacao, dataHoraCriacao, data.anexo_nota_fatura || null, data.anexo_boleto || null
        ];

        return await db.query(query, values);
    }
}
export default new Pagamentos();