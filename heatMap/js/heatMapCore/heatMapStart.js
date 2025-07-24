const canvas = document.getElementById('heatmap');
const ctx = canvas.getContext('2d');

async function drawHeatmap() {
    const systems = await fetchTrafficData(); // You write this
    systems.forEach(({ x, y, intensity }) => {
        ctx.fillStyle = `rgba(255, 0, 0, ${intensity})`;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
    });
}
drawHeatmap();
