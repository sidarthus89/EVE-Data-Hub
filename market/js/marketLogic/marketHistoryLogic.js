// 📦 marketHistory.js
// Retrieves historical pricing via the esiAPI

import { APP_CONFIG, appState } from '../marketCore/marketConfig.js';
import { renderScopedHistoryChart } from '../marketUI/marketHistoryUI.js';
import { fetchItemPriceHistory } from '../../../globals/js/esiAPI.js';
import { getChartCanvas } from '../marketUI/marketHistoryUI.js'; // adjust path if needed

export async function fetchMarketHistory(typeID, selectedRegion) {
    const regionID =
        selectedRegion === 'all'
            ? APP_CONFIG.DEFAULT_REGION_ID
            : Number(selectedRegion) || APP_CONFIG.DEFAULT_REGION_ID;

    const url = `${APP_CONFIG.ESI_BASE_URL}${regionID}/history/?type_id=${typeID}`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!Array.isArray(json)) throw new Error(`Bad format for ${typeID}`);

        appState.marketHistory ??= {};
        appState.marketHistory[typeID] = json.slice(-365);
    } catch (err) {
        console.error(`❌ History fetch failed for ${typeID}:`, err);
        appState.marketHistory ??= {};
        appState.marketHistory[typeID] = [];
    }
}

export function setHistoryViewActive(isActive) {

    const historyPanel = document.getElementById('itemHistorySection');
    const marketPanel = document.getElementById('itemPriceTables');

    if (isActive) {
        marketPanel.classList.add("hidden");
        historyPanel.classList.remove("hidden");
    } else {
        historyPanel.classList.add("hidden");
        marketPanel.classList.remove("hidden");
    }

    document.getElementById('viewMarketLink')?.classList.toggle('active', !isActive);
    document.getElementById('viewHistoryLink')?.classList.toggle('active', isActive);

    const canvas = getChartCanvas();
    if (canvas) {
        const rect = canvas.getBoundingClientRect();
    } else {
        console.warn('[⚠️ Chart] No canvas element found');
    }
}


