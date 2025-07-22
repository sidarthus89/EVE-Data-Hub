import { fetchAllRegionOrders } from './marketLoader.js';

const PLEX_TYPE_ID = 44992;

function getAverage(orders) {
    return orders.length
        ? orders.reduce((sum, o) => sum + o.price, 0) / orders.length
        : 0;
}

function formatISK(value) {
    return (typeof value === 'number' && !isNaN(value) ? value : 0)
        .toLocaleString('en-US', { minimumFractionDigits: 2 }) + ' ISK';
}

async function loadTickerData() {
    const container = document.querySelector('#plexTicker .marquee__content');
    const marquee = document.querySelector('#plexTicker');
    if (!container || !marquee) return;

    const orders = await fetchAllRegionOrders(PLEX_TYPE_ID);
    const buyOrders = orders.filter(o => o.is_buy_order);
    const sellOrders = orders.filter(o => !o.is_buy_order);

    const stats = {
        name: 'PLEX',
        highestBuy: Math.max(...buyOrders.map(o => o.price)),
        lowestSell: Math.min(...sellOrders.map(o => o.price)),
        averagePrice: getAverage([...buyOrders, ...sellOrders])
    };

    // Create the base content
    const baseContent = [
        { label: 'Highest Buy', value: stats.highestBuy, class: 'highest' },
        { label: 'Average', value: stats.averagePrice, class: 'average' },
        { label: 'Lowest Sell', value: stats.lowestSell, class: 'lowest' }
    ];

    // Clear existing content
    container.innerHTML = '';

    // Create a single item container with all the text
    const singleItem = document.createElement('div');
    singleItem.className = 'marquee__item';

    baseContent.forEach(({ label, value, class: cls }) => {
        const span = document.createElement('span');
        span.className = `marquee__text ${cls}`;
        span.textContent = `${stats.name} — ${label}: ${formatISK(value)} • `;
        singleItem.appendChild(span);
    });

    // Add the single item to get its width
    container.appendChild(singleItem);

    // Force layout calculation
    container.offsetWidth;

    // Get the width of our content
    const itemWidth = singleItem.offsetWidth;
    const containerWidth = marquee.offsetWidth;

    // Calculate how many copies we need to fill the screen plus buffer for seamless loop
    // For slower speeds, we need more copies to ensure no gaps
    const numberOfCopies = Math.ceil((containerWidth / itemWidth) * 2) + 2;

    // Create enough copies for seamless scrolling
    for (let i = 1; i < numberOfCopies; i++) {
        container.appendChild(singleItem.cloneNode(true));
    }

    // Set the animation speed - adjust this number to control speed
    // Higher number = faster, lower number = slower
    const speedFactor = 60; // Change this value to adjust speed
    const duration = (itemWidth / speedFactor) + 's';

    // Create a unique animation name and inject keyframes
    const animationName = `marquee-scroll-${Date.now()}`;
    const keyframes = `
        @keyframes ${animationName} {
            0% { transform: translateX(0); }
            100% { transform: translateX(-${itemWidth}px); }
        }
    `;

    // Remove any existing style element and add new one
    const existingStyle = document.querySelector('#marquee-keyframes');
    if (existingStyle) {
        existingStyle.remove();
    }

    const styleElement = document.createElement('style');
    styleElement.id = 'marquee-keyframes';
    styleElement.textContent = keyframes;
    document.head.appendChild(styleElement);

    // Set the animation duration and name
    container.style.animation = `${animationName} ${duration} linear infinite`;
}

// Initialize and refresh
document.addEventListener('DOMContentLoaded', loadTickerData);
window.addEventListener('resize', loadTickerData);
setInterval(loadTickerData, 30000);

export { loadTickerData };