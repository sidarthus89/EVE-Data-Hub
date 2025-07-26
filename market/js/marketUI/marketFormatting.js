// 🛠 marketFormatting.js
// Provides formatting helpers, UI builders, menu generators, and DOM caching for market module

import { APP_CONFIG } from '../marketCore/marketConfig.js'

// 💱 Formatters
export function formatExpires(days) {
    return `${days} ${days === 1 ? 'day' : 'days'}`;
}

// 🎨 Icon Path Generators
export function getEvetechIconURL(typeID, size = 64) {
    return `https://images.evetech.net/types/${typeID}/icon?size=${size}`;
}

/**
 * Returns local file path to a group icon given its marketGroupID
 * @param {number|string} groupID
 * @param {object} groupObject
 * @returns {string}
 */
export function getGroupIcon(groupID, groupObject) {
    const iconFile = groupObject?._info?.iconFile;

    if (iconFile && typeof iconFile === 'string') {
        return `${APP_CONFIG.DATA_PATH}market/assets/groupIcons/${iconFile}`;
    }

    return APP_CONFIG.FALLBACK_ICON;
}


export function formatISK(value) {
    const safeValue = (typeof value === 'number' && !isNaN(value)) ? value : 0;
    return safeValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + ' ISK';
}
