import db from "../../config/db.js";
import fs from "fs";
import { Acesso } from "../interfaces/AcessosTable.js";

export default {
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

    // Busca um usuário dinamicamente (por email, por id, etc)
    async findOne(filters: { [key: string]: any }) {
        let query = "SELECT * FROM users";
        let values: any[] = [];

        // Monta a query dinamicamente (Ex: WHERE email = ?)
        Object.keys(filters).map((key) => {
            query = `${query} WHERE ${key} = ?`;
            values.push(filters[key]);
        });

        try {
            const results = await db.query(query, values);
            // Retorna apenas o primeiro usuário encontrado (ou undefined se não achar)
            return results?.rows ? results.rows[0] : null;
        } catch (error) {
            console.error("Erro no User.findOne:", error);
        }
    },

    // Cria um novo usuário
    async create(data: any) {
        try {
            const query = `
                INSERT INTO users (
                    name,
                    email,
                    password,
                    is_admin
                ) VALUES (?, ?, ?, ?)
                RETURNING id; -- O SQLite moderno permite retornar o ID criado na mesma hora!
            `;

            const values = [
                data.name,
                data.email,
                data.password,
                data.is_admin || 0 // Se não enviar is_admin, o padrão é 0 (falso)
            ];

            const results = await db.query(query, values);
            return results?.rows ? results.rows[0].id : null;
        } catch (error) {
            console.error("Erro no User.create:", error);
        }
    },

    // Comando POST para novo cadastro de solicitação de acesso
    postUser(data: Acesso) {
        try {
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
                data.data_limite
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