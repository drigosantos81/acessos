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
			let results;

			// REGRA DE NEGÓCIO NO CONTROLLER:
			// Se for admin, o Model busca tudo. Se não for, o Model busca só os dele.
			if (req.session.isAdmin) {
				results = await Acessos.all();
			} else {
				results = await Acessos.findByUser(req.session.userId!); // O "!" garante ao TS que o userId existe (pois passou pelo middleware)
			}

			let acessos = results?.rows || [];

			// Mapeamos os resultados para ajustar a exibição da data
			acessos = acessos.map((acesso: any) => {
				if (acesso.data_do_acesso) {
					// SEGURANÇA TOTAL: Em vez de usar formatDate (que pode usar fuso horário),
					// quebramos a string '2026-05-12' diretamente por causa do traço.
					const [ano, mes, dia] = acesso.data_do_acesso.split('-');

					// Remontamos no padrão brasileiro manualmente
					acesso.data_do_acesso = `${dia}/${mes}/${ano}`;
				}

				// 2. Arruma a data limite no mesmo acesso
				if (acesso.data_limite) {
					const [ano, mes, dia] = acesso.data_limite.split('-');
					acesso.data_limite = `${dia}/${mes}/${ano}`;
				}

				return acesso;
			});

			// Log para conferir se o primeiro registro está correto
			if (acessos.length > 0) {
				console.log("Exemplo de acesso formatado:", acessos[0]);
			}

			// ==========================================
			// LER O SINAL DA URL PARA EXIBIR A MENSAGEM
			// ==========================================
			let successMsg = null;
			if (req.query.success === '1') {
				successMsg = "Acesso agendado com sucesso!";
			} else if (req.query.success === '2') {
				successMsg = "Agendado! Alguns dias já existentes foram ignorados.";
			}

			// Passa a mensagem de sucesso (se houver) para o Nunjucks
			return res.render('index', { acessos, success: successMsg });

		} catch (error) {
			console.log("Erro no controller Acessos.index:", error);
			return res.status(500).send("Erro ao carregar os agendamentos.");
		}
	},
	// async index(req: Request, res: Response) {
	// 	try {
	// 		let results = await Acessos.all();
	// 		let acessos = results?.rows || [];

	// 		// Mapeamos os resultados para ajustar a exibição da data
	// 		acessos = acessos.map((acesso: any) => {
	// 			if (acesso.data_do_acesso) {
	// 				// SEGURANÇA TOTAL: Em vez de usar formatDate (que pode usar fuso horário),
	// 				// quebramos a string '2026-05-12' diretamente por causa do traço.
	// 				const [ano, mes, dia] = acesso.data_do_acesso.split('-');

	// 				// Remontamos no padrão brasileiro manualmente
	// 				acesso.data_do_acesso = `${dia}/${mes}/${ano}`;
	// 			}

	// 			// 2. Arruma a data limite no mesmo acesso
	// 			if (acesso.data_limite) {
	// 				const [ano, mes, dia] = acesso.data_limite.split('-');
	// 				acesso.data_limite = `${dia}/${mes}/${ano}`;
	// 			}

	// 			return acesso;
	// 		});

	// 		// Log para conferir se o primeiro registro está correto agora
	// 		if (acessos.length > 0) {
	// 			console.log("Exemplo de acesso formatado:", acessos[0]);
	// 		}

	// 		return res.render('index', { acessos });

	// 	} catch (error) {
	// 		console.log("Erro no controller Acessos.index:", error);
	// 		return res.status(500).send("Erro ao carregar os agendamentos.");
	// 	}
	// },

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
			const camposObrigatorios = ["nome", "doc_nacional", "numero_doc", "data_do_acesso", "qtd_dias", "telefone"];
			for (const campo of camposObrigatorios) {
				if (!body[campo] || String(body[campo]).trim() === "") {
					// Devolve o formulário com erro e DADOS PREENCHIDOS
					return res.render("form", { acesso: body, error: "Erro no servidor: Preencha todos os campos obrigatórios." });
				}
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
			if (body.telefone) {
				const telDigits = body.telefone.replace(/\D/g, "");
				if (telDigits.length < 10) {
					return res.render("form", { acesso: body, error: "O telefone deve ter pelo menos 10 dígitos." });
				}
				body.telefone = telDigits.slice(0, 11);
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

			// PREPARA OS DADOS DE DATA
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

			// FORMATAÇÕES FINAIS (Veículos, portões, etc)
			body.com_veiculo = ["sim", "true", "1", "s"].includes(String(body.com_veiculo).toLowerCase());
			if (body.tipo_veiculo) body.tipo_veiculo = String(body.tipo_veiculo).toUpperCase();

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
				// Aqui o backend recarrega a página mostrando a mensagem vermelha e MANTENDO OS DADOS
				return res.render("form", {
					acesso: body,
					error: `Acesso negado: O documento ${body.numero_doc} já possui cadastro para os dias solicitados.`
				});
			}

			// INSERÇÃO FINAL
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

			// REDIRECIONA PARA HOME ENVIANDO SINAL DE SUCESSO
			let redirectUrl = "/?success=1";
			if (datasParaInserir.length < datasPedidas.length) {
				redirectUrl = "/?success=2";
			}
			return res.redirect(redirectUrl);

		} catch (error) {
			console.log("Erro no controller Acessos.post:", error);
			return res.render("form", { acesso: req.body, error: "Erro inesperado ao salvar acesso." });
		}
	}

	// async post(req: Request<{}, {}, Acesso>, res: Response) {
	// 	try {
	// 		// ==========================================
	// 		// 1. VERIFICAÇÃO DE SEGURANÇA DA SESSÃO
	// 		// ==========================================
	// 		const userId = req.session.userId;
	// 		if (!userId) {
	// 			return res.redirect('/login'); // Se a sessão caiu, manda pro login
	// 		}

	// 		const body = req.body as any;
	// 		console.log("Controller POST body ->", body);

	// 		// ==========================================
	// 		// REGRA 1: VALIDAÇÃO SERVER-SIDE (Faixa Vermelha)
	// 		// ==========================================
	// 		const camposObrigatorios = ["nome", "doc_nacional", "numero_doc", "data_do_acesso", "qtd_dias"];
	// 		for (const campo of camposObrigatorios) {
	// 			if (!body[campo] || String(body[campo]).trim() === "") {
	// 				return res.render("form", {
	// 					acesso: body,
	// 					error: "Por favor, preencha todos os campos obrigatórios principais."
	// 				});
	// 			}
	// 		}

	// 		// 1) Normalizações e validações
	// 		const doc = String(body.doc_nacional).trim().toUpperCase();
	// 		if (!["CPF", "PASSAPORTE", "RG"].includes(doc)) {
	// 			return res.render("form", { acesso: body, error: "Tipo de documento inválido." });
	// 		}
	// 		body.doc_nacional = doc;

	// 		let numero = String(body.numero_doc);
	// 		if (doc === "CPF") {
	// 			const digits = numero.replace(/\D/g, "");
	// 			if (digits.length !== 11) {
	// 				return res.render("form", { acesso: body, error: "O CPF informado é inválido." });
	// 			}
	// 			body.numero_doc = digits;
	// 		} else {
	// 			body.numero_doc = numero.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 20);
	// 		}

	// 		if (body.telefone) {
	// 			body.telefone = body.telefone.replace(/\D/g, "").slice(0, 11);
	// 		}

	// 		// ==========================================
	// 		// CORREÇÃO MÁGICA: FUSO HORÁRIO E DATA LIMITE
	// 		// ==========================================
	// 		let inputDate = String(body.data_do_acesso).trim();
	// 		// Previne caso o front-end envie DD/MM/AAAA
	// 		if (inputDate.includes('/')) {
	// 			const parts = inputDate.split('/');
	// 			inputDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
	// 		}

	// 		const [ano, mes, dia] = inputDate.split('-').map(Number);

	// 		// VERIFICA SE O ANO É VÁLIDO (Ex: 226 vai ser bloqueado)
	// 		if (!ano || !mes || !dia || ano < 2024 || ano > 2100) {
	// 			return res.render("form", {
	// 				acesso: body,
	// 				error: "Data de acesso inválida. Verifique o ano preenchido."
	// 			});
	// 		}

	// 		const dataBaseObj = new Date(ano, mes - 1, dia, 12, 0, 0);

	// 		const formatYMD = (dateObj: Date) => {
	// 			const y = dateObj.getFullYear();
	// 			const m = String(dateObj.getMonth() + 1).padStart(2, '0');
	// 			const d = String(dateObj.getDate()).padStart(2, '0');
	// 			return `${y}-${m}-${d}`;
	// 		};

	// 		body.qtd_dias = Number(body.qtd_dias);
	// 		if (!Number.isInteger(body.qtd_dias) || body.qtd_dias < 1) {
	// 			return res.render("form", { acesso: body, error: "Quantidade de dias inválida." });
	// 		}

	// 		const dataLimiteObj = new Date(dataBaseObj.getTime());
	// 		dataLimiteObj.setDate(dataLimiteObj.getDate() + (body.qtd_dias - 1));
	// 		const dataLimiteStr = formatYMD(dataLimiteObj);

	// 		body.com_veiculo = ["sim", "true", "1", "s"].includes(String(body.com_veiculo).toLowerCase());
	// 		if (body.tipo_veiculo) body.tipo_veiculo = String(body.tipo_veiculo).toUpperCase();

	// 		let portoes = "2";
	// 		if (body.com_veiculo && body.tipo_veiculo?.includes("CARGA")) portoes = "3";
	// 		body.portoes = portoes;
	// 		body.visita_a = "TECON SALVADOR";

	// 		const now = new Date().toISOString().slice(0, 10);
	// 		body.data_solicitacao = now;
	// 		body.data_encerramento = null;
	// 		body.updated_at = now;

	// 		body.empresa_id = body.empresa_id ? Number(body.empresa_id) : null;
	// 		body.centro_custo_id = body.centro_custo_id ? Number(body.centro_custo_id) : null;

	// 		const novoTicketId = await Acessos.getNextTicket();

	// 		// 2) Montar objeto base
	// 		const base: any = {
	// 			ticket: novoTicketId.toString(),
	// 			nome: body.nome,
	// 			doc_nacional: body.doc_nacional,
	// 			numero_doc: body.numero_doc,
	// 			empresa: body.empresa || null,
	// 			qtd_dias: body.qtd_dias,
	// 			visita_a: body.visita_a,
	// 			com_veiculo: body.com_veiculo,
	// 			placa: body.placa || null,
	// 			tipo_veiculo: body.tipo_veiculo || null,
	// 			justificativa: body.justificativa,
	// 			portoes: body.portoes,
	// 			autorizado: body.autorizado || "SOLICITADO",
	// 			empresa_id: body.empresa_id,
	// 			centro_custo_id: body.centro_custo_id,
	// 			data_solicitacao: body.data_solicitacao,
	// 			data_encerramento: body.data_encerramento,
	// 			updated_at: body.updated_at,
	// 			telefone: body.telefone || null,
	// 			tel_interno: body.tel_interno || null,
	// 			data_limite: dataLimiteStr,
	// 			user_id: userId
	// 		};

	// 		// ==========================================
	// 		// REGRA 3: LÓGICA INTELIGENTE DE DATAS
	// 		// ==========================================
	// 		const datasPedidas: string[] = [];
	// 		for (let i = 0; i < body.qtd_dias; i++) {
	// 			const novaDataObj = new Date(dataBaseObj.getTime());
	// 			novaDataObj.setDate(novaDataObj.getDate() + i);
	// 			datasPedidas.push(formatYMD(novaDataObj));
	// 		}

	// 		const datasExistentes = await Acessos.getExistingDates(body.numero_doc, datasPedidas);
	// 		const datasParaInserir = datasPedidas.filter(data => !datasExistentes.includes(data));

	// 		if (datasParaInserir.length === 0) {
	// 			return res.render("form", {
	// 				acesso: body,
	// 				error: `Acesso negado: O documento ${body.numero_doc} já possui cadastro para todos os dias solicitados.`
	// 			});
	// 		}

	// 		for (const dataValida of datasParaInserir) {
	// 			const registro = {
	// 				...base,
	// 				data_do_acesso: dataValida
	// 			};
	// 			await Acessos.post(registro, userId);
	// 		}

	// 		// REDIRECIONA PARA HOME ENVIANDO SINAL DE SUCESSO
	// 		let redirectUrl = "/?success=1";
	// 		if (datasParaInserir.length < datasPedidas.length) {
	// 			redirectUrl = "/?success=2";
	// 		}

	// 		return res.redirect(redirectUrl);

	// 	} catch (error) {
	// 		console.log("Erro no controller Acessos.post:", error);
	// 		return res.render("form", { acesso: req.body, error: "Erro inesperado ao salvar acesso." });
	// 	}
	// }
	,

	// Carrega a página de edição massiva
	async showEdit(req: Request, res: Response) {
		try {
			const buscaTermo = req.query.buscaTermo as string | undefined;

			// Executa o editAll (que já aplica a ordenação padrão por pesos de Autorizado)
			let results = await Acessos.editAll(buscaTermo);
			let acessos = results?.rows || [];

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

			return res.render('admin/edit', { acessos, buscaTermoAtual: buscaTermo || '' });

		} catch (error) {
			console.log("Erro no showEdit:", error);
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
	}
}