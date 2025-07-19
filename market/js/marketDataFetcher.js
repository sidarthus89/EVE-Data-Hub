// 📦 marketDataFetcher.js
// Loads static JSON + ESI market order data

import { APP_CONFIG, appState } from './marketConfig.js';

// 🔄 Static Data Loaders
export async function fetchAndSet(filename, targetKey) {
    const response = await fetch(`${APP_CONFIG.DATA_PATH}${filename}`);
    if (!response.ok) throw new Error(`Failed to fetch ${filename}`);
    appState[targetKey] = await response.json();
}

export const loadLocations = () => fetchAndSet(APP_CONFIG.LOCATIONS_FILE, 'locations');
export const loadStations = () => fetchAndSet(APP_CONFIG.STATIONS_FILE, 'stations');
export const loadMarketMenu = () => fetchAndSet(APP_CONFIG.MARKET_MENU_FILE, 'marketMenu');

// 📊 ESI: Region Orders (Paginated)
export async function fetchRegionOrders(typeID, regionID) {
    let allOrders = [];
    let page = 1;

    while (true) {
        const url = `${APP_CONFIG.ESI_BASE_URL}${regionID}/orders/?type_id=${typeID}&page=${page}`;
        const response = await fetch(url);
        if (!response.ok) break;

        const data = await response.json();
        allOrders.push(...data);

        const totalPages = parseInt(response.headers.get('X-Pages') || '1', 10);
        if (page >= totalPages) break;
        page++;
    }

    return allOrders;
}

// 🌐 ESI: Aggregate Orders Across All Regions
export async function fetchAllRegionOrders(typeID) {
    const regionList = Object.values(appState.locations);
    const results = await Promise.all(
        regionList.map(region => fetchRegionOrders(typeID, region.regionID))
    );
    return results.flat();
}
