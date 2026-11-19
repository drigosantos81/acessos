import { Request, Response, Router } from 'express';
import Acessos from "../models/Acessos.js";
import { Acesso } from '../interfaces/AcessosTable.js';

function onlyDigits(v: string | null | undefined) {
    if (!v) return '';
    return String(v).replace(/\D/g, '');
}

// Função de filtros isolada no topo para evitar erro de escopo "this"
function getFiltrosAcessos(reqQuery: any) {
    const hoje = new Date();
    const firstDay = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const lastDay = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    const formataD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const dataInicio = reqQuery.dataInicio !== undefined ? String(reqQuery.dataInicio) : formataD(firstDay);
    const dataFim = reqQuery.dataFim !== undefined ? String(reqQuery.dataFim) : formataD(lastDay);
    const search = reqQuery.search ? String(reqQuery.search) : '';

    let statusFilter: string[] = [];
    if (reqQuery.statusFilter) {
        statusFilter = String(reqQuery.statusFilter).split(',');
    }

    return { dataInicio, dataFim, search, statusFilter };
}

export default {

    async index(req: Request, res: Response) {
        try {
            const { dataInicio, dataFim, search } = getFiltrosAcessos(req.query);
            let results;

            if (req.session.isAdmin) {
                results = await Acessos.getIndexTable(dataInicio, dataFim, search);
            } else {
                results = await Acessos.getIndexTable(dataInicio, dataFim, search, req.session.userId!);
            }

            let acessos = Array.isArray(results) ? results : (results?.rows || []);
            acessos = acessos.map((acesso: any) => {
                if (acesso.data_do_acesso && acesso.data_do_acesso.includes('-')) {
                    const [ano, mes, dia] = acesso.data_do_acesso.split('-');
                    acesso.data_do_acesso = `${dia}/${mes}/${ano}`;
                }
                if (acesso.data_limite && acesso.data_limite.includes('-')) {
                    const [ano, mes, dia] = acesso.data_limite.split('-');
                    acesso.data_limite = `${dia}/${mes}/${ano}`;
                }
                return acesso;
            });

            let successMsg = null;
            if (req.query.success === '1') successMsg = "Acesso agendado com sucesso!";
            else if (req.query.success === '2') successMsg = "Agendado! Alguns dias já existentes foram ignorados.";

            return res.render('index', {
                acessos, success: successMsg, activeMenu: 'acessos', activeTab: 'abertos',
                dataInicio, dataFim, search
            });

        } catch (error) {
            console.log("Erro no controller Acessos.index:", error);
            return res.status(500).send("Erro ao carregar os agendamentos.");
        }
    },

    async createAcesso(req: Request, res: Response) {
        const dataAtual = new Date().toISOString().slice(0, 10);
        return res.render('form', { activeMenu: 'form_acessos', dataAtual });
    },

    async post(req: Request<{}, {}, Acesso>, res: Response) {
        try {
            const userId = req.session.userId;
            if (!userId) return res.redirect('/login');

            const body = req.body as any;
            const camposObrigatorios = ["nome", "doc_nacional", "numero_doc", "data_do_acesso", "qtd_dias", "justificativa"];

            for (const campo of camposObrigatorios) {
                if (!body[campo] || String(body[campo]).trim() === "") {
                    return res.render("form", { acesso: body, error: "Erro no servidor: Preencha todos os campos obrigatórios." });
                }
            }

            const temVeiculo = ["sim", "true", "1", "s"].includes(String(body.com_veiculo).toLowerCase());
            if (temVeiculo) {
                if (!body.placa || !body.tipo_veiculo || !body.cnh || !body.cat_habilitacao || !body.data_vencimento_cnh) {
                    return res.render("form", {
                        acesso: body,
                        error: "Erro no servidor: Placa, Tipo, CNH, Categoria e Validade são obrigatórios quando selecionado 'SIM'."
                    });
                }

                let validadeInput = String(body.data_vencimento_cnh).trim();
                if (validadeInput.includes('/')) {
                    const parts = validadeInput.split('/');
                    body.data_vencimento_cnh = `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
            } else {
                body.placa = null;
                body.tipo_veiculo = null;
                body.cnh = null;
                body.cat_habilitacao = null;
                body.data_vencimento_cnh = null;
            }

            if (body.telefone && String(body.telefone).trim() !== "") {
                const telDigits = String(body.telefone).replace(/\D/g, "");
                if (telDigits.length < 10) {
                    return res.render("form", { acesso: body, error: "O telefone informado deve ter pelo menos 10 dígitos." });
                }
                body.telefone = telDigits.slice(0, 11);
            } else {
                body.telefone = null;
            }

            let inputDate = String(body.data_do_acesso).trim();
            let ano = 0, mes = 0, dia = 0;

            if (inputDate.includes('-')) {
                const parts = inputDate.split('-');
                ano = Number(parts[0]);
                mes = Number(parts[1]);
                dia = Number(parts[2]);
            } else if (inputDate.includes('/')) {
                const parts = inputDate.split('/');
                dia = Number(parts[0]);
                mes = Number(parts[1]);
                ano = Number(parts[2]);
            }

            if (ano > 0 && ano < 100) ano += 2000;

            if (!ano || !mes || !dia || ano < 2024 || ano > 2100) {
                return res.render("form", { acesso: body, error: "Data de acesso inválida bloqueada pelo servidor." });
            }

            const strAno = String(ano).padStart(4, '0');
            const strMes = String(mes).padStart(2, '0');
            const strDia = String(dia).padStart(2, '0');
            body.data_do_acesso = `${strAno}-${strMes}-${strDia}`;

            const dataAgora = new Date();
            const todayStr = new Date(dataAgora.getTime() - dataAgora.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
            if (body.data_do_acesso < todayStr) {
                return res.render("form", { acesso: body, error: "Não é permitido agendar acessos com datas retroativas." });
            }

            const dataBaseObj = new Date(ano, mes - 1, dia, 12, 0, 0);
            const formatYMD = (dateObj: Date) => {
                const y = dateObj.getFullYear();
                const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                const d = String(dateObj.getDate()).padStart(2, '0');
                return `${y}-${m}-${d}`;
            };

            body.qtd_dias = Number(body.qtd_dias);
            if (!Number.isInteger(body.qtd_dias) || body.qtd_dias < 1 || body.qtd_dias > 5) {
                return res.render("form", { acesso: body, error: "A quantidade de dias deve ser entre 1 e 5." });
            }

            const dataLimiteObj = new Date(dataBaseObj.getTime());
            dataLimiteObj.setDate(dataLimiteObj.getDate() + (body.qtd_dias - 1));
            const dataLimiteStr = formatYMD(dataLimiteObj);

            body.com_veiculo = ["sim", "true", "1", "s"].includes(String(body.com_veiculo).toLowerCase());
            if (body.tipo_veiculo) body.tipo_veiculo = String(body.tipo_veiculo).toUpperCase();
            if (body.cat_habilitacao) body.cat_habilitacao = String(body.cat_habilitacao).toUpperCase();

            let portoes = "2";
            if (body.com_veiculo && body.tipo_veiculo?.includes("CARGA")) portoes = "3";
            body.portoes = portoes;
            body.visita_a = "TECON SALVADOR";

            const now = new Date().toISOString().slice(0, 10);
            body.data_solicitacao = now;
            body.data_encerramento = null;
            body.updated_at = now;
            body.empresa_id = body.empresa_id ? Number(body.empresa_id) : null;
            body.centro_custo_id = body.centro_custo_id ? Number(body.centro_custo_id) : null;

            const datasPedidas: string[] = [];
            for (let i = 0; i < body.qtd_dias; i++) {
                const novaDataObj = new Date(dataBaseObj.getTime());
                novaDataObj.setDate(novaDataObj.getDate() + i);
                datasPedidas.push(formatYMD(novaDataObj));
            }

            const datasExistentes = await Acessos.getExistingDates(body.numero_doc, datasPedidas);
            const datasParaInserir = datasPedidas.filter(data => !datasExistentes.includes(data));

            if (datasParaInserir.length === 0) {
                return res.render("form", {
                    acesso: body,
                    error: `Acesso negado: O documento ${body.numero_doc} já possui cadastro para os dias solicitados.`
                });
            }

            const novoTicketId = await Acessos.getNextTicket();
            const base: any = {
                ticket: novoTicketId.toString(),
                nome: body.nome,
                doc_nacional: body.doc_nacional,
                numero_doc: body.numero_doc,
                empresa: body.empresa || null,
                qtd_dias: body.qtd_dias,
                visita_a: body.visita_a,
                com_veiculo: body.com_veiculo,
                placa: body.placa || null,
                tipo_veiculo: body.tipo_veiculo || null,
                cnh: body.cnh || null,
                cat_habilitacao: body.cat_habilitacao || null,
                data_vencimento_cnh: body.data_vencimento_cnh || null,
                justificativa: body.justificativa,
                portoes: body.portoes,
                autorizado: "EM ANÁLISE",
                empresa_id: body.empresa_id,
                centro_custo_id: body.centro_custo_id,
                data_solicitacao: body.data_solicitacao,
                data_encerramento: body.data_encerramento,
                updated_at: body.updated_at,
                telefone: body.telefone || null,
                tel_interno: body.tel_interno || null,
                data_limite: dataLimiteStr,
                user_id: userId
            };

            for (const dataValida of datasParaInserir) {
                const registro = { ...base, data_do_acesso: dataValida };
                await Acessos.post(registro, userId);
            }

            let redirectUrl = "/?success=1";
            if (datasParaInserir.length < datasPedidas.length) {
                redirectUrl = "/?success=2";
            }
            return res.redirect(redirectUrl);

        } catch (error) {
            console.log("Erro no controller Acessos.post:", error);
            return res.render("form", { acesso: req.body, error: "Erro inesperado ao salvar acesso." });
        }
    },

    async showEdit(req: Request, res: Response) {
        try {
            const { dataInicio, dataFim, search, statusFilter } = getFiltrosAcessos(req.query);

            const results = await Acessos.getMassEditTable(dataInicio, dataFim, search, statusFilter);
            let acessos = Array.isArray(results) ? results : (results?.rows || []);
            acessos = acessos.map((acesso: any) => {
                if (acesso.data_do_acesso && acesso.data_do_acesso.includes('-')) {
                    const [ano, mes, dia] = acesso.data_do_acesso.split('-');
                    acesso.data_do_acesso = `${dia}/${mes}/${ano}`;
                }
                if (acesso.data_limite && acesso.data_limite.includes('-')) {
                    const [ano, mes, dia] = acesso.data_limite.split('-');
                    acesso.data_limite = `${dia}/${mes}/${ano}`;
                }
                return acesso;
            });

            return res.render('admin/edit', {
                acessos, activeMenu: 'acessos', activeTab: 'edit',
                dataInicio, dataFim, search,
                statusFilter: statusFilter.length > 0 ? statusFilter : ['ACESSO AUTORIZADO', 'ACESSO NEGADO', 'PENDENTE', 'EM ANÁLISE']
            });
        } catch (error) {
            console.log("Erro no controller Acessos.showEdit:", error);
            return res.status(500).send("Erro ao carregar a página de edição.");
        }
    },

    async showViewOne(req: Request, res: Response) {
        try {
            const ticket = req.params.ticket as string;
            const results = await Acessos.findByTicket(ticket);
            const acesso = Array.isArray(results) ? results[0] : (results?.rows ? results.rows[0] : results);

            if (!acesso) return res.status(404).send("Acesso não encontrado.");
            if (!req.session.isAdmin && acesso.user_id !== req.session.userId) return res.redirect('/');

            if (acesso.data_do_acesso && acesso.data_do_acesso.includes('-')) {
                const [ano, mes, dia] = acesso.data_do_acesso.split('-');
                acesso.data_do_acesso = `${dia}/${mes}/${ano}`;
            }
            if (acesso.data_vencimento_cnh && acesso.data_vencimento_cnh.includes('-')) {
                const [ano, mes, dia] = acesso.data_vencimento_cnh.split('-');
                acesso.data_vencimento_cnh = `${dia}/${mes}/${ano}`;
            }
            const dataSol = acesso.data_solicitacao || acesso.created_at;
            acesso.data_solicitacao = dataSol ? String(dataSol).split(' ')[0] : '-';
            acesso.updated_at = acesso.updated_at ? String(acesso.updated_at).split(' ')[0] : '-';

            return res.render('visualizar', { acesso, activeMenu: 'acessos' });
        } catch (error) {
            console.log("Erro no showViewOne:", error);
            return res.status(500).send("Erro ao carregar o registro.");
        }
    },

    async showEditOne(req: Request, res: Response) {
        try {
            const ticket = req.params.ticket as string;
            const results = await Acessos.findByTicket(ticket);
            const acesso = Array.isArray(results) ? results[0] : (results?.rows ? results.rows[0] : results);

            if (!acesso) return res.status(404).send("Acesso não encontrado.");
            if (!req.session.isAdmin && acesso.user_id !== req.session.userId) return res.redirect('/');

            if (acesso.data_do_acesso && acesso.data_do_acesso.includes('-')) {
                const [ano, mes, dia] = acesso.data_do_acesso.split('-');
                acesso.data_do_acesso = `${dia}/${mes}/${ano}`;
            }
            if (acesso.data_vencimento_cnh && acesso.data_vencimento_cnh.includes('-')) {
                const [ano, mes, dia] = acesso.data_vencimento_cnh.split('-');
                acesso.data_vencimento_cnh = `${dia}/${mes}/${ano}`;
            }
            const formatTrackDate = (d: string) => {
                if (!d || d === 'null' || d === '-') return '-';
                const onlyDate = d.split(' ')[0];
                if (onlyDate.includes('-')) {
                    const parts = onlyDate.split('-');
                    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
                }
                return d;
            };
            const dataSol = acesso.data_solicitacao || acesso.created_at;
            acesso.data_solicitacao = formatTrackDate(dataSol);
            acesso.updated_at = formatTrackDate(acesso.updated_at);

            return res.render('edit-one', { acesso, activeMenu: 'acessos' });
        } catch (error) {
            console.log("Erro no showEditOne:", error);
            return res.status(500).send("Erro ao carregar o registro.");
        }
    },

    async updateEditOne(req: Request, res: Response) {
        try {
            const ticket = req.params.ticket as string;

            const results = await Acessos.findByTicket(ticket);
            const acessoAtual = Array.isArray(results) ? results[0] : (results?.rows ? results.rows[0] : results);

            if (!acessoAtual) return res.status(404).send("Acesso não encontrado.");
            if (!req.session.isAdmin && acessoAtual.user_id !== req.session.userId) return res.redirect('/');

            if (!req.session.isAdmin && String(acessoAtual.autorizado).toUpperCase() === 'ACESSO AUTORIZADO') {
                return res.status(403).send("Acesso negado: Este registro já foi aprovado e não pode ser alterado.");
            }

            const data = req.body;
            if (req.session.isAdmin && req.body.autorizado) {
                data.autorizado = req.body.autorizado;
            } else {
                data.autorizado = acessoAtual.autorizado;
            }

            await Acessos.update(ticket, data);
            return res.redirect('/?success=1');

        } catch (error) {
            console.log("Erro no updateEditOne:", error);
            return res.status(500).send("Erro ao atualizar o registro.");
        }
    },

    async deleteEditOne(req: Request, res: Response) {
        try {
            const ticket = req.params.ticket as string;

            const results = await Acessos.findByTicket(ticket);
            const acessoAtual = Array.isArray(results) ? results[0] : (results?.rows ? results.rows[0] : results);

            if (!acessoAtual) return res.status(404).send("Acesso não encontrado.");
            if (!req.session.isAdmin && acessoAtual.user_id !== req.session.userId) return res.redirect('/');

            if (!req.session.isAdmin && String(acessoAtual.autorizado).toUpperCase() === 'ACESSO AUTORIZADO') {
                return res.status(403).send("Acesso negado: Este registro já foi aprovado e não pode ser deletado.");
            }

            await Acessos.delete(ticket);
            return res.redirect('/');

        } catch (error) {
            console.log("Erro no deleteEditOne:", error);
            return res.status(500).send("Erro ao deletar o registro.");
        }
    },

    async searchAutocomplete(req: Request, res: Response) {
        try {
            const termo = req.query.q as string;
            if (!termo) return res.json([]);

            const results = await Acessos.searchGlobal(termo);
            return res.json(results?.rows || []);
        } catch (error) {
            console.log(error);
            return res.status(500).json([]);
        }
    },

    async updateMassivo(req: Request, res: Response) {
        try {
            const { tickets, status } = req.body;

            console.log("\n--- INICIANDO ATUALIZAÇÃO MASSIVA ---");
            console.log("Tickets Recebidos:", tickets);
            console.log("Status Solicitado:", status);

            if (!tickets || !Array.isArray(tickets) || tickets.length === 0) {
                return res.status(400).json({ error: "Nenhum ticket selecionado." });
            }
            if (!status) return res.status(400).json({ error: "Status não informado." });

            await Acessos.updateMassivo(tickets, status);
            return res.status(200).json({ message: "Atualizado com sucesso!" });
        } catch (error) {
            console.log("Erro no controller Acessos.updateMassivo:", error);
            return res.status(500).json({ error: "Erro ao processar a atualização massiva." });
        }
    },

    async getModalData(req: Request, res: Response) {
        try {
            const ticket = req.params.ticket as string;
            const results = await Acessos.findForModal(ticket);
            const acesso = Array.isArray(results) ? results[0] : (results?.rows ? results.rows[0] : results);

            if (!acesso) return res.status(404).json({ error: "Acesso não encontrado." });
            return res.json(acesso);
        } catch (error) {
            console.log("Erro no getModalData:", error);
            return res.status(500).json({ error: "Erro interno do servidor." });
        }
    },

    async showResolved(req: Request, res: Response) {
        try {
            const { dataInicio, dataFim, search } = getFiltrosAcessos(req.query);
            let results;

            if (req.session.isAdmin) {
                results = await Acessos.allResolved(dataInicio, dataFim, search);
            } else {
                results = await Acessos.findResolvedByUser(req.session.userId!, dataInicio, dataFim, search);
            }

            let acessos = Array.isArray(results) ? results : (results?.rows || []);
            acessos = acessos.map((acesso: any) => {
                if (acesso.data_do_acesso && acesso.data_do_acesso.includes('-')) {
                    const [ano, mes, dia] = acesso.data_do_acesso.split('-');
                    acesso.data_do_acesso = `${dia}/${mes}/${ano}`;
                }
                if (acesso.data_limite && acesso.data_limite.includes('-')) {
                    const [ano, mes, dia] = acesso.data_limite.split('-');
                    acesso.data_limite = `${dia}/${mes}/${ano}`;
                }
                return acesso;
            });

            return res.render('resolved', {
                acessos, activeMenu: 'acessos', activeTab: 'resolvidos', dataInicio, dataFim, search
            });
        } catch (error) {
            console.log("Erro no showResolved:", error);
            return res.status(500).send("Erro ao carregar os pedidos resolvidos.");
        }
    },

    async downloadCSV(req: Request, res: Response) {
        try {
            const isAdmin = req.session.isAdmin;
            const userId = req.session.userId;
            const { dataInicio, dataFim, search, statusFilter } = getFiltrosAcessos(req.query);

            let results;
            if (isAdmin) {
                results = await Acessos.getForCSV(dataInicio, dataFim, search, statusFilter);
            } else {
                results = await Acessos.getForCSV(dataInicio, dataFim, search, statusFilter, userId!);
            }

            const acessos = Array.isArray(results) ? results : (results?.rows || []);

            if (acessos.length === 0) {
                return res.status(404).send("Nenhum dado encontrado para exportação com estes filtros.");
            }

            const cabecalho = [
                "Ticket", "Status", "Nome", "Documento", "Nº Documento", "Empresa",
                "Data Acesso", "Qtd Dias", "Data Limite", "Veiculo", "Placa",
                "Tipo Veiculo", "CNH", "Cat", "Validade CNH", "Justificativa",
                "Portões", "Visita A", "Telefone", "Tel Interno", "Data Solicitação"
            ];

            const escapeCSV = (str: any) => {
                if (str === null || str === undefined) return '""';
                const text = String(str).replace(/"/g, '""');
                return `"${text}"`;
            };

            const formataData = (dataStr: string) => {
                if (!dataStr || !dataStr.includes('-')) return dataStr;
                const [ano, mes, dia] = dataStr.split('-');
                return `${dia}/${mes}/${ano}`;
            };

            let csvString = cabecalho.join(";") + "\n";

            acessos.forEach((a: any) => {
                const linha = [
                    a.ticket,
                    a.autorizado,
                    a.nome,
                    a.doc_nacional,
                    a.numero_doc,
                    a.empresa,
                    formataData(a.data_do_acesso),
                    a.qtd_dias,
                    formataData(a.data_limite),
                    (a.com_veiculo === 1 || String(a.com_veiculo).toLowerCase() === 'sim') ? 'SIM' : 'NÃO',
                    a.placa,
                    a.tipo_veiculo,
                    a.cnh,
                    a.cat_habilitacao,
                    formataData(a.data_vencimento_cnh),
                    a.justificativa,
                    a.portoes,
                    a.visita_a,
                    a.telefone,
                    a.tel_interno,
                    formataData(a.data_solicitacao)
                ].map(escapeCSV);

                csvString += linha.join(";") + "\n";
            });

            const bom = "\uFEFF";
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', 'attachment; filename="solicitacoes_exportadas.csv"');
            return res.send(bom + csvString);

        } catch (error) {
            console.log("Erro no downloadCSV:", error);
            return res.status(500).send("Erro ao gerar o CSV.");
        }
    }
}