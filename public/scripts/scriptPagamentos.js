document.addEventListener('DOMContentLoaded', () => {

    // ========================================================
    // 1. DASHBOARD - GRÁFICO CHART.JS (Com Plugin CenterText)
    // ========================================================
    const ctx = document.getElementById('myChart');
    if (ctx) {
        const statsData = {
            solicitado: parseInt(ctx.getAttribute('data-solicitado'), 10) || 0,
            pendente: parseInt(ctx.getAttribute('data-pendente'), 10) || 0
        };

        const total = statsData.solicitado + statsData.pendente;

        if (total === 0) {
            const container = ctx.parentElement;
            container.innerHTML = '<p style="color: #64748b; margin-top: 80px; text-align:center; font-size: 14px; font-weight: bold;">Nenhum lançamento pendente neste período.</p>';
        } else {
            if (typeof Chart !== 'undefined') {
                new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: [`Solicitado (${statsData.solicitado})`, `Pendente (${statsData.pendente})`],
                        datasets: [{
                            data: [statsData.solicitado, statsData.pendente],
                            backgroundColor: ['#007bff', '#eab308'],
                            borderWidth: 0, // Sem bordas para um visual mais limpo
                            hoverOffset: 4
                        }]
                    },
                    options: {
                        cutout: '80%', // Fatias super finas conforme o modelo
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { 
                                position: 'right', // Legendas empilhadas na direita
                                labels: { padding: 15, font: { size: 12 }, usePointStyle: true } 
                            },
                            centerText: { text: total.toString(), label: 'Lançamentos' } // Plugin customizado abaixo
                        }
                    },
                    plugins: [{
                        id: 'centerText',
                        beforeDraw: function(chart) {
                            var width = chart.width, height = chart.height, ctx = chart.ctx;
                            ctx.restore();
                            
                            // Calcula o centro APENAS da área do anel (ignorando o espaço da legenda)
                            const chartArea = chart.chartArea;
                            const centerX = (chartArea.left + chartArea.right) / 2;
                            const centerY = (chartArea.top + chartArea.bottom) / 2;

                            // Número principal (Total)
                            var fontSize = (height / 80).toFixed(2);
                            ctx.font = "bold " + fontSize + "em sans-serif";
                            ctx.textBaseline = "middle";
                            ctx.fillStyle = "#333";
                            var text = chart.config.options.plugins.centerText.text;
                            var textX = centerX - (ctx.measureText(text).width / 2);
                            var textY = centerY - 10;
                            ctx.fillText(text, textX, textY);

                            // Subtítulo
                            var fontSizeLabel = (height / 200).toFixed(2);
                            ctx.font = fontSizeLabel + "em sans-serif";
                            ctx.fillStyle = "#888";
                            var label = chart.config.options.plugins.centerText.label;
                            var labelX = centerX - (ctx.measureText(label).width / 2);
                            var labelY = centerY + 15;
                            ctx.fillText(label, labelX, labelY);
                            ctx.save();
                        }
                    }]
                });
            } else {
                console.error("Erro: A biblioteca Chart.js não foi carregada no HTML.");
            }
        }
    }

    // ========================================================
    // 2. BOTÃO VOLTAR
    // ========================================================
    const btnBackElements = document.querySelectorAll('.btn-back-action');
    btnBackElements.forEach(btn => {
        btn.addEventListener('click', (event) => {
            event.preventDefault();
            window.history.back();
        });
    });

    // ========================================================
    // 3. CONTROLE DO MODAL DE PDF
    // ========================================================
    const modalPdf = document.getElementById('modalVisualizadorPdf');
    const iframePdf = document.getElementById('iframeVisualizador');
    const btnsOpenPdf = document.querySelectorAll('.btn-open-pdf');
    const btnClosePdf = document.querySelector('.btn-close-pdf');

    if (modalPdf && iframePdf) {
        btnsOpenPdf.forEach(btn => {
            btn.addEventListener('click', () => {
                const url = btn.getAttribute('data-url');
                if (url) {
                    iframePdf.src = url;
                    modalPdf.classList.add('active');
                }
            });
        });

        if (btnClosePdf) {
            btnClosePdf.addEventListener('click', () => {
                iframePdf.src = '';
                modalPdf.classList.remove('active');
            });
        }
    }
});

