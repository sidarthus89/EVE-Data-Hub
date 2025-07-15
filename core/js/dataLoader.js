import { appState, APP_CONFIG } from "./marketConfig.js"


async function fetchAndSet(filename, targetKey) {
    const response = await fetch(`${APP_CONFIG.DATA_PATH}${filename}`);
    if (!response.ok) throw new Error(`Failed to fetch ${filename}`);
    appState[targetKey] = await response.json();
}

export const loadLocations = () => fetchAndSet(APP_CONFIG.LOCATIONS_FILE, "locations");
export const loadStations = () => fetchAndSet(APP_CONFIG.STATIONS_FILE, "stations");
export const loadMarketMenu = () => fetchAndSet(APP_CONFIG.MARKET_MENU_FILE, "marketMenu");