// 🧠 marketPersistence.js
// Centralized market session loader, location-aware view toggles, and contextual drill-down

import { APP_CONFIG, appState, elements } from "./marketConfig.js";
import { RegionSelector } from '../../globals/js/regionSelector.js';
import { fetchMarketOrders } from "./itemPrices.js";
import { fetchMarketHistory } from "./itemPriceHistory.js";
import { selectItem } from "./itemViewer.js";
import { drillDownToItem } from "./marketSearch.js";
import { renderScopedHistoryChart } from "./historyChart_Slider.js";

// 🚀 Main initializer: full context load for item + location
export async function loadItemContext(typeID, regionName = "all") {
    if (!typeID || isNaN(typeID)) return;
    if (!regionName) regionName = "all";

    // 💾 Update location and UI selectors
    elements.regionSelector.value = regionName;
    elements.regionSelector.dispatchEvent(new Event("change"));

    RegionSelector.setRegion(regionName);
    appState.selectedTypeID = typeID;

    // 🖼️ UI hydration
    selectItem(typeID);
    drillDownToItem(typeID);
    elements.searchBox.value = "";
    hideRegionSelectors(false); // ensure visible when loading context

    // 📦 Resolve regionID
    const regionID = RegionSelector.getRegionID() ?? APP_CONFIG.DEFAULT_REGION_ID;

    try {
        await fetchMarketOrders(typeID, regionID);
        await fetchMarketHistory(typeID, regionID);
        renderScopedHistoryChart(typeID);
    } catch (err) {
        console.warn("Failed to load item context:", err);
    }
}

// 👁️ Region Selector Visibility Toggles
export function hideRegionSelectors(hide = true) {
    const displayValue = hide ? "none" : "";
    elements.regionSelector.style.display = displayValue;
}

// 🧠 Session Restore (WIP-ready for storage expansion)
export function restorePreviousSession() {
    const typeID = Number(localStorage.getItem("selectedTypeID"));
    const regionName = localStorage.getItem("selectedRegion");

    if (!typeID || !regionName) return;

    loadItemContext(typeID, regionName);
}
