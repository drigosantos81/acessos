// ==========================================
// MÁSCARAS E FUNÇÕES AUXILIARES
// ==========================================

function onlyDigits(str) {
    if (!str) return '';
    return String(str).replace(/\D+/g, '');
}

function formatCPF(value) {
    let out = onlyDigits(value).slice(0, 11);
    out = out.replace(/^(\d{3})(\d)/, '$1.$2');
    out = out.replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
    out = out.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    return out;
}

function formatDate(value) {
    let out = onlyDigits(value).slice(0, 8);
    out = out.replace(/^(\d{2})(\d)/, '$1/$2');
    out = out.replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
    return out;
}

function formatPhone(value) {
    let d = onlyDigits(value).slice(0, 11);
    if (d.length <= 10) {
        return d.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '').trim();
    } else {
        return d.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '').trim();
    }
}

// ==========================================
// INICIALIZAÇÃO DA PÁGINA (FORMULÁRIO E INDEX)
// ==========================================

document.addEventListener('DOMContentLoaded', function () {

    // --- ELEMENTOS DO FORMULÁRIO ---
    const form = document.getElementById('meuForm');
    const numeroDocInput = document.getElementById('numero_doc_input');
    const docSelect = document.getElementById('doc_nacional_select');
    const dataInput = document.getElementById('data_input');
    const qtdDiasInput = document.getElementById('qtd_dias_input');
    const telefoneInput = document.getElementById('telefone_input');
    const contatoTeconInput = document.getElementById('tel_interno_input');

    // --- NOVOS CAMPOS EXCLUSIVOS DE VEÍCULO ---
    const veiculoRadios = document.querySelectorAll('input[name="com_veiculo"]');
    const placaField = document.getElementById('placaField');
    const tipoField = document.getElementById('tipoField');
    const cnhField = document.getElementById('cnhField');
    const catHabField = document.getElementById('catHabField');
    const validadeCnhField = document.getElementById('validadeCnhField');

    const inputPlaca = document.querySelector('input[name="placa"]');
    const radiosTipoVeiculo = document.querySelectorAll('input[name="tipo_veiculo"]');
    const inputCnh = document.getElementById('cnh_input');
    const inputCatHab = document.getElementById('cat_habilitacao_input');
    const inputValidadeCnh = document.getElementById('validade_cnh_input');

    // -----------------------------
    // 1. Mostrar/Ocultar Placa, Tipo e CNHs + Limpeza e Required Dinâmico
    // -----------------------------
    function toggleVeiculo() {
        const selecionado = document.querySelector('input[name="com_veiculo"]:checked');

        if (!selecionado || !placaField || !tipoField || !cnhField || !catHabField || !validadeCnhField) return;

        if (selecionado.value === 'sim') {
            // EXIBE TODOS OS CAMPOS DE VEÍCULO NA MESMA LINHA
            placaField.classList.remove('hidden');
            tipoField.classList.remove('hidden');
            cnhField.classList.remove('hidden');
            catHabField.classList.remove('hidden');
            validadeCnhField.classList.remove('hidden');

            // ATIVA A OBRIGATORIEDADE EM NÍVEL FRONTEND
            if (inputPlaca) inputPlaca.setAttribute('required', 'true');
            if (inputCnh) inputCnh.setAttribute('required', 'true');
            if (inputCatHab) inputCatHab.setAttribute('required', 'true');
            if (inputValidadeCnh) inputValidadeCnh.setAttribute('required', 'true');
            radiosTipoVeiculo.forEach(r => r.setAttribute('required', 'true'));

        } else {
            // OCULTA TODOS OS CAMPOS
            placaField.classList.add('hidden');
            tipoField.classList.add('hidden');
            cnhField.classList.add('hidden');
            catHabField.classList.add('hidden');
            validadeCnhField.classList.add('hidden');

            // LIMPA OS VALORES, CORES DE ERRO E REMOVE REQUISITOS
            if (inputPlaca) { inputPlaca.value = ''; inputPlaca.removeAttribute('required'); inputPlaca.classList.remove('input-error', 'input-warning'); }
            if (inputCnh) { inputCnh.value = ''; inputCnh.removeAttribute('required'); inputCnh.classList.remove('input-error', 'input-warning'); }
            if (inputCatHab) { inputCatHab.value = ''; inputCatHab.removeAttribute('required'); inputCatHab.classList.remove('input-error', 'input-warning'); }
            if (inputValidadeCnh) { inputValidadeCnh.value = ''; inputValidadeCnh.removeAttribute('required'); inputValidadeCnh.classList.remove('input-error', 'input-warning'); }

            radiosTipoVeiculo.forEach(r => { r.checked = false; r.removeAttribute('required'); });
        }
    }

    if (veiculoRadios.length > 0) {
        toggleVeiculo();
        veiculoRadios.forEach(radio => {
            radio.addEventListener('change', toggleVeiculo);
        });
    }

    // Forçar Letras Maiúsculas na categoria (A, B, AB, C, D, E)
    if (inputCatHab) {
        inputCatHab.addEventListener('input', function () {
            this.value = this.value.toUpperCase().replace(/[^A-Z]/g, "");
        });
    }

    // Aplicar máscara de data na validade da CNH
    if (inputValidadeCnh) {
        inputValidadeCnh.addEventListener('input', function () {
            this.value = formatDate(this.value);
        });
    }

    // Placa em maiúsculo com hífen automático
    if (inputPlaca) {
        inputPlaca.addEventListener('input', function () {
            this.value = this.value.toUpperCase();
        });
    }

    // -----------------------------
    // 2. Máscara do Documento (CPF/Passaporte)
    // -----------------------------
    function applyDocMask() {
        if (!docSelect || !numeroDocInput) return;
        const tipo = docSelect.value;
        numeroDocInput.value = "";

        if (tipo === "CPF") {
            numeroDocInput.placeholder = "000.000.000-00";
            numeroDocInput.setAttribute("maxlength", "14");
            numeroDocInput.setAttribute("inputmode", "numeric");
        } else {
            numeroDocInput.placeholder = tipo;
            numeroDocInput.setAttribute("maxlength", "20");
            numeroDocInput.setAttribute("inputmode", "text");
        }
    }

    if (docSelect) {
        applyDocMask();
        docSelect.addEventListener("change", applyDocMask);

        numeroDocInput.addEventListener("input", () => {
            if (docSelect.value === "CPF") {
                numeroDocInput.value = formatCPF(numeroDocInput.value);
            } else {
                let v = numeroDocInput.value.replace(/[^a-zA-Z0-9]/g, "");
                numeroDocInput.value = v.toUpperCase().slice(0, 20);
            }
        });
    }

    // -----------------------------
    // 3. Máscara de DATA
    // -----------------------------
    if (dataInput) {
        dataInput.addEventListener('input', function () {
            dataInput.value = formatDate(dataInput.value);
        });
    }

    // -----------------------------
    // 4. Máscara de TELEFONE
    // -----------------------------
    [telefoneInput, contatoTeconInput].forEach(input => {
        if (input) {
            input.addEventListener('input', function () {
                input.value = formatPhone(input.value);
            });
        }
    });

    // -----------------------------
    // 5. Limitar QTD. DIAS
    // -----------------------------
    if (qtdDiasInput) {
        qtdDiasInput.addEventListener('input', function () {
            qtdDiasInput.value = onlyDigits(qtdDiasInput.value).slice(0, 2);
        });
    }

    // -----------------------------
    // 6. VALIDAÇÃO FRONTEND INTELIGENTE (SEM RECARREGAR)
    // -----------------------------
    if (form) {
        form.addEventListener('submit', function (event) {
            let temErroVazio = false;
            let temErroInvalido = false;
            let mensagemInvalida = "";

            // A) VERIFICA CAMPOS VAZIOS DE TEXTO
            const camposObrigatorios = form.querySelectorAll('input[required]');
            camposObrigatorios.forEach(campo => {
                if (campo.type !== 'radio' && campo.value.trim() === "") {
                    campo.classList.add('input-error');
                    temErroVazio = true;
                }
            });

            // A.2) VERIFICA O RÁDIO DE JUSTIFICATIVA
            const justificativaMarcada = document.querySelector('input[name="justificativa"]:checked');
            const caixaJustificativa = document.getElementById('caixa_justificativa');

            if (!justificativaMarcada) {
                if (caixaJustificativa) {
                    caixaJustificativa.classList.add('input-error'); // Pinta a caixa toda de vermelho
                }
                temErroVazio = true;
            }

            // A.3) VERIFICA O RÁDIO DE TIPO DE VEÍCULO (Condicional)
            const radiosTipoVal = document.querySelectorAll('input[name="tipo_veiculo"]');
            // Só valida se o campo ganhou o atributo "required" (ou seja, se clicou no SIM)
            const isTipoVeiculoRequired = radiosTipoVal.length > 0 && radiosTipoVal[0].hasAttribute('required');
            const tipoVeiculoMarcado = document.querySelector('input[name="tipo_veiculo"]:checked');
            const caixaTipoVeiculo = document.getElementById('caixa_tipo_veiculo');

            if (isTipoVeiculoRequired && !tipoVeiculoMarcado) {
                if (caixaTipoVeiculo) {
                    caixaTipoVeiculo.classList.add('input-error');
                }
                temErroVazio = true;
            }

            // B) VERIFICA TELEFONE INVÁLIDO
            if (telefoneInput && telefoneInput.value.trim() !== "") {
                const numTelefone = telefoneInput.value.replace(/\D/g, '');
                if (numTelefone.length < 10) {
                    telefoneInput.classList.add('input-warning');
                    temErroInvalido = true;
                    mensagemInvalida = "O telefone deve ter pelo menos 10 dígitos com o DDD.";
                }
            }

            // C) VERIFICA DATA DE ACESSO INVÁLIDA
            if (dataInput && dataInput.value.trim() !== "") {
                const parts = dataInput.value.split('/');
                if (parts.length === 3) {
                    const ano = parseInt(parts[2], 10);
                    if (ano < 2024 || ano > 2100) {
                        dataInput.classList.add('input-warning');
                        temErroInvalido = true;
                        mensagemInvalida = "A data informada é inválida. Verifique o ano.";
                    }
                }
            }

            // D) VERIFICA DATA DE VALIDADE DA CNH INVÁLIDA
            if (inputValidadeCnh && inputValidadeCnh.value.trim() !== "" && !validadeCnhField.classList.contains('hidden')) {
                const parts = inputValidadeCnh.value.split('/');
                if (parts.length === 3) {
                    const ano = parseInt(parts[2], 10);
                    if (ano < 2024 || ano > 2100) {
                        inputValidadeCnh.classList.add('input-warning');
                        temErroInvalido = true;
                        mensagemInvalida = "A validade da CNH é inválida. Verifique o ano.";
                    }
                }
            }

            // E) SE TEM ERRO, GERA FAIXA E TRAVA ENVIO
            if (temErroVazio || temErroInvalido) {
                event.preventDefault();

                const msgAntigas = document.querySelectorAll('.messages');
                msgAntigas.forEach(m => m.remove());

                const divMsg = document.createElement('div');
                divMsg.classList.add('messages');

                if (temErroVazio) {
                    divMsg.classList.add('error');
                    divMsg.textContent = "Existem campos obrigatórios vazios.";
                } else if (temErroInvalido) {
                    divMsg.classList.add('warning');
                    divMsg.textContent = mensagemInvalida;
                }

                document.body.prepend(divMsg);

            } else {
                // F) SE ESTIVER TUDO PERFEITO, AJUSTA AS DATAS PARA O PADRÃO SQL (AAAA-MM-DD)
                if (dataInput && dataInput.value.includes('/')) {
                    const parts = dataInput.value.split('/');
                    dataInput.value = `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
                if (inputValidadeCnh && inputValidadeCnh.value.includes('/')) {
                    const parts = inputValidadeCnh.value.split('/');
                    inputValidadeCnh.value = `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
            }
        });

        // Limpa a borda vermelha do Tipo Veículo assim que ele clicar em uma opção
        const radiosTipo = form.querySelectorAll('input[name="tipo_veiculo"]');
        radiosTipo.forEach(radio => {
            radio.addEventListener('change', () => {
                const caixaTipoVeiculo = document.getElementById('caixa_tipo_veiculo');
                if (caixaTipoVeiculo) caixaTipoVeiculo.classList.remove('input-error');
            });
        });

        // Limpa a borda vermelha da Justificativa assim que ele clicar em uma opção
        const radiosJust = form.querySelectorAll('input[name="justificativa"]');
        radiosJust.forEach(radio => {
            radio.addEventListener('change', () => {
                const caixaJustificativa = document.getElementById('caixa_justificativa');
                if (caixaJustificativa) caixaJustificativa.classList.remove('input-error');
            });
        });

        const todosInputs = form.querySelectorAll('input, select');
        todosInputs.forEach(campo => {
            campo.addEventListener('input', () => campo.classList.remove('input-error', 'input-warning'));
            campo.addEventListener('change', () => campo.classList.remove('input-error', 'input-warning'));
        });
    }

    // ==========================================
    // LÓGICA DA PÁGINA INICIAL (Tabela Autorizados)
    // ==========================================
    const autorizados = document.querySelectorAll("td.autorizado");

    autorizados.forEach(td => {
        const valor = td.textContent.trim().toUpperCase();
        td.classList.remove("sim", "nao", "não", "pendente", "solicitado");

        let icon = "";

        if (valor === "SIM") {
            td.classList.add("sim");
            icon = '<i class="fa-solid fa-circle-check"></i>';
        }
        else if (valor === "NÃO" || valor === "NAO") {
            td.classList.add("nao");
            icon = '<i class="fa-solid fa-circle-xmark"></i>';
        }
        else if (valor === "PENDENTE") {
            td.classList.add("pendente");
            icon = '<i class="fa-solid fa-circle-exclamation"></i>';
        }
        else if (valor === "SOLICITADO") {
            td.classList.add("solicitado");
            icon = '<i class="fa-solid fa-circle-pause"></i>';
        }

        td.innerHTML = icon + " " + valor;
    });
});

// ==========================================
// SELECIONAR TODOS OS CHECKBOXES (Protegido)
// ==========================================
document.addEventListener('DOMContentLoaded', function () {
    const selectAllCheckbox = document.getElementById('selectAll');
    const rowCheckboxes = document.querySelectorAll('.row-checkbox');

    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function () {
            rowCheckboxes.forEach(checkbox => {
                checkbox.checked = selectAllCheckbox.checked;
            });
        });
    }
});