// ========================================================
// 4. ORDENAÇÃO DE TABELA (SETAS)
// ========================================================
document.addEventListener('DOMContentLoaded', () => {

    const getCellValue = (tr, idx) => tr.children[idx].innerText || tr.children[idx].textContent;

    // Converte datas PT-BR (DD/MM/YYYY) para sortable YYYYMMDD
    const parseData = (val) => {
        if (!val.includes('/')) return val;
        const [d, m, y] = val.split('/');
        return `${y}${m}${d}`;
    };

    const comparer = (idx, asc, type) => (a, b) => {
        const v1 = getCellValue(asc ? a : b, idx).trim();
        const v2 = getCellValue(asc ? b : a, idx).trim();

        if (type === 'numeric') {
            return parseFloat(v1.replace('R$', '').replace(/\./g, '').replace(',', '.')) - parseFloat(v2.replace('R$', '').replace(/\./g, '').replace(',', '.'));
        } else if (type === 'date') {
            return parseData(v1).localeCompare(parseData(v2));
        } else {
            return v1.localeCompare(v2);
        }
    };

    document.querySelectorAll('th.sortable').forEach(th => th.addEventListener('click', function () {
        const table = th.closest('table');
        const tbody = table.querySelector('tbody');
        const type = this.getAttribute('data-sort') || 'text';
        const asc = !this.classList.contains('asc');

        table.querySelectorAll('th.sortable').forEach(header => {
            header.classList.remove('asc', 'desc');
            header.querySelector('i').className = 'fa-solid fa-sort';
        });

        this.classList.add(asc ? 'asc' : 'desc');
        this.querySelector('i').className = asc ? 'fa-solid fa-sort-up' : 'fa-solid fa-sort-down';

        Array.from(tbody.querySelectorAll('tr'))
            .sort(comparer(Array.from(th.parentNode.children).indexOf(th), asc, type))
            .forEach(tr => tbody.appendChild(tr));
    }));

});

// ========================================================
// 5. FUNÇÕES DE TOGGLE (FORMULÁRIOS CONDICIONAIS)
// ========================================================
window.togglePagamentos = function () {
    const tipoBoleto = document.querySelector('input[name="tipo_pagamento"][value="Boleto"]')?.checked;
    const boxBoleto = document.getElementById('box_boleto');
    const inputBoleto = document.getElementById('input_boleto');

    if (boxBoleto && inputBoleto) {
        if (tipoBoleto) {
            boxBoleto.style.display = 'block';
            inputBoleto.setAttribute('required', 'true');
        } else {
            boxBoleto.style.display = 'none';
            inputBoleto.removeAttribute('required');
            inputBoleto.value = "";
        }
    }

    const entregueSim = document.querySelector('input[name="servico_material_entregue"][value="SIM"]')?.checked;
    const boxMes = document.getElementById('box_mes');
    const inputMes = document.getElementById('mes_input');

    if (boxMes && inputMes) {
        if (entregueSim) {
            boxMes.style.display = 'block';
            inputMes.setAttribute('required', 'true');
        } else {
            boxMes.style.display = 'none';
            inputMes.removeAttribute('required');
            inputMes.value = "";
        }
    }
};

