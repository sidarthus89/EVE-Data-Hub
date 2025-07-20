// 📍 Market Location Selector
// Handles dropdown setup for region/constellation/system on market pages
// Delegates all location logic to RegionSelector

import { elements, appState } from './marketConfig.js';
import { RegionSelector } from '../../globals/js/regionSelector.js';
import { fetchMarketOrders } from './itemPrices.js';

export function initializeMarketLocationDropdowns() {
    // 🗺️ Populate Region Dropdown
    const regionNames = Object.keys(RegionSelector.getRegionList()).sort();

    elements.regionSelector.innerHTML = '<option value="all">All Regions</option>';
    regionNames.forEach(regionName => {
        const option = document.createElement('option');
        option.value = regionName;
        option.textContent = regionName;
        elements.regionSelector.appendChild(option);
    });

    // 🔄 Auto-select previously stored region if available
    const storedRegionID = Number(localStorage.getItem('selectedRegion'));
    if (!isNaN(storedRegionID)) {
        const storedRegionName = Object.entries(appState.regions || {}).find(
            ([_, value]) => value.regionID === storedRegionID
        )?.[0];

        if (storedRegionName) {
            elements.regionSelector.value = storedRegionName;
            RegionSelector.setRegion(storedRegionName);
        }
    }

    // 🔗 Connect event handlers to RegionSelector
    elements.regionSelector.addEventListener('change', () => {
        const regionName = elements.regionSelector.value;
        RegionSelector.setRegion(regionName);
        localStorage.setItem('selectedRegion', RegionSelector.getRegionID());
    });

    // 📡 Trigger market data reload when location updates
    RegionSelector.onLocationChange(({ region }) => {
        const typeID = window.appState?.selectedTypeID;
        const regionID = RegionSelector.getRegionID();

        if (typeID && regionID) {
            fetchMarketOrders(typeID, regionID);
        }
    });
}

function resetDropdown(select, label) {
    select.innerHTML = `<option value="" disabled selected>${label}</option>`;
    select.disabled = true;
}
