// 📰 marketTicker.js
// Loads and renders scrolling ticker for global PLEX prices

import { fetchAllRegionOrders } from './itemPrices.js';

const PLEX_TYPE_ID = 44992;

// 💱 Helpers
function getAverage(orders) {
    if (!orders.length) return 0;
    const total = orders.reduce((sum, o) => sum + o.price, 0);
    return total / orders.length;
}

function formatISK(value) {
    const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;
    return safeValue.toLocaleString('en-US', { minimumFractionDigits: 2 }) + ' ISK';
}

// 🚀 Entry Point
export async function loadTickerData() {
    const orders = await fetchAllRegionOrders(PLEX_TYPE_ID);
    const buyOrders = orders.filter(o => o.is_buy_order);
    const sellOrders = orders.filter(o => !o.is_buy_order);

    const highestBuy = Math.max(...buyOrders.map(o => o.price));
    const lowestSell = Math.min(...sellOrders.map(o => o.price));
    const averagePrice = getAverage([...buyOrders, ...sellOrders]);

    const tickerStats = {
        name: 'PLEX',
        highestBuy,
        lowestSell,
        averagePrice
    };

    renderTickerTape(tickerStats);
}

// 🎞️ Render Scrolling Ticker
function renderTickerTape({ name, highestBuy, lowestSell, averagePrice }) {
    const tickerContainer = document.getElementById('priceTicker');
    if (!tickerContainer) return;

    tickerContainer.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'ticker-loop';

    const stream = document.createElement('div');
    stream.className = 'ticker-stream';

    const segments = [
        { label: 'Highest Buy', value: highestBuy, class: 'buy' },
        { label: 'Lowest Sell', value: lowestSell, class: 'sell' },
        { label: 'Average', value: averagePrice, class: 'avg' }
    ];

    segments.forEach(({ label, value, class: cls }) => {
        const span = document.createElement('span');
        span.className = `ticker-segment ${cls}`;
        span.textContent = `${name} — ${label}: ${formatISK(value)}`;
        stream.appendChild(span);
    });

    // Create clone for seamless loop
    const clone = stream.cloneNode(true);
    wrapper.appendChild(stream);
    wrapper.appendChild(clone);
    tickerContainer.appendChild(wrapper);

    // Force layout calculation immediately
    const streamWidth = stream.offsetWidth;

    // Set the wrapper width to contain both streams
    wrapper.style.width = `${streamWidth * 2}px`;

    // Calculate animation duration based on single stream width
    const speed = 64; // px/sec
    const duration = streamWidth / speed;

    // Apply animation immediately
    wrapper.style.animationName = 'scrollStream';
    wrapper.style.animationDuration = `${duration}s`;
    wrapper.style.animationTimingFunction = 'linear';
    wrapper.style.animationIterationCount = 'infinite';
}