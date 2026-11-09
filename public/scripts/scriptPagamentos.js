document.addEventListener('DOMContentLoaded', () => {
    
    // ========================================================
    // 1. DASHBOARD - GRÁFICO CHART.JS
    // ========================================================
    const ctx = document.getElementById('myChart');
    if (ctx) {
        const statsData = {
            solicitado: parseInt(ctx.getAttribute('data-solicitado'), 10) || 0,
            pendente: parseInt(ctx.getAttribute('data-pendente'), 10) || 0,
            confirmado: parseInt(ctx.getAttribute('data-confirmado'), 10) || 0,
            cancelado: parseInt(ctx.getAttribute('data-cancelado'), 10) || 0
        };

        const total = statsData.solicitado + statsData.pendente + statsData.confirmado + statsData.cancelado;

        if (total === 0) {
            const container = ctx.parentElement;
            container.innerHTML = '<p style="color: #64748b; margin-top: 150px; font-size: 15px; font-weight: bold;">Nenhum pagamento registrado no Tecon.</p>';
        } else {
            // Verifica se a biblioteca Chart.js foi carregada
            if (typeof Chart !== 'undefined') {
                new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Solicitado', 'Pendente', 'Confirmado', 'Cancelado'],
                        datasets: [{
                            data: [
                                statsData.solicitado, 
                                statsData.pendente, 
                                statsData.confirmado, 
                                statsData.cancelado
                            ],
                            backgroundColor: ['#007bff', '#eab308', '#16a34a', '#dc2626'],
                            borderWidth: 2,
                            borderColor: '#ffffff'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom', labels: { padding: 20, font: { size: 13 } } }
                        }
                    }
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

// Ordenação e Filtros
document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. FILTRO DE CHECKBOXES POR EMPRESA ---
    const checkboxes = document.querySelectorAll('.filtro-empresa-cb');
    const rows = document.querySelectorAll('#tabelaPagamentos tbody tr');

    function aplicarFiltro() {
        if(rows.length === 0 || !rows[0].hasAttribute('data-empresa')) return;
        const permitidos = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
        rows.forEach(row => {
            const empresaId = row.getAttribute('data-empresa');
            row.style.display = permitidos.includes(empresaId) ? '' : 'none';
        });
    }

    checkboxes.forEach(cb => cb.addEventListener('change', aplicarFiltro));


    // --- 2. ORDENAÇÃO DE TABELAS (SETAS) ---
    const getCellValue = (tr, idx) => tr.children[idx].innerText || tr.children[idx].textContent;

    // Converte datas PT-BR (DD/MM/YYYY) para sortable YYYYMMDD
    const parseData = (val) => {
        if(!val.includes('/')) return val;
        const [d, m, y] = val.split('/');
        return `${y}${m}${d}`;
    };

    const comparer = (idx, asc, type) => (a, b) => {
        const v1 = getCellValue(asc ? a : b, idx).trim();
        const v2 = getCellValue(asc ? b : a, idx).trim();
        
        if (type === 'numeric') {
            return v1 - v2;
        } else if (type === 'date') {
            return parseData(v1).localeCompare(parseData(v2));
        } else {
            return v1.localeCompare(v2);
        }
    };

    document.querySelectorAll('th.sortable').forEach(th => th.addEventListener('click', function() {
        const table = th.closest('table');
        const tbody = table.querySelector('tbody');
        // Pega o tipo de ordenação no HTML (numeric, text, date)
        const type = this.getAttribute('data-sort') || 'text';
        
        // Define direção
        const asc = !this.classList.contains('asc');
        
        // Limpa classes e ícones de todos os THs
        table.querySelectorAll('th.sortable').forEach(header => {
            header.classList.remove('asc', 'desc');
            header.querySelector('i').className = 'fa-solid fa-sort'; // ícone neutro
        });

        // Aplica classe e ícone no TH clicado
        this.classList.add(asc ? 'asc' : 'desc');
        this.querySelector('i').className = asc ? 'fa-solid fa-sort-up' : 'fa-solid fa-sort-down';

        // Ordena as linhas
        Array.from(tbody.querySelectorAll('tr'))
            .sort(comparer(Array.from(th.parentNode.children).indexOf(th), asc, type))
            .forEach(tr => tbody.appendChild(tr));
    }));

});