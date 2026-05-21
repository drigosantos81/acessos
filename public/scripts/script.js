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

    const veiculoRadios = document.querySelectorAll('input[name="com_veiculo"]');
    const placaField = document.getElementById('placaField');
    const tipoField = document.getElementById('tipoField');

    // -----------------------------
    // 1. Mostrar/Ocultar Placa e Tipo
    // -----------------------------
    function toggleVeiculo() {
        const selecionado = document.querySelector('input[name="com_veiculo"]:checked');
        if (!selecionado) return;

        if (selecionado.value === 'sim') {
            placaField.classList.remove('hidden');
            tipoField.classList.remove('hidden');
        } else {
            placaField.classList.add('hidden');
            tipoField.classList.add('hidden');
        }
    }

    if (veiculoRadios.length > 0) {
        toggleVeiculo();
        veiculoRadios.forEach(r => r.addEventListener('change', toggleVeiculo));
    }

    // -----------------------------
    // 2. Máscara do Documento (CPF/Passaporte)
    // -----------------------------
    function applyDocMask() {
        if (!docSelect || !numeroDocInput) return;
        const tipo = docSelect.value;
        numeroDocInput.value = ""; // Limpa ao trocar

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
    // 4. Máscara de TELEFONE (CORRIGIDA)
    // -----------------------------
    // Adicionada a máscara no telefone principal e no contato interno (se houver)
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
    // 6. CORREÇÃO DA DATA AO ENVIAR O FORMULÁRIO
    // -----------------------------
    if (form && dataInput) {
        form.addEventListener('submit', function (e) {
            // Antes de enviar, pega o "11/05/2026" e vira "2026-05-11" pro banco de dados não inverter.
            if (dataInput.value.includes('/')) {
                const parts = dataInput.value.split('/');
                if (parts.length === 3) {
                    dataInput.value = `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
            }
        });
    }

    // ==========================================
    // LÓGICA DA PÁGINA INICIAL (Tabela Autorizados)
    // ==========================================
    const autorizados = document.querySelectorAll("td.autorizado");

    autorizados.forEach(td => {
        const valor = td.textContent.trim().toUpperCase();
        td.classList.remove("sim", "nao", "não", "pendente", "solicitado" /*"agendado"*/);

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

// ... (seu código de máscaras e formatações acima) ...

// ==========================================
// SELECIONAR TODOS OS CHECKBOXES (Protegido)
// ==========================================
document.addEventListener('DOMContentLoaded', function () {
    const selectAllCheckbox = document.getElementById('selectAll');
    const rowCheckboxes = document.querySelectorAll('.row-checkbox');

    // Só adiciona o evento se o checkbox "selectAll" existir na página atual
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function () {
            rowCheckboxes.forEach(checkbox => {
                checkbox.checked = selectAllCheckbox.checked;
            });
        });
    }
});

// ==========================================
// AUTOCOMPLETE GLOBAL (ALFABÉTICO) E FILTROS DA TELA (PADRÃO)
// ==========================================
document.addEventListener('DOMContentLoaded', function () {
    const statusFilters = document.querySelectorAll('.status-filter');
    const buscaInput = document.getElementById('buscaNome');
    const autocompleteList = document.getElementById('autocomplete-list');
    const tableRows = document.querySelectorAll('.table-container tbody tr');

    // Filtro local rápido para os Checkboxes de Status
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

    // Motor do Autocomplete
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
                // Busca na API (retorna ordenado por Nome Alfabético e Ticket)
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

                    // Monta o item visual da lista suspensa
                    item.innerHTML = `<span style="color:#00BEDD; font-weight:bold;">[${textoTicket}]</span> ${textoNome} <span style="color:#888; font-size:11px;">(${textoCPF})</span>`;

                    // Ao clicar, recarrega passando o Ticket. O backend vai ler o Ticket e ordenar a tela por Autorizado/Data/Ticket!
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
    console.log("O botão de Editar Selecionados foi clicado!"); // Teste de vida

    // 1. Coleta os tickets marcados
    const rowCheckboxes = document.querySelectorAll('.row-checkbox:checked');
    const selecionados = Array.from(rowCheckboxes).map(cb => cb.value);

    if (selecionados.length === 0) {
        alert('Por favor, selecione pelo menos um registro para editar.');
        return;
    }

    // 2. Pega o status selecionado (SIM, NÃO, PENDENTE)
    const statusSelect = document.getElementById('status_select');
    if (!statusSelect) {
        alert('Erro: O campo de status não foi encontrado na tela.');
        return;
    }
    const novoStatus = statusSelect.value;

    // 3. Confirmação de segurança
    if (confirm(`Deseja alterar o status de ${selecionados.length} agendamento(s) para "${novoStatus}"?`)) {
        try {
            // 4. Envia para o Backend
            const response = await fetch('/admin/edit', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tickets: selecionados,
                    status: novoStatus
                })
            });

            if (response.ok) {
                window.location.reload(); // Recarrega a página se der certo
            } else {
                alert('Erro ao atualizar os registros no banco de dados.');
            }
        } catch (error) {
            console.error("Erro na requisição:", error);
            alert('Erro de conexão ao tentar atualizar.');
        }
    }
};