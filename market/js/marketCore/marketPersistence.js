// 🧠 marketPersistence.js
// Centralized market session loader, location-aware view toggles, and contextual drill-down

import { APP_CONFIG, appState, elements } from '../marketCore/marketConfig.js';
import { regionSelector } from '../../../globals/js/regionSelector.js';
import { fetchMarketOrders } from '../../../globals/js/esiAPI.js';
import { fetchMarketHistory } from "..marketLogic/marketHistoryLogic.js";
import { handleItemSelection } from '../marketLogic/itemDispatcher.js';
import { drillDownToItem } from "../marketLogic/marketSearchLogic.js";
import { renderScopedHistoryChart } from "../marketUI/historyUI.js";

export async function loadItemContext(typeID, regionName = "all") {

    if (!typeID || isNaN(typeID)) return;
    if (!regionName) regionName = "all";

    elements.regionSelector.value = regionName;
    elements.regionSelector.dispatchEvent(new Event("change"));
    elements.marketTables?.classList.remove("hidden");
    elements.historyChart?.classList.add("hidden");

    regionSelector.setRegion(regionName);
    appState.selectedTypeID = typeID;

    handleItemSelection(typeID);
    drillDownToItem(typeID);
    elements.searchBox.value = "";
    hideregionSelectors(false);

    const regionID = regionSelector.getRegionID() ?? APP_CONFIG.DEFAULT_REGION_ID;

    try {
        await fetchMarketOrders(typeID, regionID);
        await fetchMarketHistory(typeID, regionID);
        appState.selectedTypeID = typeID;

        renderScopedHistoryChart(regionID, typeID);

        elements.marketTables?.classList.remove("hidden");
        elements.historyChart?.classList.add("hidden");

    } catch (err) {
        console.warn("Failed to load item context:", err);
    }
}

export function hideregionSelectors(hide = true) {
    const displayValue = hide ? "none" : "";
    elements.regionSelector.style.display = displayValue;
}

export function restorePreviousSession() {
    const typeID = Number(localStorage.getItem("selectedTypeID"));
    const regionName = localStorage.getItem("selectedRegion");

    if (!typeID || !regionName) return;

    loadItemContext(typeID, regionName);
}
