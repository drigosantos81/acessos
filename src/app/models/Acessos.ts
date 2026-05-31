import db from "../../config/db.js";
import { Acesso } from "../interfaces/AcessosTable.js";

export default {
    // Retorna a lista dos acessos solicitados
    all() {
        try {
            return db.query(`
                SELECT
                    nome, empresa, MIN(data_do_acesso) AS data_do_acesso, data_limite, qtd_dias,
                    com_veiculo, justificativa, autorizado
                FROM 
                    ACESSO
                WHERE 
                    data_do_acesso >= DATE('now')
                GROUP BY 
                    ticket
                ORDER BY 
                    CASE autorizado 
                        WHEN 'SOLICITADO' THEN 1 
                        WHEN 'PENDENTE' THEN 2 
                        ELSE 3 
                    END ASC,
                    data_do_acesso ASC;
                `);
        } catch (error) {
            console.log(error);
        }
    },

    findByUser(userId: number) {
        try {
            return db.query(`
                SELECT
                    nome, empresa, MIN(data_do_acesso) AS data_do_acesso, data_limite, qtd_dias,
                    com_veiculo, justificativa, autorizado
                FROM 
                    ACESSO
                WHERE
                    user_id = ? AND
                    data_do_acesso >= DATE('now')
                GROUP BY 
                    ticket
                ORDER BY 
                    CASE autorizado 
                        WHEN 'SOLICITADO' THEN 1 
                        WHEN 'PENDENTE' THEN 2 
                        ELSE 3 
                    END ASC,
                    data_do_acesso ASC;
                `, [userId]);
        } catch (error) {
            console.log(error);
        }
    },

    // 1. Consulta Principal da Tela: Ordenação padrão por Autorizado (Pesos), Data e Ticket
    async editAll(termoFiltro?: string) {
        try {
            // Regra padrão: Apenas do dia atual em diante
            let whereClause = "WHERE data_do_acesso >= DATE('now')";
            let values: any[] = [];

            // Se o usuário clicou ou buscou algo, ignora a data e traz o histórico ordenado pelo padrão da tela
            if (termoFiltro) {
                const termoLimpo = termoFiltro.replace(/\D/g, ''); // Limpa pontos/traços se for CPF
                whereClause = "WHERE nome LIKE ? OR numero_doc LIKE ? OR ticket LIKE ?";
                values.push(`%${termoFiltro}%`, `%${termoLimpo || termoFiltro}%`, `%${termoFiltro}%`);
            }

            const query = `
                SELECT
                    ticket, nome, numero_doc, doc_nacional, empresa,
                    MIN(data_do_acesso) AS data_do_acesso, com_veiculo,
                    qtd_dias, data_limite, justificativa, autorizado,
                    data_solicitacao, telefone, tel_interno
                FROM ACESSO
                ${whereClause}
                GROUP BY ticket
                ORDER BY 
                    CASE autorizado 
                        WHEN 'SOLICITADO' THEN 1 
                        WHEN 'PENDENTE' THEN 2 
                        ELSE 3 
                    END ASC,
                    data_do_acesso ASC, 
                    ticket ASC; -- Ordem padrão da sua tela mantida intacta
            `;
            return await db.query(query, values);
        } catch (error) {
            console.log("Erro no editAll:", error);
        }
    },

    // 2. Consulta do Autocomplete: Ordenação por Ordem Alfabética do Nome e depois Ticket
    async searchGlobal(termo: string) {
        try {
            const termoLimpo = termo.replace(/\D/g, '');
            const query = `
                SELECT ticket, nome, numero_doc, doc_nacional, MIN(data_do_acesso) AS data_do_acesso 
                FROM ACESSO 
                WHERE nome LIKE ? OR numero_doc LIKE ? OR ticket LIKE ?
                GROUP BY ticket 
                ORDER BY 
                    nome ASC, 
                    ticket ASC -- Ordenação alfabética exclusiva da lista flutuante
                LIMIT 8;
            `;
            return await db.query(query, [`%${termo}%`, `%${termoLimpo || termo}%`, `%${termo}%`]);
        } catch (error) {
            console.log("Erro no searchGlobal:", error);
        }
    },

    // Adicione dentro do seu Model
    async updateMassivo(tickets: string[], status: string) {
        try {
            const now = new Date().toISOString().slice(0, 10);

            // Cria a quantidade certa de interrogações (?,?,?) baseada na quantidade de tickets selecionados
            const placeholders = tickets.map(() => '?').join(',');

            const query = `
            UPDATE acesso 
            SET 
                autorizado = ?,
                updated_at = ?,
                data_encerramento = COALESCE(data_encerramento, ?)
            WHERE ticket IN (${placeholders})
        `;

            // O array values junta os dados da alteração com a lista de tickets
            const values = [status, now, now, ...tickets];

            return await db.query(query, values);
        } catch (error) {
            console.log('Erro no model Acessos.updateMassivo:', error);
            throw error;
        }
    },

    async getNextTicket() {
        try {
            // O bloqueio agora procura exatamente pela letra 'M-'
            const query = `
                SELECT MAX(CAST(ticket AS INTEGER)) as max_ticket 
                FROM acesso 
                WHERE ticket NOT LIKE 'M-%'
            `;

            const results = await db.query(query);
            const maxTicket = results?.rows[0]?.max_ticket || 0;

            return Number(maxTicket) + 1;
        } catch (error) {
            console.error("Erro no getNextTicket:", error);
            return 1;
        }
    },

    // Busca no banco QUAIS datas específicas já estão cadastradas para um documento
    async getExistingDates(numero_doc: string, datasSolicitadas: string[]) {
        try {
            if (datasSolicitadas.length === 0) return [];

            // Cria as interrogações de forma dinâmica (ex: ?, ?, ?)
            const placeholders = datasSolicitadas.map(() => '?').join(',');

            const query = `
                SELECT data_do_acesso 
                FROM acesso 
                WHERE numero_doc = ? AND data_do_acesso IN (${placeholders})
            `;

            // Junta o CPF com a lista de datas
            const values = [numero_doc, ...datasSolicitadas];
            const results = await db.query(query, values);

            // Retorna um array só com as datas encontradas (ex: ['2026-06-04'])
            return results?.rows.map((row: any) => row.data_do_acesso) || [];
        } catch (error) {
            console.error("Erro no getExistingDates:", error);
            return [];
        }
    },
    // async getNextTicket(): Promise<number> {
    //     try {
    //         const query = `SELECT MAX(CAST(ticket AS INTEGER)) as max_ticket FROM acesso`;
    //         const result = await db.query(query);

    //         // Se o banco estiver vazio, o MAX retorna nulo, então começamos com o ticket 1
    //         const maxTicket = result.rows[0].max_ticket;
    //         return maxTicket ? maxTicket + 1 : 1;
    //     } catch (error) {
    //         console.log('Erro ao buscar próximo ticket:', error);
    //         // Em caso de erro grave, tentamos gerar um ticket baseado no timestamp 
    //         // para não travar o sistema ou duplicar com um antigo
    //         return Date.now();
    //     }
    // },

    // Comando POST para novo cadastro de solicitação de acesso
    post(data: Acesso, userId: number) {
        try {
            const query = `
                INSERT INTO acesso (
                    ticket, nome, doc_nacional, numero_doc, empresa, data_do_acesso, qtd_dias, visita_a,
                    com_veiculo, placa, tipo_veiculo, justificativa, portoes, autorizado, empresa_id,
                    centro_custo_id, data_solicitacao, data_encerramento, updated_at,
                    telefone, tel_interno, data_limite, user_id
                ) 
                VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
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
                data.data_limite,
                userId
            ];

            // AQUI ESTÁ A CORREÇÃO
            return db
                .query(query, value)
                .then(result => result.rows[0].id);

        } catch (error) {
            console.log('Erro no model Acessos.post:', error);
        }
    }
}