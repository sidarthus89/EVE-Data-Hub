// 📦 marketOrdersLogic.js
// Fetches and organizes EVE market orders by region/type. Acts as a higher-level interface over esiAPI.js.

import { appState, APP_CONFIG } from '../marketCore/marketConfig.js';
import { fetchRegionOrders, fetchAllRegionOrders } from '../../../globals/js/esiAPI.js';

/**
 * Resolve region ID from name string or fallback to default.
 * @param {string} regionName
 * @returns {number}
 */
export function resolveRegionID(regionName) {
    return (
        appState.regionMap?.[regionName]?.regionID ||
        APP_CONFIG.DEFAULT_REGION_ID
    );
}

/**
 * Fetch buy/sell orders by item and region.
 * Accepts region name (string) or regionID (number).
 * Returns sorted and timestamped result.
 *
 * @param {number} typeID - Item type ID
 * @param {string|number} regionRef - Region name or ID
 * @returns {Promise<{buyOrders, sellOrders, typeID, regionID, fetchTimestamp}>}
 */
export async function fetchMarketOrders(typeID, regionRef = 'all') {
    const regionID = typeof regionRef === 'string'
        ? (regionRef === 'all'
            ? APP_CONFIG.DEFAULT_REGION_ID
            : resolveRegionID(regionRef))
        : regionRef;

    if (!typeID || !regionID) {
        console.warn(`[❌ marketOrders] Invalid type or region`, { typeID, regionRef });
        return { buyOrders: [], sellOrders: [], regionID: null, fetchTimestamp: null };
    }

    const rawOrders = regionRef === 'all'
        ? await fetchAllRegionOrders(typeID)
        : await fetchRegionOrders(typeID, regionID);

    const fetchTimestamp = new Date().toISOString();

    return {
        typeID,
        regionID,
        buyOrders: rawOrders.filter(o => o.is_buy_order),
        sellOrders: rawOrders.filter(o => !o.is_buy_order),
        fetchTimestamp
    };
}

