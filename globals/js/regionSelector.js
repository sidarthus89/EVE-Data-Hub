import { appState, APP_CONFIG, elements } from '../../market/js/marketConfig.js';
import { fetchMarketOrders } from '../../market/js/marketTables.js';

const listeners = [];

export const RegionSelector = {
    // 🔗 External subscriptions
    onLocationChange(cb) {
        listeners.push(cb);
    },

    // 🌐 Region data access
    getRegionList() {
        return appState.regions || {};
    },

    getRegionID() {
        return appState.selectedRegionID ?? null;
    },

    // 🔍 Updated to include both name & ID
    getRegionSummary() {
        return {
            region: appState.selectedRegionName,
            regionID: appState.selectedRegionID ?? null
        };
    },

    // 🚀 Region selection
    setRegion(regionName) {
        const regionData = appState.regions?.[regionName];
        appState.selectedRegionName = regionName;
        appState.selectedRegionID = regionData?.regionID || APP_CONFIG.DEFAULT_REGION_ID;

        localStorage.setItem('selectedRegion', appState.selectedRegionID);
        emitChange();
    },

    // 🧭 Dropdown initializer
    initializeDropdown() {
        const regionNames = Object.keys(RegionSelector.getRegionList()).sort();

        elements.regionSelector.innerHTML = '<option value="all">All Regions</option>';
        regionNames.forEach(regionName => {
            const option = document.createElement('option');
            option.value = regionName;
            option.textContent = regionName;
            elements.regionSelector.appendChild(option);
        });

        // 🔄 Restore from saved region
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

        // 🖱️ Change listener
        elements.regionSelector.addEventListener('change', () => {
            const selected = elements.regionSelector.value;
            RegionSelector.setRegion(selected);
        });

        // 📡 Reactive refresh
        RegionSelector.onLocationChange(({ regionID }) => {
            const typeID = window.appState?.selectedTypeID;

            if (typeID && regionID) {
                fetchMarketOrders(typeID, regionID);
            }
        });
    }
};

// 🔊 Notify subscribers
function emitChange() {
    const summary = RegionSelector.getRegionSummary();
    listeners.forEach(cb => cb(summary));
}
