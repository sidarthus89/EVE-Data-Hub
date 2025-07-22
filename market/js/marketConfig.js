// 📦 marketConfig.js
// Provides constants, shared state, and DOM references for the market module

export const APP_CONFIG = {
    DATA_PATH: "/",
    MARKET_FILE: "market/data/market.json",
    LOCATIONS_FILE: "globals/data/locations.json",
    FALLBACK_ICON: "globals/assets/icons/favicon.png",
    ICON_BASE_URL: "market/icons/types/",
    ESI_BASE_URL: "https://esi.evetech.net/latest/markets/",
    DEFAULT_REGION_ID: 10000002,
    SEARCH_MIN_LENGTH: 3
};

export const appState = {
    regions: {},
    stations: {},
    market: {},
    flatItemList: [],
    currentSortState: {},

    // 🔄 Selection Context
    selectedTypeID: null,
    selectedStationID: null,
    quickbarItems: [],

    // 🌐 Location Details (now managed via RegionSelector)
    selectedRegionName: null,
    selectedRegionID: null,
    selectedConstellationName: null,
    selectedConstellationID: null,
    selectedSystemName: null,
    selectedSystemID: null
};

export const elements = {
    // Populated via cacheElements() in marketUtilities.js
};