window.toggleObservacao = function () {
    const statusSelect = document.getElementById('status_select');
    const obsBox = document.getElementById('box_observacao');
    const obsInput = document.getElementById('observacao_input');

    if (statusSelect && obsBox && obsInput) {
        if (statusSelect.value === 'PENDENTE' || statusSelect.value === 'CANCELADO') {
            obsBox.style.display = 'block';
            obsInput.setAttribute('required', 'true');
        } else {
            obsBox.style.display = 'none';
            obsInput.removeAttribute('required');
            obsInput.value = ''; // Limpa se mudar para status normal
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa o estado dos inputs se a página possuir formulários
    if (document.getElementById('formPagamento')) {
        window.togglePagamentos();
        window.toggleObservacao();
    }

    // Máscara CNPJ
    const cnpjInput = document.getElementById('cnpj_input');
    if (cnpjInput) {
        cnpjInput.addEventListener('input', function () {
            let v = this.value.replace(/\D/g, "");
            v = v.replace(/^(\d{2})(\d)/, "$1.$2");
            v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
            v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
            v = v.replace(/(\d{4})(\d)/, "$1-$2");
            this.value = v;
        });
    }

    // Máscara de Moeda (Valor)
    const valorInput = document.getElementById('valor_input');
    if (valorInput) {
        valorInput.addEventListener('input', function () {
            let v = this.value.replace(/\D/g, "");
            if (v) {
                v = (parseInt(v) / 100).toFixed(2) + '';
                v = v.replace(".", ",");
                v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
                this.value = "R$ " + v;
            }
        });
    }

    // Bloqueio de data retroativa apenas no "Novo Lançamento" (dataVencimentoInput sem valor)
    const dataVencimentoInput = document.getElementById('data_vencimento');
    if (dataVencimentoInput && !dataVencimentoInput.value) {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const dia = String(hoje.getDate()).padStart(2, '0');
        dataVencimentoInput.setAttribute('min', `${ano}-${mes}-${dia}`);
    }

    // Alertas de validação customizada
    const formPagamento = document.getElementById('formPagamento');
    if (formPagamento) {
        formPagamento.addEventListener('submit', function (event) {
            let temErro = false;
            const camposObrigatorios = formPagamento.querySelectorAll('[required]');

            camposObrigatorios.forEach(campo => {
                if (campo.value.trim() === "") {
                    campo.classList.add('input-error');
                    temErro = true;
                } else {
                    campo.classList.remove('input-error');
                }
            });

            if (temErro) {
                event.preventDefault(); 
                const msgAntigas = document.querySelectorAll('.messages');
                msgAntigas.forEach(m => m.remove());

                const divMsg = document.createElement('div');
                divMsg.classList.add('messages', 'error');
                divMsg.textContent = "Existem campos obrigatórios vazios.";
                document.body.prepend(divMsg);
            }
        });

        // Limpa borda vermelha ao preencher
        const todosInputs = formPagamento.querySelectorAll('input, select');
        todosInputs.forEach(input => {
            input.addEventListener('input', () => {
                if (input.hasAttribute('required') && input.value.trim() !== '') {
                    input.classList.remove('input-error');
                }
            });
            input.addEventListener('change', () => {
                if (input.hasAttribute('required') && input.value.trim() !== '') {
                    input.classList.remove('input-error');
                }
            });
        });
    }
});

// ========================================================
// 6. RECARGA DE PÁGINA (FILTROS GLOBAIS DE DATA E EMPRESA)
// ========================================================
window.aplicarFiltroDataGlobal = function () {
    const dataInicio = document.getElementById('filtroDataInicio')?.value || '';
    const dataFim = document.getElementById('filtroDataFim')?.value || '';

    // Lê os checkboxes renderizados no dashboard.html ou index.html
    const checkboxes = document.querySelectorAll('.filtro-empresa-cb');
    let empresas = '';
    if (checkboxes.length > 0) {
        empresas = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value).join(',');
    } else {
        // Fallback: se não estiver numa tela que os tem (ex: /form), lê da URL
        const urlParams = new URLSearchParams(window.location.search);
        empresas = urlParams.get('empresas') || '';
    }

    const urlAtual = new URL(window.location.href.split('?')[0]); // Tira parâmetros antigos
    if (dataInicio) urlAtual.searchParams.set('dataInicio', dataInicio);
    if (dataFim) urlAtual.searchParams.set('dataFim', dataFim);
    if (empresas) urlAtual.searchParams.set('empresas', empresas);

    window.location.href = urlAtual.toString();
};

// ========================================================
// 7. BUSCA INTELIGENTE NA TABELA
// ========================================================
document.addEventListener('DOMContentLoaded', () => {
    const inputBuscaGlobal = document.getElementById('buscaTabelaGlob');

    if (inputBuscaGlobal) {
        inputBuscaGlobal.addEventListener('input', function () {
            const termo = this.value.toLowerCase().trim();
            const linhasDaTabela = document.querySelectorAll('#tabelaPagamentos tbody tr');

            linhasDaTabela.forEach(row => {
                if (row.classList.contains('colspan-row')) return; 

                const ticket = row.children[0]?.textContent.toLowerCase() || '';
                const notaDoc = row.children[2]?.textContent.toLowerCase() || '';
                const fornecedor = row.children[3]?.textContent.toLowerCase() || '';
                const pedido = row.getAttribute('data-pedido')?.toLowerCase() || '';

                if (ticket.includes(termo) || notaDoc.includes(termo) || fornecedor.includes(termo) || pedido.includes(termo)) {
                    row.style.display = ''; 
                } else {
                    row.style.display = 'none'; 
                }
            });
        });
    }
});