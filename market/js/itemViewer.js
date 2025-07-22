// 📦 itemViewer.js
// Renders item viewer: name, icon, breadcrumb, visibility

import { appState, elements, APP_CONFIG } from './marketConfig.js';
import { getIconPath } from './marketUtilities.js';
import { expandMarketPath } from './marketTree.js';

export function renderItemViewer(itemData, regionID) {
    const typeID = itemData?.type_id;
    if (!typeID || typeof typeID !== 'number') return;

    appState.selectedTypeID = typeID;
    appState.selectedRegionID = regionID;
    window.appState.selectedTypeID = typeID;
    localStorage.setItem('selectedTypeID', typeID);

    if (elements.searchBox) {
        elements.searchBox.value = itemData.name || '';
    }

    const iconFile = itemData.iconFile || '';
    const iconPath = getIconPath(iconFile);

    if (elements.itemName) elements.itemName.textContent = itemData.name;

    if (elements.itemIcon) {
        elements.itemIcon.src = iconPath;
        elements.itemIcon.alt = itemData.name;
        elements.itemIcon.onerror = () => {
            elements.itemIcon.src = APP_CONFIG.FALLBACK_ICON;
        };
    }

    document.getElementById("itemViewerHeader")?.classList.remove("hidden");
    document.getElementById("itemViewerSection")?.classList.remove("hidden");

    renderBreadcrumbTrail(typeID);
}

function renderBreadcrumbTrail(typeID) {
    const itemBreadcrumbEl = document.getElementById('itemBreadcrumb');
    if (!itemBreadcrumbEl) return;

    const segments = findItemBreadcrumb(typeID);
    itemBreadcrumbEl.innerHTML = '';

    segments.forEach((segment, index) => {
        const crumbLink = document.createElement('a');
        crumbLink.textContent = segment;
        crumbLink.href = '#';
        crumbLink.className = 'breadcrumb-link';
        crumbLink.addEventListener('click', e => {
            e.preventDefault();
            expandMarketPath(segments.slice(0, index + 1));
        });

        itemBreadcrumbEl.appendChild(crumbLink);

        if (index < segments.length - 1) {
            const separatorSpan = document.createElement('span');
            separatorSpan.textContent = ' / ';
            itemBreadcrumbEl.appendChild(separatorSpan);
        }
    });
}

export function findItemBreadcrumb(typeID) {
    const path = [];

    function walk(node, trail = []) {
        for (const [key, value] of Object.entries(node)) {
            if (key === '_info') continue;

            if (Array.isArray(value)) {
                const matchedItem = value.find(item => Number(item.typeID) === Number(typeID));
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

    walk(appState.market);
    return path.length ? path : ['Unknown Category'];
}
