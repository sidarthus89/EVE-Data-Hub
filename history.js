const canvas = document.getElementById('marketCanvas');
const ctx = canvas.getContext('2d');

/**
 * Draws price history on canvas
 * @param {Array} historyData - Array of { date, average, highest, lowest, volume }
 */
function drawMarketChart(historyData) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const padding = 50;
    const chartHeight = canvas.height - padding * 2;
    const chartWidth = canvas.width - padding * 2;

    const maxPrice = Math.max(...historyData.map(d => d.highest));
    const minPrice = Math.min(...historyData.map(d => d.lowest));

    historyData.forEach((day, i) => {
        const x = padding + (i / historyData.length) * chartWidth;

        const avgY = canvas.height - padding - ((day.average - minPrice) / (maxPrice - minPrice)) * chartHeight;
        const lowY = canvas.height - padding - ((day.lowest - minPrice) / (maxPrice - minPrice)) * chartHeight;
        const highY = canvas.height - padding - ((day.highest - minPrice) / (maxPrice - minPrice)) * chartHeight;

        // Average price line
        ctx.fillStyle = 'yellow';
        ctx.fillRect(x, avgY, 2, 2);

        // High/low price bar
        ctx.strokeStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(x, lowY);
        ctx.lineTo(x, highY);
        ctx.stroke();

        // Volume bars (optional second axis or base line)
    });
}
