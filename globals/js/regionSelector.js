import { appState, APP_CONFIG, elements } from '../../market/js/marketCore/marketConfig.js';
import { fetchMarketOrders } from '../../globals/js/esiAPI.js';
import { fetchMarketHistory, setHistoryViewActive } from '../../market/js/marketLogic/marketHistoryLogic.js';
import { renderItemViewer } from '../../market/js/marketUI/itemViewerUI.js';

const listeners = [];
let locationsData = null;

export const regionSelector = {
    // 🌟 Popular regions configuration
    popularRegions: {
        enabled: true,
        title: "Popular Regions",
        regions: [] // Will be populated from locations.json
    },

    // 📍 Load locations data and set popular regions
    async loadLocationsAndSetPopular() {
        try {
            if (!locationsData) {
                const response = await fetch('/globals/data/locations.json');
                locationsData = await response.json();
            }

            // Find regions containing popular trading systems
            const popularSystems = ["Jita", "Amarr", "Dodixie", "Rens", "Hek"];
            const popularRegionNames = [];

            // Search through the nested structure: region -> constellation -> system
            for (const [regionName, regionData] of Object.entries(locationsData)) {
                if (typeof regionData === 'object' && regionData.regionID) {
                    // Search through constellations in this region
                    for (const [constellationName, constellationData] of Object.entries(regionData)) {
                        if (typeof constellationData === 'object' && constellationData.constellationID) {
                            // Search through systems in this constellation
                            for (const [systemName, systemData] of Object.entries(constellationData)) {
                                if (typeof systemData === 'object' && systemData.solarSystemID) {
                                    // Check if this system name matches our popular systems
                                    if (popularSystems.includes(systemName)) {
                                        if (!popularRegionNames.includes(regionName)) {
                                            popularRegionNames.push(regionName);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            this.popularRegions.regions = popularRegionNames;
            return popularRegionNames;
        } catch (error) {
            // Fallback to common EVE region names
            this.popularRegions.regions = ["The Forge", "Domain", "Sinq Laison", "Heimatar", "Metropolis"];
            return this.popularRegions.regions;
        }
    },

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

    // 🌟 Popular regions management
    setPopularRegions(regions, title = null) {
        this.popularRegions.regions = regions;
        if (title) {
            this.popularRegions.title = title;
        }
        // Re-initialize dropdown to reflect changes
        this.initializeDropdown();
    },

    addPopularRegion(regionName) {
        if (!this.popularRegions.regions.includes(regionName)) {
            this.popularRegions.regions.push(regionName);
            this.initializeDropdown();
        }
    },

    removePopularRegion(regionName) {
        const index = this.popularRegions.regions.indexOf(regionName);
        if (index > -1) {
            this.popularRegions.regions.splice(index, 1);
            this.initializeDropdown();
        }
    },

    togglePopularSection(enabled) {
        this.popularRegions.enabled = enabled;
        this.initializeDropdown();
    },

    getPopularRegions() {
        return { ...this.popularRegions };
    },

    // 🚀 Region selection
    setRegion(regionName) {
        if (regionName === 'all') {
            appState.selectedRegionName = 'all';
            appState.selectedRegionID = APP_CONFIG.DEFAULT_REGION_ID;
            localStorage.setItem('selectedRegion', 'all');
        } else {
            const regionData = appState.regionMap?.[regionName];
            appState.selectedRegionName = regionName;
            appState.selectedRegionID = regionData?.regionID || APP_CONFIG.DEFAULT_REGION_ID;
            localStorage.setItem('selectedRegion', appState.selectedRegionID);
        }

        emitChange();
    },

    // 🧭 Enhanced dropdown initializer with popular regions
    async initializeDropdown() {
        // Load popular regions from locations.json first
        if (this.popularRegions.regions.length === 0) {
            await this.loadLocationsAndSetPopular();
        }

        const regionNames = Object.keys(regionSelector.getRegionList()).sort();

        // Clear existing options
        elements.regionSelector.innerHTML = '';

        // Add "All Regions" option
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = 'All Regions';
        elements.regionSelector.appendChild(allOption);

        // Add popular regions section if enabled
        if (this.popularRegions.enabled && this.popularRegions.regions.length > 0) {
            // Add section header (disabled option for visual separation)
            const headerOption = document.createElement('option');
            headerOption.disabled = true;
            headerOption.textContent = `── ${this.popularRegions.title} ──`;
            headerOption.style.fontStyle = 'italic';
            headerOption.style.color = '#666';
            elements.regionSelector.appendChild(headerOption);

            // Add popular regions
            this.popularRegions.regions.forEach(regionName => {
                // Only add if region exists in the region list
                if (regionNames.includes(regionName)) {
                    const option = document.createElement('option');
                    option.value = regionName;
                    option.textContent = `⭐ ${regionName}`;
                    elements.regionSelector.appendChild(option);
                }
            });

            // Add separator
            const separatorOption = document.createElement('option');
            separatorOption.disabled = true;
            separatorOption.textContent = '────────────────';
            separatorOption.style.color = '#ccc';
            elements.regionSelector.appendChild(separatorOption);
        }

        // Add all regions in alphabetical order
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
                    regionSelector.setRegion(storedRegionName);
                }
            }
        }

        // 🖱️ Change listener
        elements.regionSelector.removeEventListener('change', this._changeHandler);
        this._changeHandler = () => {
            const selected = elements.regionSelector.value;
            regionSelector.setRegion(selected);
        };
        elements.regionSelector.addEventListener('change', this._changeHandler);

    }
};

// 🔊 Notify subscribers
function emitChange() {
    const summary = regionSelector.getRegionSummary();
    listeners.forEach(cb => cb(summary));
}