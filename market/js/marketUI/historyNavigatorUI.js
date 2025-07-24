// 🖼️ historyNavigatorUI.js
import { getNavigatorData, getNavigatorLabels, getNavigatorPrices } from '../marketLogic/historyNavigatorLogic.js';

let navigatorChart = null;

export function renderNavigatorChart(typeID) {
    const canvas = document.getElementById('historyNavigatorChart');
    if (!canvas) {
        console.warn('⚠️ Navigator canvas not found');
        return;
    }

    const ctx = canvas.getContext('2d');
    const history = getNavigatorData(typeID);
    const labels = getNavigatorLabels(history);
    const prices = getNavigatorPrices(history);

    if (navigatorChart) navigatorChart.destroy();

    navigatorChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: '365-Day Price History',
                    data: prices,
                    borderColor: '#888',
                    backgroundColor: 'rgba(150,150,150,0.1)',
                    pointRadius: 0,
                    fill: true,
                    tension: 0.2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            scales: {
                x: {
                    ticks: {
                        display: false,
                        maxTicksLimit: 12, // 👈 Limits crowding
                    },
                },
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}
