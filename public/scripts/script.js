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
    // --- FUNÇÃO DE VEÍCULO ---
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

    // --- MÁSCARAS ---
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
    // --- VALIDAÇÃO DO FORMULÁRIO ---
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

            if (docSelect && docSelect.value === 'CPF' && numeroDocInput) {
                const cpfDigits = numeroDocInput.value.replace(/\D/g, '');
                if (cpfDigits.length > 0 && cpfDigits.length < 11) {
                    numeroDocInput.classList.add('input-warning');
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
    // --- LÓGICA DO MODAL (DETALHES DO ACESSO VIA API) ---
    // -----------------------------
    const modal = document.getElementById('modalPrevia');
    const modalBody = document.getElementById('modalBodyText');
    const closeBtn = document.querySelector('.modal-close');

    // EXPOSTO GLOBALMENTE PARA A CÉLULA INTEIRA CONSEGUIR CHAMAR
    window.abrirModalPrevia = async function (ticket) {
        if (!ticket) return;

        modalBody.innerHTML = '<div style="text-align:center; padding:30px; color:#666;">Buscando dados seguros...</div>';
        if (modal) modal.classList.add('active');

        try {
            const response = await fetch(`/api/modal/${ticket}`);
            if (!response.ok) throw new Error('Falha ao buscar dados');
            const data = await response.json();

            const getValue = (val) => { return (val && String(val).trim() !== '' && val !== 'null' && val !== 'undefined') ? val : '-'; };
            const formatBRDate = (dateStr) => {
                if (!dateStr || dateStr === '-' || dateStr === 'null') return '-';
                const onlyDate = String(dateStr).split(' ')[0];
                if (onlyDate.includes('-')) {
                    const parts = onlyDate.split('-');
                    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
                }
                return dateStr;
            };

            const veiculoFormatado = (data.com_veiculo === 'sim' || data.com_veiculo === 1) ? 'SIM' : 'NÃO';
            const dataSolicitacaoRaw = getValue(data.data_solicitacao) !== '-' ? getValue(data.data_solicitacao) : getValue(data.created_at);

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
                        <tr><td class="col-label">CNH</td><td>${getValue(data.cnh)}</td></tr>
                        <tr><td class="col-label">CAT. CNH</td><td>${getValue(data.cat_habilitacao)}</td></tr>
                        <tr><td class="col-label">VALIDADE CNH</td><td>${formatBRDate(data.data_vencimento_cnh)}</td></tr>
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
    };

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    }

    window.addEventListener('click', (evento) => {
        if (evento.target === modal) modal.classList.remove('active');
    });

});
// ==========================================
// === FIM: INICIALIZAÇÃO GERAL DA PÁGINA ===
// ==========================================


// ==========================================
// === INÍCIO: EDIÇÃO MASSIVA E CHECKBOXES ===
// ==========================================
window.toggleAll = function(source) {
    const checkboxes = document.querySelectorAll('.row-checkbox');
    checkboxes.forEach(cb => cb.checked = source.checked);
};

document.addEventListener('DOMContentLoaded', () => {
    const selectAllCheckbox = document.getElementById('selectAll');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            window.toggleAll(this);
        });
    }
});

// AQUI ESTÁ A FUNÇÃO CORRETA E ÚNICA DE ATUALIZAR OS SELECIONADOS
window.editarSelecionados = async function() {
    const checkboxes = document.querySelectorAll('.row-checkbox:checked');
    if (checkboxes.length === 0) {
        alert("Por favor, selecione pelo menos um registro na tabela.");
        return;
    }

    const tickets = Array.from(checkboxes).map(cb => cb.value);
    const statusSelect = document.getElementById('status_select');
    
    if(!statusSelect) return;
    const status = statusSelect.value;

    if (confirm(`Deseja alterar o status de ${tickets.length} agendamento(s) para "${status}"?`)) {
        try {
            const response = await fetch('/admin/update-massivo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ tickets: tickets, status: status })
            });

            if (response.ok) {
                window.location.reload();
            } else {
                const data = await response.json();
                alert(data.error || "Erro ao atualizar os registros.");
            }
        } catch (error) {
            console.error("Erro na requisição Fetch:", error);
            alert("Erro de conexão ao tentar atualizar os registros.");
        }
    }
};
// ==========================================
// === FIM: EDIÇÃO MASSIVA E CHECKBOXES ===
// ==========================================


// ==========================================
// === INÍCIO: FILTROS GLOBAIS DE ACESSOS (URL) ===
// ==========================================
window.aplicarFiltroAcessos = function (evento) {
    if (evento && evento.key !== 'Enter') return;

    const dataInicio = document.getElementById('filtroAcessosInicio')?.value || '';
    const dataFim = document.getElementById('filtroAcessosFim')?.value || '';
    const search = document.getElementById('buscaAcessosInput')?.value || '';

    const urlAtual = new URL(window.location.href);
    const statusFilter = urlAtual.searchParams.get('statusFilter');

    const novaUrl = new URL(window.location.href.split('?')[0]);
    if (dataInicio) novaUrl.searchParams.set('dataInicio', dataInicio);
    if (dataFim) novaUrl.searchParams.set('dataFim', dataFim);
    if (search) novaUrl.searchParams.set('search', search);
    if (statusFilter) novaUrl.searchParams.set('statusFilter', statusFilter);

    window.location.href = novaUrl.toString();
};
// ==========================================
// === FIM: FILTROS GLOBAIS DE ACESSOS ===
// ==========================================