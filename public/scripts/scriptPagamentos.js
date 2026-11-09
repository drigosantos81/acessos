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