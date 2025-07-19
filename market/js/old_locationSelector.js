// 🌍 Location Selector Module
// Controls region, constellation, and system dropdowns and triggers data updates

import { appState, APP_CONFIG, elements } from '../../market/js/marketConfig.js';
import { fetchMarketOrders } from './itemPrices.js';
import { fetchMarketHistory } from './itemPriceHistory.js';
import { renderScopedHistoryChart } from './historyChart_Slider.js';

// 🌎 Initialize Region Dropdown
export function initializeDropdowns() {
    const regionNames = Object.keys(appState.locations).sort();

    elements.regionSelector.innerHTML = '<option value="all">All Regions</option>';
    regionNames.forEach(regionName => {
        const option = document.createElement('option');
        option.value = regionName;
        option.textContent = regionName;
        elements.regionSelector.appendChild(option);
    });
}

// 🌌 Handle Region Selection
export async function handleRegionChange() {
    const selectedRegionName = elements.regionSelector.value;

    // 💾 Update region in state
    const selectedRegionData = appState.locations[selectedRegionName];
    const selectedRegionID =
        selectedRegionData?.regionID || APP_CONFIG.DEFAULT_REGION_ID;

    // 🔄 If an item is selected, refresh orders + tables
    const typeID = appState.selectedTypeID;
    if (typeID) {
        try {
            await fetchMarketOrders(typeID, selectedRegionID);
            renderMarketOrders(typeID);
        } catch (err) {
            console.error(`Failed to fetch market orders for region ${selectedRegionID}:`, err);
        }
    }
}

// 🔧 Utility: Reset dropdown
function disableAndReset(selectElement, placeholder) {
    selectElement.innerHTML = `<option value="" disabled selected>${placeholder}</option>`;
    selectElement.disabled = true;
}

// 🔍 Region ID Lookup by Name
export function getRegionIDByName(name) {
    return appState.locations?.[name]?.regionID ?? null;
    // 👈 fallback removed
    // return appState.locations?.[name]?.regionID || APP_CONFIG.DEFAULT_REGION_ID; // 🗃️ legacy fallback commented out
}
