import Acessos from "../models/Acessos.js";
import { formatDate } from '../../lib/utils.js';
function onlyDigits(v) {
    if (!v)
        return '';
    return String(v).replace(/\D/g, '');
}
export default {
    async index(req, res) {
        try {
            let results = await Acessos.all();
            let acessos = results?.rows || [];
            acessos = acessos.map(acesso => ({
                ...acesso,
                data_do_acesso: formatDate(acesso.data_do_acesso).format
            }));
            console.log(acessos[1]);
            // console.log(acessos?.map(acesso => ({
            //     nome: acesso.nome,
            //     cpf: acesso.cpf
            // })));
            return res.render('index', { acessos });
        }
        catch (error) {
            console.log();
        }
    },
    async createAcesso(req, res) {
        return res.render('form');
    },
    async post(req, res) {
        try {
            const body = req.body;
            console.log("Controller POST body ->", body);
            // -----------------------------
            // 1) Normalizações e validações
            // -----------------------------
            const doc = String(body.doc_nacional).trim().toUpperCase();
            if (!["CPF", "PASSAPORTE", "RG"].includes(doc)) {
                return res.status(400).json({ error: "Tipo de documento inválido." });
            }
            body.doc_nacional = doc;
            let numero = String(body.numero_doc);
            if (doc === "CPF") {
                const digits = numero.replace(/\D/g, "");
                if (digits.length !== 11) {
                    return res.status(400).json({ error: "CPF inválido." });
                }
                body.numero_doc = digits;
            }
            else {
                body.numero_doc = numero.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 20);
            }
            if (body.telefone) {
                body.telefone = body.telefone.replace(/\D/g, "").slice(0, 11);
            }
            const d = new Date(body.data_do_acesso);
            if (isNaN(d.getTime())) {
                return res.status(400).json({ error: "Data do acesso inválida." });
            }
            body.data_do_acesso = d.toISOString().slice(0, 10);
            body.qtd_dias = Number(body.qtd_dias);
            if (!Number.isInteger(body.qtd_dias) || body.qtd_dias < 1) {
                return res.status(400).json({ error: "Quantidade de dias inválida." });
            }
            body.com_veiculo = ["sim", "true", "1", "s"].includes(String(body.com_veiculo).toLowerCase());
            if (body.tipo_veiculo) {
                body.tipo_veiculo = String(body.tipo_veiculo).toUpperCase();
            }
            let portoes = "2";
            if (body.com_veiculo && body.tipo_veiculo?.includes("CARGA")) {
                portoes = "3";
            }
            body.portoes = portoes;
            body.visita_a = "TECON SALVADOR";
            const now = new Date().toISOString().slice(0, 10);
            body.data_solicitacao = now;
            body.data_encerramento = null;
            body.updated_at = now;
            body.empresa_id = body.empresa_id ? Number(body.empresa_id) : null;
            body.centro_custo_id = body.centro_custo_id ? Number(body.centro_custo_id) : null;
            // -----------------------------
            // 2) Montar objeto base
            // -----------------------------
            const base = {
                ticket: null,
                nome: body.nome,
                doc_nacional: body.doc_nacional,
                numero_doc: body.numero_doc,
                empresa: body.empresa || null,
                data_do_acesso: body.data_do_acesso,
                qtd_dias: body.qtd_dias,
                visita_a: body.visita_a,
                com_veiculo: body.com_veiculo,
                placa: body.placa || null,
                tipo_veiculo: body.tipo_veiculo || null,
                justificativa: body.justificativa,
                portoes: body.portoes,
                autorizado: body.autorizado || "AGENDADO",
                empresa_id: body.empresa_id,
                centro_custo_id: body.centro_custo_id,
                data_solicitacao: body.data_solicitacao,
                data_encerramento: body.data_encerramento,
                updated_at: body.updated_at,
                telefone: body.telefone || null,
                tel_interno: body.tel_interno || null
            };
            // -------------------------------------------
            // 3) INSERIR O PRIMEIRO REGISTRO
            // -------------------------------------------
            const primeiroId = await Acessos.post(base);
            console.log("ID do primeiro registro:", primeiroId);
            // ticket = id do primeiro registro
            const ticket = primeiroId;
            // -------------------------------------------
            // 4) INSERIR OS DEMAIS REGISTROS (QTD_DIAS)
            // -------------------------------------------
            const dataBase = new Date(base.data_do_acesso);
            for (let i = 1; i < base.qtd_dias; i++) {
                const novaData = new Date(dataBase.getTime() + i * 86400000)
                    .toISOString()
                    .slice(0, 10);
                const registro = {
                    ...base,
                    ticket: ticket,
                    data_do_acesso: novaData
                };
                await Acessos.post(registro);
            }
            return res.redirect("/");
        }
        catch (error) {
            console.log("Erro no controller Acessos.post:", error);
            return res.status(500).json({ error: "Erro ao salvar acesso." });
        }
    }
};
//# sourceMappingURL=FrontControllers.js.map