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
                activeMenu: 'pagamentos',
                topMenu: 'painel'
            });
        } catch (error) {
            console.error("Erro ao carregar dashboard:", error);
            return res.status(500).send("Erro ao carregar os dados.");
        }
    }

    // Função única e dinâmica que serve para Tecon, CLS e qualquer outra
    async listByEmpresa(req: Request, res: Response) {
        try {
            const empresaId = Number(req.params.id);
            const userId = req.session.userId!;
            const isAdmin = req.session.isAdmin!;

            const empresa = await Pagamentos.getEmpresaById(empresaId);
            if (!empresa) return res.status(404).send("Empresa não encontrada.");

            const pagamentos = await Pagamentos.getByEmpresaId(empresaId, userId, isAdmin);

            return res.render('../../pagamentos/pages/index', {
                pagamentos,
                activeMenu: 'pagamentos',
                activeSubMenu: empresaId, // Pinta de verde o menu que tiver este ID
                titulo: `Pagamentos - ${empresa.nome_exibicao}`
            });
        } catch (error) {
            console.error("Erro ao listar por empresa:", error);
            return res.status(500).send("Erro ao carregar a lista.");
        }
    }

    async create(req: Request, res: Response) {
        // Busca apenas as empresas ativas (ativo = 1) para o formulário
        const empresas = await Pagamentos.getEmpresasAtivas();
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

            // 1. Formatação de Datas Simples (YYYY-MM-DD para DD/MM/YYYY)
            const formataData = (d: string) => {
                if (!d || !d.includes('-')) return d;
                const [ano, mes, dia] = d.split('-');
                return `${dia}/${mes}/${ano}`;
            };
            pagamento.data_emissao_nota = formataData(pagamento.data_emissao_nota);
            pagamento.data_vencimento = formataData(pagamento.data_vencimento);

            // 2. Formatação de Datas Completas com Hora (YYYY-MM-DD HH:mm:ss)
            const formataDataHora = (d: string) => {
                if (!d) return '-';
                const parts = d.split(' ');
                if (parts.length !== 2) return d;
                const dataFormatada = formataData(parts[0]);
                const horaCortada = parts[1].substring(0, 5); // Pega apenas HH:mm
                return `${dataFormatada} | ${horaCortada}h`;
            };
            pagamento.data_abertura_br = formataDataHora(pagamento.data_abertura);
            pagamento.updated_at_br = formataDataHora(pagamento.updated_at);

            // 3. Formatação do Valor Financeiro (Garante 2 casas decimais, ex: 520,50)
            if (pagamento.valor !== undefined && pagamento.valor !== null) {
                pagamento.valorF = Number(pagamento.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            } else {
                pagamento.valorF = '0,00';
            }

            return res.render('../../pagamentos/pages/visualizar', {
                pagamento,
                activeMenu: 'pagamentos'
            });
        } catch (error) {
            console.error("Erro ao visualizar:", error);
            return res.status(500).send("Erro ao carregar o registro.");
        }
    }

    // Rota: Pendentes
    async listPendentes(req: Request, res: Response) {
        const userId = req.session.userId!;
        const isAdmin = req.session.isAdmin!;
        const pagamentos = await Pagamentos.getByStatus(['SOLICITADO', 'PENDENTE'], userId, isAdmin);
        const empresas = await Pagamentos.getEmpresasAtivas();

        return res.render('../../pagamentos/pages/index', {
            pagamentos, empresas,
            activeMenu: 'pagamentos', topMenu: 'pendentes',
            titulo: 'Pagamentos - Pendentes'
        });
    }

    // Rota: Concluídos
    async listConcluidos(req: Request, res: Response) {
        const userId = req.session.userId!;
        const isAdmin = req.session.isAdmin!;
        const pagamentos = await Pagamentos.getByStatus(['CONFIRMADO', 'CANCELADO'], userId, isAdmin);
        const empresas = await Pagamentos.getEmpresasAtivas();

        return res.render('../../pagamentos/pages/index', {
            pagamentos, empresas,
            activeMenu: 'pagamentos', topMenu: 'concluidos',
            titulo: 'Pagamentos - Concluídos'
        });
    }
}
export default new PagamentoControllers();