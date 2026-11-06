import { Request, Response, NextFunction } from "express";
import Acessos from "../../acessos/models/Acessos.js";
import db from '../../../config/db.js';

export async function loadMenuCounts(req: Request, res: Response, next: NextFunction) {
    // Disponibiliza a sessão globalmente para o Nunjucks
    res.locals.session = req.session;
    
    // Se o usuário não estiver logado, zera todos os contadores e segue o fluxo
    if (!req.session || !req.session.userId) {
        res.locals.counts = { 
            abertos: 0, pendentes: 0, resolvidos: 0, 
            pagamentos_tecon: 0, pagamentos_cls: 0 
        };
        return next();
    }

    try {
        const isAdmin = req.session.isAdmin || false;
        const userId = req.session.userId;

        // 1. Busca as contagens de Acessos
        const acessosCounts = await Acessos.getMenuCounts(userId, isAdmin);

        // CORREÇÃO: Criamos um novo objeto "counts" do tipo "any" mesclando os dados antigos com os novos
        let counts: any = {
            ...acessosCounts,
            pagamentos_tecon: 0,
            pagamentos_cls: 0
        };

        // 2. Busca as contagens de Pagamentos (Tecon e CLS)
        let qPagamentos = `
            SELECT e.nome_fantasia, COUNT(*) as qtd 
            FROM pagamentos p 
            JOIN empresa e ON p.empresa_id = e.id 
            WHERE p.status IN ('SOLICITADO', 'PENDENTE')
        `;
        
        const pPagamentos: any[] = [];
        
        // Se não for admin, filtra para contar apenas os registros do próprio usuário
        if (!isAdmin) {
            qPagamentos += ` AND p.user_id = ?`;
            pPagamentos.push(userId);
        }
        
        qPagamentos += ` GROUP BY e.nome_fantasia`;

        const resPagamentos = await db.query(qPagamentos, pPagamentos);
        const rowsPagamentos = Array.isArray(resPagamentos) ? resPagamentos : (resPagamentos?.rows || []);

        // Associa os resultados aos contadores corretos identificando a string
        rowsPagamentos.forEach((r: any) => {
            if (r.nome_fantasia.includes('Tecon')) counts.pagamentos_tecon = r.qtd;
            if (r.nome_fantasia.includes('CLS')) counts.pagamentos_cls = r.qtd;
        });

        // 3. Disponibiliza as contagens completas na variável global "counts" do Nunjucks
        res.locals.counts = counts;

    } catch (e) {
        console.error("Erro no middleware loadMenuCounts:", e);
        // Em caso de erro no banco, zera tudo para a tela não quebrar
        res.locals.counts = { 
            abertos: 0, pendentes: 0, resolvidos: 0, 
            pagamentos_tecon: 0, pagamentos_cls: 0 
        };
    }

    next();
}