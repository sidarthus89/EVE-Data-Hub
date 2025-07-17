// marketConfig.js
// Provides constants, shared app state, and DOM references for the market module

export const APP_CONFIG = {
    DATA_PATH: "./market/data/",
    LOCATIONS_FILE: "locations.json",
    STATIONS_FILE: "stations.json",
    MARKET_MENU_FILE: "marketMenu.json",
    FALLBACK_ICON: "globals/assets/icons/searchmarket.png",
    ICON_BASE_URL: "market/icons/type/",
    ESI_BASE_URL: "https://esi.evetech.net/latest/markets/",
    DEFAULT_REGION_ID: 10000002,
    SEARCH_MIN_LENGTH: 3
};

export const appState = {
    locations: {},
    stations: {},
    marketMenu: {},
    flatItemList: [],
    currentSortState: {},
    selectedRegionID: null,
    selectedSystemID: null,
    selectedStationID: null,
    selectedTypeID: null,
    quickbarItems: []
};

export const elements = {
    // Populated via cacheElements() in marketUtilities.js
};