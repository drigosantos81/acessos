import db from "../../config/db.js";
export default {
    // Retorna a lista dos acessos solicitados
    all() {
        try {
            return db.query(`
                SELECT * FROM ACESSO
                ORDER BY data_do_acesso ASC
                `);
        }
        catch (error) {
            console.log(error);
        }
    },
    // Comando POST para novo cadastro de solicitação de acesso
    post(data) {
        try {
            const query = `
                INSERT INTO acesso (
                    ticket, nome, doc_nacional, numero_doc, empresa, data_do_acesso, qtd_dias, visita_a,
                    com_veiculo, placa, tipo_veiculo, justificativa, portoes, autorizado, empresa_id,
                    centro_custo_id, data_solicitacao, data_encerramento, updated_at,
                    telefone, tel_interno
                ) 
                VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
                )
                RETURNING id
            `;
            const value = [
                data.ticket,
                data.nome,
                data.doc_nacional,
                data.numero_doc,
                data.empresa,
                data.data_do_acesso,
                data.qtd_dias,
                data.visita_a,
                data.com_veiculo,
                data.placa,
                data.tipo_veiculo,
                data.justificativa,
                data.portoes,
                data.autorizado,
                data.empresa_id,
                data.centro_custo_id,
                data.data_solicitacao,
                data.data_encerramento,
                data.updated_at,
                data.telefone,
                data.tel_interno,
            ];
            // AQUI ESTÁ A CORREÇÃO
            return db
                .query(query, value)
                .then(result => result.rows[0].id);
        }
        catch (error) {
            console.log('Erro no model Acessos.post:', error);
        }
    }
};
//# sourceMappingURL=Acessos.js.map