document.addEventListener('DOMContentLoaded', () => {
    const ctx = document.getElementById('myChart');

    if (ctx) {
        // Lê os valores e garante que sejam números com base 10
        const statsData = {
            solicitado: parseInt(ctx.getAttribute('data-solicitado'), 10) || 0,
            pendente: parseInt(ctx.getAttribute('data-pendente'), 10) || 0,
            confirmado: parseInt(ctx.getAttribute('data-confirmado'), 10) || 0,
            cancelado: parseInt(ctx.getAttribute('data-cancelado'), 10) || 0
        };

        const total = statsData.solicitado + statsData.pendente + statsData.confirmado + statsData.cancelado;

        // Proteção contra o Chart.js travando com zero dados
        if (total === 0) {
            const container = ctx.parentElement;
            container.innerHTML = '<p style="color: #64748b; margin-top: 150px; font-size: 15px; font-weight: bold;">Nenhum pagamento registrado no Tecon.</p>';
            return;
        }

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
                    // Usa as exatas cores que você solicitou para os badges
                    backgroundColor: ['#007bff', '#eab308', '#16a34a', '#dc2626'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            font: { size: 13 }
                        }
                    }
                }
            }
        });
    }
});