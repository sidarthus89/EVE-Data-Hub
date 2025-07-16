// 🌍 Location Selector Module
// Controls region, constellation, and system dropdowns and triggers data updates

import { APP_CONFIG, appState, elements } from './marketConfig.js';
import { fetchMarketOrders } from './itemPrices.js'; // 🟢 For current buy/sell orders
import { fetchMarketHistory } from './itemPriceHistory.js';
import { renderScopedHistoryChart } from './historyChart_Slider.js'; // ← for chart rendering

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

    disableAndReset(elements.constellationSelector, 'Select a constellation');
    disableAndReset(elements.systemSelector, 'Select a system');
}

// 🌌 Handle Region Selection
export async function handleRegionChange() {
    const selectedRegionName = elements.regionSelector.value;

    disableAndReset(elements.constellationSelector, 'Select a constellation');
    disableAndReset(elements.systemSelector, 'Select a system');

    // 💾 Update region in state
    const selectedRegionData = appState.locations[selectedRegionName];
    const selectedRegionID = selectedRegionData?.regionID || APP_CONFIG.DEFAULT_REGION_ID;
    appState.selectedRegionID = selectedRegionID;

    // ⛅ Populate constellations if not "All"
    if (selectedRegionName !== 'all' && selectedRegionData) {
        const constellationNames = Object.keys(selectedRegionData)
            .filter(key => key !== 'regionID')
            .sort();

        constellationNames.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            elements.constellationSelector.appendChild(option);
        });

        elements.constellationSelector.disabled = false;
    }

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

// 🌠 Handle Constellation Selection
export function handleConstellationChange() {
    const selectedRegion = elements.regionSelector.value;
    const selectedConstellation = elements.constellationSelector.value;

    disableAndReset(elements.systemSelector, 'Select a system');
    if (!selectedRegion || !selectedConstellation) return;

    const regionData = appState.locations[selectedRegion];
    const constellationData = regionData?.[selectedConstellation];
    if (!constellationData) return;

    const systemNames = Object.keys(constellationData)
        .filter(key => key !== 'constellationID')
        .sort();

    systemNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        elements.systemSelector.appendChild(option);
    });

    elements.systemSelector.disabled = false;
}

// 🔧 Utility: Reset dropdown
function disableAndReset(selectElement, placeholder) {
    selectElement.innerHTML = `<option value="" disabled selected>${placeholder}</option>`;
    selectElement.disabled = true;
}

// 🔍 Region ID Lookup by Name
export function getRegionIDByName(name) {
    return appState.locations?.[name]?.regionID || APP_CONFIG.DEFAULT_REGION_ID;
}