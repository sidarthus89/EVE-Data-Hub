import { appState, APP_CONFIG, elements } from '../../market/js/marketConfig.js';
import { fetchMarketOrders } from '../../market/js/marketTables.js'; // Adjust path if needed

const listeners = [];

export const RegionSelector = {
    // 🔗 External subscriptions
    onLocationChange(cb) {
        listeners.push(cb);
    },

    // 🌐 Region data access
    getRegionList() {
        return appState.locations || {};
    },

    getRegionID() {
        return appState.selectedRegionID ?? null;
    },

    getLocationSummary() {
        return {
            region: appState.selectedRegionName
        };
    },

    // 🚀 Region selection
    setRegion(regionName) {
        const regionData = appState.locations?.[regionName];
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

        // 🔄 Restore from saved region (if exists)
        const storedRegionID = Number(localStorage.getItem('selectedRegion'));
        if (!isNaN(storedRegionID)) {
            const storedRegionName = Object.entries(appState.locations || {}).find(
                ([_, value]) => value.regionID === storedRegionID
            )?.[0];

            if (storedRegionName) {
                elements.regionSelector.value = storedRegionName;
                RegionSelector.setRegion(storedRegionName);
            }
        }

        // 🖱️ Attach change listener
        elements.regionSelector.addEventListener('change', () => {
            const selected = elements.regionSelector.value;
            RegionSelector.setRegion(selected);
        });

        // 📡 Reactively refresh market view
        RegionSelector.onLocationChange(({ region }) => {
            const typeID = window.appState?.selectedTypeID;
            const regionID = RegionSelector.getRegionID();

            if (typeID && regionID) {
                fetchMarketOrders(typeID, regionID);
            }
        });
    }
};

// 🔊 Notify subscribers
function emitChange() {
    const summary = RegionSelector.getLocationSummary();
    listeners.forEach(cb => cb(summary));
}
