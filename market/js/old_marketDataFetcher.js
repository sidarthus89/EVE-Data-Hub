// 📦 marketDataFetcher.js
// Loads static JSON + ESI market order data

import { APP_CONFIG, appState } from './marketConfig.js';
import { buildLocationMaps } from './marketUtilities.js';

// 🔄 Generic Loader
export async function fetchAndSet(filename, targetKey, hydrateFn = null) {
    const response = await fetch(`${APP_CONFIG.DATA_PATH}${filename}`);
    if (!response.ok) throw new Error(`❌ Failed to fetch ${filename}`);
    const data = await response.json();
    appState[targetKey] = data;
    if (hydrateFn) hydrateFn(data); // optional hydration step
}

// 📍 Load Unified Location Tree
export const loadLocations = () =>
    fetchAndSet(APP_CONFIG.LOCATIONS_FILE, 'locations', buildLocationMaps);

// 📦 Load Market Categories + Items
export const loadMarket = () =>
    fetchAndSet(APP_CONFIG.MARKET_FILE, 'market');

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
    const regionList = Object.values(appState.regionMap || {});
    const results = await Promise.all(
        regionList.map(region => fetchRegionOrders(typeID, region.regionID))
    );
    return results.flat();
}
