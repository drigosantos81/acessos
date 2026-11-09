import { Request, Response, NextFunction } from "express";
import Acessos from "../../acessos/models/Acessos.js";
import db from '../../../config/db.js';

export async function loadMenuCounts(req: Request, res: Response, next: NextFunction) {
    res.locals.session = req.session;
    
    if (!req.session || !req.session.userId) {
        res.locals.counts = { abertos: 0, pendentes: 0, resolvidos: 0, empresas_pagamentos: [] };
        return next();
    }

    try {
        const isAdmin = req.session.isAdmin || false;
        const userId = req.session.userId;

        // 1. Mantém a contagem dos Acessos
        const acessosCounts = await Acessos.getMenuCounts(userId, isAdmin);
        let counts: any = {
            ...acessosCounts,
            empresas_pagamentos: [] // Nova array que guardará as empresas e suas contagens
        };

        // 2. Busca dinâmica de Empresas Ativas e seus respectivos Pagamentos
        // Utiliza subquery para contar apenas os registros vinculados àquela empresa
        let qPagamentos = `
            SELECT e.id, e.nome_exibicao,
            (SELECT COUNT(*) FROM pagamentos p WHERE p.empresa_id = e.id AND p.status IN ('SOLICITADO', 'PENDENTE') ${!isAdmin ? 'AND p.user_id = ?' : ''}) as qtd
            FROM empresa e
            WHERE e.ativo = 1
            ORDER BY e.nome_exibicao ASC
        `;
        
        const pPagamentos: any[] = !isAdmin ? [userId] : [];

        const resPagamentos = await db.query(qPagamentos, pPagamentos);
        counts.empresas_pagamentos = Array.isArray(resPagamentos) ? resPagamentos : (resPagamentos?.rows || []);

        res.locals.counts = counts;

    } catch (e) {
        console.error("Erro no middleware loadMenuCounts:", e);
        res.locals.counts = { abertos: 0, pendentes: 0, resolvidos: 0, empresas_pagamentos: [] };
    }

    next();
}