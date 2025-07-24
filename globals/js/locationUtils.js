// 📍 locationUtils.js
// Handles location map construction for regions and stations in EVE Online.

import { APP_CONFIG, appState } from '../../market/js/marketCore/marketConfig.js';

/**
 * Flatten nested location tree into region and station lookup maps.
 * Preserves system data under each station.
 * @param {Object} locationsData
 */
export function buildLocationMaps(locationsData) {
    appState.regionMap = {};   // Maps regionID → region object with name
    appState.stationMap = {};  // Maps stationID → station object including system + region info

    Object.entries(locationsData).forEach(([regionName, regionObj]) => {
        const regionID = regionObj.regionID;
        appState.regionMap[regionID] = { regionName, regionID };

        Object.entries(regionObj).forEach(([systemName, systemObj]) => {
            if (systemName === 'regionID') return;

            Object.entries(systemObj.stations || {}).forEach(([stationID, stationObj]) => {
                appState.stationMap[stationID] = {
                    ...stationObj,
                    regionID,
                    regionName,
                    systemName
                };
            });
        });
    });
}

/**
 * Get station name by ID
 * @param {number|string} stationID
 * @returns {string}
 */
export function getStationName(stationID) {
    return appState.stationMap?.[stationID]?.stationName || "Unknown Station";
}

/**
 * Resolve regionID from region name
 * @param {string} regionName
 * @returns {number}
 */
export function resolveRegionID(regionName) {
    return Object.values(appState.regionMap).find(r => r.regionName === regionName)?.regionID
        || APP_CONFIG.DEFAULT_REGION_ID;
}

/**
 * Get region name from ID
 * @param {number} regionID
 * @returns {string}
 */
export function getRegionName(regionID) {
    return appState.regionMap?.[regionID]?.regionName || "Unknown Region";
}
