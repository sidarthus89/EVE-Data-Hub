// 📦 itemDispatcher.js
// Handles item selection, triggers order/history/chart updates

import { selectItem } from "./itemViewer.js";
import { fetchMarketOrders } from "./marketTables.js";
import { fetchMarketHistory } from "./itemPriceHistory.js";
import {
    renderScopedHistoryChart,
    setupSliderChartSync
} from "./historyChart_Slider.js";
import { appState } from "./marketConfig.js";
import { setHistoryViewActive } from "./itemPriceHistory.js";
import { RegionSelector } from "../../globals/js/regionSelector.js";

export async function handleItemSelection(typeID) {
    if (!typeID || isNaN(typeID)) return;

    // 🧠 Update state and UI
    appState.selectedTypeID = typeID;
    selectItem(typeID);

    // 🎛️ Reveal viewer and data panels
    const viewerHeader = document.getElementById('itemViewerHeader');
    if (viewerHeader) {
        viewerHeader.classList.remove('hidden');
        viewerHeader.style.display = 'flex';
    }

    document.getElementById('itemPriceTables')?.classList.remove('hidden');
    document.getElementById('itemHistorySection')?.classList.remove('hidden');
    setHistoryViewActive(false);

    // 🌍 Resolve location context
    const regionName = RegionSelector.getLocationSummary().region || 'all';

    // 📊 Fetch market data
    try {
        await Promise.all([
            fetchMarketOrders(typeID, regionName),
            fetchMarketHistory(typeID, regionName)
        ]);
    } catch (err) {
        console.warn(`❌ Data fetch failed for item ${typeID} in region "${regionName}":`, err);
        return;
    }

    // 📈 Render history chart (only if visible)
    const isHistoryVisible = document
        .getElementById('itemHistorySection')
        ?.classList.contains('visible');

    if (isHistoryVisible) {
        renderScopedHistoryChart(typeID);
        setupSliderChartSync(typeID);
    }
}
