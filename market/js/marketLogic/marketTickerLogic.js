// 🧠 tickerLogic.js
import { fetchAllRegionOrders } from '../../../globals/js/esiAPI.js';
import { formatISK } from '../marketUI/marketFormatting.js'; // adjust path if needed
import { renderTicker } from '../marketUI/marketTickerUI.js';

const PLEX_TYPE_ID = 44992;

/**
 * Calculates average price from an array of orders.
 * @param {Array} orders
 * @returns {number}
 */
export function getAverage(orders) {
    return orders.length
        ? orders.reduce((sum, o) => sum + o.price, 0) / orders.length
        : 0;
}

/**
 * Fetches and prepares stats for PLEX orders.
 * @returns {Promise<Object>} Stats payload
 */
export async function getPLEXTickerStats() {
    const orders = await fetchAllRegionOrders(PLEX_TYPE_ID);
    const buyOrders = orders.filter(o => o.is_buy_order);
    const sellOrders = orders.filter(o => !o.is_buy_order);

    return {
        name: 'PLEX',
        highestBuy: Math.max(...buyOrders.map(o => o.price)),
        lowestSell: Math.min(...sellOrders.map(o => o.price)),
        averagePrice: getAverage([...buyOrders, ...sellOrders])
    };
}

export function buildPLEXTickerSegment(stats) {
    return `PLEX: Buy ${formatISK(stats.highestBuy)} | Sell ${formatISK(stats.lowestSell)} | Avg ${formatISK(stats.averagePrice)}`;
}

/**
 * Computes average prices from a batch of market items.
 * @param {Array} items - Array of { name, buyOrders, sellOrders }
 * @returns {string[]} Formatted segments
 */
export function formatTickerSegments(items) {
    return items.map(item => {
        const buyAvg = getAverage(item.buyOrders);
        const sellAvg = getAverage(item.sellOrders);
        return `${item.name}: Buy ${formatISK(buyAvg)} | Sell ${formatISK(sellAvg)}`;
    });
}

export async function loadTickerData() {
    try {
        const stats = await getPLEXTickerStats();
        appState.tickerStats = stats;

        const segment = buildPLEXTickerSegment(stats);
        renderTicker(segment);
    } catch (err) {
        console.warn("📉 loadTickerData failed:", err);
        renderTicker("PLEX: Market data unavailable");
    }
}
