import { Request, Response, Router } from 'express';
import Acessos from "../models/Acessos.js";
import { Acesso } from '../interfaces/AcessosTable.js';
import { formatDate } from '../../lib/utils.js';

function onlyDigits(v: string | null | undefined) {
	if (!v) return '';
	return String(v).replace(/\D/g, '');
}

export default {
	async index(req: Request, res: Response) {
		try {
			// Pega a data da URL (se existir), ou usa a de hoje
			const dataQuery = req.query.data as string;
			const dataFiltro = dataQuery || new Date().toISOString().slice(0, 10);

			let results;
			if (req.session.isAdmin) {
				// Manda sem userId (Admin vê tudo)
				results = await Acessos.getIndexTable(dataFiltro);
			} else {
				// Manda com userId (Usuário vê apenas os dele)
				results = await Acessos.getIndexTable(dataFiltro, req.session.userId!); 
			}

			// Normaliza o retorno do banco (SQLite)
			let acessos = Array.isArray(results) ? results : (results?.rows || []);

			// Formata as datas para o padrão brasileiro DD/MM/AAAA
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

			// Captura mensagens de sucesso na URL
			let successMsg = null;
			if (req.query.success === '1') successMsg = "Acesso agendado com sucesso!";
			else if (req.query.success === '2') successMsg = "Agendado! Alguns dias já existentes foram ignorados.";

			// Envia a dataFiltro de volta pro Nunjucks preencher o <input type="date"> na tela
			return res.render('index', { 
				acessos, 
				success: successMsg, 
				activeMenu: 'abertos',
				dataAtual: dataFiltro // <-- Para manter a data visível e atualizada no HTML
			});

		} catch (error) {
			console.log("Erro no controller Acessos.index:", error);
			return res.status(500).send("Erro ao carregar os agendamentos.");
		}
	},

	async createAcesso(req: Request, res: Response) {

		return res.render('form');

	},

	async post(req: Request<{}, {}, Acesso>, res: Response) {
		try {
			const userId = req.session.userId;
			if (!userId) return res.redirect('/login');

			const body = req.body as any;

			// ==========================================
			// BACKEND CHECK 1: CAMPOS VAZIOS
			// ==========================================
			const camposObrigatorios = ["nome", "doc_nacional", "numero_doc", "data_do_acesso", "qtd_dias", "justificativa"];

			for (const campo of camposObrigatorios) {
				if (!body[campo] || String(body[campo]).trim() === "") {
					return res.render("form", { acesso: body, error: "Erro no servidor: Preencha todos os campos obrigatórios." });
				}
			}

			// ==========================================
			// BACKEND CHECK 1.5: VEÍCULO E CNH OBRIGATÓRIOS
			// ==========================================
			const temVeiculo = ["sim", "true", "1", "s"].includes(String(body.com_veiculo).toLowerCase());
			if (temVeiculo) {
				// Se marcou SIM, nenhum dos 5 campos pode estar vazio
				if (!body.placa || !body.tipo_veiculo || !body.cnh || !body.cat_habilitacao || !body.validade_cnh) {
					return res.render("form", {
						acesso: body,
						error: "Erro no servidor: Placa, Tipo, CNH, Categoria e Validade são obrigatórios quando selecionado 'SIM'."
					});
				}

				// Formatar data da validade da CNH para o formato de banco (YYYY-MM-DD)
				let validadeInput = String(body.validade_cnh).trim();
				if (validadeInput.includes('/')) {
					const parts = validadeInput.split('/');
					body.validade_cnh = `${parts[2]}-${parts[1]}-${parts[0]}`;
				}
			} else {
				// Limpa lixo residual se veículo for não
				body.placa = null;
				body.tipo_veiculo = null;
				body.cnh = null;
				body.cat_habilitacao = null;
				body.validade_cnh = null;
			}

			// ==========================================
			// BACKEND CHECK 2: CPF INVÁLIDO
			// ==========================================
			const doc = String(body.doc_nacional).trim().toUpperCase();
			if (!["CPF", "PASSAPORTE", "RG"].includes(doc)) {
				return res.render("form", { acesso: body, error: "Tipo de documento inválido." });
			}
			body.doc_nacional = doc;

			let numero = String(body.numero_doc);
			if (doc === "CPF") {
				const digits = numero.replace(/\D/g, "");
				if (digits.length !== 11) {
					return res.render("form", { acesso: body, error: "O CPF informado é inválido." });
				}
				body.numero_doc = digits;
			} else {
				body.numero_doc = numero.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 20);
			}

			// ==========================================
			// BACKEND CHECK 3: TELEFONE E DATA INVÁLIDOS
			// ==========================================
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
			if (inputDate.includes('/')) {
				const parts = inputDate.split('/');
				inputDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
			}

			const [ano, mes, dia] = inputDate.split('-').map(Number);
			if (!ano || !mes || !dia || ano < 2024 || ano > 2100) {
				return res.render("form", { acesso: body, error: "Data de acesso inválida bloqueada pelo servidor." });
			}

			const dataBaseObj = new Date(ano, mes - 1, dia, 12, 0, 0);
			const formatYMD = (dateObj: Date) => {
				const y = dateObj.getFullYear();
				const m = String(dateObj.getMonth() + 1).padStart(2, '0');
				const d = String(dateObj.getDate()).padStart(2, '0');
				return `${y}-${m}-${d}`;
			};

			body.qtd_dias = Number(body.qtd_dias);
			if (!Number.isInteger(body.qtd_dias) || body.qtd_dias < 1) {
				return res.render("form", { acesso: body, error: "Quantidade de dias inválida." });
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

			// ==========================================
			// BACKEND CHECK 4: DUPLICIDADE DE DATAS
			// ==========================================
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
				validade_cnh: body.validade_cnh || null,
				justificativa: body.justificativa,
				portoes: body.portoes,
				autorizado: body.autorizado || "SOLICITADO",
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

	// Carrega a página de edição massiva
	async showEdit(req: Request, res: Response) {
		try {
			const buscaTermo = req.query.buscaTermo as string | undefined;

			// Executa o editAll (que já aplica a ordenação padrão por pesos de Autorizado)
			let results = await Acessos.editAll(buscaTermo);

			// CORREÇÃO 1: Removido o ".rows", pois o SQLite retorna o array diretamente!
			let acessos = Array.isArray(results) ? results : (results?.rows || []);
			// let acessos = results || [];

			acessos = acessos.map((acesso: any) => {
				const dataFormatada = formatDate(acesso.data_do_acesso).format;
				const limiteFormatado = formatDate(acesso.data_limite).format;
				let documentoFormatado = acesso.numero_doc;

				if (acesso.doc_nacional === 'CPF' && documentoFormatado) {
					const numerosPuros = String(documentoFormatado).replace(/\D/g, '');
					if (numerosPuros.length === 11) {
						documentoFormatado = numerosPuros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
					}
				}
				return {
					...acesso,
					data_do_acesso: dataFormatada,
					data_limite: limiteFormatado,
					numero_doc: documentoFormatado
				};
			});

			// CORREÇÃO 2: Alterado de 'admin/edit' para 'edit' para o Nunjucks achar o arquivo
			return res.render('admin/edit', { acessos, activeMenu: 'edit', buscaTermoAtual: buscaTermo || '' });

		} catch (error) {
			console.log("Erro no showEdit:", error);
			// CORREÇÃO 3: Adicionado um retorno caso dê erro no template ou no banco
			return res.status(500).send("Ocorreu um erro ao tentar carregar a página de Edição Massiva. Verifique o console do VSCode.");
		}
	},

	// ==========================================
	// EXIBIR UM REGISTRO INDIVIDUAL (Visualizar/Editar)
	// ==========================================
	async showEditOne(req: Request, res: Response) {
		try {
			const ticket = req.params.ticket as string;

			const results = await Acessos.findByTicket(ticket);
			const acesso = Array.isArray(results) ? results[0] : (results?.rows ? results.rows[0] : results);

			if (!acesso) {
				return res.status(404).send("Acesso não encontrado.");
			}

			if (!req.session.isAdmin && acesso.user_id !== req.session.userId) {
				return res.redirect('/');
			}

			// Formatação das datas para o padrão brasileiro DD/MM/AAAA para exibir bonito na tela
			if (acesso.data_do_acesso && acesso.data_do_acesso.includes('-')) {
				const [ano, mes, dia] = acesso.data_do_acesso.split('-');
				acesso.data_do_acesso = `${dia}/${mes}/${ano}`;
			}
			// CORREÇÃO AQUI para usar validade_cnh
			if (acesso.validade_cnh && acesso.validade_cnh.includes('-')) {
				const [ano, mes, dia] = acesso.validade_cnh.split('-');
				acesso.validade_cnh = `${dia}/${mes}/${ano}`;
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

			return res.render('edit-one', { acesso });
		} catch (error) {
			console.log("Erro no showEditOne:", error);
			return res.status(500).send("Erro ao carregar o registro.");
		}
	},

	// ==========================================
	// ATUALIZAR UM REGISTRO INDIVIDUAL
	// ==========================================
	async updateEditOne(req: Request, res: Response) {
		try {
			const ticket = req.params.ticket as string;

			const results = await Acessos.findByTicket(ticket);
			const acessoAtual = Array.isArray(results) ? results[0] : (results?.rows ? results.rows[0] : results);

			if (!acessoAtual) {
				return res.status(404).send("Acesso não encontrado.");
			}

			if (!req.session.isAdmin && acessoAtual.user_id !== req.session.userId) {
				return res.redirect('/');
			}

			if (!req.session.isAdmin && String(acessoAtual.autorizado).toUpperCase() === 'SIM') {
				return res.status(403).send("Acesso negado: Este registro já foi aprovado e não pode ser alterado.");
			}

			const data = req.body;

			if (req.session.isAdmin && req.body.autorizado) {
				data.autorizado = req.body.autorizado;
			} else {
				data.autorizado = acessoAtual.autorizado;
			}

			// Como as variáveis do form.html (validade_cnh) agora possuem o nome correto,
			// req.body já carrega os nomes perfeitos para serem despachados pro Acessos.ts
			await Acessos.update(ticket, data);

			return res.redirect('/?success=1');

		} catch (error) {
			console.log("Erro no updateEditOne:", error);
			return res.status(500).send("Erro ao atualizar o registro.");
		}
	},

	// ==========================================
	// DELETAR UM REGISTRO INDIVIDUAL
	// ==========================================
	async deleteEditOne(req: Request, res: Response) {
		try {
			const ticket = req.params.ticket as string;

			// 1. Busca o registro atual
			const results = await Acessos.findByTicket(ticket);
			const acessoAtual = Array.isArray(results) ? results[0] : (results?.rows ? results.rows[0] : results);

			if (!acessoAtual) {
				return res.status(404).send("Acesso não encontrado.");
			}

			// 2. SEGURANÇA: Usuário comum não pode deletar se não for dono
			if (!req.session.isAdmin && acessoAtual.user_id !== req.session.userId) {
				return res.redirect('/');
			}

			// 3. SEGURANÇA: Usuário comum não pode deletar se o status for "SIM"
			if (!req.session.isAdmin && String(acessoAtual.autorizado).toUpperCase() === 'SIM') {
				return res.status(403).send("Acesso negado: Este registro já foi aprovado e não pode ser deletado.");
			}

			// 4. Deleta do banco de dados
			await Acessos.delete(ticket);

			// Volta para a página inicial
			return res.redirect('/');

		} catch (error) {
			console.log("Erro no deleteEditOne:", error);
			return res.status(500).send("Erro ao deletar o registro.");
		}
	},

	// API que alimenta o Autocomplete do Google
	async searchAutocomplete(req: Request, res: Response) {
		try {
			const termo = req.query.q as string;
			if (!termo) return res.json([]);

			// Executa o searchGlobal (que aplica a ordenação Alfabética + Ticket)
			const results = await Acessos.searchGlobal(termo);

			return res.json(results?.rows || []);

		} catch (error) {
			console.log(error);
			return res.status(500).json([]);
		}
	},

	// Adicione dentro do seu Controller
	async updateMassivo(req: Request, res: Response) {
		try {
			const { tickets, status } = req.body;

			// Validação básica para evitar erros
			if (!tickets || !Array.isArray(tickets) || tickets.length === 0) {
				return res.status(400).json({ error: "Nenhum ticket selecionado." });
			}
			if (!status) {
				return res.status(400).json({ error: "Status não informado." });
			}

			// Manda o Model executar a atualização no banco
			await Acessos.updateMassivo(tickets, status);

			return res.status(200).json({ message: "Atualizado com sucesso!" });

		} catch (error) {
			console.log("Erro no controller Acessos.updateMassivo:", error);
			return res.status(500).json({ error: "Erro ao processar a atualização massiva." });
		}
	},

	// ==========================================
	// API: BUSCAR DADOS PARA O MODAL
	// ==========================================
	async getModalData(req: Request, res: Response) {
		try {
			const ticket = req.params.ticket as string;

			const results = await Acessos.findForModal(ticket);
			const acesso = Array.isArray(results) ? results[0] : (results?.rows ? results.rows[0] : results);

			if (!acesso) {
				return res.status(404).json({ error: "Acesso não encontrado." });
			}

			// Devolve os dados em formato JSON para o Javascript do frontend ler
			return res.json(acesso);

		} catch (error) {
			console.log("Erro no getModalData:", error);
			return res.status(500).json({ error: "Erro interno do servidor." });
		}
	},

	// Controller para a tela resolved.html
	async showResolved(req: Request, res: Response) {
		try {
			let results;
			// REGRA DE NEGÓCIO: Admin vê todos resolvidas, usuário comum vê as próprias

			if (req.session.isAdmin) {

				results = await Acessos.allResolved();
			} else {
				results = await

					Acessos.findResolvedByUser(req.session.userId!);
			}

			// Normaliza o retorno do banco de dados (SQLite)
			let acessos = Array.isArray(results) ? results :

				(results?.rows || []);

			// Mapeia e formata datas
			acessos = acessos.map((acesso: any) => {
				if (acesso.data_do_acesso &&
					acesso.data_do_acesso.includes('-')) {
					const [ano, mes, dia] =

						acesso.data_do_acesso.split('-');

					acesso.data_do_acesso = `${dia}/${mes}/${ano}`;
				}
				if (acesso.data_limite &&
					acesso.data_limite.includes('-')) {

					const [ano, mes, dia] =

						acesso.data_limite.split('-');

					acesso.data_limite = `${dia}/${mes}/${ano}`;
				}
				return acesso;
			});
			return res.render('resolved', { acessos, activeMenu: 'resolvidos' });
		} catch (error) {
			console.log("Erro no showResolved:", error);
			return res.status(500).send("Erro ao carregar os pedidos esolvidos.");
		}
	},

	// Controller para a tela pending.html (Todos trasados/ esquecidos)
	async showPending(req: Request, res: Response) {
		try {
			let results;
			if (req.session.isAdmin) {
				results = await Acessos.allPending();
			} else {
				results = await
					Acessos.findPendingByUser(req.session.userId!);
			}

			let acessos = Array.isArray(results) ? results : (results?.rows || []);

			acessos = acessos.map((acesso: any) => {
				if (acesso.data_do_acesso &&
					acesso.data_do_acesso.includes('-')) {
					const [ano, mes, dia] = acesso.data_do_acesso.split('-');

					acesso.data_do_acesso = `${dia}/${mes}/${ano}`;
				}
				if (acesso.data_limite &&
					acesso.data_limite.includes('-')) {

					const [ano, mes, dia] = acesso.data_limite.split('-');

					acesso.data_limite = `${dia}/${mes}/${ano}`;
				}
				return acesso;
			});

			return res.render('pending', { acessos, activeMenu: 'pendentes' });
		} catch (error) {
			console.log("Erro no showPending:", error);
			return res.status(500).send("Erro ao carregar os pedidos pendentes.");
		}
	},

	// ==========================================
	// GERAR DOWNLOAD DO ARQUIVO CSV
	// ==========================================
	async downloadCSV(req: Request, res: Response) {
		try {
			const isAdmin = req.session.isAdmin;
			const userId = req.session.userId;

			// 1. Busca os dados no Model
			let results;
			if (isAdmin) {
				results = await Acessos.getForCSV();
			} else {
				results = await Acessos.getForCSV(userId!);
			}

			const acessos = Array.isArray(results) ? results : (results?.rows || []);

			if (acessos.length === 0) {
				return res.status(404).send("Nenhum dado pendente encontrado para exportação.");
			}

			// 2. Definir o cabeçalho das colunas do arquivo Excel
			const cabecalho = [
				"Ticket", "Status", "Nome", "Documento", "Nº Documento", "Empresa",
				"Data Acesso", "Qtd Dias", "Data Limite", "Veiculo", "Placa",
				"Tipo Veiculo", "CNH", "Cat", "Validade CNH", "Justificativa",
				"Portões", "Visita A", "Telefone", "Tel Interno", "Data Solicitação"
			];

			// Função para escapar textos (evita que vírgulas ou quebras de linha quebrem o Excel)
			const escapeCSV = (str: any) => {
				if (str === null || str === undefined) return '""';
				const text = String(str).replace(/"/g, '""'); // Escapa aspas duplas
				return `"${text}"`; // Coloca entre aspas
			};

			// Função para converter data YYYY-MM-DD para o padrão Brasileiro DD/MM/AAAA
			const formataData = (dataStr: string) => {
				if (!dataStr || !dataStr.includes('-')) return dataStr;
				const [ano, mes, dia] = dataStr.split('-');
				return `${dia}/${mes}/${ano}`;
			};

			// 3. Inicia a string do CSV juntando o cabeçalho com ponto e vírgula
			let csvString = cabecalho.join(";") + "\n";

			// 4. Monta linha a linha
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
					formataData(a.validade_cnh),
					a.justificativa,
					a.portoes,
					a.visita_a,
					a.telefone,
					a.tel_interno,
					formataData(a.data_solicitacao)
				].map(escapeCSV); // Aplica a formatação em todos os campos

				csvString += linha.join(";") + "\n";
			});

			// 5. Adiciona o BOM (Byte Order Mark) para forçar o Excel a ler em UTF-8 (acentos corretos)
			const bom = "\uFEFF";

			// 6. Configura a resposta do servidor para forçar o Download do arquivo
			res.setHeader('Content-Type', 'text/csv; charset=utf-8');
			res.setHeader('Content-Disposition', 'attachment; filename="solicitacoes_pendentes.csv"');

			return res.send(bom + csvString);

		} catch (error) {
			console.log("Erro no downloadCSV:", error);
			return res.status(500).send("Erro ao gerar o CSV.");
		}
	}

}