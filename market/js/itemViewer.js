// 🎯 itemViewer.js
// Handles rendering of item header UI, breadcrumb trail, and selection persistence

import { APP_CONFIG, appState, elements } from './marketConfig.js';
import { getIconPath } from './marketUtilities.js';

// 🎨 Render Item Header UI
export function updateItemHeader(typeID) {
    const item = appState.flatItemList.find(i => i.type_id === typeID);
    if (!item) return;

    const itemNameEl = document.getElementById('itemName');
    const itemIconEl = document.getElementById('itemIcon');
    const itemBreadcrumbEl = document.getElementById('itemBreadcrumb');

    if (itemNameEl) itemNameEl.textContent = item.name;
    if (itemIconEl) itemIconEl.src = getIconPath(typeID);

    if (itemBreadcrumbEl) {
        const segments = findItemBreadcrumb(typeID);
        itemBreadcrumbEl.innerHTML = '';

        segments.forEach((segment, index) => {
            const crumbSpan = document.createElement('span');
            crumbSpan.textContent = segment;
            itemBreadcrumbEl.appendChild(crumbSpan);

            if (index < segments.length - 1) {
                const separatorSpan = document.createElement('span');
                separatorSpan.textContent = ' / ';
                itemBreadcrumbEl.appendChild(separatorSpan);
            }
        });
    }
}

// 🧭 Category Trail Lookup
export function findItemBreadcrumb(typeID) {
    const path = [];

    function walk(node, trail = []) {
        for (const [key, value] of Object.entries(node)) {
            if (key === '_info') continue;

            if (Array.isArray(value)) {
                const matchedItem = value.find(item => item.typeID == typeID);
                if (matchedItem) {
                    const cleanTrail = trail.filter(t => t !== 'items');
                    if (key !== 'items') cleanTrail.push(key);
                    path.push(...cleanTrail);
                    return true;
                }
            } else if (typeof value === 'object' && value !== null) {
                if (walk(value, [...trail, key])) return true;
            }
        }
        return false;
    }

    walk(appState.marketMenu);
    return path.length ? path : ['Unknown Category'];
}

// 🖱️ UI Selection Logic
export function selectItem(typeID) {
    updateItemHeader(typeID);
    localStorage.setItem('selectedTypeID', typeID);

    const item = appState.flatItemList.find(i => i.type_id === typeID);
    if (elements.searchBox) elements.searchBox.value = item?.name || '';
}