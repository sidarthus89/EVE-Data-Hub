import { selectItem } from "./itemViewer.js";
import { fetchMarketOrders } from "./itemPrices.js";
import { fetchMarketHistory } from "./itemPriceHistory.js";
import { renderScopedHistoryChart, setupSliderChartSync } from "./historyChart_Slider.js";
import { appState } from "./marketConfig.js";

export async function handleItemSelection(typeID) {
    if (!typeID || isNaN(typeID)) return;

    // 🧠 Update App State
    appState.selectedTypeID = typeID;
    selectItem(typeID);

    const savedRegion = localStorage.getItem("selectedRegion") || "all";

    // 🔄 Fetch market data and price history
    fetchMarketOrders(typeID, savedRegion);
    await fetchMarketHistory(typeID, savedRegion);

    // 👁️ Reveal UI panels
    const viewerHeader = document.getElementById('itemViewerHeader');
    if (viewerHeader?.style) viewerHeader.style.display = 'flex';

    document.getElementById('itemPriceTables')?.classList.remove('hidden');
    document.getElementById('itemHistorySection')?.classList.remove('hidden');

    // 🖼️ If history panel is active, render chart
    const isHistoryActive = document.getElementById('itemHistorySection')?.classList.contains('visible');
    if (isHistoryActive) {
        renderScopedHistoryChart(typeID);
        setupSliderChartSync(typeID);
    }
}