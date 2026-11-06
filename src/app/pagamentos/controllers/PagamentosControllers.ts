import { Request, Response } from 'express';
import Pagamentos from '../models/Pagamentos.js';
import { PagamentosTable } from '../interfaces/PagamentosTable.js';

class PagamentoControllers {

    async index(req: Request, res: Response) {
        try {
            const userId = req.session.userId!;
            const isAdmin = req.session.isAdmin!;

            const statsDB = await Pagamentos.getDashboardStats(userId, isAdmin);
            const stats = { solicitado: 0, pendente: 0, confirmado: 0, cancelado: 0 };

            statsDB.forEach((s: any) => {
                const status = String(s.status).toUpperCase();
                if (status === 'SOLICITADO') stats.solicitado = s.count;
                else if (status === 'PENDENTE') stats.pendente = s.count;
                else if (status === 'CONFIRMADO') stats.confirmado = s.count;
                else if (status === 'CANCELADO') stats.cancelado = s.count;
            });

            return res.render('../../pagamentos/pages/dashboard', {
                stats,
                activeMenu: 'pagamentos'
            });
        } catch (error) {
            console.error("Erro ao carregar dashboard:", error);
            return res.status(500).send("Erro ao carregar os dados.");
        }
    }

    async listTecon(req: Request, res: Response) {
        const userId = req.session.userId!;
        const isAdmin = req.session.isAdmin!;
        // Passamos 'Tecon' para o LIKE do banco achar a empresa correta
        const pagamentos = await Pagamentos.getByEmpresa('Tecon', userId, isAdmin);

        return res.render('../../pagamentos/pages/index', {
            pagamentos,
            activeMenu: 'pagamentos',
            activeSubMenu: 'tecon', // Variável para colorir o submenu
            titulo: 'Pagamentos - Tecon'
        });
    }

    async listCls(req: Request, res: Response) {
        const userId = req.session.userId!;
        const isAdmin = req.session.isAdmin!;
        // Passamos 'CLS' para o LIKE achar a empresa correta
        const pagamentos = await Pagamentos.getByEmpresa('CLS', userId, isAdmin);

        return res.render('../../pagamentos/pages/index', {
            pagamentos,
            activeMenu: 'pagamentos',
            activeSubMenu: 'cls', // Variável para colorir o submenu
            titulo: 'Pagamentos - CLS / Depot'
        });
    }

    async create(req: Request, res: Response) {
        const empresas = await Pagamentos.getEmpresas();
        const setores = await Pagamentos.getSetores();
        return res.render('../../pagamentos/pages/form', { activeMenu: 'pagamentos', empresas, setores });
    }

    async store(req: Request, res: Response) {
        try {
            const body = req.body;
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };

            const nomeBoleto = files && files['anexo_boleto'] ? files['anexo_boleto'][0].filename : null;
            const nomeNota = files && files['anexo_nota_fatura'] ? files['anexo_nota_fatura'][0].filename : null;

            let valorLimpo = 0;
            if (body.valor) {
                const stringValor = body.valor.replace('R$', '').trim().replace(/\./g, '').replace(',', '.');
                valorLimpo = parseFloat(stringValor);
            }

            const data: PagamentosTable = {
                user_id: req.session.userId!,
                empresa_id: Number(body.empresa_id),
                setor: body.setor,
                tipo_documento: body.tipo_documento,
                contato_interno: body.contato_interno,
                pedido_compra: body.pedido_compra,
                cnpj_nota: body.cnpj_nota,
                razao_social: body.razao_social,
                numero_nota_fatura: body.numero_nota_fatura,
                data_emissao_nota: body.data_emissao_nota,
                data_vencimento: body.data_vencimento,
                valor: valorLimpo,
                tipo_pagamento: body.tipo_pagamento,
                servico_material_entregue: body.servico_material_entregue,
                mes_prestacao_servico: body.mes_prestacao_servico,
                status: 'SOLICITADO',
                anexo_boleto: nomeBoleto,
                anexo_nota_fatura: nomeNota
            };

            await Pagamentos.create(data);
            return res.redirect('/pagamentos');

        } catch (error) {
            console.error("Erro ao salvar pagamento:", error);
            return res.status(500).send("Erro ao salvar solicitação.");
        }
    }

    async viewOne(req: Request, res: Response) {
        try {
            const ticket = Number(req.params.ticket);
            const pagamento = await Pagamentos.getByTicket(ticket);

            if (!pagamento) return res.status(404).send("Pagamento não encontrado.");

            // Formatação rápida das datas para exibição visual
            const formataData = (d: string) => {
                if (!d || !d.includes('-')) return d;
                const [ano, mes, dia] = d.split('-');
                return `${dia}/${mes}/${ano}`;
            };
            pagamento.data_emissao_nota = formataData(pagamento.data_emissao_nota);
            pagamento.data_vencimento = formataData(pagamento.data_vencimento);

            return res.render('../../pagamentos/pages/visualizar', {
                pagamento,
                activeMenu: 'pagamentos'
            });
        } catch (error) {
            console.error("Erro ao visualizar:", error);
            return res.status(500).send("Erro ao carregar o registro.");
        }
    }

}
export default new PagamentoControllers();