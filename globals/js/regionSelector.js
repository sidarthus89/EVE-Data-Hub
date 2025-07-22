import { appState, APP_CONFIG, elements } from '../../market/js/marketConfig.js';
import { fetchMarketOrders } from '../../market/js/marketRenderer.js';
import { fetchMarketHistory, setHistoryViewActive } from '../../market/js/itemPriceHistory.js';
import { renderItemViewer } from '../../market/js/itemViewer.js';

const listeners = [];

export const RegionSelector = {
    // 🔗 External subscriptions
    onLocationChange(callback) {
        listeners.push(callback);
    },

    // 🌐 Region access
    getRegionList() {
        return appState.regionMap || {};
    },

    getRegionID() {
        const name = appState.selectedRegionName;
        return name === 'all' ? 'all' : appState.selectedRegionID ?? APP_CONFIG.DEFAULT_REGION_ID;
    },

    getRegionSummary() {
        const name = appState.selectedRegionName;
        const id = name === 'all' ? 'all' : appState.selectedRegionID ?? APP_CONFIG.DEFAULT_REGION_ID;
        return { region: name, regionID: id };
    },

    // 🚀 Region selection
    setRegion(regionName) {
        if (regionName === 'all') {
            appState.selectedRegionName = 'all';
            appState.selectedRegionID = APP_CONFIG.DEFAULT_REGION_ID;
            localStorage.setItem('selectedRegion', 'all');
        } else {
            const regionData = appState.regions?.[regionName];
            appState.selectedRegionName = regionName;
            appState.selectedRegionID = regionData?.regionID || APP_CONFIG.DEFAULT_REGION_ID;
            localStorage.setItem('selectedRegion', appState.selectedRegionID);
        }

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

        // 🔄 Restore saved region (default to 'all' if nothing set)
        const storedValue = localStorage.getItem('selectedRegion');
        if (storedValue === 'all' || !storedValue) {
            elements.regionSelector.value = 'all';
            appState.selectedRegionName = 'all';
            appState.selectedRegionID = APP_CONFIG.DEFAULT_REGION_ID;
        } else {
            const storedRegionID = Number(storedValue);
            if (!isNaN(storedRegionID)) {
                const storedRegionName = Object.entries(appState.regions || {}).find(
                    ([_, value]) => value.regionID === storedRegionID
                )?.[0];

                if (storedRegionName) {
                    elements.regionSelector.value = storedRegionName;
                    RegionSelector.setRegion(storedRegionName);
                }
            }
        }

        // 🖱️ Change listener
        elements.regionSelector.addEventListener('change', () => {
            const selected = elements.regionSelector.value;
            RegionSelector.setRegion(selected);
        });

        // 📡 Reactive refresh: update both market and history views
        RegionSelector.onLocationChange(({ regionID }) => {
            const itemData = appState.selectedItemData;
            const typeID = itemData?.type_id;

            if (typeID && regionID && itemData) {
                fetchMarketOrders(typeID, regionID);

                if (appState.activeView === 'history') {
                    setHistoryViewActive(true, regionID, typeID);
                    fetchMarketHistory(typeID, regionID).then(() => {
                    }).catch(err => {
                        console.warn('[❌ History fetch failed on region change]', err);
                    });
                } else {
                    renderItemViewer(itemData, regionID);
                }
            }

        });
    }
};

// 🔊 Notify subscribers
function emitChange() {
    const summary = RegionSelector.getRegionSummary();
    listeners.forEach(cb => cb(summary));
}
