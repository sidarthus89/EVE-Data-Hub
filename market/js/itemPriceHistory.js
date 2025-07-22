import { APP_CONFIG, appState } from './marketConfig.js';
import { renderScopedHistoryChart } from './historyChart_Slider.js';

export async function fetchMarketHistory(typeID, selectedRegion) {
    const regionID = Number(selectedRegion) || APP_CONFIG.DEFAULT_REGION_ID;
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

export function renderHistoryView() {
    const typeID = appState.selectedTypeID;
    const regionID = appState.selectedRegionID;

    if (!typeID || !regionID) {
        console.warn('⚠️ No item selected — skipping history view render.');
        return;
    }

    setHistoryViewActive(true);

    fetchMarketHistory(typeID, regionID).then(() => {
        requestAnimationFrame(() => {
            renderScopedHistoryChart(regionID, typeID);
        });
    });
}

function getChartCanvas() {
    return document.getElementById('historyChart');
}