// ==========================================
// AUTOCOMPLETE GLOBAL (ALFABÉTICO) E FILTROS DA TELA
// ==========================================
document.addEventListener('DOMContentLoaded', function () {
    const statusFilters = document.querySelectorAll('.status-filter');
    const buscaInput = document.getElementById('buscaNome');
    const autocompleteList = document.getElementById('autocomplete-list');
    const tableRows = document.querySelectorAll('.table-container tbody tr');

    function filtrarTabelaLocalmente() {
        if (tableRows.length === 0) return;

        const statusPermitidos = Array.from(document.querySelectorAll('.status-filter:checked'))
            .map(cb => cb.value.toUpperCase());

        const termo = buscaInput ? buscaInput.value.trim().toLowerCase() : '';
        const termoLimpo = termo.replace(/\D/g, '');

        tableRows.forEach(row => {
            const celulaAutorizado = row.querySelector('.autorizado');
            const colunas = row.querySelectorAll('td');

            const celulaTicket = colunas[1];
            const celulaNome = colunas[2];
            const celulaCPF = colunas[3];

            if (celulaAutorizado && celulaNome && celulaTicket && celulaCPF) {
                const statusDaLinha = celulaAutorizado.textContent.trim().toUpperCase();
                const ticketDaLinha = celulaTicket.textContent.trim().toLowerCase();
                const nomeDaLinha = celulaNome.textContent.trim().toLowerCase();
                const cpfDaLinha = celulaCPF.textContent.trim().toLowerCase();
                const cpfLimpo = cpfDaLinha.replace(/\D/g, '');

                const passouNoStatus = statusPermitidos.includes(statusDaLinha);

                const passouNoTermo = ticketDaLinha.includes(termo) ||
                    nomeDaLinha.includes(termo) ||
                    cpfDaLinha.includes(termo) ||
                    (termoLimpo && cpfLimpo.includes(termoLimpo));

                if (passouNoStatus && passouNoTermo) row.style.display = '';
                else row.style.display = 'none';
            }
        });
    }

    statusFilters.forEach(checkbox => {
        checkbox.addEventListener('change', filtrarTabelaLocalmente);
    });

    if (buscaInput && autocompleteList) {
        buscaInput.addEventListener('input', async function () {
            const valorDigitado = this.value.trim();
            autocompleteList.innerHTML = '';

            if (!valorDigitado) {
                filtrarTabelaLocalmente();
                if (window.location.search.includes('buscaTermo')) {
                    window.location.href = '/admin/edit';
                }
                return;
            }

            filtrarTabelaLocalmente();

            try {
                const resposta = await fetch(`/api/admin/search-nomes?q=${encodeURIComponent(valorDigitado)}`);
                const registros = await resposta.json();

                if (registros.length === 0) return;

                registros.forEach(reg => {
                    const item = document.createElement('div');

                    let cpfFormatado = reg.numero_doc;
                    if (reg.doc_nacional === 'CPF' && cpfFormatado && cpfFormatado.length === 11) {
                        cpfFormatado = cpfFormatado.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                    }

                    const regex = new RegExp(`(${valorDigitado})`, "gi");
                    const textoTicket = `TKT: ${reg.ticket}`.replace(regex, "<strong>$1</strong>");
                    const textoNome = reg.nome.replace(regex, "<strong>$1</strong>");
                    const textoCPF = cpfFormatado.replace(regex, "<strong>$1</strong>");

                    item.innerHTML = `<span style="color:#00BEDD; font-weight:bold;">[${textoTicket}]</span> ${textoNome} <span style="color:#888; font-size:11px;">(${textoCPF})</span>`;

                    item.addEventListener('click', function () {
                        window.location.href = `/admin/edit?buscaTermo=${encodeURIComponent(reg.ticket)}`;
                    });

                    autocompleteList.appendChild(item);
                });
            } catch (error) {
                console.error("Erro no autocomplete global:", error);
            }
        });

        document.addEventListener('click', function (e) {
            if (e.target !== buscaInput) autocompleteList.innerHTML = '';
        });
    }
});

// ==========================================
// FUNÇÃO DE EDIÇÃO MASSIVA (Disponível globalmente)
// ==========================================
window.editarSelecionados = async function () {
    const rowCheckboxes = document.querySelectorAll('.row-checkbox:checked');
    const selecionados = Array.from(rowCheckboxes).map(cb => cb.value);

    if (selecionados.length === 0) {
        alert('Por favor, selecione pelo menos um registro para editar.');
        return;
    }

    const statusSelect = document.getElementById('status_select');
    if (!statusSelect) {
        alert('Erro: O campo de status não foi encontrado na tela.');
        return;
    }
    const novoStatus = statusSelect.value;

    if (confirm(`Deseja alterar o status de ${selecionados.length} agendamento(s) para "${novoStatus}"?`)) {
        try {
            const response = await fetch('/admin/edit', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tickets: selecionados,
                    status: novoStatus
                })
            });

            if (response.ok) {
                window.location.reload();
            } else {
                alert('Erro ao atualizar os registros no banco de dados.');
            }
        } catch (error) {
            console.error("Erro na requisição:", error);
            alert('Erro de conexão ao tentar atualizar.');
        }
    }
};