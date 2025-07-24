// 📦 marketHistoryLogic.js
// Enhanced version - Retrieves historical pricing via the esiAPI

import { APP_CONFIG, appState } from '../marketCore/marketConfig.js';
import { getChartCanvas } from '../marketUI/marketHistoryUI.js';
import { fetchItemPriceHistory } from '../../../globals/js/esiAPI.js';

export function setHistoryViewActive(isActive) {
    const historyPanel = document.getElementById('itemHistorySection');
    const marketPanel = document.getElementById('itemPriceTables');

    if (isActive) {
        marketPanel?.classList.add("hidden");
        historyPanel?.classList.remove("hidden");
    } else {
        historyPanel?.classList.add("hidden");
        marketPanel?.classList.remove("hidden");
    }

    document.getElementById('viewMarketLink')?.classList.toggle('active', !isActive);
    document.getElementById('viewHistoryLink')?.classList.toggle('active', isActive);

    const canvas = getChartCanvas();
    if (canvas) {
        const rect = canvas.getBoundingClientRect();
        console.log('📊 Chart canvas dimensions:', rect.width, 'x', rect.height);
    } else {
        console.warn('[⚠️ Chart] No canvas element found');
    }
}

export async function fetchMarketHistory(typeID, selectedRegion) {
    const regionID =
        selectedRegion === 'all'
            ? APP_CONFIG.DEFAULT_REGION_ID
            : Number(selectedRegion) || APP_CONFIG.DEFAULT_REGION_ID;

    if (!typeID || !regionID) {
        console.warn('⚠️ Missing typeID or regionID for history fetch');
        return [];
    }

    const cacheKey = `${typeID}_${regionID}`;

    // Check if we already have this data cached
    if (appState.marketHistory?.[typeID] && appState.historyCache?.[cacheKey]) {
        const cacheAge = Date.now() - appState.historyCache[cacheKey].timestamp;
        const MAX_CACHE_AGE = 5 * 60 * 1000; // 5 minutes

        if (cacheAge < MAX_CACHE_AGE) {
            console.log('📊 Using cached history data for', typeID);
            return appState.marketHistory[typeID];
        }
    }

    try {
        console.log('🔄 Fetching market history from ESI...', { typeID, regionID });

        // Use your existing ESI API function
        const rawHistory = await fetchItemPriceHistory(typeID, regionID);

        if (!rawHistory || rawHistory.length === 0) {
            console.warn('⚠️ No history data received from ESI');
            appState.marketHistory ??= {};
            appState.marketHistory[typeID] = [];
            return [];
        }

        // Process and sort the ESI data
        const processedHistory = processESIHistoryData(rawHistory);

        // Cache the processed data (keep your existing structure)
        appState.marketHistory ??= {};
        if (!appState.historyCache) appState.historyCache = {};

        appState.marketHistory[typeID] = processedHistory.slice(-365); // Keep your 365-day limit
        appState.historyCache[cacheKey] = {
            timestamp: Date.now(),
            regionID,
            recordCount: processedHistory.length
        };

        console.log(`✅ Cached ${processedHistory.length} history records for typeID ${typeID}`);
        return appState.marketHistory[typeID];

    } catch (error) {
        console.error(`❌ History fetch failed for ${typeID}:`, error);

        // Maintain your existing error handling
        appState.marketHistory ??= {};
        appState.marketHistory[typeID] = [];

        return [];
    }
}

/**
 * Processes raw ESI history data into chart-friendly format
 * @param {Array} rawData - Raw ESI history response
 * @returns {Array} Processed history data
 */
function processESIHistoryData(rawData) {
    if (!Array.isArray(rawData)) {
        console.warn('⚠️ Invalid ESI history data format');
        return [];
    }

    return rawData
        .map(entry => {
            // ESI returns data in this format:
            // {
            //   "date": "2024-07-24",
            //   "average": 6234567.89,
            //   "highest": 6800000,
            //   "lowest": 5900000,
            //   "order_count": 45,
            //   "volume": 15000
            // }

            if (!entry.date || entry.average === undefined) {
                console.warn('⚠️ Skipping invalid history entry:', entry);
                return null;
            }

            return {
                date: entry.date,
                average: parseFloat(entry.average) || 0,
                high: parseFloat(entry.highest) || parseFloat(entry.average) || 0,
                low: parseFloat(entry.lowest) || parseFloat(entry.average) || 0,
                volume: parseInt(entry.volume) || 0,
                order_count: parseInt(entry.order_count) || 0,
                // Add some computed fields for analysis
                spread: (parseFloat(entry.highest) || 0) - (parseFloat(entry.lowest) || 0),
                timestamp: new Date(entry.date).getTime()
            };
        })
        .filter(entry => entry !== null)
        .sort((a, b) => a.timestamp - b.timestamp); // Sort chronologically
}

