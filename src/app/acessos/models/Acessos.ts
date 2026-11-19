import db from "../../../config/db.js";
import { Acesso } from "../interfaces/AcessosTable.js";

export default {

    // ==========================================
    // FUNÇÃO: ALL (Usada por Admins em consultas legadas)
    // ==========================================
    all() {
        try {
            return db.query(`
                SELECT ticket, nome, empresa, MIN(data_do_acesso) AS data_do_acesso, data_limite, qtd_dias, com_veiculo, justificativa, autorizado
                FROM acesso
                WHERE data_do_acesso >= DATE('now')
                GROUP BY ticket
                ORDER BY data_do_acesso ASC;
            `);
        } catch (error) {
            console.log(error);
        }
    },

    // ==========================================
    // FUNÇÃO: FIND BY USER
    // ==========================================
    findByUser(userId: number) {
        try {
            return db.query(`
                SELECT ticket, nome, empresa, MIN(data_do_acesso) AS data_do_acesso, data_limite, qtd_dias, com_veiculo, justificativa, autorizado
                FROM acesso
                WHERE user_id = ? AND data_do_acesso >= DATE('now')
                GROUP BY ticket
                ORDER BY data_do_acesso ASC;
            `, [userId]);
        } catch (error) {
            console.log(error);
        }
    },

    // ==========================================
    // FUNÇÃO: EDIT ALL (Pesquisa Massiva)
    // ==========================================
    async editAll(termoFiltro?: string) {
        try {
            let whereClause = "WHERE data_do_acesso >= DATE('now')";
            let values: any[] = [];

            if (termoFiltro) {
                const termoLimpo = termoFiltro.replace(/\D/g, '');
                whereClause = "WHERE nome LIKE ? OR numero_doc LIKE ? OR ticket LIKE ?";
                values.push(`%${termoFiltro}%`, `%${termoLimpo || termoFiltro}%`, `%${termoFiltro}%`);
            }

            const query = `
                SELECT ticket, nome, numero_doc, doc_nacional, empresa, MIN(data_do_acesso) AS data_do_acesso, com_veiculo, qtd_dias, data_limite, justificativa, autorizado, data_solicitacao, telefone, tel_interno
                FROM ACESSO
                ${whereClause}
                GROUP BY ticket
                ORDER BY data_do_acesso ASC;
            `;
            return await db.query(query, values);
        } catch (error) {
            console.log("Erro no editAll:", error);
        }
    },

    // ==========================================
    // FUNÇÃO: SEARCH GLOBAL (Autocomplete)
    // ==========================================
    async searchGlobal(termo: string) {
        try {
            const termoLimpo = termo.replace(/\D/g, '');
            const query = `
                SELECT ticket, nome, numero_doc, doc_nacional, MIN(data_do_acesso) AS data_do_acesso 
                FROM ACESSO 
                WHERE nome LIKE ? OR numero_doc LIKE ? OR ticket LIKE ?
                GROUP BY ticket 
                ORDER BY nome ASC, ticket ASC
                LIMIT 8;
            `;
            return await db.query(query, [`%${termo}%`, `%${termoLimpo || termo}%`, `%${termo}%`]);
        } catch (error) {
            console.log("Erro no searchGlobal:", error);
        }
    },

    // ==========================================
    // FUNÇÃO: UPDATE MASSIVO
    // ==========================================
    async updateMassivo(tickets: string[], status: string) {
        try {
            const now = new Date().toISOString().slice(0, 10);
            const placeholders = tickets.map(() => '?').join(',');

            const query = `
            UPDATE acesso 
            SET autorizado = ?, updated_at = ?, data_encerramento = COALESCE(data_encerramento, ?)
            WHERE ticket IN (${placeholders})
        `;
            const values = [status, now, now, ...tickets];
            return await db.query(query, values);
        } catch (error) {
            console.log('Erro no model Acessos.updateMassivo:', error);
            throw error;
        }
    },

    // ==========================================
    // FUNÇÃO: GET NEXT TICKET
    // ==========================================
    async getNextTicket() {
        try {
            const query = `SELECT MAX(CAST(ticket AS INTEGER)) as max_ticket FROM acesso WHERE ticket NOT LIKE 'M-%'`;
            const results = await db.query(query);
            const maxTicket = results?.rows[0]?.max_ticket || 0;
            return Number(maxTicket) + 1;
        } catch (error) {
            console.error("Erro no getNextTicket:", error);
            return 1;
        }
    },

    // ==========================================
    // FUNÇÃO: GET EXISTING DATES
    // ==========================================
    async getExistingDates(numero_doc: string, datasSolicitadas: string[]) {
        try {
            if (datasSolicitadas.length === 0) return [];
            const placeholders = datasSolicitadas.map(() => '?').join(',');
            const query = `SELECT data_do_acesso FROM acesso WHERE numero_doc = ? AND data_do_acesso IN (${placeholders})`;
            const values = [numero_doc, ...datasSolicitadas];
            const results = await db.query(query, values);
            return results?.rows.map((row: any) => row.data_do_acesso) || [];
        } catch (error) {
            console.error("Erro no getExistingDates:", error);
            return [];
        }
    },

    // ==========================================
    // FUNÇÃO: POST (Criar Solicitação)
    // ==========================================
    post(data: any, userId: number) {
        try {
            const query = `
                INSERT INTO acesso (
                    ticket, nome, doc_nacional, numero_doc, empresa, data_do_acesso, qtd_dias, visita_a,
                    com_veiculo, placa, tipo_veiculo, cnh, cat_habilitacao, data_validade_cnh, 
                    justificativa, portoes, autorizado, empresa_id, centro_custo_id, data_solicitacao, 
                    data_encerramento, updated_at, telefone, tel_interno, data_limite, user_id
                ) 
                VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
                ) RETURNING id
            `;
            const value = [
                data.ticket, data.nome, data.doc_nacional, data.numero_doc, data.empresa, data.data_do_acesso,
                data.qtd_dias, data.visita_a, data.com_veiculo, data.placa, data.tipo_veiculo, data.cnh,
                data.cat_habilitacao, data.data_vencimento_cnh, data.justificativa, data.portoes, data.autorizado,
                data.empresa_id, data.centro_custo_id, data.data_solicitacao, data.data_encerramento,
                data.updated_at, data.telefone, data.tel_interno, data.data_limite, userId
            ];
            return db.query(query, value).then((result: any) => result.rows[0].id);
        } catch (error) {
            console.log('Erro no model Acessos.post:', error);
        }
    },

    // ==========================================
    // FUNÇÃO: FIND BY TICKET
    // ==========================================
    async findByTicket(ticket: string) {
        try {
            const query = `SELECT a.*, u.name as user_name FROM acesso a LEFT JOIN users u ON a.user_id = u.id WHERE a.ticket = ?`;
            return await db.query(query, [ticket]);
        } catch (error) {
            console.error("Erro no model findByTicket:", error);
            throw error;
        }
    },

    // ==========================================
    // FUNÇÃO: UPDATE INDIVIDUAL
    // ==========================================
    async update(ticket: string, data: Partial<Acesso>) {
        try {
            const query = `
                UPDATE acesso SET 
                    nome = ?, doc_nacional = ?, numero_doc = ?, empresa = ?, data_do_acesso = ?, 
                    qtd_dias = ?, telefone = ?, com_veiculo = ?, placa = ?, tipo_veiculo = ?, 
                    cnh = ?, cat_habilitacao = ?, data_validade_cnh = ?, justificativa = ?, 
                    visita_a = ?, tel_interno = ?, autorizado = ?, updated_at = CURRENT_TIMESTAMP
                WHERE ticket = ?
            `;
            const values = [
                data.nome, data.doc_nacional, data.numero_doc, data.empresa, data.data_do_acesso,
                data.qtd_dias, data.telefone, data.com_veiculo, data.placa || null, data.tipo_veiculo || null,
                data.cnh || null, data.cat_habilitacao || null, data.validade_cnh || null,
                data.justificativa, data.visita_a, data.tel_interno, data.autorizado, ticket
            ];
            await db.query(query, values);
            return true;
        } catch (error) {
            console.error("Erro no model update:", error);
            throw error;
        }
    },

    // ==========================================
    // FUNÇÃO: DELETE INDIVIDUAL
    // ==========================================
    async delete(ticket: string) {
        try {
            const query = `DELETE FROM acesso WHERE ticket = ?`;
            await db.query(query, [ticket]);
            return true;
        } catch (error) {
            console.error("Erro no model delete:", error);
            throw error;
        }
    },

    // ==========================================
    // FUNÇÃO: FIND FOR MODAL
    // ==========================================
    async findForModal(ticket: string) {
        try {
            const query = `
                SELECT a.*, u.name as user_name, c.nome as setor_nome
                FROM acesso a
                LEFT JOIN users u ON a.user_id = u.id
                LEFT JOIN centro_custo c ON a.centro_custo_id = c.id
                WHERE a.ticket = ?
            `;
            return await db.query(query, [ticket]);
        } catch (error) {
            console.error("Erro no model findForModal:", error);
            throw error;
        }
    },

    // ==========================================
    // BUSCA PARA RESOLVIDOS (Com GROUP BY)
    // ==========================================
    async allResolved(dataInicio: string, dataFim: string, search: string) {
        let query = `
            SELECT a.*, u.name AS solicitante, MIN(a.data_do_acesso) as data_do_acesso
            FROM acesso a
            JOIN users u ON a.user_id = u.id
            WHERE a.autorizado IN ('ACESSO AUTORIZADO', 'ACESSO NEGADO')
    `;
        const params: any[] = [];
        if (dataInicio) { query += ` AND DATE(a.data_do_acesso) >= ?`; params.push(dataInicio); }
        if (dataFim) { query += ` AND DATE(a.data_do_acesso) <= ?`; params.push(dataFim); }
        if (search) { query += ` AND (a.nome LIKE ? OR a.ticket LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }

        query += ` GROUP BY a.ticket ORDER BY MAX(a.id) DESC`;
        const results = await db.query(query, params);
        return Array.isArray(results) ? results : (results?.rows || []);
    },

    async findResolvedByUser(userId: number, dataInicio: string, dataFim: string, search: string) {
        let query = `
            SELECT a.*, u.name AS solicitante, MIN(a.data_do_acesso) as data_do_acesso
            FROM acesso a
            JOIN users u ON a.user_id = u.id
            WHERE a.autorizado IN ('ACESSO AUTORIZADO', 'ACESSO NEGADO') AND a.user_id = ?
    `;
        const params: any[] = [userId];
        if (dataInicio) { query += ` AND DATE(a.data_do_acesso) >= ?`; params.push(dataInicio); }
        if (dataFim) { query += ` AND DATE(a.data_do_acesso) <= ?`; params.push(dataFim); }
        if (search) { query += ` AND (a.nome LIKE ? OR a.ticket LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }

        query += ` GROUP BY a.ticket ORDER BY MAX(a.id) DESC`;
        const results = await db.query(query, params);
        return Array.isArray(results) ? results : (results?.rows || []);
    },

    // ==========================================
    // EXPORTAÇÃO CSV (SEM GROUP BY - Retorna todos os dias reais)
    // ==========================================
    async getForCSV(dataInicio: string, dataFim: string, search: string, statusFilter?: string[], userId?: number) {
        let query = `
            SELECT a.*, u.name AS solicitante
            FROM acesso a
            JOIN users u ON a.user_id = u.id
            WHERE 1=1
    `;
        const params: any[] = [];

        if (userId) { query += ` AND a.user_id = ?`; params.push(userId); }
        if (dataInicio) { query += ` AND DATE(a.data_do_acesso) >= ?`; params.push(dataInicio); }
        if (dataFim) { query += ` AND DATE(a.data_do_acesso) <= ?`; params.push(dataFim); }
        if (search) { query += ` AND (a.nome LIKE ? OR a.ticket LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }

        if (statusFilter && statusFilter.length > 0) {
            query += ` AND a.autorizado IN (${statusFilter.map(() => '?').join(',')})`;
            params.push(...statusFilter);
        }

        // AQUI NÃO TEM GROUP BY! Ele exporta linha por linha para a portaria ver cada dia!
        query += ` ORDER BY a.id DESC`;
        const results = await db.query(query, params);
        return Array.isArray(results) ? results : (results?.rows || []);
    },

    // ==========================================
    // FUNÇÃO: GET MENU COUNTS
    // ==========================================
    async getMenuCounts(userId: number, isAdmin: boolean) {
        try {
            let filterUser = isAdmin ? "" : `AND user_id = ${userId}`;
            const qAbertos = await db.query(`SELECT COUNT(DISTINCT ticket) as count FROM acesso WHERE UPPER(autorizado) = 'EM ANÁLISE' ${filterUser}`);
            const qPendentes = await db.query(`SELECT COUNT(DISTINCT ticket) as count FROM acesso WHERE UPPER(autorizado) = 'PENDENTE' ${filterUser}`);
            const qResolvidos = await db.query(`SELECT COUNT(DISTINCT ticket) as count FROM acesso WHERE UPPER(autorizado) IN ('ACESSO AUTORIZADO', 'ACESSO NEGADO') AND updated_at = date('now', 'localtime') ${filterUser}`);
            return {
                abertos: Array.isArray(qAbertos) ? qAbertos[0]?.count : (qAbertos?.rows?.[0]?.count || 0),
                pendentes: Array.isArray(qPendentes) ? qPendentes[0]?.count : (qPendentes?.rows?.[0]?.count || 0),
                resolvidos: Array.isArray(qResolvidos) ? qResolvidos[0]?.count : (qResolvidos?.rows?.[0]?.count || 0)
            };
        } catch (error) {
            console.error("Erro no getMenuCounts:", error);
            return { abertos: 0, pendentes: 0, resolvidos: 0 };
        }
    },

    // ==========================================
    // BUSCA PARA SOLICITAÇÕES (Apenas Pendentes/Em Análise com GROUP BY)
    // ==========================================
    async getIndexTable(dataInicio: string, dataFim: string, search: string, userId?: number) {
        let query = `
            SELECT a.*, u.name AS solicitante, MIN(a.data_do_acesso) as data_do_acesso
            FROM acesso a
            JOIN users u ON a.user_id = u.id
            WHERE a.autorizado IN ('EM ANÁLISE', 'PENDENTE')
    `;
        const params: any[] = [];

        if (userId) { query += ` AND a.user_id = ?`; params.push(userId); }
        if (dataInicio) { query += ` AND DATE(a.data_do_acesso) >= ?`; params.push(dataInicio); }
        if (dataFim) { query += ` AND DATE(a.data_do_acesso) <= ?`; params.push(dataFim); }
        if (search) { query += ` AND (a.nome LIKE ? OR a.ticket LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }

        // Agrupa pelo ticket para não repetir na tela, mostrando 1 linha por agendamento
        query += ` GROUP BY a.ticket ORDER BY MAX(a.id) DESC`;
        const results = await db.query(query, params);
        return Array.isArray(results) ? results : (results?.rows || []);
    },

    // ==========================================
    // BUSCA PARA EDIÇÃO MASSIVA (Com GROUP BY)
    // ==========================================
    async getMassEditTable(dataInicio: string, dataFim: string, search: string, statusFilter?: string[]) {
        let query = `
            SELECT a.*, u.name AS solicitante, MIN(a.data_do_acesso) as data_do_acesso
            FROM acesso a
            JOIN users u ON a.user_id = u.id
            WHERE 1=1
    `;
        const params: any[] = [];

        if (dataInicio) { query += ` AND DATE(a.data_do_acesso) >= ?`; params.push(dataInicio); }
        if (dataFim) { query += ` AND DATE(a.data_do_acesso) <= ?`; params.push(dataFim); }
        if (search) { query += ` AND (a.nome LIKE ? OR a.ticket LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }

        if (statusFilter && statusFilter.length > 0) {
            query += ` AND a.autorizado IN (${statusFilter.map(() => '?').join(',')})`;
            params.push(...statusFilter);
        }

        query += ` GROUP BY a.ticket ORDER BY MAX(a.id) DESC`;
        const results = await db.query(query, params);
        return Array.isArray(results) ? results : (results?.rows || []);
    },

    // ==========================================
    // FUNÇÃO: GET ALL CONSULTA (Consulta Clean)
    // ==========================================
    async getAllConsulta() {
        try {
            const query = `
                SELECT ticket, nome, empresa, MIN(data_do_acesso) AS data_do_acesso, qtd_dias, visita_a, autorizado 
                FROM acesso 
                WHERE data_do_acesso >= DATE('now')
                GROUP BY ticket
                ORDER BY data_do_acesso ASC
            `;
            return await db.query(query);
        } catch (error) {
            console.log("Erro no getAllConsulta:", error);
            throw error;
        }
    }
}