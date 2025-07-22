// 📦 marketLoader.js
// Centralized data loader for market app: JSON, location maps, ESI orders

import { APP_CONFIG, appState } from './marketConfig.js';


// ✅ Static JSON loader with optional hydrator
export async function fetchAndSet(filename, targetKey, hydrateFn = null) {
    const response = await fetch(`${APP_CONFIG.DATA_PATH}${filename}`);
    if (!response.ok) throw new Error(`❌ Failed to fetch ${filename}: ${response.statusText}`);

    const data = await response.json(); // ✅ Declare 'data' before using it

    appState[targetKey] = data;
    if (hydrateFn) hydrateFn(data);
}

// 📍 Load unified location tree + flatten maps
export const loadLocations = () =>
    fetchAndSet(APP_CONFIG.LOCATIONS_FILE, 'locations', buildLocationMaps);

// 🛒 Load market categories and items
export const loadMarket = () =>
    fetchAndSet(APP_CONFIG.MARKET_FILE, 'market');

// 🧠 Build flat lookup maps from nested location structure
export function buildLocationMaps(locationsData) {
    appState.stationMap = {};
    appState.regionMap = {};

    for (const [regionName, regionObj] of Object.entries(locationsData)) {
        const regionID = regionObj.regionID;
        appState.regionMap[regionName] = { regionID, regionName };

        for (const [constellationName, constellationObj] of Object.entries(regionObj)) {
            if (constellationName === 'regionID') continue;

            for (const [systemName, systemObj] of Object.entries(constellationObj)) {
                if (systemName === 'constellationID') continue;

                for (const [stationID, stationObj] of Object.entries(systemObj.stations || {})) {
                    appState.stationMap[stationID] = stationObj;
                }
            }
        }
    }
}

// 🧭 Fetch orders for one region
async function fetchRegionOrders(typeID, regionID) {
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

// 🌐 Fetch orders from all regions
export async function fetchAllRegionOrders(typeID) {
    const regionList = Object.values(appState.regionMap || {});
    const results = await Promise.all(
        regionList.map(region => fetchRegionOrders(typeID, region.regionID))
    );
    return results.flat();
}


// 🔍 Combined market order getter
export async function getMarketOrders(typeID, regionName = 'all') {
    const regionID = regionName === 'all'
        ? APP_CONFIG.DEFAULT_REGION_ID
        : appState.regionMap?.[regionName]?.regionID ?? APP_CONFIG.DEFAULT_REGION_ID;

    if (!regionID) throw new Error('Invalid region');

    const orders = regionName === 'all'
        ? await fetchAllRegionOrders(typeID)
        : await fetchRegionOrders(typeID, regionID);

    return {
        buy: orders.filter(o => o.is_buy_order),
        sell: orders.filter(o => !o.is_buy_order)
    };
}
