// ==========================================
// === INÍCIO: MÁSCARAS E FUNÇÕES AUXILIARES ===
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
// === FIM: MÁSCARAS E FUNÇÕES AUXILIARES ===
// ==========================================



// ==========================================
// === INÍCIO: INICIALIZAÇÃO GERAL DA PÁGINA ===
// ==========================================
document.addEventListener('DOMContentLoaded', function () {

    // --- ELEMENTOS DO FORMULÁRIO ---
    const form = document.getElementById('meuForm') || document.getElementById('editForm');
    const numeroDocInput = document.getElementById('numero_doc_input');
    const docSelect = document.getElementById('doc_nacional_select');
    const dataInput = document.getElementById('data_input');
    const qtdDiasInput = document.getElementById('qtd_dias_input');
    const telefoneInput = document.getElementById('telefone_input');
    const contatoTeconInput = document.getElementById('tel_interno_input');

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
    // --- INÍCIO: FUNÇÃO DE VEÍCULO ---
    // -----------------------------
    function toggleVeiculo() {
        const selecionado = document.querySelector('input[name="com_veiculo"]:checked');
        if (!selecionado || !placaField || !tipoField || !cnhField || !catHabField || !validadeCnhField) return;

        if (selecionado.value === 'sim') {
            placaField.classList.remove('hidden');
            tipoField.classList.remove('hidden');
            cnhField.classList.remove('hidden');
            catHabField.classList.remove('hidden');
            validadeCnhField.classList.remove('hidden');

            if (inputPlaca) inputPlaca.setAttribute('required', 'true');
            if (inputCnh) inputCnh.setAttribute('required', 'true');
            if (inputCatHab) inputCatHab.setAttribute('required', 'true');
            if (inputValidadeCnh) inputValidadeCnh.setAttribute('required', 'true');
            radiosTipoVeiculo.forEach(r => r.setAttribute('required', 'true'));
        } else {
            placaField.classList.add('hidden');
            tipoField.classList.add('hidden');
            cnhField.classList.add('hidden');
            catHabField.classList.add('hidden');
            validadeCnhField.classList.add('hidden');

            if (inputPlaca) { inputPlaca.value = ''; inputPlaca.removeAttribute('required'); inputPlaca.classList.remove('input-error', 'input-warning'); }
            if (inputCnh) { inputCnh.value = ''; inputCnh.removeAttribute('required'); inputCnh.classList.remove('input-error', 'input-warning'); }
            if (inputCatHab) { inputCatHab.value = ''; inputCatHab.removeAttribute('required'); inputCatHab.classList.remove('input-error', 'input-warning'); }
            if (inputValidadeCnh) { inputValidadeCnh.value = ''; inputValidadeCnh.removeAttribute('required'); inputValidadeCnh.classList.remove('input-error', 'input-warning'); }

            radiosTipoVeiculo.forEach(r => { r.checked = false; r.removeAttribute('required'); });
        }
    }

    if (veiculoRadios.length > 0) {
        toggleVeiculo();
        veiculoRadios.forEach(radio => radio.addEventListener('change', toggleVeiculo));
    }
    // -----------------------------
    // --- FIM: FUNÇÃO DE VEÍCULO ---
    // -----------------------------


    // Aplicação de máscaras automáticas nos campos
    if (inputCatHab) inputCatHab.addEventListener('input', function () { this.value = this.value.toUpperCase().replace(/[^A-Z]/g, ""); });
    if (inputValidadeCnh) inputValidadeCnh.addEventListener('input', function () { this.value = formatDate(this.value); });
    if (inputPlaca) inputPlaca.addEventListener('input', function () { this.value = this.value.toUpperCase(); });

    function applyDocMask() {
        if (!docSelect || !numeroDocInput) return;
        const tipo = docSelect.value;
        if (tipo === "CPF") {
            numeroDocInput.placeholder = "000.000.000-00";
            numeroDocInput.setAttribute("maxlength", "14");
            numeroDocInput.setAttribute("inputmode", "numeric");
            numeroDocInput.value = formatCPF(numeroDocInput.value);
        } else {
            numeroDocInput.placeholder = tipo;
            numeroDocInput.setAttribute("maxlength", "20");
            numeroDocInput.setAttribute("inputmode", "text");
        }
    }

    if (docSelect) {
        applyDocMask();
        docSelect.addEventListener("change", () => {
            numeroDocInput.value = "";
            applyDocMask();
        });

        numeroDocInput.addEventListener("input", () => {
            if (docSelect.value === "CPF") {
                numeroDocInput.value = formatCPF(numeroDocInput.value);
            } else {
                let v = numeroDocInput.value.replace(/[^a-zA-Z0-9]/g, "");
                numeroDocInput.value = v.toUpperCase().slice(0, 20);
            }
        });
    }

    if (dataInput) dataInput.addEventListener('input', function () { dataInput.value = formatDate(dataInput.value); });
    [telefoneInput, contatoTeconInput].forEach(input => {
        if (input) input.addEventListener('input', function () { input.value = formatPhone(input.value); });
    });
    if (qtdDiasInput) qtdDiasInput.addEventListener('input', function () { qtdDiasInput.value = onlyDigits(qtdDiasInput.value).slice(0, 2); });


    // -----------------------------
    // --- INÍCIO: VALIDAÇÃO DO FORMULÁRIO ---
    // -----------------------------
    if (form) {
        form.addEventListener('submit', function (event) {
            let temErroVazio = false;
            let temErroInvalido = false;
            let mensagemInvalida = "";

            const camposObrigatorios = form.querySelectorAll('input[required]');
            camposObrigatorios.forEach(campo => {
                if (campo.hasAttribute('readonly') || campo.hasAttribute('disabled')) return;

                if (campo.type !== 'radio' && campo.value.trim() === "") {
                    campo.classList.add('input-error');
                    temErroVazio = true;
                }
            });

            const justificativaMarcada = document.querySelector('input[name="justificativa"]:checked');
            const caixaJustificativa = document.getElementById('caixa_justificativa');
            const isJustificativaHabilitada = caixaJustificativa && !caixaJustificativa.style.pointerEvents;

            if (isJustificativaHabilitada && !justificativaMarcada) {
                caixaJustificativa.classList.add('input-error');
                temErroVazio = true;
            }

            const radiosTipoVal = document.querySelectorAll('input[name="tipo_veiculo"]');
            const isTipoVeiculoRequired = radiosTipoVal.length > 0 && radiosTipoVal[0].hasAttribute('required');
            const tipoVeiculoMarcado = document.querySelector('input[name="tipo_veiculo"]:checked');
            const caixaTipoVeiculo = document.getElementById('caixa_tipo_veiculo');

            if (isTipoVeiculoRequired && !tipoVeiculoMarcado) {
                if (caixaTipoVeiculo) caixaTipoVeiculo.classList.add('input-error');
                temErroVazio = true;
            }

            if (telefoneInput && telefoneInput.value.trim() !== "") {
                const numTelefone = telefoneInput.value.replace(/\D/g, '');
                if (numTelefone.length < 10) {
                    telefoneInput.classList.add('input-warning');
                    temErroInvalido = true;
                    mensagemInvalida = "O telefone deve ter pelo menos 10 dígitos com o DDD.";
                }
            }

            // Validação de CPF (Front-end)
            const docSelect = document.getElementById('doc_nacional_select');
            const numeroDocInput = document.getElementById('numero_doc_input');

            if (docSelect && docSelect.value === 'CPF' && numeroDocInput) {
                const cpfDigits = numeroDocInput.value.replace(/\D/g, '');
                // Só barra se ele digitou algo, mas não completou os 11 dígitos
                if (cpfDigits.length > 0 && cpfDigits.length < 11) {
                    numeroDocInput.classList.add('input-warning'); // Borda amarela/vermelha
                    temErroInvalido = true;
                    mensagemInvalida = "O CPF informado deve conter exatamente 11 dígitos.";
                }
            }

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
    }
    // -----------------------------
    // --- FIM: VALIDAÇÃO DO FORMULÁRIO ---
    // -----------------------------


    // -----------------------------
    // --- INÍCIO: ESTILIZAÇÃO DA TABELA (Cores Status) ---
    // -----------------------------
    const autorizados = document.querySelectorAll("td.autorizado");
    autorizados.forEach(td => {
        const valor = td.textContent.trim().toUpperCase();
        td.classList.remove("sim", "nao", "não", "pendente", "solicitado");
        let icon = "";
        if (valor === "SIM") { td.classList.add("sim"); icon = '<i class="fa-solid fa-circle-check"></i>'; }
        else if (valor === "NÃO" || valor === "NAO") { td.classList.add("nao"); icon = '<i class="fa-solid fa-circle-xmark"></i>'; }
        else if (valor === "PENDENTE") { td.classList.add("pendente"); icon = '<i class="fa-solid fa-circle-exclamation"></i>'; }
        else if (valor === "SOLICITADO") { td.classList.add("solicitado"); icon = '<i class="fa-solid fa-circle-pause"></i>'; }
        td.innerHTML = icon + " " + valor;
    });
    // -----------------------------
    // --- FIM: ESTILIZAÇÃO DA TABELA ---
    // -----------------------------


    // -----------------------------
    // --- INÍCIO: LÓGICA DO MODAL (DETALHES DO ACESSO VIA API) ---
    // -----------------------------
    const modal = document.getElementById('modalPrevia');
    const modalBody = document.getElementById('modalBodyText');
    const closeBtn = document.querySelector('.modal-close');
    const previaLinks = document.querySelectorAll('.td-previa span');

    previaLinks.forEach(link => {
        link.addEventListener('click', async (evento) => {
            evento.stopPropagation();
            const td = link.closest('td');
            const ticket = td.getAttribute('data-ticket');

            if (!ticket) return;

            // 1. Abre o modal com mensagem de carregamento
            modalBody.innerHTML = '<div style="text-align:center; padding:30px; color:#666;">Buscando dados seguros...</div>';
            if (modal) modal.classList.add('active');

            try {
                // 2. Busca os dados no servidor
                const response = await fetch(`/api/modal/${ticket}`);
                if (!response.ok) throw new Error('Falha ao buscar dados');

                const data = await response.json();

                // Função auxiliar para tratar dados vazios
                const getValue = (val) => {
                    return (val && String(val).trim() !== '' && val !== 'null' && val !== 'undefined') ? val : '-';
                };

                // Formatar Data para o Padrão Brasil (DD/MM/AAAA)
                const formatBRDate = (dateStr) => {
                    if (!dateStr || dateStr === '-' || dateStr === 'null') return '-';
                    const onlyDate = String(dateStr).split(' ')[0]; // Garante que pega só a data, sem as horas se houver
                    if (onlyDate.includes('-')) {
                        const parts = onlyDate.split('-');
                        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
                    }
                    return dateStr;
                };

                // Lógicas condicionais
                const veiculoFormatado = (data.com_veiculo === 'sim' || data.com_veiculo === 1) ? 'SIM' : 'NÃO';
                const dataSolicitacaoRaw = getValue(data.data_solicitacao) !== '-' ? getValue(data.data_solicitacao) : getValue(data.created_at);

                // 3. Monta a tabela exata com os nomes e formatações solicitadas
                const htmlConteudo = `
                    <table class="modal-table">
                        <tbody>
                            <tr><td class="col-label">TICKET</td><td>${getValue(data.ticket)}</td></tr>
                            <tr><td class="col-label">NOME COMPLETO</td><td>${getValue(data.nome)}</td></tr>
                            <tr><td class="col-label">DOCUMENTO</td><td>${getValue(data.doc_nacional)}</td></tr>
                            <tr><td class="col-label">Nº DOCUMENTO</td><td>${getValue(data.numero_doc)}</td></tr>
                            
                            <tr><td class="col-label">EMPRESA</td><td>${getValue(data.empresa)}</td></tr>
                            
                            <tr><td class="col-label">DATA DO ACESSO</td><td>${formatBRDate(data.data_do_acesso)}</td></tr>
                            <tr><td class="col-label">QTD. DE DIAS</td><td>${getValue(data.qtd_dias)}</td></tr>
                            <tr><td class="col-label">DATA LIMITE</td><td>${formatBRDate(data.data_limite)}</td></tr>
                            
                            <tr><td class="col-label">COM VEÍCULO?</td><td>${veiculoFormatado}</td></tr>
                            <tr><td class="col-label">PLACA</td><td>${getValue(data.placa)}</td></tr>
                            <tr><td class="col-label">TIPO VEÍCULO</td><td>${getValue(data.tipo_veiculo)}</td></tr>
                            
                            <tr><td class="col-label">JUSTIFICATIVA</td><td>${getValue(data.justificativa)}</td></tr>
                            <tr><td class="col-label">PORTÃO</td><td>${getValue(data.portoes)}</td></tr>
                            <tr><td class="col-label">SETOR DA VISITA</td><td>${getValue(data.setor_nome)}</td></tr>
                            
                            <tr><td class="col-label">SOLICITANTE</td><td>${getValue(data.user_name)}</td></tr>
                            
                            <tr><td class="col-label">DATA DA SOLICITAÇÃO</td><td>${formatBRDate(dataSolicitacaoRaw)}</td></tr>
                            <tr><td class="col-label">DATA DE ENCERRAMENTO</td><td>${formatBRDate(data.data_encerramento)}</td></tr>
                            <tr><td class="col-label">ÚLTIMA ATUALIZAÇÃO</td><td>${formatBRDate(data.updated_at)}</td></tr>
                        </tbody>
                    </table>
                `;

                modalBody.innerHTML = htmlConteudo;

            } catch (error) {
                console.error(error);
                modalBody.innerHTML = '<div style="text-align:center; padding:30px; color:red;">Erro ao carregar os dados.</div>';
            }
        });
    });

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    }

    window.addEventListener('click', (evento) => {
        if (evento.target === modal) modal.classList.remove('active');
    });
    // -----------------------------
    // --- FIM: LÓGICA DO MODAL ---
    // -----------------------------


    // -----------------------------
    // --- INÍCIO: REDIRECIONAMENTO DE LINHA (CLICAR NA TABELA) ---
    // -----------------------------
    const tableRows = document.querySelectorAll('.table-container tbody tr');
    tableRows.forEach(row => {
        row.addEventListener('click', (evento) => {
            // Ignora o clique se foi no checkbox/radio button ou num botão
            if (evento.target.tagName === 'INPUT' && (evento.target.type === 'checkbox' || evento.target.type === 'radio')) return;
            if (evento.target.tagName === 'BUTTON') return;

            const ticket = row.getAttribute('data-ticket');
            if (ticket) {
                window.location.href = `/visualizar/${ticket}`;
            }
        });
    });
    // -----------------------------
    // --- FIM: REDIRECIONAMENTO DE LINHA ---
    // -----------------------------

});
// ==========================================
// === FIM: INICIALIZAÇÃO GERAL DA PÁGINA ===
// ==========================================



// ==========================================
// === INÍCIO: SELECIONAR TODOS OS CHECKBOXES ===
// ==========================================
document.addEventListener('DOMContentLoaded', function () {
    const selectAllCheckbox = document.getElementById('selectAll');
    const rowCheckboxes = document.querySelectorAll('.row-checkbox');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function () {
            rowCheckboxes.forEach(checkbox => checkbox.checked = selectAllCheckbox.checked);
        });
    }
});
// ==========================================
// === FIM: SELECIONAR TODOS OS CHECKBOXES ===
// ==========================================



