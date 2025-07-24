//marketTreeLogic.js

import { appState, elements } from '../marketCore/marketConfig.js';
import { handleItemSelection } from '../marketLogic/itemDispatcher.js';
import { addToQuickbar } from '../marketLogic/marketSidebarLogic.js';
import { renderGroup } from '../marketUI/marketTreeUI.js';
import { buildFlatItemList } from '../marketLogic/marketSearchLogic.js';


export function findGroupObjectByLabel(label, node = appState.market) {
    for (const [key, value] of Object.entries(node)) {
        if (key === '_info') continue;
        if (key === label && typeof value === 'object') return value;

        if (typeof value === 'object') {
            const result = findGroupObjectByLabel(label, value);
            if (result) return result;
        }
    }
    return null;
}

export function getGroupIcon(groupID, groupNode) {
    let iconFile = groupNode?._info?.iconFile;
    if (!iconFile) {
        function findIn(node) {
            for (const [key, val] of Object.entries(node)) {
                if (key === '_info' && val.marketGroupID == groupID) {
                    return val.iconFile;
                }
                if (typeof val === 'object') {
                    const nested = findIn(val);
                    if (nested) return nested;
                }
            }
        }
        iconFile = findIn(appState.marke);
    }

    return iconFile
        ? `/market/icons/base/${iconFile}`
        : '/market/icons/base/default.png';
}

// 🌲 Initialize Menu from Market Data
export function initializeMarketMenu() {
    const menuData = appState.market;

    if (!menuData || typeof menuData !== 'object') {
        console.warn("📛 appState.market is missing or invalid:", menuData);
        return;
    }

    elements.menuList.innerHTML = '';
    buildFlatItemList(menuData);

    Object.entries(menuData).forEach(([groupName, groupContent]) => {
        if (groupName !== '_info' && typeof groupContent === 'object') {
            renderGroup(groupName, groupContent, elements.menuList);
        }
    });
}



