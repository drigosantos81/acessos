import db from '../../../config/db.js';
import { PagamentosTable } from '../interfaces/PagamentosTable.js';

class Pagamentos {
    async create(data: PagamentosTable) {
        const now = new Date();
        const dataHoraCriacao = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 19).replace('T', ' ');

        const query = `
            INSERT INTO pagamentos (
                user_id, empresa_id, setor, tipo_documento, contato_interno,
                pedido_compra, numero_nota_fatura, cnpj_nota, razao_social,
                mes_prestacao_servico, data_emissao_nota, data_vencimento,
                valor, servico_material_entregue, tipo_pagamento, status, 
                data_abertura, updated_at, anexo_nota_fatura, anexo_boleto
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            data.user_id, data.empresa_id, data.setor, data.tipo_documento, data.contato_interno,
            data.pedido_compra, data.numero_nota_fatura, data.cnpj_nota, data.razao_social,
            data.mes_prestacao_servico, data.data_emissao_nota, data.data_vencimento,
            data.valor, data.servico_material_entregue, data.tipo_pagamento, data.status,
            dataHoraCriacao, dataHoraCriacao, data.anexo_nota_fatura || null, data.anexo_boleto || null
        ];

        return await db.query(query, values);
    }

    async getDashboardStats(userId: number, isAdmin: boolean) {
        let query = `SELECT status, COUNT(*) as count FROM pagamentos WHERE 1=1`;
        const params: any[] = [];

        if (!isAdmin) {
            query += ` AND user_id = ?`;
            params.push(userId);
        }

        query += ` GROUP BY status`;
        const results = await db.query(query, params);
        return Array.isArray(results) ? results : (results?.rows || []);
    }

    async getByStatus(statusList: string[], userId: number, isAdmin: boolean) {
        let query = `
            SELECT p.ticket, p.status, p.numero_nota_fatura, p.razao_social, p.valor,
                   p.data_vencimento, p.anexo_nota_fatura, p.anexo_boleto, 
                   e.nome_exibicao AS empresa_nome, e.id AS empresa_id, u.name AS user_nome
            FROM pagamentos p
            JOIN empresa e ON p.empresa_id = e.id
            JOIN users u ON p.user_id = u.id
            WHERE p.status IN (${statusList.map(() => '?').join(',')})
        `;
        const params: any[] = [...statusList];

        if (!isAdmin) {
            query += ` AND p.user_id = ?`;
            params.push(userId);
        }

        query += ` ORDER BY p.ticket DESC`;

        const results = await db.query(query, params);
        const pagamentos = Array.isArray(results) ? results : (results?.rows || []);

        return pagamentos.map((pag: any) => {
            if (pag.data_vencimento && pag.data_vencimento.includes('-')) {
                const [ano, mes, dia] = pag.data_vencimento.split('-');
                pag.data_vencimento = `${dia}/${mes}/${ano}`;
            }
            return pag;
        });
    }

    async getByEmpresaId(empresaId: number, userId: number, isAdmin: boolean) {
        let query = `
            SELECT p.ticket, p.status, p.numero_nota_fatura, p.valor, p.data_vencimento, 
                   p.razao_social, p.anexo_nota_fatura, p.anexo_boleto,
                   e.nome_exibicao AS empresa_nome, u.name AS user_nome 
            FROM pagamentos p
            JOIN users u ON p.user_id = u.id
            JOIN empresa e ON p.empresa_id = e.id
            WHERE p.empresa_id = ?
        `;
        const params: any[] = [empresaId];

        if (!isAdmin) {
            query += ` AND p.user_id = ?`;
            params.push(userId);
        }

        query += ` ORDER BY p.ticket DESC`;

        const results = await db.query(query, params);
        const pagamentos = Array.isArray(results) ? results : (results?.rows || []);

        return pagamentos.map((pag: any) => {
            if (pag.data_vencimento && pag.data_vencimento.includes('-')) {
                const [ano, mes, dia] = pag.data_vencimento.split('-');
                pag.data_vencimento = `${dia}/${mes}/${ano}`;
            }
            return pag;
        });
    }

    async getEmpresaById(id: number) {
        const results = await db.query("SELECT * FROM empresa WHERE id = ?", [id]);
        return Array.isArray(results) && results.length > 0 ? results[0] : (results?.rows ? results.rows[0] : null);
    }

    async getEmpresasAtivas() {
        const results = await db.query("SELECT id, nome_exibicao, cnpj FROM empresa WHERE ativo = 1 ORDER BY nome_exibicao ASC");
        return Array.isArray(results) ? results : (results?.rows || []);
    }

    async getSetores() {
        const results = await db.query("SELECT * FROM setor ORDER BY nome ASC");
        return Array.isArray(results) ? results : (results?.rows || []);
    }

    async getByTicket(ticket: number) {
        const query = `
            SELECT p.*, e.nome_exibicao AS empresa_nome, 
                   u.name AS user_nome, u.email AS user_email, u.telefone AS user_telefone, u.empresa AS user_empresa
            FROM pagamentos p
            JOIN empresa e ON p.empresa_id = e.id
            JOIN users u ON p.user_id = u.id
            WHERE p.ticket = ?
        `;
        const results = await db.query(query, [ticket]);
        return Array.isArray(results) && results.length > 0 ? results[0] : (results?.rows ? results.rows[0] : null);
    }

    async update(ticket: number, data: any) {
        const now = new Date();
        const dataHoraAtual = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 19).replace('T', ' ');

        let query = `UPDATE pagamentos SET
            empresa_id = ?, setor = ?, tipo_documento = ?, contato_interno = ?,
            pedido_compra = ?, cnpj_nota = ?, razao_social = ?, numero_nota_fatura = ?,
            data_emissao_nota = ?, data_vencimento = ?, valor = ?, tipo_pagamento = ?,
            servico_material_entregue = ?, mes_prestacao_servico = ?, status = ?,
            observacao = ?, updated_at = ?`;

        const values = [
            data.empresa_id, data.setor, data.tipo_documento, data.contato_interno,
            data.pedido_compra, data.cnpj_nota, data.razao_social, data.numero_nota_fatura,
            data.data_emissao_nota, data.data_vencimento, data.valor, data.tipo_pagamento,
            data.servico_material_entregue, data.mes_prestacao_servico, data.status,
            data.observacao || null, dataHoraAtual
        ];

        // Só atualiza os anexos se novos arquivos foram enviados
        if (data.anexo_nota_fatura) {
            query += `, anexo_nota_fatura = ?`;
            values.push(data.anexo_nota_fatura);
        }
        if (data.anexo_boleto) {
            query += `, anexo_boleto = ?`;
            values.push(data.anexo_boleto);
        }

        query += ` WHERE ticket = ?`;
        values.push(ticket);

        return await db.query(query, values);
    }
}
export default new Pagamentos();