/**
 * Gets cached history data without making API calls
 * @param {number} typeID - The item type ID
 * @returns {Array|null} Cached history data or null
 */
export function getCachedHistory(typeID) {
    return appState.marketHistory?.[typeID] || null;
}

/**
 * Gets history statistics for the current data range
 * @param {number} typeID - The item type ID
 * @param {number} startIndex - Start index for analysis
 * @param {number} endIndex - End index for analysis
 * @returns {Object} Statistics object
 */
export function getHistoryStats(typeID, startIndex = 0, endIndex = -1) {
    const history = getCachedHistory(typeID);
    if (!history || history.length === 0) return null;

    const dataSlice = endIndex === -1
        ? history.slice(startIndex)
        : history.slice(startIndex, endIndex);

    if (dataSlice.length === 0) return null;

    const prices = dataSlice.map(h => h.average);
    const volumes = dataSlice.map(h => h.volume);
    const highs = dataSlice.map(h => h.high);
    const lows = dataSlice.map(h => h.low);

    return {
        period: dataSlice.length,
        priceStats: {
            current: prices[prices.length - 1],
            min: Math.min(...prices),
            max: Math.max(...prices),
            average: prices.reduce((a, b) => a + b, 0) / prices.length,
            change: prices.length > 1 ? prices[prices.length - 1] - prices[0] : 0,
            changePercent: prices.length > 1
                ? ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100
                : 0
        },
        volumeStats: {
            current: volumes[volumes.length - 1],
            min: Math.min(...volumes),
            max: Math.max(...volumes),
            average: volumes.reduce((a, b) => a + b, 0) / volumes.length,
            total: volumes.reduce((a, b) => a + b, 0)
        },
        rangeStats: {
            maxHigh: Math.max(...highs),
            minLow: Math.min(...lows),
            averageSpread: dataSlice.reduce((sum, h) => sum + h.spread, 0) / dataSlice.length
        },
        dateRange: {
            start: dataSlice[0].date,
            end: dataSlice[dataSlice.length - 1].date
        }
    };
}

/**
 * Clears cached history data
 * @param {number} typeID - Optional specific typeID to clear, or all if not provided
 */
export function clearHistoryCache(typeID = null) {
    if (typeID) {
        delete appState.marketHistory?.[typeID];
        // Clear related cache entries
        if (appState.historyCache) {
            Object.keys(appState.historyCache).forEach(key => {
                if (key.startsWith(`${typeID}_`)) {
                    delete appState.historyCache[key];
                }
            });
        }
        console.log(`🗑️ Cleared history cache for typeID ${typeID}`);
    } else {
        appState.marketHistory = {};
        appState.historyCache = {};
        console.log('🗑️ Cleared all history cache');
    }
}

/**
 * Preloads history data for multiple items
 * @param {Array} typeIDs - Array of type IDs to preload
 * @param {number} regionID - Region ID
 * @returns {Promise<Object>} Results object with success/failure counts
 */
export async function preloadHistoryData(typeIDs, regionID) {
    if (!Array.isArray(typeIDs) || typeIDs.length === 0) {
        console.warn('⚠️ No typeIDs provided for preload');
        return { success: 0, failed: 0 };
    }

    console.log(`🔄 Preloading history for ${typeIDs.length} items...`);

    const results = await Promise.allSettled(
        typeIDs.map(typeID => fetchMarketHistory(typeID, regionID))
    );

    const success = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`✅ Preload complete: ${success} success, ${failed} failed`);

    return { success, failed, total: typeIDs.length };
}

/**
 * Gets cache status information
 * @returns {Object} Cache status
 */
export function getHistoryCacheStatus() {
    const historyCount = Object.keys(appState.marketHistory || {}).length;
    const cacheCount = Object.keys(appState.historyCache || {}).length;

    let totalRecords = 0;
    let oldestCache = Date.now();
    let newestCache = 0;

    if (appState.marketHistory) {
        Object.values(appState.marketHistory).forEach(history => {
            if (Array.isArray(history)) {
                totalRecords += history.length;
            }
        });
    }

    if (appState.historyCache) {
        Object.values(appState.historyCache).forEach(cache => {
            if (cache.timestamp) {
                oldestCache = Math.min(oldestCache, cache.timestamp);
                newestCache = Math.max(newestCache, cache.timestamp);
            }
        });
    }

    return {
        cachedItems: historyCount,
        cacheEntries: cacheCount,
        totalRecords,
        oldestCacheAge: oldestCache < Date.now() ? Date.now() - oldestCache : 0,
        newestCacheAge: newestCache > 0 ? Date.now() - newestCache : 0,
        memoryUsageEstimate: `~${Math.round((totalRecords * 150) / 1024)}KB` // Rough estimate
    };
}