// 🛠 marketFormatting.js
// Provides formatting helpers, UI builders, menu generators, and DOM caching for market module

import { APP_CONFIG, appState, } from '../marketCore/marketConfig.js';

// 💱 Formatters
export function formatExpires(days) {
    return `${days} ${days === 1 ? 'day' : 'days'}`;
}

// 🎨 Icon Path Generators
export function getIconPath(iconFile) {
    return iconFile
        ? `/${APP_CONFIG.ICON_BASE_URL}${iconFile}`
        : APP_CONFIG.FALLBACK_ICON;
}

export function getGroupIcon(groupObject) {
    const iconFile = groupObject?._info?.iconFile;
    return iconFile
        ? `/${APP_CONFIG.GROUP_ICON_PATH}${iconFile}`
        : APP_CONFIG.FALLBACK_ICON;
}

export function formatISK(value) {
    const safeValue = (typeof value === 'number' && !isNaN(value)) ? value : 0;
    return safeValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + ' ISK';
}
