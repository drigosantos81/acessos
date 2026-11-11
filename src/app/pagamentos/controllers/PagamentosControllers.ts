import { Request, Response } from 'express';
import Pagamentos from '../models/Pagamentos.js';
import { PagamentosTable } from '../interfaces/PagamentosTable.js';

// Função auxiliar (Fora da classe para evitar erro de escopo "this")
function formatarLista(pagamentos: any[]) {
    return pagamentos.map(pag => {
        pag.valorF = pag.valor !== null && pag.valor !== undefined 
            ? Number(pag.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
            : '0,00';
        return pag;
    });
}

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
                stats, activeMenu: 'pagamentos', topMenu: 'painel'
            });
        } catch (error) {
            console.error("Erro ao carregar dashboard:", error);
            return res.status(500).send("Erro ao carregar os dados.");
        }
    }

    async listByEmpresa(req: Request, res: Response) {
        try {
            const empresaId = Number(req.params.id);
            const userId = req.session.userId!;
            const isAdmin = req.session.isAdmin!;

            const empresa = await Pagamentos.getEmpresaById(empresaId);
            if (!empresa) return res.status(404).send("Empresa não encontrada.");

            let pagamentos = await Pagamentos.getByEmpresaId(empresaId, userId, isAdmin);
            pagamentos = formatarLista(pagamentos);

            return res.render('../../pagamentos/pages/index', {
                pagamentos, activeMenu: 'pagamentos', activeSubMenu: empresaId,
                titulo: `Pagamentos - ${empresa.nome_exibicao}`
            });
        } catch (error) {
            console.error("Erro ao listar por empresa:", error);
            return res.status(500).send("Erro ao carregar a lista.");
        }
    }

    async listPendentes(req: Request, res: Response) {
        const userId = req.session.userId!;
        const isAdmin = req.session.isAdmin!;
        
        let pagamentos = await Pagamentos.getByStatus(['SOLICITADO', 'PENDENTE'], userId, isAdmin);
        pagamentos = formatarLista(pagamentos);
        
        const empresas = await Pagamentos.getEmpresasAtivas();

        return res.render('../../pagamentos/pages/index', {
            pagamentos, empresas, activeMenu: 'pagamentos', topMenu: 'pendentes',
            titulo: 'Pagamentos - Pendentes'
        });
    }

    async listConcluidos(req: Request, res: Response) {
        const userId = req.session.userId!;
        const isAdmin = req.session.isAdmin!;
        
        let pagamentos = await Pagamentos.getByStatus(['CONFIRMADO', 'CANCELADO'], userId, isAdmin);
        pagamentos = formatarLista(pagamentos);
        
        const empresas = await Pagamentos.getEmpresasAtivas();

        return res.render('../../pagamentos/pages/index', {
            pagamentos, empresas, activeMenu: 'pagamentos', topMenu: 'concluidos',
            titulo: 'Pagamentos - Concluídos'
        });
    }

    async create(req: Request, res: Response) {
        const empresasRaw = await Pagamentos.getEmpresasAtivas();
        const setores = await Pagamentos.getSetores();

        const empresas = empresasRaw.map((emp: any) => {
            let cnpj = emp.cnpj;
            if (cnpj && cnpj.length === 14) cnpj = cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
            return { ...emp, cnpj };
        });

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
                let stringValor = body.valor.replace(/[R$\s.]/g, '');
                stringValor = stringValor.replace(',', '.');
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

            const formataData = (d: string) => {
                if (!d || !d.includes('-')) return d;
                const [ano, mes, dia] = d.split('-');
                return `${dia}/${mes}/${ano}`;
            };
            pagamento.data_emissao_nota = formataData(pagamento.data_emissao_nota);
            pagamento.data_vencimento = formataData(pagamento.data_vencimento);

            const formataDataHora = (d: string) => {
                if (!d) return '-';
                const parts = d.split(' ');
                if (parts.length !== 2) return d;
                return `${formataData(parts[0])} | ${parts[1].substring(0, 5)}h`;
            };
            pagamento.data_abertura_br = formataDataHora(pagamento.data_abertura);
            pagamento.updated_at_br = formataDataHora(pagamento.updated_at);

            if (pagamento.valor !== undefined && pagamento.valor !== null) {
                pagamento.valorF = Number(pagamento.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            } else {
                pagamento.valorF = '0,00';
            }

            return res.render('../../pagamentos/pages/visualizar', { pagamento, activeMenu: 'pagamentos' });
        } catch (error) {
            console.error("Erro ao visualizar:", error);
            return res.status(500).send("Erro ao carregar o registro.");
        }
    }

    async edit(req: Request, res: Response) {
        try {
            const ticket = Number(req.params.ticket);
            const pagamento = await Pagamentos.getByTicket(ticket);

            if (!pagamento) return res.status(404).send("Pagamento não encontrado.");

            if (pagamento.valor !== null && pagamento.valor !== undefined) {
                pagamento.valorFormInput = "R$ " + Number(pagamento.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            }

            const empresasRaw = await Pagamentos.getEmpresasAtivas();
            const setores = await Pagamentos.getSetores();
            const empresas = empresasRaw.map((emp: any) => {
                let cnpj = emp.cnpj;
                if (cnpj && cnpj.length === 14) cnpj = cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
                return { ...emp, cnpj };
            });

            return res.render('../../pagamentos/pages/edit', {
                activeMenu: 'pagamentos', pagamento, empresas, setores
            });
        } catch (error) {
            console.error("Erro ao carregar edição:", error);
            return res.status(500).send("Erro ao carregar página de edição.");
        }
    }

    async update(req: Request, res: Response) {
        try {
            const ticket = Number(req.params.ticket);
            const body = req.body;
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };

            const nomeBoleto = files && files['anexo_boleto'] ? files['anexo_boleto'][0].filename : null;
            const nomeNota = files && files['anexo_nota_fatura'] ? files['anexo_nota_fatura'][0].filename : null;

            let valorLimpo = 0;
            if (body.valor) {
                let stringValor = body.valor.replace(/[R$\s.]/g, '');
                stringValor = stringValor.replace(',', '.');
                valorLimpo = parseFloat(stringValor);
            }

            const statusAtualizado = body.status ? body.status : body.status_original;

            const data: any = {
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
                status: statusAtualizado,
                observacao: body.observacao,
                anexo_boleto: nomeBoleto,
                anexo_nota_fatura: nomeNota
            };

            await Pagamentos.update(ticket, data);
            return res.redirect(`/pagamentos/visualizar/${ticket}`);
        } catch (error) {
            console.error("Erro ao atualizar pagamento:", error);
            return res.status(500).send("Erro ao atualizar solicitação.");
        }
    }
}
export default new PagamentoControllers();