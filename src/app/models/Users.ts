import db from "../../config/db.js";
import bcrypt from "bcryptjs";
import { Acesso } from "../interfaces/AcessosTable.js";

export default {
    // ==========================================
    // FUNÇÕES DE USUÁRIOS
    // ==========================================

    // Busca um usuário dinamicamente (por email, por id, etc)
    async findOne(filters: { [key: string]: any }) {
        let query = "SELECT * FROM users";
        let values: any[] = [];

        const keys = Object.keys(filters);
        if (keys.length > 0) {
            query += " WHERE " + keys.map(key => `${key} = ?`).join(" AND ");
            values = keys.map(key => filters[key]);
        }

        try {
            const result = await db.query(query, values);
            // Prevenção de erro para SQLite (pode retornar array direto ou dentro de .rows)
            return Array.isArray(result) ? result[0] : result?.rows?.[0] || null;
        } catch (error) {
            console.error("Erro no User.findOne:", error);
        }
    },

    // Cria um novo usuário
    async create(data: any) {
        try {
            // Criptografa a senha antes de salvar
            const passwordHash = await bcrypt.hash(data.password, 8);

            const query = `
                INSERT INTO users (
                    name,
                    email,
                    password,
                    is_admin
                ) VALUES (?, ?, ?, ?)
                RETURNING id;
            `;

            const values = [
                data.name,
                data.email,
                passwordHash,
                data.is_admin || 0
            ];

            const result = await db.query(query, values);
            return Array.isArray(result) ? result[0]?.id : result?.rows?.[0]?.id || null;
        } catch (error) {
            console.error("Erro no User.create:", error);
        }
    },

    // Atualiza um usuário (usado na página de edição de perfil)
    async update(id: number, data: any) {
        try {
            let query = `UPDATE users SET name = ?, email = ?`;
            let values: any[] = [data.name, data.email];

            // Só atualiza a senha se o usuário digitou uma nova
            if (data.password) {
                const passwordHash = await bcrypt.hash(data.password, 8);
                query += `, password = ?`;
                values.push(passwordHash);
            }

            query += ` WHERE id = ?`;
            values.push(id);

            await db.query(query, values);
            return true;
        } catch (error) {
            console.error("Erro no User.update:", error);
            throw error;
        }
    },


    // ==========================================
    // FUNÇÕES MANTIDAS PARA NÃO QUEBRAR O SISTEMA 
    // (Avisando: o ideal seria movê-las para o model Acessos.ts futuramente)
    // ==========================================

    // Retorna a lista dos acessos solicitados
    allUsers() {
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

    // Comando POST para novo cadastro de solicitação de acesso
    postUser(data: Acesso) {
        try {
            // OBS: Deixado o uso de placeholders ($1, $2) inalterado pois você os usa aqui,
            // mas o SQLite puro prefere o uso de '?' na query preparada.
            const query = `
                INSERT INTO acesso (
                    ticket, nome, doc_nacional, numero_doc, empresa, data_do_acesso, qtd_dias, visita_a,
                    com_veiculo, placa, tipo_veiculo, justificativa, portoes, autorizado, empresa_id,
                    centro_custo_id, data_solicitacao, data_encerramento, updated_at,
                    telefone, tel_interno, data_limite
                ) 
                VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
                )
                RETURNING id
            `;

            const value = [
                data.ticket, data.nome, data.doc_nacional, data.numero_doc, data.empresa, data.data_do_acesso,
                data.qtd_dias, data.visita_a, data.com_veiculo, data.placa, data.tipo_veiculo, data.justificativa,
                data.portoes, data.autorizado, data.empresa_id, data.centro_custo_id, data.data_solicitacao,
                data.data_encerramento, data.updated_at, data.telefone, data.tel_interno, data.data_limite
            ];

            return db
                .query(query, value)
                .then(result => result.rows[0].id);

        } catch (error) {
            console.log('Erro no model Acessos.post:', error);
        }
    }
};