// ==========================================
// === INÍCIO: AUTOCOMPLETE GLOBAL E FILTROS DA TELA ===
// ==========================================
document.addEventListener('DOMContentLoaded', function () {
    const statusFilters = document.querySelectorAll('.status-filter');
    const buscaInput = document.getElementById('buscaNome');
    const autocompleteList = document.getElementById('autocomplete-list');
    const tableRows = document.querySelectorAll('.table-container tbody tr');

    function filtrarTabelaLocalmente() {
        if (tableRows.length === 0) return;
        const statusPermitidos = Array.from(document.querySelectorAll('.status-filter:checked')).map(cb => cb.value.toUpperCase());
        const termo = buscaInput ? buscaInput.value.trim().toLowerCase() : '';
        const termoLimpo = termo.replace(/\D/g, '');

        tableRows.forEach(row => {
            const celulaAutorizado = row.querySelector('.autorizado');
            const colunas = row.querySelectorAll('td');
            if (!celulaAutorizado || colunas.length < 4) return;

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
                const passouNoTermo = ticketDaLinha.includes(termo) || nomeDaLinha.includes(termo) || cpfDaLinha.includes(termo) || (termoLimpo && cpfLimpo.includes(termoLimpo));

                if (passouNoStatus && passouNoTermo) row.style.display = '';
                else row.style.display = 'none';
            }
        });
    }

    statusFilters.forEach(checkbox => checkbox.addEventListener('change', filtrarTabelaLocalmente));

    if (buscaInput && autocompleteList) {
        buscaInput.addEventListener('input', async function () {
            const valorDigitado = this.value.trim();
            autocompleteList.innerHTML = '';
            if (!valorDigitado) {
                filtrarTabelaLocalmente();
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
                        window.location.href = `/visualizar/${encodeURIComponent(reg.ticket)}`;
                    });
                    autocompleteList.appendChild(item);
                });
            } catch (error) { console.error("Erro no autocomplete:", error); }
        });
        document.addEventListener('click', function (e) { if (e.target !== buscaInput) autocompleteList.innerHTML = ''; });
    }
});
// ==========================================
// === FIM: AUTOCOMPLETE GLOBAL E FILTROS DA TELA ===
// ==========================================



