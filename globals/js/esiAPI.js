// 🌍 esiAPI.js
// Global ESI data fetcher for market, universe, price history, etc.

import { APP_CONFIG, appState } from '../../market/js/marketCore/marketConfig.js';

// ✅ Safe endpoint builder to avoid premature access
const ESI_ENDPOINTS = getESIEndpoints();

export function getESIEndpoints() {
    const base = APP_CONFIG.ESI_BASE_URL;
    return {
        base,
        groups: `${base}groups/`,
        orders: (regionID, typeID, page = 1) =>
            `${base}${regionID}/orders/?type_id=${typeID}&page=${page}`,
        history: (regionID, typeID) =>
            `${base}${regionID}/history/?type_id=${typeID}`
    };
}

// 📁 Market Groups
export async function fetchMarketGroups() {
    const url = ESI_ENDPOINTS.groups;
    const response = await fetch(url);
    if (!response.ok) {
        console.warn(`[❌ API] Market groups failed: ${response.status} ${response.statusText}`);
        return [];
    }
    return await response.json();
}

// 📈 Item History
export async function fetchItemPriceHistory(typeID, regionID) {
    if (!typeID || !regionID) {
        console.warn(`[⚠️ API] Missing typeID or regionID`, { typeID, regionID });
        return [];
    }
    const url = ESI_ENDPOINTS.history(regionID, typeID);
    const response = await fetch(url);
    if (!response.ok) {
        console.warn(`[❌ API] History fetch failed: ${response.status} ${response.statusText}`);
        return [];
    }
    return await response.json();
}

// 🧭 Region Orders (Paginated)
export async function fetchRegionOrders(typeID, regionID) {
    if (!typeID || !regionID) {
        console.warn(`[⚠️ API] Missing typeID or regionID`, { typeID, regionID });
        return [];
    }

    let allOrders = [];
    let page = 1;

    while (true) {
        const url = ESI_ENDPOINTS.orders(regionID, typeID, page);
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

// 🌍 All-Region Orders
export async function fetchAllRegionOrders(typeID) {
    const regionList = Object.values(appState.regionMap || {});
    if (!typeID || regionList.length === 0) {
        console.warn(`[⚠️ API] Missing typeID or regionMap`);
        return [];
    }

    const fetchPromises = regionList.map(region => fetchRegionOrders(typeID, region.regionID));
    const results = await Promise.all(fetchPromises);
    return results.flat();
}

// 🧃 High-level Market Order Getter
export async function fetchMarketOrders(typeID, regionRef = 'all') {
    const regionID = typeof regionRef === 'string'
        ? (regionRef === 'all'
            ? APP_CONFIG.DEFAULT_REGION_ID
            : appState.regionMap?.[regionRef]?.regionID ?? APP_CONFIG.DEFAULT_REGION_ID)
        : regionRef;

    if (!typeID || !regionID) {
        throw new Error('Invalid typeID or region');
    }

    const orders = regionRef === 'all'
        ? await fetchAllRegionOrders(typeID)
        : await fetchRegionOrders(typeID, regionID);

    return {
        buyOrders: orders.filter(o => o.is_buy_order),
        sellOrders: orders.filter(o => !o.is_buy_order)
    };
}
