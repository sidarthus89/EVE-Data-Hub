import { APP_CONFIG, appState } from './marketConfig.js';

let chartInstance = null;
let debounceTimer;

// 📈 Fetch 365-day price history for a single item
export async function fetchMarketHistory(typeID, selectedRegion) {
    const regionID =
        selectedRegion === 'all'
            ? APP_CONFIG.DEFAULT_REGION_ID
            : appState.locations?.regions?.find(r => r.regionName === selectedRegion)?.regionID;

    const url = `${APP_CONFIG.ESI_BASE_URL}${regionID}/history/?type_id=${typeID}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch history');
        const data = await response.json();
        appState.marketHistory = appState.marketHistory || {};
        appState.marketHistory[typeID] = data.slice(-365);
    } catch (err) {
        console.error(`Failed history for ${typeID}:`, err);
        appState.marketHistory[typeID] = [];
    }
}

// 🧠 Compute Moving Average
function computeMovingAverage(data, key, period) {
    const result = [];
    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            result.push(null);
            continue;
        }
        const slice = data.slice(i - period + 1, i + 1);
        const avg = slice.reduce((sum, d) => sum + d[key], 0) / period;
        result.push(avg);
    }
    return result;
}

// 🧭 Toggle between Market and History views
export function setHistoryViewActive(isActive) {
    const historyPanel = document.getElementById('itemHistorySection');
    const marketPanel = document.getElementById('itemPriceTables');

    historyPanel?.classList.toggle('visible', isActive);
    marketPanel?.classList.toggle('visible', !isActive);

    document.getElementById('viewMarketBtn')?.classList.toggle('active', !isActive);
    document.getElementById('viewHistoryBtn')?.classList.toggle('active', isActive);
}