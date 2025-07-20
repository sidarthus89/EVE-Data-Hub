// 🎯 itemViewer.js
// Handles rendering of item header UI, breadcrumb trail, and selection persistence

import { APP_CONFIG, appState, elements } from './marketConfig.js';
import { getIconPath } from './marketUtilities.js';
import { expandMarketPath } from './marketTree.js';


// 🎨 Internal: Render Header UI for Given Type
function updateItemHeader(typeID) {
    const item = appState.flatItemList.find(i => i.type_id === typeID);
    if (!item) return;

    const container = elements.viewerContainer;
    if (container) {
        container.innerHTML = '';
        const icon = document.createElement('img');
        icon.src = `/market/icons/types/${item.type_id}.png`;
        icon.alt = item.name;
        icon.className = 'viewer-icon';
        container.appendChild(icon);
    }

    const itemNameEl = document.getElementById('itemName');
    const itemIconEl = document.getElementById('itemIcon');
    const itemBreadcrumbEl = document.getElementById('itemBreadcrumb');

    if (itemNameEl) itemNameEl.textContent = item.name;
    if (itemIconEl) itemIconEl.src = getIconPath(typeID);

    if (itemBreadcrumbEl) {
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
}

// 🧭 Build Breadcrumb Trail from Market Tree
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

// 🖱️ Selection Entry Point from External Modules
export function updateItemDetails(itemData) {
    const typeID = itemData?.type_id;
    if (!typeID) return;
    updateItemHeader(typeID);
}

// 🎛️ UI Selection Entry Point from Menu Clicks, etc.
export function selectItem(typeID) {
    updateItemHeader(typeID);
    localStorage.setItem('selectedTypeID', typeID);
    appState.selectedTypeID = typeID;

    const item = appState.flatItemList.find(i => i.type_id === typeID);
    if (elements.searchBox) elements.searchBox.value = item?.name || '';

    const viewerHeader = document.getElementById("itemViewerHeader");
    if (viewerHeader?.classList.contains("hidden")) {
        viewerHeader.classList.remove("hidden");
    }

    if (appState.activeView === 'market') {
        elements.marketTables?.classList.add('.hidden');
        elements.historyChart?.classList.remove('.hidden');
    } else if (appState.activeView === 'history') {
        elements.marketTables?.classList.remove('.hidden');
        elements.historyChart?.classList.add('.hidden');
    }
}
