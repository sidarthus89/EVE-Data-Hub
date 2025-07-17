import { selectItem } from "./itemViewer.js";
import { fetchMarketOrders } from "./itemPrices.js";
import { fetchMarketHistory } from "./itemPriceHistory.js";
import { renderScopedHistoryChart, setupSliderChartSync } from "./historyChart_Slider.js";
import { appState, APP_CONFIG } from "./marketConfig.js";
import { setHistoryViewActive } from "./itemPriceHistory.js";

export async function handleItemSelection(typeID) {
    if (!typeID || isNaN(typeID)) return;

    // 🧠 Update App State
    appState.selectedTypeID = typeID;
    selectItem(typeID);

    // 👁️ Immediately reveal UI panels
    const viewerHeader = document.getElementById('itemViewerHeader');
    if (viewerHeader) {
        viewerHeader.classList.remove('hidden');
        viewerHeader.style.display = 'flex'; // or whatever layout you need
    }
    document.getElementById('itemPriceTables')?.classList.remove('hidden');
    document.getElementById('itemHistorySection')?.classList.remove('hidden');
    setHistoryViewActive(false); // Default to Market view

    // 🌍 Safely resolve region ID
    const rawRegion = localStorage.getItem("selectedRegion");
    const resolvedRegion =
        !isNaN(rawRegion) && rawRegion !== null
            ? Number(rawRegion)
            : appState.selectedRegionID ?? APP_CONFIG.DEFAULT_REGION_ID;

    // 🔄 Fetch market data and price history
    try {
        fetchMarketOrders(typeID, resolvedRegion);
        await fetchMarketHistory(typeID, resolvedRegion);
    } catch (err) {
        console.warn(`Data fetch failed for ${typeID}:`, err);
    }

    // 📈 Render chart only if history panel is active
    const isHistoryActive = document.getElementById('itemHistorySection')?.classList.contains('visible');
    if (isHistoryActive) {
        renderScopedHistoryChart(typeID);
        setupSliderChartSync(typeID);
    }
}