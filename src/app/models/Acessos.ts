import db from "../../config/db.js";
import { Acesso } from "../interfaces/AcessosTable.js";

export default {
    // Retorna a lista dos acessos solicitados (Para Admins)
    all() {
        try {
            return db.query(`
                SELECT
                    ticket, nome, empresa, MIN(data_do_acesso) AS data_do_acesso, data_limite, qtd_dias,
                    com_veiculo, justificativa, autorizado
                FROM 
                    acesso
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

    // Retorna a lista dos acessos solicitados (Para Usuário Comum)
    findByUser(userId: number) {
        try {
            return db.query(`
                SELECT
                    ticket, nome, empresa, MIN(data_do_acesso) AS data_do_acesso, data_limite, qtd_dias,
                    com_veiculo, justificativa, autorizado
                FROM 
                    acesso
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

    // Comando POST para novo cadastro de solicitação de acesso
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
                data.cnh,
                data.cat_habilitacao,
                data.validade_cnh,
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

            return db
                .query(query, value)
                .then((result: any) => result.rows[0].id);

        } catch (error) {
            console.log('Erro no model Acessos.post:', error);
        }
    },

    // ==========================================
    // BUSCAR REGISTRO ÚNICO PELO TICKET
    // ==========================================
    async findByTicket(ticket: string) {
        try {
            const query = `
                SELECT a.*, u.name as user_name 
                FROM acesso a
                LEFT JOIN users u ON a.user_id = u.id
                WHERE a.ticket = ?
            `;
            const results = await db.query(query, [ticket]);
            return results;
        } catch (error) {
            console.error("Erro no model findByTicket:", error);
            throw error;
        }
    },

    // ==========================================
    // ATUALIZAR REGISTRO INDIVIDUAL
    // ==========================================
    async update(ticket: string, data: any) {
        try {
            const query = `
                UPDATE acesso SET 
                    nome = ?, 
                    doc_nacional = ?, 
                    numero_doc = ?, 
                    empresa = ?, 
                    data_do_acesso = ?, 
                    qtd_dias = ?, 
                    telefone = ?, 
                    com_veiculo = ?, 
                    placa = ?, 
                    tipo_veiculo = ?, 
                    cnh = ?, 
                    cat_habilitacao = ?, 
                    validade_cnh = ?, 
                    justificativa = ?, 
                    visita_a = ?, 
                    tel_interno = ?, 
                    autorizado = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE ticket = ?
            `;

            const values = [
                data.nome, data.doc_nacional, data.numero_doc, data.empresa,
                data.data_do_acesso, data.qtd_dias, data.telefone, data.com_veiculo,
                data.placa || null, data.tipo_veiculo || null, data.cnh || null,
                data.cat_habilitacao || null, data.validade_cnh || null,
                data.justificativa, data.visita_a, data.tel_interno, data.autorizado,
                ticket
            ];

            await db.query(query, values);
            return true;
        } catch (error) {
            console.error("Erro no model update:", error);
            throw error;
        }
    },

    // ==========================================
    // DELETAR REGISTRO (Opcional)
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
    // BUSCAR DADOS EXCLUSIVOS PARA O MODAL
    // ==========================================
    async findForModal(ticket: string) {
        try {
            // Traz os dados do acesso + nome do usuário + nome do centro de custo (Setor)
            const query = `
                SELECT a.*, u.name as user_name, c.nome as setor_nome
                FROM acesso a
                LEFT JOIN users u ON a.user_id = u.id
                LEFT JOIN centro_custo c ON a.centro_custo_id = c.id
                WHERE a.ticket = ?
            `;
            const results = await db.query(query, [ticket]);
            return results;
        } catch (error) {
            console.error("Erro no model findForModal:", error);
            throw error;
        }
    },

    // ==========================================
    // NOVAS CONSULTAS DEDICADAS (SEGURANÇA)
    // ==========================================

    // Busca apenas pedidos RESOLVIDOS (SIM ou NÃO)
    async allResolved() {
        try {
            return await db.query(`
                SELECT a.ticket, a.nome, a.empresa, MIN(a.data_do_acesso) AS data_do_acesso, a.data_limite,
                    a.qtd_dias, a.com_veiculo, a.autorizado, u.name AS solicitante
                FROM acesso a LEFT JOIN users u ON a.user_id = u.id
                WHERE UPPER(a.autorizado) IN ('SIM', 'NÃO', 'NAO')
                GROUP BY a.ticket ORDER BY a.data_do_acesso DESC;
                `
            );
        } catch (error) {
            console.log("Erro no allResolved:", error);
            throw error;
        }
    },

    // Busca pedidos RESOLVIDOS (Por Usuário)
    async findResolvedByUser(userId: number) {
        try {
            return await db.query(`
            SELECT a.ticket, a.nome, a.empresa, MIN(a.data_do_acesso) AS data_do_acesso, a.data_limite,
                a.qtd_dias, a.com_veiculo, a.autorizado, u.name AS solicitante
            FROM acesso a LEFT JOIN users u ON a.user_id = u.id
            WHERE a.user_id = ? AND UPPER(a.autorizado) IN ('SIM', 'NÃO', 'NAO')
            GROUP BY a.ticket ORDER BY a.data_do_acesso DESC;
            `, [userId]);
        } catch (error) {
            console.log("Erro no findResolvedByUser:", error);
            throw error;
        }
    },

    // Busca APENAS pendentes gerais, sem filtro de data (Para pending.html)
    async allPending() {
        try {
            return await db.query(`
                SELECT a.ticket, a.nome, a.empresa, MIN(a.data_do_acesso) AS data_do_acesso, a.data_limite,
                    a.qtd_dias, a.com_veiculo, a.autorizado, u.name AS solicitante
                FROM acesso a LEFT JOIN users u ON a.user_id = u.id
                WHERE UPPER(a.autorizado) IN ('SOLICITADO', 'PENDENTE')
                GROUP BY a.ticket ORDER BY a.data_do_acesso ASC;
            `
            );
        } catch (error) {
            console.log("Erro no allPending:", error);
            throw error;
        }
    },

    // Busca APENAS pendentes gerais (Por Usuário)
    async findPendingByUser(userId: number) {
        try {
            return await db.query(`
                SELECT a.ticket, a.nome, a.empresa, MIN(a.data_do_acesso) AS data_do_acesso, a.data_limite,
                    a.qtd_dias, a.com_veiculo, a.autorizado, u.name AS solicitante
                FROM acesso a LEFT JOIN users u ON a.user_id = u.id
                WHERE a.user_id = ? AND UPPER(a.autorizado) IN ('SOLICITADO', 'PENDENTE')
                GROUP BY a.ticket ORDER BY a.data_do_acesso ASC;

                `, [userId]);
        } catch (error) {
            console.log("Erro no findPendingByUser:", error);
            throw error;
        }
    },

    // ==========================================
    // EXPORTAÇÃO PARA CSV (TRAZ TODAS AS COLUNAS)
    // ==========================================
    async getForCSV(userId?: number) {
        try {
            // Busca tudo que for diferente de SIM, NÃO e NAO
            let query = `
                SELECT 
                    ticket, nome, doc_nacional, numero_doc, empresa, data_do_acesso, 
                    qtd_dias, data_limite, com_veiculo, placa, tipo_veiculo, 
                    cnh, cat_habilitacao, data_validade_cnh, justificativa, portoes, 
                    visita_a, telefone, tel_interno, autorizado, data_solicitacao 
                FROM acesso 
                WHERE UPPER(autorizado) NOT IN ('SIM', 'NÃO', 'NAO')
            `;
            let values: any[] = [];

            // Se for usuário comum, filtra apenas os dele
            if (userId) {
                query += ` AND user_id = ?`;
                values.push(userId);
            }

            query += ` ORDER BY data_do_acesso ASC;`;

            return await db.query(query, values);
        } catch (error) {
            console.log("Erro no getForCSV:", error);
            throw error;
        }
    },

    // ==========================================
    // CONTADORES PARA O MENU GLOBAL
    // ==========================================
    async getMenuCounts(userId: number, isAdmin: boolean) {
        try {
            // Se for admin vê o total da empresa, se não, vê só os dele
            let filterUser = isAdmin ? "" : `AND user_id = ${userId}`;

            // 1. Abertos (SOLICITADO)
            const qAbertos = await db.query(`SELECT COUNT(DISTINCT ticket) as count FROM acesso WHERE UPPER(autorizado) = 'SOLICITADO' ${filterUser}`);

            // 2. Pendentes (PENDENTE)
            const qPendentes = await db.query(`SELECT COUNT(DISTINCT ticket) as count FROM acesso WHERE UPPER(autorizado) = 'PENDENTE' ${filterUser}`);

            // 3. Resolvidos HOJE (SIM ou NÃO)
            const qResolvidos = await db.query(`SELECT COUNT(DISTINCT ticket) as count FROM acesso WHERE UPPER(autorizado) IN ('SIM', 'NÃO', 'NAO') AND updated_at = date('now', 'localtime') ${filterUser}`);

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
    // CONSULTA DA PÁGINA INICIAL (COM REGRAS DE DATA E SOLICITANTE)
    // ==========================================
    async getIndexTable(dataSelecionada: string, userId?: number) {
        try {
            const today = new Date().toISOString().slice(0, 10);
            let whereClause = "";
            let values: any[] = [];

            if (dataSelecionada === today || !dataSelecionada) {
                whereClause = "WHERE a.data_do_acesso >= ? AND UPPER(a.autorizado) NOT IN ('SIM', 'NÃO', 'NAO')";
                values.push(today);
            } else if (dataSelecionada < today) {
                whereClause = "WHERE a.data_do_acesso >= ? AND a.data_do_acesso <= ?";
                values.push(dataSelecionada, today);
            } else {
                whereClause = "WHERE a.data_do_acesso >= ?";
                values.push(dataSelecionada);
            }

            if (userId) {
                whereClause += " AND a.user_id = ?";
                values.push(userId);
            }

            const query = `
                SELECT
                    a.ticket, a.nome, a.empresa, MIN(a.data_do_acesso) AS data_do_acesso, a.data_limite, a.qtd_dias,
                    a.com_veiculo, a.justificativa, a.autorizado, u.name AS solicitante
                FROM acesso a
                LEFT JOIN users u ON a.user_id = u.id
                ${whereClause}
                GROUP BY a.ticket
                ORDER BY a.data_do_acesso DESC, CAST(a.ticket AS INTEGER) DESC;
            `;

            return await db.query(query, values);
        } catch (error) {
            console.log("Erro no getIndexTable:", error);
            throw error;
        }
    },

    // ==========================================
    // CONSULTA DA EDIÇÃO MASSIVA (INTERVALO DE DATAS)
    // ==========================================
    async getMassEditTable(dataInicio: string, dataFim: string) {
        try {
            let whereClause = "";
            let values: any[] = [];

            // Se tem as duas datas: busca o intervalo
            if (dataInicio && dataFim) {
                whereClause = "WHERE a.data_do_acesso >= ? AND a.data_do_acesso <= ?";
                values.push(dataInicio, dataFim);
            }
            // Se tem só a data de início (padrão ao carregar a página): busca tudo a partir dela
            else if (dataInicio) {
                whereClause = "WHERE a.data_do_acesso >= ?";
                values.push(dataInicio);
            }

            const query = `
                SELECT
                    a.ticket, a.nome, a.empresa, MIN(a.data_do_acesso) AS data_do_acesso, a.data_limite, a.qtd_dias,
                    a.com_veiculo, a.autorizado, u.name AS solicitante
                FROM acesso a
                LEFT JOIN users u ON a.user_id = u.id
                ${whereClause}
                GROUP BY a.ticket
                ORDER BY a.data_do_acesso DESC, CAST(a.ticket AS INTEGER) DESC;
            `;

            return await db.query(query, values);
        } catch (error) {
            console.log("Erro no getMassEditTable:", error);
            throw error;
        }
    }
}