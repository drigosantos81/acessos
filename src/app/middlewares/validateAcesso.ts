import { Request, Response, NextFunction } from "express";

export function validateAcesso(req: Request, res: Response, next: NextFunction) {
    try {
        console.log("validateAcesso: body raw ->", req.body);

        const body = req.body as any;

        // -----------------------------
        // 1) Campos obrigatórios
        // -----------------------------
        if (!body.nome || body.nome.trim() === "") {
            return res.status(400).json({ error: "Nome obrigatório." });
        }

        if (!body.doc_nacional) {
            return res.status(400).json({ error: "Tipo de documento obrigatório." });
        }

        if (!body.numero_doc || body.numero_doc.trim() === "") {
            return res.status(400).json({ error: "Número do documento obrigatório." });
        }

        if (!body.data_do_acesso) {
            return res.status(400).json({ error: "Data do acesso obrigatória." });
        }

        if (!body.qtd_dias) {
            return res.status(400).json({ error: "Quantidade de dias obrigatória." });
        }

        if (!body.justificativa) {
            return res.status(400).json({ error: "Justificativa obrigatória." });
        }

        // -----------------------------
        // 2) Validar doc_nacional (CPF | PASSAPORTE | RG)
        // -----------------------------
        const doc = String(body.doc_nacional).trim().toUpperCase();

        if (!["CPF", "PASSAPORTE", "RG"].includes(doc)) {
            return res.status(400).json({ error: "Tipo de documento inválido." });
        }

        body.doc_nacional = doc;

        // -----------------------------
        // 3) Validar numero_doc conforme tipo
        // -----------------------------
        let numero = String(body.numero_doc);

        if (doc === "CPF") {
            const digits = numero.replace(/\D/g, "");
            if (digits.length !== 11) {
                return res.status(400).json({ error: "CPF inválido. Deve conter 11 dígitos." });
            }
            body.numero_doc = digits;
        }

        if (doc === "PASSAPORTE") {
            let pass = numero.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
            body.numero_doc = pass.slice(0, 20);
        }

        if (doc === "RG") {
            let rg = numero.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
            body.numero_doc = rg.slice(0, 15);
        }

        // -----------------------------
        // 4) Validar telefone
        // -----------------------------
        if (body.telefone) {
            const tel = body.telefone.replace(/\D/g, "");
            if (tel.length < 10 || tel.length > 11) {
                return res.status(400).json({ error: "Telefone inválido." });
            }
            body.telefone = tel;
        }

        if (body.tel_interno) {
            const tel = body.tel_interno.replace(/\D/g, "");
            body.tel_interno = tel.slice(0, 11);
        }

        // -----------------------------
        // 5) Validar data_do_acesso
        // -----------------------------
        const d = new Date(body.data_do_acesso);
        if (isNaN(d.getTime())) {
            return res.status(400).json({ error: "Data do acesso inválida." });
        }
        body.data_do_acesso = d.toISOString().slice(0, 10);

        // -----------------------------
        // 6) Validar qtd_dias
        // -----------------------------
        body.qtd_dias = Number(body.qtd_dias);
        if (!Number.isInteger(body.qtd_dias) || body.qtd_dias < 1) {
            return res.status(400).json({ error: "Quantidade de dias inválida." });
        }

        return next();

    } catch (err) {
        console.error("validateAcesso error:", err);
        return res.status(500).json({ error: "Erro de validação." });
    }
}
