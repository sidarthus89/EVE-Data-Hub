export const APP_CONFIG = {
    DATA_PATH: "./assets/data/",
    LOCATIONS_FILE: "locations.json",
    STATIONS_FILE: "stations.json",
    MARKET_MENU_FILE: "marketMenu.json",
    FALLBACK_ICON: "./assets/icons/default.png",
    ICON_BASE_URL: "./assets/icons/type/",
    ESI_BASE_URL: "https://esi.evetech.net/latest/markets/",
    DEFAULT_REGION_ID: 10000002, // The Forge
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
    selectedStationID: null
};

export const elements = {};