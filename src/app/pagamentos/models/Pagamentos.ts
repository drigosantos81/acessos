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
        // Agora conta apenas os pagamentos do Tecon usando JOIN
        let query = `
            SELECT p.status, COUNT(*) as count 
            FROM pagamentos p
            JOIN empresa e ON p.empresa_id = e.id
            WHERE e.nome_fantasia LIKE '%Tecon%'
        `;
        const params: any[] = [];
        
        if (!isAdmin) {
            query += ` AND p.user_id = ?`;
            params.push(userId);
        }
        
        query += ` GROUP BY p.status`;
        const results = await db.query(query, params);
        return Array.isArray(results) ? results : (results?.rows || []);
    }

    // async getDashboardStats(userId: number, isAdmin: boolean) {
    //     let query = `SELECT status, COUNT(*) as count FROM pagamentos`;
    //     const params: any[] = [];
        
    //     if (!isAdmin) {
    //         query += ` WHERE user_id = ?`;
    //         params.push(userId);
    //     }
        
    //     query += ` GROUP BY status`;
    //     const results = await db.query(query, params);
    //     return Array.isArray(results) ? results : (results?.rows || []);
    // }

    async getByEmpresa(nomeParcial: string, userId: number, isAdmin: boolean) {
        // Usa JOIN para achar a empresa pelo nome, independente de qual ID ela recebeu no banco
        let query = `
            SELECT p.ticket, p.status, p.numero_nota_fatura, e.nome_fantasia AS empresa_nome, p.data_vencimento
            FROM pagamentos p
            JOIN empresa e ON p.empresa_id = e.id
            WHERE e.nome_fantasia LIKE ?
        `;
        const params: any[] = [`%${nomeParcial}%`];
        
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

    async getEmpresas() {
        const results = await db.query("SELECT * FROM empresa ORDER BY nome_fantasia ASC");
        return Array.isArray(results) ? results : (results?.rows || []);
    }

    async getSetores() {
        const results = await db.query("SELECT * FROM setor ORDER BY nome ASC");
        return Array.isArray(results) ? results : (results?.rows || []);
    }

    async getByTicket(ticket: number) {
        const query = `
            SELECT p.*, e.nome_fantasia AS empresa_nome 
            FROM pagamentos p
            JOIN empresa e ON p.empresa_id = e.id
            WHERE p.ticket = ?
        `;
        const results = await db.query(query, [ticket]);
        return Array.isArray(results) && results.length > 0 ? results[0] : (results?.rows ? results.rows[0] : null);
    }
    
}
export default new Pagamentos();