// ==========================================
// === INÍCIO: FUNÇÃO DE EDIÇÃO MASSIVA ===
// ==========================================
window.editarSelecionados = async function () {
    const rowCheckboxes = document.querySelectorAll('.row-checkbox:checked');
    const selecionados = Array.from(rowCheckboxes).map(cb => cb.value);

    if (selecionados.length === 0) { alert('Por favor, selecione pelo menos um registro para editar.'); return; }

    const statusSelect = document.getElementById('status_select');
    if (!statusSelect) return;

    const novoStatus = statusSelect.value;
    if (confirm(`Deseja alterar o status de ${selecionados.length} agendamento(s) para "${novoStatus}"?`)) {
        try {
            const response = await fetch('/admin/edit', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tickets: selecionados, status: novoStatus })
            });
            if (response.ok) window.location.reload();
            else alert('Erro ao atualizar os registros.');
        } catch (error) { alert('Erro de conexão.'); }
    }
};
// ==========================================
// === FIM: FUNÇÃO DE EDIÇÃO MASSIVA ===
// ==========================================

// ==========================================
// === INÍCIO: FILTRO DE DATAS DA PÁGINA INICIAL ===
// ==========================================
document.addEventListener('DOMContentLoaded', function () {
    // Verifica se estamos na página index (que possui o input de data específico)
    const dateInput = document.querySelector('.header-page input[type="date"]');

    // Se o input não existir na página atual, aborta o script para não gerar erros
    if (!dateInput) return;

    const tableRows = document.querySelectorAll('.table-container tbody tr');

    // 1. Preencher com a data de hoje por padrão ao carregar
    if (!dateInput.value) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${yyyy}-${mm}-${dd}`;
    }

    // 2. Função para filtrar a tabela visualmente
    function filterTableByDate() {
        const filterDateVal = dateInput.value;
        if (!filterDateVal) return;

        // Cria a data de filtro (forçando 00:00:00 para evitar erro de fuso horário)
        const filterDate = new Date(filterDateVal + 'T00:00:00');

        tableRows.forEach(row => {
            const cols = row.querySelectorAll('td');
            // Garante que a linha tem colunas suficientes antes de processar
            if (cols.length < 8) return;

            const dataFinalStr = cols[3].innerText.trim(); // Coluna Data Final

            // Converter a 'Data Final' (DD/MM/AAAA) da tabela para objeto Date do JS
            const [diaF, mesF, anoF] = dataFinalStr.split('/');
            const dataFinal = new Date(`${anoF}-${mesF}-${diaF}T00:00:00`);

            // Se a data pesquisada for menor ou igual à data limite do pedido, exibe a linha
            if (filterDate <= dataFinal) {
                row.style.display = '';
            } else {
                row.style.display = 'none'; // Esconde se já passou do prazo
            }
        });
    }

    // Executa a validação imediatamente e toda vez que a data for alterada
    filterTableByDate();
    dateInput.addEventListener('change', filterTableByDate);
});
// ==========================================
// === FIM: FILTRO DE DATAS DA PÁGINA INICIAL ===
// ==========================================



// ==========================================
// FILTRO COM TECLA ENTER (PÁGINA INICIAL)
// ==========================================
document.addEventListener('DOMContentLoaded', function () {
    const buscaIndex = document.getElementById('buscaIndex');

    if (buscaIndex) {
        buscaIndex.addEventListener('keypress', function (evento) {
            // Se a tecla pressionada for Enter
            if (evento.key === 'Enter') {
                evento.preventDefault(); // Evita recarregar a tela

                const termo = this.value.trim().toLowerCase();
                const linhasDaTabela = document.querySelectorAll('.table-container tbody tr');

                linhasDaTabela.forEach(linha => {
                    const textoDaLinha = linha.innerText.toLowerCase();
                    // Se o texto da linha contiver o termo digitado, exibe, senão, oculta
                    if (textoDaLinha.includes(termo)) {
                        linha.style.display = '';
                    } else {
                        linha.style.display = 'none';
                    }
                });
            }
        });
    }
});