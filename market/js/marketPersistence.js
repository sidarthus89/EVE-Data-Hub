import { APP_CONFIG, elements } from "./marketConfig.js";
import { getRegionIDByName } from "./locationSelector.js";
import { fetchMarketOrders } from "./marketTables.js";

// 🚀 Shared Loader for Type + Region
function loadItem(typeID, regionName) {
    if (!regionName || isNaN(typeID)) return;

    elements.regionSelector.value = regionName;
    elements.regionSelector.dispatchEvent(new Event("change"));

    const regionID =
        regionName === "all"
            ? APP_CONFIG.DEFAULT_REGION_ID
            : getRegionIDByName(regionName);

    fetchMarketOrders(typeID, regionID);
}

// 🧭 Restore Last Selection on Reload
export function restorePreviousSelection() {
    const typeID = parseInt(localStorage.getItem("selectedTypeID"), 10);
    const region = localStorage.getItem("selectedRegion");

    loadItem(typeID, region);
}

// 👁️ Region Selector Visibility Toggles
export function hideRegionSelectors() {
    elements.regionSelector.style.display = "none";
    elements.constellationSelector.style.display = "none";
    elements.systemSelector.style.display = "none";
}

export function showRegionSelectors() {
    elements.regionSelector.style.display = "";
    elements.constellationSelector.style.display = "";
    elements.systemSelector.style.display = "";
}